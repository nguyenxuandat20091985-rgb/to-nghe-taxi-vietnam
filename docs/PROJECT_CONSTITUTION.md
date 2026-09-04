# PROJECT CONSTITUTION

Version: 2.0  
Project Name: TỔ NGHỀ TAXI VIỆT NAM  
Status: Production preparation

---

## PURPOSE

Tạo một không gian số trang nghiêm, hiện đại để tri ân nghề taxi Việt Nam, hỗ trợ nghi thức dâng hương mang tính tinh thần và kết nối cộng đồng tài xế.

## CORE VALUES

- Tôn trọng văn hóa Việt Nam.
- Không mê tín cực đoan.
- Đề cao an toàn khi hành nghề.
- Kết nối cộng đồng văn minh.
- Thiết kế cao cấp, dễ sử dụng.
- Bảo vệ dữ liệu người dùng.

## PRODUCT PRINCIPLES

- Mobile-first.
- Trải nghiệm nhanh, rõ và mượt.
- Nội dung tinh thần không được trình bày như tư vấn chuyên môn.
- Không dùng dark patterns để ép người dùng.
- Tôn trọng quyền riêng tư và quyền kiểm soát dữ liệu.

## DEVELOPMENT RULES

Frontend vẫn giữ single-file architecture tại `index.html`, sử dụng HTML/CSS/Vanilla JavaScript.

Được phép sử dụng managed backend services khi cần cho mục tiêu sản phẩm:

- Firebase Authentication.
- Cloud Firestore.
- Firebase Hosting.
- Serverless API proxy.

Không được hiểu nguyên tắc “single-file frontend” là cấm backend. Backend phải có ranh giới rõ ràng và không làm lộ secret cho browser.

## DATA RULES

- LocalStorage chỉ chứa client state cần cho UX/offline.
- Firestore phải dùng Security Rules theo nguyên tắc least privilege.
- Không lưu API keys, passwords hoặc service-account credentials ở client.
- Dữ liệu người dùng phải được giới hạn về kích thước và trường cần thiết.
- Community trong tương lai phải có rules riêng, moderation và báo cáo nội dung.

## AI RULES

AI được phép hỗ trợ trải nghiệm nếu:

- Browser chỉ gọi proxy server-side.
- Secret `GROQ_API_KEY` nằm trong environment variable của serverless runtime.
- Không commit secret vào Git.
- Có giới hạn input và xử lý lỗi.
- Không trình bày AI như nguồn tư vấn y tế, pháp lý, tài chính hoặc an toàn giao thông chuyên môn.

`api/chat.js` hiện là proxy tương thích Vercel. Nếu chuyển sang Firebase Functions/Cloud Run, phải giữ nguyên nguyên tắc bảo mật và cập nhật tài liệu kiến trúc.

## HOSTING RULES

Firebase Hosting là kênh static production được hỗ trợ. `firebase.json` phải chỉ rõ public root, ignore các file nội bộ và không vô tình publish secrets.

Lệnh chuẩn:

```bash
firebase deploy --only hosting,firestore:rules
```

Nếu AI chạy bằng Vercel, deployment AI là một service riêng. Nếu muốn một domain duy nhất, có thể chuyển proxy sang Firebase Functions/Cloud Run và cấu hình Hosting rewrite.

## QUALITY GATE

Không coi dự án hoàn tất chỉ vì code đã commit. Release phải vượt các kiểm tra:

- Public HTTPS URL mở ổn định.
- Firebase Auth hoạt động.
- Firestore rules đúng quyền.
- Offline/PWA hoạt động.
- AI proxy không làm lộ secret.
- Mobile UI hoạt động tốt.
- Có phương án rollback.

## LONG-TERM GOAL

Xây dựng một nền tảng số đáng tin cậy cho cộng đồng tài xế taxi Việt Nam, bắt đầu từ trải nghiệm tri ân nghề và mở rộng có kiểm soát sang cộng đồng, tin tức và các tiện ích nghề nghiệp.
