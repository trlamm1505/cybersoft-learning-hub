# AI Work Log Ngày 30: Tài liệu, demo release và bàn giao

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 19 tháng 10 năm 2026 (tóm tắt thêm đợt Day 27 – Day 31, từ 08/10 đến 18/10/2026) |
| Nhánh | `feature/learning-hub-day30`, tách từ `feat/admin-portal-v2` @ `ac18440` (không merge, không rebase với `main`) |
| Công cụ, model | Day 30 (bàn giao): Claude Code chạy Claude Opus 5.5. Đợt Day 29 → Day 31 (17–18/10): Claude Code chạy Claude Sonnet 5.5. Day 27 – Day 28 (08/10): Google Antigravity (Gemini 3.6 Flash High). Không dùng subagent |
| Phạm vi quyền | Đọc và ghi trong `learning-hub/`; chạy test, seed, backend/frontend local và Chrome tự động. `Data-AI-Resource/` của Thực tập sinh số 1 chỉ đọc. Chỉ đẩy nhánh làm việc, không đụng `main` |
| Context đã cung cấp | Báo cáo QA của Tester Trần Quốc Nguyên: `Day29_Security_Privacy_Test_Form`, `Day30_Defect_Risk_Tracker`, `Day30_Test_Cases_V2`; ảnh chụp lỗi; log console FE; file mẫu `02_Ke_hoach_30_ngay_Thuc_tap_sinh_Learning_Contest_AI_Native.docx` |
| Dữ liệu nhạy cảm | `BE/.env` không bị in ra. Mật khẩu `123456` là mật khẩu mẫu công khai đọc từ `DEFAULT_SEED_PASSWORD`. Ảnh chụp Handbook dùng dữ liệu seed, không có dữ liệu học viên thật |

## Mục lục các việc

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Deep Audit Day 29 chỉ đọc, phân loại Critical → Low (17/10) | Đạt, không sửa file |
| 2 | Bỏ Docker, chạy Local Sandbox 100% (17/10) | Đạt |
| 3 | Khóa tuần tự Code Playground 20 bài K6-9 / 15 bài K10-12 (18/10) | Đạt |
| 4 | Đóng vai QA, kiểm thử E2E bằng Chrome thật (18/10) | Đạt, 102/102 rồi 107/107 |
| 5 | Quiz hết giờ tự nộp, dọn "chờ chấm" lớp K10-12 (18/10) | Đạt |
| 6 | Bàn giao Ngày 30: Handbook, Runbook, Release Notes, Roadmap 60 ngày, README (19/10) | Đạt |

---

## Việc 1: Deep Audit Day 29 chỉ đọc

> "CHẾ ĐỘ LÀM VIỆC: CHỈ KIỂM TRA, ĐÀO SÂU VÀ LẬP BÁO CÁO (READ-ONLY AUDIT) — TUYỆT ĐỐI CHƯA SỬA CODE HAY DB LÚC NÀY! Tester vừa gửi phản hồi kèm báo cáo kiểm thử Day29_Security_Privacy_Test_Form và phát hiện lỗi nghiêm trọng trên giao diện Admin. Hãy thực hiện một cuộc Đại kiểm tra (Deep Audit) toàn bộ mã nguồn FE, BE, Database/Seed và lịch sử Git để tìm ra nguyên nhân gốc rễ (root cause) của tất cả các lỗi dưới đây, đồng thời đào sâu tìm thêm các lỗi tiềm ẩn tương tự. YÊU CẦU ĐẦU RA: Liệt kê toàn bộ vấn đề phát hiện được, sắp xếp theo mức độ từ CRITICAL → HIGH → MEDIUM → LOW. Với mỗi vấn đề, hãy chỉ rõ: Tên lỗi, File & dòng code gây lỗi, Nguyên nhân gốc rễ (Root Cause), và Hướng khắc phục đề xuất. […] PHẦN 1: ĐIỀU TRA LỖI ADMIN KHÔNG PHÂN CÔNG ĐƯỢC GIẢNG VIÊN CHO LỚP HỌC […] PHẦN 2: RÀ SOÁT TOÀN BỘ 10 LỖI FAIL & 3 MỤC NOT RUN […] PHẦN 3: ĐÀO SÂU TÌM THÊM CÁC LỖI LOGIC, PHÂN QUYỀN & EDGE CASES KHÁC"

