/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { ProfileBadge } from "@api/Badges";
import { addHeaderBarButton, removeHeaderBarButton } from "@api/HeaderBar";
import { openModal } from "@utils/modal";
import definePlugin from "@utils/types";
import { FluxDispatcher, React } from "@webpack/common";

import {
    CustomProfileButton,
    CustomProfileModal,
    EditIcon,
    enforceCustomProfile,
    forceAccountPanelRerender,
    isEnabled,
    loadData,
    loadDataSync,
    resetCustomProfileCache,
    syncCurrentUserData,
    updateCachedRealData
} from "./modules/customProfile";
import { initCustomStatuses, patchCustomStatusContextMenu, stopCustomStatuses } from "./modules/customStatus";
import { cleanupFakeAccount, initFakeAccount } from "./modules/fakeAccount";
import { getGlobalBadgesList, loadBadges } from "./modules/globalBadges";
import {
    fakeCurrentUser,
    fakeObfuscatedEmail,
    fakeObfuscatedPhone,
    getAvatarDecoOverride,
    getCustomProfileBadgesList,
    getDecorationURLForUser,
    installStoreHooks,
    isLocalStaff,
    patchBannerUrl,
    uninstallStoreHooks
} from "./patches";
import { settings } from "./settings";

function onAccountSwitch(event?: any) {
    const newUid = event?.user?.id;
    updateCachedRealData();
    syncCurrentUserData(newUid);
    resetCustomProfileCache();
    enforceCustomProfile();
    forceAccountPanelRerender();

    try {
        const WP = (Vencord as any).Webpack;
        const MAS = WP?.findByProps?.("getUsers", "getValidUsers");
        MAS?.emitChange?.();
    } catch { }

}

