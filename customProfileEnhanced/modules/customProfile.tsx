/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { HeaderBarButton } from "@api/HeaderBar";
import { DataStore } from "@api/index";
import { ModalCloseButton as ModalCloseButtonRaw, ModalContent as ModalContentRaw, ModalFooter as ModalFooterRaw, ModalHeader as ModalHeaderRaw, ModalRoot as ModalRootRaw, openModal } from "@utils/modal";
import { AuthenticationStore, IconUtils, React, Select, UserProfileStore, UserStore } from "@webpack/common";

import {
    BADGES,
    BOOST_ICONS,
    BOOST_LABELS,
    DS_ALL_DATA,
    DS_ALL_ENABLED,
    DS_KEY_DATA,
    DS_KEY_ENABLED,
    FAKE_PLATFORMS,
    getLocalizedBadgeLabel,
    LS_ALL_DATA,
    LS_ALL_ENABLED,
    LS_KEY_DATA,
    LS_KEY_ENABLED,
    NITRO_LEVELS,
    OLD_NAME_BADGE_ICON,
    t
} from "../constants";
import { CustomProfileData, FakeConnection } from "../types";
import { extractSkuId, resolveAvatarDecoration, resolveNameplate, resolveProfileEffect, resolveProfileFrame } from "./profileFrame";
import ProfilePreview from "./profilePreview";

const ModalRoot = ModalRootRaw as any;
const ModalHeader = ModalHeaderRaw as any;
const ModalCloseButton = ModalCloseButtonRaw as any;
const ModalContent = ModalContentRaw as any;
const ModalFooter = ModalFooterRaw as any;

export let storedData: CustomProfileData = {};
export let isEnabled = false;
export let allAccountsData: Record<string, CustomProfileData> = {};
export let allAccountsEnabled: Record<string, boolean> = {};
export let _dataVersion = 0;
export let _cachedMyId: string | null = null;

export function isMe(userId: string | null | undefined): boolean {
    if (!userId) return false;
    if (_cachedMyId && _cachedMyId === userId) return true;
    try {
        const authId = AuthenticationStore?.getId?.();
        if (authId) {
            _cachedMyId = authId;
            return authId === userId;
        }
    } catch { }
    try {
        const currentUserId = UserStore?.getCurrentUser?.()?.id;
        if (currentUserId) {
            _cachedMyId = currentUserId;
            return currentUserId === userId;
        }
    } catch { }
    return false;
}

export function updateCachedRealData() {
    try {
        const myId = AuthenticationStore?.getId?.() || UserStore?.getCurrentUser?.()?.id;
        if (myId) _cachedMyId = myId;
    } catch { }
}

export function saveDataSync(data: CustomProfileData, enabled: boolean) {
    try {
        localStorage.setItem(LS_KEY_DATA, JSON.stringify(data));
        localStorage.setItem(LS_KEY_ENABLED, enabled ? "1" : "0");
    } catch { }
}

export function saveAllDataSync() {
    try {
        localStorage.setItem(LS_ALL_DATA, JSON.stringify(allAccountsData));
        localStorage.setItem(LS_ALL_ENABLED, JSON.stringify(allAccountsEnabled));
    } catch { }
}

export function enforceCustomProfile() {
    resetCustomProfileCache();
    forceAccountPanelRerender();
}

export function getCustomDataForUser(userId: string | null | undefined): { data: CustomProfileData; enabled: boolean; } | null {
    if (!userId) return null;
    if (allAccountsData[userId] && allAccountsEnabled[userId] !== false) {
        return { data: allAccountsData[userId], enabled: true };
    }
    if (isMe(userId) && isEnabled) {
        return { data: storedData, enabled: true };
    }
    return null;
}

export function syncCurrentUserData(forcedId?: string) {
    const authId = AuthenticationStore?.getId?.();
    const currentUserId = UserStore?.getCurrentUser?.()?.id;
    const myId = forcedId || authId || currentUserId || _cachedMyId;
    if (myId) {
        _cachedMyId = myId;
        if (allAccountsData[myId]) {
            storedData = allAccountsData[myId];
            isEnabled = allAccountsEnabled[myId] !== false;
        } else if (allAccountsData[""]) {
            storedData = allAccountsData[""];
            isEnabled = allAccountsEnabled[""] !== false;
            allAccountsData[myId] = storedData;
            allAccountsEnabled[myId] = isEnabled;
            delete allAccountsData[""];
            delete allAccountsEnabled[""];
            saveAllDataSync();
        } else {
            storedData = {};
            isEnabled = false;
        }
    } else {
        const keys = Object.keys(allAccountsData);
        if (keys.length === 1 && allAccountsData[keys[0]]) {
            storedData = allAccountsData[keys[0]];
            isEnabled = allAccountsEnabled[keys[0]] !== false;
        }
    }

    if (!myId && (!storedData || Object.keys(storedData).length === 0)) {
        try {
            const raw = localStorage.getItem(LS_KEY_DATA);
            const en = localStorage.getItem(LS_KEY_ENABLED);
            if (raw) {
                storedData = JSON.parse(raw);
                isEnabled = en === "1";
            }
        } catch { }
    }
}

export function loadDataSync() {
    try {
        const rawAll = localStorage.getItem(LS_ALL_DATA);
        if (rawAll) {
            try { allAccountsData = JSON.parse(rawAll); } catch { allAccountsData = {}; }
            const rawEnabled = localStorage.getItem(LS_ALL_ENABLED);
            try { allAccountsEnabled = rawEnabled ? JSON.parse(rawEnabled) : {}; } catch { allAccountsEnabled = {}; }
            syncCurrentUserData();
            return;
        }

        const raw = localStorage.getItem(LS_KEY_DATA);
        const en = localStorage.getItem(LS_KEY_ENABLED);
        if (raw) {
            try { storedData = JSON.parse(raw); } catch { storedData = {}; }
        } else { storedData = {}; }
        isEnabled = en === "1";
    } catch {
        storedData = {};
        isEnabled = false;
    }
}

