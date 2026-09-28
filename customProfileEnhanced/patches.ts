/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findByPropsLazy } from "@webpack";
import { GuildMemberStore, IconUtils, SnowflakeUtils, UserProfileStore, UserStore } from "@webpack/common";

import {
    BADGES,
    BOOST_ICONS,
    formatBoostBadgeDesc,
    formatFakeConnections,
    formatNitroBadgeDesc,
    getBadgeId,
    getDecorationUrl,
    getGiftingBadgeDesc,
    getLevelBadgeDesc,
    getLocalizedBadgeLabel,
    getStandardBadgeDesc,
    NITRO_LEVELS
} from "./constants";
import {
    _dataVersion,
    getCustomDataForUser,
    isEnabled,
    isMe,
    storedData
} from "./modules/customProfile";
import { withCollectibles } from "./modules/profileFrame";
import { CustomProfileData } from "./types";

let _origGetUserAvatarURL: any = null;
let _origExtractTimestamp: any = null;
let _origGetMember: any = null;
let _origGetUserProfile: any = null;
let _origGetGuildMemberProfile: any = null;
let _origGetCurrentUser: any = null;
let _origGetUser: any = null;
let _origGetAccounts: any = null;
let _origDecoURL: any = null;

const proxyUserCache = new WeakMap<any, { data: CustomProfileData; proxy: any; version: number; }>();
const profileCache = new WeakMap<any, { data: CustomProfileData; profile: any; version: number; }>();

const PremiumSource: { SUBSCRIPTION: number; } = findByPropsLazy("SUBSCRIPTION", "FRACTIONAL_NITRO", "REVERSE_TRIAL");
const PremiumSubscriptionType: { TIER_2: number; } = findByPropsLazy("NONE_UNSPECIFIED", "BOOST_ONLY", "TIER_2");

export function isLocalStaff(user: { id: string; }) {
    if (!_origGetCurrentUser) return false;
    const custom = getCustomDataForUser(user.id);
    return !!(custom?.enabled && ((custom.data.badgeFlags ?? 0) & 1));
}

function seededFraction(seed: string): number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967295;
}

function computeFakeSinceDate(minMonths: number, maxMonths: number, seed: string): Date {
    const now = new Date();
    const AVG_DAYS_PER_MONTH = 30.4368;
    const minDays = Math.round(minMonths * AVG_DAYS_PER_MONTH);
    let maxDays = Math.round(maxMonths * AVG_DAYS_PER_MONTH) - 1;
    if (maxDays <= minDays) maxDays = minDays + 1;
    const frac = seededFraction(`${seed}:${minMonths}:${maxMonths}`);
    const totalDays = minDays + Math.floor(frac * (maxDays - minDays + 1));
    const d = new Date(now);
    d.setDate(d.getDate() - totalDays);
    if (d.getTime() >= now.getTime()) {
        d.setTime(now.getTime() - 24 * 60 * 60 * 1000);
    }
    return d;
}

const NITRO_LEVEL_MIN_MONTHS = [0, 1, 3, 6, 12, 24, 36, 60, 72];
const NITRO_LEVEL_MAX_MONTHS = [1, 3, 6, 12, 24, 36, 60, 72, 108];
const BOOST_LEVEL_MIN_MONTHS = [1, 2, 3, 6, 9, 12, 15, 18, 24];
const BOOST_LEVEL_MAX_MONTHS = [2, 3, 6, 9, 12, 15, 18, 24, 48];

function getFakeNitroDate(level: number, seedBase: string): Date {
    const min = NITRO_LEVEL_MIN_MONTHS[level] ?? 1;
    const max = NITRO_LEVEL_MAX_MONTHS[level] ?? (min + 24);
    return computeFakeSinceDate(min, max, `${seedBase}:nitro:${level}:${min}:${max}`);
}

function getFakeBoostDate(boostIdx: number, seedBase: string): Date {
    const min = BOOST_LEVEL_MIN_MONTHS[boostIdx] ?? 1;
    const max = BOOST_LEVEL_MAX_MONTHS[boostIdx] ?? (min + 12);
    return computeFakeSinceDate(min, max, `${seedBase}:boost:${boostIdx}:${min}:${max}`);
}

