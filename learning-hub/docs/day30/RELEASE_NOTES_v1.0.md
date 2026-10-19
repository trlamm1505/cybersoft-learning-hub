# Release Notes — CyberSoft Learning & Contest Hub v1.0

| | |
|---|---|
| **Phiên bản** | 1.0.0 |
| **Ngày phát hành** | 19/10/2026 (Ngày 30 — Tuần 6: Tích hợp và phát hành) |
| **Nhánh / commit gốc** | `feature/learning-hub-day30`, tách từ `feat/admin-portal-v2` @ `ac18440` |
| **Môi trường** | Node.js 20.12+ · Python 3.10+ (Local Sandbox) · MongoDB 6+ · không Docker |
| **Tài liệu kèm theo** | [Cẩm nang Admin & Giảng viên](ADMIN_TEACHER_HANDBOOK.md) · [Runbook](OPERATIONS_RUNBOOK.md) · [Roadmap 60 ngày](ROADMAP_60D.md) · [AI Work Log](../../AI_WORKLOG.md) |

CyberSoft Learning & Contest Hub v1.0 là bản phát hành chính thức đầu tiên của nền tảng học — luyện tập — chấm bài — thi đấu — AI Coach cho học sinh lớp 3–12 và người đi làm. Bản này khép lại vòng lặp học tập có bằng chứng: **học viên làm bài → máy chấm thật → AI gợi ý có kiểm soát → học viên thử lại → giảng viên thấy tiến bộ → Admin vận hành an toàn**, và giảng viên tạo bài/giao bài/tổ chức cuộc thi **không cần sửa mã nguồn**.

---

## 1. Tính năng bàn giao

### 1.1 Học viên

| Nhóm | Tính năng |
|---|---|
| **Khối 3–5 (Kid Mode)** | Góc Học Tập `/block-puzzle` với 4 game Blockly (Mê Cung, Rùa Vẽ Hình, Chim Tìm Tổ, Ghép Hình Con Vật); Bảng Vinh Danh xếp theo thời gian phá đảo, chống nộp quá nhanh; giao diện chữ to, tương phản cao; chặn mọi đường vào Playground/Quiz/Cuộc thi/AI Coach (giao diện chuyển hướng, API trả 403 `E403_KID_NO_CODE_QUIZ`) |
| **Code Playground (6–9 / 10–12)** | Lộ trình cố định 20 bài (6–9) / 15 bài (10–12), **mở khóa tuần tự do máy chủ tính**; chặn nộp nhảy cóc (`E403_EXERCISE_LOCKED`); trình soạn CodeMirror, Run / Submit |
| **Online Judge** | Chấm Python thật trong Local Sandbox: AC / WA / TLE / RE / CE, test ẩn không bao giờ trả về trình duyệt, giới hạn thời gian/bộ nhớ theo bài, bộ nhớ đệm bộ test, phục hồi job kẹt khi khởi động lại |
| **Thi Trắc Nghiệm `/quiz`** | 3 bộ đề công khai Python / HTML5 / CSS3, **đủ 20 câu cho cả Khối 6–9 và 10–12**; nhãn A–D theo vị trí; trạng thái *Bỏ trống*; chọn đề bằng bàn phím; **hết giờ tự nộp và vào thẳng màn hình Kết quả** |
| **Lớp học của tôi** | Bài giao theo **Ngày 1..N** (Code + Trắc nghiệm) có hạn nộp do máy chủ kiểm tra; bài lớp không bị khóa tuần tự |
| **Cuộc thi** | Danh sách, đăng ký theo khối, phòng thi có giám sát rời màn hình, bảng xếp hạng |
| **AI Coach** | Gemini, vòng lặp debug theo bài, bộ lọc nội dung nguy hiểm cho trẻ em, che PII, không đưa lời giải hoàn chỉnh; chế độ dự phòng khi không có API key |
| **Tiến độ & Hồ sơ** | Số bài hoàn thành khớp 100% giữa `/playground`, *Tiến độ học tập* và *Hồ sơ* |
| **Người đi làm** | 3 khóa: Tester QA (Lab chấm rubric), Data SQL Lab, AI Prompt Lab (tự chấm trên sandbox); chứng chỉ khóa học |

