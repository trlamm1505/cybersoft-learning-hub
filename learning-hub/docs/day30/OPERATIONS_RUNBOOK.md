# Operations Runbook — CyberSoft Learning & Contest Hub v1.0

> Dành cho người vận hành (trực hệ thống, dev, QA). Áp dụng bản **v1.0** chạy 100% local: **Node.js + Python + MongoDB**, không Docker.
> Mọi lệnh chạy từ **thư mục gốc repo** trừ khi ghi rõ `cd learning-hub`. Tài liệu người dùng cuối: [ADMIN_TEACHER_HANDBOOK.md](ADMIN_TEACHER_HANDBOOK.md).

## Mục lục

1. [Yêu cầu môi trường](#1-yêu-cầu-môi-trường)
2. [Khởi động và kiểm tra sức khỏe](#2-khởi-động-và-kiểm-tra-sức-khỏe)
3. [Backup & Restore](#3-backup--restore)
4. [Nạp dữ liệu mẫu sạch, tái lập (`npm run seed:clean`)](#4-nạp-dữ-liệu-mẫu-sạch-tái-lập-npm-run-seedclean)
5. [Escalation Path — ma trận phân cấp sự cố](#5-escalation-path--ma-trận-phân-cấp-sự-cố)
6. [Troubleshooting — 7 lỗi thực tế](#6-troubleshooting--7-lỗi-thực-tế)
7. [Checklist trước buổi demo / phát hành](#7-checklist-trước-buổi-demo--phát-hành)

---

## 1. Yêu cầu môi trường

| Thành phần | Phiên bản | Ghi chú |
|---|---|---|
| **Node.js** | **20.12+** (khuyên dùng 22) | `package.json` khai báo `"engines": { "node": ">=20.12.0" }`. Node 18 **không** được hỗ trợ. |
| **Python** | **3.10+** | Local Sandbox chạy bài code của học viên. Máy có nhiều bản Python thì đặt `PYTHON_BIN` trong `BE/.env`. |
| **MongoDB** | **6+** (Community) hoặc MongoDB Atlas | Chuỗi kết nối ở `DATABASE_URL` trong `BE/.env` (mặc định `mongodb://localhost:27017/cybersoft`). |
| Chrome / Edge | bản hiện hành | Chỉ cần cho bộ E2E trình duyệt thật (`npm run e2e:browser`). |
| MongoDB Database Tools | 100.x | Cung cấp `mongodump` / `mongorestore` cho mục 3. |

**Cấu hình duy nhất:** `BE/.env`, tạo tự động bởi `npm run setup` từ `BE/.env.example` (sinh sẵn `JWT_SECRET`, `CONFIG_ENCRYPTION_KEY`). Không commit `BE/.env`. Frontend không cần `.env`.

| Nhóm biến | Biến chính | Khi nào phải sửa |
|---|---|---|
| Server & CORS | `PORT`, `FRONTEND_URL`, `CORS_ORIGINS` | FE chạy ở địa chỉ khác `localhost:5173` |
| Database | `DATABASE_URL` | Dùng Atlas hoặc Mongo ở máy khác |
| Auth | `JWT_SECRET` (≥ 32 byte, bắt buộc), `DEFAULT_SEED_PASSWORD` (mặc định `123456`) | Mỗi môi trường một secret riêng |
| AI | `GEMINI_API_KEY`, `CONFIG_ENCRYPTION_KEY` | Để trống key thì AI chạy chế độ dự phòng |
| Code Runner | `PYTHON_BIN`, `CODE_RUNNER_MAX_CONCURRENCY`, `CODE_RUNNER_MAX_QUEUE` | Nhiều Python / tải cao |

**Giới hạn mặc định của máy chấm:** 2000 ms thời gian, 128 MB bộ nhớ mỗi lần chạy (bài Khối 10–12 có thể đặt riêng `timeoutMs`/`memoryLimitMb`).

## 2. Khởi động và kiểm tra sức khỏe

### 2.1 Cài lần đầu (máy sạch, mục tiêu < 20 phút)

```bash
npm install && npm run setup   # cài root/BE/FE, tạo BE/.env, kiểm tra Python và MongoDB
npm run seed                   # nạp dữ liệu mẫu chuẩn (idempotent)
npm run dev                    # backend http://localhost:3000/api + web http://localhost:5173
```

### 2.2 Kiểm tra sức khỏe — 3 tầng

| Tầng | Lệnh / địa chỉ | Kết quả đạt |
|---|---|---|
| Liveness (không cần đăng nhập) | `curl http://localhost:3000/api/health` | `{"status":"ok","mongo":"connected",...}`. `"status":"degraded"` = mất kết nối MongoDB |
| Phụ thuộc ngoài | `curl http://localhost:3000/api/health/dependencies` | Nguồn dữ liệu Lab (tích hợp sẵn / Data Service) và Postgres sandbox (chỉ khi `SQL_ENGINE=postgres`) |
| Toàn hệ thống (Admin) | Admin Portal → **Trạng thái API** → *Kiểm tra toàn bộ hệ thống ngay* (`GET /api/admin/health-check`) | 5 cụm *Hoạt động tốt*: Auth & Database, In-Memory SQLite, AI Gateway, Submissions & Classes (toàn vẹn lớp – giảng viên), Contests. Giới hạn 1 lần / 10 giây |
| Chẩn đoán máy | `npm run doctor` | Kiểm tra Node, Python, MongoDB, backend, web và chỉ cách sửa |
| Riêng MongoDB | `cd learning-hub && npm run check:mongo` | In số bản ghi `users`, `exercises`, `questions` |

### 2.3 Bộ kiểm thử xác nhận bản build

```bash
cd learning-hub
npm --prefix BE test                    # Jest backend: 1635 passed, 12 skipped
npm --prefix FE test -- --run           # Vitest frontend: 431 passed
npm run test:scripts                    # node --test cho script dựng môi trường: 31 passed
npm --prefix FE run build               # typecheck (tsc -b) + build frontend
npm --prefix BE run build               # typecheck + build backend (nest build)
node scripts/audit-day29-security-privacy.js   # 33/33 (cần BE đang chạy)
node scripts/audit-day30.js                    # 45/45
node scripts/audit-day31.js                    # 36/36
node scripts/audit-cross-role-consistency.js   # 52/52
node scripts/audit-teacher-security.js         # cần BE đang chạy
npm run e2e:browser                     # 107/107 bước, Chrome thật; chạy npm run seed:clean trước và sau
```

## 3. Backup & Restore

Tên CSDL lấy từ `DATABASE_URL` (mặc định `cybersoft`). Ví dụ dưới dùng Git Bash / bash; trên PowerShell thay `$(date +%Y%m%d-%H%M)` bằng `$(Get-Date -Format yyyyMMdd-HHmm)`.

### 3.1 Backup

```bash
# Local
mongodump --uri="mongodb://localhost:27017/cybersoft" --gzip --archive="backups/cybersoft-$(date +%Y%m%d-%H%M).gz"

# MongoDB Atlas (đặt chuỗi trong biến môi trường, không gõ mật khẩu vào lịch sử shell)
mongodump --uri="$DATABASE_URL" --gzip --archive="backups/cybersoft-atlas-$(date +%Y%m%d-%H%M).gz"
```

- Tần suất khuyến nghị: trước mỗi lần chạy migrate (`migrate-day29.js`, `migrate-day31.js`), trước mỗi buổi demo/thi, và hằng ngày khi có dữ liệu học viên thật.
- Lưu giữ: 7 bản hằng ngày + 4 bản hằng tuần. Thư mục `backups/` **không commit** (chứa dữ liệu học viên).
- Collection quan trọng nhất: `users`, `classrooms`, `class_assignments`, `submissions`, `quizattempts`, `assessments`, `assessment_submissions`, `contests`, `contest_attempts`, `contest_submissions`, `proctor_alerts`, `exercises`, `questions`, `audit_logs`, `block_puzzle_progress`, `tester_lab_submissions`.

### 3.2 Restore

```bash
# 1) Dừng backend (Ctrl+C ở cửa sổ npm run dev) để không có ghi mới trong lúc khôi phục.
# 2) Khôi phục toàn bộ, ghi đè collection đang có:
mongorestore --uri="mongodb://localhost:27017/cybersoft" --gzip --archive="backups/cybersoft-20261019-0900.gz" --drop
# 3) Chỉ khôi phục một collection (vd lỡ xóa lớp):
mongorestore --uri="mongodb://localhost:27017/cybersoft" --gzip --archive="backups/cybersoft-20261019-0900.gz" \
  --nsInclude="cybersoft.classrooms" --drop
# 4) Bật lại backend rồi kiểm tra:
curl http://localhost:3000/api/health
cd learning-hub && npm run check:mongo
```

Sau khi restore một bản cũ, chạy migration idempotent để dữ liệu khớp các bản vá hiện tại (xem trước bằng `--dry-run`):

```bash
cd learning-hub
node scripts/migrate-day29.js --dry-run && node scripts/migrate-day29.js   # gỡ id "ma" ở lớp, bỏ ageGroup của GV/Admin, TTL index...
node scripts/migrate-day31.js --dry-run && node scripts/migrate-day31.js   # gắn cờ tiến độ Playground nhảy cóc (không xóa bài nộp)
```

**Thử khôi phục định kỳ** (ít nhất 1 lần/tháng): restore vào CSDL tạm `cybersoft_restore_test` bằng `--nsFrom="cybersoft.*" --nsTo="cybersoft_restore_test.*"`, so số bản ghi với bản gốc. Backup chưa từng khôi phục thử thì chưa được coi là backup.

## 4. Nạp dữ liệu mẫu sạch, tái lập (`npm run seed:clean`)

`npm run seed` = `node learning-hub/scripts/seed-all.js`; `npm run seed:clean` thêm cờ `--clean`. Chạy lại bao nhiêu lần cũng **không nhân bản dữ liệu** (idempotent). Mọi bản ghi do seed tạo mang cờ đánh dấu, nên bước dọn **chỉ gỡ dữ liệu mẫu, không đụng dữ liệu thật**. Không có thao tác ẩn hay backdoor: mọi tài khoản dùng mật khẩu `DEFAULT_SEED_PASSWORD` (mặc định `123456`) và được in ra cuối lệnh.

| Bước | Nội dung |
|---|---|
| **0/9** (chỉ khi `--clean`) | Gỡ tài khoản, lớp, cuộc thi, bài nộp, Ngân hàng đề, bài giao mẫu; chạy `--remove` của các seed con; sửa toàn vẹn lớp (gỡ id "ma") |
| 1/9 | Dữ liệu nền (bài Playground, 60 câu quiz công khai, cuộc thi gốc) nếu CSDL trống; chuẩn hóa 3 bộ đề `/quiz` đủ 20 câu cho cả 6-9 và 10-12 |
| 2/9 | 10 tài khoản chuẩn: `admin`, `teacher`, `teacher3-5/6-9/10-12`, `student`, `lop3-5/6-9/10-12`, `duongchiviet2004` |
| 3/9 | Ma trận bài mẫu, lớp K3-5 / K6-9 / K10-12 / Tester QA / Data Lab / AI Lab, học viên, bài giao Ngày 1..5 |
| 4/9 | Bảng Vinh Danh K3-5, bé Dương Chí Việt 14 sao |
| 5/9 | 4 cuộc thi có bảng xếp hạng + 1 cuộc thi K6-9 có học viên out-tab (4 / 1 / 0 lần) |
| 6/9 | Người đi làm (`nguoidilam1`, `nguoidilam2`, cần backend đang chạy), hàng chờ Tester QA, dữ liệu sống của `teacher@gmail.com` |
| 7/9 | Giảng viên khối phụ trách chính lớp của mình; ghi danh học viên chuẩn; Ngân hàng đề mỗi khối 3 bài code + 4 câu trắc nghiệm; tiến độ Playground (`lop6-9` xong #1-#2, `lop10-12` xong #1) |
| 8/9 | Lớp Lưu trữ mẫu `CL-ARCHIVED-69` |
| 9/9 | Phân loại khối cho bài code của Ngân hàng đề; chốt toàn vẹn (id "ma", ageGroup của GV/Admin, phone/bio của trẻ 3-5) |

**Gỡ toàn bộ dữ liệu mẫu trước khi đưa vào dùng thật:** chạy bước 0 bằng `npm run seed:clean`, sau đó **không** chạy lại `npm run seed`; hoặc gỡ từng phần:

```bash
cd learning-hub
node scripts/seed-class.js --remove
node scripts/seed-contests.js --remove
node scripts/seed-kid-leaderboard.js --remove
```

## 5. Escalation Path — ma trận phân cấp sự cố

### 5.1 Mức độ nghiêm trọng

| Mức | Định nghĩa | Ví dụ |
|---|---|---|
| **P1 – Khẩn cấp** | Toàn hệ thống ngừng, mất/lộ dữ liệu, sai điểm hàng loạt, đang trong giờ thi | `/api/health` báo `degraded`; lộ đáp án/test ẩn; cuộc thi không nộp được bài |
| **P2 – Cao** | Một chức năng chính hỏng, có cách tạm thời | Máy chấm báo hết giờ hàng loạt; Admin không phân công được giảng viên |
| **P3 – Trung bình** | Ảnh hưởng một nhóm nhỏ hoặc giao diện | Một học viên kẹt tuần tự Playground; thẻ sức khỏe báo DEGRADED |
| **P4 – Thấp** | Câu hỏi sử dụng, góp ý | Cách giao bài theo Ngày |

### 5.2 Ma trận L1 / L2 / L3

| Cấp | Người chịu trách nhiệm | Phạm vi xử lý | Phản hồi đầu tiên | Khắc phục / chuyển cấp |
|---|---|---|---|---|
| **L1 — Vận hành** | Admin trực / Giảng viên phụ trách lớp | Thao tác theo Handbook và mục 6 của Runbook: mở khóa tài khoản, gỡ id "ma", gia hạn bài, `npm run doctor`, khởi động lại `npm run dev` | P1: 5 phút · P2: 15 phút · P3: 4 giờ làm việc · P4: 1 ngày | Không xử lý xong trong **30 phút** (P1/P2) hoặc cần sửa CSDL/mã → chuyển L2 |
| **L2 — Kỹ thuật** | Dev Learning Hub (owner ứng dụng: Dương Chí Việt, Trần Quốc Lâm) + QA (Trần Quốc Nguyên) | Đọc log backend, truy vấn CSDL, chạy migrate/restore, hotfix trên nhánh riêng kèm test, chạy lại audit + E2E | P1: 15 phút · P2: 1 giờ · P3: 1 ngày | P1 chưa khắc phục sau **2 giờ**, sự cố bảo mật/lộ dữ liệu, cần quyết định rollback bản phát hành → chuyển L3 |
| **L3 — Quyết định** | Mentor / Quản lý dự án CyberSoft | Quyết định rollback, tạm dừng cuộc thi, thông báo người dùng/phụ huynh, chấp nhận rủi ro | P1: 30 phút | Chủ trì post-mortem trong 2 ngày làm việc |

**Kênh báo:** nhóm chat dự án (ghi `[P1]`/`[P2]` ở đầu tin) + Issue GitHub có nhãn `incident`. Mỗi báo cáo cần: thời điểm, tài khoản/lớp bị ảnh hưởng, đường dẫn, ảnh màn hình, kết quả `curl /api/health`.

**Sự cố bảo mật / dữ liệu trẻ em:** luôn bắt đầu từ **P1** và chuyển thẳng L3 song song với L2, kể cả khi đã khắc phục tạm.

**Rollback bản phát hành:** checkout tag/commit ổn định trước đó (`git checkout <commit>`), `npm install`, khôi phục bản backup trước lần migrate gần nhất (mục 3.2), `npm run dev`, kiểm tra `/api/health` và một lượt E2E rút gọn (`npm run e2e:browser -- --flow=4`).

## 6. Troubleshooting — 7 lỗi thực tế

Mỗi lỗi dưới đây **đã xảy ra thật** trong quá trình phát triển và có bản vá trong v1.0; phần này giúp nhận diện nếu tái phát.

### 6.1 Hết giờ chờ chấm với bài có bộ test ẩn lớn

- **Triệu chứng:** học viên Khối 10–12 nộp bài Ngày 15 (thuật toán) thì giao diện báo hết thời gian chờ kết quả chấm; mở bài chậm 6–20 giây.
- **Nguyên nhân gốc:** bộ test ẩn của bài thuật toán nặng **0,6–2 MB mỗi bài**. Backend cũ tải cả tài liệu từ CSDL (Atlas ở xa) chỉ để lọc phần ẩn, mỗi lần mở và mỗi lần nộp; FE chỉ chờ kết quả **15 giây**.
- **Bản vá v1.0:** đếm/lọc test hiển thị ngay trên CSDL (`$filter`/`$size`), máy chấm giữ bộ nhớ đệm bộ test (chỉ hỏi CSDL `updatedAt` để biết còn mới), FE chờ tối đa **120 giây**. Đo lại: mở bài ~0,3 s, chấm ~2 s.
- **Nếu tái phát:**
  1. Lần nộp **đầu tiên** của một bài sau khi khởi động backend vẫn mất vài giây (nạp bộ đệm), là bình thường.
  2. Nhiều học viên nộp cùng lúc: tăng `CODE_RUNNER_MAX_CONCURRENCY` / `CODE_RUNNER_MAX_QUEUE` trong `BE/.env` theo số nhân CPU, khởi động lại backend.
  3. CSDL Atlas chậm: đo bằng `npm run check:mongo`; ưu tiên Mongo local cho buổi thi.

### 6.2 Backend tự khởi động lại (watcher restart), FE báo `ERR_CONNECTION_REFUSED`

- **Triệu chứng:** đang dùng bình thường thì console FE đầy `ERR_CONNECTION_REFUSED` khoảng 15 giây; log backend có `File change detected` dù không ai sửa file.
- **Nguyên nhân gốc:** `nest start --watch` theo dõi file bằng sự kiện hệ điều hành; trên Windows, IDE/antivirus/test chạm vào file (không đổi nội dung) hoặc thư mục sinh ra (`dist`, `uploads`, `reports`) cũng kích hoạt biên dịch lại.
- **Bản vá v1.0:** `BE/tsconfig.build.json` dùng **polling theo mtime** và loại trừ `dist`, `uploads`, `docs`, `reports`, `*.spec.ts`, `*.tsbuildinfo`, `*.log`.
- **Nếu tái phát:**
  1. Kiểm tra không ai sửa `tsconfig.build.json` (khối `watchOptions`).
  2. Không ghi file tạm/report vào trong `BE/src`. Code học viên chạy trong `os.tmpdir()`, ngoài repo.
  3. Buổi demo/thi: chạy backend bản build, không watch: `npm --prefix learning-hub/BE run build && npm --prefix learning-hub/BE run start:prod`.

### 6.3 Không phân công được giảng viên — "ID ma" ở lớp

- **Triệu chứng:** Admin tick giảng viên mới cho lớp thì báo đỏ "Chỉ gán được tài khoản giảng viên đang hoạt động"; lớp hiện nhãn **"Giảng viên không còn tồn tại"**.
- **Nguyên nhân gốc (lỗi C1, audit Day 29):** lớp còn giữ `teacherId` của tài khoản đã bị xóa (do script dọn dữ liệu cũ chỉ gỡ `studentIds`). FE gửi cả ID cũ lẫn ID mới; BE kiểm tra mọi ID và từ chối cả request vì ID cũ.
- **Bản vá v1.0:** BE tự gỡ ID cũ không còn là giảng viên, chỉ kiểm tra người *mới* thêm; cho phép gỡ nhãn ma kể cả khi là nhãn duy nhất; Health Check đếm lớp có giảng viên không tồn tại/bị khóa; seed và migrate tự sửa.
- **Xử lý:**
  1. L1: ở `/admin/classes`, bấm **×** trên nhãn "Giảng viên không còn tồn tại" rồi tick giảng viên mới.
  2. L2 (nhiều lớp): `cd learning-hub && node scripts/migrate-day29.js --dry-run` → xem danh sách → chạy không `--dry-run`.
  3. Xác nhận: thẻ *Submissions & Classes* ở `/admin/health` báo "mọi lớp đều có giảng viên".

### 6.4 Quiz hết giờ: mất kết quả / không hiện bảng điểm

- **Triệu chứng (trước bản vá):** làm bài ở `/quiz` chờ đồng hồ về 00:00 thì bị đẩy ra ngoài, không thấy kết quả.
- **Hành vi đúng của v1.0:**
  - `/quiz` (ôn luyện tự do): hết giờ thì FE **tự nộp** các đáp án đã chọn (câu chưa chọn = *Bỏ trống*), BE **luôn chấm GRADED**, không bao giờ đánh EXPIRED/400; giao diện vào thẳng màn hình Kết quả (Đúng / Sai / Bỏ trống) có nút *Làm Lại Bài Thi Mới*. Đồng hồ đếm theo mốc giờ kết thúc nên máy ngủ/tab bị làm chậm vẫn hết giờ đúng lúc.
  - Lượt dở còn thời gian: mở lại tiếp tục với đúng thời gian còn lại; lượt bỏ dở quá giờ được đóng và mở lượt mới.
  - **Bài trắc nghiệm giao cho lớp** (có `assignmentId`) vẫn bị khóa theo **hạn chót**: nộp sau hạn trả 403 "đã hết hạn - đã khóa". Đây là chủ đích.
- **Nếu học viên báo mất kết quả:** hỏi rõ là `/quiz` hay bài của lớp; với bài lớp, giảng viên giao lại bài có hạn mới (Handbook B1.3). Xác minh tự động: `node scripts/audit-day31.js` (mục G-01) và E2E `2.69.quiz-timeout*`.

### 6.5 Học viên "kẹt" khóa tuần tự Code Playground

- **Triệu chứng:** học viên Khối 6–9 / 10–12 thấy bài kế tiếp vẫn khóa 🔒, hoặc nộp bài báo `403 E403_EXERCISE_LOCKED`.
- **Quy tắc v1.0 (máy chủ tính, `GET /api/exercises/playground`):** bài #1 luôn mở; bài #k mở khi đã **AC luyện tập** liên tục #1..#(k-1); bài đã hoàn thành luôn mở lại được; nộp nhảy cóc bị chặn 403. **Bài giao trong lớp không bị khóa tuần tự.** Tiến độ ở `/playground`, *Tiến độ học tập* và *Hồ sơ* dùng chung một nguồn.
- **Xử lý:**
  1. Bài báo khóa nhưng học viên nói "đã làm": kiểm tra học viên đã **Nộp bài** (Submit, ra AC) chứ không chỉ **Chạy thử** (Run không tạo bài nộp).
  2. Dữ liệu cũ nhảy cóc (từ trước khi có khóa tuần tự): `cd learning-hub && node scripts/migrate-day31.js --dry-run` rồi chạy thật; lệnh chỉ gắn cờ `outOfSequence`, **không xóa bài nộp**, có `--revert`.
  3. Tài khoản demo `lop6-9`/`lop10-12` lệch trạng thái sau khi chạy E2E: `npm run seed:clean`.

### 6.6 Không tìm thấy Python (thiếu PATH)

- **Triệu chứng:** Run/Submit trả lỗi hệ thống; `npm run doctor` báo "không tìm thấy Python 3"; trên Windows gõ `python` lại hiện "Python was not found; run without arguments to install from the Microsoft Store".
- **Nguyên nhân gốc:** Windows cài sẵn *App execution alias* `python.exe` trỏ tới Microsoft Store (không phải Python thật), hoặc Python chưa được thêm vào PATH. Backend chạy code với biến môi trường tối giản nên không tự dò được mọi vị trí.
- **Xử lý:**
  1. Cài Python 3.10+ từ python.org, tick *Add python.exe to PATH*.
  2. Tắt alias: *Settings → Apps → Advanced app settings → App execution aliases* → tắt `python.exe` và `python3.exe`.
  3. Hoặc chỉ định thẳng trong `BE/.env`: `PYTHON_BIN=C:/Python312/python.exe` (macOS/Linux: `/usr/bin/python3`). Để trống thì backend tự tìm `%LOCALAPPDATA%\Python\bin\python.exe` rồi `python` (Windows) hoặc `python3`.
  4. Khởi động lại backend, chạy `npm run doctor` (dòng *Chạy Python* phải OK).

### 6.7 Lỗi Cookie / CORS: đăng nhập xong vẫn bị đá về `/login`, hoặc lỗi CORS / 403 CSRF

- **Cơ chế v1.0:** phiên đăng nhập là cookie **httpOnly** `access_token` (`SameSite=Strict`, `Secure` ở production) cùng cookie `csrf_token`; mọi request đổi dữ liệu phải gửi header `x-csrf-token` trùng cookie (Double Submit). CORS chỉ chấp nhận origin trong danh sách cho phép (`CORS_ORIGINS`, mặc định `FRONTEND_URL` + `localhost:5173/4173`); origin lạ không được phản chiếu kèm credentials.
- **Nguyên nhân hay gặp và cách sửa:**

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| Đăng nhập thành công nhưng F5 lại về `/login` | Mở web bằng `127.0.0.1:5173` trong khi API là `localhost:3000` (khác site → cookie `SameSite=Strict` không được gửi) | Dùng thống nhất `http://localhost:5173` |
| Console báo lỗi CORS | FE chạy ở cổng/domain không có trong danh sách | Thêm origin vào `CORS_ORIGINS` (phân cách dấu phẩy) hoặc sửa `FRONTEND_URL`, khởi động lại backend |
| `403` khi lưu/nộp, đọc vẫn được | Thiếu/lệch CSRF token (cookie cũ, mở nhiều tab sau khi đổi máy chủ) | Đăng xuất, xóa cookie `localhost`, đăng nhập lại |
| Production qua HTTP thường không đăng nhập được | Cookie `Secure` chỉ gửi qua HTTPS | Đặt HTTPS (reverse proxy) trước backend |
| `429 Too Many Requests` khi đăng nhập | Giới hạn 5 lần/phút/email | Đợi 1 phút |

## 7. Checklist trước buổi demo / phát hành

- [ ] `npm run doctor` toàn OK; `curl /api/health` trả `"status":"ok"`.
- [ ] Backup CSDL (mục 3.1) và ghi tên file.
- [ ] `npm run seed:clean` chạy hết 9 bước, không cảnh báo.
- [ ] Admin → Trạng thái API: 5 cụm *Hoạt động tốt* (AI Gateway có thể *Suy giảm* nếu chủ đích không dùng Gemini).
- [ ] Jest / Vitest / audit xanh (mục 2.3); `npm run e2e:browser` 107/107 rồi `npm run seed:clean` lại.
- [ ] Chạy backend không watch nếu là buổi thi (mục 6.2).
- [ ] Mở sẵn danh sách giới hạn trong [RELEASE_NOTES_v1.0.md](RELEASE_NOTES_v1.0.md).