function cleanMerge(original: any, overrides: any) {
    if (!original) return original;
    const clone = Object.create(Object.getPrototypeOf(original));
    for (const key of Reflect.ownKeys(original)) {
        const desc = Object.getOwnPropertyDescriptor(original, key);
        if (desc) Object.defineProperty(clone, key, desc);
    }
    for (const key of Reflect.ownKeys(overrides)) {
        const desc = Object.getOwnPropertyDescriptor(overrides, key);
        if (desc) Object.defineProperty(clone, key, desc);
    }
    return clone;
}

export function fakeCurrentUser(user: any, customData?: CustomProfileData) {
    const data = customData || storedData;
    if (!user || !data) return user;
    if (!customData && (!isEnabled || !isMe(user.id))) return user;

    const cached = proxyUserCache.get(user);
    if (cached?.data === data && cached.version === _dataVersion) return cached.proxy;

    const hasCustomUsername = !!data.username;
    const hasCustomGlobalName = !!data.globalName;
    const hasCustomEmail = !!data.email;
    const hasCustomPhone = !!data.phone;
    const hasCustomBio = !!data.bio;
    const hasCustomPronouns = !!data.pronouns;
    const hasCustomCreatedAt = !!data.createdAt;
    const hasCustomDeco = !!data.avatarDecoration || !!data.decorationAsset;
    const hasCustomProfileFrame = !!data.profileFrame;
    const hasCustomNameplate = !!data.nameplate;
    const hasCustomBadgeFlags = data.badgeFlags != null;
    const hasCustomNitro = !!data.nitro;
    const hasCustomConnections = Array.isArray(data.fakeConnections) && data.fakeConnections.length > 0;

    if (!hasCustomUsername && !hasCustomGlobalName && !hasCustomEmail && !hasCustomPhone && !hasCustomBio && !hasCustomPronouns && !hasCustomCreatedAt && !hasCustomDeco && !hasCustomProfileFrame && !hasCustomNameplate && !hasCustomBadgeFlags && !hasCustomNitro && !hasCustomConnections) {
        proxyUserCache.set(user, { data, proxy: user, version: _dataVersion });
        return user;
    }

    const proxy = new Proxy(user, {
        get(target, prop, receiver) {
            const desc = Object.getOwnPropertyDescriptor(target, prop);
            if (desc && !desc.configurable) {
                return Reflect.get(target, prop, target);
            }

            if (prop === "__cp_isClone") return true;
            if (prop === "username" || prop === "legacyUsername") {
                return data.username ? data.username : target.username;
            }
            if (prop === "globalName") {
                return data.globalName ? data.globalName : target.globalName;
            }
            if (prop === "displayName") {
                return data.globalName || target.displayName || target.globalName || target.username;
            }
            if (prop === "email") {
                return data.email ? data.email : target.email;
            }
            if (prop === "phone") {
                return data.phone ? data.phone : target.phone;
            }
            if (prop === "createdAt") {
                if (data.createdAt) {
                    return new Date(data.createdAt + "T12:00:00Z");
                }
                return target.createdAt;
            }
            if (prop === "avatarDecoration") {
                return data.decorationAsset ? null : target.avatarDecoration;
            }
            if (prop === "avatarDecorationData") {
                if (data.avatarDecoration) return data.avatarDecoration;
                if (data.decorationAsset) {
                    return {
                        asset: data.decorationAsset,
                        skuId: data.decorationSkuId ?? data.decorationAsset
                    };
                }
                return target.avatarDecorationData;
            }
            if (prop === "collectibles" && (data.profileFrame || data.nameplate)) {
                return withCollectibles(target.collectibles, data.profileFrame, data.nameplate);
            }
            if ((prop === "profileFrame" || prop === "profileFrameData") && data.profileFrame) {
                return data.profileFrame;
            }
            if (prop === "nameplate" && data.nameplate) {
                return data.nameplate;
            }
            if (prop === "publicFlags") {
                return data.badgeFlags != null ? data.badgeFlags : target[prop];
            }
            if (prop === "flags" && data.badgeFlags != null) {
                return (target.flags & ~1) | (data.badgeFlags & 1);
            }
            if (prop === "premiumType") {
                return data.nitro ? 2 : target.premiumType;
            }
            if (prop === "premiumState" && data.nitro) {
                return {
                    ...target.premiumState,
                    premiumSource: PremiumSource.SUBSCRIPTION,
                    premiumSubscriptionType: PremiumSubscriptionType.TIER_2
                };
            }
            if (prop === "perks" && data.nitro) return null;
            if (prop === "premiumSince") {
                if (data.nitro) {
                    const seedBase = target.id || "self";
                    const nl = data.nitroLevel ?? 0;
                    return getFakeNitroDate(nl, seedBase);
                }
                return target.premiumSince;
            }
            if (prop === "premiumGuildSince") {
                if (data.nitro) {
                    const bm = data.boostMonths ?? -1;
                    if (bm >= 0) {
                        const seedBase = target.id || "self";
                        return getFakeBoostDate(bm, seedBase);
                    }
                }
                return target.premiumGuildSince;
            }
            if (prop === "getTag") {
                return () => {
                    const name = data.username || target.username;
                    return target.discriminator === "0" ? name : `${name}#${target.discriminator}`;
                };
            }
            if (prop === "getGlobalName") {
                return () => data.globalName ? data.globalName : target.globalName;
            }
            if (prop === "toString") {
                return () => data.globalName || target.displayName || target.globalName || target.username;
            }

            if (prop === "hasFlag") {
                return (flag: number) => {
                    if (data.badgeFlags != null && (flag & 1)) {
                        return (data.badgeFlags & 1) !== 0 && (flag === 1 || target.hasFlag(flag & ~1));
                    }
                    return target.hasFlag(flag);
                };
            }
            if ((prop === "isStaff" || prop === "hasAnyStaffLevel") && data.badgeFlags != null) {
                const flags = data.badgeFlags;
                return () => (flags & 1) !== 0;
            }
            if ((prop === "hasPremium" || prop === "isPremium" || prop === "hasPaidTier2Subscription") && data.nitro) {
                return () => true;
            }

            const value = Reflect.get(target, prop, target);
            if (typeof value === "function" && typeof prop === "string") {
                if (prop === "hasFreePremium" || prop === "hadPremiumSubscription" || prop === "isOnReverseTrial" || prop.startsWith("isPremiumWith") || prop.startsWith("isFractionalPremium")) {
                    return value.bind(receiver);
                }
                return value.bind(target);
            }
            return value;
        },
        set(target, prop, value) {
            return Reflect.set(target, prop, value, target);
        }
    });

    proxyUserCache.set(user, { data, proxy, version: _dataVersion });
    return proxy;
}