export default definePlugin({
    name: "CustomProfileEnhanced",
    description: "A safety-reviewed, local-first CustomProfile plugin for Equicord. It does not access or transmit your Discord account token. Use at your own risk.",
    tags: ["Appearance", "Utility"],
    authors: [{ name: "xVanDat", id: 0n }],
    dependencies: ["HeaderBarAPI", "ContextMenuAPI"],
    settings,

    settingsAboutComponent() {
        return (
            <div className="cp-about-card">
                <div className="cp-about-header">
                    <div className="cp-about-title">
                        <EditIcon size={20} />
                        <span>CustomProfileEnhanced Dashboard</span>
                    </div>
                </div>
                <div className="cp-about-desc">
                    Locally customize profiles, including avatars, banners, Nitro appearance, badges, collectibles, connections, custom statuses and account switcher previews.
                </div>
                <div className="cp-about-actions">
                    <button
                        className="cp-btn cp-btn-primary"
                        onClick={() => openModal(props => <CustomProfileModal rootProps={props} />)}
                    >
                        <EditIcon size={16} />
                        <span>Open Custom Profile Editor</span>
                    </button>
                </div>
                <div className="cp-quick-guide">
                    <div className="cp-guide-item">
                        <span className="cp-guide-key">Right-click a user</span>
                        <span>Add to Switcher (Fake)</span>
                    </div>
                    <div className="cp-guide-item">
                        <span className="cp-guide-key">HeaderBar</span>
                        <span>Restore / Edit Profile button</span>
                    </div>
                    <div className="cp-guide-item">
                        <span className="cp-guide-key">Right-click a user</span>
                        <span>Set a local custom status</span>
                    </div>
                </div>
            </div>
        );
    },

    patches: [
        {
            find: "hasAnyStaffLevel=()=>!1",
            replacement: {
                match: /(isStaff|hasAnyStaffLevel)=\(\)=>!1/g,
                replace: "$1=()=>$self.isLocalStaff(this)"
            }
        },
        {
            find: '"SHOULD_LOAD");',
            replacement: {
                match: /\i(?:\?)?.getPreviewBanner\(\i,\i,\i\)(?=.{0,100}"COMPLETE")/,
                replace: "$self.patchBannerUrl(arguments[0])||$&"
            }
        },
        {
            find: ".WIDGETS_RTC_UPSELL_COACHMARK)",
            replacement: {
                match: /currentUser:(\i)(?=.{0,200}voiceDb)/,
                replace: "currentUser:$self.fakeCurrentUser($1)"
            }
        },
        {
            find: "DISPLAY_NAME",
            noWarn: true,
            replacement: {
                match: /(?<=currentUser:\i,user:)(\i)/,
                replace: "$self.fakeCurrentUser($1)"
            }
        },
        {
            find: "obfuscatedEmail",
            noWarn: true,
            replacement: [
                {
                    match: /obfuscatedEmail:(\i)/,
                    replace: "obfuscatedEmail:$self.fakeObfuscatedEmail($1)"
                },
                {
                    match: /obfuscatedPhone:(\i)/,
                    replace: "obfuscatedPhone:$self.fakeObfuscatedPhone($1)"
                }
            ]
        },
        {
            find: "isHoveringOrFocusing",
            replacement: [
                {
                    noWarn: true,
                    match: /user:([A-Za-z_$][\w$]*),displayProfile:([A-Za-z_$][\w$]*),themeType/,
                    replace: "user:$self.fakeCurrentUser($1),displayProfile:$2,themeType"
                }
            ]
        },
        {
            find: "AccountPanel",
            replacement: [
                {
                    match: /user:([a-zA-Z0-9_]+),/,
                    replace: "user:$self.fakeCurrentUser($1),"
                }
            ]
        },
        {
            find: "UserAccountSettings",
            replacement: [
                {
                    match: /user:([a-zA-Z0-9_]+),/,
                    replace: "user:$self.fakeCurrentUser($1),"
                },
                {
                    match: /email:([^,}]+),/,
                    replace: "email:$self.fakeObfuscatedEmail($1),"
                }
            ]
        },
        {
            find: "getObfuscatedEmail",
            replacement: [
                {
                    match: /obfuscatedEmail:([^,}]+)/g,
                    replace: "obfuscatedEmail:$self.fakeObfuscatedEmail($1)"
                },
                {
                    match: /obfuscatedPhone:([^,}]+)/g,
                    replace: "obfuscatedPhone:$self.fakeObfuscatedPhone($1)"
                }
            ]
        },
        {
            find: "getAvatarDecorationURL:",
            noWarn: true,
            replacement: {
                match: /(?<=function \i\((\i)\){)(?=.{0,20}let\s*\{avatarDecoration)/,
                replace: "const _cpDecoUrl=$self.getDecorationURLForUser($1);if(_cpDecoUrl)return _cpDecoUrl;"
            }
        },
        {
            find: "isAvatarDecorationAnimating:",
            noWarn: true,
            group: true,
            replacement: [
                {
                    match: /(?<=\.avatarDecoration,guildId:\i\}\)\),)(?<=user:(\i).+?)/,
                    replace: "_cpAvatarDeco=$self.getAvatarDecoOverride($1),"
                },
                {
                    match: /(?<={avatarDecoration:).{1,20}?(?=,)(?<=avatarDecorationOverride:(\i).+?)/,
                    replace: "$1??_cpAvatarDeco??($&)"
                },
                {
                    match: /(?<=size:\i\}\),\[)/,
                    replace: "_cpAvatarDeco,"
                }
            ]
        }
    ],

    isLocalStaff,

    fakeCurrentUser(user: any) {
        return fakeCurrentUser(user);
    },

    fakeObfuscatedEmail(real: string | null) {
        return fakeObfuscatedEmail(real);
    },

    fakeObfuscatedPhone(real: string | null) {
        return fakeObfuscatedPhone(real);
    },

    getDecorationURLForUser(opts: any) {
        return getDecorationURLForUser(opts);
    },

    getAvatarDecoOverride(user: any) {
        return getAvatarDecoOverride(user);
    },

    patchBannerUrl(args: any) {
        return patchBannerUrl(args);
    },

    toolboxActions: {
        "Open Custom Profile"() {
            openModal(props => <CustomProfileModal rootProps={props} />);
        },
        async "Reload Global Badges"() {
            await loadBadges(settings.store.apiUrl, settings.store);
        }
    },

    contextMenus: {
        "user-context": patchCustomStatusContextMenu,
        "user-profile-actions": patchCustomStatusContextMenu
    },

    getGlobalBadges(userId: string) {
        return getGlobalBadgesList(userId);
    },

    userProfileBadges: [
        {
            getBadges({ userId }: { userId: string; }) {
                const globalBadges = getGlobalBadgesList(userId);
                const customBadges = getCustomProfileBadgesList(userId);
                return [...customBadges, ...globalBadges];
            }
        } as unknown as ProfileBadge
    ] as ProfileBadge[],

    async start() {
        loadDataSync();

        addHeaderBarButton("custom-profile-enhanced-editor", () => <CustomProfileButton />, 10);

        await initCustomStatuses();
        await initFakeAccount();
        installStoreHooks();

        await loadBadges(settings.store.apiUrl, settings.store);

        FluxDispatcher.subscribe("CONNECTION_OPEN", onAccountSwitch);
        FluxDispatcher.subscribe("MULTI_ACCOUNT_SWITCH_SUCCESS", onAccountSwitch);
        FluxDispatcher.subscribe("MULTI_ACCOUNT_SWITCH_ATTEMPT", onAccountSwitch);

        loadData().then(() => {
            updateCachedRealData();
            syncCurrentUserData();
            enforceCustomProfile();
            if (isEnabled) {
                forceAccountPanelRerender();
            }
        });
    },

    stop() {
        removeHeaderBarButton("custom-profile-enhanced-editor");

        FluxDispatcher.unsubscribe("CONNECTION_OPEN", onAccountSwitch);
        FluxDispatcher.unsubscribe("MULTI_ACCOUNT_SWITCH_SUCCESS", onAccountSwitch);
        FluxDispatcher.unsubscribe("MULTI_ACCOUNT_SWITCH_ATTEMPT", onAccountSwitch);

        cleanupFakeAccount();
        stopCustomStatuses();
        uninstallStoreHooks();
        forceAccountPanelRerender();
    }
});