### 1.2 Giảng viên — Teacher Studio V2

- **Lớp học của tôi:** chỉ thấy lớp được phân công (lớp khác trả 403); theo dõi học viên, cảnh báo out-tab của bài lớp; bảng điểm Bài tập tuần 30% / Cuộc thi 40% / Thi kết thúc 30%, bỏ bài thấp nhất, khóa kết quả khi bỏ nộp > 30%; **điểm Khối 6–9/10–12 luôn Chính thức (không còn "chờ chấm")**.
- **Giao bài theo Ngày:** thêm ngày, thêm bài Code / Trắc nghiệm từ Ngân hàng đề, đặt hạn nộp và tổng điểm.
- **Soạn bài thủ công:** Bài tập Code (test công khai + test ẩn, starter code, lời giải, giới hạn thời gian/bộ nhớ cho 10–12) và Câu hỏi Trắc nghiệm (2–6 đáp án, đoạn code minh họa, giải thích). Chỉ Khối 6–9 và 10–12.
- **AI Tạo Đề:** sinh tối đa 10 bài/lượt theo khối; output test lấy từ **chạy thật lời giải mẫu**; chỉ lưu khi pass 100% test; phát hiện trùng lặp mềm/cứng có human-in-the-loop và vết duyệt.
- **Ngân hàng đề:** 2 tab Code / Trắc nghiệm, lọc khối/độ khó, tìm kiếm, sửa giữ nguyên liên kết; **chặn xóa/đổi khối bài đang dùng (409)**; bài Playground cố định chỉ xem (403).
- **`bankOnly: true` khóa cứng:** mọi bài của Giảng viên/Admin chỉ dùng cho lớp và cuộc thi, không bao giờ vào Playground hay `/quiz` công khai.
- **Cuộc thi:** trình tạo 3 bước, chọn khối dự thi, ghép đề code + trắc nghiệm, bật tín hiệu liêm chính; rời màn hình lần 3 khóa phòng thi + tự nộp; *Không công nhận kết quả* / *Khôi phục* có lý do và nhật ký.
- **Chấm bài:** hàng chờ Lab Tester QA theo rubric (nhận xét ≥ 20 ký tự); xử lý cảnh báo liêm chính *Bỏ qua* / *Hủy kết quả*.

### 1.3 Quản trị viên — Admin Portal v2

- **Người dùng:** tìm kiếm, lọc vai trò/khối/trạng thái, thao tác hàng loạt; tạo Học viên/Giảng viên (không thể tạo Admin); đổi vai trò tự xóa `ageGroup` và rút khỏi lớp; đổi khối rút khỏi lớp khác khối; **chặn khóa giảng viên còn đứng lớp (409)**; đặt lại mật khẩu hủy mọi phiên.
- **Lớp học & Khóa học:** tab Lớp 3–5 / 6–9 / 10–12 / Người đi làm; mã lớp tự sinh; phân công nhiều giảng viên "tick là lưu ngay"; **tự dọn ID giảng viên "ma"**; thêm học viên từ danh sách hoặc dán nhiều email/mã; lưu trữ / kích hoạt lại.
- **Trạng thái API:** kiểm tra song song 5 cụm, gồm kiểm tra toàn vẹn lớp – giảng viên.
- **Cấu hình:** Gemini API key mã hóa AES-256-GCM, system prompt; **Nhật ký** không sửa/xóa được.

### 1.4 Bảo mật & Quyền riêng tư

JWT secret bắt buộc (không dùng khóa mặc định) · phiên cookie httpOnly `SameSite=Strict` + CSRF Double Submit · JWT đối chiếu CSDL mỗi request (khóa/thu hồi có hiệu lực ngay) · header bảo mật (CSP, nosniff, chống nhúng khung) · CORS theo danh sách cho phép · rate limit (đăng nhập 5/phút, chạy code 30/phút, AI Coach 10/phút...) · chặn NoSQL injection (`$` operator) toàn cục · che đường dẫn máy chủ trong lỗi và stdout · che PII trong log/prompt AI · TTL lịch sử AI Coach 90 ngày · không lưu phone/bio của trẻ Lớp 3–5 · Parental Consent cho dữ liệu usability trẻ em · ẩn `authorId`, đáp án và test ẩn khỏi học viên.