export function getCustomProfileBadgesList(userId: string, previewData?: CustomProfileData): { id: string; iconSrc: string; description: string; link?: string; }[] {
    const custom = previewData ? { data: previewData, enabled: true } : getCustomDataForUser(userId);
    if (!custom?.enabled) return [];
    const { data } = custom;
    const badges: any[] = [];

    const customIds = data.customBadgeIds ?? [];

    // 1. Nitro Badge
    if (data.nitro) {
        const nl = data.nitroLevel ?? 0;
        const LEVEL_MONTHS = [0, 1, 3, 6, 12, 24, 36, 60, 72];
        const nitroHash = NITRO_LEVELS[nl]?.icon.split("/").pop()?.replace(".png", "") || "2ba85e8026a8614b640c2837bcdfe21b";
        const months = LEVEL_MONTHS[nl] ?? 1;
        const nitroId = `premium_tenure_${months}_month_v2`;
        const since = getFakeNitroDate(nl, userId || "self");

        badges.push({
            id: nitroId,
            iconSrc: `https://cdn.discordapp.com/badge-icons/${nitroHash}.png`,
            description: formatNitroBadgeDesc(since),
            link: "https://discord.com/settings/premium"
        });

        // 2. Server Booster Badge
        const bm = data.boostMonths ?? -1;
        if (bm >= 0) {
            const BOOST_LVLS = ["lvl1", "lvl2", "lvl3", "lvl4", "lvl5", "lvl6", "lvl7", "lvl8", "lvl9"];
            const boostHash = BOOST_ICONS[bm]?.split("/").pop()?.replace(".png", "") || "51040c70d4f20a921ad6674ff86fc95c";
            const boostLvl = BOOST_LVLS[bm] || "lvl1";
            const boostSince = getFakeBoostDate(bm, userId || "self");

            badges.push({
                id: `guild_booster_${boostLvl}`,
                iconSrc: `https://cdn.discordapp.com/badge-icons/${boostHash}.png`,
                description: formatBoostBadgeDesc(boostSince),
                link: "https://discord.com/settings/guild-boosting"
            });
        }
    }

    // 3. Flag-based Badges
    const wantedFlags = data.badgeFlags ?? 0;
    if (wantedFlags) {
        for (const bDef of BADGES) {
            if (wantedFlags & bDef.flag) {
                const bId = getBadgeId(bDef.key);
                const hash = bDef.icon.split("/").pop()?.replace(".png", "") || "";
                badges.push({
                    id: bId,
                    iconSrc: `https://cdn.discordapp.com/badge-icons/${hash}.png`,
                    description: getStandardBadgeDesc(bDef.key)
                });
            }
        }
    }

    // 4. Custom Special Badges
    if (customIds.includes("quest")) {
        badges.push({
            id: "quest_completed",
            iconSrc: "https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png",
            description: getLocalizedBadgeLabel("Completed a Quest"),
            link: "https://discord.com/discovery/quests"
        });
    }
    if (customIds.includes("orbs")) {
        badges.push({
            id: "orb_profile_badge",
            iconSrc: "https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png",
            description: getLocalizedBadgeLabel("Orbs — Apprentice")
        });
    }
    if (customIds.includes("oldname")) {
        const dText = data.oldName ? "Originally known as " + data.oldName : "Originally known as ...";
        badges.push({
            id: "legacy_username",
            iconSrc: "https://cdn.discordapp.com/badge-icons/6de6d34650760ba5551a79732e98ed60.png",
            description: dText
        });
    }
    if (customIds.includes("gifting_icon")) {
        badges.push({
            id: "gifting_icon",
            iconSrc: "https://cdn.discordapp.com/badge-icons/64f2413c9b9803661322aaad25826b62.png",
            description: getGiftingBadgeDesc("icon")
        });
    }
    if (customIds.includes("gifting_patron")) {
        badges.push({
            id: "gifting_patron",
            iconSrc: "https://cdn.discordapp.com/badge-icons/ac305d1b9481f312ce4419e7f8296558.png",
            description: getGiftingBadgeDesc("patron")
        });
    }
    if (customIds.includes("gifting_champion")) {
        badges.push({
            id: "gifting_champion",
            iconSrc: "https://cdn.discordapp.com/badge-icons/8b7792c4f65953d3ff564f23429cb79e.png",
            description: getGiftingBadgeDesc("champion")
        });
    }
    if (customIds.includes("gifting_luminary")) {
        badges.push({
            id: "gifting_luminary",
            iconSrc: "https://cdn.discordapp.com/badge-icons/3119f5504b2cd09576a323908c7c3517.png",
            description: getGiftingBadgeDesc("luminary")
        });
    }
    if (customIds.includes("gifting_hero")) {
        badges.push({
            id: "gifting_hero",
            iconSrc: "https://cdn.discordapp.com/badge-icons/77d65b1f210014a11eb1582ee06ab684.png",
            description: getGiftingBadgeDesc("hero")
        });
    }
    if (customIds.includes("gifting_legend")) {
        badges.push({
            id: "gifting_legend",
            iconSrc: "https://cdn.discordapp.com/badge-icons/7fe346cfc5da1340087d8759a9e7a395.png",
            description: getGiftingBadgeDesc("legend")
        });
    }
    if (customIds.includes("gifting_level")) {
        const lvl = data.levelReached ?? 1;
        badges.push({
            id: "gifting_level",
            iconSrc: "https://cdn.discordapp.com/badge-icons/ca105ad9cfc8580c765101d17bbb2323.png",
            description: getLevelBadgeDesc(lvl)
        });
    }

    return badges;
}

