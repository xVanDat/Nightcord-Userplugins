# Nightcord Userplugins dành cho Equicord

[English](README.md)

Kho mã này chứa mã nguồn các userplugin Equicord được chuyển thể từ một bộ plugin có nguồn gốc Nightcord. Mỗi plugin giữ nguyên cấu trúc thư mục đầy đủ (`tênPlugin/index.ts`, `index.tsx`, CSS, component, tài nguyên và các module khác). Bạn có thể chép chúng vào `src/userplugins` của Equicord rồi tự build.

Các plugin được chấp nhận đã được tách khỏi hệ thống đồng bộ, updater, tin nhắn chính thức và luồng dùng chung thông tin xác thực của nhà cung cấp. Những tính năng có thể tự hoạt động hợp lý đã được chuyển sang local-first. Điều này không phải bảo đảm an toàn: client mod có thể vi phạm Điều khoản Dịch vụ của Discord, hỏng sau khi Discord cập nhật, làm lộ dữ liệu riêng tư hoặc thực hiện thao tác phá hủy trên tài khoản.

Dự án độc lập, không được Nightcord, Equicord, Vencord hay Discord bảo trợ.

## Cài đặt

1. Dùng bản mã nguồn Equicord.
2. Chép các thư mục plugin cùng `_kamidereCompat/` và `_localI18n.ts` vào `Equicord/src/userplugins/`.
3. Không chép README, LICENSE hoặc `.gitignore` của repo này vào `src/userplugins`.
4. Chạy `pnpm build` trong repo Equicord.
5. Chỉ bật plugin mà bạn hiểu và thực sự cần.

`_kamidereCompat/` là lớp tương thích dùng chung, không phải plugin độc lập. `_localI18n.ts` cung cấp bản dịch cục bộ dùng chung. `silentEdit` được đóng gói thành `silentEdit/index.tsx` để mọi plugin đều có thư mục riêng.

## Thang rủi ro

| Mức | Ý nghĩa |
|---|---|
| **Nghiêm trọng** | Xử lý token, thao tác hàng loạt/phá hủy hoặc rất dễ kích hoạt hệ thống chống lạm dụng. Chỉ thử bằng tài khoản phụ có thể bỏ và hãy đọc mã trước. |
| **Cao** | Tự động hóa hành động tài khoản, thay đổi server/voice, ghi dữ liệu riêng tư, giả trạng thái giao diện hoặc hook sâu vào Discord. |
| **Trung bình** | Dùng dịch vụ/nội dung bên ngoài, đổi hồ sơ, lưu lịch sử nhạy cảm hoặc dựa vào patch/native integration dễ hỏng. |
| **Thấp** | Chủ yếu là tiện ích giao diện/tin nhắn cục bộ. “Thấp” chỉ là tương đối; mọi client mod vẫn có rủi ro tương thích và ToS. |

## Plugin có trong repo

