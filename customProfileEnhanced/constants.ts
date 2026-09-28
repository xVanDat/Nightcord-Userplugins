/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FakeConnection } from "./types";

export const t = (str: string) => str;

export const DS_KEY_DATA = "customProfileEnhanced_profile_data";
export const DS_KEY_ENABLED = "customProfileEnhanced_profile_enabled";
export const DS_ALL_DATA = "customProfileEnhanced_profile_allData";
export const DS_ALL_ENABLED = "customProfileEnhanced_profile_allEnabled";
export const DS_KEY_SWITCHER = "customProfileEnhanced_fakeAccount_switcher";

export const LS_KEY_DATA = "CustomProfileEnhanced_data";
export const LS_KEY_ENABLED = "CustomProfileEnhanced_enabled";
export const LS_ALL_DATA = "CustomProfileEnhanced_allData";
export const LS_ALL_ENABLED = "CustomProfileEnhanced_allEnabled";

export const FLAG = {
    STAFF: 1,
    PARTNER: 2,
    HYPESQUAD: 4,
    BUG_HUNTER_1: 8,
    BRAVERY: 64,
    BRILLIANCE: 128,
    BALANCE: 256,
    EARLY_SUPPORTER: 512,
    BUG_HUNTER_2: 16384,
    DEV_VERIFIED: 131072,
    MOD_ALUMNI: 262144,
    ACTIVE_DEVELOPER: 4194304,
};

export const BADGES = [
    { key: "Staff Discord", label: t("Staff Discord"), flag: FLAG.STAFF, icon: "https://cdn.discordapp.com/badge-icons/5e74e9b61934fc1f67c65515d1f7e60d.png" },
    { key: "Partnered Server Owner", label: t("Partnered Server Owner"), flag: FLAG.PARTNER, icon: "https://cdn.discordapp.com/badge-icons/3f9748e53446a137a052f3454e2de41e.png" },
    { key: "HypeSquad Events", label: t("HypeSquad Events"), flag: FLAG.HYPESQUAD, icon: "https://cdn.discordapp.com/badge-icons/bf01d1073931f921909045f3a39fd264.png" },
    { key: "Bug Hunter Lvl 1", label: t("Bug Hunter Lvl 1"), flag: FLAG.BUG_HUNTER_1, icon: "https://cdn.discordapp.com/badge-icons/2717692c7dca7289b35297368a940dd0.png" },
    { key: "HypeSquad Bravery", label: t("HypeSquad Bravery"), flag: FLAG.BRAVERY, icon: "https://cdn.discordapp.com/badge-icons/8a88d63823d8a71cd5e390baa45efa02.png" },
    { key: "HypeSquad Brilliance", label: t("HypeSquad Brilliance"), flag: FLAG.BRILLIANCE, icon: "https://cdn.discordapp.com/badge-icons/011940fd013da3f7fb926e4a1cd2e618.png" },
    { key: "HypeSquad Balance", label: t("HypeSquad Balance"), flag: FLAG.BALANCE, icon: "https://cdn.discordapp.com/badge-icons/3aa41de486fa12454c3761e8e223442e.png" },
    { key: "Early Supporter", label: t("Early Supporter"), flag: FLAG.EARLY_SUPPORTER, icon: "https://cdn.discordapp.com/badge-icons/7060786766c9c840eb3019e725d2b358.png" },
    { key: "Former Moderator", label: t("Former Moderator"), flag: FLAG.MOD_ALUMNI, icon: "https://cdn.discordapp.com/badge-icons/fee1624003e2fee35cb398e125dc479b.png" },
    { key: "Bug Hunter Lvl 2", label: t("Bug Hunter Lvl 2"), flag: FLAG.BUG_HUNTER_2, icon: "https://cdn.discordapp.com/badge-icons/848f79194d4be5ff5f81505cbd0ce1e6.png" },
    { key: "Early Verified Bot Developer", label: t("Early Verified Bot Developer"), flag: FLAG.DEV_VERIFIED, icon: "https://cdn.discordapp.com/badge-icons/6df5892e0f35b051f8b61eace34f4967.png" },
    { key: "Active Developer", label: t("Active Developer"), flag: FLAG.ACTIVE_DEVELOPER, icon: "https://cdn.discordapp.com/badge-icons/6bdc42827a38498929a4920da12695d9.png" },
];

export const OLD_NAME_BADGE_ICON = "https://cdn.discordapp.com/badge-icons/6de6d34650760ba5551a79732e98ed60.png";

