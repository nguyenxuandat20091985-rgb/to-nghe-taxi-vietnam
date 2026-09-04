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
app.py                  Bộ chạy Streamlit cũ, không cần cho GitHub Pages
```

## Ghi chú phát hành

Bản hiện tại là frontend web. Dữ liệu cá nhân đang lưu bằng `localStorage`, vì vậy chưa đồng bộ giữa nhiều thiết bị. Phần cộng đồng, tin tức và Firebase cần backend/database trước khi sử dụng cho người dùng thật.

AI hiện đang gọi trực tiếp Groq từ trình duyệt và người dùng phải tự nhập API Key. Không nên dùng cách này cho bản thương mại; khi phát hành chính thức cần chuyển khóa API vào backend hoặc serverless function.

Nội dung quẻ, lời chúc và tiện ích tâm linh chỉ mang tính tinh thần/giải trí, không thay thế tư vấn y tế, pháp lý, tài chính hoặc an toàn giao thông chuyên môn.

## Lộ trình đề xuất

1. Hoàn thiện PWA và kiểm thử trên Android/iPhone.
2. Kết nối Firebase Authentication và Firestore.
3. Làm cộng đồng, quản trị nội dung và báo cáo bài viết.
4. Chuyển AI sang backend bảo mật.
5. Đóng gói Android bằng Capacitor sau khi bản web ổn định.

© 2026 TỔ NGHỀ TAXI VIỆT NAM