### 1.5 Hạ tầng & Vận hành

- **Bỏ hoàn toàn Docker:** Local Python Sandbox (AST guard, `python -I -B`, env tối giản, timeout, đo RAM, output ≤ 64 KB).
- **Một file cấu hình** `BE/.env`, sinh bằng `npm run setup`; `npm run doctor` chẩn đoán môi trường.
- **Master seed** `npm run seed` / `npm run seed:clean`: idempotent, 10 tài khoản chuẩn mật khẩu `123456`, chỉ gỡ dữ liệu mang cờ mẫu.
- Migration idempotent có `--dry-run`: `migrate-day29.js`, `migrate-day31.js`.
- Backend watch dùng polling, không tự restart giả.

## 2. Chỉ số chất lượng đạt được

Jest, Vitest, node --test và 5 bộ audit được chạy lại ngày 19/10/2026 trên mã nguồn phát hành; E2E Chrome thật lấy kết quả chạy ở commit `ac18440` (18/10/2026, mã ứng dụng không đổi từ đó):

| Bộ kiểm thử | Kết quả | Lệnh |
|---|---|---|
| **Jest backend** | **1635 passed**, 12 skipped (129/130 suite, 1 suite skip) | `npm --prefix learning-hub/BE test` |
| **Vitest frontend** | **431 passed** (61 file) | `npm --prefix learning-hub/FE test -- --run` |
| node --test (script dựng môi trường) | **31 passed** | `npm run test:scripts` |
| **Audit 1** — Security & Privacy Day 29 (SEC-01..25, PRV-01..08) | **33/33 PASS** | `node scripts/audit-day29-security-privacy.js` |
| **Audit 2** — Day 30 (bảo mật API contract, Kid Mode, Ngân hàng đề, seed) | **45/45 PASS** | `node scripts/audit-day30.js` |
| **Audit 3** — Day 31 (Playground tuần tự, bankOnly, quiz hết giờ, không "chờ chấm") | **36/36 PASS** | `node scripts/audit-day31.js` |
| **Audit 4** — Nhất quán chéo vai trò Admin ↔ Giảng viên ↔ Học viên | **52/52 PASS** | `node scripts/audit-cross-role-consistency.js` |
| **Audit 5** — Bảo mật Teacher Studio (IDOR, cô lập lớp) | **40/40 PASS** | `node scripts/audit-teacher-security.js` |
| **E2E Chrome thật** (5 luồng: Kid 3–5, Học viên 6–9/10–12, Giảng viên, Admin, Cố tình phá) | **107/107 PASS** (commit `ac18440`) | `npm run e2e:browser` |

### Các lỗi thật đã phát hiện và sửa trước phát hành

