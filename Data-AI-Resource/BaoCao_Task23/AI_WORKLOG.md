# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 23
## DỰ ÁN: CYBERSOFT DATA & AI LAB — PHÂN HỆ AI GỢI Ý BÀI TẬP THEO DATASET (EXERCISE GENERATOR v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 23 — AI gợi ý bài tập theo dataset (`cybersoft-exercise-generator`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-01  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước vào Ngày 23 của Tuần 5 (Sản phẩm hóa), phân hệ CyberSoft Data & AI Lab cần giải quyết bài toán tự động hóa soạn thảo bài tập thực hành sư phạm dựa trên các bộ dữ liệu sẵn có trên Portal:
1. **Rủi ro ảo giác cấu trúc (Schema Hallucination Risk)**: Khi yêu cầu các mô hình ngôn ngữ lớn (LLM) sinh bài tập phân tích dữ liệu, AI thường xuyên tự suy diễn ra các cột không tồn tại trong bảng (ví dụ: bịa ra cột `discount`, `tax` trong bảng `retail_sales_v1` hoặc nhầm lẫn `attendance_status` thay vì `status` trong `hr_attendance_v1`). Nếu không có cơ chế Grounding chặt chẽ, học viên sẽ không thể thực thi được câu truy vấn.
2. **Nguy cơ vi phạm tiêu chí nghiệm thu DoD (Auto-Publish Hazard)**: Tiêu chí nghiệm thu cốt lõi đặt ra yêu cầu tuyệt đối: **"Không tự publish nội dung AI"**. Nếu hệ thống tự động lưu bài tập vào ngân hàng chính thức ngay sau khi sinh mà không có bước phê duyệt tường minh của Giảng viên con người, các câu hỏi sai lệch hoặc chất lượng kém sẽ bị lọt ra môi trường học tập.
3. **Mù mờ về tính khả thi của đáp án (Solution Feasibility Blindness)**: AI có thể viết ra một câu lệnh SQL trông rất hợp lý về mặt cú pháp nhưng khi chạy trên dữ liệu thực tế lại trả về tập kết quả rỗng (0 dòng) hoặc sai lệch logic nghiệp vụ. Cần một hộp cát thực thi tự động (Feasibility Sandbox) để xác minh $100\%$ các test cases trước khi đưa ra cho Giảng viên duyệt.
4. **Trùng lặp và mất cân đối độ khó (Duplication & Cognitive Drift)**: Khi sinh nhiều bài tập, AI có xu hướng lặp lại các dạng bài quen thuộc và gắn mác độ khó tùy tiện, không phản ánh đúng Thang đo nhận thức Bloom (Bloom's Taxonomy).

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI (HUMAN-IN-THE-LOOP)

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning, structured schema generation).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI giữ vai trò trợ lý tăng tốc xây dựng bản nháp (Drafting Assistant), đề xuất các ý tưởng bài tập và gợi ý mã khung starter code.
  * Kỹ sư con người giữ toàn quyền thiết kế hệ thống kiểm soát chất lượng: Xây dựng Schema Reader tiêm ngữ cảnh thực tế, thiết lập Pipeline kiểm định 3 lớp (Lọc trùng lặp Jaccard, Hiệu chuẩn Bloom, Thực thi SQLite in-memory), và cài đặt Cổng kiểm soát Access Gatekeeper ném lỗi HTTP `403 Forbidden` để ngăn chặn tuyệt đối việc tự động xuất bản.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề xuất ban đầu của AI | Phân tích Rủi ro & Điểm bất hợp lý | Quyết định & Tinh chỉnh của Kỹ sư Con người |
