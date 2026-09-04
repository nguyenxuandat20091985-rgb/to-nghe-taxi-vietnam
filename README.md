# Đền Tổ Nghề Taxi Việt Nam

Ứng dụng web/PWA tri ân nghề taxi Việt Nam, hỗ trợ dâng hương, lời khấn, quẻ, lịch, công đức, hồ sơ và kết nối cộng đồng tài xế.

## Trạng thái hiện tại

- Frontend chính: `index.html`, kiến trúc single-file, HTML/CSS/Vanilla JS.
- Firebase Authentication: Anonymous Auth.
- Firebase Firestore: lưu/đồng bộ `users/{uid}` theo tài khoản ẩn danh.
- PWA: `manifest.json` + `service-worker.js`, có cache app-shell và fallback offline.
- AI: frontend gọi `/api/chat`; khóa `GROQ_API_KEY` chỉ nằm ở serverless proxy, không nằm trong trình duyệt hay Git.
- Firebase Hosting: đã có cấu hình production trong `firebase.json`.
- API proxy `api/chat.js`: tương thích Vercel. Firebase Hosting không tự chạy thư mục `api/`; nếu cần AI trên cùng domain Firebase, chuyển proxy sang Cloud Functions/Cloud Run và thêm rewrite tương ứng.

## Công nghệ

- HTML5 / CSS3 / Vanilla JavaScript ES6+
- Firebase Web SDK 10.12.2 (Auth + Firestore)
- Firebase Hosting + Firestore Rules
- PWA Service Worker
- Vercel Serverless Function cho AI proxy

Firebase frontend config có thể xuất hiện trong mã client; đó là cấu hình nhận diện project, không phải secret. Bảo mật dữ liệu nằm ở Firestore Rules và bảo mật AI nằm ở biến môi trường của proxy.

## Chạy local

```bash
python3 -m http.server 8080
```

Mở `http://localhost:8080`. PWA/service worker cần HTTPS hoặc localhost.

## Firebase lần đầu

Project mặc định: `to-nghe-taxi`.

1. Firebase Console → Authentication → Sign-in method → bật **Anonymous**.
2. Tạo Firestore Database.
3. Kiểm tra `js/firebase-config.js` đúng project.
4. Đăng nhập Firebase CLI và triển khai rules/hosting:

```bash
firebase login
firebase use to-nghe-taxi
firebase deploy --only hosting,firestore:rules
```

Firebase Hosting cung cấp HTTPS và CDN; project này dùng thư mục gốc làm public root để giữ nguyên single-file architecture.

## AI proxy

`api/chat.js` nhận `POST /api/chat`, giới hạn message 2.000 ký tự và gửi request tới Groq bằng `process.env.GROQ_API_KEY`. Không đặt khóa trong `index.html`, `localStorage`, Firebase config hoặc GitHub.

Để chạy AI bằng Vercel:

```bash
vercel
vercel env add GROQ_API_KEY production
```

Sau khi triển khai, nếu frontend được host cùng Vercel thì `/api/chat` hoạt động trực tiếp. Nếu frontend được host riêng trên Firebase Hosting, cần đặt `AI_API_URL` thành URL proxy Vercel hoặc chuyển proxy vào Firebase Functions/Cloud Run; không đưa secret vào frontend.

## PWA / offline

Service worker cache app-shell gồm `index.html`, manifest và icon. Request GET được cache sau khi tải thành công; khi mất mạng, app ưu tiên bản cache và fallback về `index.html`. Service worker được đăng ký từ `index.html` khi chạy trên HTTPS/localhost.

## Bảo mật Firestore

`firestore.rules` chỉ cho phép tài khoản đã xác thực đọc/ghi tài liệu `users/{uid}` của chính mình; mọi đường dẫn khác mặc định bị từ chối. Không lưu API key hoặc dữ liệu bí mật vào Firestore.

## Cấu trúc chính

```text
index.html
manifest.json
service-worker.js
js/firebase-config.js
js/firebase-bridge.js
firestore.rules
firebase.json
.firebaserc
api/chat.js
docs/
```

## Roadmap phát hành

### Phase 1 — Core

- [x] Single-file responsive web app
- [x] Dâng hương, lời khấn, công đức, hồ sơ

### Phase 2 — Data

- [x] Firebase Anonymous Auth
- [x] Firestore state sync
- [x] Firestore security rules

### Phase 3 — PWA

- [x] Manifest
- [x] Service worker
- [x] Offline app-shell

### Phase 4 — AI

- [x] Server-side proxy architecture
- [x] Không lưu API key ở client
- [ ] Production proxy deployment + smoke test

### Phase 5 — Community

- [ ] Dữ liệu bài viết/community thực trên Firestore
- [ ] Báo cáo nội dung và moderation
- [ ] Tài khoản bền vững (Google/email/phone) để đồng bộ đa thiết bị

### Phase 6 — Release

- [ ] Production domain
- [ ] Android/iPhone install verification
- [ ] Firebase Hosting production deploy
- [ ] AI endpoint production smoke test
- [ ] Backup/monitoring và quy trình rollback

## Ghi chú

Nội dung quẻ, lời chúc và tiện ích tâm linh mang tính tinh thần/giải trí, không thay thế tư vấn y tế, pháp lý, tài chính hoặc an toàn giao thông chuyên môn.

© 2026 TỔ NGHỀ TAXI VIỆT NAM