export function hookUserProfile(profile: any, customData?: CustomProfileData) {
    const data = customData || storedData;
    if (!profile || !data) return profile;

    const cached = profileCache.get(profile);
    if (cached?.data === data && cached.version === _dataVersion) return cached.profile;

    const hasDeco = !!data.avatarDecoration || !!data.decorationAsset;
    const hasNitro = !!data.nitro;
    const hasBadgeFlags = data.badgeFlags != null;
    const hasBio = !!data.bio;
    const hasPronouns = !!data.pronouns;
    const hasAccentColor = data.accentColor != null;
    const hasBanner = !!data.banner;
    const hasEffect = !!data.profileEffectId;
    const hasProfileFrame = !!data.profileFrame;
    const hasNameplate = !!data.nameplate;
    const hasCustomBadges = Array.isArray(data.customBadgeIds) && data.customBadgeIds.length > 0;
    const hasConnections = Array.isArray(data.fakeConnections) && data.fakeConnections.length > 0;

    if (!hasDeco && !hasNitro && !hasBadgeFlags && !hasBio && !hasPronouns && !hasAccentColor && !hasBanner && !hasEffect && !hasProfileFrame && !hasNameplate && !hasCustomBadges && !hasConnections) {
        profileCache.set(profile, { data, profile, version: _dataVersion });
        return profile;
    }

    try {
        const merged: any = {};

        if (data.bio) merged.bio = data.bio;
        if (data.pronouns) merged.pronouns = data.pronouns;
        if (data.accentColor != null) merged.accentColor = data.accentColor;
        if (data.banner) merged.banner = data.banner;

        if (data.avatarDecoration || data.decorationAsset) {
            merged.avatarDecoration = null;
            merged.avatarDecorationData = data.avatarDecoration ?? {
                asset: data.decorationAsset,
                skuId: data.decorationSkuId ?? data.decorationAsset
            };
        }

        const overrideFlags = data.nitro || data.badgeFlags != null;

        if (overrideFlags) {
            merged.premiumType = data.nitro ? 2 : profile.premiumType;

            if (data.nitro) {
                if (data.accentColor != null) {
                    const c2 = data.accentColor2 ?? data.accentColor;
                    merged.themeColors = [data.accentColor, c2];
                }
                const nl = data.nitroLevel ?? 0;
                const seedBase = profile.userId || UserStore.getCurrentUser()?.id || "self";
                const since = getFakeNitroDate(nl, seedBase);
                merged.premiumSince = since;

                const bm = data.boostMonths ?? -1;
                if (bm >= 0) {
                    merged.premiumGuildSince = getFakeBoostDate(bm, seedBase);
                } else {
                    merged.premiumGuildSince = null;
                }
            } else {
                merged.premiumSince = profile.premiumSince;
                merged.premiumGuildSince = profile.premiumGuildSince;
            }

            merged.publicFlags = (data.badgeFlags != null) ? data.badgeFlags : profile.publicFlags;
        } else if (data.nitro === false) {
            merged.premiumType = profile.premiumType ?? 0;
            merged.premiumSince = profile.premiumSince ?? null;
            merged.premiumGuildSince = profile.premiumGuildSince ?? null;
        }

        if (overrideFlags) {
            const wantedFlags = (data.badgeFlags != null) ? data.badgeFlags : profile.publicFlags;
            merged.publicFlags = wantedFlags;
        }

        merged.badges = overrideFlags ? [] : (profile.badges || []);

        if (data.profileEffectId) {
            merged.profileEffectId = data.profileEffectId;
            merged.profileEffect = data.profileEffect ?? { expireAt: null, skuId: data.profileEffectId };
            if (!merged.premiumType) merged.premiumType = profile.premiumType || 2;
        }

        if (data.profileFrame || data.nameplate) {
            merged.collectibles = withCollectibles(profile.collectibles, data.profileFrame, data.nameplate);
        }
        if (data.profileFrame) {
            merged.profileFrame = data.profileFrame;
            merged.profileFrameData = data.profileFrame;
        }
        if (data.nameplate) merged.nameplate = data.nameplate;

        if (data.fakeConnections && data.fakeConnections.length > 0) {
            const fakeAccs = formatFakeConnections(data.fakeConnections);
            const existing = profile.connectedAccounts || profile.connected_accounts || [];
            merged.connectedAccounts = [...existing, ...fakeAccs];
            merged.connected_accounts = [...existing, ...fakeAccs];
        }

        const result = cleanMerge(profile, merged);
        profileCache.set(profile, { data, profile: result, version: _dataVersion });
        return result;
    } catch {
        return profile;
    }
}

