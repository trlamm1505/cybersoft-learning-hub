# AI Work Log Ngày 25: Teacher Dashboard và quản trị lớp học

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 6 tháng 10 năm 2026 |
| Nhánh | feature/learning-hub-day25 |
| Công cụ, model | Claude Code chạy trên Claude Sonnet 5.5 trong cả ngày; không sử dụng subagent |
| Phạm vi quyền | Đọc và ghi trong thư mục learning-hub. Với `Data-AI-Resource` của Thực tập sinh số 1 chỉ đọc; riêng Việc 2 và Việc 3, AI chạy thử server Day 21 của Số 1 từ một môi trường Python (venv) đặt ngoài repo, không sửa file nào trong `Data-AI-Resource`, và tắt server sau khi thử |
| Dữ liệu nhạy cảm | Không có sự cố lộ thông tin nhạy cảm trong phiên làm việc: `BE/.env` không bị in ra, khóa API của server Số 1 chỉ là khóa dev `student` công khai trong mã nguồn của Số 1 (`cybersoft-student-public-key-101`). Tài khoản Admin mẫu `admin@gmail.com` dùng mật khẩu mẫu công khai `123456` theo đúng yêu cầu ở Việc 8, nên tính năng tự tạo tài khoản này tắt khi `NODE_ENV=production`. Mọi tài khoản, lớp, bài nộp và tiến độ tạm dùng để kiểm thử động đều bị xoá ngay sau khi chạy. Việc 7 đã xoá dữ liệu demo trong MongoDB local của tôi (1 lớp, 5 tài khoản, 5 bài, 23 bài nộp, 5 lượt gợi ý) theo yêu cầu |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Tạo nhánh feature/learning-hub-day25 từ main đã cập nhật | Đạt |
| 2 | Chuyển từ mock sang server thật của Số 1: đối chiếu hợp đồng, nạp dữ liệu, rà DA Lab và AI Lab | Đạt |
| 3 | Chuẩn hóa quy trình khởi chạy một lệnh cho người mới clone repo | Đạt |
| 4 | Teacher Dashboard: API thống kê, giao diện, bộ dữ liệu mẫu, test | Đạt |
| 5 | Chạy backend và frontend để kiểm thử thủ công | Đạt, không sửa file |
| 6 | Quản lý lớp học trên giao diện, Dashboard tính số liệu từ bài nộp thật | Đạt |
| 7 | Chuyển quản trị lớp sang Admin, import học viên bằng Excel/CSV, dọn dữ liệu demo | Đạt |
| 8 | Tách Admin Portal riêng và thêm tài khoản Admin mẫu | Đạt |
| 9 | Hoàn thiện Admin Portal: Topbar, sidebar, quản lý người dùng, drawer hồ sơ, giao diện lớp | Đạt |
| 10 | Chống leo thang đặc quyền, thu hồi quyền giảng viên, sidebar, dropdown tối, cập nhật hồ sơ | Đạt |
| 11 | Cân nhắc lấy game từ nihicode.com | Đạt, không sửa file |
| 12 | Thêm Mê Cung Blockly (Maze của Blockly Games) vào Block Puzzle | Đạt |
| 13 | Hỏi về các game còn lại của Blockly Games | Đạt, không sửa file |
| 14 | Thêm Turtle, Bird và Puzzle vào Block Puzzle | Đạt |
| 15 | Rà lỗi trò chơi Rùa Vẽ Hình | Đạt |
| 16 | Học viên xem lớp và bài được giao, kiểm thử vòng khép kín | Đạt |
| 17 | Lỗi không nộp được bài | Đạt, chưa rõ nguyên nhân backend tắt |
| 18 | Rà soát tiêu chí nghiệm thu Ngày 25 và xử lý học viên tự do | Đạt |
| 19 | Soạn docs/day25/tomtatday25.md | Đạt |
| 20 | Cập nhật AI Work Log Ngày 25 | Đạt |

---

## Việc 1: Tạo nhánh feature/learning-hub-day25 từ main đã cập nhật

> "tạo branch hub day25 (tên đồng bộ giống mấy ngày trước) xong kéo main r rồi đợi tôi ra lệnh"

### Điều tôi hiểu trước khi gọi AI

Day 24 đã xong nên nhánh Day 25 phải tạo từ main mới nhất, đặt tên theo quy ước `feature/learning-hub-dayNN`. "Đợi tôi ra lệnh" nghĩa là không làm thêm việc gì sau khi tạo nhánh.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không tạo file. AI kéo `main` về (fast-forward lên `df0363a`), tạo nhánh `feature/learning-hub-day25` từ đó và dừng. Working tree sạch, tên nhánh đúng quy ước ngay từ đầu.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: ghi rõ "đồng bộ giống mấy ngày trước" trong prompt giúp AI đặt đúng tên nhánh.

---

## Việc 2: Chuyển từ mock sang server thật của Số 1: đối chiếu hợp đồng, nạp dữ liệu, rà DA Lab và AI Lab

> "Phía Số 1 (Data & AI Resource) đã cập nhật xong các endpoint theo thỏa thuận. Hãy tiến hành tích hợp chính thức và chuyển đổi từ mock server sang server thật theo đúng tài liệu theo dõi tích hợp:
>
> 1. Rà soát và kiểm tra hợp đồng API:
> - Kiểm tra kết nối tới 3 endpoint vừa cập nhật từ server thật của Số 1: trường data_dictionary trong GET dataset, endpoint GET evaluation-sets, và endpoint trích xuất dữ liệu bảng.
> - Đối chiếu cấu trúc JSON thực tế trả về với cấu trúc mà hệ thống đang mong đợi để thực hiện chuyển đổi tương thích nếu có chênh lệch tên trường.
>
> 2. Hoàn thiện luồng nạp dữ liệu tự động (Data Ingestion Pipeline):
> - Thực thi kịch bản nạp dữ liệu từ API của Số 1 vào Postgres Sandbox nội bộ, đảm bảo nạp đúng phiên bản dữ liệu (clean/dirty) và khớp với checksum.
> - Đối soát tính toàn vẹn và số lượng bản ghi sau khi nạp (so sánh với quy mô dữ liệu gốc).
>
> 3. Cấu hình môi trường và kiểm thử hệ thống:
> - Cập nhật cấu hình biến môi trường kết nối dịch vụ dữ liệu để chuyển từ chế độ mô phỏng sang gọi trực tiếp server thật.
> - Rà soát các bài thực hành DA Lab và AI Lab xem kết quả kiểm thử hoặc số liệu đề bài có bị ảnh hưởng bởi dữ liệu thật hay không, tinh chỉnh điều kiện chấm cho khớp logic.
> - Chạy toàn bộ bộ kiểm thử tự động (unit, integration, contract tests) và quy trình chẩn đoán hệ thống để đảm bảo việc tích hợp thành công, không phát sinh lỗi biên dịch hay phá vỡ luồng hiện tại.
>
> Cập nhật lại tài liệu theo dõi tích hợp với trạng thái hoàn tất kèm các số liệu đối soát cụ thể."

### Điều tôi hiểu trước khi gọi AI

Số 1 đã làm xong ba endpoint đã nhờ ở Day 24 nên Learning Hub phải chuyển từ bản mô phỏng sang server thật và nạp dữ liệu qua API, không sao chép tệp thủ công. Tên trường thật có thể khác bản đề xuất nên cần lớp chuyển đổi; dữ liệu thật nhiều hơn bản mô phỏng nên một số bài lab có thể bị lệch. Thư mục của Số 1 không được sửa.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc ở chế độ chỉ đọc: tài liệu theo dõi `docs/day22/tomtat.md`, `DatasetIntegrationService` cùng hợp đồng kiểu dữ liệu, bản mô phỏng cục bộ và các bài `initial-da-labs.ts`, `da-labs.service.ts`, các script sandbox. Phía Số 1 AI chỉ đọc mã nguồn server và chạy server đó từ một venv ngoài repo (cổng 8000) để gọi thử ba endpoint thật.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Đối chiếu bằng cách gọi thật:** AI gọi cả ba endpoint bằng server thật rồi so cấu trúc với bản đề xuất; cả ba trả đủ dữ liệu nhưng khác tên trường.
- **Chuẩn hóa ở một chỗ:** toàn bộ phần chuyển đổi nằm trong `DatasetIntegrationService` để FE và các bài lab không phải sửa.
- **Nạp dữ liệu an toàn:** mỗi bảng phải khớp checksum (tệp tải về, header, phản hồi JSON), khớp số dòng; sai một điều kiện là hủy cả giao dịch, sandbox giữ nguyên.
- **Rà bài lab với dữ liệu thật:** chạy lại câu tham chiếu của DA Lab trên sandbox thật và đọc đề bài có ghi sẵn số liệu.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Tích hợp | `integration/dataset-integration.service.ts`, `dataset-contract.types.ts`, `local-registry/evaluation-set-fixture.ts`, mới: `integration/eval-slices.ts`, `__fixtures__/`, `real-registry-contract.spec.ts` | Chuyển `data_dictionary` (mảng, không bọc `tables`); đọc cả `items` lẫn `questions`; dịch `expected_behavior` dạng câu mô tả sang `ANSWER`/`ABSTAIN`; mỗi bài AI Lab là một "lát" `question_id` của hai bộ lớn trên server |
| Nạp dữ liệu | mới: `scripts/ingest-sandbox.js`, `scripts/lib/ingest-helpers.js` (+ test), `package.json` (`ingest:sandbox`) | Nạp qua API, hỗ trợ `--variant clean|dirty` và `--dry-run`, ghi `_ingest_manifest` |
| Bài lab | `data/initial-da-labs.ts`, `da-labs.service.ts` | Sửa 4 bài lệch dữ liệu thật; đổi cách nạp bài DA Lab sang ghi đè theo `slug` |
| Cấu hình, tài liệu | `BE/.env.example`, `README.md`, `docs/day22/tomtat.md`, `BE/.env` (không commit) | Địa chỉ server thật `http://127.0.0.1:8000`; tài liệu theo dõi chuyển sang "hoàn tất" kèm bảng đối soát |

Bốn bài lab được chỉnh vì dữ liệu thật:

