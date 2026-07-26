# TECHNICAL ARCHITECTURE

Version: 1.0

Project:
TỔ NGHỀ TAXI VIỆT NAM

---

# ARCHITECTURE PHILOSOPHY

Ứng dụng được thiết kế theo nguyên tắc:

Single File Application.

Toàn bộ ứng dụng chạy trong duy nhất:

app/index.html

Không Backend.

Không Framework.

Không Build Tool.

Không Node.js.

Không NPM.

Không CDN bắt buộc.

Có thể chạy offline sau khi tải.

---

# TECHNOLOGY STACK

HTML5

CSS3

Vanilla JavaScript (ES6+)

SVG

Canvas (nếu cần)

Web Audio API (nếu cần)

LocalStorage

---

# PROJECT STRUCTURE

Repository

README.md

docs/

app/

app/index.html

Không tạo thêm file chạy nào khác.

---

# HTML STRUCTURE

index.html bao gồm:

<head>

- Meta
- SEO
- Open Graph
- Theme Color
- Manifest (chuẩn bị cho PWA)
- Structured Data (nếu cần)

<body>

- Splash Screen
- Opening Cinematic
- Sacred Plaza
- Altar
- Navigation
- Dialog
- Toast
- Modal
- Loading
- Audio Layer
- Particle Layer

---

# CSS ARCHITECTURE

Toàn bộ CSS đặt trong:

<style>

Chia rõ:

1. Reset

2. Variables

3. Typography

4. Layout

5. Components

6. Animation

7. Responsive

8. Utility

Không viết CSS lặp.

Ưu tiên CSS Variables.

---

# JAVASCRIPT ARCHITECTURE

Toàn bộ JavaScript đặt trong:

<script>

Tổ chức theo Module Pattern:

App

UI

Animation

Audio

Storage

Router

Effects

Prayer

Profile

Community

Utils

Không dùng biến toàn cục nếu không cần.

---

# DATA STORAGE

Chỉ sử dụng LocalStorage.

Ví dụ:

- Lần đầu mở app
- Số ngày dâng hương
- Chuỗi ngày liên tiếp
- Hồ sơ người dùng
- Cài đặt giao diện
- Bật/tắt âm thanh

Không lưu dữ liệu nhạy cảm.

---

# PERFORMANCE

Mục tiêu:

60 FPS

Tối ưu cho Android.

Tối ưu cho iPhone.

Giảm số lần repaint.

Giảm reflow.

Không memory leak.

Lazy khởi tạo các hiệu ứng nặng.

---

# ACCESSIBILITY

Nút lớn.

Dễ bấm.

Độ tương phản tốt.

Có nhãn cho các thành phần chính.

---

# OFFLINE

Ứng dụng vẫn hoạt động khi mất mạng (trừ các chức năng trực tuyến trong tương lai).

Chuẩn bị cấu trúc để sau này nâng cấp thành PWA.

---

# SECURITY

Không nhúng khóa API.

Không thực thi mã từ nguồn không tin cậy.

Kiểm tra dữ liệu trước khi lưu vào LocalStorage.

---

# CODING STANDARDS

Tên biến rõ nghĩa.

Tên hàm theo động từ.

Comment cho các phần quan trọng.

Không lặp code.

Tách logic theo từng module trong cùng file.

---

# FUTURE EXPANSION

Kiến trúc phải cho phép bổ sung:

- Đăng nhập
- Đồng bộ dữ liệu
- Cộng đồng
- Bản đồ
- Tin tức
- Thông báo
- AI hỗ trợ
- PWA
- Ứng dụng đa ngôn ngữ

Mà không cần viết lại toàn bộ mã nguồn.

---

# FINAL PRINCIPLE

Mọi AI hoặc lập trình viên tham gia dự án phải:

- Tuân thủ PROJECT_CONSTITUTION.md
- Tuân thủ PRD
- Tuân thủ UI_UX_BIBLE.md
- Tuân thủ ANIMATION_BIBLE.md
- Tuân thủ DESIGN_SYSTEM.md
- Tuân thủ TECHNICAL_ARCHITECTURE.md

Không được tự ý thay đổi kiến trúc nếu chưa cập nhật tài liệu.