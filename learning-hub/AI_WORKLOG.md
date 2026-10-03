# AI Work Log Ngày 23: Bộ lab AI Engineer (prompt, embeddings, RAG evaluation)

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 3 tháng 10 năm 2026 |
| Nhánh | feature/learning-hub-day23 |
| Công cụ, model | Claude Code; Việc 1 chạy trên Claude Sonnet 5.5, Việc 2 đến 12 chạy trên Claude Opus 5.5; không sử dụng subagent trong ngày |
| Phạm vi quyền | Đọc và ghi trong thư mục learning-hub; chỉ đọc bộ RAG eval Day 08 (`Data-AI-Resource/BaoCao_Task08`), golden set và OpenAPI Day 21 (`Data-AI-Resource/BaoCao_Task21`) của Thực tập sinh số 1, không sửa file nào trong `Data-AI-Resource` |
| Dữ liệu nhạy cảm | Không có sự cố. Mọi chuỗi giống API key dùng trong test đều là key giả. Tài khoản tạm dùng để kiểm thử động đều bị xoá ngay sau khi chạy. File `.env` không bị commit; mật khẩu sandbox chỉ đặt qua biến môi trường |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Tạo nhánh feature/learning-hub-day23 từ main đã cập nhật | Đạt |
| 2 | Bộ 8 AI Lab: evaluation set của Số 1, chặn API key, chấm chất lượng và chi phí, giao diện, unit test | Đạt |
| 3 | Chạy dự án để kiểm thử | Đạt |
| 4 | Kiểm tra việc chấm có thật sự lấy evaluation set từ Số 1 | Đạt, không cần sửa |
| 5 | Lỗi 503 khi chưa bật mock server và khóa quyền nộp bài theo vai trò | Đạt |
| 6 | Chặn điều hướng FE cho giảng viên và Docker Compose cho Postgres Sandbox | Đạt |
| 7 | Tự động bật sandbox bằng một lệnh `npm run dev` | Đạt |
| 8 | Dọn file compose cũ, container cũ và đưa package-lock vào git | Đạt |
| 9 | Rà soát bảo mật và QA toàn bộ learning-hub, chỉ báo cáo | Đạt |
| 10 | Sửa 18 lỗi từ báo cáo rà soát | Đạt |
| 11 | Xử lý 5 vấn đề còn tồn đọng sau đợt sửa | Đạt |
| 12 | Cập nhật AI Work Log Ngày 23 | Đạt |

---

## Việc 1: Tạo nhánh feature/learning-hub-day23 từ main đã cập nhật

> "tạo branch hub day23 r kéo main về"
>
> "đồng bộ chứ"

### Điều tôi hiểu trước khi gọi AI

