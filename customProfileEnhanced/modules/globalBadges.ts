/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BadgePosition, ProfileBadge } from "@api/Badges";
import { BadgeContextMenu } from "@plugins/_api/badges";
import { classNameFactory } from "@utils/css";
import { ContextMenuApi, React } from "@webpack/common";

export let GlobalBadgesState: Record<string, any[]> = {};
export const INVITE_LINK = "kwHCJPxp8t";
export const cl = classNameFactory("vc-global-badges-");

export const serviceMap: Record<string, string> = {
    badgevault: "BadgeVault",
    nekocord: "Nekocord",
    reviewdb: "ReviewDB",
    aero: "Aero",
    aliucord: "Aliucord",
    raincord: "Raincord",
    velocity: "Velocity",
    enmity: "Enmity",
    paicord: "Paicord",
    bunny: "Bunny",
    goosemod: "GooseMod",
    replugged: "Replugged",
    betterdiscord: "BetterDiscord",
    vendroidenhanced: "VendroidEnhanced",
    revenge: "Revenge",
    record: "ReCord",
    vencord: "Vencord",
    equicord: "Equicord"
};

const blockedMods = ["vencord", "equicord"];

export async function loadBadges(apiUrl: string, settingsStore: any) {
    if (!apiUrl) return;
    try {
        const url = apiUrl.endsWith("/") ? apiUrl + "users" : apiUrl + "/users";
        const globalBadges = await fetch(url, { cache: "no-cache" }).then(r => r.json());
        const filteredUsers: Record<string, any[]> = {};
        const enabledMods: Record<string, boolean> = {
            aero: settingsStore.showAero,
            velocity: settingsStore.showVelocity,
            badgevault: settingsStore.showCustom,
            nekocord: settingsStore.showNekocord,
            reviewdb: settingsStore.showReviewDB,
            aliucord: settingsStore.showAliucord,
            raincord: settingsStore.showRaincord,
            enmity: settingsStore.showEnmity,
            paicord: settingsStore.showPaicord,
            bunny: settingsStore.showBunny,
            goosemod: settingsStore.showGooseMod,
            replugged: settingsStore.showReplugged,
            betterdiscord: settingsStore.showBetterDiscord,
            vendroidenhanced: settingsStore.showVendroidEnhanced,
            revenge: settingsStore.showRevenge,
            record: settingsStore.showReCord
        };

        for (const key in globalBadges?.users) {
            filteredUsers[key] = (globalBadges.users[key] || []).filter((b: any) => {
                const { mod } = b;
                if (!mod || blockedMods.includes(mod)) return false;
                if (enabledMods[mod] === false) return false;

                return true;
            }).map((b: any) => {
                const modFormatted = serviceMap[b.mod] || b.mod;
                const prefix = settingsStore.showModStyle === "prefix" ? `${modFormatted} - ` : "";
                const suffix = settingsStore.showModStyle === "suffix" ? ` - ${modFormatted}` : "";

                const tooltip = prefix + b.tooltip + suffix;
                return {
                    ...b,
                    key: b.tooltip,
                    tooltip
                };
            });
        }

        GlobalBadgesState = filteredUsers;
    } catch (e) {
        console.error("[CustomProfileEnhanced] Failed to load global badges:", e);
    }
}

export function getGlobalBadgesList(userId: string): ProfileBadge[] {
    return (GlobalBadgesState[userId] || []).map((badge, idx) => ({
        id: `global_badges_badge_${idx}`,
        iconSrc: badge.badge,
        description: badge.tooltip,
        position: BadgePosition.START,
        props: {
            style: {
                borderRadius: "50%",
                transform: "scale(0.9)"
            }
        },
        onContextMenu(event, b) {
            ContextMenuApi.openContextMenu(event, () => React.createElement(BadgeContextMenu, { badge: b }));
        },
    } satisfies ProfileBadge));
}