export function hookUserProfileGuildOnly(profile: any, customData?: CustomProfileData) {
    const data = customData || storedData;
    if (!profile || !data) return profile;

    const hasDeco = !!data.avatarDecoration || !!data.decorationAsset;
    const hasNitro = !!data.nitro;
    const hasBio = !!data.bio;
    const hasPronouns = !!data.pronouns;
    const hasAccentColor = data.accentColor != null;
    const hasBanner = !!data.banner;
    const hasEffect = !!data.profileEffectId;
    const hasProfileFrame = !!data.profileFrame;
    const hasNameplate = !!data.nameplate;
    const hasConnections = Array.isArray(data.fakeConnections) && data.fakeConnections.length > 0;

    if (!hasDeco && !hasNitro && !hasBio && !hasPronouns && !hasAccentColor && !hasBanner && !hasEffect && !hasProfileFrame && !hasNameplate && !hasConnections) {
        return profile;
    }

    try {
        const merged: any = {};
        if (data.bio) merged.bio = data.bio;
        if (data.pronouns) merged.pronouns = data.pronouns;
        if (data.accentColor != null) merged.accentColor = data.accentColor;
        if (data.banner) merged.banner = data.banner;

        if (data.avatarDecoration || data.decorationAsset) {
            merged.avatarDecoration = null;
            merged.avatarDecorationData = data.avatarDecoration ?? {
                asset: data.decorationAsset,
                skuId: data.decorationSkuId ?? data.decorationAsset
            };
        }

        if (data.nitro) {
            merged.premiumType = 2;
            if (data.accentColor != null) {
                const c2 = data.accentColor2 ?? data.accentColor;
                merged.themeColors = [data.accentColor, c2];
            }
            const nl = data.nitroLevel ?? 0;
            const seedBase = profile.userId || UserStore.getCurrentUser()?.id || "self";
            merged.premiumSince = getFakeNitroDate(nl, seedBase);
            const bm = data.boostMonths ?? -1;
            if (bm >= 0) {
                merged.premiumGuildSince = getFakeBoostDate(bm, seedBase);
            } else {
                merged.premiumGuildSince = null;
            }
        } else if (data.nitro === false) {
            merged.premiumType = profile.premiumType ?? 0;
            merged.premiumSince = profile.premiumSince ?? null;
            merged.premiumGuildSince = profile.premiumGuildSince ?? null;
        }

        if (data.profileEffectId) {
            merged.profileEffectId = data.profileEffectId;
            merged.profileEffect = data.profileEffect ?? { expireAt: null, skuId: data.profileEffectId };
            if (!merged.premiumType) merged.premiumType = profile.premiumType || 2;
        }

        if (data.profileFrame || data.nameplate) {
            merged.collectibles = withCollectibles(profile.collectibles, data.profileFrame, data.nameplate);
        }
        if (data.profileFrame) {
            merged.profileFrame = data.profileFrame;
            merged.profileFrameData = data.profileFrame;
        }
        if (data.nameplate) merged.nameplate = data.nameplate;

        if (data.fakeConnections && data.fakeConnections.length > 0) {
            const fakeAccs = formatFakeConnections(data.fakeConnections);
            const existing = profile.connectedAccounts || profile.connected_accounts || [];
            merged.connectedAccounts = [...existing, ...fakeAccs];
            merged.connected_accounts = [...existing, ...fakeAccs];
        }

        return cleanMerge(profile, merged);
    } catch {
        return profile;
    }
}

