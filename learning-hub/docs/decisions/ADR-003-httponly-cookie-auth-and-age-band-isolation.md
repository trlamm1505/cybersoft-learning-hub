# ADR-003: Phiên cookie httpOnly + CSRF và phân tách nghiêm ngặt theo nhóm tuổi

| | |
|---|---|
| **Trạng thái** | Accepted (17/10/2026) — áp dụng từ v1.0 |
| **Người quyết định** | Dương Chí Việt (owner Learning Hub) |
| **Liên quan** | Commit `c044190`; báo cáo `Day29_Security_Privacy_Test_Form` của Tester Trần Quốc Nguyên (SEC-03/04/10/13/14/18/24/25, PRV-03/04/05); Deep Audit Day 29 mục H1, H5, M7, L3; `audit-day29-security-privacy.js` |

## Bối cảnh

Deep Audit Day 29 xác nhận:

- **H5:** frontend lưu JWT trong `localStorage` (`App.tsx`, `configAxios.ts`), nên cookie httpOnly backend đã đặt **mất tác dụng** — một lỗi XSS bất kỳ đọc được token (SEC-18, PRV-05).
- **L3:** danh sách token đã đăng xuất chỉ nằm trong RAM — khởi động lại backend là token cũ dùng lại được.
- **H1 / M7:** người chưa đăng nhập đọc được bài tập/bài giảng; học sinh Khối 3–5 lấy được bài của Khối 6–9 và 10–12; học viên chưa có `ageGroup` không bị giới hạn khối (SEC-03/04/10/24/25, PRV-03/04).
- Học sinh 3–5 vẫn tạo được lượt thi trắc nghiệm Python (RISK-02 / TC_K35_03), trong khi Khối 3–5 chỉ học bằng game Blockly.

## Quyết định

**A. Phiên đăng nhập bằng cookie httpOnly:**
- Backend đặt cookie `access_token` **httpOnly**, `SameSite=Strict`, `Secure` khi production; frontend gọi API với `withCredentials` và **không đọc, không lưu JWT**. `localStorage` chỉ còn giữ hồ sơ hiển thị (`app_auth_user`) và CSRF token.
- **CSRF Double Submit Cookie:** request đổi dữ liệu phải gửi header `x-csrf-token` trùng cookie `csrf_token`.
- JWT được **đối chiếu với DB ở mọi request** (vai trò, trạng thái khóa, `sessionsRevokedAt`).
- Đăng xuất ghi `jti` vào collection **`revoked_tokens`** có TTL index trên `expiresAt` (bền qua khởi động lại, dùng chung nhiều instance, tự dọn).
- Bổ sung: `JWT_SECRET` bắt buộc (không có khóa mặc định), CORS theo danh sách cho phép, header bảo mật, rate limit.

**B. Phân tách theo nhóm tuổi ở máy chủ:**

| Nhóm | Được dùng | Chặn |
|---|---|---|
| **Khối 3–5** | Góc Học Tập `/block-puzzle` (Blockly), Bảng Vinh Danh | Quiz, chạy/nộp code, kiểm tra cú pháp, AI Coach → `403 E403_KID_NO_CODE_QUIZ` (`NoKidCodeGuard`); FE đưa mọi URL khác về `/block-puzzle`; không lưu `phone`/`bio` |
| **Khối 6–9 / 10–12** | Playground đúng khối, `/quiz`, lớp, cuộc thi đúng khối | Bài khác khối (kể cả gọi thẳng slug); cuộc thi khác `gradeBand` → 403 |
| **Người đi làm** | `/career-labs` (3 khóa Tester QA / Data / AI) | Lộ trình phổ thông |
| Chưa đăng nhập | `/login`, `/register`, `/forgot-password`, `/reset-password`, danh sách cuộc thi | API bài tập, bài giảng → 401 |

`ageGroup` chỉ thuộc về học viên: lên giảng viên thì xóa `ageGroup`; đổi khối thì rút khỏi lớp khác khối.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Giữ JWT trong `localStorage` + header Bearer | Lộ token khi có XSS; mâu thuẫn với cookie httpOnly đã có |
| Cookie httpOnly không kèm CSRF | Trình duyệt tự đính cookie → dễ bị CSRF với request đổi dữ liệu |
| Danh sách thu hồi trong RAM / Redis | RAM mất khi restart; Redis thêm hạ tầng — collection MongoDB có TTL đủ cho v1.0 |
| Chỉ ẩn menu theo khối ở FE | Gọi thẳng API vẫn lấy được dữ liệu; luật phải nằm ở máy chủ |

## Hệ quả

**Tích cực:** token không bị JavaScript đọc; khóa tài khoản/đặt lại mật khẩu có hiệu lực ngay; dữ liệu trẻ em và nội dung theo khối được bảo vệ ở tầng API. Kiểm chứng: `audit-day29-security-privacy.js` 33/33, `audit-teacher-security.js` 40/40 (token cũ sau logout → 401, đăng nhập lần 6 trong 1 phút → 429).

**Tiêu cực / lưu ý:**
- FE và API phải cùng site (`localhost` với `localhost`; production cùng domain hoặc domain được khai báo) vì `SameSite=Strict`; mở bằng `127.0.0.1` sẽ mất phiên ([SETUP.md lỗi 4](../../SETUP.md#lỗi-4--lệch-cookie-phiên-khi-thử-chéo-địa-chỉ-local)).
- Mỗi request thêm một lần đọc DB để đối chiếu phiên — chấp nhận ở quy mô v1.0.
- Còn mở: Bảng Vinh Danh Kid hiện họ tên đầy đủ (K-06), đồng ý điều khoản chưa lưu bằng chứng (K-04).
