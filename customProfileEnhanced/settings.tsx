/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { React, Toasts } from "@webpack/common";

import { loadBadges } from "./modules/globalBadges";

const ManaSelect = findComponentByCodeLazy('"data-mana-component":"select"');

const badgeOptions = [
    { label: "BadgeVault", value: "showCustom" },
    { label: "Nekocord", value: "showNekocord" },
    { label: "ReviewDB", value: "showReviewDB" },
    { label: "Aero", value: "showAero" },
    { label: "Aliucord", value: "showAliucord" },
    { label: "Raincord", value: "showRaincord" },
    { label: "Velocity", value: "showVelocity" },
    { label: "Enmity", value: "showEnmity" },
    { label: "Paicord", value: "showPaicord" },
    { label: "Bunny", value: "showBunny" },
    { label: "GooseMod", value: "showGooseMod" },
    { label: "Replugged", value: "showReplugged" },
    { label: "BetterDiscord", value: "showBetterDiscord" },
    { label: "Vendroid Enhanced", value: "showVendroidEnhanced" },
    { label: "Revenge", value: "showRevenge" },
    { label: "ReCord", value: "showReCord" }
] as const;

const badgeManaOptions = badgeOptions.map(opt => ({ ...opt, id: opt.value }));
const badgeSettingKeys = badgeOptions.map(opt => opt.value);

function ShowClientModsSetting() {
    const currentSettings = settings.use(badgeSettingKeys);
    const selectedValues = badgeOptions.filter(o => currentSettings[o.value]).map(o => o.value);

    async function updateSelection(value: any) {
        const selectedKeys = new Set(Array.isArray(value) ? value : value ? [value] : []);
        for (const o of badgeOptions) {
            settings.store[o.value] = selectedKeys.has(o.value);
        }
        await loadBadges(settings.store.apiUrl, settings.store);
    }

    return (
        <ManaSelect
            label="Select Client Mods"
            options={badgeManaOptions}
            value={selectedValues}
            closeOnSelect={false}
            maxOptionsVisible={7}
            selectionMode="multiple"
            wrapTags={true}
            onSelectionChange={updateSelection}
        />
    );
}

export const settings = definePluginSettings({
    // ── 1. Global Badges Section ───────────────────────────────────────────
    showModStyle: {
        type: OptionType.SELECT,
        description: "Controls how the client mod name appears in badge tooltips.",
        default: "none",
        options: [
            { label: "Do not show the mod name", value: "none" },
            { label: "Show as a prefix, for example Replugged - Staff", value: "prefix" },
            { label: "Show as a suffix, for example Staff - Replugged", value: "suffix" },
        ]
    },
    apiUrl: {
        type: OptionType.STRING,
        description: "API URL used to load Global Badges.",
        default: "https://badges.equicord.org/",
        restartNeeded: false,
        isValid: (value => !!value)
    },
    showClientMods: {
        type: OptionType.COMPONENT,
        description: "Select which client mod badges are shown on profiles.",
        component: ShowClientModsSetting,
    },
    refetchBadgesButton: {
        type: OptionType.COMPONENT,
        description: "Reload Global Badges data from the configured server.",
        component: () => (
            <button
                className="cp-btn cp-btn-ghost"
                onClick={async () => {
                    await loadBadges(settings.store.apiUrl, settings.store);
                    Toasts.show({
                        id: Toasts.genId(),
                        message: "Global Badges data reloaded successfully!",
                        type: Toasts.Type.SUCCESS
                    });
                }}
                style={{
                    backgroundColor: "#2b2d31",
                    color: "#dbdee1",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%"
                }}
            >
                🔄 Reload Global Badges
            </button>
        )
    },
    showCustom: { type: OptionType.BOOLEAN, description: "Show Custom Badges", default: true, restartNeeded: false, hidden: true },
    showNekocord: { type: OptionType.BOOLEAN, description: "Show Nekocord Badges", default: true, restartNeeded: false, hidden: true },
    showReviewDB: { type: OptionType.BOOLEAN, description: "Show ReviewDB Badges", default: true, restartNeeded: false, hidden: true },
    showAero: { type: OptionType.BOOLEAN, description: "Show Aero Badges", default: true, restartNeeded: false, hidden: true },
    showAliucord: { type: OptionType.BOOLEAN, description: "Show Aliucord Badges", default: true, restartNeeded: false, hidden: true },
    showRaincord: { type: OptionType.BOOLEAN, description: "Show Raincord Badges", default: true, restartNeeded: false, hidden: true },
    showVelocity: { type: OptionType.BOOLEAN, description: "Show Velocity Badges", default: true, restartNeeded: false, hidden: true },
    showEnmity: { type: OptionType.BOOLEAN, description: "Show Enmity Badges", default: true, restartNeeded: false, hidden: true },
    showPaicord: { type: OptionType.BOOLEAN, description: "Show Paicord Badges", default: true, restartNeeded: false, hidden: true },
    showBunny: { type: OptionType.BOOLEAN, description: "Show Bunny Badges", default: true, restartNeeded: false, hidden: true },
    showGooseMod: { type: OptionType.BOOLEAN, description: "Show GooseMod Badges", default: true, restartNeeded: false, hidden: true },
    showReplugged: { type: OptionType.BOOLEAN, description: "Show Replugged Badges", default: true, restartNeeded: false, hidden: true },
    showBetterDiscord: { type: OptionType.BOOLEAN, description: "Show BetterDiscord Badges", default: true, restartNeeded: false, hidden: true },
    showVendroidEnhanced: { type: OptionType.BOOLEAN, description: "Show Vendroid Enhanced Badges", default: true, restartNeeded: false, hidden: true },
    showRevenge: { type: OptionType.BOOLEAN, description: "Show Revenge Badges", default: true, restartNeeded: false, hidden: true },
    showReCord: { type: OptionType.BOOLEAN, description: "Show ReCord Badges", default: true, restartNeeded: false, hidden: true }
});