| Plugin | Chức năng | Rủi ro |
|---|---|---|
| `abreviation` | Mở rộng từ viết tắt đã cấu hình trước khi gửi tin nhắn. | Thấp |
| `antiDeleteMessage` | Cache tin nhắn của bạn và có thể gửi lại khi người khác xóa. | Cao — lưu dữ liệu, riêng tư và tự động hóa đối kháng. |
| `antiMoveDeco` | Cố ngăn người khác di chuyển hoặc ngắt bạn khỏi voice. | Cao — tự động hóa voice và xung đột quyền. |
| `antiNickname` | Khôi phục nickname mong muốn khi bị người khác đổi. | Cao — lặp lại thay đổi trên server/tài khoản. |
| `audioLimiter` | Giới hạn âm lượng phát của người khác. | Thấp |
| `autoAFK` | Đổi presence khi không hoạt động và khôi phục khi quay lại. | Cao — tự động đổi trạng thái. |
| `autoClaim` | Tự bấm nút nhận ticket được hỗ trợ. | Cao — tự động tương tác server. |
| `autoCorrect` | Tùy chọn gửi bản nháp đến Groq bằng API key riêng để sửa câu chữ. | Trung bình — nội dung nháp rời thiết bị khi bật. |
| `autoDeco` | Ngắt người được chọn khỏi voice khi họ tham gia nếu bạn có quyền. | Cao — tự động hóa moderation. |
| `autoMute` | Server-mute người đã cấu hình và cố giữ trạng thái mute. | Cao — tự động hóa moderation. |
| `autoReply` | Tự trả lời tin nhắn hoặc người dùng theo cấu hình. | Cao — dễ spam hoặc lộ thông tin khi chạy không giám sát. |
| `autoUnmute` | Tự unmute/undeafen người dùng khi có quyền. | Cao — tự động hóa moderation. |
| `bulkFriendRemove` | Xóa nhiều bạn bè trong một thao tác. | Nghiêm trọng — thao tác hàng loạt có tính phá hủy. |
| `cancelFriendRequest` | Thêm thao tác hủy lời mời kết bạn đã gửi trong profile. | Thấp |
| `channelWallpaper` | Đặt hình nền cục bộ riêng cho từng kênh. | Trung bình — URL media ngoài có thể lộ IP/thông tin thiết bị. |
| `ClearDMs` | Đóng toàn bộ kênh tin nhắn trực tiếp. | Nghiêm trọng — thay đổi hàng loạt khó phục hồi. |
| `ClearGroups` | Rời hoặc đóng hàng loạt group DM. | Nghiêm trọng — phá hủy và khó đảo ngược. |
| `closeGroup` | Xóa thành viên khỏi group DM do bạn sở hữu. | Cao — thay đổi nhóm gây gián đoạn. |
| `customProfile` | Ghi đè hình ảnh profile chỉ ở local, không đồng bộ nhà cung cấp. | Trung bình — dữ liệu profile local và media do người dùng nhập. |
| `customStream` | Thay hoặc luân phiên ảnh xem trước stream và profile trình chiếu. | Cao — patch stream/UI dễ hỏng và có thể gây hiểu nhầm. |
| `DMBomb` | Gửi DM hàng loạt mạnh tới thành viên/role và có thể luân phiên token. | Nghiêm trọng — spam cực cao, lộ token và khóa tài khoản. |
| `doubleEmoji` | Giữ bảng emoji mở để chọn liên tiếp. | Thấp |
| `EnhancedRandomVoice` | Tham gia ngẫu nhiên một voice channel đang hoạt động. | Cao — tự động di chuyển voice. |
| `eventLogs` | Lưu log local về tin bị xóa/sửa, bạn bè và ping. | Trung bình — lưu lịch sử nhạy cảm. |
| `exportDM` | Xuất DM sang TXT, JSON, CSV, Markdown hoặc HTML kèm metadata media. | Cao — tạo bản lưu di động cực kỳ nhạy cảm. |
| `fakeAccount` | Giả lập cục bộ hình thức của tài khoản khác trên một số UI. | Cao — giao diện gây hiểu nhầm và patch dễ hỏng. |
| `fakeDM` | Tạo tin nhắn giả chỉ ở local. | Cao — nội dung đánh lừa; ảnh chụp có thể gây hiểu nhầm. |
| `fakeFriends` | Tạo bạn bè/lời mời giả chỉ ở local. | Cao — giả trạng thái UI. |
| `fakePerm` | Mở khóa hoặc giả UI admin/mod ở local. | Cao — quyền trên server thực tế không thay đổi. |
| `FakeVoice` | Giả biểu tượng mute/deafen trong khi vẫn nghe ở local. | Cao — trạng thái voice đánh lừa và ảnh hưởng riêng tư. |
| `fastDiscord` | Áp dụng tối ưu rộng cho animation, media, mạng và render. | Trung bình — patch diện rộng có thể làm Discord mất ổn định. |
| `fastPFP` | Đặt ảnh làm avatar/banner từ menu chuột phải. | Trung bình — thay đổi hồ sơ và có thể chạm rate limit. |
| `fastPing` | Chuyển ID đã sao chép thành cú pháp mention. | Thấp |
| `fixScreenshare` | Khởi tạo lại screenshare sau reload hoặc lỗi. | Trung bình — phụ thuộc nội bộ media dễ thay đổi. |
| `floodPanel` | Gửi lặp tin nhắn rất nhanh từ bảng điều khiển. | Nghiêm trọng — spam và nguy cơ khóa tài khoản ngay lập tức. |
| `followMe` | Khi có quyền, di chuyển người khác theo voice channel của bạn. | Cao — tự động moderation/voice. |
| `followUser` | Tự theo một người được chọn qua các voice channel. | Cao — hành động voice không giám sát. |
| `gifConvertor` | Chuyển ảnh/video local thành GIF trước khi gửi. | Thấp — kiểm tra dung lượng đầu ra trước khi upload. |
| `hypeSquadChanger` | Đổi hoặc rời HypeSquad của tài khoản. | Cao — thay đổi tài khoản không được hỗ trợ chính thức. |
| `lastSeen` | Ghi và hiển thị thời điểm nhìn thấy người dùng gần nhất ở local. | Trung bình — lịch sử hành vi nhạy cảm. |
| `leaveAllServers` | Rời nhiều server được chọn cùng lúc. | Nghiêm trọng — phá hủy và khó phục hồi. |
| `liveWallpaper` | Hiển thị ảnh/GIF/video làm hình nền toàn Discord. | Trung bình — media ngoài và chi phí hiệu năng/bộ nhớ. |
| `lockGroup` | Khóa/mở group DM để ngăn thêm thành viên. | Cao — thay đổi trạng thái nhóm. |
| `macOsButtons` | Thay nút cửa sổ bằng bố cục kiểu macOS. | Trung bình — tích hợp cửa sổ native có thể hỏng theo phiên bản. |
| `massDM` | Gửi DM đã cấu hình tới toàn bộ bạn bè, có delay. | Nghiêm trọng — nhắn hàng loạt, spam và nguy cơ ban. |
| `messageCleaner` | Xóa hàng loạt tin nhắn trong DM/server/channel được hỗ trợ. | Nghiêm trọng — phá hủy và có thể không phục hồi được. |
| `multiInstance` | Mở thêm Discord/tài khoản và xử lý token bằng kho bảo vệ của hệ điều hành. | Nghiêm trọng — token vẫn là bí mật có giá trị cao nhất. |
| `muteAllServers` | Mute và có thể đánh dấu đã đọc hàng loạt server. | Cao — thay đổi trạng thái tài khoản diện rộng. |
| `mutualScanner` | Quét thành viên có quan hệ bạn chung và lưu kết quả local. | Cao — liệt kê dữ liệu riêng tư và lưu local. |
| `noCaps` | Đổi tin nhắn thành chữ thường khi tỷ lệ chữ hoa vượt ngưỡng. | Thấp |
| `noDMWhileStreaming` | Ẩn thông báo DM và UI liên quan khi stream. | Trung bình — có thể che khuất sự kiện quan trọng. |
| `passcodeLock` | Lớp khóa local PBKDF2 có giờ/ngày, tùy chọn username, RPC, lời nhắc tùy chỉnh và tự khóa khi Windows bị khóa. | Trung bình — chỉ là màn che riêng tư, không phải ranh giới bảo mật hệ điều hành. |
| `previewHTML` | Xem thủ công HTML HTTPS trong sandbox opaque; chặn script, form, popup, host riêng và phản hồi quá lớn. | Trung bình — nội dung từ xa vẫn không đáng tin. |
| `previewWebsite` | Mở website HTTPS trong iframe hạn chế; mặc định tắt script và chặn host private/local. | Trung bình — website vẫn có thể fingerprint/theo dõi khi được tải. |
| `realtimeTimestamps` | Cập nhật timestamp theo thời gian thực tới giây. | Thấp |
| `SaveProfile` | Lưu/khôi phục tên, avatar, banner, trạng thái, màu và bio. | Trung bình — bản lưu nhạy cảm, thay đổi tài khoản và rate limit. |
| `SaveThem` | Lưu profile người dùng và ghi chú/lý do cá nhân ở local. | Trung bình — hồ sơ local nhạy cảm. |
| `screenFreeze` | Thay screenshare đang chạy bằng khung/ảnh tĩnh. | Cao — hành vi stream gây hiểu nhầm và patch media dễ hỏng. |
| `selfDestruct` | Tự xóa tin nhắn sau khoảng thời gian. | Nghiêm trọng — thao tác phá hủy không giám sát. |
| `serverCloner` | Sao chép role, channel, permission, icon, emoji và embed khi có quyền. | Nghiêm trọng — thay đổi server hàng loạt, rate limit và quyền. |
| `serverFolderIcons` | Thêm icon tùy chỉnh local cho folder server. | Thấp |
| `sharePerms` | Chia sẻ hoặc áp dụng trạng thái permission cho nhiều người dùng. | Cao — ảnh hưởng moderation/ủy quyền. |
| `showID` | Hiển thị ID người dùng trong giao diện. | Thấp |
| `silentDelete` | Sửa/thay tin nhắn trước khi xóa để né một số logger. | Cao — hành vi đối kháng; không bảo đảm vượt được log. |
| `silentEdit` | Đăng lại nội dung đã sửa và tùy chọn xóa bản gốc để tránh nhãn/log edit. | Cao — nhắn tin đối kháng và có thể tạo thông báo trùng. |
| `smartPingFilters` | Lọc ping hiển thị theo từ khóa hoặc người dùng. | Thấp |
| `SmoothType` | Thêm kiểu caret và animation gõ chữ tùy chỉnh. | Thấp |
| `stealthMode` | Ẩn nút/điều khiển plugin đã chọn mà không tắt plugin. | Trung bình — có thể che khuất hành vi đang chạy với chính người dùng. |
| `streamProof` | Cố ẩn nội dung client được chọn khỏi stream capture. | Trung bình — hook capture dễ hỏng và không phải bảo đảm bảo mật. |
| `Surveillance` | Dashboard live local cho người dùng/server được chọn. | Cao — giám sát nhạy cảm về riêng tư. |
| `tokenImporter` | Nhập và xác minh token tài khoản Discord. | Nghiêm trọng — token cho phép truy cập tài khoản; lộ token có thể mất toàn bộ tài khoản. |
| `unlockEmoji` | Mở khóa/giả emoji, sticker, theme và chất lượng stream ở local. | Cao — vượt tính năng không được hỗ trợ và nguy cơ enforcement. |
| `voiceChannelSearch` | Tìm và tham gia voice channel ở nhiều server. | Thấp — tham gia vẫn thay đổi voice state công khai. |
| `voiceDictation` | Gửi audio mic theo yêu cầu tới Groq Whisper bằng API key riêng và chèn transcript. | Trung bình — dữ liệu giọng nói rời thiết bị khi dùng. |
| `voiceIsolator` | Hạ âm lượng mọi người trừ các speaker được chọn. | Trung bình — can thiệp playback voice và phụ thuộc internals. |

