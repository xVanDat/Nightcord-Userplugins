# Nightcord Userplugins for Equicord

[Tiếng Việt](README.vi.md)

This repository contains source-only Equicord userplugins adapted from a Nightcord-derived collection. Each plugin keeps its complete directory structure (`pluginName/index.ts`, `index.tsx`, CSS, components, assets, and other modules). The code here is intended to be copied into Equicord's `src/userplugins` directory and built from source.

The accepted plugins were separated from vendor synchronization, updater, official-message, and shared credential systems. Local-first replacements were used where a feature could be made reasonably self-contained. This is not a guarantee of safety: client modifications can violate Discord's Terms of Service, break after Discord updates, expose private data, or perform destructive account actions.

This project is independent and is not endorsed by Nightcord, Equicord, Vencord, or Discord.

## Installation

1. Use a source checkout of Equicord.
2. Copy the plugin directories and the support items `_kamidereCompat/` and `_localI18n.ts` into `Equicord/src/userplugins/`.
3. Do not copy this repository's README, LICENSE, or `.gitignore` into `src/userplugins`.
4. Run `pnpm build` from the Equicord repository.
5. Enable only the plugins you understand and need.

`_kamidereCompat/` is a shared compatibility helper, not a standalone plugin. `_localI18n.ts` provides shared local translations. `silentEdit` is deliberately packaged as `silentEdit/index.tsx` so every plugin has its own directory.

## Risk scale

| Level | Meaning |
|---|---|
| **Critical** | Handles account tokens, performs bulk/destructive operations, or can rapidly trigger anti-abuse systems. Use only on disposable test accounts and inspect the source first. |
| **High** | Automates account actions, changes server/voice state, records private data, impersonates UI/state, or uses broad Discord internals. |
| **Medium** | Uses external services or remote content, changes account/profile data, stores sensitive local history, or relies on fragile patches/native integration. |
| **Low** | Mostly local UI or message convenience. “Low” is relative; every client modification still carries compatibility and Terms-of-Service risk. |

## Included plugins

