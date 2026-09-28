/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { RestAPI } from "@webpack/common";

import type { AvatarDecorationOverride, NameplateData, ProfileEffectOverride, ProfileFrameData, ProfileFrameLayer } from "../types";

interface RawRecord {
    [key: string]: unknown;
}

const mergedCollectiblesCache = new WeakMap<object, { frame?: ProfileFrameData; nameplate?: NameplateData; value: object; }>();
const emptyCollectiblesCache = new Map<string, object>();

function isRecord(value: unknown): value is RawRecord {
    return typeof value === "object" && value !== null;
}

function readString(record: RawRecord, camelKey: string, snakeKey = camelKey): string | undefined {
    const value = record[camelKey] ?? record[snakeKey];
    return typeof value === "string" || typeof value === "number" ? String(value) : undefined;
}

function readNumber(record: RawRecord, camelKey: string, snakeKey: string): number | undefined {
    const value = record[camelKey] ?? record[snakeKey];
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readLayerValue(record: RawRecord, key: string): string | number | undefined {
    const value = record[key];
    return typeof value === "string" || typeof value === "number" ? value : undefined;
}

function normalizeLayer(value: unknown): ProfileFrameLayer | null {
    if (!isRecord(value)) return null;

    const id = readString(value, "id");
    const type = readLayerValue(value, "type");
    const order = readLayerValue(value, "order");
    const anchor = readLayerValue(value, "anchor");
    if (!id || type == null || order == null || anchor == null) return null;

    const { responsive } = value;
    return {
        id,
        type,
        order,
        anchor,
        ...(typeof responsive === "boolean" ? { responsive } : {})
    };
}

function normalizeFrame(value: unknown, requestedSkuId: string): ProfileFrameData | null {
    if (!isRecord(value) || value.type !== 3 || !Array.isArray(value.layers)) return null;

    const skuId = readString(value, "skuId", "sku_id") ?? requestedSkuId;
    if (skuId !== requestedSkuId) return null;

    const layers = value.layers.map(normalizeLayer);
    if (layers.length === 0 || layers.some(layer => layer == null)) return null;

    const innerWidth = readNumber(value, "innerWidth", "inner_width");
    const overflowTop = readNumber(value, "overflowTop", "overflow_top");
    const overflowBottom = readNumber(value, "overflowBottom", "overflow_bottom");
    const overflowHorizontal = readNumber(value, "overflowHorizontal", "overflow_horizontal");
    if (innerWidth == null || overflowTop == null || overflowBottom == null || overflowHorizontal == null) return null;

    return {
        skuId,
        label: readString(value, "label") ?? "Profile Frame",
        layers: layers as ProfileFrameLayer[],
        innerWidth,
        overflowTop,
        overflowBottom,
        overflowHorizontal,
        expiresAt: null,
        type: 3
    };
}

function normalizeAvatarDecoration(value: unknown, requestedSkuId: string): AvatarDecorationOverride | null {
    if (!isRecord(value) || value.type !== 0) return null;

    const skuId = readString(value, "skuId", "sku_id") ?? requestedSkuId;
    const asset = readString(value, "asset");
    if (skuId !== requestedSkuId || !asset) return null;

    return {
        skuId,
        asset,
        expiresAt: null,
        expires_at: null,
        type: 0
    };
}

function normalizeProfileEffect(value: unknown, requestedSkuId: string): ProfileEffectOverride | null {
    if (!isRecord(value) || value.type !== 1) return null;

    const skuId = readString(value, "skuId", "sku_id") ?? requestedSkuId;
    if (skuId !== requestedSkuId) return null;

    const animationType = readNumber(value, "animationType", "animation_type");
    return {
        skuId,
        title: readString(value, "title"),
        description: readString(value, "description"),
        accessibilityLabel: readString(value, "accessibilityLabel", "accessibility_label"),
        reducedMotionSrc: readString(value, "reducedMotionSrc", "reduced_motion_src"),
        thumbnailPreviewSrc: readString(value, "thumbnailPreviewSrc", "thumbnail_preview_src"),
        staticFrameSrc: readString(value, "staticFrameSrc", "static_frame_src"),
        effects: Array.isArray(value.effects) ? value.effects : undefined,
        animationType,
        expiresAt: null,
        expireAt: null,
        type: 1
    };
}

function normalizeNameplate(value: unknown, requestedSkuId: string): NameplateData | null {
    if (!isRecord(value) || value.type !== 2) return null;

    const skuId = readString(value, "skuId", "sku_id") ?? requestedSkuId;
    const asset = readString(value, "asset");
    const palette = readString(value, "palette");
    if (skuId !== requestedSkuId || !asset || !palette) return null;

    return {
        skuId,
        asset,
        label: readString(value, "label") ?? "Nameplate",
        palette,
        expiresAt: null,
        expires_at: null,
        type: 2
    };
}

type Normalizer<T> = (value: unknown, requestedSkuId: string) => T | null;

function findCollectible<T>(value: unknown, requestedSkuId: string, normalize: Normalizer<T>, visited = new Set<object>()): T | null {
    if (!isRecord(value) || visited.has(value)) return null;
    visited.add(value);

    const direct = normalize(value, requestedSkuId);
    if (direct) return direct;

    for (const key of ["items", "variants", "bundledProducts", "bundled_products"]) {
        const children = value[key];
        if (!Array.isArray(children)) continue;

        for (const child of children) {
            const collectible = findCollectible(child, requestedSkuId, normalize, visited);
            if (collectible) return collectible;
        }
    }

    return null;
}

async function resolveCollectible<T>(skuId: string, normalize: Normalizer<T>): Promise<T | null> {
    if (!/^\d+$/.test(skuId)) return null;

    const response = await RestAPI.get({
        url: `/collectibles-products/${skuId}`,
        retries: 2
    });

    return findCollectible(response.body, skuId, normalize);
}

export function extractSkuId(value: string): string | undefined {
    const linkMatch = value.match(/[?&#]itemSkuId=(\d+)/i);
    if (linkMatch) return linkMatch[1];

    const skuMatch = value.match(/\b\d{15,22}\b/);
    return skuMatch?.[0];
}

export function resolveAvatarDecoration(skuId: string): Promise<AvatarDecorationOverride | null> {
    return resolveCollectible(skuId, normalizeAvatarDecoration);
}

export function resolveProfileEffect(skuId: string): Promise<ProfileEffectOverride | null> {
    return resolveCollectible(skuId, normalizeProfileEffect);
}

export function resolveNameplate(skuId: string): Promise<NameplateData | null> {
    return resolveCollectible(skuId, normalizeNameplate);
}

export async function resolveProfileFrame(skuId: string): Promise<ProfileFrameData | null> {
    return resolveCollectible(skuId, normalizeFrame);
}

export function withCollectibles(original: unknown, frame?: ProfileFrameData, nameplate?: NameplateData): object {
    if (isRecord(original)) {
        const cached = mergedCollectiblesCache.get(original);
        if (cached && cached.frame === frame && cached.nameplate === nameplate) return cached.value;

        const value = {
            ...original,
            ...(frame ? { profileFrame: frame, profile_frame: frame } : {}),
            ...(nameplate ? { nameplate } : {})
        };
        mergedCollectiblesCache.set(original, { frame, nameplate, value });
        return value;
    }

    const cacheKey = `${frame?.skuId ?? ""}:${nameplate?.skuId ?? ""}`;
    const cached = emptyCollectiblesCache.get(cacheKey);
    if (cached) return cached;

    const value = {
        ...(frame ? { profileFrame: frame, profile_frame: frame } : {}),
        ...(nameplate ? { nameplate } : {})
    };
    emptyCollectiblesCache.set(cacheKey, value);
    return value;
}