export function fakeObfuscatedEmail(real: string | null) {
    if (!isEnabled || !storedData.email || !real) return real;
    const fake = storedData.email;
    const atIdx = fake.indexOf("@");
    if (atIdx <= 1) return fake;
    return fake[0] + "***" + fake.slice(atIdx - 1);
}

export function fakeObfuscatedPhone(real: string | null) {
    if (!isEnabled || !storedData.phone || !real) return real;
    const fake = storedData.phone;
    if (fake.length < 4) return fake;
    return "***-***-" + fake.slice(-4);
}

export function getDecorationURLForUser(opts: any) {
    try {
        const decoData = opts?.avatarDecorationData ?? opts?.avatarDecoration;
        const userId = opts?.userId;
        const canAnimate = opts?.canAnimate ?? opts?.animated ?? true;

        const custom = getCustomDataForUser(userId);
        if (custom?.enabled && custom.data.decorationAsset) {
            const isOurs =
                decoData?.asset === custom.data.decorationAsset ||
                decoData?.skuId === custom.data.decorationSkuId ||
                (userId != null);
            if (isOurs) {
                return getDecorationUrl(custom.data.decorationAsset, canAnimate);
            }
        }
    } catch { }
    return null;
}

export function getAvatarDecoOverride(user: any) {
    try {
        const uid = user?.id;
        if (!uid) return null;

        const custom = getCustomDataForUser(uid);
        if (custom?.enabled && custom.data.decorationAsset) {
            return custom.data.avatarDecoration ?? {
                asset: custom.data.decorationAsset,
                skuId: custom.data.decorationSkuId ?? custom.data.decorationAsset
            };
        }
    } catch { }
    return null;
}