### Điều tôi hiểu trước khi gọi AI

Admin không phân công được giảng viên, trong 4 tài khoản giống nhau chỉ 1 cái gán được. Chưa rõ lỗi ở FE hay BE, nên bắt AI chỉ đọc để tìm nguyên nhân gốc thay vì vá triệu chứng.

### Kết quả và quyết định

AI trả báo cáo 2 Critical, 6 High, 9 Medium, 7 Low có file và dòng. **C1:** lớp còn `teacherId` của tài khoản đã xóa ("ID ma"); FE gửi cả ID ma lẫn ID mới, BE kiểm tra mọi ID nên từ chối cả request. Lỗi nằm ở lớp, không ở tài khoản. AI cũng ghi rõ giới hạn: DB lúc audit không có 4 tài khoản của Tester, nên kết luận dựa trên đọc code và seed. Tôi dùng báo cáo làm khung sửa 4 Phase (commit `c044190`: BE tự gỡ ID không còn là giảng viên, chặn khóa giảng viên đứng lớp bằng 409, `migrate-day29.js`, `audit-day29-security-privacy.js` 33/33).

---

## Việc 2: Bỏ Docker, chạy Local Sandbox 100%

> "2. Về Docker (Mục F.2): XÓA HẲN hoàn toàn Docker! – Trong `code-runner.helper.ts`: Bỏ hẳn nhánh `docker run`, chạy 100% `local` sandbox. Xóa `code-runner.docker.spec.ts`. – Xóa luôn các file `docker-compose.yml`, `docker-compose.prod.yml`, `Dockerfile` (trong BE/FE nếu không cần thiết), các script `ensure-sandbox.js` / lệnh `docker:*` trong `package.json`. Hệ thống giờ chạy thuần 100% Node.js + Python local + MongoDB. […] NGUYÊN TẮC BẤT DI BẤT DỊCH: Tuyệt đối KHÔNG đụng chạm bất kỳ file nào trong thư mục `Data-AI-Resource/`."

### Điều tôi hiểu trước khi gọi AI

Khi Docker Desktop tắt, máy chấm trả RE hàng loạt (Tester ghi nhận). Bỏ Docker để setup đơn giản, nhưng phải ghi rõ đánh đổi bảo mật.

### Quyết định của tôi

- AI đề xuất *"giữ dưới dạng tùy chọn tắt mặc định"* và *"`docker-compose`/`Dockerfile` để triển khai thì đề xuất giữ"*. → **Bác bỏ việc giữ Docker**: xóa hẳn, vì một nhánh chạy code không ai kiểm thử là rủi ro.
- AI cảnh báo chế độ local không phải cô lập cấp hệ điều hành. → Chấp nhận, ghi vào Known Issues K-01 và Roadmap Ngày 36–39 (gVisor/MicroVM).

---

## Việc 3: Khóa tuần tự Code Playground

> "B. Khóa cứng danh sách bài trên `/playground` (Giảng viên & Admin KHÔNG có quyền thêm bài vào `/playground`) […] C. Sửa chuẩn lại cơ chế 'Mở khóa tuần tự' (Sequential Unlock) & Dữ liệu Seed: Các bài tập trong `/playground` của mỗi khối (6-9 và 10-12) được sắp xếp cố định từ `#1` đến `#N`. **Bài #1 luôn luôn mở khóa** […] **Bài `#k` (với `k >= 2`) chỉ được mở khóa khi và chỉ khi học sinh đã hoàn thành (PASSED) tất cả các bài từ `#1` đến `#(k-1)`** […] Các bài phía sau nữa mới hiện ổ khóa 🔒 và bị khóa click (cả trên UI lẫn chặn ở BE nếu gọi nộp bài nhảy cóc)."

### Kết quả

Lộ trình cố định 20 bài (6-9) / 15 bài (10-12), bỏ bài SQL và dropdown chủ đề; máy chủ tính trạng thái khóa, nộp nhảy cóc trả `403 E403_EXERCISE_LOCKED`; bài giáo viên giao trong lớp không bị khóa; tiến độ cũ nhảy cóc được gắn cờ `outOfSequence` (không xóa bài nộp). `audit-day31.js` 36/36.

---

## Việc 4: Kiểm thử E2E bằng Chrome thật