export async function loadData() {
    try {
        const allData = await DataStore.get(DS_ALL_DATA) as Record<string, CustomProfileData> | null;
        const allEnabled = await DataStore.get(DS_ALL_ENABLED) as Record<string, boolean> | null;
        if (allData && typeof allData === "object" && Object.keys(allData).length > 0) {
            allAccountsData = allData;
            allAccountsEnabled = allEnabled || {};
            syncCurrentUserData();
            saveAllDataSync();
            saveDataSync(storedData, isEnabled);
            enforceCustomProfile();
            return;
        }
        const d = await DataStore.get(DS_KEY_DATA) as CustomProfileData | null;
        const e = await DataStore.get(DS_KEY_ENABLED) as boolean | null;
        if (d !== null) storedData = d;
        if (e !== null) isEnabled = e === true;
        const myId = AuthenticationStore?.getId?.() || UserStore?.getCurrentUser?.()?.id;
        if (myId && storedData && Object.keys(storedData).length > 0) {
            allAccountsData[myId] = storedData;
            allAccountsEnabled[myId] = isEnabled;
            DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
            DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
            saveAllDataSync();
        }
        saveDataSync(storedData, isEnabled);
        enforceCustomProfile();
    } catch (err) { }
}

export function forceAccountPanelRerender() {
    try {
        if (UserStore && UserStore.emitChange) UserStore.emitChange();
        if (UserProfileStore && UserProfileStore.emitChange) UserProfileStore.emitChange();

        const WP = (Vencord as any).Webpack;
        const MAS = WP?.findByProps?.("getUsers", "getValidUsers", "getHasLoggedInAccounts");
        if (MAS && MAS.emitChange) MAS.emitChange();

    } catch { }
}

export function resetCustomProfileCache() {
    _dataVersion++;
}

// ── UI Components ─────────────────────────────────────────────────────────────

export function VerifiedBadge() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, verticalAlign: "middle" }}>
            <path
                d="M12 2L14.39 4.39L17.5 3.5L18.39 6.61L21.5 7.5L20.61 10.61L23 13L20.61 15.39L21.5 18.5L18.39 19.39L17.5 22.5L14.39 21.61L12 24L9.61 21.61L6.5 22.5L5.61 19.39L2.5 18.5L3.39 15.39L1 13L3.39 10.61L2.5 7.5L5.61 6.61L6.5 3.5L9.61 4.39L12 2Z"
                fill="#ffffff"
            />
            <path
                d="M10 16.2L6.5 12.7L7.91 11.29L10 13.38L16.09 7.29L17.5 8.7L10 16.2Z"
                fill="#111214"
            />
        </svg>
    );
}

export function EditIcon({ size = 18 }: { size?: number; }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>;
}
function FolderIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" /></svg>;
}
function CloseIcon() {
    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function TrashIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2h4a1 1 0 1 1 0 2h-1.1l-.9 12.1A3 3 0 0 1 17 23H7a3 3 0 0 1-3-2.9L3.1 8H2a1 1 0 0 1 0-2h4V4Zm2 0v2h6V4H9ZM5.1 8l.9 11.9a1 1 0 0 0 1 .1h6a1 1 0 0 0 1-.1L14.9 8H5.1Z" /></svg>;
}
function SaveIcon() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm3-10H5V5h10v4Z" /></svg>;
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties; }) {
    return <div className="cp-section-label" style={style}>{children}</div>;
}

function Field({ label, value, placeholder, onChange, type = "text" }: {
    label: string; value: string; placeholder?: string; onChange: (v: string) => void; type?: string;
}) {
    return (
        <div className="cp-field">
            <SectionLabel>{label}</SectionLabel>
            <input className="cp-input" type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void; }) {
    const fileRef = React.useRef<HTMLInputElement>(null);
    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { if (ev.target?.result) onChange(ev.target.result as string); };
        reader.readAsDataURL(file);
    }
    return (
        <div className="cp-field">
            <SectionLabel>{label}</SectionLabel>
            <div className="cp-image-card">
                {value && (
                    <img src={value} alt="" className="cp-image-thumb" />
                )}
                <div className="cp-image-inputs">
                    <input
                        className="cp-input cp-url-input"
                        placeholder={t("Paste an image URL...")}
                        value={value.startsWith("data:") ? "" : value}
                        onChange={e => onChange(e.target.value)}
                    />
                    <div className="cp-image-actions">
                        <button className="cp-image-file-btn" onClick={() => fileRef.current?.click()}>
                            <FolderIcon />
                            <span>{t("Browse")}</span>
                        </button>
                        {value && (
                            <button className="cp-image-clear-btn" onClick={() => onChange("")} title={t("Remove")}>
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </div>
        </div>
    );
}

function Toggle({ label, checked, onChange, sublabel }: { label: string; checked: boolean; onChange: (v: boolean) => void; sublabel?: string; }) {
    return (
        <div className="cp-toggle-row" onClick={() => onChange(!checked)}>
            <div className="cp-toggle-text">
                <span className="cp-toggle-label">{label}</span>
                {sublabel && <span className="cp-toggle-sub">{sublabel}</span>}
            </div>
            <div className={`cp-toggle ${checked ? "cp-toggle--on" : ""}`}><div className="cp-toggle-thumb" /></div>
        </div>
    );
}

function BadgeBtn({ label, icon, active, onClick }: { label: string; icon?: string; active: boolean; onClick: () => void; }) {
    return (
        <button onClick={onClick} className={`cp-badge ${active ? "cp-badge--on" : ""}`}
            style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {icon && <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: "contain", flexShrink: 0 }} />}
            <span>{label}</span>
        </button>
    );
}

