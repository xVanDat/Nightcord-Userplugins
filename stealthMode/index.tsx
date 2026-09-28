// @ts-nocheck
/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

import style from "./style.css?managed";

const STORAGE_KEY = "equicord_stealthMode";
let stealthActive = false;
try { stealthActive = localStorage.getItem(STORAGE_KEY) === "1"; } catch { }

function isStealthModeEnabled(): boolean {
    return stealthActive;
}

function syncStealthBodyClass() {
    document.body?.classList.toggle("equicord-stealth", stealthActive);
}

function toggleStealthMode() {
    stealthActive = !stealthActive;
    try { localStorage.setItem(STORAGE_KEY, stealthActive ? "1" : "0"); } catch { }
    syncStealthBodyClass();
}

function onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey && event.code === "KeyH") {
        event.preventDefault();
        toggleStealthMode();
    }
}

export { toggleStealthMode as doToggle };

export function isStealthEnabled(): boolean {
    return isStealthModeEnabled();
}

export default definePlugin({
    name: "StealthMode",
    enabledByDefault: true,
    description: "Hides all plugin buttons without disabling them. Shortcut: Ctrl+Shift+H. The toggle is in Equicord Settings.",
    authors: [{ name: "Original contributors",
     id: 0n }],
    required: true,
    managedStyle: style,

    start() {
        syncStealthBodyClass();
        document.addEventListener("keydown", onKeyDown);
    },

    stop() {
        document.removeEventListener("keydown", onKeyDown);
        document.body.classList.remove("equicord-stealth");
    },
});