> "CHẾ ĐỘ LÀM VIỆC: ĐÓNG VAI QA TESTER KHÓ TÍNH — TỰ ĐỘNG MỞ TRÌNH DUYỆT THẬT KIỂM THỬ E2E TOÀN DIỆN & BẮT LỖI […] Phải mở trình duyệt điều khiển UI thật trên `http://localhost:5173` (nối với BE `http://localhost:3000`), kiểm tra xem có lỗi Console Error (đỏ), Unhandled Promise Rejection, 404/500 Network, vỡ layout hay nút bấm bị đơ không. […] 5 luồng thực tế […] Nếu phát hiện bất kỳ lỗi nào […] Liệt kê trung thực toàn bộ các lỗi tìm thấy. Tự động sửa triệt để ngay lập tức. Chạy lại trình duyệt xác nhận đã hết lỗi và chạy lại `npm run seed:clean`."

### Kết quả

`npm run e2e:browser` (puppeteer-core + Chrome, đăng nhập bằng form thật): **102/102** bước sau khi sửa các lỗi tìm được, rồi **107/107** khi thêm kịch bản quiz hết giờ ở Việc 5.

---

## Việc 5: Quiz hết giờ tự nộp, dọn "chờ chấm" lớp K10-12

> "1. SỬA LUỒNG HẾT GIỜ (TIMEOUT AUTO-SUBMIT) Ở TRANG THI TRẮC NGHIỆM (`/quiz`) […] khi đồng hồ đếm ngược về `00:00`, Frontend tự động gọi API submit với các đáp án học sinh đã chọn tính đến lúc đó (các câu chưa chọn tính là 'Bỏ trống'). Ở Backend (`quiz.service.ts` - `submitAttempt`): Không từ chối hay hủy bài khi nộp trễ do hết giờ […] 3. XỬ LÝ DỨT ĐIỂM VỤ '1 BÀI CHỜ CHẤM' Ở LỚP K6-9 & K10-12: Khối 6-9 và 10-12 chỉ làm bài Code và Trắc nghiệm (100% máy chấm tự động có điểm ngay), tuyệt đối KHÔNG có khái niệm 'chờ chấm tay' hay 'chờ công bố điểm'."

### Quyết định của tôi

- AI tra DB và hỏi: *"Có đổi nhãn thành 'chờ công bố điểm' không?"*. → **Bác bỏ việc chỉ đổi nhãn**: xóa nguồn sinh bản ghi `SUBMITTED` treo của seed (chuyển sang điểm công bố), bảng điểm lớp luôn là điểm Chính thức.
- Mã cũ đánh EXPIRED/400 khi nộp trễ. → **Bác bỏ việc hủy bài thi trắc nghiệm khi hết giờ** ở `/quiz`: luôn chấm GRADED và vào thẳng màn hình Kết quả; chỉ bài giao của lớp vẫn khóa theo hạn chót.

Commit `ac18440`.

---

## Việc 6: Bàn giao Ngày 30

> "CHẾ ĐỘ LÀM VIỆC: THỰC THI TOÀN BỘ BÀN GIAO NGÀY 30 […] NGUYÊN TẮC BẮT BUỘC: Dựa trên 100% sự thật của codebase hiện tại […] Dữ liệu demo và seed có tính tái lập (reproducible) bằng `npm run seed:clean`, mật khẩu chuẩn `123456`, không dùng bất kỳ thao tác bí mật/backdoor nào. Tuyệt đối KHÔNG đụng vào thư mục `Data-AI-Resource/`."

### File do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| File | Ghi chú |
|---|---|
| `docs/ADMIN_TEACHER_HANDBOOK.md` + `docs/images/handbook/` (33 ảnh) | Giữ. AI quét FE/BE và chụp ảnh thật bằng Chrome trên dữ liệu `seed:clean` thay vì để khung trống |
| `docs/OPERATIONS_RUNBOOK.md` | Giữ: môi trường, `/api/health`, backup/restore, seed, escalation L1/L2/L3, 7 lỗi thực tế |
| `docs/RELEASE_NOTES_v1.0.md`, `CHANGELOG.md` | Giữ: tính năng, chỉ số chất lượng, 17 Known Issues |
| `docs/ROADMAP_60D.md` | Giữ: theo đúng cấu trúc file mẫu CyberSoft, Ngày 31 → 90 |
| `docs/DEMO_SCRIPT.md` | **Bác bỏ, đã xóa**: tôi tự quay video và tự demo |
| Tên nhánh `learning-hubday30` | **Sửa** thành `feature/learning-hub-day30` theo quy ước dự án |