| Plugin | What it does | Risk |
|---|---|---|
| `abreviation` | Expands configured abbreviations into full text before a message is sent. | Low |
| `antiDeleteMessage` | Caches your messages and can resend them after another user deletes them. | High — persistence, privacy, and adversarial automation. |
| `antiMoveDeco` | Tries to stop other users from moving or disconnecting you in voice. | High — voice-state automation and permission conflict. |
| `antiNickname` | Restores your preferred nickname when another user changes it. | High — repeated account/server mutations. |
| `audioLimiter` | Caps the playback volume of other users. | Low |
| `autoAFK` | Changes presence after inactivity and restores it when activity returns. | High — automated presence changes. |
| `autoClaim` | Automatically clicks supported ticket-claim controls. | High — automated server interaction. |
| `autoCorrect` | Optionally sends a draft to Groq for correction using your own API key. | Medium — message drafts leave the client when enabled. |
| `autoDeco` | Disconnects selected users from voice when they join, if you have permission. | High — moderation automation. |
| `autoMute` | Server-mutes configured users and attempts to keep them muted. | High — moderation automation. |
| `autoReply` | Automatically replies to configured messages or users. | High — unattended messaging can spam or disclose information. |
| `autoUnmute` | Automatically unmutes/undeafens users when permissions allow. | High — moderation automation. |
| `bulkFriendRemove` | Removes multiple friends in one operation. | Critical — destructive bulk account action. |
| `cancelFriendRequest` | Adds a profile action for canceling an outgoing friend request. | Low |
| `channelWallpaper` | Sets local custom backgrounds per channel. | Medium — remote media URLs may disclose IP/device metadata. |
| `ClearDMs` | Closes all direct-message channels. | Critical — destructive bulk UI/account-state action. |
| `ClearGroups` | Leaves or closes group DMs in bulk. | Critical — destructive and difficult to reverse. |
| `closeGroup` | Removes members from a group DM you own. | High — disruptive group mutation. |
| `customProfile` | Applies local-only visual profile overrides without vendor sync. | Medium — local profile data and user-provided remote media. |
| `customProfileEnhanced` | Provides extended local-only custom profile visuals and optional badge/media sources. | Medium — remote sources must be trusted; visuals are client-side only. |
| `customStream` | Replaces or cycles local stream preview images and presentation profiles. | High — fragile stream/UI patches and possible deception. |
| `DMBomb` | Sends aggressive bulk DMs to server members or roles and can rotate tokens. | Critical — extreme spam, token, ban, and abuse risk. |
| `doubleEmoji` | Keeps the emoji picker open for repeated selections. | Low |
| `EnhancedRandomVoice` | Randomly joins an active voice channel. | High — automated voice movement. |
| `eventLogs` | Keeps local logs of deleted/edited messages, friends, and pings. | Medium — stores sensitive local history. |
| `exportDM` | Exports DM history to TXT, JSON, CSV, Markdown, or HTML, including media metadata. | High — creates highly sensitive portable archives. |
| `fakeAccount` | Locally simulates the appearance of another account in parts of the UI. | High — deceptive UI and fragile patches. |
| `fakeDM` | Creates local-only fake messages. | High — deceptive content; screenshots can mislead. |
| `fakeFriends` | Creates local-only fake friends or requests. | High — deceptive UI state. |
| `fakePerm` | Locally unlocks or simulates moderation/administrator UI. | High — deceptive state; server authorization is unchanged. |
| `FakeVoice` | Simulates mute/deafen indicators while continuing to listen locally. | High — deceptive voice state and privacy implications. |
| `fastDiscord` | Applies broad animation, media, network, and rendering optimizations. | Medium — wide internal patches can destabilize Discord. |
| `fastPFP` | Sets an image as avatar/banner from a context menu. | Medium — mutates account profile and can hit rate limits. |
| `fastPing` | Converts copied IDs into mention syntax. | Low |
| `fixScreenshare` | Reinitializes screenshare after reloads or failures. | Medium — fragile media internals. |
| `floodPanel` | Rapidly sends repeated messages from a control panel. | Critical — spam and immediate anti-abuse/ban risk. |
| `followMe` | Moves another user to follow your voice-channel movement when permitted. | High — automated moderation/voice action. |
| `followUser` | Automatically follows a selected user between voice channels. | High — unattended voice actions. |
| `gifConvertor` | Converts local images or videos to GIF before sending. | Low — review output size before upload. |
| `hypeSquadChanger` | Changes or leaves the account's HypeSquad house. | High — unsupported account mutation. |
| `lastSeen` | Records and displays locally observed last-seen information. | Medium — privacy-sensitive behavioral history. |
| `leaveAllServers` | Leaves selected or many servers in bulk. | Critical — destructive and difficult to reverse. |
| `liveWallpaper` | Displays image, GIF, or video wallpaper across Discord. | Medium — remote media and performance/memory costs. |
| `lockGroup` | Locks/unlocks a group DM against adding members. | High — mutates group state. |
| `macOsButtons` | Replaces window controls with a macOS-style layout. | Medium — native window integration may break across versions. |
| `massDM` | Sends a configured DM to all friends with delays. | Critical — bulk messaging, spam, and ban risk. |
| `messageCleaner` | Bulk-deletes messages from supported DMs, servers, or channels. | Critical — destructive and potentially irreversible. |
| `multiInstance` | Opens another Discord instance/account and handles tokens with OS protected storage. | Critical — account tokens remain exceptionally sensitive. |
| `muteAllServers` | Mutes servers and can mark them read in bulk. | High — broad account-state mutation. |
| `mutualScanner` | Scans members for mutual-friend relationships and stores results locally. | High — privacy-sensitive enumeration and local data. |
| `noCaps` | Lowercases messages when uppercase usage crosses a configured threshold. | Low |
| `noDMWhileStreaming` | Hides DM notifications and related UI while streaming. | Medium — broad notification/UI patches may hide important events. |
| `passcodeLock` | Adds a local PBKDF2-backed lock overlay with clock/date, username options, RPC display, custom prompt, and Windows-lock relocking. | Medium — privacy screen only, not an OS security boundary. |
| `previewHTML` | Manually previews HTTPS HTML in a restricted opaque sandbox; blocks scripts, forms, popups, private hosts, and oversized responses. | Medium — remote content is still untrusted. |
| `previewWebsite` | Opens HTTPS sites in a restricted iframe; scripts are disabled by default and private/local hosts are blocked. | Medium — remote sites can still fingerprint or track the client when loaded. |
| `realtimeTimestamps` | Updates displayed timestamps with live seconds. | Low |
| `SaveProfile` | Saves/restores profile fields such as name, avatar, banner, status, colors, and bio. | Medium — sensitive backup plus account mutations/rate limits. |
| `SaveThem` | Saves selected user profiles and personal notes/reasons locally. | Medium — privacy-sensitive local records. |
| `screenFreeze` | Replaces an active screenshare with a static frame/image. | High — deceptive stream behavior and fragile media patches. |
| `selfDestruct` | Automatically deletes messages after a delay. | Critical — unattended destructive action. |
| `serverCloner` | Clones roles, channels, permissions, icons, emojis, and embeds when authorized. | Critical — mass server mutation and rate-limit/permission risk. |
| `serverFolderIcons` | Adds local custom icons for server folders. | Low |
| `sharePerms` | Shares or applies permission-related state across multiple users. | High — moderation/authorization impact. |
| `showID` | Displays user IDs in the interface. | Low |
| `silentDelete` | Edits/replaces a message before deleting it to evade some loggers. | High — adversarial behavior; not guaranteed to defeat logs. |
| `silentEdit` | Reposts edited content and optionally deletes the original to avoid edit tags/loggers. | High — adversarial messaging and duplicate notifications. |
| `smartPingFilters` | Filters displayed pings by configured keywords or users. | Low |
| `SmoothType` | Adds custom caret appearance and typing animation. | Low |
| `stealthMode` | Hides selected plugin controls/buttons without disabling the underlying plugin. | Medium — can obscure active behavior from the user. |
| `streamProof` | Attempts to hide selected client content from stream capture. | Medium — capture hooks are fragile and not a security guarantee. |
| `Surveillance` | Shows a local live dashboard for selected users and servers. | High — privacy-sensitive monitoring. |
| `tokenImporter` | Imports and verifies Discord account tokens. | Critical — tokens grant account access; compromise can fully expose accounts. |
| `unlockEmoji` | Locally unlocks/fakes emoji, sticker, theme, and stream-quality capabilities. | High — unsupported feature bypass and account enforcement risk. |
| `voiceChannelSearch` | Searches and joins voice channels across servers. | Low — joining still changes visible voice state. |
| `voiceDictation` | Sends opt-in microphone audio to Groq Whisper using your own API key and inserts the transcript. | Medium — voice data leaves the device when used. |
| `voiceIsolator` | Lowers everyone except selected speakers. | Medium — manipulates voice playback and depends on fragile internals. |

