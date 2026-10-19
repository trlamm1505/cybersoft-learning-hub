# Changelog — CyberSoft Learning & Contest Hub

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), phiên bản theo [Semantic Versioning](https://semver.org/lang/vi/).
Chi tiết bản phát hành: [docs/day30/RELEASE_NOTES_v1.0.md](docs/day30/RELEASE_NOTES_v1.0.md).

## [1.0.0] — 2026-10-19

Bản phát hành chính thức đầu tiên (Ngày 30 — Tuần 6: Tích hợp và phát hành). Nhánh `feature/learning-hub-day30`, tách từ `feat/admin-portal-v2` @ `ac18440`.

### Added
- **Code Playground mở khóa tuần tự:** lộ trình cố định 20 bài Khối 6–9 và 15 bài Khối 10–12; máy chủ tính trạng thái khóa (#1 luôn mở, #k mở khi đã AC #1..#(k-1)), chặn nộp nhảy cóc `403 E403_EXERCISE_LOCKED`; bài giao của lớp không bị khóa; `migrate-day31.js` (`c044190`).
- **Ngân hàng đề Teacher Studio V2** cho Khối 6–9 / 10–12: Bài tập Code (test công khai + test ẩn) và Câu hỏi Trắc nghiệm (2–6 đáp án), CRUD `/teacher/question-bank` và `/teacher/question-bank/questions`, mọi bài của giảng viên/Admin khóa cứng `bankOnly: true`, chặn xóa/đổi khối bài đang dùng `409 E409_BANK_EXERCISE_IN_USE`; giao bài theo Ngày 1..N có hạn nộp (`8902fcb`, `c044190`).
- **Bộ đề Quiz 20/20 câu** (Python, HTML5, CSS3) cho cả Khối 6–9 và 10–12, **tự nộp khi hết giờ** và vào thẳng màn hình Kết quả (`a8044e0`, `ac18440`).
- **Giám sát chống gian lận chuyển tab trong Contest:** máy chủ đếm lần rời màn hình (chỉ tính khi vắng ≥ 5 giây), lần thứ 3 khóa phòng thi và tự nộp; giảng viên *Không công nhận kết quả* / *Khôi phục* có lý do và nhật ký.
- Admin Portal v2: phân công nhiều giảng viên, chặn khóa giảng viên còn đứng lớp (409), Health Check toàn vẹn lớp – giảng viên, Nhật ký không sửa được (`c044190`).
- Master seed `npm run seed` / `npm run seed:clean` (bước 0 dọn + 9 bước, idempotent, 10 tài khoản chuẩn), `npm run doctor`, `npm run setup`.
- Kiểm thử: E2E trình duyệt thật `npm run e2e:browser` (5 luồng, 107 bước); audit `audit-day29-security-privacy.js`, `audit-day30.js`, `audit-day31.js`.
- Tài liệu: `SETUP.md`, `ARCHITECTURE.md`, `TESTING.md`, `SECURITY.md`, `DEPLOYMENT.md`, `EVALUATION.md`, `DATA.md`, `API.md`, `TROUBLESHOOTING.md`, 3 ADR trong `docs/decisions/`; `docs/day30/` (Handbook kèm 33 ảnh chụp thật, Runbook, Release Notes, Roadmap 60 ngày); `AI_WORKLOG.md` theo mẫu Ngày 25.

### Changed
- **Bỏ hẳn Docker, chuyển sang Local Python Sandbox** (subprocess + AST Guard); một file cấu hình `BE/.env` ([ADR-001](docs/decisions/ADR-001-local-python-sandbox-over-docker.md)).
- **Chuẩn hóa phiên đăng nhập bằng cookie httpOnly** `SameSite=Strict` + CSRF; frontend không còn lưu JWT trong `localStorage` ([ADR-003](docs/decisions/ADR-003-httponly-cookie-auth-and-age-band-isolation.md)).
- **Tự động rút học viên khỏi lớp cũ khi Admin đổi khối tuổi**; lên giảng viên thì xóa `ageGroup` và rút khỏi mọi lớp (`c044190`, `ac18440`).
- Bảng điểm lớp Khối 6–9 / 10–12 luôn là điểm Chính thức.
- Teacher Studio chỉ soạn đề cho Khối 6–9 và 10–12; bỏ CAREER_ADULT, các loại Lab và 3 liên kết chấm DA/AI khỏi giao diện giảng viên.
- Backend watch dùng polling, loại trừ `*.tsbuildinfo` / `*.spec.ts` / `dist` (`ac18440`).

### Removed
- Docker: nhánh `docker run` trong code runner, `docker-compose*.yml`, `Dockerfile`, `ensure-sandbox.js`, các lệnh `docker:*`, biến `PYTHON_SANDBOX`/`PYTHON_SANDBOX_IMAGE`.
- Bài SQL và dropdown chủ đề khỏi `/playground` Khối 6–9 / 10–12.

### Fixed
5 lỗi nghiêm trọng từ Day 29 đến Day 31:
1. **C1 — ID ma:** lớp giữ ID của tài khoản đã xóa làm Admin không phân công được giảng viên ("Chỉ gán được tài khoản giảng viên đang hoạt động"); BE tự gỡ ID ma, `class-integrity.js`, `migrate-day29.js` (`c044190`).
2. **Timeout 15 giây do tải 2 MB test ẩn:** chấm bài Day 15 vượt ngưỡng chờ của FE; lọc test trên CSDL, bộ nhớ đệm, FE chờ tới 120 giây — mở bài 6–20 s → ~0,3 s (`c044190`).
3. **Lộ đường dẫn máy chủ qua stdout:** `print(__file__)` trả về đường dẫn thư mục tạm (DEF-060); che ở cả stdout và stderr (`c044190`).
4. **Sửa/xóa nhầm bài:** bộ lọc ẩn bài demo ghi đè điều kiện `slug` khiến Ngân hàng đề tra về bài đầu tiên trong CSDL; gộp bằng `$and` + test hồi quy (`ac18440`).
5. **Kẹt chữ "chờ chấm" ở lớp K10-12:** bản ghi `SUBMITTED` treo của dữ liệu mẫu hiện "Tạm thời (N bài chờ chấm)"; chuyển sang điểm công bố, khối chấm máy không còn trạng thái chờ (`ac18440`).

Khác: traceback/AI Coach lộ đường dẫn (DEF-034, DEF-035); payload sai kiểu trả 500 thay vì 400 (DEF-050); `answers` sai kiểu vẫn được chấm (DEF-052); học sinh 3–5 gọi được `/quiz/start` (RISK-02); form sửa bài Ngân hàng đề bị đặt lại khi đang gõ; React key ở BankPicker, 403 ở hàng chờ chấm, dòng test trống ở form soạn đề, redirect `/admin/*`, ngày tương lai ở Bảng Vinh Danh.

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
