/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export interface FakeConnection {
    id: string;
    platform: string;
    name: string;
    url?: string;
}

export interface ProfileFrameLayer {
    id: string;
    type: string | number;
    order: string | number;
    anchor: string | number;
    responsive?: boolean;
}

export interface ProfileFrameData {
    skuId: string;
    label: string;
    layers: ProfileFrameLayer[];
    innerWidth: number;
    overflowTop: number;
    overflowBottom: number;
    overflowHorizontal: number;
    expiresAt: null;
    type: 3;
}

export interface AvatarDecorationOverride {
    skuId: string;
    asset: string;
    expiresAt: null;
    expires_at: null;
    type: 0;
}

export interface ProfileEffectOverride {
    skuId: string;
    title?: string;
    description?: string;
    accessibilityLabel?: string;
    reducedMotionSrc?: string;
    thumbnailPreviewSrc?: string;
    staticFrameSrc?: string;
    effects?: unknown[];
    animationType?: number;
    expiresAt: null;
    expireAt: null;
    type: 1;
}

export interface NameplateData {
    skuId: string;
    asset: string;
    label: string;
    palette: string;
    expiresAt: null;
    expires_at: null;
    type: 2;
}

export interface CustomProfileData {
    username?: string;
    globalName?: string;
    avatar?: string;
    banner?: string;
    bio?: string;
    accentColor?: number;
    accentColor2?: number;
    pronouns?: string;
    badgeFlags?: number;
    createdAt?: string;
    nitro?: boolean;
    nitroLevel?: number;
    boostMonths?: number;
    email?: string;
    phone?: string;
    customBadgeIds?: string[];
    oldName?: string;
    levelReached?: number;
    decorationSkuId?: string;
    decorationAsset?: string;
    avatarDecoration?: AvatarDecorationOverride;
    profileEffectId?: string;
    profileEffect?: ProfileEffectOverride;
    nameplateSkuId?: string;
    nameplate?: NameplateData;
    profileFrameSkuId?: string;
    profileFrame?: ProfileFrameData;
    copiedUserId?: string;
    fakeConnections?: FakeConnection[];
}

export interface FakeAccountEntry {
    id: string;
    username: string;
    globalName: string;
    discriminator: string;
    avatar: string | null;
    bot?: boolean;
    _bio?: string;
    _banner?: string | null;
    _accentColor?: number | null;
    _publicFlags?: number;
    _flags?: number;
    _premiumType?: number;
}

export interface GlobalBadgeItem {
    badge: string;
    tooltip: string;
    mod: string;
    key?: string;
}
