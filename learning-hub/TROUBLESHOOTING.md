# TROUBLESHOOTING — 7 sự cố thực tế

> Mỗi sự cố dưới đây **đã xảy ra thật** trong quá trình phát triển v1.0 và đã có bản sửa. Chẩn đoán chung: `npm run doctor`, `curl http://localhost:3000/api/health`, Admin → Trạng thái API.
> Lỗi khi cài đặt: [SETUP.md mục 6](SETUP.md#6-lỗi-setup-thực-tế). Escalation và quy trình chi tiết: [docs/day30/OPERATIONS_RUNBOOK.md](docs/day30/OPERATIONS_RUNBOOK.md).

## Bảng tổng hợp

| # | Sự cố | Nguyên nhân gốc | Bản sửa (v1.0) | Phòng ngừa |
|---|---|---|---|---|
| 1 | Máy chấm báo **hết giờ chờ** với bài có test lớn (bài Day 15, Khối 10–12) | Bộ test ẩn 0,6–2 MB/bài; backend tải nguyên tài liệu chỉ để bỏ phần ẩn mỗi lần mở/nộp (6–20 giây); FE chỉ chờ 15 giây | Lọc/đếm test **ngay trong truy vấn CSDL** (`$filter`/`$size`), **bộ nhớ đệm** bộ test của máy chấm theo `updatedAt`, FE chờ tới 120 giây | Không kéo `hiddenTestCases` khi không chấm; E2E với dữ liệu thật trước phát hành |
| 2 | Backend dev **tự restart liên tục**, FE văng `ERR_CONNECTION_REFUSED` | `nest start --watch` phản ứng với file bị chạm/sinh ra khi test: `*.tsbuildinfo`, `*.spec.ts`, `dist`, `uploads`, `reports` | `BE/tsconfig.build.json` → `watchOptions`: polling theo mtime, loại trừ `*.tsbuildinfo`, `*.spec.ts`, `*.log` và các thư mục sinh ra | Không ghi file tạm trong `BE/`; dùng `start:prod` cho demo/thi |
| 3 | Gán giảng viên báo **"Chỉ gán được tài khoản giảng viên đang hoạt động"**, lớp hiện "Giảng viên không còn tồn tại" | Lớp giữ ID của tài khoản đã xóa ("ID ma"); FE gửi cả ID ma + ID mới, BE từ chối cả request | BE tự gỡ ID không còn là giảng viên; cho gỡ nhãn ma; `scripts/lib/class-integrity.js` (`repairAllClasses`) chạy trong seed và `migrate-day29.js` | Không xóa user trực tiếp trong DB; theo dõi thẻ *Submissions & Classes* ở Health Check |
| 4 | **Hết giờ thi trắc nghiệm** bị văng ra ngoài, mất kết quả | Lượt luyện tập bị đánh EXPIRED/400 khi nộp trễ; đồng hồ FE dùng `alert()` chặn luồng và có thể gọi bằng dữ liệu cũ | `submitAttempt`: luyện tập tự do luôn chấm **GRADED** (câu chưa chọn = Bỏ trống); FE đếm theo mốc kết thúc, tự nộp đúng một lần, vào thẳng màn hình Kết quả (`QuizResultView`). Bài giao của lớp vẫn khóa theo hạn chót | `audit-day31.js` G-01 và E2E `2.69.quiz-timeout*` |
| 5 | Học sinh **kẹt, không mở được bài Playground kế tiếp** (hoặc nộp bị `403 E403_EXERCISE_LOCKED`) | Trước v1.0 trạng thái khóa tính ở FE từ dữ liệu trộn chủ đề (có SQL), tiến độ cũ nhảy cóc; người dùng nhầm Run với Submit | Máy chủ tính khóa (`GET /api/exercises/playground`): #1 luôn mở, #k mở khi đã **AC** luyện tập #1..#(k-1); bài lớp không bị khóa; `migrate-day31.js` gắn cờ `outOfSequence` (không xóa bài nộp) | Hướng dẫn học viên bấm **Nộp bài** (Run không tạo bài nộp); `audit-day31.js` |
| 6 | **Python Sandbox lỗi** do không tìm thấy Python | Python chưa vào PATH, hoặc Windows App execution alias trỏ tới Microsoft Store; backend chạy với env tối giản | Đặt **`PYTHON_BIN`** trong `BE/.env` (ví dụ `C:/Python312/python.exe`); để trống thì backend tự tìm `%LOCALAPPDATA%\Python\bin\python.exe` rồi `python` (Windows) / `python3` | `npm run doctor` sau khi cài; tắt App execution aliases |
| 7 | **Sửa/xóa nhầm bài đầu tiên** trong Ngân hàng đề | `findOne({ slug: String(slug), ...this.baseFilter() })` — `baseFilter()` cũng có khóa `slug` (loại bài demo) nên ghi đè slug được chọn | `findOne({ $and: [{ slug: String(slug) }, this.baseFilter()] })` + test hồi quy | Không spread bộ lọc có thể trùng khóa; dùng `$and` |

## Chi tiết chẩn đoán nhanh

### 1. Hết giờ chờ chấm
1. Lần nộp **đầu tiên** của một bài nặng sau khi khởi động backend mất vài giây (nạp bộ đệm) — bình thường.
2. Nhiều học viên nộp cùng lúc: tăng `CODE_RUNNER_MAX_CONCURRENCY` / `CODE_RUNNER_MAX_QUEUE`, khởi động lại backend.
3. CSDL Atlas chậm: đo bằng `cd learning-hub && npm run check:mongo`; ưu tiên MongoDB local cho buổi thi.

### 2. Backend tự restart
Kiểm tra khối `watchOptions` trong `BE/tsconfig.build.json` còn nguyên. Buổi demo/thi: `npm --prefix learning-hub/BE run build && npm --prefix learning-hub/BE run start:prod`.

### 3. ID ma
L1: `/admin/classes` → bấm × trên nhãn "Giảng viên không còn tồn tại" (gỡ được kể cả khi là nhãn duy nhất) → tick giảng viên mới. L2: `cd learning-hub && node scripts/migrate-day29.js --dry-run`, rồi chạy thật.

### 4. Quiz hết giờ
Hỏi rõ là `/quiz` (luyện tập — luôn có kết quả) hay bài trắc nghiệm của lớp (quá hạn → 403 là đúng thiết kế; giảng viên giao lại với hạn mới).

### 5. Kẹt Playground
Kiểm tra học viên đã **Nộp bài** và nhận **AC** (Accepted) cho bài trước, không chỉ Run. Dữ liệu demo lệch sau khi chạy E2E: `npm run seed:clean`.

### 6. Thiếu Python
`python --version` phải ra 3.10+; nếu hiện thông báo Microsoft Store thì tắt alias ở *Settings → Apps → Advanced app settings → App execution aliases*. Sau khi đặt `PYTHON_BIN`, khởi động lại backend và chạy `npm run doctor`.

### 7. Sửa/xóa nhầm bài
Đã sửa trong commit `ac18440`. Nếu thấy lại: xác nhận bản đang chạy có commit này (`git log --oneline | grep ac18440`) và chạy `npm --prefix learning-hub/BE test -- question-bank`.