## Deliberately excluded

The following Nightcord-only items are not published in this repository. Some could be redesigned later, but the reviewed versions were too tightly coupled to vendor infrastructure, external trust, native/system modification, unbounded interception, or sensitive secret handling.

| Excluded item | Function | Why it was excluded |
|---|---|---|
| `_api` | Internal API modules used by the original fork. | Not a plugin; conflicts with/duplicates Equicord APIs and vendor integrations. |
| `_utils` | Shared helpers for excluded plugins. | Not a plugin; retained vendor-specific dependencies and was unnecessary for accepted plugins. |
| `AutoCallRecorder` | Records voice calls automatically. | Consent, privacy, legal, device, filesystem, and retention risks. |
| `autoResponder` | Reads messages and uses external AI to send automatic responses. | Sends private content externally and messages other people without review. |
| `autoTranslateNightcord` | Fork-specific translation automation. | Coupled to the original fork's runtime, branding, and services. |
| `backpack` | Imports/stores assorted data and fork-specific state. | Mixed cloud/secret/import logic needed separation and a fresh audit. |
| `bigFileUpload` | Uploads oversized files through third-party/custom endpoints. | Files leave Discord and depend on an external operator's retention/security. |
| `ClientDiagnostics` | Deeply instruments callbacks, promises, and runtime behavior. | Can collect sensitive diagnostics and destabilize the client. |
| `compactMode` | Provides a compact UI tied to fork-specific modals/icons/plugins. | Hard-coded Nightcord components and incompatible dependencies. |
| `cursorMacOS` | Replaces Windows system cursors. | System-wide modification outside the safe scope of a userplugin. |
| `DynamicIslande` | Dynamic-island UI linked to music/fork integrations. | Depends on missing SoundCord/music services and fork APIs. |
| `encryptedMessage` | Adds a custom encrypted-message protocol. | Crypto/key lifecycle and delivery guarantees were not sufficiently auditable; could imply false end-to-end security. |
| `enhancedScreenshare` | Hooks native capture/audio paths for enhanced streaming. | Version-specific native behavior, privacy impact, and crash risk. |
| `ghostClient` | Controls multiple accounts/tokens through a local companion server. | High-value token exposure and a large unaudited service boundary. |
| `GhostInstaller.desktop` | Installs/patches a desktop companion or service. | Remote installer/background-service behavior is outside a userplugin's safe scope. |
| `mullvadDNS` | Rewrites/intercepts DNS or URLs using resolved IPs. | Can break TLS/HTTPS assumptions and changes trust boundaries. |
| `nightcordAI` | Fork AI hub using Groq and shared credential/config flows. | Vendor coupling, central API-key handling, and external message processing. |
| `nightcordOfficialDM` | Displays fork official messages and a Mastodon feed. | Vendor-operated communication channel and unnecessary external trust. |
| `nightcordUpdater` | Updates fork/private releases. | Remote code update path and irrelevant to standalone Equicord userplugins. |
| `optimisations` | Applies broad performance/UI/runtime hooks. | Overlaps `fastDiscord`; combining both increases conflicts and instability. |
| `PrevNames` | Fetches historical usernames from unofficial APIs. | Third-party privacy/enumeration concerns and unverifiable data provenance. |
| `privateBrowser` | Embeds a general web browser with cookies, downloads, and popups. | Large phishing, cookie, download, and remote-code/content attack surface. |
| `qxChat` | Connects to the external qxch.at chat/encryption service. | External identity, availability, moderation, and cryptographic trust boundary. |
| `SaveGroups` | Saves/restores groups by monkey-patching global REST/message paths. | Unbounded global interception can alter unrelated requests and messages. |
| `SaveVideos` | Saves videos through native URL/path file writing. | Arbitrary URL/path and filesystem behavior was not sufficiently constrained. |
| `SecureBookmarks` | Stores protected bookmarks with a settings-based password. | Weak secret/key lifecycle and misleading “secure” guarantees. |
| `snipeAttachments` | Captures/caches deleted attachments. | Consent, privacy, retention, and filesystem risks. |
| `soundcloudPlayer` | Integrates SoundCloud auth/cookies/tokens and native processes. | External credentials, endpoints, native execution, and tracking surface. |
| `statusCycler` | Cycles statuses and includes Spicetify remote-script behavior. | Remote script execution and cross-application modification. |
| `stereoInstaller.desktop` | Replaces Discord's native voice binary. | Native binary replacement is supply-chain sensitive and version fragile. |
| `totpManager` | Stores TOTP secrets and synchronizes them through cloud/vendor flows. | Authentication secrets require dedicated audited storage, export, recovery, and encryption design. |
| `uncompressedImages` | Monkey-patches global DOM attribute setters for media URLs. | Unbounded page-wide interception and compatibility/security impact. |
| `wordBomb` | Automates a game using Groq, Wikipedia, and vendor dictionary endpoints. | Gameplay automation plus multiple external data/API trust boundaries. |
| `youtubePlayer` | Embeds YouTube with fork server-list helpers. | External tracking/embed surface and missing fork-specific dependency. |

## Security and privacy notes

- Never paste your main account token into any plugin. Treat a leaked token like a leaked password and revoke the session immediately.
- Test critical/high-risk plugins only on disposable accounts and throwaway servers you control.
- Review every endpoint and API key field before enabling `autoCorrect`, `voiceDictation`, remote wallpaper/profile media, or web preview features.
- Local-only means “no intended vendor sync”; it does not mean the plugin cannot contact Discord or a user-configured external URL as part of its documented feature.
- A Discord/Equicord update can invalidate patches without warning. Disable the affected plugin if settings, menus, rendering, voice, or startup becomes unstable.
- Exported DMs, event logs, saved profiles, and monitoring databases should be protected like private account data.

## License

GPL-3.0-or-later. Individual files retain their original copyright and SPDX notices where present.