| :---: | :--- | :--- | :--- |
| **01** | Cho phép AI tự động lưu các bài tập vừa sinh vào ngân hàng chính thức với trạng thái `published`. | Vi phạm trực tiếp điều kiện nghiệm thu DoD: "Không tự publish nội dung AI". Nguy cơ đưa học liệu lỗi tới học viên. | **Bác bỏ & Khóa cứng Gatekeeper**: Mọi bài tập do AI sinh ra bắt buộc mang trạng thái mặc định `draft_pending_review`. Cố tình gọi publish khi chưa duyệt sẽ bị API chặn với lỗi HTTP `403 Forbidden` (`AUTO_PUBLISH_BLOCKED`). |
| **02** | Chỉ gửi tên bảng dữ liệu vào prompt mà không gửi danh sách các cột và kiểu dữ liệu cụ thể. | AI bị ảo giác nghiêm trọng, tự bịa ra các cột không có thật trong bảng dữ liệu thực tế (tỷ lệ lỗi lên tới $38.5\%$). | **Xây dựng SchemaReaderService**: Quét tệp CSV thực tế, trích xuất chính xác tên cột, kiểu dữ liệu suy diễn, non-null count và 3-4 giá trị mẫu đại diện tiêm vào prompt ngữ cảnh. |
| **03** | Đánh giá tính khả thi của đáp án bằng cách nhờ AI đọc lại câu lệnh SQL và tự xác nhận xem có đúng không. | Hiện tượng "AI tự kiểm tra AI" rất dễ dính bẫy Confirmation Bias, không phát hiện được lỗi dữ liệu thật. | **Xây dựng Feasibility Sandbox trên SQLite**: Nạp trực tiếp tệp CSV vào bảng SQLite in-memory (`:memory:`), chạy câu truy vấn thật và so sánh kết quả tự động với từng test case. |
| **04** | Kiểm tra trùng lặp bằng cách so sánh chuỗi chính xác 100% (`string_a == string_b`). | Bỏ lọt các câu hỏi bị trùng lặp về mặt ngữ nghĩa nhưng chỉ thay đổi vài từ nối hoặc đổi tên biến, dẫn đến ngân hàng câu hỏi nhàm chán. | **Ứng dụng N-gram Jaccard Similarity**: Kết hợp $40\%$ Unigram và $60\%$ Bigram trên tập từ khóa được chuẩn hóa, phát hiện và cảnh báo mọi bài tập có độ trùng $\ge 70\%$. |
| **05** | Cho phép trường chuẩn đầu ra `learning_outcomes` là tùy chọn (`optional`), có thể để trống. | Vi phạm trực tiếp DoD: "Mỗi bài có learning outcome và test". Đề bài không có mục tiêu sư phạm đo lường được. | **Ràng buộc Pydantic Validator**: Khóa cứng `min_length=1` cho cả `learning_outcomes` và `test_cases`; nếu mảng rỗng hoặc chứa chuỗi rác sẽ ném lỗi `ValidationError` ngay tại tầng schema. |
| **06** | Giữ nguyên độ khó do AI tự khai báo mà không đối soát với Thang đo Bloom và cấu trúc truy vấn. | AI thường khai báo độ khó "Advanced" cho các câu lệnh `SELECT ... WHERE` cơ bản chỉ vì nội dung đề bài dài. | **Thiết lập DifficultyCalibratorService**: Tự động phân tích động từ nhận thức (Bloom Keywords) và độ phức tạp kỹ thuật của mã lời giải (nhận diện Window functions, `GROUP BY`, `HAVING`) để hiệu chuẩn lại độ khó. |
| **07** | Thiết kế quy trình duyệt bài 1 vòng duy nhất: nếu không đạt thì xóa thẳng bản nháp. | Làm mất dấu vết lịch sử chỉnh sửa và không đáp ứng tiêu chuẩn DoD: "Ít nhất 80% bản nháp qua review sau tối đa 2 vòng". | **Xây dựng Two-Round Review Engine & Modal Hiệu Chỉnh Vòng 2**: Cho phép Giảng viên chọn `request_revision` ở Vòng 1 kèm nhận xét góp ý, hệ thống tăng `review_round = 2`. Ở Vòng 2, Giảng viên mở Modal Hiệu Chỉnh trực tiếp sửa đề bài, mã giải SQL, thang Bloom, ra lệnh AI tự động tinh chỉnh code và duyệt bài, đạt tỷ lệ duyệt $100\%$ ở Vòng 2. |
| **08** | Lưu trữ danh sách bài tập nháp và bài tập đã duyệt gộp chung vào một tệp tạm không có cấu trúc. | Khó đối soát nghiệm thu, dễ xảy ra tình trạng ghi đè làm mất ngân hàng 20 bài tập mẫu đạt chuẩn. | **Phân tách rành mạch**: Tạo `approved_exercises_20.json` (20 bài chuẩn đã duyệt), `draft_exercises.json` (bản nháp đang xử lý) và `prompt_eval_log.json` (lưu vết audit trail toàn diện). |
| **09** | Xây dựng giao diện xem bài tập bằng một script dòng lệnh CLI đơn giản. | Giảng viên và trợ giảng không thuận tiện thao tác đối soát, lọc bài tập và bấm duyệt trực quan. | **Phát triển Web Review Workspace (SPA)**: Giao diện tối màu Cyber-Dark hiện đại tích hợp bộ lọc đa tiêu chí, modal tra cứu schema, nút chạy test SQLite tức thì và nút phê duyệt 1 chạm. |
| **10** | Viết test Pytest chỉ kiểm tra các hàm nội bộ mà bỏ qua việc kiểm thử các API endpoints và mã lỗi 403. | Không bảo đảm tính toàn vẹn của hợp đồng tích hợp hệ thống khi bàn giao sang Nền tảng Học tập ở Tuần 6. | **Bao phủ toàn diện 22 bài test Pytest**: Kiểm thử đầy đủ từ trích xuất schema, validator Pydantic, lọc trùng lặp, SQLite runner, quy tắc chặn 403 Gatekeeper đến toàn bộ RESTful API endpoints. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy "Uncontrolled Schema Hallucination" (Ảo giác cấu trúc)**: AI tự chế tên cột không có trong bảng. *Cách tránh*: Sử dụng `SchemaReaderService` quét CSV thật và tiêm lược đồ cột kèm sample values vào prompt.
2. **Bẫy "Silent Auto-Publish" (Tự ý xuất bản ngầm)**: AI lưu thẳng vào database chính thức. *Cách tránh*: Mặc định status luôn là `draft_pending_review`; ném HTTP `403 Forbidden` nếu cố ý publish khi chưa duyệt.
3. **Bẫy "Empty Test Cases" (Bỏ quên test cases)**: AI sinh đề bài nhưng không có bài test kiểm chứng. *Cách tránh*: Cài đặt Pydantic validator bắt buộc `len(test_cases) >= 1`.
4. **Bẫy "Cognitive Inflation" (Thổi phồng độ khó)**: Câu truy vấn đơn giản bị gắn mác "Advanced". *Cách tránh*: Hiệu chuẩn tự động qua `DifficultyCalibratorService` dựa trên Thang đo Bloom và cú pháp SQL.
5. **Bẫy "Syntax-Only Validation" (Kiểm tra cú pháp hình thức)**: Đánh giá code đúng cú pháp nhưng dữ liệu trả về rỗng. *Cách tránh*: Thực thi truy vấn trên SQLite in-memory với dữ liệu thật.
6. **Bẫy "Naive String Deduplication" (Lọc trùng hời hợt)**: Chỉ so khớp chuỗi chính xác `==`. *Cách tránh*: Áp dụng N-gram Jaccard Similarity với ngưỡng chặn $70\%$.
7. **Bẫy "Non-Idempotent Review State" (Mất dấu vết vòng duyệt)**: Xóa mất nhận xét của Vòng 1. *Cách tránh*: Ghi vết `review_round`, `review_notes` và `reviewer_id` vào từng bản nháp.
8. **Bẫy "Hardcoded Dataset Paths" (Đường dẫn tuyệt đối)**: Sử dụng đường dẫn cứng dạng `D:/...`. *Cách tránh*: Sử dụng `Path(__file__).resolve().parent` tương thích đa môi trường.
9. **Bẫy "Pytest Collection Class Warning" (Xung đột tên class test)**: Khai báo `class TestCase` khiến Pytest tưởng nhầm là test class. *Cách tránh*: Khai báo `__test__ = False` trong schema Pydantic.
10. **Bẫy "Uncalibrated Learning Outcomes" (Chuẩn đầu ra sáo rỗng)**: Chuẩn đầu ra chung chung như "Hiểu bài". *Cách tránh*: Bắt buộc độ dài tối thiểu và chứa động từ hành động đo lường được theo Bloom.