export function patchBannerUrl({ displayProfile }: any) {
    try {
        const uid = displayProfile?.userId;
        if (!uid) return null;

        const custom = getCustomDataForUser(uid);
        if (custom?.enabled && custom.data.nitro && custom.data.banner) {
            return custom.data.banner;
        }
        return null;
    } catch { return null; }
}

export function installStoreHooks() {
    // 0. UserStore.getCurrentUser & UserStore.getUser
    try {
        const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser") || UserStore;
        if (US && !_origGetCurrentUser) {
            _origGetCurrentUser = US.getCurrentUser.bind(US);
            US.getCurrentUser = () => {
                const realUser = _origGetCurrentUser();
                if (!realUser) return realUser;
                const custom = getCustomDataForUser(realUser.id);
                if (custom?.enabled) {
                    return fakeCurrentUser(realUser, custom.data);
                }
                return realUser;
            };
        }
        if (US && !_origGetUser) {
            _origGetUser = US.getUser.bind(US);
            US.getUser = (id: string) => {
                const user = _origGetUser(id);
                if (!user) return user;
                const custom = getCustomDataForUser(id);
                if (custom?.enabled) {
                    return fakeCurrentUser(user, custom.data);
                }
                return user;
            };
        }
    } catch { }

    // 1. IconUtils.getUserAvatarURL
    try {
        if (IconUtils?.getUserAvatarURL && !_origGetUserAvatarURL) {
            _origGetUserAvatarURL = IconUtils.getUserAvatarURL;
            IconUtils.getUserAvatarURL = function (user: any, ...args: any[]) {
                if (!user) return _origGetUserAvatarURL(user, ...args);
                const uid = user.id ?? user.userId;
                if (!uid) return _origGetUserAvatarURL(user, ...args);
                const custom = getCustomDataForUser(uid);
                if (custom?.enabled && custom.data.avatar) {
                    return custom.data.avatar;
                }
                return _origGetUserAvatarURL(user, ...args);
            };
        }
    } catch { }

    // 2. SnowflakeUtils.extractTimestamp
    try {
        if (SnowflakeUtils?.extractTimestamp && !_origExtractTimestamp) {
            _origExtractTimestamp = SnowflakeUtils.extractTimestamp;
            (SnowflakeUtils as any).extractTimestamp = function (id: string) {
                const custom = getCustomDataForUser(id);
                if (custom?.enabled && custom.data.createdAt) {
                    const parsed = new Date(custom.data.createdAt + "T12:00:00Z").getTime();
                    if (!isNaN(parsed)) return parsed;
                }

                return _origExtractTimestamp.call(this, id);
            };
        }
    } catch { }

    // 3. GuildMemberStore.getMember
    try {
        if (GuildMemberStore?.getMember && !_origGetMember) {
            _origGetMember = GuildMemberStore.getMember.bind(GuildMemberStore);
            GuildMemberStore.getMember = function (guildId: string, userId: string) {
                const member = _origGetMember(guildId, userId);
                const custom = getCustomDataForUser(userId);
                if (custom?.enabled && member) {
                    const customNick = custom.data.globalName || custom.data.username;
                    if (customNick) {
                        return { ...member, nick: customNick };
                    }
                }

                return member;
            };
        }
    } catch { }

    // 4. UserProfileStore
    try {
        const UPS = (Vencord as any).Webpack?.findByProps?.("getUserProfile", "getGuildMemberProfile") || UserProfileStore;
        if (UPS?.getUserProfile && !_origGetUserProfile) {
            _origGetUserProfile = UPS.getUserProfile.bind(UPS);
            UPS.getUserProfile = function (userId: string) {
                const profile = _origGetUserProfile(userId);
                const custom = getCustomDataForUser(userId);
                if (custom?.enabled && profile) {
                    return hookUserProfile(profile, custom.data);
                }

                return profile;
            };
        }

        if (UPS?.getGuildMemberProfile && !_origGetGuildMemberProfile) {
            _origGetGuildMemberProfile = UPS.getGuildMemberProfile.bind(UPS);
            UPS.getGuildMemberProfile = function (userId: string, guildId: string) {
                const profile = _origGetGuildMemberProfile(userId, guildId);
                const custom = getCustomDataForUser(userId);
                if (custom?.enabled && profile) {
                    return hookUserProfileGuildOnly(profile, custom.data);
                }

                return profile;
            };
        }
    } catch { }

    // 5. ConnectedAccountsStore
    try {
        const WP = (Vencord as any).Webpack;
        const CAS = WP?.findByProps?.("getAccounts", "getLocalAccounts");
        if (CAS && !_origGetAccounts) {
            _origGetAccounts = CAS.getAccounts.bind(CAS);
            CAS.getAccounts = () => {
                const accounts = _origGetAccounts() || [];
                if (isEnabled && storedData.fakeConnections && storedData.fakeConnections.length > 0) {
                    const fakeAccs = formatFakeConnections(storedData.fakeConnections);
                    return [...accounts, ...fakeAccs];
                }
                return accounts;
            };
        }
    } catch { }

    // 6. getAvatarDecorationURL
    try {
        const decoMod = (Vencord as any).Webpack?.findByProps?.("getAvatarDecorationURL");
        if (decoMod?.getAvatarDecorationURL && !_origDecoURL) {
            _origDecoURL = decoMod.getAvatarDecorationURL.bind(decoMod);
            decoMod.getAvatarDecorationURL = (opts: any) => {
                try {
                    const decoData = opts?.avatarDecorationData ?? opts?.avatarDecoration ?? opts;
                    const userId = opts?.userId;
                    const canAnimate = opts?.canAnimate ?? opts?.animated ?? true;

                    if (isEnabled && storedData.decorationAsset) {
                        const myId = UserStore.getCurrentUser()?.id;
                        const isOurs =
                            decoData?.asset === storedData.decorationAsset ||
                            decoData?.skuId === storedData.decorationSkuId ||
                            decoData?.skuId === "__fake__" ||
                            (userId && userId === myId);
                        if (isOurs) {
                            const asset = storedData.decorationAsset;
                            return getDecorationUrl(asset, canAnimate);
                        }
                    }
                } catch { }
                return _origDecoURL(opts);
            };
        }
    } catch { }
}

