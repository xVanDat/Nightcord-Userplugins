/*
 * Original, a Discord client mod
 * Ported from PasscodeLock by arg0NNY (https://github.com/okdevme/DiscordPlugins)
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./style.css";

import * as DataStore from "@api/DataStore";
import { HeaderBarButton } from "@api/HeaderBar";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import type { Activity } from "@vencord/discord-types";
import { ActivityType } from "@vencord/discord-types/enums";
import {
    createRoot,
    FluxDispatcher,
    MediaEngineStore,
    PresenceStore,
    React,
    showToast,
    Toasts,
    useEffect,
    useRef,
    useState,
    useStateFromStores,
    VoiceActions,
    IconUtils,
    UserStore
} from "@webpack/common";

let _lockStartupTimer1: ReturnType<typeof setTimeout> | undefined;
let _lockStartupTimer2: ReturnType<typeof setTimeout> | undefined;

function getUserAssets() {
    const user = UserStore.getCurrentUser();
    if (!user) return { avatarUrl: "", username: "Người dùng" };
    const avatarUrl = IconUtils.getUserAvatarURL(user, false, 128);
    return { avatarUrl, username: user.globalName || user.username || "Người dùng" };
}

function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, char => {
        switch (char) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case "\"": return "&quot;";
            default: return "&#39;";
        }
    });
}

const DS_KEY = "PasscodeLock_data";
const MAX_CODE_LENGTH = 15;

const NotificationModule = findByPropsLazy("showNotification", "hasPermission");
const Native = VencordNative.pluginHelpers.PasscodeLock as PluginNative<typeof import("./native")> | undefined;

// Use a bundled data URL instead of contacting an image host whenever the lock
// screen opens. The lock UI now works without network access.
const LOCAL_LOCK_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4V6Zm3 9.73V18h-2v-2.27a2 2 0 1 1 2 0Z'/%3E%3C/svg%3E";
const Gifs = {
    LOCKED_INTRO: LOCAL_LOCK_ICON,
    LOCKED_SHAKE: LOCAL_LOCK_ICON,
    SETTINGS_INTRO: LOCAL_LOCK_ICON,
    SETTINGS_ROTATE: LOCAL_LOCK_ICON,
    EDIT_INTRO: LOCAL_LOCK_ICON,
    EDIT_ACTION: LOCAL_LOCK_ICON,
};

const LOCK_ICON_PATH = "M19,10h-1V7.69c0-3.16-2.57-5.72-5.72-5.72H11.8C8.66,1.97,6,4.62,6,7.77V10H5c-0.55,0-1,0.45-1,1v8c0,1.65,1.35,3,3,3h10c1.65,0,3-1.35,3-3v-8C20,10.45,19.55,10,19,10z M8,7.77c0-2.06,1.74-3.8,3.8-3.8h0.48c2.05,0,3.72,1.67,3.72,3.72V10H8V7.77z M13.06,16.06c-0.02,0.02-0.04,0.04-0.06,0.05V18c0,0.55-0.45,1-1,1s-1-0.45-1-1v-1.89c-0.02-0.01-0.04-0.03-0.06-0.05C10.66,15.78,10.5,15.4,10.5,15c0-0.1,0.01-0.2,0.03-0.29c0.02-0.1,0.05-0.19,0.08-0.28c0.04-0.09,0.09-0.18,0.14-0.26c0.06-0.09,0.12-0.16,0.19-0.23c0.35-0.35,0.86-0.51,1.35-0.41c0.1,0.02,0.19,0.05,0.28,0.08c0.09,0.04,0.18,0.09,0.26,0.14c0.08,0.06,0.16,0.12,0.23,0.19s0.13,0.14,0.19,0.23c0.05,0.08,0.1,0.17,0.13,0.26c0.04,0.09,0.07,0.18,0.09,0.28C13.49,14.8,13.5,14.9,13.5,15C13.5,15.4,13.34,15.77,13.06,16.06z";

function LockIcon(props: any) {
    const size = props.width ?? props.height ?? props.size ?? 20;
    return (
        <svg className={props.className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height={size} width={size}>
            <path fill={props.color ?? "currentColor"} d={LOCK_ICON_PATH} />
        </svg>
    );
}

// ─── Crypto helpers (pure Web Crypto) ───────────────────────────────────────

const b64binb = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const str2binb = (s: string) => new TextEncoder().encode(s);
const buf2hex = (buf: ArrayBuffer) => Array.prototype.map.call(new Uint8Array(buf), (x: number) => ("00" + x.toString(16)).slice(-2)).join("");
const hex2binb = (s: string) => Uint8Array.from(s.match(/.{1,2}/g) ?? [], byte => Number.parseInt(byte, 16));

async function pbkdf2(str: string, salt: string, iterations: number) {
    const key = await crypto.subtle.importKey("raw", str2binb(str), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt: hex2binb(salt), iterations, hash: "SHA-256" },
        key,
        256,
    );
    return buf2hex(bits);
}

// Compatibility verifier for hashes created by the original 4,000-iteration
// SHA-1 implementation. A successful legacy unlock is upgraded immediately.
async function legacyPbkdf2(str: string, salt: string, iterations: number) {
    const key = await crypto.subtle.importKey("raw", str2binb(str), { name: "PBKDF2" }, false, ["deriveKey"]);
    const derived = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: b64binb(salt), iterations, hash: "SHA-1" },
        key,
        { name: "HMAC", hash: "SHA-1", length: 160 },
        true,
        ["sign", "verify"],
    );
    return buf2hex(await crypto.subtle.exportKey("raw", derived));
}

async function hashCode(code: string) {
    const salt = buf2hex(crypto.getRandomValues(new Uint8Array(32)).buffer);
    const iterations = 310_000;
    const hash = await pbkdf2(code, salt, iterations);
    return { hash, salt, iterations };
}

async function hashCheck(code: string, salt: string, iterations: number, expected: string) {
    const actual = iterations < 100_000
        ? await legacyPbkdf2(code, salt, iterations)
        : await pbkdf2(code, salt, iterations);
    if (actual.length !== expected.length) return false;
    let mismatch = 0;
    for (let i = 0; i < actual.length; i++) mismatch |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
    return mismatch === 0;
}

// ─── Persisted data (separate from settings, stored in IndexedDB) ───

interface PLData {
    hash?: string;
    salt?: string | null;
    iterations?: number | null;
    attempts?: number;
    delayUntil?: number | null;
    locked?: boolean;
}

// ─── Settings ───

const settings = definePluginSettings({
    codeType: {
        type: OptionType.SELECT,
        description: "Loại mật mã",
        options: [
            { label: "Mã số 4 chữ số", value: "4-digit", default: true },
            { label: "Mã số 6 chữ số", value: "6-digit" },
            { label: "Mã số có độ dài tùy chỉnh", value: "custom-numeric" },
        ],
    },
    autolockSeconds: {
        type: OptionType.SELECT,
        description: "Tự động khóa sau khi không hoạt động",
        options: [
            { label: "Tắt", value: 0, default: true },
            { label: "1 phút", value: 60 },
            { label: "5 phút", value: 300 },
            { label: "1 giờ", value: 3600 },
            { label: "5 giờ", value: 18000 },
        ],
    },
    lockOnStartup: {
        type: OptionType.BOOLEAN,
        description: "Luôn khóa khi khởi động Discord",
        default: true,
    },
    lockWithWindows: {
        type: OptionType.BOOLEAN,
        description: "Tự động khóa Discord khi Windows bị khóa (nút Lock hoặc Windows + L)",
        default: true,
        onChange: enabled => enabled ? startWindowsLockWatcher() : stopWindowsLockWatcher(),
    },
    showClock: {
        type: OptionType.BOOLEAN,
        description: "Hiển thị đồng hồ và ngày tháng phía trên thông tin tài khoản",
        default: true,
    },
    showAtSign: {
        type: OptionType.BOOLEAN,
        description: "Hiển thị dấu @ trước tên người dùng",
        default: true,
    },
    showActivities: {
        type: OptionType.BOOLEAN,
        description: "Hiển thị game, Spotify và custom RPC đang chạy trên màn hình khóa",
        default: true,
    },
    lockScreenText: {
        type: OptionType.STRING,
        description: "Nội dung hiển thị phía trên ô nhập mật mã",
        default: "Nhập mật mã Discord của bạn",
    },
    highlightButtons: {
        type: OptionType.BOOLEAN,
        description: "Làm nổi bật các nút số khi nhập mật mã bằng bàn phím",
        default: false,
    },
    hideNotifications: {
        type: OptionType.BOOLEAN,
        description: "Ẩn nội dung thông báo khi Discord đang bị khóa",
        default: true,
    },
    keybind: {
        type: OptionType.STRING,
        description: "Phím tắt để khóa Discord (ví dụ: control+l)",
        default: "control+l",
    },
}).withPrivateSettings<PLData>();

const data = new Proxy({} as PLData, {
    get(_, prop: keyof PLData) {
        return (settings.store as any)[prop];
    },
    set(_, prop: keyof PLData, value: any) {
        (settings.store as any)[prop] = value;
        return true;
    }
});

async function loadData() {
    const oldData = await DataStore.get<PLData>(DS_KEY);
    if (oldData && oldData.hash) {
        data.hash = oldData.hash;
        data.salt = oldData.salt;
        data.iterations = oldData.iterations;
        data.attempts = oldData.attempts;
        data.delayUntil = oldData.delayUntil;
        data.locked = oldData.locked;
        await DataStore.del(DS_KEY);
    }
}
function saveData() {
    // Auto-saved by Vencord settings proxy
}

function codeLength() {
    switch (settings.store.codeType) {
        case "4-digit": return 4;
        case "6-digit": return 6;
        default: return -1; // custom, ends with Enter
    }
}

// ─── Lock screen overlay component ───

type LockType = "default" | "settings" | "editor";

function buildAnimatedIcon(container: HTMLElement, src: string) {
    const img = document.createElement("img");
    img.alt = "PCLIcon";
    img.width = 64;
    img.height = 64;
    img.style.opacity = "0";
    container.appendChild(img);
    setTimeout(() => {
        img.style.transition = ".3s opacity";
        img.style.opacity = "1";
        img.src = src;
    }, 0);
    return img;
}

function PasscodeBtn({ number, dec, click, code, children }: any) {
    return (
        <div
            className="PCL--btn PCL--animate"
            id={`PCLBtn-${code ?? number}`}
            onClick={() => click?.(number)}
        >
            {!children ? (
                <>
                    <div className="PCL--btn-number">{number}</div>
                    <div className="PCL--btn-dec">{dec}</div>
                </>
            ) : children}
        </div>
    );
}

function BackspaceIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="22" width="22">
            <path fill="currentColor" d="M22 3H7c-.69 0-1.23.35-1.59.88L.37 11.45c-.22.34-.22.77 0 1.11l5.04 7.56c.36.52.9.88 1.59.88h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3.7 13.3c-.39.39-1.02.39-1.41 0L14 13.41l-2.89 2.89c-.39.39-1.02.39-1.41 0-.39-.39-.39-1.02 0-1.41L12.59 12 9.7 9.11c-.39-.39-.39-1.02 0-1.41.39-.39 1.02-.39 1.41 0L14 10.59l2.89-2.89c.39-.39 1.02-.39 1.41 0 .39.39.39 1.02 0 1.41L15.41 12l2.89 2.89c.38.38.38 1.02 0 1.41z" />
        </svg>
    );
}
function CancelIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="30" width="30">
            <path fill="currentColor" d="M19 11H7.83l4.88-4.88c.39-.39.39-1.03 0-1.42-.39-.39-1.02-.39-1.41 0l-6.59 6.59c-.39.39-.39 1.02 0 1.41l6.59 6.59c.39.39 1.02.39 1.41 0 .39-.39.39-1.02 0-1.41L7.83 13H19c.55 0 1-.45 1-1s-.45-1-1-1z" />
        </svg>
    );
}
function EnterIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" height="34" width="34">
            <path fill="currentColor" d="M21.05 28.55 16.15 23.65Q15.7 23.2 15.05 23.2Q14.4 23.2 13.9 23.7Q13.4 24.2 13.4 24.85Q13.4 25.5 13.9 25.95L20 32.05Q20.45 32.5 21.05 32.5Q21.65 32.5 22.1 32.05L34.1 20.05Q34.55 19.6 34.525 18.95Q34.5 18.3 34.05 17.85Q33.6 17.35 32.925 17.35Q32.25 17.35 31.75 17.85ZM24 44Q19.75 44 16.1 42.475Q12.45 40.95 9.75 38.25Q7.05 35.55 5.525 31.9Q4 28.25 4 24Q4 19.8 5.525 16.15Q7.05 12.5 9.75 9.8Q12.45 7.1 16.1 5.55Q19.75 4 24 4Q28.2 4 31.85 5.55Q35.5 7.1 38.2 9.8Q40.9 12.5 42.45 16.15Q44 19.8 44 24Q44 28.25 42.45 31.9Q40.9 35.55 38.2 38.25Q35.5 40.95 31.85 42.475Q28.2 44 24 44ZM24 41Q31.25 41 36.125 36.125Q41 31.25 41 24Q41 16.75 36.125 11.875Q31.25 7 24 7Q16.75 7 11.875 11.875Q7 16.75 7 24Q7 31.25 11.875 36.125Q16.75 41 24 41Z" />
        </svg>
    );
}

interface LockerProps {
    type: LockType;
    button?: HTMLElement | null;
    onDone: (success: boolean, newCode?: string) => void;
}

function LockClock() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const time = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(now);
    const rawDate = new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(now);
    const date = rawDate.charAt(0).toLocaleUpperCase("vi-VN") + rawDate.slice(1);

    return (
        <div className="PCL--clock PCL--animate" aria-label={`${time}, ${date}`}>
            <div className="PCL--clock-time">{time}</div>
            <div className="PCL--clock-date">{date}</div>
        </div>
    );
}

function getActivityTypeLabel(type: ActivityType) {
    switch (type) {
        case ActivityType.STREAMING: return "Đang phát trực tiếp";
        case ActivityType.LISTENING: return "Đang nghe";
        case ActivityType.WATCHING: return "Đang xem";
        case ActivityType.COMPETING: return "Đang thi đấu";
        default: return "Đang chơi";
    }
}

function getActivityImage(activity: Activity) {
    const image = activity.assets?.large_image ?? activity.assets?.small_image;
    if (!image) return null;
    if (/^https?:\/\//i.test(image)) return image;
    if (image.startsWith("mp:")) return `https://media.discordapp.net/${image.slice(3)}`;
    if (image.startsWith("spotify:")) return `https://i.scdn.co/image/${image.slice(8)}`;
    if (activity.application_id) {
        return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${image}.png`;
    }
    return null;
}

function LockActivities() {
    const userId = UserStore.getCurrentUser()?.id;
    const activities = useStateFromStores([PresenceStore], () => {
        if (!userId) return [] as Activity[];
        return (PresenceStore.getActivities(userId) ?? [])
            .filter((activity: Activity | null): activity is Activity => activity != null && activity.type !== ActivityType.CUSTOM_STATUS)
            .slice(0, 3);
    });

    if (!activities.length) return null;

    return (
        <div className="PCL--activities PCL--animate" aria-label="Hoạt động hiện tại">
            {activities.map((activity, index) => {
                const image = getActivityImage(activity);
                const lines = [activity.details, activity.state]
                    .filter((line, lineIndex, all): line is string => Boolean(line) && all.indexOf(line) === lineIndex);

                return (
                    <div className="PCL--activity" key={`${activity.id ?? activity.application_id ?? activity.name}-${index}`}>
                        {image
                            ? <img className="PCL--activity-image" src={image} alt="" />
                            : <div className="PCL--activity-fallback" aria-hidden="true">{activity.name?.charAt(0)?.toLocaleUpperCase("vi-VN") || "•"}</div>}
                        <div className="PCL--activity-copy">
                            <div className="PCL--activity-kind">{getActivityTypeLabel(activity.type)}</div>
                            <div className="PCL--activity-name">{activity.name || "Hoạt động Discord"}</div>
                            {lines.length > 0 && <div className="PCL--activity-detail">{lines.join(" · ")}</div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function PasscodeLocker({ type, button, onDone }: LockerProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [confirmStage, setConfirmStage] = useState(false);
    const [newCode, setNewCode] = useState("");
    const [delay, setDelay] = useState(false);
    const [delayLeft, setDelayLeft] = useState(0);
    const iconRef = useRef<HTMLImageElement | undefined>(undefined);
    const len = codeLength();

    const getBg = () => rootRef.current?.querySelector(".PCL--layout-bg") as HTMLElement | null;

    const bgCircle = (smooth = true) => {
        try {
            const bg = getBg();
            if (!bg || !button) return;
            const buttonPos = document.body.contains(button) ? button.getBoundingClientRect() : { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            const containerPos = document.body.getBoundingClientRect();
            const top = buttonPos.top + buttonPos.height / 2 - containerPos.top;
            const left = buttonPos.left + buttonPos.width / 2 - containerPos.left;
            const radius = Math.hypot(Math.max(top, containerPos.height - top), Math.max(left, containerPos.width - left));
            if (!smooth) bg.style.transition = "none";
            bg.style.top = `${top}px`;
            bg.style.left = `${left}px`;
            bg.style.width = `${radius * 2}px`;
            bg.style.height = `${radius * 2}px`;
            bg.style.transform = "translate(-50%, -50%) scale(1)";
            bg.style.borderRadius = "50%";
        } catch (e) {
            console.error("[PasscodeLock] bgCircle error", e);
        }
    };

    const bgFill = () => {
        try {
            const bg = getBg();
            if (!bg) return;
            bg.style.transition = "none";
            bg.style.top = "0";
            bg.style.left = "0";
            bg.style.width = "100%";
            bg.style.height = "100%";
            bg.style.borderRadius = "0";
            bg.style.transform = "scale(1)";
        } catch (e) {
            console.error("[PasscodeLock] bgFill error", e);
        }
    };

    // close() is GUARANTEED to call onDone, no matter what happens with styling/animation.
    // Any failure inside the animation steps is caught and logged, but never blocks
    // the unmount — this is what previously could leave the full-screen overlay
    // stuck forever, eating all clicks/keystrokes.
    const close = (success: boolean) => {
        try {
            const controls = rootRef.current?.querySelector(".PCL--controls") as HTMLElement | null;
            if (controls) controls.style.opacity = "0";
            bgCircle(false);
        } catch (e) {
            console.error("[PasscodeLock] close() pre-animation error", e);
        }
        setTimeout(() => {
            try {
                const bg = getBg();
                if (bg) bg.style.transform = "";
            } catch (e) {
                console.error("[PasscodeLock] close() animation error", e);
            }
            setTimeout(() => {
                try {
                    onDone(success, type === "editor" ? newCode : undefined);
                } catch (e) {
                    console.error("[PasscodeLock] onDone threw", e);
                }
            }, 400);
        }, 100);
    };

    const fail = () => {
        if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.classList.add("vcl-err");
            setTimeout(() => {
                if (inputRef.current) inputRef.current.classList.remove("vcl-err");
            }, 2800);
        }
        if (iconRef.current) {
            iconRef.current.src = type === "default" ? Gifs.LOCKED_SHAKE : type === "settings" ? Gifs.SETTINGS_ROTATE : Gifs.EDIT_ACTION;
        }
        if (type !== "default") return;
        data.attempts = (data.attempts ?? 0) + 1;
        if (data.attempts >= 3) {
            data.delayUntil = Date.now() + Math.min(30000, 5000 * (data.attempts - 2));
        }
        saveData();
        checkDelay();
    };

    const checkDelay = () => {
        if (data.delayUntil && Date.now() < data.delayUntil) {
            setDelay(true);
            setDelayLeft(Math.ceil((data.delayUntil - Date.now()) / 1000));
            if (inputRef.current) inputRef.current.value = "";
        } else {
            setDelay(false);
        }
    };

    // `accept` takes an optional explicit code to validate. This matters because
    // `append()` below calls accept() synchronously (via setTimeout) right after
    // computing the new full code string — if accept() fell back to reading the
    // `code` state closed over from the same render, it would see the code as it
    // was *before* the digit that was just typed, i.e. one character short. That
    // was a real, silent bug: the very last digit typed was never actually checked,
    // both when unlocking AND when the passcode was first set up in the editor
    // (so the stored hash itself could end up one character shorter than intended).
    const accept = async (submittedCode: string = inputRef.current?.value || "") => {
        try {
            if (submittedCode === "") return;
            if (type === "editor") {
                if (!confirmStage) {
                    setNewCode(submittedCode);
                    if (inputRef.current) inputRef.current.value = "";
                    setConfirmStage(true);
                    if (iconRef.current) iconRef.current.src = Gifs.EDIT_ACTION;
                } else if (submittedCode !== newCode) {
                    fail();
                } else {
                    close(true);
                }
                return;
            }
            let ok = false;
            if (data.hash) {
                ok = await hashCheck(submittedCode, data.salt!, data.iterations!, data.hash);
            }
            if (ok) {
                if ((data.iterations ?? 0) < 100_000) {
                    const upgraded = await hashCode(submittedCode);
                    data.hash = upgraded.hash;
                    data.salt = upgraded.salt;
                    data.iterations = upgraded.iterations;
                }
                close(true);
            }
            else fail();
        } catch (e) {
            console.error("[PasscodeLock] accept() error", e);
            // Never leave the overlay in limbo because a crypto/state error was thrown.
            fail();
        }
    };

    const append = (num: number) => {
        if (!inputRef.current) return;
        const current = inputRef.current.value;
        if (current.length >= MAX_CODE_LENGTH) return;
        const next = current + num.toString();
        inputRef.current.value = next;
        setTimeout(() => {
            if (len !== -1 && len <= next.length) accept(next);
        });
    };

    useEffect(() => {
        const interval = setInterval(checkDelay, 1000);
        checkDelay();

        // entrance animation — wrapped defensively so a styling/layout error never
        // leaves the overlay stuck mid-animation (which would block all clicks/keys).
        let tick: ReturnType<typeof setInterval> | undefined;
        let finished = false;
        let onTransEnd: (() => void) | undefined;
        let bgRef: HTMLElement | null = null;

        const finishEntrance = () => {
            if (finished) return;
            finished = true;
            try {
                if (onTransEnd) bgRef?.removeEventListener("transitionend", onTransEnd);
                if (tick) clearInterval(tick);
                rootRef.current?.querySelectorAll(".PCL--animate").forEach(e => e.classList.remove("PCL--animate", "PCL--animated"));
                bgFill();
            } catch (e) {
                console.error("[PasscodeLock] finishEntrance error", e);
            }
        };

        const focusGuard = (e: FocusEvent) => {
            if (!rootRef.current || rootRef.current.contains(e.target as Node)) return;
            e.stopImmediatePropagation();
            if (inputRef.current) inputRef.current.focus();
        };
        document.addEventListener("focusin", focusGuard, true);

        const entranceTimeout = setTimeout(() => {
            try {
                bgCircle();
                const animEls = () => Array.from(rootRef.current?.querySelectorAll(".PCL--animate:not(.PCL--animated)") ?? []);
                tick = setInterval(() => {
                    try {
                        const bg = getBg();
                        if (!bg) return;
                        const pos = bg.getBoundingClientRect();
                        const cTop = pos.top + pos.height / 2;
                        const cLeft = pos.left + pos.width / 2;
                        const radius = pos.width / 2;
                        animEls().forEach(el => {
                            const p = el.getBoundingClientRect();
                            const eTop = p.top + p.height / 2;
                            const eLeft = p.left + p.width / 2;
                            if (Math.hypot(Math.abs(eTop - cTop), Math.abs(eLeft - cLeft)) <= radius) {
                                if (el.classList.contains("PCL--icon") && !iconRef.current) {
                                    iconRef.current = buildAnimatedIcon(el as HTMLElement, {
                                        default: Gifs.LOCKED_INTRO,
                                        settings: Gifs.SETTINGS_INTRO,
                                        editor: Gifs.EDIT_INTRO,
                                    }[type]);
                                    el.classList.remove("PCL--animate");
                                } else {
                                    el.classList.add("PCL--animated");
                                }
                            }
                        });
                    } catch (e) {
                        console.error("[PasscodeLock] entrance tick error", e);
                    }
                }, 10);

                bgRef = getBg();
                onTransEnd = finishEntrance;
                bgRef?.addEventListener("transitionend", onTransEnd);
                // Failsafe: if transitionend never fires for any reason, force-finish
                // the entrance animation after 700ms so the screen never gets stuck
                // mid-transition with weird pointer/visual state.
                setTimeout(finishEntrance, 700);
            } catch (e) {
                console.error("[PasscodeLock] entrance animation error", e);
                finishEntrance();
            }
        }, 100);

        return () => {
            clearInterval(interval);
            clearTimeout(entranceTimeout);
            if (tick) clearInterval(tick);
            document.removeEventListener("focusin", focusGuard, true);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keyboard handling lives in its own effect, re-bound whenever the values it
    // reads change, so the listeners never close over stale `code`/`delay`/etc.
    // Previously this was inside the mount-only effect above: since that effect
    // only ran once, onKeyUp always saw `code` exactly as it was on the very first
    // render, so append() kept computing `next` from an empty string and only the
    // first digit typed on the keyboard ever registered. Mouse clicks worked fine
    // because each click used a freshly rendered `append` closure from that render.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && type !== "default") close(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const title = type === "editor"
        ? (confirmStage ? "Nhập lại mật mã để xác nhận" : "Nhập mật mã mới")
        : settings.store.lockScreenText;
    const { avatarUrl, username } = getUserAssets();
    const displayName = `${settings.store.showAtSign ? "@" : ""}${username}`;

    return (
        <div className="PCL--layout" ref={rootRef}>
            <div className="PCL--layout-bg" />
            <div className="PCL--controls">
                {settings.store.showClock && <LockClock />}
                <div id="vcl-avatar" style={{ backgroundImage: `url('${escapeHtml(avatarUrl)}')` }} className="PCL--animate" />
                <p id="vcl-username" className="PCL--animate">{displayName}</p>
                <p id="vcl-sub" className="PCL--animate">{title}</p>
                {settings.store.showActivities && <LockActivities />}

                <div id="vcl-input-wrap" className="PCL--animate">
                    <LockIcon className="vcl-icon-lock" size={14} />
                    <input
                        id="vcl-input"
                        ref={inputRef}
                        type="password"
                        placeholder="Nhập mật mã"
                        autoComplete="off"
                        spellCheck={false}
                        autoFocus
                        defaultValue=""
                        onChange={(e) => {
                            const val = e.target.value;
                            if (len !== -1 && val.length >= len) {
                                accept(val);
                            }
                        }}
                        onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Enter") accept(e.currentTarget.value);
                        }}
                        onKeyUp={(e) => e.stopPropagation()}
                        onKeyPress={(e) => e.stopPropagation()}
                        className={delay ? "vcl-err" : ""}
                        disabled={delay}
                    />
                    <button id="vcl-submit" onClick={() => accept()}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" height={16} width={16}>
                            <path fill="currentColor" d="M21.05 28.55 16.15 23.65Q15.7 23.2 15.05 23.2Q14.4 23.2 13.9 23.7Q13.4 24.2 13.4 24.85Q13.4 25.5 13.9 25.95L20 32.05Q20.45 32.5 21.05 32.5Q21.65 32.5 22.1 32.05L34.1 20.05Q34.55 19.6 34.525 18.95Q34.5 18.3 34.05 17.85Q33.6 17.35 32.925 17.35Q32.25 17.35 31.75 17.85ZM24 44Q19.75 44 16.1 42.475Q12.45 40.95 9.75 38.25Q7.05 35.55 5.525 31.9Q4 28.25 4 24Q4 19.8 5.525 16.15Q7.05 12.5 9.75 9.8Q12.45 7.1 16.1 5.55Q19.75 4 24 4Q28.2 4 31.85 5.55Q35.5 7.1 38.2 9.8Q40.9 12.5 42.45 16.15Q44 19.8 44 24Q44 28.25 42.45 31.9Q40.9 35.55 38.2 38.25Q35.5 40.95 31.85 42.475Q28.2 44 24 44ZM24 41Q31.25 41 36.125 36.125Q41 31.25 41 24Q41 16.75 36.125 11.875Q31.25 7 24 7Q16.75 7 11.875 11.875Q7 16.75 7 24Q7 31.25 11.875 36.125Q16.75 41 24 41Z" />
                        </svg>
                    </button>
                </div>

                <div className={`PCL--delay ${delay ? "PCL--delay--visible" : ""}`}>
                    <svg style={{ marginRight: 6 }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height={16} width={16}><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    {`Bạn đã nhập sai quá nhiều lần.\nVui lòng thử lại sau ${delayLeft} giây.`}
                </div>
            </div>
        </div>
    );
}

// ─── Plugin-level lock orchestration ───

let isLocked = false;
let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLDivElement | null = null;
let originalShowNotification: any = null;
let autolockTimeout: ReturnType<typeof setTimeout> | undefined;
let watchdogTimeout: ReturnType<typeof setTimeout> | undefined;
let windowsLockWatcherActive = false;
let windowsLockWatcherGeneration = 0;

async function startWindowsLockWatcher() {
    if (windowsLockWatcherActive || !settings.store.lockWithWindows) return;

    try {
        if (!Native?.isWindowsLockDetectionSupported) return;
        if (!await Native.isWindowsLockDetectionSupported()) return;
    } catch (error) {
        console.error("[PasscodeLock] Không thể kiểm tra hỗ trợ Windows Lock", error);
        return;
    }

    windowsLockWatcherActive = true;
    const generation = ++windowsLockWatcherGeneration;

    while (windowsLockWatcherActive && generation === windowsLockWatcherGeneration) {
        try {
            const windowsWasLocked = await Native.waitForWindowsLock();
            if (!windowsLockWatcherActive || generation !== windowsLockWatcherGeneration) break;
            if (windowsWasLocked && settings.store.lockWithWindows && data.hash) {
                lock(document.body);
            }
        } catch (error) {
            console.error("[PasscodeLock] Theo dõi Windows Lock thất bại", error);
            windowsLockWatcherActive = false;
        }
    }
}

function stopWindowsLockWatcher() {
    windowsLockWatcherActive = false;
    windowsLockWatcherGeneration++;
    Native?.cancelWindowsLockWait?.().catch(error => {
        console.error("[PasscodeLock] Không thể hủy listener Windows Lock", error);
    });
}

// Last-resort cleanup. Always safe to call, idempotent. Exposed on window so it
// can be triggered manually from devtools console if something ever still slips
// through the cracks: window.__localonlyPCLReset()
function forceReset(reason?: string) {
    if (reason) console.warn(`[PasscodeLock] Force reset triggered: ${reason}`);
    try { root?.unmount(); } catch (e) { console.error(e); }
    try { container?.remove(); } catch (e) { console.error(e); }
    // Belt-and-suspenders: nuke any orphaned overlay nodes left in the DOM,
    // in case `container` itself got out of sync somehow.
    try {
        document.querySelectorAll(".PCL--layout").forEach(el => el.remove());
    } catch (e) { console.error(e); }
    root = null;
    container = null;
    isLocked = false;
    clearTimeout(watchdogTimeout);
}

function openLocker(type: LockType, button: HTMLElement | null, onSuccess?: (newCode?: string) => void) {
    if (root) return;

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    // Watchdog: an overlay should never realistically stay open for 45s without
    // the user interacting successfully or cancelling. If it does, something broke
    // (e.g. an uncaught error prevented onDone from firing) — auto-recover instead
    // of leaving the user permanently locked out of every button/shortcut.
    clearTimeout(watchdogTimeout);
    if (type !== "default") {
        watchdogTimeout = setTimeout(() => {
            forceReset("overlay stayed open longer than 45s, auto-clearing to prevent a permanent soft-lock");
        }, 45000);
    }

    let deafened = false;
    try {
        deafened = type === "default" && !MediaEngineStore.isSelfDeaf();
        if (deafened) VoiceActions.toggleSelfDeaf?.();
    } catch (e) {
        console.error("[PasscodeLock] deafen check failed (module not ready yet?)", e);
        deafened = false;
    }

    root.render(
        <PasscodeLocker
            type={type}
            button={button}
            onDone={(success, newCode) => {
                clearTimeout(watchdogTimeout);
                try {
                    root?.unmount();
                } catch (e) {
                    console.error("[PasscodeLock] unmount error", e);
                }
                try {
                    container?.remove();
                } catch (e) {
                    console.error("[PasscodeLock] container remove error", e);
                }
                root = null;
                container = null;

                if (type === "default") {
                    isLocked = false;
                    data.locked = false;
                    data.attempts = 0;
                    data.delayUntil = null;
                    saveData();
                    if (deafened) {
                        try { VoiceActions.toggleSelfDeaf?.(); } catch (e) { console.error("[PasscodeLock] re-deafen failed", e); }
                    }
                }

                if (success && type === "editor" && newCode) {
                    hashCode(newCode).then(({ hash, salt, iterations }) => {
                        data.hash = hash;
                        data.salt = salt;
                        data.iterations = iterations;
                        saveData();
                        showToast("Đã cập nhật mật mã!", Toasts.Type.SUCCESS);
                    }).catch(e => {
                        console.error("[PasscodeLock] hashCode failed", e);
                        showToast("Không thể lưu mật mã. Vui lòng thử lại.", Toasts.Type.FAILURE);
                    });
                }
                if (success) onSuccess?.(newCode);
            }}
        />,
    );
}

function lock(button: HTMLElement | null = document.body) {
    if (isLocked) return;
    if (!data.hash) {
        showToast("Hãy thiết lập mật mã trước khi khóa Discord.", Toasts.Type.FAILURE);
        openLocker("editor", button);
        return;
    }
    try {
        openLocker("default", button);
        // Only commit the locked state once the overlay actually rendered
        // without throwing. Setting this *before* the attempt is what could
        // previously leave isLocked stuck at true forever if openLocker failed
        // (e.g. a webpack module not ready yet at startup) — silently disabling
        // every lock entry point (header button, settings button, keybind) for
        // the rest of the session.
        isLocked = true;
        data.locked = true;
        saveData();
    } catch (e) {
        console.error("[PasscodeLock] lock() failed to open the overlay", e);
        isLocked = false;
        forceReset("lock() threw while opening the overlay");
        showToast("Không thể mở màn hình khóa. Hãy kiểm tra console để biết chi tiết.", Toasts.Type.FAILURE);
    }
}

function resetAutolock() {
    clearTimeout(autolockTimeout);
    if (!settings.store.autolockSeconds) return;
    autolockTimeout = setTimeout(() => lock(document.body), settings.store.autolockSeconds * 1000);
}

function parseKeybind(str: string) {
    return (str || "control+l").toLowerCase().split("+").map(k => k.trim());
}

export default definePlugin({
    name: "PasscodeLock",
    description: "Màn hình khóa riêng tư cục bộ dùng PBKDF2-SHA-256; không thay thế bảo mật của Windows.",
    authors: [{ name: "arg0NNY (reviewed local port)",
     id: 0n }],
    settings,

    headerBarButton: {
        icon: LockIcon,
        render: () => {
            const ref = useRef<HTMLDivElement>(null);
            return (
                <HeaderBarButton
                    ref={ref as any}
                    icon={LockIcon}
                    iconSize={20}
                    tooltip="Khóa Discord"
                    onClick={() => {
                        // If a previous overlay somehow got stuck (root still set but
                        // nothing visible / unresponsive), this button doubles as a
                        // manual recovery: clicking it when nothing should be open
                        // but root is non-null force-clears it first.
                        if (root && !document.querySelector(".PCL--layout")) {
                            forceReset("header button clicked while root was set but no overlay was actually in the DOM");
                        }
                        lock(ref.current ?? document.body);
                    }}
                />
            );
        },
    } as any,

    settingsAboutComponent: () => {
        const [, force] = useState(0);
        return (
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <button
                    style={{ padding: "8px 14px", borderRadius: "4px", background: "var(--brand-experiment, #5865F2)", color: "#fff", border: "none", cursor: "pointer" }}
                    onClick={() => {
                        if (root && !document.querySelector(".PCL--layout")) {
                            forceReset("settings button clicked while root was set but no overlay was actually in the DOM");
                        }
                        openLocker("editor", document.body, () => force(n => n + 1));
                    }}
                >
                    {data.hash ? "Đổi mật mã" : "Thiết lập mật mã"}
                </button>
                <button
                    style={{ padding: "8px 14px", borderRadius: "4px", background: "transparent", color: "var(--text-normal, #fff)", border: "1px solid var(--background-modifier-accent, #555)", cursor: "pointer" }}
                    onClick={() => {
                        if (root && !document.querySelector(".PCL--layout")) {
                            forceReset("settings button clicked while root was set but no overlay was actually in the DOM");
                        }
                        lock(document.body);
                    }}>
                    Khóa Discord ngay
                </button>
            </div>
        );
    },

    async start() {
        await loadData();

        if (settings.store.lockWithWindows) void startWindowsLockWatcher();

        // Manual recovery hatch, always available from devtools console.
        (window as any).__localonlyPCLReset = () => forceReset("manually triggered via window.__localonlyPCLReset()");

        if (settings.store.hideNotifications && NotificationModule) {
            originalShowNotification = NotificationModule.showNotification;
            NotificationModule.showNotification = function (...args: any[]) {
                args[0] = Gifs.LOCKED_SHAKE;
                args[1] = "Thông báo mới";
                args[2] = "Bạn có một thông báo mới!";
                if (args[4]?.onClick) args[4].onClick = () => {};
                return originalShowNotification.apply(this, args);
            };
        }

        const onKeyDown = (e: KeyboardEvent) => {
            const combo = parseKeybind(settings.store.keybind);
            const pressed: string[] = [];
            if (e.ctrlKey) pressed.push("control");
            if (e.shiftKey) pressed.push("shift");
            if (e.altKey) pressed.push("alt");
            const key = e.key.toLowerCase();
            if (!["control", "shift", "alt"].includes(key)) pressed.push(key);
            if (combo.sort().join("|") === pressed.sort().join("|")) {
                if (root && !document.querySelector(".PCL--layout")) {
                    forceReset("keybind pressed while root was set but no overlay was actually in the DOM");
                }
                lock(document.body);
            }
        };
        (this as any)._onKeyDown = onKeyDown;
        window.addEventListener("keydown", onKeyDown);

        let lastActivityReset = 0;
        (this as any)._activityListener = () => {
            const now = Date.now();
            if (now - lastActivityReset < 2000) return;
            lastActivityReset = now;
            if (!isLocked) resetAutolock();
        };
        window.addEventListener("mousemove", (this as any)._activityListener);
        window.addEventListener("keydown", (this as any)._activityListener);
        window.addEventListener("mousedown", (this as any)._activityListener);
        
        resetAutolock();

        // Only auto-lock on startup if a passcode has actually been configured.
        // Without this check, enabling the plugin for the very first time (before
        // ever setting a passcode) would immediately lock Discord because
        // lockOnStartup defaults to true — trapping the user behind a lock screen
        // with no passcode they ever chose.
        if (data.hash && (settings.store.lockOnStartup || data.locked)) {
            _lockStartupTimer1 = setTimeout(() => {
                lock(document.body);
                // If the first attempt failed (isLocked still false, meaning
                // openLocker threw), retry once after modules have had more
                // time to initialize.
                _lockStartupTimer2 = setTimeout(() => {
                    if (!isLocked) lock(document.body);
                }, 2000);
            }, 300);
        }
    },

    stop() {
        stopWindowsLockWatcher();
        clearTimeout(_lockStartupTimer1);
        clearTimeout(_lockStartupTimer2);
        _lockStartupTimer1 = undefined;
        _lockStartupTimer2 = undefined;
        if (originalShowNotification && NotificationModule) {
            NotificationModule.showNotification = originalShowNotification;
            originalShowNotification = null;
        }
        window.removeEventListener("keydown", (this as any)._onKeyDown);
        window.removeEventListener("mousemove", (this as any)._activityListener);
        window.removeEventListener("keydown", (this as any)._activityListener);
        window.removeEventListener("mousedown", (this as any)._activityListener);
        clearTimeout(autolockTimeout);
        clearTimeout(watchdogTimeout);
        delete (window as any).__localonlyPCLReset;

        root?.unmount();
        container?.remove();
        root = null;
        container = null;
        isLocked = false;
    },
});