Main đã có PR Day 22 được merge, nên nhánh Day 23 phải tạo từ main mới nhất và đặt tên theo cùng quy ước với các ngày trước.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không tạo file. AI chuyển sang `main`, `git pull` (fast-forward 26 commit, tới `957768d` Merge PR #92 Day 22) rồi tạo nhánh. Lần đầu AI đặt tên `hub-day23`, khác quy ước. Sau chỉ dẫn thứ hai, AI đổi tên thành `feature/learning-hub-day23`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tên nhánh phải theo quy ước sẵn có của repo ngay từ đầu, không đặt theo nguyên văn câu lệnh.

---

## Việc 2: Bộ 8 AI Lab: evaluation set của Số 1, chặn API key, chấm chất lượng và chi phí, giao diện, unit test

> "Đóng vai là một Senior Fullstack Engineer. Tôi là Thực tập sinh số 02, dự án Learning & Contest Hub (NestJS, React). Hệ thống hiện tại đang có các luồng chạy độc lập và ổn định: Code Python (Docker Sandbox) và SQL/DA Lab (Postgres Sandbox).
>
> Hôm nay tôi cần thực thi NGÀY 23.
>
> 📖 NGUYÊN VĂN YÊU CẦU NGÀY 23:
> "Giai đoạn: Tuần 5 - Tester/Data/AI courses | Kết quả chính: Có bài prompt, embeddings và RAG evaluation.
> Việc phải làm:
> - Tạo 8 lab tăng dần.
> - Lưu prompt/model/config cùng submission.
> - Gắn evaluation set và cost/latency.
> Điều kiện nghiệm thu:
> - Kết quả tái lập ở mức cấu hình.
> - Không để API key trong submission.
> - Chấm cả chất lượng và chi phí."
>
> 🚨 RÀNG BUỘC KIẾN TRÚC & MÔI TRƯỜNG:
> - CHỈ code trong thư mục `learning-hub/`. KHÔNG tạo/sửa file markdown báo cáo hay AI_WORKLOG trong prompt này để tiết kiệm token.
> - KHÔNG làm gãy các luồng cũ. Sử dụng collection độc lập cho AI Lab.
> - LIÊN KẾT VỚI SỐ 1: Bắt buộc dùng `DatasetIntegrationService` gọi API mock để kéo `evaluation_set` (do Số 1 tạo ở Day 08, 14) về làm căn cứ chấm điểm.
>
> Hãy viết code thực thi toàn diện Day 23:
>
> **1. Database & Tích hợp (Backend NestJS):**
> - **Schema mới:** Tạo `AiLabSubmission` (collection `ai_lab_submissions`). Các trường: `userId`, `exerciseId`, `prompt`, `model`, `config` (JSON lưu temp, maxTokens...), `runManifest` (log chạy), `qualityScore`, `cost`, `latency`, `status`.
> - **Seed Dữ liệu:** Nạp 8 bài lab AI Engineer (type: `AI_LAB`). Mỗi bài gán một `resource_id` tương ứng với bộ RAG Corpus/Evaluation Set của Số 1.
> - **Tích hợp:** Mở rộng `DatasetIntegrationService` thêm hàm mock fetch `evaluation_set` (chứa questions và ground_truths) từ Số 1.
>
> **2. Bảo mật & Chấm điểm (AI Lab Grader):**
> - **Security Guard (Chống lộ Key):** Viết Custom Validator/Pipe kiểm tra payload nộp bài. Dùng Regex quét chặn đứng BẤT KỲ chuỗi nào giống API Key (vd: bắt đầu bằng `sk-...` của OpenAI, `AIza...` của Google). Ném `BadRequestException("Không được để lộ API Key trong submission")`.
> - **Scoring Engine (`AiLabGraderService`):**
>   + Fetch `evaluation_set` từ Số 1.
>   + Tính `qualityScore`: Dựa trên tỷ lệ khớp (mock) giữa câu trả lời sinh ra từ prompt của học viên với `ground_truths`.
>   + Tính `cost` & `latency`: Giả lập tính toán dựa trên độ dài `prompt` và cấu hình `config`.
>   + Trừ điểm (penalty) tổng nếu `cost` hoặc `latency` vượt ngưỡng cho phép của bài toán.
>
> **3. Frontend (React/Tailwind) - UI & UX:**
> - **UI AiLabWorkspacePage:**
>   + Cột trái: Đề bài và Preview một phần `evaluation_set` (kéo từ API) để học viên biết test case.
>   + Cột phải: Form chọn `model`, thanh trượt điều chỉnh `config` (temperature, maxTokens), và Textarea gõ `prompt`.
>   + Nút Submit: "Chạy & Đánh giá".
> - **UX Kết quả:** Render bảng `Run Manifest` hiển thị 3 thông số: Điểm chất lượng, Chi phí (Cost) và Độ trễ (Latency). Báo lỗi Toast đỏ ngay lập tức nếu API Key bị chặn.
>
> **4. Unit Tests (Jest):**
> - Viết test trong `ai-lab-grader.service.spec.ts`:
>   + Case 1: Bị chặn thành công khi nộp chuỗi chứa `sk-12345...`.
>   + Case 2: Chấm điểm kết hợp (tính đúng điểm quality và trừ điểm khi cost/latency quá ngưỡng quy định)."

### Điều tôi hiểu trước khi gọi AI

Learning Hub chỉ giữ `resource_id`; câu hỏi và đáp án chuẩn là dữ liệu của Số 1 và phải đi qua `DatasetIntegrationService`. "Tái lập ở mức cấu hình" nghĩa là cùng prompt, model, config và evaluation set thì luôn ra cùng điểm. Bài AI Lab không được lọt vào luồng Python cũ.

### Context, tài liệu, file, constraint đã cung cấp

AI đọc ở chế độ chỉ đọc:
- `BaoCao_Task08/data/eval_qa/rag_eval_questions.json` và `eval_schema.md` (100 câu, trường `question_id`, `query`, `type`, `ground_truth_answer`, `citations`).
- `BaoCao_Task21/data/golden_rag_eval_v1.json` (nhóm `standard_qa`, `ambiguous_multihop`, `unanswerable_out_of_domain`, `adversarial_injection`, `expected_behavior` ANSWER/ABSTAIN).
- `BaoCao_Task21/contracts/openapi.json`: chưa có route evaluation set.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **Route mới cho Số 1:** OpenAPI v1.0 chưa có route evaluation set. AI đề xuất `GET /api/v1/registry/evaluation-sets/{id}` là phần mở rộng v1.1, giống cách Day 22 đề xuất `data_dictionary`; route này cần Số 1 xác nhận.
- **Mô phỏng thay cho LLM thật:** không gọi LLM thật. Câu trả lời được mô phỏng từ đáp án chuẩn, theo các yếu tố sau:
  - các kỹ thuật prompt nhận ra được trong prompt,
  - năng lực của model,
  - temperature và maxTokens,
  - với bài RAG: xác suất truy xuất trúng, tính theo embedding model và topK.
- **Tái lập:** mọi bước ngẫu nhiên dùng seed lấy từ prompt, model, config và checksum của evaluation set.
- **Hiệu chỉnh ngưỡng:** AI chạy grader trên fixture với nhiều cấu hình. Lab 4 với prompt trơn và lab 7 với cấu hình truy xuất kém vẫn đạt, nên AI nâng ngưỡng đạt của lab 4 đến 6 lên 70 và lab 7, 8 lên 75.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính | Ghi chú |
|---|---|---|
| Tích hợp Số 1 | `dataset-integration.service.ts`, `dataset-contract.types.ts` | Thêm `fetchEvaluationSet`; gom phần gọi HTTP dùng chung; tính checksum sha256 của câu hỏi và đáp án chuẩn; câu thiếu đáp án thì báo lỗi |
| Mock Số 1 | `mock-data-service/evaluation-set-fixture.ts`, `server.ts` | 8 evaluation set, câu hỏi chép nguyên văn từ Day 08 và golden set Day 20/21 |
| Lưu trữ | `ai-lab-submission.schema.ts`, `exercise.schema.ts` | Collection `ai_lab_submissions`; thêm type `AI_LAB` và `aiLabSpec` |
| Bộ lab | `data/initial-ai-labs.ts` | 8 bài tăng dần: zero-shot, định dạng, few-shot, RAG grounding, từ chối câu ngoài phạm vi, chống câu bẫy và injection, embeddings và topK, RAG end-to-end |
| Chấm | `ai-lab-grader.service.ts`, `ai-lab.catalog.ts` | Chất lượng là F1 theo từng câu so với ground truth; cost và latency mô phỏng theo bảng giá; mỗi lần vượt ngân sách trừ 20% điểm tối đa; run manifest ghi phiên bản grader, checksum, đơn giá và seed |
| Chặn key | `secret-guard.ts` | `NoSecretsPipe` ở controller, grader kiểm tra lại lần nữa; thông báo lỗi không lặp lại chuỗi key |
| API | `ai-labs.controller.ts`, `ai-labs.service.ts`, `ai-labs.module.ts` | Danh sách lab, đề, preview 3 câu không có đáp án chuẩn, nộp bài, lần chạy gần nhất |
| Giao diện | `AiLabListPage.tsx`, `AiLabWorkspacePage.tsx`, `aiLabApi.ts`, `types/aiLab.ts`, `App.tsx`, `Header.tsx` | Cột trái là đề và preview, cột phải là form; bảng Run Manifest; toast đỏ khi có key, kiểm tra ngay ở trình duyệt |
| Test | `ai-lab-grader.service.spec.ts`, phần mới trong `dataset-integration.service.spec.ts` | Case 1, Case 2, tái lập, kiểm tra đầu vào |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Test:** 35 test mới xanh; toàn bộ BE 477/477; typecheck BE và FE sạch.
- **Kiểm thử động:** chạy smoke test bằng HTTP thật với mock server và backend. Prompt đủ kỹ thuật được PASSED 23.7/25; nộp lại cùng cấu hình cho manifest giống hệt; `gemini-2.5-pro` với topK 8 bị trừ cả cost lẫn latency; key `sk-` bị 400; bài AI Lab không lọt vào danh sách DA Lab và ngân hàng đề Python.

**Lỗi AI mắc phải:**
- Test cắt câu trả lời theo `maxTokens` bị fail, vì đáp án mẫu quá ngắn nên không bao giờ vượt 32 token. AI đổi test sang prompt không giới hạn độ dài.
- `tsc` báo lỗi vì trường `model` trùng tên với method `Document.model()` của Mongoose. AI chuyển sang inject `Model<AiLabSubmission>` kiểu raw.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** hiệu chỉnh ngưỡng chấm bằng cách chạy grader trên dữ liệu thật trước khi chốt seed giúp tránh bài quá dễ.

**Điều chưa chắc:**
- Số 1 chưa xác nhận route evaluation set v1.1.
- Chất lượng hiện là mô phỏng, chưa gọi LLM thật.

---

## Việc 3: Chạy dự án để kiểm thử

> "run du an cho toi test dã"

### Điều tôi hiểu trước khi gọi AI

Cần bật đủ mock Số 1, backend và frontend để tự kiểm thử trên trình duyệt.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. AI bật mock server, backend (watch mode) và Vite chạy nền, rồi đưa kịch bản thử: chặn key, prompt tốt và prompt trơn, phạt ngân sách, tái lập.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

**Lỗi AI mắc phải:** cổng 3000 và 8010 vẫn bị hai tiến trình node từ lần smoke test ở Việc 2 giữ, vì lệnh dừng tác vụ chỉ dừng `npm` chứ không dừng tiến trình con. AI tra tiến trình theo cổng, xác nhận đúng là tiến trình của mình rồi mới tắt và chạy lại.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: dừng một tác vụ `npm` chạy nền không đảm bảo tiến trình con cũng dừng; phải kiểm tra cổng sau khi dừng.

---

## Việc 4: Kiểm tra việc chấm có thật sự lấy evaluation set từ Số 1

> "Kiểm tra lại toàn bộ mã nguồn của Day 23 (đặc biệt là AiLabGraderService và luồng seed dữ liệu).
>
> Hãy trả lời trung thực và sửa code nếu vi phạm:
> 1. Luồng chấm điểm hiện tại có đang thực sự gọi qua DatasetIntegrationService để fetch dữ liệu từ mock server của Thực tập sinh số 1 (GET /api/v1/registry/evaluation-sets/{id}) không?
> 2. Hay bạn đang tự bịa ra dữ liệu (hardcode các mảng câu hỏi, ground_truths, json ảo) trực tiếp ngay bên trong file service?
>
> Nếu đang tự hardcode dữ liệu để chấm điểm:
> - Xóa ngay phần hardcode.
> - Sửa lại code bắt buộc phải lấy resource_id của bài lab, gọi qua DatasetIntegrationService để kéo tập đánh giá từ máy chủ của Số 1 về làm chuẩn đối chiếu.
> - Đảm bảo mã nguồn chỉ đóng vai trò xử lý logic chấm điểm, còn dữ liệu gốc phải hoàn toàn phụ thuộc vào hệ thống của Số 1."

### Điều tôi hiểu trước khi gọi AI

Phải chứng minh bằng code và bằng hệ thống đang chạy, không chỉ khẳng định.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file vì không có vi phạm. Bằng chứng:

| Kiểm tra | Kết quả |
|---|---|
| Grep `src/` (trừ file test) | Không có mã câu `Q0xx`, `EVAL-` hay nội dung đáp án; `src/` không import fixture của mock |
| Chấm khi mock đang bật | Checksum trong manifest `7df9bba820cedebf` khớp với checksum tự tính từ dữ liệu mock trả về |
| Tắt mock rồi chấm bài chưa có trong cache | HTTP 502, không có dữ liệu dự phòng |

AI nêu rõ các điểm cần biết:
- Fixture trong `mock-data-service/` là bản chép dữ liệu của Số 1, nằm phía "server Số 1".
- Grader có chuỗi cố định để mô phỏng câu trả lời sai, nhưng đó không phải đáp án chuẩn.
- Evaluation set được cache 60 giây.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: cách chứng minh nhanh nhất là tắt nguồn dữ liệu rồi xem hệ thống có lỗi hay âm thầm dùng dữ liệu khác.

---

## Việc 5: Lỗi 503 khi chưa bật mock server và khóa quyền nộp bài theo vai trò

> "Đóng vai kỹ sư phần mềm. Rà soát lại toàn bộ mã nguồn hiện tại và xử lý ngay 2 lỗi logic nghiêm trọng sau. Trả về mã nguồn trực tiếp, không giải thích dài dòng, không dùng từ ngữ thảo mai, không dùng ký tự đặc biệt. Yêu cầu giữ nguyên các bài kiểm thử đang xanh và viết thêm bài kiểm thử cho luồng khóa quyền.
>
> 1. Khắc phục lỗi kết nối máy chủ dữ liệu giả lập (Mock Server / Sandbox DB):
> - Lỗi hiện tại: Khi chưa bật máy chủ giả lập của người số 1, hệ thống báo "Sandbox DB của Data & AI Resource đang không kết nối được" nhưng không tự phục hồi hoặc không báo lỗi rõ ràng cho luồng AI Lab.
> - Xử lý:
>   + Cập nhật package.json, thêm lệnh chạy tự động bằng công cụ concurrently để khởi động máy chủ giả lập cùng lúc với máy chủ backend.
>   + Thêm cơ chế bắt lỗi ở dịch vụ tích hợp dữ liệu. Nếu gọi API thất bại do máy chủ tắt, trả về lỗi 503 Service Unavailable kèm thông báo "Máy chủ dữ liệu giả lập chưa được bật", hiển thị thông báo đỏ rõ ràng trên giao diện thay vì lỗi chung chung.
>
> 2. Ràng buộc cực mạnh quyền nộp bài (Role-based Access Control):
> - Lỗi hiện tại: Vai trò giảng viên vẫn có thể gọi API nộp bài thực hành, gây sai lệch logic nghiệp vụ.
> - Xử lý: Rà soát toàn bộ các bộ điều khiển nhận bài nộp (của AI Lab và DA Lab). Bổ sung lớp bảo vệ phân quyền (Role Guard).
> - Cài đặt cứng: Chỉ tài khoản có vai trò "Học viên" mới được phép nộp bài. Nếu tài khoản "Giảng viên" hoặc "Quản trị viên" gọi API này, chặn ngay từ vòng xác thực, ném lỗi 403 Forbidden kèm thông báo "Tài khoản giảng viên không được phép làm bài thực hành".
> - Ẩn nút "Chạy & Đánh giá" trên giao diện nếu tài khoản đang đăng nhập không phải là Học viên.
>
> Thực thi ngay và cập nhật mã nguồn."

### Điều tôi hiểu trước khi gọi AI

Thông báo "Sandbox DB..." trong đề là lỗi của Postgres sandbox Docker, khác với lỗi tắt mock server; cần tách hai trường hợp. Chạy thử SQL không phải là nộp bài.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

- **503 khi mock tắt:** `dataset-integration.service.ts` trả 503 "Máy chủ dữ liệu giả lập chưa được bật" khi không có phản hồi; mock có phản hồi lỗi 5xx thì vẫn trả 502.
- **Lệnh chạy chung:** `BE/package.json` có thêm `dev` chạy mock và api bằng `concurrently`.
- **Khóa quyền nộp bài:** `common/auth/student-only.guard.ts` mới, gắn vào `POST /ai-labs/:slug/submit`, `POST /da-labs/:slug/submit` và `POST /da-labs/:slug/insight`.
- **FE:** ẩn nút nộp bài với tài khoản không phải học viên.
- **Giữ nguyên:** `POST /da-labs/:slug/run` vẫn mở cho giảng viên, vì đó là chạy thử chứ không nộp bài.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Test:** 16 test mới, trong đó `student-only.guard.spec.ts` chạy qua HTTP trên cả hai controller; toàn bộ 493/493 xanh.
- **Kiểm thử động:** giảng viên gọi cả 3 route đều nhận 403 đúng thông báo; tắt mock thì 3 route trả 503.

**Lỗi AI mắc phải:** lệnh `dev` đầu tiên dùng cờ `-k`, nên khi tắt mock để thử thì API cũng tắt theo và không trả được 503. AI phát hiện khi kịch bản kiểm thử báo `ECONNREFUSED` tới cổng 3000, rồi bỏ cờ `-k`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tuỳ chọn tiện lợi như `-k` có thể làm hỏng chính kịch bản lỗi mà mình muốn xử lý.

---

## Việc 6: Chặn điều hướng FE cho giảng viên và Docker Compose cho Postgres Sandbox

> "Đóng vai kỹ sư phần mềm. Yêu cầu điều chỉnh lại luồng điều hướng giao diện và thiết lập môi trường triển khai (deploy) cho Sandbox. Trả về mã nguồn trực tiếp, cực kỳ ngắn gọn, không giải thích dài dòng.
>
> 1. Xử lý luồng điều hướng giao diện (Frontend Router & Navigation):
> - Lỗi hiện tại: Giảng viên vẫn thấy menu và truy cập được vào trang làm bài (Workspace) của AI Lab và DA Lab giống hệt học viên, chỉ bị ẩn nút nộp bài. Thiết kế này sai ý đồ nghiệp vụ.
> - Xử lý:
>   + Sửa tệp cấu hình thanh điều hướng (Header/Sidebar): Ẩn hoàn toàn các mục "AI Lab" và "DA Lab" nếu tài khoản đăng nhập không có vai trò STUDENT.
>   + Sửa bộ định tuyến (Router): Bọc các đường dẫn /ai-labs và /da-labs bằng một lớp bảo vệ (ví dụ: StudentRouteGuard). Nếu tài khoản Giảng viên hoặc Quản trị viên cố tình truy cập bằng đường dẫn trực tiếp, tự động chuyển hướng (redirect) về trang tổng quan của giảng viên hoặc trang chủ, không cho phép kết xuất (render) giao diện làm bài.
>
> 2. Tự động hóa triển khai Postgres Sandbox (Docker Compose):
> - Vấn đề: Việc bật Sandbox bằng lệnh Docker thủ công không khả thi khi triển khai lên máy chủ thực tế.
> - Xử lý: Tạo tệp docker-compose.yml ở thư mục gốc của dự án. Khai báo các dịch vụ sau:
>   + Dịch vụ postgres-sandbox: Sử dụng image postgres (hoặc image tương ứng đang dùng), thiết lập các biến môi trường cần thiết, ánh xạ cổng và cấu hình giới hạn tài nguyên (cpus, mem_limit) để chống treo máy chủ khi học viên truy vấn dữ liệu lớn.
>   + Thêm một lệnh "docker:up": "docker-compose up -d" vào tệp package.json gốc để đồng bộ luồng khởi động."

### Điều tôi hiểu trước khi gọi AI

Header đang xếp ADMIN vào menu học viên, nên phải kiểm tra theo vai trò thật chứ không theo nhóm giao diện. `init.sql` cấp quyền theo tên DB `sales_v1`, nên không được đổi tên DB.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

- **Chặn route:** `FE/src/components/StudentRoute.tsx` mới, bọc 4 route lab.
- **Menu:** `Header.tsx` ẩn hai mục ở menu giảng viên; ở menu học viên chỉ hiện khi vai trò là `STUDENT`.
- **Dọn prop thừa:** bỏ prop `isStudent` thêm ở Việc 5, vì route đã chặn từ ngoài.
- **Sandbox:** `learning-hub/docker-compose.yml` với giới hạn 1 CPU, 512 MB, 200 pids, `temp_file_limit` và healthcheck; `learning-hub/package.json` có lệnh `docker:up`.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Chạy `docker:up`, kiểm tra trên sandbox thật:
- healthcheck báo healthy, giới hạn tài nguyên có hiệu lực;
- `lab_reader` đọc được dữ liệu, lệnh `CREATE TABLE` bị chặn;
- nộp DA SQL qua backend đạt ACCEPTED 10/10.

**Lỗi AI mắc phải:** container mới trùng tên với container cũ đang dừng, tạo từ compose cũ trong `BE/mock-data-service/sandbox/`. AI kiểm tra nhãn compose của container cũ, xác nhận nguồn gốc rồi đổi tên nó thành `-old` thay vì xoá, sau đó hỏi lại việc xoá.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều chưa chắc: việc chuyển hướng mới chỉ kiểm bằng typecheck, chưa thử trên trình duyệt.

---

## Việc 7: Tự động bật sandbox bằng một lệnh `npm run dev`

> "Đóng vai Senior Fullstack & DevOps Engineer. Hãy thực thi toàn bộ các yêu cầu sau trực tiếp vào mã nguồn, không giải thích lý thuyết dông dài:
>
> 1. Chặn điều hướng và bảo vệ route phía Frontend (React):
> - Thanh điều hướng (Header/Navbar): Ẩn hoàn toàn các mục "AI Lab" và "DA Lab" nếu người dùng không có vai trò STUDENT.
> - Route Guard: Tạo StudentRouteGuard (hoặc bọc Router). Nếu INSTRUCTOR hoặc ADMIN truy cập trực tiếp vào các đường dẫn /ai-labs, /ai-labs/:slug, /da-labs, /da-labs/:slug, lập tức chuyển hướng (redirect) về /instructor/queue (hoặc /), không cho hiển thị giao diện làm bài.
>
> 2. Tự động hóa 100% Docker Sandbox ở Local (Không bật thủ công, 1 lệnh ăn ngay):
> - Tạo tệp docker-compose.yml ở thư mục gốc chứa dịch vụ postgres-sandbox: dùng postgres:16-alpine (hoặc image phù hợp với cấu hình hiện tại), ánh xạ cổng tương ứng (vd 5433:5432), giới hạn tài nguyên (cpus: '1.0', memory: 512M) và khai báo healthcheck (pg_isready).
> - Viết một script tự động kiểm tra và khởi động container (ví dụ: scripts/ensure-sandbox.sh hoặc scripts/ensure-sandbox.js dùng Node.js):
>   + Kiểm tra Docker daemon và trạng thái container postgres-sandbox.
>   + Nếu chưa chạy: Tự động chạy docker compose up -d postgres-sandbox và chờ container sẵn sàng kết nối trước khi trả về.
>   + Nếu container đã chạy: Bỏ qua và tiếp tục.
>   + Nếu máy không bật Docker: In cảnh báo rõ ràng ra terminal nhưng không làm crash toàn bộ tiến trình nếu chạy các phần không dùng đến Postgres.
> - Cấu hình vào package.json gốc / backend: Tích hợp script này thành tiền điều kiện (predev hoặc gắn vào lệnh npm run dev). Đảm bảo lập trình viên chỉ cần gõ đúng 1 lệnh npm run dev duy nhất là tự động: kiểm tra/bật docker sandbox -> chạy mock server -> chạy backend -> chạy frontend.
>
> 3. Kiểm thử:
> - Đảm bảo toàn bộ test hiện có (493/493) vẫn xanh.
> - Typecheck cả Backend và Frontend đều sạch lỗi."

### Điều tôi hiểu trước khi gọi AI

Phần chặn route đã làm ở Việc 6, chỉ còn đích chuyển hướng. Dự án không có vai trò `INSTRUCTOR` mà dùng `TEACHER`, và hàng chờ giảng viên là `/teacher/review-queue`. Cổng sandbox phải giữ 55432 vì `sandbox_db_url` của mock đang trỏ vào đó.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

- **Chuyển hướng:** `StudentRoute.tsx` đưa giảng viên về `/teacher/review-queue`, ADMIN về `/`.
- **Compose:** đổi sang cú pháp `deploy.resources.limits`.
- **Script:** `scripts/ensure-sandbox.js` (Node, chạy trên cả Windows và Linux) không bao giờ thoát mã lỗi khác 0, để không chặn các dịch vụ khác.
- **Lệnh chung:** `learning-hub/package.json` có `predev`, và `dev` chạy mock, api, web bằng `concurrently`; `BE/package.json` cũng có `predev`.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Script sandbox, thử ở 3 trạng thái:** container đang chạy thì bỏ qua; container đã dừng thì khởi động lại và chờ healthy; không có Docker (bỏ `docker` khỏi PATH) thì in cảnh báo và thoát 0.
- **Một lệnh duy nhất:** `npm run dev` lên đủ 4 dịch vụ.
- **Test:** 493/493 xanh, typecheck sạch.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tên vai trò và đường dẫn trong đề có thể không khớp với code thật; phải đối chiếu rồi nói rõ cách hiểu.

---

## Việc 8: Dọn file compose cũ, container cũ và đưa package-lock vào git

> "Thực thi các quyết định kỹ thuật từ phần lưu ý, làm trực tiếp và không tạo bất kỳ file tài liệu/doc nào:
>
> 1. Xóa file: Xóa tệp BE/mock-data-service/sandbox/docker-compose.yml để tránh xung đột với docker-compose.yml ở thư mục gốc.
> 2. Dọn Docker container cũ: Chạy lệnh gỡ bỏ container da-sandbox-sales-v1-old (nếu còn tồn tại trên Docker daemon).
> 3. Quản lý git: Giữ lại và đưa file package-lock.json ở thư mục gốc learning-hub/ vào theo dõi git (git add package-lock.json).
> 4. Kiểm tra lại: Xác nhận lại trạng thái hệ thống sau khi dọn dẹp, đảm bảo lệnh npm run dev vẫn khởi động đủ 4 dịch vụ bình thường."
>
> "làm đi"

### Điều tôi hiểu trước khi gọi AI

`init.sql` vẫn được compose ở thư mục gốc dùng nên phải giữ. Nếu thiếu `package.json` gốc thì `package-lock.json` không có tác dụng.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

- `git rm` file compose cũ.
- Container `-old` đã không còn trên Docker. Nhật ký sự kiện Docker cho thấy nó bị xoá lúc 18:00:22, không phải do lệnh nào trong phiên.
- `git add` file `package-lock.json`, và theo chỉ dẫn "làm đi", thêm cả `package.json` gốc.
- Không sửa `AI_WORKLOG.md` Day 22 dù có nhắc tới file cũ, đúng yêu cầu không đụng tài liệu.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

`npm run dev` chạy lại từ đầu: sandbox healthy, mock 200, api 401 khi chưa đăng nhập, web 200.

**Lỗi AI mắc phải:** lệnh `grep -r` đầu tiên quét cả `node_modules` lồng nhau nên quá thời gian chờ. AI dừng lệnh đó và dùng công cụ Grep có loại trừ `node_modules`.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: không kết luận "đã gỡ" khi đối tượng đã biến mất từ trước; tra nhật ký để biết ai gỡ và gỡ lúc nào.

---

## Việc 9: Rà soát bảo mật và QA toàn bộ learning-hub, chỉ báo cáo

> "Đóng vai trò là một Principal Security Engineer kết hợp Lead QA Auditor. Hãy thực hiện một đợt rà soát và kiểm thử tĩnh/động toàn diện trên toàn bộ mã nguồn của dự án trong thư mục `learning-hub/`.
>
> MỤC TIÊU: Đóng vai kẻ tấn công và người dùng khó tính nhất để "vạch lá tìm sâu", phát hiện mọi lỗ hổng bảo mật, lỗi logic nghiệp vụ, góc khuất rò rỉ dữ liệu và sự bất nhất trong trải nghiệm UI/UX.
>
> QUY TẮC BẮT BUỘC:
> 1. TUYỆT ĐỐI KHÔNG TỰ Ý SỬA CODE. Chỉ đọc mã nguồn, phân tích luồng và xuất ra báo cáo danh sách lỗi.
> 2. Phân loại lỗi theo 4 cấp độ: [CRITICAL], [HIGH], [MEDIUM], [LOW].
> 3. Mỗi lỗi bắt buộc phải chỉ rõ: Tên tệp & dòng code (nếu có), Kịch bản phát sinh lỗi (How to reproduce), Rủi ro tiềm ẩn và Hướng đề xuất xử lý.
>
> Hãy rà soát kỹ lưỡng qua 5 khía cạnh sau:
>
> ---
>
> ### 1. Phân quyền, Điều hướng & Lỗ hổng RBAC (Auth & Access Control)
> - Rà soát toàn bộ Controller phía Backend (NestJS): Có endpoint nào bị sót Guard (`JwtAuthGuard`, `RolesGuard`, `StudentOnlyGuard`) không?
> - Lỗ hổng IDOR / BOLA: Một học viên có thể xem/sửa bài nộp (`ai_lab_submissions`, `da_lab_submissions`, `submissions`) của học viên khác bằng cách đổi ID trong URL/payload không?
> - Giảng viên (`TEACHER`) và Quản trị viên (`ADMIN`): Có route nào họ vô tình bị chặn chức năng cần thiết, hoặc ngược lại, có thể can thiệp trái phép vào bài nộp của học viên không?
> - Phía Frontend (React Router & UI):
>   + Kiểm tra toàn bộ router, Header, Sidebar: Còn trang nào hoặc nút bấm nào lộ diện cho sai đối tượng không?
>   + Nếu người dùng chưa đăng nhập hoặc có role không hợp lệ nhập trực tiếp URL trên thanh địa chỉ trình duyệt, cơ chế Redirect có xử lý triệt để không hay vẫn render ngầm component rồi mới đá ra?
>
> ### 2. Bảo mật dữ liệu & Cơ chế chặn mã nhạy cảm (Security Guards & Regex)
> - Kiểm tra tính bền vững của bộ lọc chặn API Key (`NoSecretsPipe` và hàm validate FE):
>   + Có thể bypass bộ lọc regex này bằng các biến thể không? (Ví dụ: key nằm trong JSON lồng sâu, key bị ngắt dòng, key dùng dấu ngoặc kép, base64 encode, hoặc key của các provider mới nổi)?
>   + Grader có bao giờ vô tình log toàn bộ payload chứa API key bị chặn ra file log/console của server không?
> - Nguy cơ lộ đáp án (Data Leakage):
>   + Endpoint xem trước đề bài (`GET /ai-labs/:slug` hoặc danh sách lab) có vô tình trả về `ground_truth_answer` hoặc toàn bộ câu hỏi ẩn của `evaluation_set` về Frontend không? Kiểm tra payload mạng trả về học viên.
>
> ### 3. Môi trường Thực thi & Tấn công Sandbox (Sandbox Resilience)
> - Postgres Sandbox (DA Lab):
>   + Có truy vấn SQL độc hại nào vượt qua được lớp regex chặn (DROP, DELETE, ALTER) bằng cách dùng comment (`--`, `/* */`), sub-query, hoặc hàm hệ thống (vd: `pg_sleep()`, `COPY TO`, gọi system shell) để chiếm quyền hoặc làm treo container không?
>   + Cơ chế giới hạn tài nguyên (timeout, cpus, memory 512M): Nếu một học viên gửi truy vấn đệ quy hoặc cartesian product (JOIN vô tận), Postgres sandbox có làm treo máy chủ host không?
> - Lỗi kết nối dịch vụ (Failure Handling):
>   + Nếu mock data-service phản hồi chậm (slow network) hoặc trả về mã lỗi 500, cơ chế cache 60s và xử lý 502/503 có bị sập cả server Backend (unhandled promise rejection) không?
>
> ### 4. Tính đúng đắn của Thuật toán Chấm điểm (Scoring Integrity & Edge Cases)
> - Tính tất định (Determinism): Có bất kỳ yếu tố nào (như thứ tự Object keys trong JSON stringify, timezone máy chủ, hoặc bộ sinh số ngẫu nhiên) làm cho cùng một prompt/config sinh ra điểm khác nhau giữa các lần chạy không?
> - Đánh giá ngân sách (Cost/Latency Penalty):
>   + Nếu học viên nộp prompt rỗng, prompt siêu dài (vượt 6000 ký tự), hoặc config có giá trị âm (`temperature = -1`, `maxTokens = 0`), backend xử lý ra sao? Có crash grader không?
>
> ### 5. Giao diện người dùng & Trải nghiệm thực tế (UI/UX Edge Cases)
> - Trạng thái tải và báo lỗi (Loading / Error States):
>   + Khi mất kết nối Sandbox hoặc Mock Service, giao diện có hiển thị Empty State/Toast rõ ràng không, hay bị màn hình trắng (White Screen of Death / Unhandled Runtime Error)?
> - Trạng thái nộp bài (Double Submit):
>   + Nút "Chạy & Đánh giá" có bị disable khi đang gửi request không? Nếu học viên click liên tục nhiều lần thì hệ thống có tạo ra hàng loạt bản ghi trùng lặp trong DB không?
>
> ---
>
> XUẤT BÁO CÁO:
> Trình bày kết quả rà soát dưới dạng danh mục rõ ràng, chỉ ra chính xác các điểm yếu đang tồn tại trong hệ thống."

### Điều tôi hiểu trước khi gọi AI

Không sửa code. Mỗi lỗi nặng phải được tái hiện bằng request thật nếu làm được, và phải dọn mọi dữ liệu tạm.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Không sửa file. Báo cáo gồm 18 lỗi: 1 CRITICAL, 4 HIGH, 7 MEDIUM, 6 LOW. Các lỗi chính đã tái hiện:

| Mức | Vấn đề | Bằng chứng |
|---|---|---|
| CRITICAL C1 | Học viên xem được đáp án quiz khi bài còn đang làm | `GET /quiz/:id/review?policy=IMMEDIATE` trả 200 kèm `isCorrect: true` |
| HIGH H1 | Người chưa đăng nhập chạy được code Python | Request không token chạy 2,5 giây trong container |
| HIGH H2 | `POST /hints/seed` không có guard | Đọc code; không chạy thử vì là thao tác ghi |
| HIGH H3 | Nhồi từ khóa vẫn được điểm AI Lab cao | Prompt vô nghĩa 123 ký tự đạt 23.9/25 |
| HIGH H4 | Sandbox mở ra `0.0.0.0` với superuser mật khẩu mặc định | `docker port` và `rolsuper = t` |
| MEDIUM | Vượt lớp chặn SQL bằng chuỗi `E''`; `pg_stat_activity` lộ câu SQL của session khác; không có rate limit; lỗ hổng contest; SQL không được lưu; quyền ADMIN lệch giữa BE và FE; bộ lọc key bị vượt | `set_config` được thực thi trên sandbox thật; danh sách biến thể key lọt qua |

Báo cáo cũng liệt kê các điểm đã kiểm tra và không có lỗi: IDOR, path traversal của Tester Lab, rò rỉ đáp án AI Lab, đầu vào sai, tính tất định, XSS.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

**Lỗi AI mắc phải:** lần thử C1 đầu tiên dùng `testId` không hợp lệ nên nhận 400 ngay ở bước bắt đầu bài thi. AI đọc lại service, lấy đúng `testId` mà FE dùng rồi mới tái hiện được.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tham số do client gửi lên mà quyết định quyền xem dữ liệu là một dạng lỗ hổng phân quyền, dù endpoint đã có guard.

---

## Việc 10: Sửa 18 lỗi từ báo cáo rà soát

> "Đóng vai Principal Fullstack & Security Engineer. Hãy tiếp nhận báo cáo kiểm toán bảo mật và QA gồm 18 lỗi (C1, H1-H4, M1-M7, L1-L6) trong learning-hub/.
>
> Nhiệm vụ của bạn là sửa triệt để tất cả 18 lỗi này theo đúng thứ tự ưu tiên, bảo đảm toàn bộ 493 test hiện tại tiếp tục xanh, viết thêm unit/integration test cho các lỗ hổng đã vá, và kiểm tra xem có phát sinh lỗi mới nào không.
>
> YÊU CẦU THỰC THI CHI TIẾT:
>
> === NHÓM 1: BẢO MẬT PHÂN QUYỀN & CHỐNG GIAN LẬN (C1, H1, H2, M4, M6) ===
> 1. C1 (CRITICAL - Lộ đáp án Quiz):
>    - quiz.controller.ts & quiz.service.ts: Bỏ hoàn toàn việc đọc `policy` từ query string client gửi lên. Đọc policy trực tiếp từ cấu hình bài thi lưu trong DB.
>    - Chặn tuyệt đối: Khi bài thi đang IN_PROGRESS, không trả về `isCorrect`, `explanation` hay đáp án chuẩn ở bất kỳ endpoint nào.
> 2. H1 (HIGH - Chạy code Python vô tội vạ):
>    - exercise.controller.ts: Gắn JwtAuthGuard cho POST /exercises/:slug/run và POST /exercises/check-syntax.
>    - Thêm giới hạn số tiến trình container chạy đồng thời trong code-runner.helper.ts.
> 3. H2 (HIGH - Seed hint không guard):
>    - hint.controller.ts: Thêm @UseGuards(JwtAuthGuard, RolesGuard) và @Roles('ADMIN') cho POST /hints/seed và bảo vệ GET /hints/sample-30.
> 4. M4 (MEDIUM - Lỗ hổng Contest):
>    - contest.controller.ts & contest-submission.service.ts: Bắt buộc đăng nhập (JwtAuthGuard) và kiểm tra danh sách đăng ký trước khi nộp bài. Áp dụng StudentOnlyGuard cho route nộp bài. Với quiz trong contest, không trả đáp án chi tiết khi contest chưa kết thúc.
> 5. M6 (MEDIUM - Lệch quyền ADMIN):
>    - Thống nhất ma trận quyền giữa BE và FE. Cập nhật AuthUser.role trên FE hỗ trợ ADMIN. Cấp quyền cho ADMIN truy cập các trang quản trị/giảng viên (hàng chờ chấm, danh sách đề) thay vì bị đẩy vào menu học viên.
>
> === NHÓM 2: CÔ LẬP SANDBOX & CHẶN SQL INJECTION (H4, M1, M2) ===
> 6. H4 (HIGH - Lộ cổng Sandbox & Superuser ra Internet):
>    - docker-compose.yml: Đổi cấu hình port Postgres sandbox thành bind local duy nhất: '127.0.0.1:55432:5432'.
>    - Chuyển mật khẩu sandbox_owner và lab_reader sang biến môi trường (có fallback an toàn ở local), không để lộ mật khẩu mặc định khi build production.
> 7. M1 (MEDIUM - Bypass SQL Guard bằng escape string E''):
>    - sql-guard.ts: Cải tiến logic tách chuỗi và comment. Chuẩn hóa chuỗi trước khi kiểm tra (xử lý escape sequences E'...\'...' và thứ tự strip comment/literal chuẩn xác) để chặn đứng các hàm bị cấm như set_config, pg_sleep kể cả khi bị bọc trong literal.
> 8. M2 (MEDIUM - Soi trộm truy vấn qua pg_stat_activity):
>    - init.sql: Thu hồi (REVOKE) quyền SELECT trên pg_stat_activity và các view hệ thống trong schema pg_catalog đối với role lab_reader.
>    - Thêm pg_stat_activity vào blacklist của sql-guard.ts như một lớp phòng thủ thứ hai.
>
> === NHÓM 3: BỘ LỌC BẢO MẬT & ĐÁNH GIÁ CHẤM ĐIỂM (H3, M3, M7, L4, L5) ===
> 9. H3 (HIGH - Nhồi từ khóa gian lận điểm AI Lab):
>    - ai-lab-grader.service.ts: Bổ sung lớp kiểm tra cấu trúc prompt: Phạt nặng hoặc từ chối chấm nếu prompt chỉ là một chuỗi từ khóa rời rạc không thành câu hoàn chỉnh, độ dài bất thường (< 20 từ nhưng chứa 8 từ khóa).
>    - Ẩn từ khóa regex chính xác khỏi phần mô tả đề bài trên Frontend.
> 10. M7 & L5 (MEDIUM/LOW - Lỗ hổng bộ lọc API Key & Lệch FE/BE):
>     - Đưa toàn bộ SECRET_PATTERNS vào một file dùng chung (libs/shared hoặc common). Cả FE và BE cùng import từ file này.
>     - Chuẩn hóa chuỗi trước khi quét: Xóa ký tự zero-width, gộp khoảng trắng thừa.
>     - Bổ sung patterns: Stripe (sk_live_), Groq (gsk_), xAI (xai-), Slack (xoxb-), Azure (32 hex token). Quét đệ quy JSON payload không giới hạn độ sâu.
> 11. M3 & L6 (MEDIUM/LOW - Rate Limiting & Chống Spam):
>     - Cài đặt @nestjs/throttler toàn cục. Giới hạn chặt hơn cho /auth/login, /coach/chat, /ai-labs/:slug/submit, /da-labs/:slug/run.
>     - Chống spam tạo submission vô tận: Cập nhật hoặc lưu phiên bản cao nhất, ghi đè submission đang chấm dở nếu có.
> 12. L4 (LOW - Tính tất định phụ thuộc Catalog):
>     - Đưa hash của bảng giá ai-lab.catalog.ts vào quá trình sinh seed trong ai-lab-grader.service.ts.
>
> === NHÓM 4: BỔ SUNG NGHIỆP VỤ & TRẢI NGHIỆM FRONTEND (M5, L1, L2, L3) ===
> 13. M5 (MEDIUM - Lưu bài nộp SQL DA Lab & Giao diện giảng viên):
>     - da-labs.service.ts: Lưu bài nộp SQL thành công vào da_lab_submissions với trường `type: 'SQL'`.
>     - Tạo endpoint cho giảng viên xem danh sách bài nộp của học viên ở cả DA Lab và AI Lab.
> 14. L1 (LOW - Thông báo lỗi 503 chính xác):
>     - dataset-integration.service.ts: Phân biệt rõ ECONNREFUSED ("Máy chủ dữ liệu giả lập chưa được bật") và ETIMEDOUT ("Máy chủ dữ liệu phản hồi quá lâu").
> 15. L2 (LOW - Xử lý 401 & Token hết hạn ở FE):
>     - configAxios.ts: Thêm Interceptor bắt lỗi 401, tự động xóa token/thông tin user trong localStorage và điều hướng về trang /login.
>     - Tránh tin tưởng tuyệt đối vào role từ localStorage: xác thực lại với token khi khởi tạo app.
> 16. L3 (LOW - Race condition khi đổi bài lab):
>     - AiLabWorkspacePage.tsx: Thêm cleanup flag hoặc AbortController trong useEffect để tránh việc dữ liệu bài cũ ghi đè lên bài mới khi chuyển trang nhanh.
>
> === KIỂM THỬ VÀ BÁO CÁO ===
> - Chạy toàn bộ test suites (`npm test` ở cả BE và FE). Viết test bổ sung cho các lỗ hổng vừa sửa.
> - Chạy typecheck ở cả BE và FE.
> - Xuất báo cáo ngắn gọn:
>   1. Bảng tổng kết trạng thái fix của 18 lỗi (từ C1 đến L6).
>   2. Số lượng bài test mới và tổng số test xanh hiện tại.
>   3. Báo cáo các lỗi mới, rủi ro hồi quy (regression) hoặc điểm bất thường phát sinh trong quá trình fix (nếu có)."

### Điều tôi hiểu trước khi gọi AI

- **Quiz:** hệ thống không có collection bài thi, nên policy được chốt vào bản ghi lượt làm bài lúc bắt đầu.
- **Contest:** leaderboard hiện điểm trực tiếp, nên chỉ ẩn response thì vẫn dò được đáp án; cần giới hạn số lần nộp quiz.
- **Rate limit:** cả lớp thường dùng chung một NAT, nên phải đếm theo user chứ không theo IP.
- **File dùng chung:** đặt ở `shared/` thư mục gốc sẽ làm thay đổi `rootDir` và cấu trúc thư mục build của BE.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

- **M1:** khi viết lại bộ quét SQL, AI phát hiện thêm hai đường vượt cùng loại là `"pg_sleep"(…)` và `U&"…"`, và chặn luôn.
- **M4:** AI thêm quy tắc mỗi câu quiz chỉ nộp một lần trong lúc thi, vì leaderboard trực tiếp.
- **M7/L5:** file mẫu dùng chung đặt ở `BE/src/common/security/`; FE import qua `server.fs.allow` của Vite.
- **L2:** AI thêm `GET /auth/me` để FE xác thực lại vai trò khi khởi động.
- **FE test:** FE chưa có test runner, AI thêm Vitest.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Nhóm | File chính |
|---|---|
| Phân quyền | `quiz-attempt.schema.ts`, `quiz.service.ts`, `quiz.controller.ts`, `exercise.controller.ts`, `hint.controller.ts`, `contest.controller.ts`, `contest-submission.service.ts`, `common/auth/roles.ts`, các controller coach, judge, leaderboard; FE: `types/auth.ts`, `App.tsx`, `Header.tsx`, `StudentRoute.tsx`, `LoginPage.tsx`, `ProfilePage.tsx`, `ContestExamWorkspace.tsx` |
| Sandbox | `docker-compose.yml` bind `127.0.0.1`, `docker-compose.prod.yml` mới, `sandbox/02-lab-reader.sh` mới, `init.sql`, `.gitattributes`, `sql-guard.ts` viết lại |
| Bộ lọc và chấm | `common/security/secret-patterns.ts` dùng chung, `secret-guard.ts`, `ai-lab-grader.service.ts`, `initial-ai-labs.ts` (gợi ý chỉ mô tả ý định), `ai-labs.service.ts` |
| Rate limit, chống spam | `common/security/app-throttler.guard.ts`, `app.module.ts`, `common/helper/concurrency-limiter.ts`, `code-runner.helper.ts`, hai schema bài nộp |
| Nghiệp vụ, FE | `da-labs.service.ts`, `da-labs.controller.ts`, endpoint giảng viên, `TeacherLabSubmissionsPage.tsx`, `auth.service.ts` và `auth.controller.ts` (`/auth/me`), `common/authSession.ts`, `configAxios.ts`, `AiLabWorkspacePage.tsx` |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Test:** BE từ 493 lên 587; FE 10 test mới; typecheck sạch; `vite build` qua.
- **Test cũ phải sửa có chủ đích:** 3 test quiz (đổi chữ ký hàm `reviewAttempt`) và 2 test quiz contest (response không còn trả điểm, chuyển sang kiểm tra điểm được lưu).
- **Kiểm thử động trên hệ thống thật:**
  - C1: 400.
  - H1: 401.
  - H2: không token 401, giảng viên 403.
  - M1 và M2: bị REJECTED.
  - H3: prompt nhồi từ khóa FAILED.
  - M3: request thứ 11 bị 429.
  - L6: nộp 2 lần vẫn chỉ có 1 bản ghi.
- **Sandbox dựng lại:** `lab_reader` bị từ chối khi đọc `pg_stat_activity`.

**Lỗi AI mắc phải:**
- Hai lần chỉnh file bằng Python làm mất dấu `\` trong regex. Một lần biến `\b` thành ký tự backspace, khiến lớp chặn từ khóa SQL âm thầm vô hiệu. Phát hiện nhờ `tsc` và đọc lại file.
- Công cụ tự đổi `​` thành ký tự vô hình thật trong regex và trong test. AI quét toàn bộ file đã sửa rồi ghi lại bằng `chr(92)`.
- Lần kiểm thử M1 đầu tiên tưởng là lớp chặn bị lọt, nhưng thực ra script gửi sai câu SQL (mất `\`). Gửi lại đúng câu qua file JSON thì bị chặn.
- Heredoc dài trong bash bị vỡ. AI chuyển sang ghi script ra file trong scratchpad rồi chạy.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:** sau mỗi lần chỉnh code bằng script, phải đọc lại đúng dòng có ký tự escape; một regex sai vẫn biên dịch được và test có thể không bắt được.

**Điều chưa chắc:**
- Rate limit lưu trong bộ nhớ, chạy nhiều instance thì cần Redis.
- Máy khác phải dựng lại volume sandbox thì phần thu hồi quyền mới có hiệu lực.

---

## Việc 11: Xử lý 5 vấn đề còn tồn đọng sau đợt sửa

> "Đóng vai Principal Fullstack & Security Engineer. Từ báo cáo rà soát và các điểm cấn phát sinh ở lượt sửa trước, hãy xử lý triệt để 5 vấn đề kỹ thuật và trải nghiệm người dùng còn tồn đọng sau đây. Yêu cầu sửa trực tiếp vào mã nguồn, giữ toàn bộ 597 test tiếp tục xanh, viết thêm test mới và typecheck sạch 100%.
>
> 1. Nâng cấp bộ lọc mã bí mật (Secret Guard) & Dọn dẹp ký tự lạ:
> - Base64 Secret Detection: Bổ sung bước giải mã các chuỗi có định dạng Base64 hợp lệ trong prompt/config trước khi chạy qua bộ quét regex. Nếu chuỗi sau khi giải mã chứa các mẫu key cấm (sk-, gsk_, xai-, AIza...), lập tức chặn và báo lỗi 400.
> - Dọn dẹp tệp FE/src/pages/QuizTakingPage.tsx: Xóa triệt để ký tự vô hình (zero-width character) ở dòng 78 hoặc các vị trí liên quan.
>
> 2. Khắc phục lỗ hổng bypass Rate Limiting qua Token rác:
> - Tại Guard / Interceptor xử lý rate limit (Throttler):
>   + Nếu có header Authorization, bắt buộc phải giải mã và xác thực chữ ký (verify) của JWT qua JwtService.
>   + Nếu token hợp lệ: Lấy user.id (sub) làm định danh đếm.
>   + Nếu không có token, token hết hạn, hoặc token giả/sai chữ ký: Tuyệt đối không lấy chuỗi rác làm key đếm, mà bắt buộc fallback về địa chỉ IP của client (req.ip).
>
> 3. Cải thiện trải nghiệm người dùng (UX) cho Contest và Playground:
> - Contest Quiz Result (FE): Tại màn hình tổng kết kết quả contest, nếu bài nộp là quiz chưa kết thúc, thay thế con số "0 điểm" bằng trạng thái/nhãn rõ ràng: "Đang chờ công bố điểm khi contest kết thúc" (hoặc "Pending contest end"), không gây hiểu lầm là bị điểm 0.
> - Playground Guest Redirect (FE): Khi khách chưa đăng nhập bấm nút "Chạy" hoặc "Kiểm tra cú pháp", hiển thị thông báo toast màu vàng: "Vui lòng đăng nhập để thực thi code trên hệ thống" trước khi điều hướng sang trang /login.
>
> 4. Khôi phục cơ chế ML Experiment Tracking cho AI Lab:
> - Thay vì chỉ ghi đè duy nhất 1 bản ghi làm mất dấu lịch sử thử nghiệm, cập nhật collection ai_lab_submissions:
>   + Giữ lại tối đa 5 lần chạy gần nhất dưới dạng mảng (capped history: [runManifest, promptHash, score, createdAt]).
>   + Vẫn duy trì các trường tóm tắt: bestQualityScore, latestSubmission, totalAttempts để phục vụ truy vấn nhanh.
>   + Đảm bảo không phình to cơ sở dữ liệu vô hạn mà học viên vẫn xem lại được lịch sử 5 lần thử nghiệm gần nhất trên UI.
>
> 5. Đồng bộ cấu hình biến môi trường Sandbox (DRY Config):
> - Tập trung hóa LAB_READER_PASSWORD trong .env và .env.example.
> - Cập nhật luồng cấu hình để chuỗi kết nối Sandbox (kể cả mock service URL) tự động nội suy biến mật khẩu này từ process.env.LAB_READER_PASSWORD (kèm giá trị mặc định an toàn cho môi trường test local), tránh việc đổi một nơi làm lệch kết nối nơi khác.
>
> BÁO CÁO KẾT QUẢ:
> - Báo cáo trạng thái xử lý của 5 mục trên.
> - Tổng số test hiện tại (BE + FE) và xác nhận kết quả kiểm tra typecheck.
> - Liệt kê các file đã chỉnh sửa."
>
> "tiep tuc di toi lko an xoa claude"

### Điều tôi hiểu trước khi gọi AI

- **ZWJ ở dòng 78:** hai ký tự này là phần nối của emoji 🧑‍💻 và 👨‍🏫 trong regex bỏ emoji đầu tiêu đề. Xoá hẳn sẽ làm sót ký tự ẩn ở đầu tiêu đề, nên đổi thành escape `‍` tường minh.
- **Playground:** không có nút "Kiểm tra cú pháp" riêng; bước này chạy bên trong "Nộp bài".
- **JWT secret:** guard rate limit phải dùng đúng secret dùng để ký token, nếu không mọi token thật sẽ bị coi là giả.
- **Phiên bị ngắt:** phiên bị ngắt giữa chừng ở mục 1; chỉ dẫn thứ hai là để làm tiếp. AI kiểm tra lại trạng thái file trước khi làm tiếp.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

| Mục | File chính | Ghi chú |
|---|---|---|
| 1 | `secret-patterns.ts`, `QuizTakingPage.tsx` | Giải mã base64 (cả URL-safe, tối đa 2 lớp), chỉ quét khi kết quả là văn bản đọc được; dùng `atob`/`TextDecoder` nên vẫn dùng chung với FE |
| 2 | `app-throttler.guard.ts`, `common/auth/jwt-secret.ts` mới, `jwt.strategy.ts`, `auth.module.ts` | Verify chữ ký JWT; token không hợp lệ thì đếm theo IP; JWT secret gom về một chỗ dùng chung cho 3 nơi |
| 3 | `contestResultFormat.ts` mới, `ContestExamWorkspace.tsx`, `Toast.tsx` (kiểu `warning`), `CodePlaygroundPage.tsx` | Nhãn "Đang chờ công bố điểm khi contest kết thúc"; toast vàng rồi mới chuyển sang `/login` |
| 4 | `ai-lab-submission.schema.ts`, `ai-labs.service.ts`, `aiLabHistory.ts` mới, `AiLabWorkspacePage.tsx`, `types/aiLab.ts`, trang và API giảng viên | `history` cắt bằng `$push` + `$slice: -5`; thêm `totalAttempts`, `bestQualityScore`, `latestSubmission`; chuyển đổi bản ghi cũ; UI có nút Xem và Dùng lại |
| 5 | `common/config/sandbox-env.ts` mới, `mock-data-service/server.ts`, `.env.example` mới, `.env` local, comment trong `docker-compose.yml` | Một nguồn là `learning-hub/.env`; mock dựng `sandbox_db_url` từ biến môi trường, mã hóa ký tự đặc biệt trong mật khẩu |

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

- **Test:** BE 610/610 và FE 16/16, tổng 626 (trước là 597); typecheck sạch; `vite build` qua.
- **Test chống lệch cấu hình:** báo đỏ nếu giá trị mặc định ở compose, `.env.example` và code khác nhau.
- **Kiểm thử động trên hệ thống thật:**
  - key `sk-` mã hóa base64 bị 400;
  - chạy 6 lần thì DB giữ đúng 5 lần mới nhất, `totalAttempts=6`;
  - 11 token rác khác nhau cho 10 lần 401 rồi 429, học viên thật vẫn 200;
  - chạy SQL qua URL dựng từ `.env` thành công.
- **Kiểm tra trước khi sửa:** AI kiểm tra lại regex dòng 78 cho kết quả giống hệt trước và sau khi đổi.

**Lỗi AI mắc phải:**
- Công cụ lại tự đổi `�` thành ký tự thật; AI ghi lại bằng `chr(92)` như ở Việc 10.
- Lệnh in tiếng Việt bằng Python lỗi do bảng mã console Windows, làm script dừng sau khi đã tạo tài khoản tạm. AI chạy lại với `PYTHONIOENCODING=utf-8`; script có bước xoá tài khoản ở `finally` nên tài khoản đã được dọn.
- Tiến trình cũ từ phiên bị ngắt vẫn giữ 3 cổng. AI xác nhận đúng là tiến trình của dự án rồi mới tắt.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

**Điều học được:**
- Một ký tự "lạ" có thể đang có chức năng; phải hiểu nó làm gì trước khi xoá.
- Mọi script kiểm thử có tạo dữ liệu đều phải dọn trong `finally`.

**Điều chưa chắc:**
- Base64 lồng 3 lớp trở lên vẫn lọt.
- Giao diện contest và Playground chưa được bấm thử trên trình duyệt.

---

## Việc 12: Cập nhật AI Work Log Ngày 23

> "cập nhật AI work log cho day 23 (ghi đè lên đúng format, mỗi việc đều ghi prompt của tôi) nhớ đúng format nha"

### Điều tôi hiểu trước khi gọi AI

Ghi đè nội dung Day 22 bằng Day 23, giữ đúng cấu trúc các ngày trước: bảng thông tin chung, mục lục, rồi mỗi việc có prompt nguyên văn và các mục con. Bản Day 22 vẫn còn trong lịch sử Git.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Ghi đè `AI_WORKLOG.md`. Nguyên văn prompt của từng việc được trích từ hội thoại; số liệu test và kết quả kiểm thử lấy từ kết quả chạy thật trong ngày.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều chưa chắc:
- Số 1 chưa xác nhận route evaluation set v1.1.
- Toàn bộ thay đổi Day 23 chưa được commit và chưa mở PR.