| Bài | Vấn đề | Điều chỉnh |
|---|---|---|
| `da-sql-09` | Ngưỡng 30 triệu: cả 20/20 nhân viên đều vượt | Nâng lên 400 triệu, còn 6/20 |
| `da-insight-02` | Rubric nhắc "thiếu quý", dữ liệu thật có 6 quý liên tục | Sửa lời rubric |
| `da-insight-05` | Đề giả định có bất thường, dữ liệu thật nhất quán | Cho phép kết luận "không bất thường" kèm bằng chứng |
| `ai-lab-04` | Câu Q057 là loại tổng hợp nhiều điều kiện | Thay bằng Q012 (câu một bước) |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest`, `npm run build` ở BE; `npx tsc -b`, `npx vitest run` ở FE; contract test live với server thật; `npm run doctor`; kịch bản setup.
- **Kết quả:** BE 64 suite, 769 đạt (2 bỏ qua là bộ test live); contract test live 16/16 đạt; FE 79 đạt; kịch bản setup 14/14; `nest build` đạt; `npm run doctor` đạt mọi mục trừ web chưa bật lúc kiểm tra.
- **Đối soát nạp dữ liệu (clean):** 5 bảng, 3.073 dòng ở nguồn và 3.073 dòng trong Postgres; cả 5 checksum SHA-256 khớp header, khớp phản hồi JSON và khớp tệp SQL của Số 1; 0 đơn hàng mồ côi; tổng `line_total` khớp `total_amount` ở cả 1.000 đơn. Bản `dirty` nạp vào schema `dirty` cũng 5 bảng, 3.073 dòng, checksum khớp.
- **Chạy thật bằng tài khoản học viên thử (đã xoá):** 10/10 bài SQL chấm đúng, 8 bài AI Lab tải đúng bộ câu hỏi, 3 bài nộp thử đạt.

**Lỗi AI phát hiện (có sẵn trong mã):** backend nạp bài DA Lab theo kiểu chỉ chèn bài mới nên sửa đề trong mã không đến được DB đã có; bài 9 chấm sai cho tới khi đổi sang ghi đè theo `slug`. Phát hiện nhờ chạy thật bằng tài khoản học viên chứ không phải nhờ test đơn vị.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** gọi thử endpoint thật trước khi viết lớp chuyển đổi cho thấy ngay các khác biệt (mảng bọc, tên `questions`, rubric thay cho `ANSWER`/`ABSTAIN`) mà bản đề xuất không lường trước.

**Điều chưa chắc:**
- Khóa API đang dùng là khóa `student` của môi trường dev; môi trường thật cần xin Số 1 khóa riêng.
- Backend giờ cần server của Số 1 đang chạy mới khởi động đủ chức năng; muốn chạy tạm bằng dữ liệu tích hợp sẵn thì đặt `DATA_SERVICE_FALLBACK=embedded`.
- Lần khởi động backend tiếp theo sẽ cập nhật cả 15 bài DA Lab trong MongoDB local.

---

## Việc 3: Chuẩn hóa quy trình khởi chạy một lệnh cho người mới clone repo

> "Chuẩn hóa lại quy trình khởi chạy dự án cho người mới clone repo, đảm bảo đúng tiêu chí "One-command setup" và không bị nghẽn:
>
> 1. Tự động hóa Docker và Postgres Sandbox:
> - Trong kịch bản setup (setup.js), tự động kiểm tra Docker Compose. Nếu container Postgres Sandbox chưa bật thì tự động chạy ngầm `docker compose up -d` và chờ đến khi database sẵn sàng kết nối (healthcheck poll).
>
> 2. Tự động nạp dữ liệu ban đầu (Auto-bootstrap):
> - Khi database mới được tạo (chưa có dữ liệu), kịch bản tự động kích hoạt luồng nạp dữ liệu cho sandbox.
> - Đảm bảo cơ chế fallback an toàn: Thử kết nối lấy dữ liệu từ server Số 1 qua API; nếu server Số 1 không chạy hoặc không có kết nối mạng, tự động chuyển sang đọc file dữ liệu mẫu tích hợp sẵn (embedded data) để nạp vào Postgres Sandbox. Không để tiến trình setup bị crash hoặc báo đỏ.
>
> 3. Tối ưu hướng dẫn trong README.md:
> - Đảm bảo người mới chỉ cần:
>   git clone <repo>
>   npm run setup
>   npm run dev
> - Cả Backend, Frontend và Docker Sandbox đều chạy trơn tru mà không cần gõ lệnh thủ công nào khác."

### Điều tôi hiểu trước khi gọi AI

Việc bật Docker và nạp dữ liệu đã có một phần ở Day 22 và Day 24 (`ensure-sandbox.js`), nên việc chính là nối thêm bước nạp dữ liệu tự động có phương án dự phòng và rút README còn ba lệnh. Điểm then chốt là bước nạp không bao giờ làm setup thoát mã lỗi.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `scripts/setup.js`, `scripts/ensure-sandbox.js`, `scripts/ingest-sandbox.js` (vừa viết ở Việc 2), `package.json`, README và dữ liệu mẫu `BE/mock-data-service/sandbox/init.sql`.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Thứ tự quyết định của bootstrap:** đã có bảng `_ingest_manifest` thì bỏ qua (không bao giờ nạp đè); có `DATA_SERVICE_BASE_URL` thì thử nạp qua API với một lượt thăm dò 4 giây; lỗi mạng hay lỗi dữ liệu thì cảnh báo vàng và dùng dữ liệu mẫu tích hợp sẵn, ghi manifest `embedded`.
- **Tách `ingest()` thành hàm ném lỗi** để bootstrap dùng lại, còn lệnh `npm run ingest:sandbox` giữ nguyên hành vi.
- **Lệnh ở thư mục gốc repo:** thêm `package.json` ở gốc chuyển tiếp các lệnh sang `learning-hub/` để người mới không phải `cd learning-hub`.
- **Mặc định `DATA_SERVICE_BASE_URL` vẫn để trống:** AI cố ý không đặt sẵn `localhost:8000` vì backend sẽ lỗi ở mọi request khi người đó chưa chạy server Số 1.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Script | mới: `scripts/bootstrap-sandbox.js`; sửa: `scripts/ensure-sandbox.js`, `scripts/ingest-sandbox.js`, `scripts/setup.js` | `ensure-sandbox.js` gọi bootstrap sau khi sandbox sẵn sàng |
| Lệnh | mới: `package.json` ở gốc repo; sửa: `learning-hub/package.json` | Chuyển tiếp `setup`, `dev`, `doctor`, `sandbox`, `bootstrap:sandbox`, `ingest:sandbox` |
| Tài liệu | `README.md` | Phần "Bắt đầu nhanh" còn ba lệnh; bảng bước setup thêm dòng nạp dữ liệu |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** chạy thật từng bước trên máy này, `npm run setup -- --skip-install`, kịch bản test script, `npm run doctor`.
- **Kết quả:**
  - Sandbox trắng, server Số 1 tắt: báo `ECONNREFUSED`, tự chuyển sang dữ liệu mẫu (62 dòng), tổng 13 giây.
  - Sandbox trắng, server Số 1 bật: nạp 3.073 dòng qua API, checksum khớp từng bảng.
  - Chạy lại lần hai: báo "đã có dữ liệu", giữ nguyên.
  - `npm run dev` từ thư mục gốc: web trả 200, backend `ok`, `npm run doctor` đạt mọi mục.
  - `npm run setup`: sạch lỗi, 14/14 test script đạt.
- Để thử, AI đã `docker compose down -v` hai lần và xoá volume sandbox; dữ liệu sandbox hiện là bản 3.073 dòng nạp từ API, không ảnh hưởng MongoDB.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** bước phụ trợ như nạp dữ liệu phải được thiết kế để không bao giờ làm hỏng bước chính; chọn mặc định an toàn (để trống URL) quan trọng hơn mặc định "thông minh".

**Điều chưa chắc:** nhánh tự bật container MongoDB chưa được thử vì Mongo trên máy này đã chạy sẵn; chỉ ba kiểm tra ở trên chạy thật.

---

## Việc 4: Teacher Dashboard: API thống kê, giao diện, bộ dữ liệu mẫu, test

> "Triển khai toàn bộ tính năng và bài kiểm thử cho nhiệm vụ Ngày 25 (Teacher Dashboard) trên nhánh hiện tại. Chưa tạo hay cập nhật bất kỳ tệp tài liệu (docs) nào, chỉ tập trung vào mã nguồn backend, frontend và test tự động.
>
> Yêu cầu kỹ thuật và nghiệp vụ chi tiết:
>
> 1. Backend & API thống kê (Learning Analytics):
> - Xây dựng API tổng hợp số liệu học tập dành riêng cho giảng viên/quản trị viên theo lớp học:
>   + Tỷ lệ hoàn thành (Completion Rate)
>   + Tỷ lệ đạt (Pass Rate)
>   + Số lần thử trung bình (Average Attempts)
>   + Tần suất sử dụng gợi ý (Hint Usage)
>   + Phân tích điểm nghẽn/độ khó bài tập theo nhãn kỹ năng (Tags/Topics)
> - Cung cấp API hỗ trợ xem chi tiết đa tầng (Drill-down):
>   + Xem tiến độ chi tiết theo từng học viên trong lớp
>   + Xem thống kê chi tiết theo từng bài tập cụ thể
> - Kiểm soát phân quyền chặt chẽ (RBAC): Chỉ tài khoản giảng viên và quản trị viên mới được gọi các endpoint này; tuyệt đối cô lập dữ liệu theo lớp, không cho phép truy cập chéo dữ liệu giữa các lớp học khác nhau.
> - Tích hợp bộ dữ liệu mẫu (demo dataset) nội bộ để kiểm tra số liệu tính toán đối soát chính xác với cơ sở dữ liệu.
>
> 2. Frontend (Giao diện Teacher Dashboard):
> - Xây dựng trang tổng quan Teacher Dashboard hiển thị các chỉ số học tập cốt lõi trên.
> - Triết lý thiết kế UI:
>   + Tối giản, gọn gàng, mang tính thực dụng cao, tránh lạm dụng quá nhiều button to bản hay các chi tiết trang trí rườm rà.
>   + Trình bày thông tin dạng thẻ phẳng, bảng đối soát hoặc các dòng kẻ phân tách nhẹ nhàng; câu chữ ngắn gọn, rõ ràng, không dùng các câu văn giải thích dài dòng.
>   + Hỗ trợ xem drill-down mượt mà (chọn xem chi tiết từng học viên hoặc bài tập qua tương tác bảng/dòng chọn đơn giản).
>   + Xử lý triệt để trạng thái dữ liệu trống (Empty State): Hiển thị thông báo tinh tế, sạch sẽ khi lớp học hoặc bài tập chưa phát sinh lượt làm bài nào.
>
> 3. Kiểm thử tự động (Testing & Verification):
> - Viết đầy đủ unit tests và integration tests bao phủ:
>   + Tính chính xác của các công thức tính chỉ số thống kê (completion, pass rate, hint usage, tag difficulty).
>   + Kiểm thử phân quyền truy cập: Chặn học viên, chặn truy cập trái phép chéo lớp.
>   + Kiểm thử trạng thái dữ liệu trống (empty state).
> - Đảm bảo kiểm tra kiểu dữ liệu sạch hoàn toàn, không có lỗi biên dịch và các bộ test hiện có không bị ảnh hưởng."

### Điều tôi hiểu trước khi gọi AI

Công thức phải rõ ràng và có đối soát tay; mẫu số bằng 0 không được ra NaN. Dữ liệu của các lớp không được lẫn vào nhau nên phải lọc theo học viên và bài của lớp ngay trong truy vấn. Dòng "chưa tạo hay cập nhật docs" nghĩa là không viết tài liệu trong lượt này (tài liệu để cuối ngày, ở Việc 19).

### Context, tài liệu, file, constraint đã cung cấp

AI đọc các schema nộp bài (`Submission`, `HintUsage`, `DaLabSubmission`, `AiLabSubmission`), `RolesGuard`, `JwtStrategy`, các controller `teacher/*`, `App.tsx` và `Header.tsx` để bắt chước cách dựng trang giảng viên.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Đơn vị tính là cặp (học viên, bài được giao):** hoàn thành = cặp đạt / (số học viên × số bài); tỷ lệ đạt = cặp đạt / cặp đã thử; lần thử TB = tổng lượt thử / cặp đã thử; dùng gợi ý = cặp có mở gợi ý / cặp đã thử; công thức ghi ở đầu `analytics-core.ts`.
- **Độ khó theo nhãn:** điểm 0 đến 100 kết hợp tỷ lệ chưa đạt, lần thử và dùng gợi ý; nhãn từ 50 điểm trở lên và có ít nhất 2 cặp đã thử bị đánh dấu "Điểm nghẽn".
- **Không tính** bài nộp QUEUED, RUNNING, FAILED vì chưa có kết quả hoặc là lỗi hệ thống.
- **Phát sinh khái niệm mới:** hệ thống chưa có "lớp học" nên AI thêm schema `Classroom` (giảng viên sở hữu, danh sách học viên, danh sách bài được giao) và API; đây là điểm AI hỏi lại tôi, và các việc sau (6, 7) bổ sung giao diện quản lý lớp.
- **Dữ liệu mẫu có cả mục phải bị loại** (bài nộp QUEUED/FAILED, học viên ngoài lớp, bài không được giao) để test cô lập thật sự.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend lõi | `modules-api/teacher-analytics/`: `analytics-core.ts`, `teacher-analytics.service.ts`, `teacher-analytics.controller.ts`, `teacher-analytics.module.ts`, `demo-dataset.ts`; `schemas/classroom.schema.ts` | Công thức thuần tách khỏi truy cập DB; API `/api/teacher/classes` gồm danh sách lớp, `analytics`, drill-down `students/:id` và `exercises/:slug` |
| Dữ liệu mẫu | `data/seed-teacher-demo.ts`, `package.json` (`seed:teacher-demo`) | Lớp "Lớp Demo Dashboard" cho `teacher@gmail.com`, nhận diện bằng tiền tố `demo.dashboard.*` và `demo-dash-*` |
| Frontend | `pages/TeacherDashboardPage.tsx`, `pages/teacherDashboardModel.ts`, `axios/teacherAnalyticsApi.ts`, `types/teacherAnalytics.ts`, `Header.tsx`, `App.tsx` | Trang `/teacher/dashboard`, mục "Tổng quan lớp"; dải chỉ số phẳng, bảng kỹ năng, hai tab Học viên / Bài tập, bấm tiêu đề cột để sắp xếp, bấm dòng để xem chi tiết |
| Test | `analytics-core.spec.ts` (14), `teacher-analytics.service.spec.ts` (16), `teacherDashboardModel.test.ts` (7) | Phân quyền và cô lập lớp chạy trên model giả có lọc thật, nên bài nộp lớp khác đưa vào để kiểm chứng bị loại |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest` ở BE; `npx tsc -b`, `npx vitest run`, `npm run build` ở FE; `npm --prefix BE run seed:teacher-demo` rồi gọi API thật.
- **Kết quả:** BE 799 đạt (2 bỏ qua là bộ test live), `tsc` BE sạch; FE 86 đạt, build đạt; 37 test mới.
- **Đối soát với DB thật:** nạp bộ dữ liệu mẫu và gọi API, kết quả khớp số tính tay: hoàn thành 31%, đạt 63%, lần thử TB 2,13, dùng gợi ý 38%, nhãn "recursion" là điểm nghẽn (71 điểm).
- **Phân quyền:** học viên nhận 403, không có token nhận 401, giảng viên mở lớp người khác nhận 403, học viên hoặc bài ngoài lớp ở màn drill-down nhận 404.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** tách công thức thành hàm thuần và đối soát bằng bộ dữ liệu có số tính tay giúp bắt lỗi công thức mà không cần DB.

**Điều chưa chắc:**
- AI chưa mở giao diện trên trình duyệt ở lượt này, chỉ kiểm bằng type-check và build.
- Tệp `.spec.ts` mới còn lỗi ESLint kiểu `any` của mock, giống các spec cũ trong repo; tệp nguồn mới sạch lỗi ESLint.
- Dữ liệu demo nằm trong MongoDB local cho đến khi dọn ở Việc 7.

---

## Việc 5: Chạy backend và frontend để kiểm thử thủ công

> "run be fe lên cho tôi test"

### Điều tôi hiểu trước khi gọi AI

Cần bật các tiến trình để tự thử Teacher Dashboard trên trình duyệt; DA Lab và AI Lab cần thêm server của Số 1.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. AI bật backend (cổng 3000), web (5173) và server của Số 1 (8000), rồi hướng dẫn thử: đăng nhập `teacher@gmail.com`, mở `/teacher/dashboard`, chọn "Lớp Demo Dashboard" và đối chiếu số liệu đúng (31%, 63%, 2,13, 38%, "recursion" là điểm nghẽn); thử phân quyền bằng `student@gmail.com` (không thấy mục Tổng quan lớp, gọi API trực tiếp nhận 403).

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: cho người thử một kịch bản có số liệu đúng sẵn giúp tự đối soát nhanh mà không cần đọc mã.

---

## Việc 6: Quản lý lớp học trên giao diện, Dashboard tính số liệu từ bài nộp thật

> "Phần hiển thị thống kê Dashboard hiện tại rất tốt. Giờ hãy nâng cấp toàn diện tính năng Quản lý lớp học (Classroom Management) trên giao diện để giảng viên chủ động tạo và quản lý lớp thật thay vì chỉ dựa vào dữ liệu seed:
>
> 1. Giao diện Quản lý lớp học (Classroom Management UI):
> - Tích hợp khu vực quản lý lớp tinh tế: Có thể đặt một tab "Quản lý lớp" cạnh "Tổng quan lớp" hoặc một modal/drawer trượt nhẹ khi bấm vào tùy chọn "Quản lý lớp" cạnh ô chọn lớp.
> - Triết lý UI: Giữ phong cách tối giản, đường nét mảnh, không lạm dụng các nút bấm sặc sỡ, hạn chế text rườm rà.
> - Các chức năng thao tác:
>   + Tạo lớp học mới: Nhập tên lớp, mô tả ngắn.
>   + Quản lý học viên trong lớp: Thêm học viên vào lớp bằng email/mã học viên hoặc danh sách chọn nhanh; cho phép xóa học viên khỏi lớp.
>   + Giao bài tập cho lớp: Danh sách tích chọn các bài tập (Python, SQL, Quiz, AI Lab...) để đưa vào danh mục bài của lớp.
>   + Chỉnh sửa thông tin lớp hoặc lưu trữ/xóa lớp.
>
> 2. Liên kết dữ liệu thời gian thực với Dashboard:
> - Dropdown chọn lớp trên Dashboard tự động load toàn bộ các lớp mà giảng viên hiện tại sở hữu từ MongoDB.
> - Khi chọn một lớp bất kỳ:
>   + Nếu lớp mới tạo chưa có học viên hoặc chưa giao bài: Hiển thị Empty State sạch sẽ, đúng ngữ cảnh ("Lớp chưa có học viên" hoặc "Chưa giao bài tập nào").
>   + Khi học viên trong lớp nộp bài thật: Dashboard tự động tổng hợp số liệu động (Completion, Pass Rate, Attempts, Hint, Kỹ năng khó nhất) dựa trên các bài nộp thực tế của học viên trong lớp đó, không phụ thuộc vào bộ seed cứng.
>
> 3. Kiểm thử & Phân quyền:
> - Giảng viên chỉ nhìn thấy, chỉnh sửa và quản lý các lớp do chính mình tạo ra.
> - Học viên không có quyền truy cập vào các API quản lý lớp hay dashboard.
> - Viết bổ sung các bài kiểm thử unit/integration cho luồng thêm/sửa/xóa lớp, thêm học viên và phân bài tập.
> - Đảm bảo typecheck sạch và tất cả các test hiện có tiếp tục pass 100%."

### Điều tôi hiểu trước khi gọi AI

Dashboard Việc 4 mới chạy được trên dữ liệu seed, nên cần quản lý lớp thật và nối Dashboard với bài nộp thật. Dashboard phải tính cả bài SQL, Insight và AI Lab chứ không chỉ bài code, nhưng hai nhóm lab chỉ lưu bản ghi gộp theo (học viên, bài).

### Context, tài liệu, file, constraint đã cung cấp

AI đọc lại `teacher-analytics.service.ts`, các schema `DaLabSubmission` và `AiLabSubmission`, `ExerciseService`, và trang `TeacherDashboardPage.tsx` vừa viết.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Bản ghi gộp của lab:** DA Lab và AI Lab chỉ lưu một bản ghi cho mỗi (học viên, bài) kèm số lần nộp, nên AI dựng lại số lượt thử từ số lần nộp (tối đa 200 lượt) để công thức cũ vẫn dùng được.
- **Quy tắc đạt:** SQL đạt khi đủ điểm tối đa; Insight đạt khi đã chấm xong và từ 60% điểm; AI Lab đạt khi trạng thái PASSED.
- **Quiz không giao được cho lớp** vì trắc nghiệm của hệ thống tổ chức theo chủ đề chứ không phải bài tập riêng; AI báo rõ thay vì làm giả.
- **Model giả có lọc thật** (`fake-model.ts`) để test phân quyền kiểm tra hành vi thật chứ không chỉ kiểm tra lời gọi.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | `teacher-analytics.service.ts`, `analytics-core.ts` (`expandAggregate`), `teacher-analytics.controller.ts` | Tạo/sửa/lưu trữ/xóa lớp, thêm/gỡ học viên (email hoặc mã Cxxxx, báo người không tìm thấy), giao bài ghi đè danh sách, danh mục bài |
| Frontend | `TeacherDashboardPage.tsx`, `ClassAssignPanel.tsx`, `classManagementModel.ts`, `teacherAnalyticsApi.ts` | Hai tab "Tổng quan lớp" và "Quản lý lớp"; danh sách tích chọn gom theo loại, có ô tìm, "Lưu danh mục" và "Hoàn tác"; Empty State kèm link nhảy sang quản lý lớp |
| Test | `classroom-management.spec.ts` (31), `fake-model.ts`, `classManagementModel.test.ts` (6) | Bao gồm số liệu động, quy tắc đạt của bản ghi gộp, danh sách route được bảo vệ |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest`, `npm run build` ở BE; `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; kịch bản chạy trên stack thật qua HTTP.
- **Kết quả:** BE 831 đạt (2 bỏ qua), FE 92 đạt, typecheck và build sạch.
- **Luồng đầy đủ trên stack thật:** tạo lớp, thêm `student@gmail.com`, giao hai bài SQL, học viên nộp một bài đúng và một bài sai; Dashboard hiện hoàn thành 50%, tỷ lệ đạt 50%.
- **Phân quyền:** giảng viên khác nhận 403 ở cả 6 thao tác thử; học viên nhận 403 ở cả 4 thao tác thử; lớp lưu trữ biến khỏi danh sách mặc định; lớp đã xóa trả 404.
- Đã xoá lớp thử, tài khoản giảng viên tạm và 2 bài nộp thử của `student@gmail.com`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** nguồn dữ liệu gộp (lab) cần quy tắc "đạt" riêng và phải ghi rõ giới hạn; model giả có lọc thật bắt được lỗi cô lập mà mock lời gọi bỏ sót.

**Điều chưa chắc:**
- Giao diện chưa được mở trên trình duyệt ở lượt này, chỉ kiểm bằng type-check, build và gọi API thật.
- Lớp demo cũ vẫn còn trong MongoDB local cho đến Việc 7.

---

## Việc 7: Chuyển quản trị lớp sang Admin, import học viên bằng Excel/CSV, dọn dữ liệu demo

> "Tái cấu trúc lại phân quyền quản lý lớp học và bổ sung tính năng theo đúng nghiệp vụ thực tế, đảm bảo an toàn bảo mật và không phá vỡ các chức năng hiện tại:
>
> 1. Điều chỉnh lại Phân quyền & Nghiệp vụ Quản trị (Admin vs Teacher):
> - Phân định rõ trách nhiệm giữa 2 vai trò:
>   + ADMIN: Là vai trò duy nhất có quyền Tạo lớp học, Gán giảng viên phụ trách (teacher_id), Cập nhật thông tin lớp, Lưu trữ/Xóa lớp, và Thêm/Gỡ học viên vào lớp.
>   + TEACHER: Chỉ được phép truy cập Teacher Dashboard để xem số liệu phân tích của các lớp mà mình được Admin gán phụ trách; được quyền Giao danh mục bài tập cho lớp đó. Giảng viên TUYỆT ĐỐI không có quyền tự tạo lớp, tự gán giảng viên khác, hay tự xóa lớp.
> - Xây dựng giao diện Quản lý lớp học cho Admin:
>   + Chuyển tính năng quản trị lớp học sang trang quản trị của Admin (ví dụ: /admin/classes hoặc tab quản trị trong Admin Studio/Dashboard).
>   + Giữ cho Teacher Dashboard (/teacher/dashboard) sự tập trung: Chỉ hiển thị danh sách các lớp được phân công, xem thống kê chỉ số học tập (Tổng quan lớp) và giao bài tập cho lớp.
>
> 2. Thêm tính năng Import nhanh học viên bằng File Excel/CSV (Admin):
> - Cho phép Admin tải lên file Excel (.xlsx, .xls) hoặc CSV chứa danh sách email học viên để thêm hàng loạt vào lớp.
> - Xử lý nghiệp vụ & Bảo mật đầu vào (Security & Validation):
>   + Kiểm tra chặt chẽ định dạng file và giới hạn kích thước file upload (tối đa 2MB, tối đa 500 dòng/lần upload).
>   + Làm sạch dữ liệu (sanitize), xác thực cú pháp email.
>   + Đối soát với cơ sở dữ liệu Users: Chỉ tự động thêm những email đã tồn tại trong hệ thống với vai trò học viên (student).
>   + Báo cáo kết quả import minh bạch: Hiển thị rõ số lượng thêm thành công, danh sách các email không tồn tại trong hệ thống, và danh sách các email đã có sẵn trong lớp (bỏ qua không trùng lặp).
>
> 3. Dọn dẹp dữ liệu (Data Clean-up):
> - Viết kịch bản/lệnh dọn sạch hoàn toàn các dữ liệu demo hardcode ("Lớp Demo Dashboard", các tài khoản demo.dashboard.*) khỏi MongoDB, đảm bảo hệ thống chỉ chạy trên các lớp và dữ liệu thực tế do Admin tạo.
> - Cung cấp tùy chọn cờ (flag) dọn dẹp dữ liệu demo mà không ảnh hưởng đến tài khoản và bài nộp thật.
>
> 4. Bảo toàn tính toàn vẹn hệ thống & Kiểm thử:
> - Đảm bảo các route API cũ của Teacher Dashboard không bị gãy khi đổi cấu trúc phân quyền (chỉ cập nhật điều kiện query: Teacher chỉ query lớp có `teacherId === req.user.id`).
> - Viết bổ sung kiểm thử tự động cho luồng Admin tạo lớp / gán giảng viên, upload file Excel/CSV (bao gồm ca file lỗi, file sai format, email không tồn tại), và kiểm thử bảo mật chặn Teacher tự tạo lớp.
> - Giữ phong cách UI tối giản, đường nét thanh mảnh, cảnh báo rõ ràng, không lạm dụng nút bấm to bản. Chạy kiểm tra type-check và toàn bộ bộ test đảm bảo xanh 100%."

### Điều tôi hiểu trước khi gọi AI

Quyền tạo lớp phải chuyển hẳn sang Admin và service phải tự kiểm tra vai trò, không chỉ dựa vào route. Import file là bề mặt tấn công nên phải kiểm tra chữ ký nhị phân, MIME, kích thước, số dòng và không tạo tài khoản mới. Dọn dữ liệu demo phải chỉ động vào dữ liệu có tiền tố demo, không đụng dữ liệu thật.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc lại toàn bộ `teacher-analytics.service.ts`, controller, `RolesGuard`, trang `TeacherDashboardPage.tsx`, `ClassAssignPanel.tsx` và dữ liệu `seed-teacher-demo.ts` để biết chính xác những gì cần dọn.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Phân quyền ở hai tầng:** route `/api/admin/classes` chỉ cho ADMIN và các hàm service tự gọi `assertAdmin`, nên route nào gọi vào mà không phải Admin vẫn bị chặn; route cũ `/api/teacher/classes` giữ nguyên, chỉ lọc `teacherId === user.sub`, các route tạo/sửa/xóa/học viên bị gỡ khỏi phía giảng viên.
- **Đổi giảng viên phụ trách:** quyền chuyển ngay, giảng viên cũ mất quyền, giảng viên mới có quyền.
- **Import:** nhận `.xlsx`, `.xls`, `.csv`, tối đa 2MB và 500 dòng, chữ ký nhị phân phải khớp phần mở rộng, CSV phải là UTF-8 không có byte NUL, chỉ đọc sheet đầu, không tính công thức, chỉ lấy một cột email; chỉ email đã có với vai trò học viên mới được thêm.
- **Thư viện:** dùng SheetJS 0.20.3 từ cdn.sheetjs.com thay vì bản npm 0.18.5 vì bản npm có lỗ hổng đã biết.
- **Dọn dữ liệu:** lệnh `cleanup:teacher-demo` có `--dry-run`, chỉ xoá "Lớp Demo Dashboard", tài khoản `demo.dashboard.*`, bài `demo-dash-*` cùng bài nộp và gợi ý gắn với chúng; học viên demo lỡ nằm trong lớp thật chỉ bị gỡ khỏi lớp.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | `teacher-analytics/admin-classes.controller.ts`, `roster-import.ts`, `demo-cleanup.ts`, `teacher-analytics.service.ts`, `teacher-analytics.controller.ts`, `teacher-analytics.module.ts`; mới: `data/cleanup-teacher-demo.ts` | `POST /admin/classes/:id/students/import`; báo cáo gồm đã thêm, đã có trong lớp, không tồn tại, sai cú pháp, trùng trong file, tổng số dòng |
| Frontend | mới: `pages/AdminClassesPage.tsx`, `components/AdminClassPanel.tsx`, `axios/adminClassesApi.ts`; sửa: `TeacherDashboardPage.tsx`, `ClassAssignPanel.tsx`, `Header.tsx`, `App.tsx` | Mục "Quản lý lớp" chỉ Admin thấy; Teacher Dashboard chỉ còn hai tab "Tổng quan lớp" và "Giao bài"; giảng viên chưa được gán lớp thấy một câu hướng dẫn |
| Test | `class-admin.spec.ts`, `roster-import.spec.ts`, `demo-cleanup.spec.ts`, các ca phân quyền | Admin tạo lớp và gán giảng viên, Teacher tự tạo lớp bị chặn, file lỗi, file sai định dạng, email không tồn tại |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest`, `npm run build` ở BE; `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; kịch bản HTTP trên stack thật.
- **Kết quả:** BE 860 đạt (2 bỏ qua), FE 94 đạt, typecheck và build sạch.
- **Trên stack thật:** giảng viên và học viên đều nhận 403 khi tạo lớp, xem danh sách Admin, gọi catalog học viên hoặc import; giảng viên cũng bị 403 khi sửa hay xóa lớp; Admin tạo lớp và gán giảng viên, giảng viên thấy lớp ngay; CSV, xlsx và xls (tạo thật bằng thư viện) đều đọc được, import lại thì học viên chuyển sang "đã có trong lớp"; đuôi `.exe`, `.xlsx` giả, thiếu cột email, hơn 500 dòng đều trả 400, file quá 2MB trả 413.
- **Dọn dữ liệu:** chạy trên MongoDB local xoá 1 lớp, 5 tài khoản, 5 bài, 23 bài nộp, 5 lượt gợi ý; chạy lại báo 0.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** kiểm tra vai trò trong service (không chỉ ở route) giữ an toàn khi có route mới gọi vào; thư viện đọc Excel nên chọn bản không có lỗ hổng đã biết dù phải cài từ nguồn ngoài npm.

**Điều chưa chắc:**
- Máy mới cần mạng để cài SheetJS từ cdn.sheetjs.com khi `npm install`.
- Giao diện chưa được mở trên trình duyệt ở lượt này.
- Sau khi dọn, MongoDB local chưa có tài khoản Admin; việc này được xử lý ở Việc 8.

---

## Việc 8: Tách Admin Portal riêng và thêm tài khoản Admin mẫu

> "Tách riêng hoàn toàn bố cục Admin (Admin Portal) và bổ sung tài khoản Admin mẫu vào seed để tôi đăng nhập test ngay:
>
> 1. Thiết kế Bố cục Admin riêng biệt (Admin Layout):
> - Không dùng chung Header/Navbar của Student hay Teacher Studio.
> - Thiết kế giao diện Admin Portal chuyên nghiệp:
>   + Thanh điều hướng bên trái (Sidebar) cố định, gồm: Logo hệ thống kèm nhãn "Admin Portal", danh mục quản trị (Tổng quan Admin, Quản lý lớp học, Quản lý người dùng...), và thông tin tài khoản Admin ở góc dưới cùng.
>   + Không hiển thị các liên kết học tập hay thi đấu của học viên/giảng viên (Khóa học, Trắc nghiệm, Playground, Contest...).
>   + Khu vực nội dung bên phải hiển thị linh hoạt các trang quản trị (trước mắt là trang Quản lý lớp học /admin/classes và trang Tổng quan Admin).
>   + Phong cách tối giản, đường nét thanh mảnh, chuyên nghiệp, hỗ trợ responsive cơ bản.
>
> 2. Bổ sung tài khoản Admin mẫu vào dữ liệu khởi tạo (Seed):
> - Thêm sẵn một tài khoản Admin mẫu vào kịch bản seed:
>   + Email: admin@gmail.com
>   + Mật khẩu: (dùng chung chuẩn mật khẩu mẫu hiện có trong hệ thống, ví dụ: 123456 hoặc Password123!)
>   + Vai trò: ADMIN
> - Đảm bảo tài khoản này được tạo sẵn khi chạy seed hoặc khởi động hệ thống để tôi đăng nhập thử nghiệm được ngay mà không cần dùng lệnh thủ công nào khác.
>
> 3. Điều hướng và bảo vệ tuyến đường (Route Guard):
> - Khi đăng nhập bằng tài khoản ADMIN: Tự động chuyển hướng vào thẳng Admin Portal (/admin/dashboard hoặc /admin/classes).
> - Chặn học viên và giảng viên truy cập vào Admin Portal; nếu cố tình vào thì chuyển hướng về trang chủ hoặc báo lỗi 403.
>
> Giữ nguyên toàn bộ logic backend và các bài test đã chạy đạt, chỉ tái cấu trúc giao diện layout phía frontend và thêm seed tài khoản. Chạy kiểm tra type-check và build đảm bảo không phát sinh lỗi."

### Điều tôi hiểu trước khi gọi AI

Khi database đã có dữ liệu, `npm run setup` không chạy lại seed, nên chỉ thêm tài khoản vào seed là chưa đủ để đăng nhập thử ngay. Khung Admin phải là một layout riêng, không chung `Header` hay `Footer` với học viên và giảng viên.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `App.tsx`, `Header.tsx`, `initial-data.ts`, `auth.service.ts`, `auth.module.ts` và `scripts/setup.js`.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Thêm `DefaultAdminService`:** mỗi lần backend khởi động, nó tạo `admin@gmail.com` nếu chưa có; không bao giờ đổi mật khẩu hay vai trò của tài khoản đã tồn tại; lỗi CSDL chỉ ghi cảnh báo, không làm hỏng khởi động. AI làm thêm bước này vì database có dữ liệu sẵn nên seed không chạy lại.
- **Mật khẩu mẫu công khai nên tắt khi production:** tắt khi `NODE_ENV=production`; `SEED_DEFAULT_ADMIN=0` tắt hẳn, `=1` ép bật.
- **Khi đăng nhập bằng ADMIN toàn bộ ứng dụng chỉ là Admin Portal:** mọi đường dẫn khác đều chuyển về `/admin/dashboard`; giảng viên hay học viên gõ `/admin/...` bị chuyển về trang chủ của vai trò mình, khách về `/login`; BE vẫn chặn 403 ở mọi API `/admin/*`.
- **Mục "Quản lý người dùng" tạm hiện mờ với nhãn "Sắp có"** vì chưa có trang; làm ở Việc 9.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | mới: `modules-api/auth/default-admin.service.ts`; sửa: `auth.module.ts`, `data/initial-data.ts` | Không đổi logic backend nào khác |
| Frontend | mới: `components/AdminLayout.tsx`, `pages/AdminDashboardPage.tsx`, `pages/adminDashboardModel.ts`; sửa: `App.tsx`, `Header.tsx`, `pages/LoginPage.tsx` | Sidebar cố định, dưới 768px thành ngăn kéo (đóng bằng Esc, bấm nền, nút X); "Tổng quan Admin" có số lớp, giảng viên phụ trách, chỗ học viên và danh sách "Cần chú ý" |
| Tài liệu | `README.md`, `scripts/setup.js` | Thông báo cuối của `npm run setup` ghi thêm tài khoản Admin |
| Test | `default-admin.service.spec.ts` (4), `adminDashboardModel.test.ts` | `portalHome` không bao giờ trả `/admin` cho Teacher, Student hay khách |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest`, `npm run build` ở BE; `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; gọi API đăng nhập thật.
- **Kết quả:** BE 864 đạt (2 bỏ qua), FE 98 đạt, 14 test script đạt, typecheck và build sạch; backend đang chạy tự tạo tài khoản khi nạp lại và đăng nhập `admin@gmail.com` qua API thành công.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** "có trong seed" không đồng nghĩa với "đăng nhập được ngay" khi DB đã có dữ liệu; tạo tài khoản mẫu lúc khởi động (idempotent) giải quyết đúng bài toán.

**Điều chưa chắc:**
- Giao diện chưa được mở trên trình duyệt ở lượt này, chỉ kiểm bằng type-check, build, test và gọi API.
- Mật khẩu mẫu `123456` là công khai nên không được dùng ngoài môi trường dev.

---

## Việc 9: Hoàn thiện Admin Portal: Topbar, sidebar, quản lý người dùng, drawer hồ sơ, giao diện lớp

> "Tái cấu trúc và hoàn thiện toàn bộ Admin Portal theo tiêu chuẩn UI chuyên nghiệp, tối giản và logic dành cho người vận hành không chuyên kỹ thuật:
>
> 1. Bố cục Topbar & Sidebar (Header-first & Collapsible Sidebar):
> - Di chuyển thông tin Admin lên góc trên cùng bên phải (Top-Right):
>   + Avatar, tên "Nguyễn Kim Thượng", email, nhãn vai trò "Quản trị viên".
>   + Đặt cụm nút chuyển đổi sáng/tối (Dark/Light mode) và nút Đăng xuất tại góc trên này (dropdown menu hoặc inline gọn gàng).
> - Nâng cấp Sidebar bên trái:
>   + Cho phép thu gọn linh hoạt: Có nút toggle thu gọn (collapse/expand) sang dạng icon-only và hỗ trợ kéo tay chỉnh độ rộng (resizable/draggable sidebar border).
>   + Trạng thái thu gọn vẫn hiển thị tooltip tên mục khi hover.
>   + Danh mục điều hướng:
>     1. Tổng quan hệ thống (/admin/dashboard)
>     2. Quản lý người dùng (/admin/users)
>     3. Quản lý lớp học (/admin/classes)
>
> 2. Hiện thực hóa màn hình "Quản lý người dùng" (/admin/users):
> - Xóa bỏ nhãn "Sắp có", làm trang hoàn chỉnh phục vụ vận hành:
>   + Bảng danh sách người dùng hiển thị dạng dòng kẻ ngang thanh mảnh (hairline grid): Tên học viên, Mã số (Cxxxx), Email, Vai trò (STUDENT / TEACHER / ADMIN), Trạng thái, Ngày tạo.
>   + Bộ lọc nhanh: Lọc theo vai trò (Tất cả / Học viên / Giảng viên), ô tìm kiếm theo tên hoặc email.
>   + Hành động: Tạo tài khoản mới (modal nhẹ), đổi vai trò, hoặc khóa/mở khóa tài khoản.
>
> 3. Nâng cấp trải nghiệm xem chi tiết Học viên (Student Profile Drawer):
> - Bấm vào tên/dòng của bất kỳ học viên nào (tại bảng Người dùng hoặc trong danh sách lớp): Mở Slide-over Panel (Drawer trượt từ cạnh phải) hiển thị hồ sơ chi tiết tương tự trang cá nhân của học viên:
>   + Avatar, thông tin cá nhân, mã số, email.
>   + Lớp đang tham gia, tiến độ học tập, tổng số bài đã nộp, tỷ lệ đạt.
>   + Lịch sử nộp bài gần nhất và biểu đồ đóng góp/hoạt động.
>
> 4. Đại tu UI trang "Quản lý lớp học" (/admin/classes):
> - Thay thế bố cục đơn điệu hiện tại bằng giao diện bảng & thẻ phân khu rõ ràng:
>   + Cột trái (hoặc bảng chọn): Danh sách các lớp học với các chỉ số nhanh (Tên lớp, Giảng viên, Sĩ số).
>   + Khu vực chi tiết lớp: Chia block có viền mảnh (Border Hairline):
>     * Khối 1: Thông tin cơ bản (Tên lớp, Slug, Dropdown chọn Giảng viên phụ trách) + Nút lưu/cập nhật trang nhã.
>     * Khối 2: Danh sách học viên trong lớp dạng bảng gọn gàng kèm nút "Import từ file" và ô thêm nhanh.
>     * Khối 3: Trạng thái lớp (Đang mở / Lưu trữ / Xóa).
>
> 5. Nguyên tắc thiết kế UI (Typography & Grid):
> - Không dùng button to bản lòe loẹt; sử dụng style hairline border, viền mỏng 1px màu xám dịu (border-neutral-200 dark:border-neutral-800).
> - Text phân cấp rõ ràng (Label chữ nhỏ uppercase mờ, Value chữ đậm nét vừa phải), giống trang cá nhân đã làm.
> - Đảm bảo toàn bộ test BE/FE chạy xanh, type-check sạch và build không phát sinh lỗi."

### Điều tôi hiểu trước khi gọi AI

Phần "Quản lý người dùng" cần API riêng cho Admin và các quy tắc an toàn (không tự khóa mình, không hạ quyền Admin cuối cùng). Khóa tài khoản phải có hiệu lực ngay chứ không đợi token hết hạn, nên xác thực phải đối chiếu với DB. Drawer hồ sơ nên tái dùng dữ liệu của trang cá nhân nhưng không hiển thị số giả.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `AdminLayout.tsx`, `AdminClassPanel.tsx`, `ProfilePage.tsx`, `ActivityHeatmap.tsx`, `JwtStrategy`, `auth.service.ts`, `user.schema.ts`, các schema nộp bài và `learner-activity` để dựng hồ sơ.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Khóa có hiệu lực ngay:** `JwtStrategy` đối chiếu token với CSDL ở mỗi request, nên tài khoản bị khóa hoặc đã xóa bị 401 ngay; đổi lại mỗi request có thêm một lượt đọc DB nhỏ (chỉ lấy `role` và `status`). Đăng nhập tài khoản bị khóa báo 403 chỉ sau khi mật khẩu đúng nên không lộ email nào tồn tại.
- **Quy tắc an toàn:** không tự đổi vai trò hay tự khóa mình, không khóa hay hạ quyền Admin hoạt động cuối cùng, không đổi vai trò giảng viên còn phụ trách lớp.
- **Sidebar:** thu gọn thành chế độ chỉ icon có tooltip, kéo mép phải để chỉnh độ rộng (200 đến 360 px), phím ←/→ cũng chỉnh được, nhớ trạng thái giữa các lần mở.
- **Drawer hồ sơ tắt dữ liệu mẫu của biểu đồ** để không hiển thị số giả cho người khác.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | mới: `modules-api/admin-users/` (`admin-users.service.ts`, `admin-users.controller.ts`, `admin-users.module.ts`, spec); sửa: `common/auth/jwt.strategy.ts`, `common-auth.module.ts`, `auth.service.ts`, `user.schema.ts` | `/api/admin/users`: danh sách, tạo, đổi vai trò, khóa/mở, hồ sơ; chỉ ADMIN |
| Frontend | mới: `pages/AdminUsersPage.tsx`, `components/StudentProfileDrawer.tsx`, `components/adminStyles.ts`, `pages/adminModel.ts`, `axios/adminUsersApi.ts`; sửa: `AdminLayout.tsx`, `AdminClassPanel.tsx`, `AdminClassesPage.tsx` | Topbar có avatar, tên, email, nhãn "Quản trị viên", menu sáng/tối và Đăng xuất; bảng hairline có lọc, tìm, phân trang 20 dòng; lớp học bố cục bảng bên trái và 3 khối viền mảnh bên phải |
| Test | `admin-users.service.spec.ts` (27 test), `adminModel.test.ts` (8 test) | Danh sách, lọc, tìm, phân trang, tạo, đổi vai trò, khóa, hồ sơ, `JwtStrategy`, đăng nhập khi bị khóa, RBAC |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest`, `nest build` ở BE; `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; kịch bản HTTP trên stack thật.
- **Kết quả:** BE 891 đạt (2 bỏ qua), FE 106 đạt, typecheck và build sạch.
- **Trên stack thật** (Admin đăng nhập, tạo/khóa/đổi vai trò một tài khoản thử, đã xóa sau khi test): token cũ và đăng nhập bị chặn ngay khi khóa, mở khóa thì đăng nhập lại được; giảng viên và học viên đều 403 ở `/admin/users`; email trùng trả 409; token cũ lên quyền Admin ngay sau khi đổi vai trò; tự khóa hoặc tự đổi vai trò mình đều 403.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** đối chiếu DB ở mỗi request đánh đổi một lượt đọc nhỏ để có khóa và đổi quyền tức thì; nên ghi rõ đánh đổi này ngay khi thiết kế.

**Điều chưa chắc:** giao diện chưa được mở trên trình duyệt ở lượt này; kiểm bằng type-check, build, test và gọi API thật.

---

## Việc 10: Chống leo thang đặc quyền, thu hồi quyền giảng viên, sidebar, dropdown tối, cập nhật hồ sơ

> "Thực hiện các tinh chỉnh về bảo mật phân quyền và giao diện theo các điểm sau:
>
> 1. Thắt chặt phân quyền Quản trị viên (Role Escalation Prevention):
> - Quản trị viên TUYỆT ĐỐI KHÔNG ĐƯỢC gán quyền Quản trị viên (ADMIN) cho bất kỳ tài khoản nào khác (ngăn chặn leo thang đặc quyền).
> - Phạm vi chuyển đổi vai trò chỉ gói gọn giữa: STUDENT <-> TEACHER.
> - Bổ sung hành động "Thu hồi quyền giảng viên":
>   + Khi thu hồi quyền của Giảng viên: hạ vai trò về STUDENT hoặc chuyển trạng thái tài khoản sang dạng bị vô hiệu hóa/khóa hoàn toàn, hủy phiên đăng nhập ngay lập tức để tài khoản đó không thể tiếp tục đăng nhập hay truy cập hệ thống.
>   + Kiểm tra an toàn: Nếu giảng viên đó đang phụ trách lớp học nào, bắt buộc cảnh báo yêu cầu chuyển giao lớp cho giảng viên khác trước khi cho phép thu hồi quyền.
>
> 2. Tinh chỉnh Sidebar và biểu tượng Thu gọn:
> - Xóa bỏ hoàn toàn chữ "Thu gọn" ở Sidebar.
> - Thay bằng một biểu tượng thu gọn tinh tế (icon collapse/chevron) đặt gọn ở góc/mép sidebar.
> - Khi bấm thu gọn: Sidebar co lại gọn gàng, chỉ hiển thị duy nhất các Icon của từng mục (icon-only mode), rê chuột vào icon nào thì hiển thị Tooltip tên mục đó.
>
> 3. Khắc phục lỗi hiển thị Dark Mode ở Dropdown phân quyền:
> - Dropdown chọn vai trò (hoặc menu phân quyền) đang bị lỗi màu ở Dark Mode (chữ/nền bị trùng màu tối không nhìn thấy nội dung).
> - Sửa lại CSS: đặt màu nền nổi bật (bg-neutral-800 hoặc bg-neutral-900), viền rõ ràng (border-neutral-700), màu chữ tương phản cao (text-neutral-100) và hiệu ứng hover/focus rõ nét khi đang ở Dark Mode.
>
> 4. Bổ sung tính năng Cập nhật thông tin trong Cài đặt Trang cá nhân:
> - Cho phép người dùng chỉnh sửa thông tin cá nhân: Họ và tên, số điện thoại, ảnh đại diện (avatar), giới thiệu bản thân...
> - KHÓA CỐ ĐỊNH trường Email: Người dùng không được phép chỉnh sửa email cá nhân để đảm bảo tính toàn vẹn danh tính và bảo mật tài khoản.
>
> Đảm bảo kiểm tra lại toàn bộ bài kiểm thử tự động (cập nhật test case chặn gán ADMIN và luồng thu hồi quyền), giữ type-check sạch hoàn toàn và bản build không phát sinh lỗi."

### Điều tôi hiểu trước khi gọi AI

Admin không được tạo thêm Admin nên quyền Admin chỉ có từ seed hoặc khởi động. "Thu hồi" phải hủy phiên ngay chứ không chỉ đổi vai trò trong DB, vì token cũ còn hạn sẽ vẫn dùng được nếu chỉ kiểm chữ ký. Email là danh tính nên API phải từ chối chứ không chỉ khóa ô nhập trên giao diện.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc lại `admin-users.service.ts`, `JwtStrategy`, `auth.service.ts` và `auth.controller.ts`, `AdminUsersPage.tsx`, `AdminLayout.tsx`, `ProfilePage.tsx`, `user.schema.ts`.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Chặn leo thang:** Admin không tạo được tài khoản ADMIN, không nâng quyền ADMIN cho ai và không đổi vai trò của Admin khác (đều 403); chuyển đổi chỉ còn giữa Học viên và Giảng viên; vai trò Admin trên giao diện chỉ là chữ.
- **Thu hồi quyền:** `POST /admin/users/:id/revoke-teacher` với hai chế độ (hạ về học viên và cấp mã Cxxxx nếu chưa có, hoặc khóa tài khoản).
- **Hủy phiên ngay:** ghi mốc `sessionsRevokedAt` và `JwtStrategy` từ chối mọi token cấp trước mốc đó.
- **Chặn khi còn lớp:** giảng viên còn phụ trách lớp (kể cả lớp lưu trữ) thì API trả 409 kèm danh sách lớp, hộp thoại hiện cảnh báo và link tới Quản lý lớp học; đổi vai trò Giảng viên → Học viên bằng `PUT /role` cũng đi qua cùng luồng; không ai tự thu hồi được chính mình.
- **Lỗi dropdown tối:** danh sách `<option>` do trình duyệt vẽ nên lấy chữ sáng trên nền trắng; AI thêm `adminStyles.ts` với `control` và `selectControl` (nền `bg-neutral-900`, viền `border-neutral-700`, chữ `text-neutral-100`, `color-scheme: dark`, màu riêng cho từng `<option>`).
- **Hồ sơ:** `PUT /auth/profile` cho đổi họ tên, số điện thoại (không bắt buộc, có kiểm cú pháp) và giới thiệu (tối đa 300 ký tự); email gửi lên khác email hiện tại thì bị từ chối; trường `role` bị bỏ qua.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | `admin-users.service.ts`, `admin-users.controller.ts`, `common/auth/jwt.strategy.ts`, `auth.service.ts`, `auth.controller.ts`, `user.schema.ts`, mới: `auth/profile-input.ts` | `ASSIGNABLE_ROLES` chỉ gồm Học viên và Giảng viên; mốc `sessionsRevokedAt` |
| Frontend | `AdminUsersPage.tsx`, `AdminLayout.tsx`, `ProfilePage.tsx`, `StudentProfileDrawer.tsx`, `adminStyles.ts`, mới: `pages/profileForm.ts`, `authApi.ts`, `types/auth.ts` | Nút tròn nhỏ có chevron ở mép sidebar thay chữ "Thu gọn"; hộp xác nhận thu hồi; Admin vào trang cá nhân qua menu tài khoản (`/admin/profile`) |
| Test | `role-revocation.spec.ts` (21 test), `profileForm.test.ts` (4 test), 1 test `ASSIGNABLE_ROLES` | Các ca cũ về tạo Admin và hạ quyền Admin được cập nhật |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest`, `nest build` ở BE; `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; kịch bản HTTP trên stack thật.
- **Kết quả:** BE 912 đạt (2 bỏ qua), FE 112 đạt, typecheck và build sạch.
- **Trên stack thật:** token cũ của giảng viên bị 401 ngay sau thu hồi; đăng nhập lại sau khi hạ quyền vào được với vai trò học viên; tài khoản bị khóa đăng nhập trả 403. Đã dọn các tài khoản và lớp thử; hồ sơ của `student@gmail.com` bị đặt rồi xóa lại số điện thoại và giới thiệu trong lúc thử.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** quyền phải được chặn ở API chứ không chỉ ẩn trên giao diện; lỗi màu dropdown ở chế độ tối nằm ở `<option>` do trình duyệt vẽ nên phải đặt `color-scheme` và màu cho từng `<option>`.

**Điều chưa chắc:** giao diện chưa được mở trên trình duyệt ở lượt này.

---

## Việc 11: Cân nhắc lấy game từ nihicode.com

> "https://nihicode.com/?fbclid=IwY2xjawUxmHpleHRuA2FlbQIxMABwZG9mBWJyaWQRMW1rSVM4UjRmZmdGeUR1dUpzcnRjBmFwcF9pZBAyMjIwMzkxNzg4MjAwODkyAAEermW6yZ4OVCc9WeH8A5Bk1jQ_u6gXd1LXtFLKU3b576gGZLsje4JFnrredkE_aem_Ty4VDKQPoGVqMiPWp5dD9g lấy game này làm thành của mình đc k"

> "hiện tại dự án mình có 1 game cơ chế tương tự r mà ui ko có âm thanh thôi, nên tôi mới muốn lấy"

### Điều tôi hiểu trước khi gọi AI

Tôi muốn dùng một game có sẵn trên web nhưng chưa rõ vấn đề bản quyền. Cái tôi thực sự thiếu là âm thanh và giao diện của game Block Puzzle hiện có, không nhất thiết phải lấy game của người khác.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. AI không mở trang đó nên nói rõ chưa biết giấy phép; khuyên không sao chép nguyên rồi nhận là của mình vì mã nguồn, hình ảnh, âm thanh và giao diện mặc định thuộc về tác giả, còn cách chơi (luật, ý tưởng) thì không được bảo hộ. AI đưa ba hướng hợp lệ: xin phép hoặc tìm giấy phép, viết lại từ đầu, hoặc chỉ lấy cảm hứng. Sau câu trả lời thứ hai của tôi, AI đề xuất làm âm thanh bằng Web Audio API (không dùng file âm thanh, không dính bản quyền) và hỏi lại tôi muốn chỉ làm âm thanh hay cả giao diện.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** nêu rõ nhu cầu thật (thiếu âm thanh) giúp AI chuyển từ "lấy game của người khác" sang "bổ sung tính năng cho game của mình", an toàn hơn về bản quyền.

**Điều chưa chắc:** AI chưa mở nihicode.com nên chưa biết giấy phép của họ; hướng này sau đó được thay bằng Việc 12.

---

## Việc 12: Thêm Mê Cung Blockly (Maze của Blockly Games) vào Block Puzzle

> "https://github.com/blockly-games/blockly-games add thêm game này vào block puzzle cho tôi, open src nên thoải mái đi"

### Điều tôi hiểu trước khi gọi AI

Blockly Games là mã nguồn mở nên có thể dùng nếu giữ đúng giấy phép. Game cần có âm thanh (tiếng thắng, thua gốc) và phải tích hợp vào trang Block Puzzle hiện có, lưu tiến độ theo tài khoản.

### Context, tài liệu, file, constraint đã cung cấp

AI kiểm tra giấy phép của kho (Apache-2.0), tải về mã nguồn và tài nguyên của game Maze, đọc `BlockPuzzlePage.tsx`, `blockPuzzleApi.ts` và schema tiến độ Block Puzzle để tận dụng API sẵn có.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Giấy phép:** Apache-2.0 nên dùng và sửa được, miễn giữ thông báo bản quyền và ghi rõ nguồn: kèm bản giấy phép và `NOTICE.txt`, ghi công ở README; không lấy hai skin astro và panda vì ảnh nền là ảnh của bên thứ ba.
- **Chuyển sang TypeScript/React:** bỏ Closure Library và JS-Interpreter, dùng thư viện `blockly` trên npm; mã do người chơi ghép được chạy trong `new Function` với bộ API cố định, che các API trình duyệt (`window`, `fetch`, `localStorage`, `Function`...) và giới hạn số bước để chống vòng lặp vô hạn.
- **Tải lười:** phần Blockly nặng khoảng 830 KB chỉ tải khi mở game.
- **Tiến độ:** dùng API Block Puzzle có sẵn (`markCompleted` với slug `blockly-maze-level-N`), nên Backend không phải sửa; hoàn thành màn trước mới mở màn sau.
- **Âm thanh:** tiếng thắng và thua là tệp gốc; tiếng bước đi, quay và nhìn đường là âm ngắn tự tạo bằng Web Audio; có nút bật/tắt nhớ lựa chọn.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Game | `FE/src/games/blocklyMaze/`: `mazeEngine.ts`, `mazeLevels.ts`, `mazeBlocks.ts`, `mazeAnimation.ts`, `mazeSound.ts`, `BlocklyMazeGame.tsx` | 10 màn; bộ khối mở dần (vòng lặp từ màn 3, "nếu" từ màn 6, "nếu... nếu không" từ màn 9) |
| Tài nguyên | `FE/public/games/blockly-maze/`: `pegman.png`, `tiles_pegman.png`, `marker.png`, `win.mp3`, `fail_pegman.mp3`, `NOTICE.txt`, bản giấy phép | Tệp gốc từ kho Blockly Games |
| Tích hợp | `BlockPuzzlePage.tsx`, `package.json` (`blockly`), `README.md` | Thẻ "Mê Cung Blockly" ở màn chọn trò chơi; mục "Ghi công mã nguồn mở" ở README |
| Test | `maze.test.ts` (28 test) | Mọi màn có đường tới đích; giải được cả 5 màn 6 đến 10 bằng quy tắc bám tường trái; vòng lặp vô hạn, va tường, mã bị che API, kế hoạch hoạt ảnh |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; script `smoke.mjs` điều khiển Microsoft Edge không đầu (puppeteer-core).
- **Kết quả:** FE 140 đạt (từ 112), typecheck và build sạch.
- **Trình duyệt thật:** đăng nhập học viên tạm, mở game, kéo thêm khối "tiến lên", bấm Chạy; nhân vật tới cờ, hiện "Tuyệt vời! Nhân vật đã tới đích", màn 2 mở khóa và tiến độ lưu lên server; chế độ sáng và tối đều đúng, không có lỗi console. Đã xóa tài khoản và tiến độ thử.

**Lỗi AI mắc phải:**
- Cú pháp tham số trong constructor của lớp `Stop` bị `tsc` từ chối (`erasableSyntaxOnly`); AI đổi sang khai báo trường rồi gán trong constructor.
- Test `fetch("/x")` chạy được từ mã sinh ra vì biến toàn cục vẫn truy cập được; AI thêm danh sách tên bị che vào `new Function` để các biến này là `undefined`.
- Kỳ vọng sprite của hai ô trong test sai so với bảng gốc; AI đối chiếu lại bảng gốc và sửa test.
- Lần chạy smoke đầu thất bại vì hộp thoại chọn nhóm tuổi chặn giao diện và chọn sai selector; AI dùng một tài khoản thử đã đặt sẵn nhóm tuổi và sửa selector.
- Nhiều lần dùng heredoc dài trong bash bị vỡ cú pháp; AI chuyển sang ghi file bằng công cụ ghi file và script Python.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** mở mã nguồn không có nghĩa là bỏ qua giấy phép; đọc giấy phép trước, loại phần tài nguyên của bên thứ ba rồi mới tích hợp.

**Điều chưa chắc:**
- Chưa thử từng màn từ 2 đến 10 trong trình duyệt; các màn đó chỉ được kiểm bằng test logic.
- Game "Robot Về Nhà" cũ vẫn chưa có âm thanh.

---

## Việc 13: Hỏi về các game còn lại của Blockly Games

> "nhớ nhiều game lắm mà"

### Điều tôi hiểu trước khi gọi AI

Tôi nhớ Blockly Games có nhiều game hơn Maze và muốn biết AI đã bỏ sót cái nào.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. AI xác nhận Blockly Games có 7 game và mới thêm Maze; liệt kê 6 game còn lại kèm độ khó chuyển thể: Turtle (vẽ hình), Bird (chim bắt sâu), Puzzle (ghép tên và hình con vật) ở mức dễ đến vừa; Movie, Music và Pond ở mức khó vì cần canvas và biến thời gian, soundfont lớn, hoặc trình thông dịch an toàn cùng nhiều luật chơi. AI đề xuất làm Turtle và Bird trước vì cùng kiểu với Maze, dùng lại được phần lớn khung đã có.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** khi nguồn có nhiều phần, AI nên liệt kê đủ phạm vi ngay từ đầu thay vì chỉ làm một phần; cần hỏi lại phạm vi trước khi làm.

---

## Việc 14: Thêm Turtle, Bird và Puzzle vào Block Puzzle

> "oke làm đi, làm 3 cái đầu"

### Điều tôi hiểu trước khi gọi AI

"3 cái đầu" là ba game đầu trong bảng AI vừa đưa ra: Turtle, Bird và Puzzle. Ba game phải dùng lại khung chung với Maze, có âm thanh và lưu tiến độ theo tài khoản như Maze.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc mã nguồn và tài nguyên của ba game trong kho Blockly Games, `BlocklyMazeGame.tsx` và `BlockPuzzlePage.tsx` hiện có để rút phần dùng chung.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Tách phần dùng chung** vào `FE/src/games/common/`: âm thanh (`gameSound.ts`), thiết lập ngôn ngữ Blockly (`blocklyEnv.ts`), khung giao diện (`GameChrome.tsx`), hook dựng workspace (`useBlocklyWorkspace.ts`); âm thanh của Maze được đổi sang dùng lại `gameSound`.
- **Registry game:** `FE/src/games/registry.ts` liệt kê 4 game, mỗi game nạp lười; `BlockPuzzlePage.tsx` được sửa để vẽ thẻ và mở game theo registry thay vì mã riêng cho Maze.
- **Turtle:** hình vẽ được so bằng cách đếm điểm ảnh khác nhau ở kênh alpha trên canvas (ngưỡng theo màn), nên bài test dùng chữ ký các nét vẽ thay cho canvas; có giới hạn số khối để buộc dùng vòng lặp.
- **Bird:** mã người chơi được bọc trong `while(true)`; bản gốc dùng một thủ thuật chuỗi mã nguồn, AI thay bằng `disableOrphans` để tránh phụ thuộc vào chuỗi sinh mã.
- **Puzzle:** không dùng ảnh con vật gốc vì chưa rõ giấy phép; AI vẽ hình biểu tượng cảm xúc thành ảnh SVG và Việt hóa dữ liệu (Vịt, Mèo, Ong, Ốc sên).

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Dùng chung | `games/common/` (4 file), `games/registry.ts` | Registry nạp lười bằng `React.lazy` |
| Turtle | `games/blocklyTurtle/`: `turtleEngine.ts`, `turtleLevels.ts`, `turtleBlocks.ts`, `TurtleGame.tsx`, `turtle.test.ts` | 10 màn; màn 10 vẽ tự do với hộp công cụ đầy đủ |
| Bird | `games/blocklyBird/`: `birdEngine.ts`, `birdLevels.ts`, `birdBlocks.ts`, `BirdGame.tsx`, `bird.test.ts` | 10 màn, góc, toạ độ và điều kiện |
| Puzzle | `games/blocklyPuzzle/`: `puzzleData.ts`, `puzzleBlocks.ts`, `PuzzleGame.tsx`, `puzzle.test.ts` | 16 khối; kiểm tra đúng chỗ, báo số khối sai |
| Tài nguyên | `FE/public/games/blockly-turtle/`, `blockly-bird/`, `blockly-puzzle/` | Tệp gốc kèm `NOTICE.txt` và bản giấy phép; hình Puzzle là SVG tự vẽ |
| Tích hợp, phụ thuộc | `BlockPuzzlePage.tsx`, `blocklyEnv.ts`, `package.json`, `README.md` | Thêm `@blockly/field-colour` và `@blockly/field-angle`; README ghi công cả bốn game |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; script `smoke3.mjs` điều khiển Edge không đầu.
- **Kết quả:** FE 165 đạt (từ 140, thêm 25 test cho engine Turtle, Bird, Puzzle và registry), typecheck và build sạch.
- **Trình duyệt thật:** cả ba game mở được, workspace dựng đủ khối, bấm Chạy hay Kiểm tra cho thông báo đúng với trạng thái mặc định (Rùa "hình chưa khớp", Chim "đâm vào tường", Puzzle "còn 16 khối sai"); màn 10 của Turtle có đủ danh mục khối; không có lỗi console.

**Lỗi AI mắc phải:**
- `tsc` báo kiểu sai ở các danh mục hộp công cụ (`CategoryInfo`) và tham số không dùng; AI ép kiểu và đổi tên tham số.
- Một đoạn thay thế mã bằng script Python trong `BlockPuzzlePage.tsx` tìm trúng chuỗi nằm trong khối khác nên làm hỏng cấu trúc JSX (`tsc` báo `TS1128`); AI đọc lại phần bị hỏng và dựng lại đúng.
- Blockly 13 đã bỏ ô chọn góc, ô chọn màu và các khối màu khỏi lõi; phát hiện nhờ ảnh chụp: khối "bay theo hướng" của Bird không có ô nhập góc. AI cài hai plugin chính thức `@blockly/field-colour` và `@blockly/field-angle` rồi đăng ký ở `blocklyEnv.ts`.
- Sau khi có ô góc, giá trị mặc định hiện 0° thay vì 90° vì plugin đọc `value` chứ không đọc `angle`; AI đổi trường cấu hình.
- Lệnh tạo file test bằng heredoc lại bị vỡ cú pháp; AI ghi bằng công cụ ghi file. Một script đặt `executablePath` của Edge bị mất dấu `\` trong heredoc; AI dùng dấu `/`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** nâng phiên bản lớn của thư viện có thể bỏ mất các thành phần từng nằm trong lõi; ảnh chụp trình duyệt thật bắt được lỗi mà test logic không thấy.

**Điều chưa chắc:**
- Chỉ kiểm bằng trình duyệt ở trạng thái mặc định, chưa chơi thắng từng màn của Bird, Turtle (ngoài màn 1) và Puzzle trong trình duyệt; phần thắng được kiểm bằng test logic cho Bird màn 1, 2, 4 và Turtle màn 1 đến 3.
- Movie, Music và Pond chưa làm.

---

## Việc 15: Rà lỗi trò chơi Rùa Vẽ Hình

> "cái rùa vẽ hình hình như lỗi"

### Điều tôi hiểu trước khi gọi AI

Tôi thấy Rùa Vẽ Hình có gì đó không đúng nhưng chưa nói rõ lỗi; AI phải tự chơi thử để tìm lỗi chứ không đoán.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc lại `TurtleGame.tsx` và dùng script `smoke4.mjs` điều khiển Edge để thực sự ghép khối và chạy màn 1.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Chơi thật màn 1:** AI ghép "lặp lại 4 lần { tiến 100, rẽ phải 90° }" và game báo "Chính xác!", màn 2 mở khóa; vậy logic chấm đúng.
- **Lỗi tìm được:** sau khi bấm danh mục "Rùa" hoặc "Vòng lặp", một thanh cuộn xám dọc nằm lại giữa vùng ghép khối.
- **Nguyên nhân:** Blockly gán `display="none"` cho thanh cuộn của ngăn khối đã đóng nhưng Tailwind đặt `svg { display: block }` nên thuộc tính này vô hiệu; AI xác định bằng `elementsFromPoint` và `getComputedStyle`.
- **Sửa:** ép ẩn bằng style trực tiếp trong `useBlocklyWorkspace.ts`, nên áp dụng cho cả bốn game.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Sửa `FE/src/games/common/useBlocklyWorkspace.ts`: thêm bộ đồng bộ trạng thái thanh cuộn của ngăn khối sau mỗi sự kiện giao diện. Thử một quy tắc CSS ở `index.css` rồi gỡ vì không có tác dụng.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc -b`, `npx vitest run`, `npx vite build`; `smoke4.mjs` chơi màn 1 và in trạng thái thanh cuộn.
- **Kết quả:** FE 165 đạt, typecheck và build sạch; sau khi sửa, thanh cuộn thừa có `display: none` ở kiểu tính toán.

**Lỗi AI mắc phải:**
- Lần thả khối đầu vào vòng lặp trong kịch bản thử bị lệch vị trí nên khối không dính vào vòng lặp; đây là lỗi của kịch bản thử chứ không phải của game, AI chỉnh lại vị trí thả theo ô "thực hiện".
- Ba cách sửa đầu tiên (`setContainerVisible`, `setVisible` của Blockly và một quy tắc CSS) không làm thanh cuộn biến mất; chỉ khi in kiểu tính toán thì thấy `display: block` và AI mới tìm ra nguyên nhân là Tailwind.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** khi người dùng chỉ nói "hình như lỗi", cách đáng tin là tự chơi qua toàn bộ luồng rồi mới kết luận, và dùng kiểu tính toán chứ không dùng thuộc tính để chẩn đoán lỗi hiển thị.

**Điều chưa chắc:** đây có thể không phải lỗi tôi đã thấy; AI nói rõ chưa chắc và để tôi bổ sung nếu còn lỗi khác.

---

## Việc 16: Học viên xem lớp và bài được giao, kiểm thử vòng khép kín

> "Kiểm tra lại toàn bộ luồng trải nghiệm của vai trò Học viên (STUDENT) đối với Lớp học và Bài tập được giao:
>
> 1. Vấn đề thực tế khi kiểm thử:
> - Admin đã tạo lớp và gán học viên vào lớp.
> - Giảng viên đã có giao diện xem dashboard và giao danh mục bài tập cho lớp.
> - Tuy nhiên, khi tài khoản HỌC VIÊN đăng nhập vào hệ thống, học viên hoàn toàn KHÔNG THẤY thông tin mình đang thuộc lớp nào, cũng như không thấy danh sách các bài tập mà giảng viên của lớp đã giao để vào làm bài. Nếu học viên không thấy bài để làm thì không có dữ liệu nộp bài thực tế để đối soát số liệu trên Teacher Dashboard.
>
> 2. Yêu cầu triển khai phía Học viên:
> - Bổ sung API cho học viên: Lấy danh sách lớp mà học viên hiện tại đang tham gia (`GET /api/student/classes` hoặc tương đương) kèm danh sách bài tập được giao và trạng thái hoàn thành của từng bài (Chưa làm / Đang làm / Đã đạt).
> - Hiển thị trên giao diện Học viên:
>   + Tại Trang chủ / Khóa học hoặc Trang cá nhân của học viên: Hiển thị một khu vực gọn gàng "Lớp học của tôi" (My Classes).
>   + Khi bấm vào lớp: Hiển thị danh sách các bài tập do giảng viên giao kèm nhãn trạng thái và đường dẫn trực tiếp để bấm vào làm bài.
>   + Khi học viên hoàn thành hoặc nộp bài: Dữ liệu bài nộp này phải được đồng bộ ngay lập tức về bảng phân tích của Teacher Dashboard của lớp đó.
>
> 3. Kiểm thử luồng khép kín (End-to-End Loop):
> - Đảm bảo quy trình hoạt động trọn vẹn: Admin thêm học viên A vào lớp -> Giảng viên giao bài X -> Học viên A đăng nhập thấy lớp và bài X -> Học viên A nộp bài -> Giảng viên mở Teacher Dashboard thấy tỷ lệ hoàn thành (Completion) và tỷ lệ đạt (Pass Rate) cập nhật chính xác.
> - Chạy kiểm tra các bài test hiện có, bảo đảm không làm gãy các ràng buộc phân quyền và type-check sạch hoàn toàn."

### Điều tôi hiểu trước khi gọi AI

Admin và giảng viên đã có công cụ nhưng học viên chưa có đầu vào nào để thấy lớp, nên không ai nộp bài thật để đối soát. "Đồng bộ ngay lập tức" thực chất là Dashboard và trang học viên phải dùng chung một nguồn dữ liệu, không có bản sao nào để lệch.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc `teacher-analytics.service.ts` (đặc biệt `loadInput`, `studentBreakdown`), `analytics-core.ts`, `fake-model.ts`, `CourseCatalogPage.tsx`, `CodePlaygroundPage.tsx` (cách mở bài), cấu hình route trong `App.tsx` và schema `Exercise`.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Dùng lại đúng công thức của Dashboard:** `listMyClasses` gọi `loadInput` với phạm vi bị ép về một mình học viên rồi lấy `studentBreakdown`, nên trạng thái bài lấy cùng nguồn và cùng công thức với Teacher Dashboard; Chưa làm = chưa có lượt thử, Đang làm = có lượt thử chưa đạt, Đã đạt = có ít nhất một lượt đạt.
- **Không nhận id học viên từ client:** danh tính lấy từ token; giảng viên và Admin nhận 403.
- **Liên kết làm bài theo loại bài:** SQL và Insight mở `/da-labs/:slug`, AI Lab mở `/ai-labs/:slug`, bài code mở `/playground?slug=...`; AI thêm hỗ trợ `?slug=` vào `CodePlaygroundPage` để mở thẳng trình soạn thảo.
- **Đặt khu "Lớp học của tôi" ở trang Danh mục khóa học** (trang chủ của học viên), chỉ hiện cho học viên.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | `teacher-analytics.service.ts` (`listMyClasses`), mới: `student-classes.controller.ts`, `teacher-analytics.module.ts` | `GET /api/student/classes` chỉ cho vai trò STUDENT |
| Frontend | mới: `components/MyClassesPanel.tsx`, `pages/studentClassesModel.ts`, `axios/studentClassesApi.ts`, `types/studentClasses.ts`; sửa: `CourseCatalogPage.tsx`, `App.tsx`, `CodePlaygroundPage.tsx` | Bài chưa đạt xếp trước bài đã đạt; nhãn nút "Làm bài", "Làm tiếp", "Làm lại" |
| Test | mới: `student-classes.spec.ts` (7 test lúc đầu), `studentClassesModel.test.ts` (4 test) | Vòng khép kín với model giả có lọc thật |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest` ở BE; `npx tsc -b`, `npx vitest run`, `npx vite build` ở FE; script `e2e-loop.cjs` gọi API thật và ghi vào MongoDB; script `smoke5.mjs` điều khiển Edge.
- **Kết quả:** BE 919 đạt (2 bỏ qua, 73 suite), FE 169 đạt, typecheck và build sạch.
- **Vòng khép kín với server thật** (giảng viên và học viên tạm):

| Bước | Học viên thấy | Hoàn thành | Tỷ lệ đạt |
|---|---|---|---|
| Mới giao 2 bài | 2 bài "Chưa làm" | 0 | null |
| Nộp sai bài 1 | "Đang làm", 1 lần | 0 | 0 |
| Nộp đúng bài 1 | "Đã đạt", 2 lần | 0,5 | 1 |

  Học viên nhận 403 ở route giảng viên và giảng viên nhận 403 ở route học viên; học viên chưa thêm vào lớp nhận danh sách rỗng.
- **Trình duyệt thật:** khu "Lớp học của tôi" hiện đúng tên lớp, giảng viên, "1/2 bài đạt" và hai bài kèm trạng thái; bấm "Làm bài" mở thẳng bài trong Playground. Đã xoá lớp, tài khoản và bài nộp tạm.

**Lỗi AI mắc phải:** script thử bằng Edge lần đầu không chạy vì đường dẫn `executablePath` mất dấu `\` trong heredoc; AI đổi sang dấu `/`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** dùng chung một nguồn dữ liệu cho cả hai phía loại bỏ hẳn lớp lỗi "lệch số liệu" thay vì phải đồng bộ.

**Điều chưa chắc:**
- Lượt nộp trong kịch bản thật được ghi thẳng vào collection `submissions` vì máy chấm cần Docker; Dashboard đọc đúng collection mà nút Submit ghi vào nên số liệu không đổi, nhưng chưa có lần nộp qua nút Submit để xác nhận cuối.
- Bài loại Quiz và Code Block chỉ dẫn tới trang chung (`/quiz`, `/block-puzzle`), chưa mở thẳng từng bài; dữ liệu mẫu hiện chưa có bài loại này được giao.

---

## Việc 17: Lỗi không nộp được bài

> "(kèm log lỗi console dán từ trình duyệt: cảnh báo Canvas2D `getImageData` ở `TurtleGame.tsx`, rồi hàng loạt dòng `[Axios Network Error]: No response received from server at http://localhost:3000/api` và `net::ERR_CONNECTION_REFUSED` tới `/api/exercises/submissions/...`, `/api/exercises/day15-chon-hoat-dong-khong-giao-nhau/submit` và `/run`)
>
> khong nop bai duoc;"

### Điều tôi hiểu trước khi gọi AI

Log cho thấy mọi request tới `localhost:3000` bị từ chối kết nối, tức là backend không chạy. Cảnh báo `getImageData` ở Rùa Vẽ Hình là chuyện riêng (gợi ý hiệu năng), không liên quan việc nộp bài.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

AI kiểm tra cổng bằng `curl` và `netstat`: web (5173) còn chạy, backend (3000) không nghe, MongoDB và server Số 1 vẫn chạy. AI bật lại bằng `npm run start:dev`; lần bật này tự mở Docker Desktop và chờ khoảng một phút (sandbox ở trạng thái "starting") rồi backend lên, `GET /api/exercises` trả 200. Ngoài ra AI sửa `TurtleGame.tsx`: khai báo `willReadFrequently` cho hai lớp canvas được đọc điểm ảnh để cảnh báo biến mất.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Kiểm tra:** `curl http://localhost:3000/api/exercises` từ 000 (không kết nối) sang 200; `npx tsc -b` sạch sau khi sửa canvas.
- Lệnh chờ bằng `sleep` bị công cụ chặn; AI dùng vòng lặp kiểm tra cổng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** đọc log lỗi mạng để tách việc "không kết nối" (hạ tầng) khỏi lỗi chức năng trước khi sửa mã.

**Điều chưa chắc:**
- AI chưa xác định được vì sao backend tắt; nếu tắt lại cần xem terminal của nó.
- AI chưa thử nộp bài sau khi bật lại; chấm bài code và SQL cần máy chấm trong Docker.

---

## Việc 18: Rà soát tiêu chí nghiệm thu Ngày 25 và xử lý học viên tự do

> "Hãy rà soát và xác nhận mức độ hoàn thành các tiêu chí nghiệm thu của NGÀY 25 (Teacher Dashboard) dựa trên toàn bộ mã nguồn hiện tại, đồng thời đối chiếu với cơ chế vận hành của học viên tự do (Self-paced Learner) theo kiến trúc chuẩn sau:
>
> 1. Kiến trúc xử lý Học viên tự do (Self-paced Learner) chưa vào lớp:
> - Phía Học viên (Student Experience):
>   + Quyền truy cập mở: Vẫn học và làm các bài tập công khai bình thường (kho bài tập chung, contest mở, quiz engine, AI coach).
>   + Khu vực "Lớp học của tôi": Khi chưa được thêm vào lớp nào, hiển thị trạng thái dữ liệu trống (Empty State) tinh tế: "Bạn chưa tham gia lớp học nào. Các bài tập bên dưới là lộ trình tự do. Nếu bạn là học viên của trung tâm, vui lòng liên hệ quản trị viên/giảng viên để được thêm vào lớp."
>   + Lịch sử & Điểm số cá nhân: Các lần nộp bài tự do vẫn lưu vào DB và hiển thị đầy đủ trên trang cá nhân của chính học viên đó.
> - Phía Giảng viên (Teacher Dashboard):
>   + Tuyệt đối không loãng số liệu: Bài làm của học viên tự do KHÔNG được tính vào bất kỳ chỉ số nào trên Teacher Dashboard.
>   + Dashboard giảng viên chỉ tổng hợp dữ liệu bài làm của các học viên thực sự nằm trong danh sách (studentIds) của lớp được phân công, đảm bảo chuẩn tiêu chí "Không lộ/lẫn dữ liệu giữa các lớp".
> - Phía Quản trị viên (Admin Portal):
>   + Tài khoản tự đăng ký xuất hiện trong Quản lý người dùng (/admin/users) với vai trò STUDENT và trạng thái Chưa vào lớp.
>   + Admin có thể thêm học viên này vào bất kỳ lớp nào qua /admin/classes (thêm đơn lẻ hoặc import file). Ngay khi được gán vào lớp, học viên sẽ thấy danh mục bài tập của lớp và dữ liệu làm bài sau đó lập tức được tính vào Teacher Dashboard của giảng viên phụ trách.
>
> 2. Đối soát điều kiện nghiệm thu Ngày 25:
> - Teacher Dashboard v0.1: Các chỉ số completion, pass rate, average attempts, hint usage, phân tích điểm nghẽn theo tag và drill-down chi tiết theo học viên/bài tập đã hoàn chỉnh và hoạt động chính xác với DB chưa?
> - Empty States: Trạng thái trống ở cả 3 vai trò (Admin chưa có lớp/người dùng, Teacher chưa được gán lớp/lớp chưa có bài, Student chưa vào lớp) đã được xử lý đồng bộ và không văng lỗi chưa?
> - Role-based Access Control (RBAC): Đã đảm bảo cô lập dữ liệu tuyệt đối giữa các lớp và đúng thẩm quyền Admin / Teacher / Student chưa?
>
> Hãy kiểm tra lần cuối, tóm tắt trạng thái đạt/chưa đạt của từng mục nghiệm thu trên, chạy lại test suite (BE/FE) và thông báo nếu có bất kỳ điểm nghẽn nào cần xử lý trước khi đóng gói Ngày 25."

### Điều tôi hiểu trước khi gọi AI

Đây là bước đối soát cuối ngày: không chỉ hỏi "đã làm xong chưa" mà phải tìm chỗ chưa khớp tiêu chí. Học viên tự do không được làm loãng số liệu, nhưng phải thấy câu thông báo trống đúng nội dung, và Admin phải phân biệt được học viên chưa vào lớp trong danh sách.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc lại `admin-users.service.ts`, `AdminUsersPage.tsx`, `MyClassesPanel.tsx`, `TeacherDashboardPage.tsx`, `teacherDashboardModel.ts`, các module `exercise`, `contest`, `quiz`, `coach`, `learner-activity`, `recommendation` (để xác nhận không module nào chặn theo lớp) và các spec liên quan.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

AI tìm ra hai chỗ chưa khớp tiêu chí và sửa:
- **Học viên chưa vào lớp:** khu "Lớp học của tôi" trước đó biến mất hẳn khi không có lớp; giờ hiện đúng câu thông báo tôi yêu cầu.
- **Quản lý người dùng:** danh sách `/admin/users` chưa cho biết học viên đã vào lớp chưa; giờ mỗi học viên có `classCount` (lớp lưu trữ không tính) và giao diện hiện "· Chưa vào lớp" hoặc "· N lớp".

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Backend | `admin-users.service.ts` | Thêm `classCount` cho vai trò STUDENT (null với vai trò khác) bằng một truy vấn gộp |
| Frontend | `MyClassesPanel.tsx`, `AdminUsersPage.tsx`, `types/teacherAnalytics.ts` | Trạng thái trống cho học viên; nhãn số lớp ở cột trạng thái |
| Test | thêm 2 test vào `admin-users.service.spec.ts`, 3 test vào `student-classes.spec.ts` | Học viên tự do không làm loãng số liệu; Teacher chưa có lớp và lớp trống không ra NaN |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Lệnh chạy:** `npx tsc --noEmit`, `npx jest` ở BE; `npx tsc -b`, `npx vitest run` ở FE; script `smoke6.mjs` điều khiển Edge.
- **Kết quả:** BE 73 suite, 924 test đạt (2 bỏ qua có sẵn); FE 169 test đạt; `tsc` sạch cả hai phía.
- **Trình duyệt thật:** tài khoản tự đăng ký mới thấy câu thông báo trống trong "Lớp học của tôi"; Admin thấy dòng học viên đó là "Học viên Hoạt động · Chưa vào lớp". Đã xoá tài khoản thử.
- **Đối soát kết luận:** Dashboard v0.1, Empty State ba vai trò và RBAC đều đạt; hai điểm còn mở là link Quiz/Code Block và chưa có lần nộp qua nút Submit (xem Việc 16 và 17).

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** đối soát tiêu chí nghiệm thu bằng cách mở giao diện thật cho từng vai trò phát hiện được chỗ hở (khu "Lớp học của tôi" biến mất) mà test logic không nhắc tới.

**Điều chưa chắc:**
- Backend đã từng tắt giữa ngày (Việc 17) và chưa rõ nguyên nhân.
- Toàn bộ thay đổi Day 25 chưa được commit và chưa mở PR.

---

## Việc 19: Soạn docs/day25/tomtatday25.md

> "Tạo thư mục docs/day25/ và tệp tomtatday25.md để tổng kết toàn bộ kết quả triển khai Ngày 25 (Teacher Dashboard & Quản trị lớp học). Nội dung trình bày mạch lạc, trực diện, không dùng văn mẫu rườm rà, bám sát các mục sau:
>
> 1. Mục tiêu cốt lõi Ngày 25:
> - Xây dựng hệ sinh thái quản lý lớp học và đo lường phân tích học tập (Learning Analytics) phục vụ giảng viên và quản trị viên theo chuẩn phân quyền RBAC thực tế.
>
> 2. Chi tiết các hạng mục đã hoàn thành:
> - Admin Portal (Bố cục chuyên dụng):
>   + Tách biệt hoàn toàn khỏi layout học tập của sinh viên/giảng viên, có Topbar quản trị và Sidebar hỗ trợ thu gọn linh hoạt (icon-only mode) kèm khả năng kéo tay chỉnh độ rộng.
>   + Trang Quản lý người dùng (/admin/users): Hiển thị bảng người dùng dạng hairline grid, bộ lọc vai trò, tìm kiếm, ngăn chặn leo thang quyền (không cho gán quyền ADMIN), cơ chế thu hồi quyền giảng viên (khóa phiên ngay lập tức qua JWT verification), và slide-over drawer xem hồ sơ chi tiết/tiến độ học viên.
>   + Trang Quản lý lớp học (/admin/classes): Admin là vai trò duy nhất tạo lớp, gán giảng viên phụ trách, sửa/lưu trữ/xóa lớp. Hỗ trợ import nhanh danh sách học viên từ file Excel/CSV (xác thực chữ ký nhị phân, kiểm tra MIME type, giới hạn 2MB/500 dòng, đối soát email học viên thực tế).
> - Teacher Dashboard (/teacher/dashboard):
>   + Chỉ hiển thị các lớp mà giảng viên được Admin gán phụ trách; cô lập dữ liệu tuyệt đối giữa các lớp.
>   + Dải chỉ số đo lường chuẩn hóa: Tỷ lệ hoàn thành (Completion Rate), tỷ lệ đạt (Pass Rate), số lần thử trung bình (Average Attempts), tần suất dùng gợi ý (Hint Usage) và phân tích điểm nghẽn kỹ năng theo tags.
>   + Hỗ trợ xem chi tiết đa tầng (drill-down) theo từng bài tập và từng học viên.
>   + Tab Giao bài: Giảng viên chủ động tích chọn danh mục bài tập (Code, SQL, Insight, AI Lab) phân công cho lớp.
> - Trải nghiệm Học viên (Student Experience):
>   + Khu vực "Lớp học của tôi": Học viên thấy lớp mình tham gia và danh mục bài tập được giao kèm trạng thái (Chưa làm / Đang làm / Đã đạt).
>   + Cơ chế Học viên tự do (Self-paced Learner): Học viên tự đăng ký chưa vào lớp vẫn làm bài tập công khai bình thường; dữ liệu làm bài tự do tuyệt đối không bị tính vào Dashboard của bất kỳ lớp nào. Khi được Admin đưa vào lớp, dữ liệu làm bài sau đó lập tức được tính vào thống kê của giảng viên.
>
> 3. Luồng vận hành mẫu (End-to-End Workflow):
> - Mô tả chi tiết từng bước:
>   1. Admin tạo lớp học và gán giảng viên phụ trách (hoặc import học viên vào lớp qua file Excel).
>   2. Giảng viên đăng nhập Teacher Dashboard, thấy lớp được phân công và tiến hành giao danh mục bài tập.
>   3. Học viên trong lớp đăng nhập, mở "Lớp học của tôi", thấy bài tập được giao và thực hiện nộp bài.
>   4. Hệ thống chấm điểm/ghi nhận bài nộp, Teacher Dashboard của giảng viên tự động cập nhật ngay lập tức các chỉ số tỷ lệ đạt, lần thử và điểm nghẽn kỹ năng.
>
> 4. Số liệu kiểm thử & Chất lượng mã nguồn:
> - Thống kê kết quả test: Số lượng test BE/FE đạt, trạng thái type-check và build sạch sẽ.
> - Ghi nhận việc xử lý an toàn dữ liệu: Xóa sạch dữ liệu seed hardcode demo, cơ chế fallback sandbox dữ liệu và bảo mật chặn truy cập chéo lớp."

### Điều tôi hiểu trước khi gọi AI

Tài liệu nộp phải bám đúng bốn mục và chỉ ghi những gì hệ thống thật sự làm, kèm số liệu test từ lần chạy gần nhất. Văn phong trực diện, không dùng ví dụ đời thường như yêu cầu ở Day 22.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo `docs/day25/tomtatday25.md` gồm 4 mục theo yêu cầu: mục tiêu; hạng mục đã hoàn thành (Admin Portal, Teacher Dashboard, trải nghiệm học viên); luồng vận hành mẫu kèm bảng số liệu của lần chạy thật (Chưa làm → Đang làm → Đã đạt tương ứng hoàn thành 0, 0, 0,5 và tỷ lệ đạt null, 0, 1); kiểm thử và chất lượng. AI thêm mục 5 "Điểm còn mở" ghi hai việc chưa làm hết (link bài Quiz và Code Block; chưa nộp qua nút Submit) để tài liệu không hứa vượt khả năng hệ thống.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Cách kiểm tra:** số liệu trong tài liệu (73 suite, 924 test BE; 169 test FE) lấy từ lần chạy gần nhất ở Việc 18; các con số kiểm tra trong bảng lấy từ lần chạy thật ở Việc 16.
- **Lỗi AI mắc phải:** hai mô tả được viết từ trí nhớ chứ chưa đối chiếu lại với mã nguồn: cơ chế fallback sandbox ("nạp qua API trước, lỗi thì chuyển sang bộ dữ liệu nhúng sẵn") và tên hai script dọn dữ liệu demo (`seed-teacher-demo`, `cleanup-teacher-demo`). AI tự nhắc tôi đọc lại hai chỗ này; khi viết AI Work Log, tôi đối chiếu với `scripts/bootstrap-sandbox.js` và thấy mô tả khớp.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** tài liệu tổng kết nên có một mục "điểm còn mở" để người đọc biết ngay những gì chưa làm.

**Điều chưa chắc:** bản tài liệu chưa được đối chiếu từng câu với mã nguồn ngoài hai chỗ đã nêu.

---

## Việc 20: Cập nhật AI Work Log Ngày 25

> "ghi đè AI worklog day25 (đúng format ko được làm khác) lưu ý mỗi việc đều phải ghi prompt của tôi"

### Điều tôi hiểu trước khi gọi AI

Ghi đè nội dung Day 24 bằng Day 25, giữ đúng cấu trúc các ngày trước: bảng thông tin chung, mục lục, rồi mỗi việc có prompt nguyên văn và các mục con. Bản Day 24 vẫn còn trong lịch sử Git.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Ghi đè `AI_WORKLOG.md`. AI đọc lại toàn bộ log Day 24 để lấy đúng khung (tiêu đề, bảng thông tin chung, mục lục, các mục con theo từng việc). Nguyên văn prompt của từng việc được trích trực tiếp từ bản ghi hội thoại của phiên làm việc (không viết lại theo trí nhớ); số liệu test và kết quả kiểm thử lấy từ báo cáo và kết quả chạy thật của từng lượt trong ngày. Với hai prompt có đoạn dán là văn bản dài từ trình duyệt (Việc 17), AI chỉ ghi chú nội dung đoạn dán thay vì chép lại cả log.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: lấy prompt từ bản ghi hội thoại chính xác hơn trích từ trí nhớ, nhất là khi phiên làm việc đã được rút gọn ngữ cảnh.

Điều chưa chắc:
- Phần "Điều tôi hiểu trước khi gọi AI" của các việc được viết lại từ nội dung prompt và báo cáo, không phải ghi chép lúc đó của tôi; cần tôi đọc lại và chỉnh nếu khác ý.
- Toàn bộ thay đổi Day 25 chưa được commit và chưa mở PR.
- Một số kết quả kiểm thử (ví dụ giao diện Admin ở Việc 7 đến 10) lúc đó chỉ kiểm bằng type-check, build, test và gọi API; chưa có lần mở trình duyệt cho riêng phần đó trong phiên.