| Lỗi | Phát hiện bởi | Bản vá |
|---|---|---|
| **C1 — ID giảng viên "ma"** làm Admin không phân công được giảng viên ("Chỉ gán được tài khoản giảng viên đang hoạt động") | Báo cáo QA Day 29 + Deep Audit | BE tự gỡ ID không còn là giảng viên; gỡ nhãn ma được kể cả khi là nhãn duy nhất; Health Check `$lookup`; `migrate-day29.js`; script dọn gỡ cả `teacherIds` |
| **Bài SQL lọt vào `/playground`** Khối 6–9/10–12 và khóa tuần tự loạn (bài #3 xanh khi #1 còn khóa) | Kiểm thử thủ công | Playground chỉ còn lộ trình cố định, bỏ dropdown chủ đề; khóa tuần tự do máy chủ tính; `migrate-day31.js` gắn cờ tiến độ nhảy cóc (không xóa dữ liệu) |
| **Test ẩn 0,6–2 MB** khiến chấm bài Ngày 15 vượt ngưỡng chờ **15 giây** của FE | E2E Chrome thật | Lọc/đếm test trên CSDL, bộ nhớ đệm bộ test, FE chờ tới 120 giây; mở bài 6–20 s → ~0,3 s |
| **Quiz hết giờ** không hiện kết quả, lượt bị đánh hết hạn | Kiểm thử thủ công | Lượt luyện tập luôn GRADED, FE tự nộp đáp án đã chọn và vào thẳng Kết quả; bài lớp vẫn khóa theo hạn chót. Bộ đề công khai đủ **20/20 câu** cho cả hai khối |
| **Docker** làm máy chấm trả RE khi Docker Desktop tắt | Báo cáo QA Day 30 | Bỏ Docker, Local Sandbox 100% |
| `print(__file__)` **lộ đường dẫn thư mục tạm qua stdout** | Audit Day 30 (DEF-060) | Che đường dẫn ở cả stdout, không chỉ stderr |
| Ngân hàng đề **sửa/xóa nhầm bài đầu tiên trong CSDL** (bộ lọc ẩn bài demo ghi đè điều kiện `slug`) | E2E Chrome thật | Gộp điều kiện bằng `$and`, test hồi quy |
| Lớp 10–12 hiện "Tạm thời (N bài chờ chấm)" | Kiểm thử thủ công | Bài mẫu chuyển điểm chính thức; khối chấm máy không còn trạng thái chờ |

## 3. Known Issues & Giới hạn kỹ thuật có chủ đích

Các mục dưới đây là rủi ro **đã biết và chấp nhận** cho v1.0 (nội bộ). Chi tiết bổ sung: [docs/day29/KNOWN_ISSUES.md](../day29/KNOWN_ISSUES.md).

### 3.1 Bảo mật & thực thi code

| # | Giới hạn | Mức | Giảm thiểu hiện tại | Kế hoạch |
|---|---|---|---|---|
| K-01 | **Local Sandbox không phải cô lập cấp hệ điều hành** (không namespace/cgroup/container) | Cao khi public | AST guard chặn import/hàm/dunder nguy hiểm trước khi chạy, `-I -B`, env tối giản, timeout, đo RAM, output 64 KB, che đường dẫn | Roadmap Ngày 31–40: Worker Judge tách riêng trên gVisor/MicroVM |
| K-02 | Hàng chờ chấm chạy **trong một tiến trình** backend; phục hồi job kẹt là best-effort, chưa hỗ trợ nhiều instance | Trung bình | Giới hạn đồng thời + hàng đợi; quét job kẹt định kỳ, quá số lần thì FAILED | Hàng đợi phân tán (Ngày 31–40) |
| K-03 | Đăng nhập **không kiểm tra độ mạnh mật khẩu** cũ (chính sách mới chỉ áp dụng khi đăng ký / đặt lại) | Thấp | Rate limit 5 lần/phút | Buộc đổi mật khẩu yếu |
| K-04 | Đồng ý Điều khoản chỉ chặn ở form, **chưa lưu bằng chứng** ở máy chủ; chưa có OTP/xác thực email | Trung bình khi public | — | Lưu consent có phiên bản |
| K-05 | Ảnh đại diện dạng URL do người dùng nhập có thể là ảnh theo dõi | Thấp | — | Proxy/tải ảnh về máy chủ |

### 3.2 Quyền riêng tư trẻ em

| # | Giới hạn | Ghi chú |
|---|---|---|
| K-06 | Bảng Vinh Danh Kid Mode hiện **họ tên đầy đủ** của bé cho học viên đã đăng nhập | Chấp nhận cho môi trường **nội bộ**. Trước khi public cần consent phụ huynh hoặc biệt danh |
| K-07 | Bảng Vinh Danh trả `userId` để mở thẻ bạn học | Không bí mật nhưng nên đổi sang mã tạm khi public |

### 3.3 Nghiệp vụ & dữ liệu

| # | Giới hạn | Ghi chú |
|---|---|---|
| K-08 | Chống gian lận Bảng Vinh Danh chỉ ở mức "làm khó": máy chủ không tự chấm lời giải Blockly, chỉ kiểm tra thứ tự và ngưỡng thời gian (mặc định 10 giây/màn); game 1 màn không áp được luật thời gian | Hướng sau: máy chủ chạy lại lời giải |
| K-09 | Tín hiệu rời màn hình chỉ bắt được chuyển tab/mất focus ≥ 5 giây trên trình duyệt; không phát hiện thiết bị thứ hai | Có chủ đích: hệ thống không tự kết luận gian lận, giảng viên quyết định |
| K-10 | Khóa Người đi làm: tài khoản khối Người đi làm học **cả 3 khóa**; chưa gỡ riêng từng khóa cho từng học viên. Chuyển ngược về khối phổ thông thì không tự vào lớp mới | Admin thêm lại vào lớp đúng khối |
| K-11 | Khối của câu hỏi cũ được gắn theo độ khó (EASY→6–9, MEDIUM→cả hai, HARD→10–12) bằng `backfill-question-grades.js`; 3 bộ đề công khai dùng chung cả hai khối | Quy ước tạm, giảng viên nên rà lại |
| K-12 | Bài giao cũ dạng `exerciseSlugs` (không hạn chót) vẫn hiển thị ở Dashboard, chưa gộp hoàn toàn vào luồng giao bài theo Ngày | Không ảnh hưởng dữ liệu mới |
| K-13 | `seed:clean` chỉ gỡ dữ liệu mang cờ mẫu; dữ liệu tạo tay khi demo phải dọn tay | Có chủ đích (không xóa dữ liệu thật) |

### 3.4 Hiệu năng & phụ thuộc ngoài

| # | Giới hạn | Ghi chú |
|---|---|---|
| K-14 | Lần nộp đầu tiên của một bài thuật toán nặng sau khi khởi động backend mất vài giây (nạp bộ đệm test) | Các lần sau ~2 giây |
| K-15 | Bảng xếp hạng Kid tính trên toàn collection, cache 5 giây | Cần chỉ mục/tổng hợp sẵn ở quy mô lớn |
| K-16 | AI phụ thuộc quota Gemini (lỗi 429 `RESOURCE_EXHAUSTED` khi vượt quota) | Chế độ dự phòng; Health báo *Suy giảm* |
| K-17 | Kiểm tra sức khỏe toàn hệ thống giới hạn 1 lần / 10 giây | Có chủ đích (chống lạm dụng) |

### 3.5 Phạm vi chưa làm trong v1.0

- Chỉ hỗ trợ **Python** cho bài code (C++/JavaScript: Roadmap Ngày 41–50).
- Chưa có CI/CD tự động triển khai; bản phát hành chạy local / máy chủ tự quản (Roadmap Ngày 31–40).
- Teacher Studio không soạn đề cho Khối 3–5 (game Blockly dựng sẵn) và khóa Người đi làm (Lab cố định) — có chủ đích.

## 4. Nâng cấp từ bản trước & dữ liệu

```bash
git fetch && git checkout feature/learning-hub-day30
npm install && npm run setup        # cập nhật thư viện; BE/.env cũ được giữ
# Sao lưu trước (Runbook mục 3.1), rồi:
cd learning-hub
node scripts/migrate-day29.js --dry-run && node scripts/migrate-day29.js
node scripts/migrate-day31.js --dry-run && node scripts/migrate-day31.js
cd .. && npm run dev
```

Biến môi trường đã bỏ: `PYTHON_SANDBOX`, `PYTHON_SANDBOX_IMAGE` (Docker). Các lệnh `docker:*` và file `docker-compose*.yml` không còn.

Môi trường dùng thật: **gỡ dữ liệu mẫu** (`npm run seed:clean` và không seed lại), đặt `JWT_SECRET`/`CONFIG_ENCRYPTION_KEY` riêng, đổi `DEFAULT_SEED_PASSWORD`, bật HTTPS để cookie `Secure` hoạt động.
