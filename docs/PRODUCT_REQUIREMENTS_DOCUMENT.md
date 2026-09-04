# PRODUCT REQUIREMENTS DOCUMENT (PRD)

Version: 2.0  
Status: Production preparation  
Project: TỔ NGHỀ TAXI VIỆT NAM

---

## 1. PRODUCT OVERVIEW

TỔ NGHỀ TAXI VIỆT NAM là một ứng dụng web/PWA mang tính biểu tượng, tạo không gian số để tri ân nghề taxi, thực hiện nghi thức dâng hương, lưu lời khấn và kết nối cộng đồng tài xế.

Sản phẩm ưu tiên giá trị tinh thần, văn hóa nghề nghiệp, sự bình an và an toàn khi hành nghề; không cổ súy mê tín cực đoan.

## 2. TARGET USERS

- Taxi truyền thống
- Taxi công nghệ
- Lái xe hợp đồng
- Lái xe dịch vụ
- Người quan tâm và ủng hộ nghề taxi Việt Nam

## 3. PRODUCT GOALS

Người dùng có thể mở app trong khoảng 30 giây để:

1. Dâng hương.
2. Gửi lời khấn.
3. Nhận lời chúc/quẻ mang tính tinh thần.
4. Ghi nhận công đức và lịch sử.
5. Quay lại hằng ngày và kết nối cộng đồng.

## 4. CORE FEATURES

- Splash/opening experience
- Trang chủ và không gian bàn thờ số
- Dâng hương, hiệu ứng khói/âm thanh
- Lời khấn và lịch sử dâng hương
- Phúc lộc/quẻ/lịch
- Hồ sơ và huy hiệu
- Cộng đồng và tin tức (giao diện hiện tại, backend cộng đồng là Phase 5)
- AI tư vấn tiếng Việt qua server-side proxy
- PWA và offline app-shell

## 5. DATA REQUIREMENTS

### Client state

LocalStorage được dùng làm lớp trải nghiệm/offline để app vẫn chạy khi mạng không ổn định.

### Cloud state

Firebase Authentication Anonymous cung cấp UID. Firestore lưu state ứng dụng tại `users/{uid}`. Client chỉ được đọc/ghi tài liệu của chính UID theo `firestore.rules`.

Dữ liệu cloud phải được giới hạn kích thước và trường cần thiết; không lưu API key, mật khẩu hoặc bí mật máy chủ.

### Future identity

Để đồng bộ đáng tin cậy giữa nhiều thiết bị, Phase 5/6 sẽ bổ sung phương thức đăng nhập bền vững (Google, email hoặc phone) sau khi UX hiện tại ổn định.

## 6. AI REQUIREMENTS

AI được gọi qua `POST /api/chat` thay vì gọi trực tiếp Groq từ browser.

- Secret `GROQ_API_KEY` chỉ nằm ở serverless runtime.
- Message tối đa 2.000 ký tự.
- Proxy trả JSON và không cache response.
- AI phải trả lời tiếng Việt, thân thiện và ngắn gọn.
- Không coi AI là nguồn tư vấn y tế, pháp lý, tài chính hoặc an toàn giao thông chuyên môn.

`api/chat.js` hiện tương thích Vercel. Khi triển khai frontend bằng Firebase Hosting, AI endpoint phải được đặt ở proxy Vercel riêng hoặc chuyển sang Firebase Functions/Cloud Run; không được đưa secret vào frontend.

## 7. NON-FUNCTIONAL REQUIREMENTS

- Responsive mobile-first.
- HTTPS production.
- PWA installable.
- Offline app-shell.
- UX mượt, hạn chế reflow/repaint.
- Firestore rules deny-by-default.
- API key không xuất hiện trong source client.
- Có thể rollback production.

## 8. DEPLOYMENT REQUIREMENTS

Firebase Hosting được cấu hình trong `firebase.json` với root public là repository root vì ứng dụng hiện dùng `index.html` ở root.

Lệnh release Firebase:

```bash
firebase login
firebase use to-nghe-taxi
firebase deploy --only hosting,firestore:rules
```

AI proxy Vercel được triển khai riêng nếu giữ kiến trúc `api/chat.js`.

## 9. RELEASE ACCEPTANCE CRITERIA

- App mở được bằng HTTPS public URL.
- Không có lỗi JavaScript nghiêm trọng khi tải app.
- Anonymous Auth tạo được UID.
- Firestore đọc/ghi được `users/{uid}`.
- Dữ liệu vẫn có thể dùng offline ở mức client state.
- Service worker đăng ký thành công.
- AI proxy không yêu cầu API key từ người dùng.
- Firestore Rules từ chối truy cập chéo UID.
- Mobile Android/iPhone có thể cài PWA và thao tác các luồng chính.

## 10. ROADMAP

### Phase 1 — Core

Hoàn thiện trải nghiệm dâng hương, lời khấn, hồ sơ, công đức và responsive UI.

### Phase 2 — Firebase Data

Anonymous Auth + Firestore sync + security rules.

### Phase 3 — PWA

Manifest + service worker + offline app-shell.

### Phase 4 — AI

Server-side proxy, secret management, rate/length validation và production smoke test.

### Phase 5 — Community

Firestore collections cho bài viết, phản hồi, báo cáo nội dung và moderation; nâng cấp identity để đồng bộ đa thiết bị.

### Phase 6 — Release

Production domain, monitoring, backup/rollback, mobile verification và phát hành chính thức.
