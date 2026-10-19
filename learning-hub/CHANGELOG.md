# Changelog — CyberSoft Learning & Contest Hub

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/).
Chi tiết bản phát hành: [docs/day30/RELEASE_NOTES_v1.0.md](docs/day30/RELEASE_NOTES_v1.0.md).

## [1.0.0] — 2026-10-19

Bản phát hành chính thức đầu tiên (Ngày 30 — Tuần 6: Tích hợp và phát hành). Nhánh `feature/learning-hub-day30`, tách từ `feat/admin-portal-v2` @ `ac18440`.

### Added
- Tài liệu bàn giao: `docs/day30/ADMIN_TEACHER_HANDBOOK.md` (33 ảnh chụp từ Chrome thật trên dữ liệu `seed:clean`), `docs/day30/OPERATIONS_RUNBOOK.md`, `docs/day30/RELEASE_NOTES_v1.0.md`, `docs/day30/ROADMAP_60D.md`; `AI_WORKLOG.md` theo mẫu Ngày 25 (Day 30, tóm tắt Day 27–31).
- Admin Portal v2: phân công nhiều giảng viên "tick là lưu ngay", đồng bộ vai trò ↔ khối học, chặn khóa giảng viên còn đứng lớp (409), Health Check toàn vẹn lớp – giảng viên, Nhật ký không sửa được (`c044190`).
- Ngân hàng đề Khối 6–9 / 10–12: Bài tập Code + Câu hỏi Trắc nghiệm, CRUD `/teacher/question-bank/questions`, chặn xóa/đổi khối bài đang dùng (409), `bankOnly` khóa cứng (`8902fcb`, `c044190`).
- Giao bài theo Ngày 1..N cho lớp, có hạn nộp do máy chủ kiểm tra.
- Code Playground lộ trình cố định (20 bài 6–9, 15 bài 10–12), mở khóa tuần tự do máy chủ tính, chặn nộp nhảy cóc `E403_EXERCISE_LOCKED`; `migrate-day31.js`.
- Master seed `npm run seed` / `npm run seed:clean` (idempotent, 10 tài khoản chuẩn), `npm run doctor`, `npm run setup`.
- Bộ E2E trình duyệt thật `npm run e2e:browser` (5 luồng, 107 bước); audit `audit-day29-security-privacy.js`, `audit-day30.js`, `audit-day31.js`.

### Changed
- Code runner chạy **100% Local Python Sandbox**; một file cấu hình `BE/.env`.
- `/quiz`: hết giờ tự nộp và vào thẳng màn hình Kết quả; lượt luyện tập luôn được chấm; 3 bộ đề công khai đủ 20 câu cho cả hai khối (`a8044e0`, `ac18440`).
- Bảng điểm lớp Khối 6–9 / 10–12 luôn là điểm Chính thức (bỏ trạng thái "chờ chấm" của bài mẫu) (`ac18440`).
- Đổi khối của học viên rút khỏi mọi lớp khác khối (`ac18440`).
- Backend watch dùng polling, không tự restart giả (`ac18440`).
- Teacher Studio chỉ soạn đề cho Khối 6–9 và 10–12; bỏ CAREER_ADULT, các loại Lab và 3 liên kết chấm DA/AI khỏi giao diện giảng viên.

### Removed
- Docker: nhánh `docker run` trong code runner, `docker-compose*.yml`, `Dockerfile`, `ensure-sandbox.js`, các lệnh `docker:*`, biến `PYTHON_SANDBOX`/`PYTHON_SANDBOX_IMAGE`.
- Bài SQL và dropdown chủ đề khỏi `/playground` Khối 6–9 / 10–12.

### Fixed
- C1: ID giảng viên "ma" làm Admin không phân công được giảng viên.
- Bộ lọc ẩn bài demo ghi đè điều kiện `slug` khiến Ngân hàng đề sửa/xóa nhầm bài đầu tiên trong CSDL.
- Form sửa bài Ngân hàng đề bị đặt lại khi đang gõ (StrictMode tải chi tiết hai lần).
- Chấm bài có bộ test ẩn 0,6–2 MB vượt ngưỡng chờ 15 giây (lọc test trên CSDL, bộ nhớ đệm, FE chờ tới 120 giây).
- `print(__file__)` lộ đường dẫn thư mục tạm qua stdout (DEF-060); traceback/AI Coach lộ đường dẫn (DEF-034, DEF-035).
- Payload object vào trường chuỗi trả 500 thay vì 400 (DEF-050); `answers` sai kiểu vẫn được chấm (DEF-052); học sinh 3–5 gọi được `/quiz/start` (RISK-02).
- React key ở BankPicker, 403 ở hàng chờ chấm, dòng test trống ở form soạn đề, redirect `/admin/*`, ngày tương lai ở Bảng Vinh Danh.

### Security
- JWT secret bắt buộc; phiên cookie httpOnly `SameSite=Strict` + CSRF; thu hồi token; header bảo mật; CORS allowlist; rate limit; chặn NoSQL injection `$`; che PII trong log/prompt; TTL lịch sử AI Coach 90 ngày; Parental Consent; ẩn `authorId`, đáp án, test ẩn khỏi học viên.

## Trước 1.0 — tóm tắt theo tuần

| Tuần | Mốc | Nội dung chính |
|---|---|---|
| Tuần 1 (Ngày 1–5) | Nền móng | Journey map, kiến trúc, monorepo FE React + BE NestJS + MongoDB, mô hình dữ liệu, danh mục khóa học |
| Tuần 2 (Ngày 6–10) | Chấm bài | Quiz engine, Code Playground, online judge có test ẩn và trạng thái AC/WA/TLE/RE/CE, authoring |
| Tuần 3 (Ngày 11–15) | Cuộc thi & nội dung | Contest + leaderboard, content pack lớp 3–12, bộ 15 bài luyện thi thuật toán 10–12 |
| Tuần 4 (Ngày 16–20) | AI Coach | AI Coach Gemini, debug loop, evaluation harness chống lộ đáp án, gợi ý bài |
| Tuần 5 (Ngày 21–25) | Người lớn & analytics | Lab Tester / Data / AI, integrity, Teacher Dashboard, quản trị lớp |
| Tuần 6 (Ngày 26–29) | Tích hợp | Release rehearsal, QA/Eval harness, usability theo nhóm tuổi, security/load, Kid Mode Block Puzzle |
