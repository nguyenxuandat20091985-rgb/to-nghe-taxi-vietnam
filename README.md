# Đền Tổ Nghề Taxi Việt Nam

Ứng dụng web tri ân nghề taxi Việt Nam, hỗ trợ trải nghiệm dâng hương, lời khấn, quẻ, lịch, công đức và kết nối cộng đồng tài xế.

## Mở app trực tiếp

[https://nguyenxuandat20091985-rgb.github.io/to-nghe-taxi-vietnam/](https://nguyenxuandat20091985-rgb.github.io/to-nghe-taxi-vietnam/)

Ứng dụng đã được cấu hình GitHub Pages. Mỗi lần cập nhật vào nhánh `main`, GitHub Pages sẽ tự triển khai lại đường link trên.

## Tính năng hiện có

- Trang chủ với không gian hình ảnh chủ đề nghề taxi.
- Dâng hương, hiệu ứng khói, âm thanh và cộng điểm công đức.
- Lưu lời khấn và lịch sử thao tác trên thiết bị.
- Quẻ hằng ngày, lịch âm cơ bản, tin tức và cộng đồng dạng giao diện.
- Hồ sơ, huy hiệu, công đức và các tiện ích tinh thần.
- AI tư vấn thử nghiệm thông qua Groq API Key do người dùng tự nhập.
- Giao diện responsive cho điện thoại và máy tính.
- PWA: có manifest, biểu tượng app và bộ nhớ đệm offline app-shell.

## Cài lên màn hình điện thoại

### Android

1. Mở link bằng Chrome.
2. Chọn menu ba chấm.
3. Chọn **Cài đặt ứng dụng** hoặc **Thêm vào màn hình chính**.
4. Xác nhận cài đặt.

### iPhone

1. Mở link bằng Safari.
2. Chọn nút **Chia sẻ**.
3. Chọn **Thêm vào Màn hình chính**.
4. Chọn **Thêm**.

## Chạy trên máy tính để kiểm tra

Có thể mở trực tiếp `index.html`. Để kiểm tra đầy đủ PWA và service worker, nên dùng máy chủ HTTPS hoặc máy chủ local:

```bash
python3 -m http.server 8080
```

Sau đó mở `http://localhost:8080`.

## Cấu trúc các file chính

```text
index.html              Giao diện và logic frontend hiện tại
manifest.json           Cấu hình cài đặt PWA
service-worker.js       Cache app-shell và hỗ trợ offline
icons/icon-192.png      Biểu tượng ứng dụng cho màn hình nhỏ
icons/icon-512.png      Biểu tượng ứng dụng cho màn hình lớn/PWA
js/firebase-config.js   Cấu hình Firebase dự phòng cho giai đoạn backend
js/firebase-bridge.js   Đăng nhập ẩn danh và đồng bộ Firestore
firestore.rules         Quyền truy cập dữ liệu theo từng tài khoản
firebase.json           Cấu hình Firebase CLI
app.py                  Bộ chạy Streamlit cũ, không cần cho GitHub Pages
```

## Ghi chú phát hành

Bản web vẫn lưu dữ liệu vào `localStorage` để chạy offline, đồng thời đã có lớp đồng bộ Firebase Firestore theo tài khoản ẩn danh. Bản này đồng bộ các phiên trên cùng trình duyệt/thiết bị; muốn đồng bộ chắc chắn giữa nhiều điện thoại cần bổ sung đăng nhập Google, email hoặc số điện thoại để giữ cùng một tài khoản.

## Thiết lập Firebase lần đầu

Trong Firebase Console của project `to-nghe-taxi`, cần bật **Authentication → Sign-in method → Anonymous** và tạo **Firestore Database**. Sau đó triển khai rules:

```bash
firebase login
firebase use to-nghe-taxi
firebase deploy --only firestore:rules
```

File `js/firebase-config.js` chỉ chứa cấu hình nhận diện frontend do Firebase cung cấp; đây không phải secret. Quyền bảo vệ dữ liệu nằm trong `firestore.rules`, chỉ cho phép mỗi tài khoản đọc/ghi tài liệu `users/{uid}` của chính mình.

AI hiện đang gọi trực tiếp Groq từ trình duyệt và người dùng phải tự nhập API Key. Không nên dùng cách này cho bản thương mại; khi phát hành chính thức cần chuyển khóa API vào backend hoặc serverless function.

## Bảo mật AI

Ô nhập API Key đã được gỡ khỏi giao diện và ứng dụng không còn lưu khóa trong `localStorage`. Frontend gọi endpoint `/api/chat`; file `api/chat.js` là proxy serverless tương thích Vercel và đọc khóa từ biến môi trường `GROQ_API_KEY` trên máy chủ.

GitHub Pages chỉ chạy frontend tĩnh, nên muốn bật AI thật cần triển khai thư mục `api/` lên một dịch vụ serverless, đặt secret `GROQ_API_KEY` ở phần Environment Variables, sau đó đổi `AI_API_URL` trong `index.html` thành URL backend đó. Không commit API Key vào GitHub và nếu khóa cũ đã từng bị lộ thì cần thu hồi/tạo khóa mới tại Groq.

Nội dung quẻ, lời chúc và tiện ích tâm linh chỉ mang tính tinh thần/giải trí, không thay thế tư vấn y tế, pháp lý, tài chính hoặc an toàn giao thông chuyên môn.

## Lộ trình đề xuất

1. Hoàn thiện PWA và kiểm thử trên Android/iPhone.
2. Kết nối Firebase Authentication và Firestore.
3. Làm cộng đồng, quản trị nội dung và báo cáo bài viết.
4. Chuyển AI sang backend bảo mật.
5. Đóng gói Android bằng Capacitor sau khi bản web ổn định.

© 2026 TỔ NGHỀ TAXI VIỆT NAM