---

## 5. BỐN TẦNG NĂNG LỰC ỨNG DỤNG AI (THE FOUR TIERS OF AI MASTERY)

Trong toàn bộ quá trình thực hiện Task 23, tôi đã vận dụng nhuần nhuyễn mô hình Bốn Tầng Năng Lực AI:
- **Tầng 1 — Trợ lý cú pháp (Syntax Assistant)**: Sử dụng AI để sinh nhanh các mẫu khai báo Pydantic BaseModel, các câu truy vấn mẫu cho 4 bộ dữ liệu và cấu trúc giao diện HTML Tailwind CSS.
- **Tầng 2 — Tăng tốc sinh mã khung (Scaffolding Acceleration)**: Dùng AI hỗ trợ dựng khung router `/api/v1/generator`, các hàm tính toán Jaccard N-gram và bộ khung test cases Pytest ban đầu.
- **Tầng 3 — Thẩm định & Phản biện kỹ thuật (Critical Architecture Review)**: Bác bỏ việc để AI tự do publish; phát hiện lỗi xung đột tên cột thực tế (`work_hours` thay vì `overtime_hours`, `churn_label` thay vì `churn`); thiết lập cơ chế nạp CSV vào SQLite in-memory để chạy test thật; khóa cứng điều kiện nghiệm thu DoD bằng validator.
- **Tầng 4 — Điều phối hệ sinh thái & Làm chủ giải pháp (Ecosystem Orchestration)**: Tự tay kết nối toàn bộ chu trình từ Schema Reader, Generator Engine, Pipeline 3 Lớp, Cổng Gatekeeper 403 đến Web Review Workspace SPA; nghiệm thu đủ 20 bài tập mẫu chuẩn mực và độc lập thẩm định kỹ thuật toàn diện.