function BadgePicker({ selected, onChange, nitroType, onNitroType, boostLevel, onBoostLevel, customIds, onCustomIds, oldName, onOldName, levelReached, onLevelReached }: {
    selected: number; onChange: (v: number) => void;
    nitroType: number; onNitroType: (v: number) => void;
    boostLevel: number; onBoostLevel: (v: number) => void;
    customIds: string[]; onCustomIds: (v: string[]) => void;
    oldName: string; onOldName: (v: string) => void;
    levelReached: number; onLevelReached: (v: number) => void;
}) {
    const hasOldName = customIds.includes("oldname");
    return (
        <div className="cp-field">
            <SectionLabel>{getLocalizedBadgeLabel("Badges")}</SectionLabel>
            <div className="cp-badges">
                {BADGES.map(b => (
                    <BadgeBtn key={b.flag} label={getLocalizedBadgeLabel(b.key)} icon={b.icon}
                        active={!!(selected & b.flag)} onClick={() => onChange(selected ^ b.flag)} />
                ))}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{getLocalizedBadgeLabel("Evolving Nitro Badge")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={getLocalizedBadgeLabel("None")} active={nitroType === -1} onClick={() => onNitroType(-1)} />
                {NITRO_LEVELS.map((n, i) => (
                    <BadgeBtn key={i} label={n.label} icon={n.icon} active={nitroType === i} onClick={() => onNitroType(i)} />
                ))}
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{getLocalizedBadgeLabel("Special Badges")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={getLocalizedBadgeLabel("Completed a Quest")}
                    icon="https://cdn.discordapp.com/badge-icons/7d9ae358c8c5e118768335dbe68b4fb8.png"
                    active={customIds.includes("quest")}
                    onClick={() => onCustomIds(customIds.includes("quest") ? customIds.filter(x => x !== "quest") : [...customIds, "quest"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Orbs — Apprentice")}
                    icon="https://cdn.discordapp.com/badge-icons/83d8a1eb09a8d64e59233eec5d4d5c2d.png"
                    active={customIds.includes("orbs")}
                    onClick={() => onCustomIds(customIds.includes("orbs") ? customIds.filter(x => x !== "orbs") : [...customIds, "orbs"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Old username")} icon={OLD_NAME_BADGE_ICON} active={hasOldName}
                    onClick={() => onCustomIds(hasOldName ? customIds.filter(x => x !== "oldname") : [...customIds, "oldname"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Level Reached")}
                    icon="https://cdn.discordapp.com/badge-icons/ca105ad9cfc8580c765101d17bbb2323.png"
                    active={customIds.includes("gifting_level")}
                    onClick={() => onCustomIds(customIds.includes("gifting_level") ? customIds.filter(x => x !== "gifting_level") : [...customIds, "gifting_level"])} />
            </div>
            <SectionLabel style={{ marginTop: 8 }}>{getLocalizedBadgeLabel("Gifting Badges")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={getLocalizedBadgeLabel("Gifting Icon")}
                    icon="https://cdn.discordapp.com/badge-icons/64f2413c9b9803661322aaad25826b62.png"
                    active={customIds.includes("gifting_icon")}
                    onClick={() => onCustomIds(customIds.includes("gifting_icon") ? customIds.filter(x => x !== "gifting_icon") : [...customIds, "gifting_icon"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Gifting Patron")}
                    icon="https://cdn.discordapp.com/badge-icons/ac305d1b9481f312ce4419e7f8296558.png"
                    active={customIds.includes("gifting_patron")}
                    onClick={() => onCustomIds(customIds.includes("gifting_patron") ? customIds.filter(x => x !== "gifting_patron") : [...customIds, "gifting_patron"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Gifting Champion")}
                    icon="https://cdn.discordapp.com/badge-icons/8b7792c4f65953d3ff564f23429cb79e.png"
                    active={customIds.includes("gifting_champion")}
                    onClick={() => onCustomIds(customIds.includes("gifting_champion") ? customIds.filter(x => x !== "gifting_champion") : [...customIds, "gifting_champion"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Gifting Luminary")}
                    icon="https://cdn.discordapp.com/badge-icons/3119f5504b2cd09576a323908c7c3517.png"
                    active={customIds.includes("gifting_luminary")}
                    onClick={() => onCustomIds(customIds.includes("gifting_luminary") ? customIds.filter(x => x !== "gifting_luminary") : [...customIds, "gifting_luminary"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Gifting Hero")}
                    icon="https://cdn.discordapp.com/badge-icons/77d65b1f210014a11eb1582ee06ab684.png"
                    active={customIds.includes("gifting_hero")}
                    onClick={() => onCustomIds(customIds.includes("gifting_hero") ? customIds.filter(x => x !== "gifting_hero") : [...customIds, "gifting_hero"])} />
                <BadgeBtn label={getLocalizedBadgeLabel("Gifting Legend")}
                    icon="https://cdn.discordapp.com/badge-icons/7fe346cfc5da1340087d8759a9e7a395.png"
                    active={customIds.includes("gifting_legend")}
                    onClick={() => onCustomIds(customIds.includes("gifting_legend") ? customIds.filter(x => x !== "gifting_legend") : [...customIds, "gifting_legend"])} />
            </div>
            {hasOldName && (
                <div className="cp-field" style={{ marginTop: 6 }}>
                    <SectionLabel style={{ marginTop: 0 }}>Old username displayed in tooltip</SectionLabel>
                    <input className="cp-input" value={oldName} placeholder="OldUser#0000"
                        onChange={e => onOldName(e.target.value)} />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                        {'Example: User#1234 will appear as "Originally known as User#1234" when hovering the badge.'}
                    </div>
                </div>
            )}
            {customIds.includes("gifting_level") && (
                <div className="cp-field" style={{ marginTop: 6 }}>
                    <SectionLabel style={{ marginTop: 0 }}>Level reached</SectionLabel>
                    <input className="cp-input" type="number" min="1" max="10000" value={levelReached}
                        onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) onLevelReached(val);
                        }} />
                </div>
            )}
            <SectionLabel style={{ marginTop: 8 }}>{getLocalizedBadgeLabel("Server Boost Badges")}</SectionLabel>
            <div className="cp-badges">
                <BadgeBtn label={getLocalizedBadgeLabel("None")} active={boostLevel === -1} onClick={() => onBoostLevel(-1)} />
                {BOOST_LABELS.map((label, i) => (
                    <BadgeBtn key={i} label={label} icon={BOOST_ICONS[i]} active={boostLevel === i} onClick={() => onBoostLevel(i)} />
                ))}
            </div>
        </div>
    );
}

function ConnectionsPicker({ connections, onChange }: {
    connections: FakeConnection[];
    onChange: (conns: FakeConnection[]) => void;
}) {
    const [platform, setPlatform] = React.useState(FAKE_PLATFORMS[0].id);
    const [name, setName] = React.useState("");

    const currentPlat = FAKE_PLATFORMS.find(p => p.id === platform) || FAKE_PLATFORMS[0];

    function handleAdd() {
        if (!name.trim()) return;
        let finalUrl = "";
        if (currentPlat.defaultUrl) {
            try { finalUrl = currentPlat.defaultUrl(name.trim()); } catch { }
        } else if (platform === "domain") {
            finalUrl = name.trim().startsWith("http") ? name.trim() : `https://${name.trim()}/`;
        }

        const newConn: FakeConnection = {
            id: Date.now().toString(),
            platform,
            name: name.trim(),
            ...(finalUrl ? { url: finalUrl } : {}),
        };
        onChange([...connections, newConn]);
        setName("");
    }

    function handleRemove(id: string) {
        onChange(connections.filter(c => c.id !== id));
    }

    const previewUrl = currentPlat.defaultUrl && name.trim() ? currentPlat.defaultUrl(name.trim()) : (platform === "domain" && name.trim() ? (name.trim().startsWith("http") ? name.trim() : `https://${name.trim()}/`) : "");

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{
                padding: "14px 16px",
                background: "rgba(88, 101, 242, 0.08)",
                border: "1px solid rgba(88, 101, 242, 0.2)",
                borderRadius: 12,
                fontSize: 13,
                color: "#dbdee1",
                lineHeight: 1.5
            }}>
                <strong>{t("Profile Connections")}</strong>
                <br />
                {t("Add social links or custom domains (e.g. custom site, X @tag, GitHub, Spotify, TikTok). These connections will appear directly on your Discord profile.")}
            </div>

            <div>
                <SectionLabel>{t("Configured Connections")} ({connections.length})</SectionLabel>
                {connections.length === 0 ? (
                    <div style={{
                        padding: "20px",
                        textAlign: "center",
                        background: "#2b2d31",
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.05)",
                        color: "var(--text-muted)",
                        fontSize: 13
                    }}>
                        {t("No connections added yet. Fill out the form below to add one.")}
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {connections.map(c => {
                            const pObj = FAKE_PLATFORMS.find(p => p.id === c.platform) || FAKE_PLATFORMS[0];
                            return (
                                <div key={c.id} style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "10px 14px",
                                    background: "#2b2d31",
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.06)"
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            background: "#1e1f22",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}>
                                            <img src={pObj.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                                        </div>
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 14, color: "#fff" }}>
                                                <span>{c.name}</span>
                                                <VerifiedBadge />
                                                <span style={{ fontSize: 11, color: "#949ba4", fontWeight: 400 }}>({pObj.label})</span>
                                            </div>
                                            {c.url && (
                                                <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#00a8fc", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                                                    {c.url} ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <button className="cp-clear-btn" onClick={() => handleRemove(c.id)} title={t("Remove")}>
                                        <CloseIcon />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="cp-divider" />

            <div>
                <SectionLabel>{t("Add New Connection")}</SectionLabel>
                <div style={{ marginBottom: 16 }}>
                    <SectionLabel style={{ marginTop: 0, fontSize: 11 }}>{t("Select Platform")}</SectionLabel>
                    <div className="cp-custom-scroll" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(115px, 1fr))", gap: 8, paddingRight: 4 }}>
                        {FAKE_PLATFORMS.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setPlatform(p.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "9px 12px",
                                    borderRadius: 8,
                                    background: platform === p.id ? "rgba(88, 101, 242, 0.2)" : "#2b2d31",
                                    border: platform === p.id ? "1px solid #5865f2" : "1px solid transparent",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease"
                                }}
                            >
                                <img src={p.icon} alt="" style={{ width: 18, height: 18, objectFit: "contain", flexShrink: 0 }} />
                                <span style={{ fontSize: 12, fontWeight: platform === p.id ? 700 : 500, color: platform === p.id ? "#fff" : "#dbdee1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {p.label.split(" ")[0]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Field
                        label={platform === "domain" ? t("Domain / Website Name (e.g. example.com)") : t("Account Name / Username")}
                        value={name}
                        placeholder={currentPlat.placeholder || "username"}
                        onChange={setName}
                    />

                    {name.trim() && (
                        <div style={{ marginTop: 8 }}>
                            <SectionLabel style={{ fontSize: 11 }}>{t("Live Profile Preview")}</SectionLabel>
                            <div style={{
                                padding: "10px 14px",
                                background: "#111214",
                                borderRadius: 8,
                                border: "1px solid #2b2d31",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between"
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <img src={currentPlat.icon} alt="" style={{ width: 20, height: 20, objectFit: "contain" }} />
                                    <div>
                                        <div style={{ color: "#fff", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                                            {name}
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                                        </div>
                                        {previewUrl && <div style={{ fontSize: 11, color: "#949ba4" }}>{previewUrl}</div>}
                                    </div>
                                </div>
                                <span style={{ fontSize: 11, color: "#fff", fontWeight: 600, background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255,255,255,0.15)", padding: "3px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", gap: 5 }}>
                                    <VerifiedBadge /> {t("Verified")}
                                </span>
                            </div>
                        </div>
                    )}

                    <button
                        className="cp-btn cp-btn-primary"
                        onClick={handleAdd}
                        disabled={!name.trim()}
                        style={{ marginTop: 10, alignSelf: "flex-start", opacity: name.trim() ? 1 : 0.5 }}
                    >
                        + {t("Add Connection")}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function CustomProfileModal({ rootProps }: { rootProps: any; }) {
    const currentUid = AuthenticationStore?.getId?.() || UserStore?.getCurrentUser?.()?.id || _cachedMyId || "";
    const [selectedAccountId, setSelectedAccountId] = React.useState(currentUid);
    const [data, setData] = React.useState<CustomProfileData>(() => ({ ...(allAccountsData[currentUid] || storedData || {}) }));
    const [saving, setSaving] = React.useState(false);
    const [collectibleError, setCollectibleError] = React.useState("");
    const nitroLevel = data.nitroLevel ?? -1;
    const boostLevel = data.boostMonths ?? -1;
    const customIds = data.customBadgeIds ?? [];
    const oldName = data.oldName ?? "";
    const levelReached = data.levelReached ?? 1;

    const accounts = React.useMemo(() => {
        try {
            const WP = (Vencord as any).Webpack;
            const MAS = WP?.findByProps?.("getUsers", "getValidUsers");
            if (MAS?.getUsers) {
                const users = MAS.getUsers();
                if (Array.isArray(users) && users.length > 0) return users;
            }
        } catch (e) { }

        const me = UserStore.getCurrentUser();
        return me ? [me] : [];
    }, []);

    React.useEffect(() => {
        const targetId = selectedAccountId || currentUid;
        const newData = allAccountsData[targetId] || (targetId === currentUid ? storedData : {}) || {};
        setData({ ...newData });
    }, [selectedAccountId, currentUid]);

    function set<K extends keyof CustomProfileData>(key: K, val: CustomProfileData[K]) {
        setData(d => ({ ...d, [key]: val }));
    }

    function parseSkuInput(value: string): string | undefined {
        return extractSkuId(value) ?? (value.replace(/\D/g, "") || undefined);
    }

    async function save() {
        try {
            setSaving(true);
            const savedData = { ...data };
            setCollectibleError("");

            const legacyDecorationSkuId = /^\d+$/.test(savedData.decorationAsset ?? "")
                ? savedData.decorationAsset
                : undefined;
            const decorationSkuId = savedData.decorationSkuId?.trim() || legacyDecorationSkuId;
            const profileEffectId = savedData.profileEffectId?.trim();
            const nameplateSkuId = savedData.nameplateSkuId?.trim();
            const profileFrameSkuId = savedData.profileFrameSkuId?.trim();

            const [avatarDecoration, profileEffect, nameplate, profileFrame] = await Promise.all([
                decorationSkuId
                    ? savedData.avatarDecoration?.skuId === decorationSkuId
                        ? savedData.avatarDecoration
                        : resolveAvatarDecoration(decorationSkuId)
                    : null,
                profileEffectId
                    ? savedData.profileEffect?.skuId === profileEffectId
                        ? savedData.profileEffect
                        : resolveProfileEffect(profileEffectId)
                    : null,
                nameplateSkuId
                    ? savedData.nameplate?.skuId === nameplateSkuId
                        ? savedData.nameplate
                        : resolveNameplate(nameplateSkuId)
                    : null,
                profileFrameSkuId
                    ? savedData.profileFrame?.skuId === profileFrameSkuId
                        ? savedData.profileFrame
                        : resolveProfileFrame(profileFrameSkuId)
                    : null
            ]);

            if (decorationSkuId && !avatarDecoration) {
                setCollectibleError(t("This SKU is invalid or is not an Avatar Decoration."));
                return;
            }
            if (profileEffectId && !profileEffect) {
                setCollectibleError(t("This SKU is invalid or is not a Profile Effect."));
                return;
            }
            if (nameplateSkuId && !nameplate) {
                setCollectibleError(t("This SKU is invalid or is not a Nameplate."));
                return;
            }
            if (profileFrameSkuId && !profileFrame) {
                setCollectibleError(t("This SKU is invalid or is not a Profile Frame."));
                return;
            }

            if (decorationSkuId && avatarDecoration) {
                savedData.decorationSkuId = decorationSkuId;
                savedData.decorationAsset = avatarDecoration.asset;
                savedData.avatarDecoration = avatarDecoration;
            } else {
                delete savedData.decorationSkuId;
                delete savedData.decorationAsset;
                delete savedData.avatarDecoration;
            }

            if (profileEffectId && profileEffect) {
                savedData.profileEffectId = profileEffectId;
                savedData.profileEffect = profileEffect;
            } else {
                delete savedData.profileEffectId;
                delete savedData.profileEffect;
            }

            if (nameplateSkuId && nameplate) {
                savedData.nameplateSkuId = nameplateSkuId;
                savedData.nameplate = nameplate;
            } else {
                delete savedData.nameplateSkuId;
                delete savedData.nameplate;
            }

            if (profileFrameSkuId && profileFrame) {
                savedData.profileFrameSkuId = profileFrameSkuId;
                savedData.profileFrame = profileFrame;
            } else {
                delete savedData.profileFrameSkuId;
                delete savedData.profileFrame;
            }

            const activeUid = AuthenticationStore?.getId?.() || UserStore?.getCurrentUser?.()?.id || _cachedMyId || "";
            const targetAccId = selectedAccountId || activeUid;

            if (targetAccId) {
                allAccountsData[targetAccId] = savedData;
                allAccountsEnabled[targetAccId] = true;
            }

            // If it's the currently logged-in active account, update globals
            if (!targetAccId || targetAccId === activeUid || targetAccId === _cachedMyId) {
                storedData = savedData;
                isEnabled = true;
                _cachedMyId = targetAccId || activeUid;
                saveDataSync(storedData, true);
                enforceCustomProfile();
            }

            saveAllDataSync();

            DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
            DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });
            if (targetAccId === activeUid) {
                DataStore.set(DS_KEY_DATA, storedData).catch(() => { });
                DataStore.set(DS_KEY_ENABLED, true).catch(() => { });
            }

            resetCustomProfileCache();
            updateCachedRealData();

            // Emit change on MultiAccountStore so Account Switcher updates immediately!
            try {
                const WP = (Vencord as any).Webpack;
                const MAS = WP?.findByProps?.("getUsers", "getValidUsers");
                MAS?.emitChange?.();
            } catch { }

            forceAccountPanelRerender();
            rootProps.onClose();
        } catch (err) {
            console.error("[CustomProfileEnhanced] save error:", err);
            setCollectibleError(t("Could not load collectible metadata from Discord. Check your connection and try again."));
        } finally {
            setSaving(false);
        }
    }

    async function reset() {
        const currentUid = AuthenticationStore?.getId?.() || UserStore?.getCurrentUser?.()?.id || "";
        const targetAccId = selectedAccountId || currentUid;

        if (targetAccId) {
            delete allAccountsData[targetAccId];
            delete allAccountsEnabled[targetAccId];
        }
        delete allAccountsData[""];
        delete allAccountsEnabled[""];

        if (!targetAccId || targetAccId === currentUid || targetAccId === _cachedMyId) {
            storedData = {};
            isEnabled = false;
            saveDataSync({}, false);
            DataStore.set(DS_KEY_DATA, {}).catch(() => { });
            DataStore.set(DS_KEY_ENABLED, false).catch(() => { });

        }

        saveAllDataSync();
        DataStore.set(DS_ALL_DATA, allAccountsData).catch(() => { });
        DataStore.set(DS_ALL_ENABLED, allAccountsEnabled).catch(() => { });

        resetCustomProfileCache();

        try {
            const WP = (Vencord as any).Webpack;
            const MAS = WP?.findByProps?.("getUsers", "getValidUsers");
            MAS?.emitChange?.();
        } catch { }

        forceAccountPanelRerender();
        rootProps.onClose();
    }

    const [activeTab, setActiveTab] = React.useState("general");
    const accentHex = data.accentColor != null ? "#" + data.accentColor.toString(16).padStart(6, "0") : "";

    return (
        <ModalRoot {...rootProps} className="cp-modal-root" size="large">
            <ModalHeader separator={false}>
                <div className="cp-header">
                    <EditIcon size={20} />
                    <span className="cp-header-title">{t("Custom Profile")}</span>
                </div>
                <div style={{ marginLeft: "auto", marginRight: 8, minWidth: 200 }}>
                    <Select
                        options={accounts.map((acc: any) => ({
                            value: acc.id,
                            label: acc.globalName || acc.username,
                        }))}
                        isSelected={(v: string) => v === selectedAccountId}
                        select={(v: string) => setSelectedAccountId(v)}
                        serialize={(v: string) => v}
                        renderOptionLabel={(o: any) => (
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <img
                                    src={IconUtils.getUserAvatarURL(accounts.find((a: any) => a.id === o.value) || { id: o.value }, false, 20)}
                                    style={{ borderRadius: "50%", width: 20, height: 20 }}
                                />
                                {o.label}
                            </div>
                        )}
                        renderOptionValue={(selected: any[]) => {
                            const option = selected[0];
                            if (!option) return t("Select Account");
                            return (
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <img
                                        src={IconUtils.getUserAvatarURL(accounts.find((a: any) => a.id === option.value) || { id: option.value }, false, 20)}
                                        style={{ borderRadius: "50%", width: 20, height: 20 }}
                                    />
                                    {option.label}
                                </div>
                            );
                        }}
                    />
                </div>
                <ModalCloseButton onClick={rootProps.onClose} />
            </ModalHeader>
            <ModalContent style={{ padding: 0, overflow: "hidden" }}>
                <div className="cp-layout">
                    <ProfilePreview accountId={selectedAccountId || currentUid} data={data} />
                    <div className="cp-tabs">
                        <div className={`cp-tab ${activeTab === "general" ? "cp-tab--active" : ""}`} onClick={() => setActiveTab("general")}>
                            <span>👤</span>
                            <span>{t("Profile")}</span>
                        </div>
                        <div className={`cp-tab ${activeTab === "aesthetics" ? "cp-tab--active" : ""}`} onClick={() => setActiveTab("aesthetics")}>
                            <span>🎨</span>
                            <span>{t("Appearance")}</span>
                        </div>
                        <div className={`cp-tab ${activeTab === "badges" ? "cp-tab--active" : ""}`} onClick={() => setActiveTab("badges")}>
                            <span>🏅</span>
                            <span>{t("Badges & Collectibles")}</span>
                        </div>
                        <div className={`cp-tab ${activeTab === "connections" ? "cp-tab--active" : ""}`} onClick={() => setActiveTab("connections")}>
                            <span>🔗</span>
                            <span>{t("Connections")}</span>
                        </div>
                    </div>
                    <div className="cp-settings-content">
                        {activeTab === "general" && (
                            <>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Displayed Profile Information")}</div>
                                    <Field label={t("Username")} value={data.username ?? ""} placeholder="username" onChange={v => set("username", v)} />
                                    <Field label={t("Display Name / Nickname")} value={data.globalName ?? ""} placeholder="Display Name" onChange={v => set("globalName", v)} />
                                    <Field label={t("About Me / Bio")} value={data.bio ?? ""} placeholder={t("Write something about yourself...")} onChange={v => set("bio", v)} />
                                    <Field label={t("Pronouns")} value={data.pronouns ?? ""} placeholder={t("he/him, she/her, they/them...")} onChange={v => set("pronouns", v)} />
                                    <Field label={t("Discord Member Since")} value={data.createdAt ?? ""} placeholder="2015-05-13" type="date" onChange={v => set("createdAt", v)} />
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Private Information (Local Display Only)")}</div>
                                    <Field label={t("Email Address (Local Display)")} value={data.email ?? ""} placeholder="example@mail.com" onChange={v => set("email", v)} />
                                    <Field label={t("Phone Number (Local Display)")} value={data.phone ?? ""} placeholder="+1 555 123 4567" onChange={v => set("phone", v)} />
                                </div>
                            </>
                        )}
                        {activeTab === "aesthetics" && (
                            <>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Nitro Appearance Preview")}</div>
                                    <Toggle label={t("Enable Nitro appearance")} sublabel={t("Unlock local banner and profile color gradient previews.")} checked={data.nitro ?? false} onChange={v => set("nitro", v)} />
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Profile Images")}</div>
                                    <ImageUpload label={t("Avatar")} value={data.avatar ?? ""} onChange={v => set("avatar", v)} />
                                    {data.nitro && <ImageUpload label={t("Banner (Requires Nitro Appearance)")} value={data.banner ?? ""} onChange={v => set("banner", v)} />}
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Profile Colors / Gradient")}</div>
                                    <div className="cp-color-row" style={{ marginBottom: 10 }}>
                                        <span style={{ fontSize: 13, color: "var(--text-muted)", width: 60 }}>{t("Color 1")}</span>
                                        <input type="color" value={accentHex || "#5865f2"} onChange={e => { const n = parseInt(e.target.value.replace("#", ""), 16); if (!isNaN(n)) set("accentColor", n); }} className="cp-color-swatch" />
                                        <input value={accentHex} placeholder="#5865f2" onChange={e => { const h = e.target.value.replace("#", ""); const n = parseInt(h, 16); if (!isNaN(n) && h.length === 6) set("accentColor", n); else if (!e.target.value || e.target.value === "#") set("accentColor", undefined); }} className="cp-input cp-color-input" />
                                        {data.accentColor != null && <button className="cp-clear-btn" onClick={() => set("accentColor", undefined)}><CloseIcon /></button>}
                                    </div>
                                    <div className="cp-color-row">
                                        <span style={{ fontSize: 13, color: "var(--text-muted)", width: 60 }}>{t("Color 2")}</span>
                                        {(() => {
                                            const hex2 = data.accentColor2 != null ? "#" + data.accentColor2.toString(16).padStart(6, "0") : ""; return (<>
                                                <input type="color" value={hex2 || "#eb459e"} onChange={e => { const n = parseInt(e.target.value.replace("#", ""), 16); if (!isNaN(n)) set("accentColor2", n); }} className="cp-color-swatch" />
                                                <input value={hex2} placeholder="#eb459e (optional)" onChange={e => { const h = e.target.value.replace("#", ""); const n = parseInt(h, 16); if (!isNaN(n) && h.length === 6) set("accentColor2", n); else if (!e.target.value || e.target.value === "#") set("accentColor2", undefined); }} className="cp-input cp-color-input" />
                                                {data.accentColor2 != null && <button className="cp-clear-btn" onClick={() => set("accentColor2", undefined)}><CloseIcon /></button>}
                                            </>);
                                        })()}
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{t("Quick color presets:")}</div>
                                        <div className="cp-preset-colors">
                                            {[
                                                { label: "Blurple", hex: "#5865F2", val: 0x5865F2 },
                                                { label: "Green", hex: "#57F287", val: 0x57F287 },
                                                { label: "Yellow", hex: "#FEE75C", val: 0xFEE75C },
                                                { label: "Fuchsia", hex: "#EB459E", val: 0xEB459E },
                                                { label: "Red", hex: "#ED4245", val: 0xED4245 },
                                                { label: "Cyan", hex: "#00A8FC", val: 0x00A8FC },
                                                { label: "Dark", hex: "#2B2D31", val: 0x2B2D31 },
                                            ].map(p => (
                                                <div
                                                    key={p.val}
                                                    className="cp-preset-dot"
                                                    style={{ backgroundColor: p.hex }}
                                                    title={p.label}
                                                    onClick={() => set("accentColor", p.val)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {activeTab === "badges" && (
                            <>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Account Badges (Discord Badges)")}</div>
                                    <BadgePicker
                                        selected={data.badgeFlags ?? 0} onChange={v => set("badgeFlags", v)}
                                        nitroType={nitroLevel} onNitroType={v => {
                                            set("nitroLevel", v as any);
                                            if (v >= 0) {
                                                set("nitro", true);
                                            } else {
                                                set("nitro", false);
                                            }
                                        }}
                                        boostLevel={boostLevel} onBoostLevel={v => set("boostMonths", v)}
                                        customIds={customIds} onCustomIds={v => set("customBadgeIds", v)}
                                        oldName={oldName} onOldName={v => set("oldName", v)}
                                        levelReached={levelReached} onLevelReached={v => set("levelReached", v)}
                                    />
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Avatar Decoration")}</div>
                                    <div className="cp-field">
                                        <SectionLabel>{t("Custom SKU ID")}</SectionLabel>
                                        <input
                                            className="cp-input"
                                            value={data.decorationSkuId ?? data.avatarDecoration?.skuId ?? (/^\d+$/.test(data.decorationAsset ?? "") ? data.decorationAsset : "")}
                                            placeholder={t("Paste an Avatar Decoration shop link or SKU ID")}
                                            onChange={event => {
                                                const decorationSkuId = parseSkuInput(event.target.value);
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    decorationSkuId,
                                                    decorationAsset: undefined,
                                                    avatarDecoration: current.avatarDecoration?.skuId === decorationSkuId
                                                        ? current.avatarDecoration
                                                        : undefined
                                                }));
                                            }}
                                        />
                                        <div className="cp-field-hint">{t("Paste the link copied directly from the item's Discord Shop page.")}</div>
                                    </div>
                                    <div className="cp-effect-grid">
                                        <button
                                            onClick={() => {
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    decorationSkuId: undefined,
                                                    decorationAsset: undefined,
                                                    avatarDecoration: undefined
                                                }));
                                            }}
                                            className={`cp-effect-chip ${!data.decorationSkuId && !data.decorationAsset ? "cp-effect-chip--on" : ""}`}
                                        >
                                            <span className="cp-effect-none-icon">✕</span>
                                            {t("None")}
                                        </button>
                                    </div>
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Profile Effect")}</div>
                                    <div className="cp-field">
                                        <SectionLabel>{t("Custom SKU ID")}</SectionLabel>
                                        <input
                                            className="cp-input"
                                            value={data.profileEffectId ?? ""}
                                            placeholder={t("Paste a Profile Effect shop link or SKU ID")}
                                            onChange={event => {
                                                const profileEffectId = parseSkuInput(event.target.value);
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    profileEffectId,
                                                    profileEffect: current.profileEffect?.skuId === profileEffectId
                                                        ? current.profileEffect
                                                        : undefined
                                                }));
                                            }}
                                        />
                                        <div className="cp-field-hint">{t("Paste the link copied directly from the item's Discord Shop page.")}</div>
                                    </div>
                                    <div className="cp-effect-grid">
                                        <button
                                            onClick={() => {
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    profileEffectId: undefined,
                                                    profileEffect: undefined
                                                }));
                                            }}
                                            className={`cp-effect-chip ${!data.profileEffectId ? "cp-effect-chip--on" : ""}`}
                                        >
                                            <span className="cp-effect-none-icon">✕</span>
                                            {t("None")}
                                        </button>
                                    </div>
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Nameplate")}</div>
                                    <div className="cp-field">
                                        <SectionLabel>{t("Custom SKU ID")}</SectionLabel>
                                        <input
                                            className="cp-input"
                                            value={data.nameplateSkuId ?? ""}
                                            placeholder={t("Paste a Nameplate shop link or SKU ID")}
                                            onChange={event => {
                                                const nameplateSkuId = parseSkuInput(event.target.value);
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    nameplateSkuId,
                                                    nameplate: current.nameplate?.skuId === nameplateSkuId
                                                        ? current.nameplate
                                                        : undefined
                                                }));
                                            }}
                                        />
                                        <div className="cp-field-hint">{t("Asset metadata, palette and labels are fetched once when you save.")}</div>
                                    </div>
                                    <div className="cp-effect-grid">
                                        <button
                                            onClick={() => {
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    nameplateSkuId: undefined,
                                                    nameplate: undefined
                                                }));
                                            }}
                                            className={`cp-effect-chip ${!data.nameplateSkuId ? "cp-effect-chip--on" : ""}`}
                                        >
                                            <span className="cp-effect-none-icon">✕</span>
                                            {t("None")}
                                        </button>
                                    </div>
                                </div>
                                <div className="cp-card-section">
                                    <div className="cp-card-section-title">{t("Profile Frame (Experimental)")}</div>
                                    <div className="cp-field">
                                        <SectionLabel>{t("Custom SKU ID")}</SectionLabel>
                                        <input
                                            className="cp-input"
                                            value={data.profileFrameSkuId ?? ""}
                                            placeholder={t("Paste a Profile Frame shop link or SKU ID")}
                                            onChange={event => {
                                                const profileFrameSkuId = parseSkuInput(event.target.value);
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    profileFrameSkuId,
                                                    profileFrame: current.profileFrame?.skuId === profileFrameSkuId
                                                        ? current.profileFrame
                                                        : undefined
                                                }));
                                            }}
                                        />
                                        <div className="cp-field-hint">
                                            {t("Layer metadata is fetched once when you save and cached locally. The frame is spoofed only on this device.")}
                                        </div>
                                    </div>
                                    <div className="cp-effect-grid">
                                        <button
                                            onClick={() => {
                                                setCollectibleError("");
                                                setData(current => ({
                                                    ...current,
                                                    profileFrameSkuId: undefined,
                                                    profileFrame: undefined
                                                }));
                                            }}
                                            className={`cp-effect-chip ${!data.profileFrameSkuId ? "cp-effect-chip--on" : ""}`}
                                        >
                                            <span className="cp-effect-none-icon">✕</span>
                                            {t("None")}
                                        </button>
                                    </div>
                                </div>
                                <div className="cp-sku-guide">
                                    <strong>{t("How to get a SKU ID")}</strong>
                                    <span>{t("Open the exact item in the Discord Shop, choose Copy Link and paste the entire link into the matching field. The plugin extracts the number after itemSkuId=. Each SKU must match the field type: Avatar Decoration, Profile Effect, Nameplate or Profile Frame.")}</span>
                                </div>
                                {collectibleError && <div className="cp-field-error">{collectibleError}</div>}
                            </>
                        )}
                        {activeTab === "connections" && (
                            <div className="cp-card-section">
                                <ConnectionsPicker
                                    connections={data.fakeConnections ?? []}
                                    onChange={conns => set("fakeConnections", conns)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </ModalContent>
            <ModalFooter className="cp-footer">
                <button className="cp-btn cp-btn-ghost" onClick={rootProps.onClose}>{t("Cancel")}</button>
                <button className="cp-btn cp-btn-danger" onClick={reset}><TrashIcon /><span>{t("Reset")}</span></button>
                <button className="cp-btn cp-btn-primary" onClick={save} disabled={saving}><SaveIcon /><span>{saving ? t("Saving...") : t("Save")}</span></button>
            </ModalFooter>
        </ModalRoot>
    );
}

export function CustomProfileButton() {
    return <HeaderBarButton icon={() => <EditIcon size={18} />} tooltip={t("Custom Profile")} onClick={() => openModal(props => <CustomProfileModal rootProps={props} />)} />;
}