export const NITRO_LEVELS = [
    { label: t("Nitro (0 months)"), icon: "https://cdn.discordapp.com/badge-icons/2ba85e8026a8614b640c2837bcdfe21b.png" },
    { label: t("Bronze (1 month)"), icon: "https://cdn.discordapp.com/badge-icons/4f33c4a9c64ce221936bd256c356f91f.png" },
    { label: t("Silver (3 months)"), icon: "https://cdn.discordapp.com/badge-icons/4514fab914bdbfb4ad2fa23df76121a6.png" },
    { label: t("Gold (6 months)"), icon: "https://cdn.discordapp.com/badge-icons/2895086c18d5531d499862e41d1155a6.png" },
    { label: t("Platinum (12 months)"), icon: "https://cdn.discordapp.com/badge-icons/0334688279c8359120922938dcb1d6f8.png" },
    { label: t("Diamond (24 months)"), icon: "https://cdn.discordapp.com/badge-icons/0d61871f72bb9a33a7ae568c1fb4f20a.png" },
    { label: t("Emerald (36 months)"), icon: "https://cdn.discordapp.com/badge-icons/11e2d339068b55d3a506cff34d3780f3.png" },
    { label: t("Ruby (60 months)"), icon: "https://cdn.discordapp.com/badge-icons/cd5e2cfd9d7f27a8cdcd3e8a8d5dc9f4.png" },
    { label: t("Opal (72 months)"), icon: "https://cdn.discordapp.com/badge-icons/5b154df19c53dce2af92c9b61e6be5e2.png" },
];

export const BOOST_LABELS_RAW = [
    "1 Month", "2 Months", "3 Months", "6 Months",
    "9 Months", "12 Months", "15 Months", "18 Months", "24 Months"
];
export const BOOST_LABELS = BOOST_LABELS_RAW.map(l => t(l));
export const BOOST_ICONS = [
    "https://cdn.discordapp.com/badge-icons/51040c70d4f20a921ad6674ff86fc95c.png", // 1 month
    "https://cdn.discordapp.com/badge-icons/0e4080d1d333bc7ad29ef6528b6f2fb7.png", // 2 months
    "https://cdn.discordapp.com/badge-icons/72bed924410c304dbe3d00a6e593ff59.png", // 3 months
    "https://cdn.discordapp.com/badge-icons/df199d2050d3ed4ebf84d64ae83989f8.png", // 6 months
    "https://cdn.discordapp.com/badge-icons/996b3e870e8a22ce519b3a50e6bdd52f.png", // 9 months
    "https://cdn.discordapp.com/badge-icons/991c9f39ee33d7537d9f408c3e53141e.png", // 12 months
    "https://cdn.discordapp.com/badge-icons/cb3ae83c15e970e8f3d410bc62cb8b99.png", // 15 months
    "https://cdn.discordapp.com/badge-icons/7142225d31238f6387d9f09efaa02759.png", // 18 months
    "https://cdn.discordapp.com/badge-icons/ec92202290b48d0879b7413d2dde3bab.png", // 24 months
];