export function uninstallStoreHooks() {
    try {
        const US = (Vencord as any).Webpack?.findByProps?.("getCurrentUser", "getUser") || UserStore;
        if (US && _origGetCurrentUser) {
            US.getCurrentUser = _origGetCurrentUser;
            _origGetCurrentUser = null;
        }
        if (US && _origGetUser) {
            US.getUser = _origGetUser;
            _origGetUser = null;
        }
    } catch { }

    if (_origGetUserAvatarURL && IconUtils) {
        (IconUtils as any).getUserAvatarURL = _origGetUserAvatarURL;
        _origGetUserAvatarURL = null;
    }
    if (_origExtractTimestamp && SnowflakeUtils) {
        (SnowflakeUtils as any).extractTimestamp = _origExtractTimestamp;
        _origExtractTimestamp = null;
    }
    if (_origGetMember && GuildMemberStore) {
        GuildMemberStore.getMember = _origGetMember;
        _origGetMember = null;
    }
    if (_origGetUserProfile && UserProfileStore) {
        UserProfileStore.getUserProfile = _origGetUserProfile;
        _origGetUserProfile = null;
    }
    if (_origGetGuildMemberProfile && UserProfileStore) {
        UserProfileStore.getGuildMemberProfile = _origGetGuildMemberProfile;
        _origGetGuildMemberProfile = null;
    }
    try {
        const WP = (Vencord as any).Webpack;
        const CAS = WP?.findByProps?.("getAccounts", "getLocalAccounts");
        if (CAS && _origGetAccounts) {
            CAS.getAccounts = _origGetAccounts;
            _origGetAccounts = null;
        }
    } catch { }
    try {
        const decoMod = (Vencord as any).Webpack?.findByProps?.("getAvatarDecorationURL");
        if (decoMod && _origDecoURL) {
            decoMod.getAvatarDecorationURL = _origDecoURL;
            _origDecoURL = null;
        }
    } catch { }
}