AI đối chiếu và sửa lại một số chi tiết trong yêu cầu của tôi cho khớp mã nguồn (tôi chấp nhận): Node **20.12+** (không phải 18+); `seed:clean` gồm bước 0 + **9 bước** (không phải 8); phòng thi bị khóa ở lần rời màn hình **thứ 3** (chỉ tính khi vắng từ 5 giây); mã lớp do hệ thống **tự sinh**; điểm lớp gồm Bài tập tuần 30% / Cuộc thi 40% / Thi kết thúc 30%.

---

## Lỗi AI mắc phải và cách tôi phát hiện

| Lỗi | Hậu quả | Cách phát hiện | Cách sửa |
|---|---|---|---|
| **Ghi đè bộ lọc `slug`**: khi ẩn bài `demo-dash-*`, AI thêm khóa `slug` vào `baseFilter()`, nhưng `load()` vẫn viết `findOne({ slug: String(slug), ...this.baseFilter() })`, nên khóa sau ghi đè slug được chọn | Sửa/xóa trong Ngân hàng đề tra về **bài đầu tiên bất kỳ trong DB** (403 sai, có thể tác động nhầm bài) | E2E Chrome thật, luồng Giảng viên | `findOne({ $and: [{ slug }, this.baseFilter()] })` + test hồi quy (`ac18440`) |
| **`print(__file__)` lộ đường dẫn qua stdout**: bản che đường dẫn đầu tiên chỉ áp cho stderr/thông báo lỗi | Học viên thấy đường dẫn thư mục tạm `C:\Users\...\Temp\...` của máy chủ | Kịch bản DEF-060 trong `audit-day30.js` | stdout cũng đi qua `scrubServerPaths`, test `day30-step1.spec.ts` |
| **Timeout 15 giây do tải 2 MB test ẩn**: backend tải cả bộ test ẩn 0,6–2 MB của bài Day 15 mỗi lần mở/nộp (6–20 giây), FE chỉ chờ kết quả 15 giây | Học viên K10-12 không nộp được bài thuật toán | E2E Chrome thật trên dữ liệu Atlas | Lọc/đếm test trên CSDL, bộ nhớ đệm bộ test của máy chấm, FE chờ tới 120 giây; mở bài còn ~0,3 giây |

## Số liệu kiểm chứng độc lập

| Bộ kiểm thử | Kết quả | Ghi chú |
|---|---|---|
| Jest backend | **1635 passed** (12 skipped) | Chạy lại 19/10 |
| Vitest frontend | **431 passed** | Chạy lại 19/10 |
| node --test (script) | 31 passed | Chạy lại 19/10 |
| 5 bộ Audit | day29 **33/33**, day30 **45/45**, day31 **36/36**, cross-role **52/52**, teacher-security **40/40** | Chạy lại 19/10 |
| E2E Chrome thật | **107/107** | Commit `ac18440` (18/10) |
| Typecheck | BE `tsc --noEmit` sạch, FE `tsc -b` sạch | Chạy lại 19/10 |

## Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

- Việc rủi ro cao thì chạy chế độ **chỉ đọc trước, sửa sau**, để AI tìm ra nguyên nhân gốc và tôi giữ quyền quyết định nghiệp vụ.
- Không để AI tự xác nhận bản vá bảo mật: phải có kịch bản tấn công cụ thể trong audit gọi API thật (như DEF-060).
- E2E trên dữ liệu thật bắt được cả ba lỗi ở bảng trên, những lỗi mà hơn 1600 unit test bỏ sót.
- Dữ liệu sai thì sửa ở nguồn, không đổi nhãn hiển thị.
- Chưa chắc: Local Sandbox chưa cô lập cấp hệ điều hành (K-01). Nguyên nhân Windows/IDE chạm file làm backend tự restart chưa xác định hẳn, mới chặn được bằng polling.
- Quy tắc cố định cho lần sau: không sửa `Data-AI-Resource/`; chỉ đẩy nhánh `feature/learning-hub-dayNN`, không đụng `main`; không ghi tên AI vào commit; chạy `seed:clean` trước và sau E2E.
