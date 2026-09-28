/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ErrorBoundary from "@components/ErrorBoundary";
import { IconUtils, UserStore, useStateFromStores } from "@webpack/common";

import { getDecorationUrl } from "../constants";
import { getCustomProfileBadgesList } from "../patches";
import { CustomProfileData } from "../types";

interface ProfilePreviewProps {
    accountId: string;
    data: CustomProfileData;
}

export default ErrorBoundary.wrap(function ProfilePreview({ accountId, data }: ProfilePreviewProps) {
    const user = useStateFromStores([UserStore], () => UserStore.getUser(accountId), [accountId]);
    const username = data.username?.trim() || user?.username || "username";
    const displayName = data.globalName?.trim() || user?.globalName || username;
    const avatar = data.avatar || (user ? IconUtils.getUserAvatarURL(user, true, 80) : IconUtils.getDefaultAvatarURL(accountId));
    const decoration = data.decorationAsset ? getDecorationUrl(data.decorationAsset) : null;
    const badges = getCustomProfileBadgesList(accountId, data);

    return (
        <div className="vc-custom-profile-enhanced-preview">
            <div className="vc-custom-profile-enhanced-preview-avatar-wrapper">
                <img className="vc-custom-profile-enhanced-preview-avatar" src={avatar} alt="" />
                {decoration ? <img className="vc-custom-profile-enhanced-preview-decoration" src={decoration} alt="" /> : null}
            </div>
            <div className="vc-custom-profile-enhanced-preview-details">
                <strong>{displayName}</strong>
                <span className="vc-custom-profile-enhanced-preview-username">@{username}</span>
                <div className="vc-custom-profile-enhanced-preview-badges">
                    {badges.map(badge => <img key={badge.id} src={badge.iconSrc} alt={badge.description} title={badge.description} />)}
                </div>
            </div>
        </div>
    );
}, { noop: true });
