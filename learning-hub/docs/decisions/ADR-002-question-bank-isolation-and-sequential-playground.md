# ADR-002: Cách ly Ngân hàng đề (`bankOnly`) và Code Playground mở khóa tuần tự

| | |
|---|---|
| **Trạng thái** | Accepted (17–18/10/2026) — áp dụng từ v1.0 |
| **Người quyết định** | Dương Chí Việt (owner Learning Hub) |
| **Liên quan** | Commit `8902fcb`, `c044190`; `audit-day31.js`; [ARCHITECTURE.md mục 2.1–2.2](../../ARCHITECTURE.md#2-luồng-dữ-liệu) |

## Bối cảnh

Kiểm thử thủ công với tài khoản Khối 6–9 phát hiện `/playground` sai ở ba điểm:

1. **Lọt bài SQL** (của Data Lab) và có dropdown chủ đề (`python-fundamentals`, `sql`) ở Khối 6–9/10–12.
2. **Khóa tuần tự loạn:** "Tiến độ 2/20" nhưng bài #1 còn ổ khóa, #2 khóa mờ, #3 lại xanh "Đã hoàn thành" — trạng thái khóa được tính ở FE từ dữ liệu trộn chủ đề.
3. **Nguy cơ loãng lộ trình:** bài giảng viên/Admin tạo có thể lọt vào Playground, làm mẫu số "X/N bài" của mọi học viên thay đổi.

Đồng thời giảng viên cần một **Ngân hàng đề** (bài Code + câu Trắc nghiệm) để giao bài theo Ngày và ghép đề cuộc thi.

## Quyết định

**A. Hai kho tách biệt:**

| | Code Playground | Ngân hàng đề |
|---|---|---|
| Nội dung | Lộ trình chuẩn **cố định**: 20 bài (Khối 6–9), 15 bài (Khối 10–12), thứ tự #1..#N | Bài/câu do Giảng viên, Admin hoặc AI Tạo Đề tạo |
| Cờ | `bankOnly` không đặt | **`bankOnly: true`**, `bankBand` 6-9 / 10-12, `authorId` |
| Dùng cho | Luyện tập tự do của học viên | Giao bài theo Ngày cho lớp, đề cuộc thi |
| Sửa/xóa | Chỉ xem (`403 E403_PLAYGROUND_FIXED`) | Sửa/xóa được; đang dùng thì `409 E409_BANK_EXERCISE_IN_USE` |

`bankOnly` được giữ bằng **3 lớp**: (1) service luôn ghi `bankOnly: true` cho bài của Giảng viên/Admin (kể cả khi đồng bộ từ bài giảng); (2) truy vấn Playground và `/quiz` công khai luôn loại `bankOnly`; (3) schema `exercises` tự ép `bankOnly = true` khi có `authorId`.

**B. Mở khóa tuần tự do máy chủ tính** (`GET /api/exercises/playground`):
- Bài #1 luôn mở; bài #k mở khi và chỉ khi học viên đã **AC ở chế độ luyện tập** liên tục #1..#(k-1); bài đã hoàn thành luôn mở lại được.
- Nộp bài chưa mở → `403 E403_EXERCISE_LOCKED`.
- **Bài giao của lớp không bị khóa tuần tự** (bài nộp có `assignmentId`).
- Tiến độ ở `/playground`, *Tiến độ học tập*, *Hồ sơ* và gợi ý bài dùng chung một nguồn.
- Dữ liệu cũ nhảy cóc: `migrate-day31.js` gắn cờ `outOfSequence` (không xóa bài nộp, có `--revert`).

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Cho giảng viên thêm bài vào Playground | Làm lệch lộ trình và mẫu số tiến độ của mọi học viên |
| Lọc Playground theo `topic` do client chọn | Client có thể tự chọn `sql`; luật phải nằm ở máy chủ |
| Xóa bài nộp nhảy cóc cũ | Mất dữ liệu học viên; gắn cờ an toàn hơn và đảo ngược được |
| Khóa tuần tự cả bài giao của lớp | Giảng viên giao bài ngoài thứ tự lộ trình là hợp lệ; khóa sẽ chặn học viên làm bài được giao |

## Hệ quả

**Tích cực:** lộ trình học viên ổn định (mẫu số không đổi), không nhảy cóc kể cả qua API, giảng viên tự do soạn/giao bài; kiểm chứng tự động bằng `audit-day31.js` (36/36), `audit-cross-role-consistency.js` (payload Playground không chứa bài `bankOnly`) và E2E Luồng 2.

**Tiêu cực:** muốn đổi lộ trình chuẩn phải sửa dữ liệu nền (không có giao diện); thêm một truy vấn tính trạng thái khóa mỗi lần mở Playground.
