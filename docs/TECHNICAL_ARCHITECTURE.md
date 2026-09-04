# TECHNICAL ARCHITECTURE

Version: 2.0  
Project: TỔ NGHỀ TAXI VIỆT NAM  
Status: Production preparation

---

## 1. ARCHITECTURE

Ứng dụng giữ kiến trúc frontend single-file nhưng đã có backend services managed:

```text
Browser / PWA
   │
   ├── index.html (HTML + CSS + Vanilla JS)
   │
   ├── Firebase Web SDK
   │      ├── Anonymous Auth
   │      └── Firestore
   │
   └── POST /api/chat
          │
          └── Serverless proxy
                 └── Groq API
```

Firebase Hosting phục vụ static frontend. `api/chat.js` là serverless proxy tương thích Vercel; Firebase Hosting không thực thi file `api/` như một function.

## 2. TECHNOLOGY STACK

- HTML5
- CSS3
- Vanilla JavaScript ES6+
- Firebase Web SDK 10.12.2
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting
- Service Worker / PWA
- Vercel Serverless Function cho AI proxy
- LocalStorage làm offline/client fallback

## 3. PROJECT STRUCTURE

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

Không cần framework hoặc build tool cho frontend hiện tại.

## 4. FIREBASE INITIALIZATION

`js/firebase-config.js` chứa Firebase Web App configuration. Các giá trị như `apiKey`, `projectId`, `appId` là thông tin nhận diện client và không thay thế Security Rules.

`js/firebase-bridge.js`:

1. Khởi tạo Firebase App.
2. Khởi tạo Auth và Firestore.
3. Đăng nhập Anonymous.
4. Lấy UID.
5. Đọc/ghi `users/{uid}`.
6. Phát event `firebase-ready` để frontend đồng bộ state.

Firestore chỉ được phép truy cập tài liệu có UID trùng `request.auth.uid`.

## 5. DATA FLOW

Frontend duy trì state hiện tại trong bộ nhớ và LocalStorage để trải nghiệm offline. Sau khi Firebase ready, state được load từ Firestore; các thay đổi được debounce và đồng bộ lên tài liệu người dùng.

Nếu Firebase tạm thời lỗi, app vẫn có thể sử dụng client state/LocalStorage cho các tính năng cục bộ. Không coi Firebase là nguồn duy nhất khiến UI phải chờ tải.

## 6. FIRESTORE SECURITY

`firestore.rules` dùng deny-by-default:

- `users/{userId}`: read/write khi đã authenticated và UID khớp.
- Mọi document/path khác: deny.

Khi mở rộng Community, phải tạo collection/rules riêng với quyền tối thiểu cần thiết; không được mở `allow read, write: if true`.

## 7. AI PROXY SECURITY

Browser không nhận `GROQ_API_KEY`.

`api/chat.js`:

- Chỉ nhận POST và OPTIONS.
- Kiểm tra origin/CORS.
- Kiểm tra `GROQ_API_KEY` trên server.
- Giới hạn message 1–2.000 ký tự.
- Gọi Groq bằng Authorization Bearer từ environment variable.
- Không cache AI response.
- Không trả secret upstream về client.

Production nên bổ sung rate limiting/abuse protection ở lớp edge/serverless trước khi mở rộng quy mô.

## 8. HOSTING

`firebase.json` dùng repository root làm Firebase Hosting public root vì `index.html` nằm ở root. Các file docs, rules, cấu hình và `api/` được loại khỏi static deploy.

Firebase Hosting cung cấp HTTPS/CDN cho frontend. Firebase hỗ trợ rewrite tới Cloud Functions/Cloud Run nếu sau này muốn đưa AI proxy về cùng domain.

## 9. PWA / OFFLINE

`service-worker.js` cache app-shell (`index.html`, manifest, icons), cache các GET response sau khi tải thành công và fallback về cached `index.html` khi offline.

Service worker được đăng ký trên HTTPS hoặc localhost. `service-worker.js` dùng `Cache-Control: no-cache` trên Hosting để browser luôn kiểm tra phiên bản mới.

## 10. PERFORMANCE

- Mobile-first.
- Hạn chế DOM/reflow không cần thiết.
- Lazy initialization cho hiệu ứng nặng.
- Debounce Firebase writes.
- Cache app-shell để giảm thời gian mở app sau lần đầu.
- Không block UI chờ Firebase hoặc AI.

## 11. ACCESSIBILITY

- Nút và vùng chạm đủ lớn.
- Nhãn rõ ràng cho thao tác chính.
- Tương phản tốt.
- Không phụ thuộc duy nhất vào animation/âm thanh để hiểu trạng thái.

## 12. DEPLOYMENT

Firebase:

```bash
firebase login
firebase use to-nghe-taxi
firebase deploy --only hosting,firestore:rules
```

AI proxy Vercel:

```bash
vercel
vercel env add GROQ_API_KEY production
```

Không commit `.env`, API key hoặc service-account credentials.

## 13. TESTING GATE

Trước release phải kiểm tra:

1. Firebase Anonymous Auth tạo UID.
2. Firestore read/write đúng UID.
3. Firestore cross-UID bị từ chối.
4. PWA service worker đăng ký.
5. Offline mở được app-shell.
6. AI proxy trả lỗi rõ ràng khi thiếu secret.
7. AI proxy không nhận API key từ browser.
8. Android/iPhone thao tác được các luồng chính.
9. Production URL dùng HTTPS.