export const FAKE_PLATFORMS = [
    { id: "domain", label: "Domain / Website", icon: "/assets/b4376756bcbbf1ef.svg", placeholder: "example.com", defaultUrl: (name: string) => name.startsWith("http") ? name : `https://${name}` },
    { id: "twitter", label: "X (Twitter)", icon: "/assets/a61999ae9bfb9658.svg", placeholder: "username", defaultUrl: (name: string) => `https://x.com/${name.replace(/^@/, "")}` },
    { id: "github", label: "GitHub", icon: "/assets/a35ff3e86ffa1eb2.svg", placeholder: "username", defaultUrl: (name: string) => `https://github.com/${name}` },
    { id: "youtube", label: "YouTube", icon: "/assets/0fa530ba9c04ac32.svg", placeholder: "username", defaultUrl: (name: string) => `https://youtube.com/@${name.replace(/^@/, "")}` },
    { id: "twitch", label: "Twitch", icon: "/assets/4fda00c96319c8ae.svg", placeholder: "username", defaultUrl: (name: string) => `https://twitch.tv/${name}` },
    { id: "spotify", label: "Spotify", icon: "/assets/d5719388ffc613da.svg", placeholder: "username", defaultUrl: (name: string) => `https://open.spotify.com/user/${name}` },
    { id: "tiktok", label: "TikTok", icon: "/assets/b4376756bcbbf1ef.svg", placeholder: "username", defaultUrl: (name: string) => name.startsWith("http") ? name : name.includes("tiktok.com") ? `https://${name.replace(/^https?:\/\//, "")}` : `https://tiktok.com/@${name.replace(/^@/, "")}` },
    { id: "reddit", label: "Reddit", icon: "/assets/adfd927dcc2049a5.svg", placeholder: "username", defaultUrl: (name: string) => `https://reddit.com/user/${name}` },
    { id: "steam", label: "Steam", icon: "/assets/1f7ec18f3695d4cf.svg", placeholder: "username", defaultUrl: (name: string) => `https://steamcommunity.com/id/${name}` },
    { id: "leagueoflegends", label: "Riot Games", icon: "https://cdn.discordapp.com/app-icons/1443033465766281327/b69039088ad141a9c036f7f4f247f6ba.png?size=128", placeholder: "RiotName#TAG" },
    { id: "bluesky", label: "Bluesky", icon: "/assets/2709f058378a099d.svg", placeholder: "handle.bsky.social", defaultUrl: (name: string) => `https://bsky.app/profile/${name}` },
    { id: "paypal", label: "PayPal", icon: "/assets/dcb64a4ff8f61b2c.svg", placeholder: "username", defaultUrl: (name: string) => `https://paypal.me/${name}` },
    { id: "ebay", label: "eBay", icon: "/assets/b28a7a265581b6e3.svg", placeholder: "username" },
    { id: "crunchyroll", label: "Crunchyroll", icon: "/assets/94ef3e8b7fa85a2e.svg", placeholder: "username" },
    { id: "playstation", label: "PlayStation Network", icon: "/assets/eed203a7ec517e23.svg", placeholder: "PSN_ID" },
    { id: "xbox", label: "Xbox", icon: "/assets/c4f09fda61827e19.svg", placeholder: "Gamertag" },
    { id: "amazon-music", label: "Amazon Music", icon: "/assets/e3c4aacc1a54395d.svg", placeholder: "username" },
    { id: "battlenet", label: "Battle.net", icon: "/assets/163c8cb9220efc74.svg", placeholder: "BattleTag#1234" },
    { id: "bungie", label: "Bungie.net", icon: "/assets/099cd81cf3b4cc98.svg", placeholder: "BungieName#1234" },
    { id: "epicgames", label: "Epic Games", icon: "/assets/199eceff4fca1a0c.svg", placeholder: "EpicUsername" },
    { id: "facebook", label: "Facebook", icon: "/assets/17be29f77bee4405.svg", placeholder: "username", defaultUrl: (name: string) => `https://facebook.com/${name}` },
    { id: "roblox", label: "Roblox", icon: "/assets/a4d8e9b0404a2d00.svg", placeholder: "RobloxName" }
];

export function getDecorationUrl(assetId: string, animated = true): string {
    return `https://cdn.discordapp.com/media/v1/collectibles-shop/${assetId}/${animated ? "animated" : "static"}`;
}

export function getProfileEffectUrl(assetId: string, animated = false): string {
    return `https://cdn.discordapp.com/media/v1/collectibles-shop/${assetId}/${animated ? "animated" : "static"}`;
}

export function getGiftingBadgeDesc(type: string): string {
    switch (type) {
        case "icon": return "Gifting Icon";
        case "patron": return "Gifting Patron";
        case "champion": return "Gifting Champion";
        case "luminary": return "Gifting Luminary";
        case "hero": return "Gifting Hero";
        case "legend": return "Gifting Legend";
        default: return "";
    }
}

export function getLevelBadgeDesc(level: number): string {
    return `Level ${level} Reached`;
}

export function getLocalizedBadgeLabel(key: string): string {
    switch (key) {
        case "Badges": return "BADGES";
        case "Evolving Nitro Badge": return "EVOLVING NITRO BADGE";
        case "Special Badges": return "SPECIAL BADGES";
        case "Gifting Badges": return "GIFTING BADGES";
        case "Server Boost Badges": return "SERVER BOOST BADGES";
        case "None": return "None";
        case "Staff Discord": return "Staff Discord";
        case "Partnered Server Owner": return "Partnered Server Owner";
        case "HypeSquad Events": return "HypeSquad Events";
        case "Bug Hunter Lvl 1": return "Bug Hunter Lvl 1";
        case "HypeSquad Bravery": return "HypeSquad Bravery";
        case "HypeSquad Brilliance": return "HypeSquad Brilliance";
        case "HypeSquad Balance": return "HypeSquad Balance";
        case "Early Supporter": return "Early Supporter";
        case "Former Moderator": return "Former Moderator";
        case "Bug Hunter Lvl 2": return "Bug Hunter Lvl 2";
        case "Early Verified Bot Developer": return "Early Verified Bot Developer";
        case "Active Developer": return "Active Developer";
        case "Completed a Quest":
        case "Completed a quest": return "Completed a Quest";
        case "Orbs — Apprentice": return "Orbs — Apprentice";
        case "Old username": return "Old username";
        case "Level Reached": return "Level Reached";
        case "Gifting Icon": return "Gifting Icon";
        case "Gifting Patron": return "Gifting Patron";
        case "Gifting Champion": return "Gifting Champion";
        case "Gifting Luminary": return "Gifting Luminary";
        case "Gifting Hero": return "Gifting Hero";
        case "Gifting Legend": return "Gifting Legend";
        default: return key;
    }
}

