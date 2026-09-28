/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { NavContextMenuPatchCallback } from "@api/ContextMenu";
import * as DataStore from "@api/DataStore";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { openModal } from "@utils/modal";
import type { Activity, RenderModalProps, User } from "@vencord/discord-types";
import { ActivityFlags, ActivityType } from "@vencord/discord-types/enums";
import { Menu, Modal, PresenceStore, TextInput, useState } from "@webpack/common";

const STORE_KEY = "CustomProfileEnhanced_customStatuses";

interface LocalCustomStatus {
    text: string;
}

let statuses: Record<string, LocalCustomStatus> = {};
let activities = new Map<string, Activity>();
let mergedActivities = new WeakMap<Activity[], Map<string, Activity[]>>();
let originalGetActivities: typeof PresenceStore.getActivities | undefined;
let patchedGetActivities: typeof PresenceStore.getActivities | undefined;

function parseStatuses(value: unknown): Record<string, LocalCustomStatus> {
    if (!value || typeof value !== "object") return {};

    const parsed: Record<string, LocalCustomStatus> = {};
    for (const [userId, status] of Object.entries(value)) {
        if (!/^\d+$/.test(userId) || !status || typeof status !== "object") continue;
        const text = Reflect.get(status, "text");
        if (typeof text === "string" && text.trim()) parsed[userId] = { text: text.trim().slice(0, 128) };
    }
    return parsed;
}

function rebuildActivities() {
    activities = new Map(Object.entries(statuses).map(([userId, status]) => [
        userId,
        {
            id: "custom",
            name: "Custom Status",
            type: ActivityType.CUSTOM_STATUS,
            state: status.text,
            flags: 0 as ActivityFlags
        }
    ]));
    mergedActivities = new WeakMap();
}

async function saveStatus(userId: string, text: string) {
    statuses = { ...statuses, [userId]: { text } };
    rebuildActivities();
    await DataStore.set(STORE_KEY, statuses);
    PresenceStore.emitChange();
}

async function deleteStatus(userId: string) {
    const next = { ...statuses };
    delete next[userId];
    statuses = next;
    rebuildActivities();
    await DataStore.set(STORE_KEY, statuses);
    PresenceStore.emitChange();
}

function LocalCustomStatusModal({ modalProps, user }: { modalProps: RenderModalProps; user: User; }) {
    const existingStatus = statuses[user.id];
    const [text, setText] = useState(existingStatus?.text ?? "");

    return (
        <Modal
            {...modalProps}
            size="sm"
            title={`Local Custom Status for ${user.globalName ?? user.username}`}
            actions={[
                {
                    text: "Save",
                    variant: "primary",
                    disabled: !text.trim(),
                    onClick: async () => {
                        await saveStatus(user.id, text.trim().slice(0, 128));
                        modalProps.onClose();
                    }
                },
                ...(existingStatus ? [{
                    text: "Delete Status",
                    variant: "dangerPrimary" as const,
                    onClick: async () => {
                        await deleteStatus(user.id);
                        modalProps.onClose();
                    }
                }] : []),
                {
                    text: "Cancel",
                    variant: "secondary",
                    onClick: modalProps.onClose
                }
            ]}
        >
            <Heading tag="h3" className="cp-dev-status-description">
                This status is shown only on your device while the user is Online or Idle. No status data is sent to Discord.
            </Heading>
            <TextInput
                value={text}
                maxLength={128}
                onChange={setText}
                placeholder="Enter a custom status..."
            />
        </Modal>
    );
}

export const patchCustomStatusContextMenu: NavContextMenuPatchCallback = (children, { user }) => {
    if (!user) return;

    children.push(
        <Menu.MenuItem
            id="custom-profile-enhanced-custom-status"
            label={statuses[user.id] ? "Edit Local Custom Status" : "Set Local Custom Status"}
            action={() => openModal(modalProps => (
                <ErrorBoundary>
                    <LocalCustomStatusModal modalProps={modalProps} user={user} />
                </ErrorBoundary>
            ))}
        />
    );
};

export async function initCustomStatuses() {
    statuses = parseStatuses(await DataStore.get<unknown>(STORE_KEY));
    rebuildActivities();

    if (originalGetActivities) return;

    const original = PresenceStore.getActivities;
    originalGetActivities = original;
    patchedGetActivities = (userId, guildId) => {
        const currentActivities = original.call(PresenceStore, userId, guildId);
        const customStatus = activities.get(userId);
        if (!customStatus) return currentActivities;

        const status = PresenceStore.getStatus(userId, guildId);
        if (status !== "online" && status !== "idle") return currentActivities;

        const cached = mergedActivities.get(currentActivities)?.get(userId);
        if (cached) return cached;

        const merged = currentActivities.filter(activity => activity.type !== ActivityType.CUSTOM_STATUS);
        merged.push(customStatus);

        const perUser = mergedActivities.get(currentActivities) ?? new Map<string, Activity[]>();
        perUser.set(userId, merged);
        mergedActivities.set(currentActivities, perUser);
        return merged;
    };
    PresenceStore.getActivities = patchedGetActivities;
    PresenceStore.emitChange();
}

export function stopCustomStatuses() {
    if (originalGetActivities && patchedGetActivities && PresenceStore.getActivities === patchedGetActivities) {
        PresenceStore.getActivities = originalGetActivities;
    }
    originalGetActivities = undefined;
    patchedGetActivities = undefined;
    statuses = {};
    activities.clear();
    mergedActivities = new WeakMap();
    PresenceStore.emitChange();
}
