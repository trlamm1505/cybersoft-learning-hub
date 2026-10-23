# Security retest trên web local - 15/10/2026

- **Người chạy:** Claude (Cowork) theo yêu cầu của tester Trần Quốc Nguyên, thao tác qua Chrome của tester (tiện ích Claude in Chrome), gọi API bằng `fetch` từ tab `http://localhost:3000`.
- **Thời điểm:** khoảng 09:36–09:45 UTC (16:36–16:45 giờ Việt Nam). Health lúc bắt đầu: `{"status":"ok","mongo":"connected"}`, timestamp `2026-10-15T09:36:56Z`.
- **Môi trường:** BE `http://localhost:3000/api`, FE `http://localhost:5173`, máy tester Windows. Mã nguồn đối chiếu: `D:\thuctap\clone\cybersoft-learning-hub`, HEAD `d804c49` (tester chưa xác nhận web chạy đúng từ thư mục này).
- **Tài khoản:** 3 học sinh `lop3-5`, `lop6-9`, `lop10-12`. Token và mật khẩu không ghi vào file này. `FAKEID` = `000000000000000000000000`.
- **Giới hạn:** chạy 1 lần, chưa chạy trên `main` mới (`eb40c98`). Kết quả dùng làm evidence cho Day 29/30, không thay cho gate cuối.

## 1. Phân quyền: học sinh gọi API của giáo viên/admin (Day 29 SEC-09)

Token học sinh `lop3-5`. Kỳ vọng: 403.

| Request | Status |
|---|---|
| GET /teacher/classes | 403 |
| GET /teacher/classes/catalog/exercises | 403 |
| GET /teacher/integrity/queue | 403 |
| GET /teacher/submissions/pending | 403 |
| GET /teacher/submissions/da | 403 |
| GET /teacher/ai-lab-submissions | 403 |
| GET /admin/users | 403 |
| GET /admin/classes | 403 |
| GET /admin/classes/catalog/students | 403 |
| GET /contests/bank/questions | 403 |
| GET /contests/bank/exercises | 403 |
| GET /exercises/tinh-tong-hai-so-nguyen-a-b/full | 403 |
| GET /authoring/lessons/catalog/resources | 403 |
| GET /authoring/lessons/export/FAKEID | 403 |
| GET /hints/sample-30 | 403 |
| GET /admin/users/FAKEID/profile | 403 |
| GET /teacher/classes/FAKEID/analytics | 403 |
| GET /tester-labs/LAB-01/submissions | 403 |
| PUT /teacher/integrity/FAKEID/review | 403 |
| PUT /teacher/submissions/FAKEID/review | 403 |
| PUT /tester-labs/submissions/FAKEID/review | 403 |
| PUT /admin/users/FAKEID/role (body role ADMIN) | 403 |

**Kết quả: 22/22 trả 403 → PASS.** Danh sách đường dẫn lấy từ các controller có `@Roles('TEACHER','ADMIN')` hoặc `@Roles('ADMIN')` trong `learning-hub/BE/src`.

## 2. IDOR giữa hai học sinh (Day 29 SEC-23)

A = `lop3-5`, B = `lop6-9`.

| Bước | Kỳ vọng | Status |
|---|---|---|
| A đọc `/coach/history/{id của B}/{slug}` | 403 | 403 |
| A đọc `/coach/history/{id của A}/{slug}` (đối chứng) | 200 | 200 |
| A đọc `/hints/history/{id của B}` | 403 | 403 |
| A đọc `/hints/history/{id của A}` (đối chứng) | 200 | 200 |
| B nộp bài `tinh-tong-hai-so-nguyen` (tạo dữ liệu) | 201 | 201 |
| A đọc `/exercises/submissions/{bài nộp của B}` | 403/404 | 403 |
| B đọc bài nộp của chính mình (đối chứng) | 200 | 200 |
| A gọi `/coach/debug-loop` với bài nộp của B | 403/404 | 404 |
| B bắt đầu quiz HTML5 (tạo dữ liệu) | 201 | 201 |
| A xem `/quiz/{lượt của B}/review` | 403/404 | 404 |
| A nộp `/quiz/{lượt của B}/submit` | 403/404 | 404 |

**Kết quả: PASS.**

## 3. Upload file nộp bài Tester Lab (Day 29 SEC-20)

`POST /tester-labs/LAB-01/submissions`, token `lop3-5`.

| File gửi | Status | Thông báo |
|---|---|---|
| `virus.exe` (byte đầu MZ) | 400 | Chỉ chấp nhận .csv, .xlsx, .json, .pdf |
| `shell.php.csv` | 400 | Tên file không hợp lệ |
| `fake.pdf` (nội dung là chữ) | 400 | Nội dung file không phải định dạng .pdf thật |
| `mz.xlsx` (byte đầu MZ) | 400 | Nội dung file không phải định dạng .xlsx thật |
| `wrongmime.csv` (MIME application/pdf) | 400 | MIME-type không khớp với đuôi |
| `big.csv` (hơn 5 MB) | 413 | File too large |
| `../../evil.json` (JSON hợp lệ) | 201 | Được nhận; file lưu với tên UUID `<uuid>.json`, không dùng tên gốc nên không ghi ra ngoài thư mục upload |

**Kết quả: PASS.** Ghi chú: tên file chứa `../` vẫn được nhận nhưng không gây path traversal.

## 4. CORS (Day 29 SEC-14)

- Mở tab origin `http://127.0.0.1:3000` (khác origin với `http://localhost:3000`), gọi `fetch('http://localhost:3000/api/health', {credentials:'include'})`: **đọc được phản hồi (200)**.
- Mã nguồn `learning-hub/BE/src/main.ts`: `app.enableCors({ origin: true, credentials: true })` → phản hồi lại mọi origin.

**Kết quả: FAIL (RISK-08).**

## 5. Phát hiện thêm

| Mục | Kết quả | Risk |
|---|---|---|
| Đăng nhập `admin@gmail.com`, `teacher@gmail.com`, `student@gmail.com` bằng mật khẩu ghi trong `learning-hub/BE/src/data/initial-data.ts` | Cả 3 trả 201, role đúng ADMIN/TEACHER/STUDENT. Không dùng các token này cho thao tác nào khác | RISK-06 |
| Lỗi 500 (`POST /auth/login` với email là object) | Body `{"statusCode":500,"message":"Internal server error"}`, không có stack trace hay đường dẫn | Đạt cho SEC-12 (nhánh 500); lỗi 500 vẫn là DEF-050 |
| Header `GET /api/health` | Không có `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`; có `X-Powered-By: Express` | RISK-03 |
| `POST /usability/session` không token, thiếu xác nhận phụ huynh | 400 "Child Safety Guard ... Parental Consent" | Guard nội dung hoạt động; endpoint không yêu cầu đăng nhập (ghi nhận) |
| GET không token: `/usability/report`, `/usability/top-fixes`, `/qa/dashboard`, `/resilience/dashboard`, `/resilience/limits`, `/health/dependencies` | Đều 200; không thấy email, tên, token, đường dẫn máy trong nội dung | Ghi nhận: dashboard nội bộ mở công khai |

## 6. Dữ liệu test đã tạo trong DB local

- `lop6-9`: 1 bài nộp `tinh-tong-hai-so-nguyen` (không đọc lại kết quả chấm), 1 lượt quiz HTML5 đang dở (IN_PROGRESS).
- `lop3-5`: 1 bài nộp LAB-01 (file JSON nhỏ, trạng thái SUBMITTED).
- 3 lần đăng nhập tài khoản mẫu admin/teacher/student.