export function getStandardBadgeDesc(key: string): string {
    switch (key) {
        case "Staff Discord": return "Discord Staff";
        case "Partnered Server Owner": return "Partnered Server Owner";
        case "HypeSquad Events": return "HypeSquad Events";
        case "Bug Hunter Lvl 1": return "Bug Hunter Lvl 1";
        case "HypeSquad Bravery": return "HypeSquad Bravery";
        case "HypeSquad Brilliance": return "HypeSquad Brilliance";
        case "HypeSquad Balance": return "HypeSquad Balance";
        case "Early Supporter": return "Early Supporter";
        case "Former Moderator": return "Discord Moderator Programs Alumni";
        case "Bug Hunter Lvl 2": return "Bug Hunter Lvl 2";
        case "Early Verified Bot Developer": return "Early Verified Bot Developer";
        case "Active Developer": return "Active Developer";
        default: return key;
    }
}

export function getBadgeId(key: string): string {
    switch (key) {
        case "Staff Discord": return "staff";
        case "Partnered Server Owner": return "partner";
        case "HypeSquad Events": return "hypesquad";
        case "Bug Hunter Lvl 1": return "bug_hunter_level_1";
        case "HypeSquad Bravery": return "hypesquad_house_1";
        case "HypeSquad Brilliance": return "hypesquad_house_2";
        case "HypeSquad Balance": return "hypesquad_house_3";
        case "Early Supporter": return "early_supporter";
        case "Former Moderator": return "certified_moderator";
        case "Bug Hunter Lvl 2": return "bug_hunter_level_2";
        case "Early Verified Bot Developer": return "verified_developer";
        case "Active Developer": return "active_developer";
        default: return key.toLowerCase().replace(/ /g, "_");
    }
}

export function normalizeBadgeId(id: string): string {
    if (!id) return "";
    let s = id.toLowerCase();
    s = s.replace("hypesquad_online_house_", "hypesquad_house_");
    s = s.replace("premium_early_supporter", "early_supporter");
    s = s.replace("moderator_programs_alumni", "certified_moderator");
    return s;
}

export function getBadgeIconKey(icon: string): string {
    if (!icon) return "";
    try {
        const parts = icon.split("/");
        const last = parts.pop() || icon;
        return last.split("?")[0].replace(/\.(png|webp|jpg|svg)$/i, "");
    } catch {
        return icon;
    }
}

export function deduplicateProfileBadges(badges: any[]): any[] {
    if (!Array.isArray(badges)) return [];
    const seenIds = new Set<string>();
    const seenIcons = new Set<string>();

    return badges.filter(b => {
        if (!b) return false;

        const rawId = b.id || b.key || "";
        const normId = normalizeBadgeId(rawId);
        const iconKey = getBadgeIconKey(b.icon || b.iconSrc || "");

        if (normId && seenIds.has(normId)) return false;
        if (iconKey && seenIcons.has(iconKey)) return false;

        if (normId) seenIds.add(normId);
        if (iconKey) seenIcons.add(iconKey);

        return true;
    });
}

export function formatFakeConnections(fakeConns: FakeConnection[]) {
    if (!Array.isArray(fakeConns) || fakeConns.length === 0) return [];
    return fakeConns.map(c => {
        const plat = FAKE_PLATFORMS.find(p => p.id === c.platform) || FAKE_PLATFORMS[0];
        let finalUrl = c.url;
        if (!finalUrl && plat.defaultUrl && c.name) {
            try { finalUrl = plat.defaultUrl(c.name); } catch { }
        }
        if (!finalUrl && c.platform === "domain" && c.name) {
            finalUrl = c.name.startsWith("http") ? c.name : `https://${c.name}/`;
        }

        return {
            type: c.platform,
            id: c.name || "connection",
            name: c.name,
            verified: true,
            visibility: 1,
            showActivity: false,
            show_activity: false,
            friendSync: false,
            friend_sync: false,
            metadataVisibility: 0,
            metadata_visibility: 0,
            twoWayLink: false,
            two_way_link: false,
            metadata: {},
            ...(finalUrl ? { url: finalUrl } : {})
        };
    });
}

export function formatNitroBadgeDesc(d: Date | string): string {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (!dateObj || isNaN(dateObj.getTime())) return "Subscriber since";

    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const day = dateObj.getDate().toString().padStart(2, "0");
    const yy = dateObj.getFullYear().toString().slice(-2);
    return `Subscriber since ${month}/${day}/${yy}`;
}

export function formatBoostBadgeDesc(d: Date | string): string {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (!dateObj || isNaN(dateObj.getTime())) return "Server boosting since";

    const day = dateObj.getDate();
    const year = dateObj.getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getMonth()] || "Jan";
    return `Server boosting since ${month} ${day}, ${year}`;
}