---

## 6. LỖI KỸ THUẬT PHÁT SINH, NGUYÊN NHÂN GỐC RỄ & CÁCH KHẮC PHỤC

### Sự cố 1: Lỗi `UnicodeEncodeError: 'charmap' codec can't encode character` khi chạy script trên Windows PowerShell
- **Hiện tượng**: Khi chạy các script Python in tiếng Việt có dấu, console bị dừng đột ngột với lỗi `UnicodeEncodeError`.
- **Nguyên nhân gốc rễ**: Môi trường Windows PowerShell mặc định sử dụng bảng mã `cp1252` thay vì `utf-8`.
- **Giải pháp xử lý**: Thêm đoạn cấu hình `sys.stdout.reconfigure(encoding="utf-8")` ở đầu tất cả các script tự động hóa.

### Sự cố 2: Lỗi `no such column: attendance_status` khi thực thi câu truy vấn trên SQLite
- **Hiện tượng**: Khi chạy thử nghiệm đáp án trên bảng `hr_attendance_v1`, SQLite báo lỗi không tìm thấy cột `attendance_status`.
- **Nguyên nhân gốc rễ**: Mô hình AI ban đầu giả định tên cột là `attendance_status` và `overtime_hours`, trong khi tệp dữ liệu CSV thực tế được chuẩn hóa ở Ngày 22 đặt tên cột là `status` và `work_hours`.
- **Giải pháp xử lý**: Đây chính là minh chứng thuyết phục nhất cho sự cần thiết của **Feasibility Sandbox**. Kỹ sư con người đã cập nhật lại `METADATA_CATALOG` trong `SchemaReaderService` và hiệu chỉnh toàn bộ câu truy vấn trong 20 bài tập mẫu khớp $100\%$ với các cột có thật.

### Sự cố 3: Cảnh báo `PytestCollectionWarning: cannot collect test class 'TestCase'` khi chạy Pytest
- **Hiện tượng**: Pytest hiển thị 1 cảnh báo không thể thu thập class `TestCase` vì có constructor `__init__`.
- **Nguyên nhân gốc rễ**: Quy ước đặt tên của Pytest tự động xem mọi class bắt đầu bằng từ khóa `Test*` là một test class cần thực thi.
- **Giải pháp xử lý**: Thêm thuộc tính `__test__ = False` vào định nghĩa class `TestCase(BaseModel)` trong `src/schemas/exercise.py`. Kết quả Pytest chạy sạch $100\%$ với 0 cảnh báo.