## Các mục chủ động không đưa vào

Những mục Nightcord-only dưới đây không được xuất bản trong repo. Một số có thể được thiết kế lại về sau, nhưng bản đã rà soát phụ thuộc quá sâu vào hạ tầng nhà cung cấp, dịch vụ ngoài, native/hệ thống, hook không giới hạn hoặc quản lý bí mật nhạy cảm.

| Mục bị loại | Chức năng | Lý do không đưa vào |
|---|---|---|
| `_api` | API nội bộ của fork gốc. | Không phải plugin; trùng/xung đột API Equicord và còn tích hợp nhà cung cấp. |
| `_utils` | Helper dùng chung cho các plugin bị loại. | Không phải plugin; giữ dependency riêng của fork và plugin được nhận không cần. |
| `AutoCallRecorder` | Tự ghi âm cuộc gọi voice. | Rủi ro đồng thuận, riêng tư, pháp lý, thiết bị, file và thời hạn lưu. |
| `autoResponder` | Đọc tin và dùng AI ngoài để tự trả lời. | Đưa nội dung riêng tư ra ngoài và tự nhắn người khác chưa qua duyệt. |
| `autoTranslateNightcord` | Tự dịch gắn với fork. | Phụ thuộc runtime, thương hiệu và dịch vụ của fork gốc. |
| `backpack` | Nhập/lưu nhiều loại dữ liệu và trạng thái của fork. | Trộn logic cloud/bí mật/import, cần tách và kiểm toán lại. |
| `bigFileUpload` | Upload file quá lớn qua endpoint bên thứ ba/tùy chỉnh. | File rời Discord và phụ thuộc chính sách lưu/bảo mật của đơn vị ngoài. |
| `ClientDiagnostics` | Hook sâu callback, promise và runtime để chẩn đoán. | Có thể thu dữ liệu nhạy cảm và làm client mất ổn định. |
| `compactMode` | UI thu gọn gắn với modal/icon/plugin riêng của fork. | Hard-code component Nightcord và dependency không tương thích. |
| `cursorMacOS` | Thay con trỏ hệ thống Windows. | Thay đổi toàn hệ thống, vượt phạm vi an toàn của userplugin. |
| `DynamicIslande` | UI dynamic-island kết nối tích hợp nhạc/fork. | Thiếu SoundCord, dịch vụ nhạc và API riêng của fork. |
| `encryptedMessage` | Giao thức tin nhắn mã hóa tự xây. | Crypto/vòng đời khóa/chuyển tin chưa đủ kiểm toán, dễ tạo cảm giác E2E giả. |
| `enhancedScreenshare` | Hook đường capture/audio native để tăng cường stream. | Phụ thuộc phiên bản/OS, ảnh hưởng riêng tư và dễ crash. |
| `ghostClient` | Điều khiển nhiều tài khoản/token qua companion server local. | Lộ token giá trị cao và biên dịch vụ lớn chưa kiểm toán. |
| `GhostInstaller.desktop` | Cài/patch companion hoặc dịch vụ desktop. | Installer từ xa/background service vượt phạm vi userplugin an toàn. |
| `mullvadDNS` | Chặn/đổi DNS hoặc URL sang IP đã resolve. | Có thể phá giả định TLS/HTTPS và thay đổi ranh giới tin cậy. |
| `nightcordAI` | Trung tâm AI của fork dùng Groq và luồng credential/config chung. | Phụ thuộc nhà cung cấp, tập trung API key và xử lý tin nhắn bên ngoài. |
| `nightcordOfficialDM` | Hiển thị tin chính thức của fork và feed Mastodon. | Kênh truyền thông do nhà cung cấp vận hành, tạo thêm tin cậy bên ngoài không cần thiết. |
| `nightcordUpdater` | Cập nhật bản fork/private release. | Đường cập nhật mã từ xa và không phù hợp userplugin Equicord độc lập. |
| `optimisations` | Hook hiệu năng/UI/runtime diện rộng. | Trùng `fastDiscord`; dùng chung tăng xung đột và mất ổn định. |
| `PrevNames` | Lấy lịch sử username từ API không chính thức. | Lo ngại riêng tư/liệt kê và nguồn dữ liệu không kiểm chứng. |
| `privateBrowser` | Nhúng trình duyệt đầy đủ với cookie, download và popup. | Bề mặt phishing, cookie, download và nội dung/mã từ xa quá lớn. |
| `qxChat` | Kết nối dịch vụ chat/mã hóa qxch.at. | Biên tin cậy ngoài về danh tính, uptime, moderation và mật mã. |
| `SaveGroups` | Lưu/khôi phục group bằng monkey-patch REST/message toàn cục. | Hook không giới hạn có thể đổi request/tin nhắn không liên quan. |
| `SaveVideos` | Lưu video bằng ghi file native từ URL/path. | Hành vi URL/path/filesystem chưa được giới hạn đủ chặt. |
| `SecureBookmarks` | Lưu bookmark “bảo mật” bằng mật khẩu trong settings. | Vòng đời khóa/bí mật yếu và tạo bảo đảm “secure” gây hiểu nhầm. |
| `snipeAttachments` | Bắt/cache attachment đã bị xóa. | Rủi ro đồng thuận, riêng tư, thời hạn lưu và filesystem. |
| `soundcloudPlayer` | Tích hợp auth/cookie/token SoundCloud và tiến trình native. | Credential ngoài, endpoint, native execution và tracking. |
| `statusCycler` | Luân phiên trạng thái và có hành vi script từ xa cho Spicetify. | Thực thi script từ xa và sửa ứng dụng khác. |
| `stereoInstaller.desktop` | Thay binary voice native của Discord. | Thay binary nhạy cảm chuỗi cung ứng và rất dễ hỏng theo phiên bản. |
| `totpManager` | Lưu secret TOTP và đồng bộ qua cloud/vendor. | Secret xác thực cần thiết kế lưu, mã hóa, export và recovery được kiểm toán riêng. |
| `uncompressedImages` | Monkey-patch setter thuộc tính DOM toàn cục cho URL media. | Hook toàn trang không giới hạn, ảnh hưởng tương thích và bảo mật. |
| `wordBomb` | Tự chơi game bằng Groq, Wikipedia và endpoint từ điển của nhà cung cấp. | Tự động gameplay cùng nhiều biên tin cậy API/dữ liệu ngoài. |
| `youtubePlayer` | Nhúng YouTube với helper danh sách server của fork. | Tracking/embed ngoài và thiếu dependency riêng của fork. |

## Ghi chú bảo mật và riêng tư

- Không dán token tài khoản chính vào bất kỳ plugin nào. Hãy coi token bị lộ như mật khẩu bị lộ và thu hồi phiên ngay.
- Chỉ thử plugin mức nghiêm trọng/cao bằng tài khoản phụ và server thử nghiệm do bạn kiểm soát.
- Kiểm tra mọi endpoint và ô API key trước khi bật `autoCorrect`, `voiceDictation`, media profile/hình nền từ xa hoặc plugin xem web.
- Local-only nghĩa là “không chủ đích đồng bộ với nhà cung cấp”; không có nghĩa plugin sẽ không gọi Discord hoặc URL ngoài do người dùng cấu hình để thực hiện chức năng đã mô tả.
- Bản cập nhật Discord/Equicord có thể làm patch hỏng bất ngờ. Hãy tắt plugin liên quan nếu settings, menu, render, voice hoặc khởi động mất ổn định.
- File export DM, event log, profile đã lưu và database giám sát phải được bảo vệ như dữ liệu tài khoản riêng tư.

## Giấy phép

GPL-3.0-or-later. Các file riêng lẻ giữ nguyên thông báo bản quyền và SPDX ban đầu nếu có.
