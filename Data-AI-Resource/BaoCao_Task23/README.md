# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 23
## AI GỢI Ý BÀI TẬP THEO DATASET (EXERCISE GENERATOR v0.1 & REVIEW WORKSPACE)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 23 — AI gợi ý bài tập theo dataset (`cybersoft-exercise-generator`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-01  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task23/` chứa trọn bộ công cụ sinh bài tập tự động bằng AI, ứng dụng Web Review Workspace (SPA), dịch vụ backend FastAPI, bộ dữ liệu CSV thực nghiệm, kho lưu trữ 20 bài tập thực hành mẫu đã được Giảng viên phê duyệt, nhật ký Prompt & Eval Log, bộ kiểm thử Pytest tự động và sơ đồ kiến trúc độ phân giải cao:

```text
BaoCao_Task23/
├── 23_ai_exercise_generator.md       # Báo cáo kỹ thuật chi tiết toàn diện Task 23 (9 mục lớn)
├── README.md                         # Sổ tay hướng dẫn bàn giao, test Swagger UI, Web Portal & đối soát DoD
├── AI_WORKLOG.md                     # Nhật ký phối hợp & thẩm định AI 8 phần theo chuẩn CyberSoft
├── Picture_23_Detail.png             # Sơ đồ kiến trúc & luồng pipeline 3400x1600 (300 DPI Dark Theme)
├── Picture_23_Architecture.drawio    # Sơ đồ kiến trúc liên kết 4 cột & Feedback Loop Vòng 2 (Draw.io XML)
├── DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_23.docx # Báo cáo Word chính thức chuẩn CyberSoft
├── requirements.txt                  # Danh mục thư viện phụ thuộc (FastAPI, Pydantic v2, Pytest, Pillow...)
├── portal/                           # Giao diện Web Review Workspace (Single Page Application)
│   ├── index.html                    # Giao diện chính: Tìm kiếm, lọc theo Bloom/Độ khó, thẻ bài tập, modal
│   ├── styles.css                    # Phong cách CSS tùy biến Cyber-Dark, hiệu ứng viền sáng và huy hiệu Bloom
│   └── app.js                        # Logic client-side: Gọi API, lọc tức thì, chạy feasibility test, duyệt bài
├── src/                              # Mã nguồn backend FastAPI v1.0
│   ├── __init__.py
│   ├── main.py                       # Khởi tạo FastAPI App, mount /portal, CORS, timing, Error Handlers
│   ├── config.py                     # Cấu hình ngưỡng kiểm thử, đường dẫn dữ liệu, cổng 8000
│   ├── schemas/                      # Pydantic Schemas v2 chuẩn hóa
│   │   ├── __init__.py
│   │   ├── common.py                 # ErrorEnvelope, SuccessEnvelope, HealthResponse
│   │   ├── exercise.py               # TestCase, ExerciseDraft, ExerciseApproved, ExerciseGenerateRequest
│   │   └── review.py                 # ReviewSubmissionRequest, FeasibilityTestResult, RoundMetrics, PromptEvalLogEntry
│   ├── routes/                       # Các router RESTful v1.0
│   │   ├── __init__.py
│   │   ├── health.py                 # GET /health
│   │   └── generator.py              # Endpoints: /generate, /exercises, /test, /review, /publish, /metrics
│   └── services/                     # Tầng nghiệp vụ xử lý logic và kiểm định
│       ├── __init__.py
│       ├── schema_reader.py          # Trích xuất schema, kiểu dữ liệu, sample values từ 4 tập dữ liệu
│       ├── generator_engine.py       # Bộ sinh bài tập có kiểm soát bằng AI, tiêm ngữ cảnh few-shot
│       ├── deduplicator.py           # Thuật toán kiểm tra trùng lặp N-gram Jaccard (ngưỡng 70%)
│       ├── difficulty_calibrator.py  # Hiệu chuẩn Thang đo Bloom và ma trận độ khó sư phạm
│       ├── feasibility_executor.py   # Nạp dữ liệu vào SQLite in-memory, thực thi truy vấn và đối soát tests
│       └── review_gatekeeper.py      # Cổng kiểm duyệt con người, chặn auto-publish trái phép (403 Forbidden)
├── data/                             # Kho dữ liệu phục vụ sinh bài tập và lưu trữ kết quả
│   ├── datasets/                     # 5 tệp dữ liệu CSV chuẩn hóa
│   │   ├── retail_sales_v1.csv       # Bán hàng đa bảng 3NF (10 bản ghi mẫu - Published)
│   │   ├── hr_attendance_v1.csv      # Chấm công nhân sự 3NF (8 bản ghi mẫu - Published)
│   │   ├── customer_churn_v1.csv     # Khách hàng rời bỏ viễn thông (7 bản ghi mẫu - Published)
│   │   ├── ai_knowledge_chunks_v1.csv# Kho tri thức phân đoạn RAG (6 chunks - Published)
│   │   └── student_survey_draft.csv  # Khảo sát sinh viên nội bộ (Draft)
│   ├── approved_exercises_20.json    # Ngân hàng 20 bài tập thực hành chính thức ĐÃ ĐƯỢC DUYỆT (DoD)
│   ├── draft_exercises.json          # Kho lưu trữ các bản nháp đang trong vòng kiểm duyệt
│   └── prompt_eval_log.json          # Nhật ký lưu vết chi tiết các lần gọi prompt và kết quả đánh giá
├── scripts/                          # Công cụ và module tự động hóa
│   ├── run_server.py                 # Khởi chạy máy chủ FastAPI Uvicorn tại cổng 8000
│   ├── run_generator_eval.py         # Đánh giá tự động toàn diện các tiêu chí DoD
│   ├── seed_approved_exercises.py    # Nạp và kiểm chứng 20 bài tập đã duyệt trên SQLite
│   ├── build_app_js.py               # Biên dịch portal/app.js chứa dữ liệu fallback
│   └── render_diagram.py             # Kết xuất sơ đồ kiến trúc Picture_23_Detail.png (3400x1600, 300 DPI)
└── tests/                            # Bộ kiểm thử tích hợp Pytest (22/22 Tests PASS 100%)
    ├── __init__.py
    ├── conftest.py                   # TestClient fixture, fixtures dịch vụ
    ├── test_schema_reader.py         # Kiểm thử trích xuất schema và prompt context (6 tests)
    ├── test_exercise_schema.py       # Kiểm thử ràng buộc Project Schema và điều kiện bắt buộc DoD (3 tests)
    ├── test_deduplication.py         # Kiểm thử thuật toán lọc trùng lặp Jaccard (2 tests)
    ├── test_difficulty_calibrator.py # Kiểm thử hiệu chuẩn Thang đo Bloom (2 tests)
    ├── test_feasibility_executor.py  # Kiểm thử thực thi truy vấn trên SQLite in-memory (2 tests)
    ├── test_gatekeeper_rules.py      # Kiểm thử Cổng kiểm soát chặn auto-publish 403 Forbidden (2 tests)
    ├── test_review_pass_rate.py      # Kiểm thử tỷ lệ pass rate review >= 80% (1 test)
    └── test_generator_api.py         # Kiểm thử tích hợp toàn diện RESTful API (4 tests)
```

---

## 2. HƯỚNG DẪN THỰC THI & TRẢI NGHIỆM TRÊN TRÌNH DUYỆT WEB

### Bước 1: Khởi động máy chủ Exercise Generator v0.1
Mở PowerShell tại thư mục `cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task23/`:
```powershell
python scripts/run_server.py
```
Máy chủ khởi chạy thành công tại địa chỉ: **`http://localhost:8000`**

### Bước 2: Trải nghiệm Giao diện Web Review Workspace (SPA)
Mở trình duyệt Web (Chrome, Edge) và truy cập:
👉 **[http://localhost:8000/portal/](http://localhost:8000/portal/)** (hoặc truy cập trang chủ [http://localhost:8000/](http://localhost:8000/))

Tại giao diện Web Review Workspace, bạn có thể thực hiện đầy đủ 6 tác vụ:
1. **Tìm kiếm & Lọc bài tập đa chiều**: Tìm kiếm tức thì theo từ khóa trong tiêu đề/mô tả; lọc theo Dataset (Retail, HR, Churn, RAG), Thang Bloom (Remember, Understand, Apply, Analyze, Evaluate), Độ khó hoặc Trạng thái (Đã Duyệt, Bản Nháp).
2. **Tra cứu Lược đồ Dữ liệu (Schema Inspector)**: Bấm nút **`Tra Cứu Schema`** trên thanh công cụ để mở hộp thoại hiển thị chi tiết tên cột, kiểu dữ liệu, tính đầy đủ non-null và mô tả nghiệp vụ của 4 bộ dữ liệu.
3. **Chạy Thử Nghiệm Đáp Án Khả Thi (Feasibility Sandbox)**: Bấm nút **`Chạy Thử Nghiệm`** trên bất kỳ thẻ bài tập nào: Hệ thống sẽ tức thì nạp CSV vào SQLite in-memory, thực thi câu truy vấn và đối soát kết quả với các test cases. Kết quả hiển thị huy hiệu xanh `KHẢ THI 100%` kèm thời gian thực thi (trung bình 0.5 - 1.2 ms).
4. **Yêu cầu AI Sinh Bản Nháp Bài Tập Mới**: Bấm nút **`AI Sinh Bài Tập`**, chọn dataset mục tiêu, cấp độ Bloom và độ khó mong muốn -> Hệ thống tự động sinh bản nháp mới, chạy qua Pipeline 3 Lớp và xuất hiện trong danh sách với trạng thái `Bản Nháp (DoD)`.
5. **Thẩm định & Hiệu Chỉnh Sư Phạm Vòng 2 (Human Review & Interactive Revision)**: Giảng viên xem xét chuẩn đầu ra, mã lời giải và bấm **`Duyệt`** hoặc **`✏️ Hiệu Chỉnh Vòng 2`** (khi bài cần chỉnh sửa). Hộp thoại *Hiệu Chỉnh Sư Phạm Vòng 2* mở ra cho phép sửa trực tiếp tiêu đề, mô tả đề bài, thang Bloom, độ khó, mã giải SQL, ra lệnh AI tự động chuẩn hóa code, chạy kiểm thử feasibility tức thì và lưu duyệt bài.
6. **Kiểm tra Quy tắc Chống Tự Động Xuất Bản (Gatekeeper DoD)**: Thử bấm nút **`Xuất Bản`** trên một bài tập đang ở trạng thái bản nháp (`draft_pending_review`) -> Hệ thống lập tức hiển thị thông báo chặn với giải thích: *"Quy tắc DoD: Tuyệt đối không tự động publish nội dung AI!"*.

---

## 3. HƯỚNG DẪN TEST TỪNG ENDPOINT TRÊN SWAGGER UI

Mở trình duyệt truy cập tài liệu tương tác Swagger UI tại:  
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)** (Swagger UI)  
👉 **[http://localhost:8000/redoc](http://localhost:8000/redoc)** (ReDoc Specification)

### 1. `GET /health` (Kiểm tra trạng thái hệ thống)
- **Mục đích**: Xác thực dịch vụ Exercise Generator đang hoạt động bình thường.
- **Thao tác**: Bấm **Try it out** -> **Execute**.
- **Kết quả kỳ vọng**: HTTP `200 OK`, `{"status": "healthy", "service": "CyberSoft AI Exercise Generator v0.1"}`.

### 2. `GET /api/v1/generator/datasets` (Lấy lược đồ schema các bộ dữ liệu)
- **Mục đích**: Xem cấu trúc cột, kiểu dữ liệu và sample values của toàn bộ dataset phục vụ sinh bài tập.
- **Kết quả kỳ vọng**: HTTP `200 OK`, trả về danh sách 4 datasets kèm chi tiết các cột.

### 3. `POST /api/v1/generator/generate` (Yêu cầu AI sinh bản nháp bài tập)
- **Mục đích**: Sinh bài tập mới tuân thủ Project Schema.
- **Request Body mẫu**:
  ```json
  {
    "dataset_id": "retail_sales_v1",
    "bloom_level": "Apply",
    "difficulty": "Intermediate",
    "count": 1
  }
  ```
- **Kết quả kỳ vọng**: HTTP `200 OK`, trả về bài tập mới với `status: "draft_pending_review"`, có đầy đủ `learning_outcomes`, `starter_code`, `solution_code`, `test_cases`.

### 4. `GET /api/v1/generator/exercises` (Truy vấn ngân hàng bài tập)
- **Mục đích**: Lấy danh sách bài tập kèm các bộ lọc `dataset_id`, `bloom_level`, `difficulty`, `status`, `keyword`.
- **Kết quả kỳ vọng**: HTTP `200 OK`, danh sách bài tập kèm metadata phân trang.

### 5. `POST /api/v1/generator/exercises/{id}/test` (Kiểm tra tính khả thi trên SQLite)
- **Mục đích**: Chạy thử nghiệm câu truy vấn và đối soát test cases trên cơ sở dữ liệu in-memory.
- **Kết quả kỳ vọng**: HTTP `200 OK`, `{"is_feasible": true, "passed_tests": 2, "execution_time_ms": 1.2}`.

### 6. `POST /api/v1/generator/exercises/{id}/review` (Gửi quyết định thẩm định con người)
- **Mục đích**: Giảng viên phê duyệt hoặc yêu cầu sửa đổi bài tập.
- **Request Body mẫu**:
  ```json
  {
    "action": "approve",
    "reviewer_id": "teacher_kien_lead",
    "notes": "Đạt chuẩn sư phạm, test cases chính xác."
  }
  ```
- **Kết quả kỳ vọng**: HTTP `200 OK`, trạng thái chuyển sang `approved`.

### 7. `POST /api/v1/generator/exercises/{id}/publish` (Cổng xuất bản bài tập)
- **Mục đích**: Kiểm tra cơ chế Gatekeeper chặn bản nháp chưa duyệt.
- **Kiểm thử trường hợp bản nháp**: Gọi publish trên bài tập có `status == "draft_pending_review"` -> Trả về HTTP `403 Forbidden` (`AUTO_PUBLISH_BLOCKED`).
- **Kiểm thử trường hợp đã duyệt**: Gọi publish trên bài tập có `status == "approved"` -> Trả về HTTP `200 OK`, chuyển trạng thái sang `published`.

### 8. `GET /api/v1/generator/metrics` (Xem báo cáo số liệu nghiệm thu DoD)
- **Mục đích**: Truy xuất các chỉ số đo lường tỷ lệ duyệt Vòng 1, Vòng 2 và số bài được duyệt.
- **Kết quả kỳ vọng**: HTTP `200 OK`, `round_1_pass_rate: 84.0`, `final_approved_count: 20`.

---

## 4. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG (PYTEST TEST SUITE)

Hệ thống được kiểm thử tự động toàn diện qua bộ test suite 22 bài kiểm thử tích hợp:

```powershell
pytest tests/ -v
```

### Kết quả Thực thi Pytest:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
collected 22 items

tests/test_deduplication.py::test_deduplication_exact_match PASSED      [  4%]
tests/test_deduplication.py::test_deduplication_distinct_exercise PASSED [  9%]
tests/test_difficulty_calibrator.py::test_calibrate_beginner_remember PASSED [ 13%]
tests/test_difficulty_calibrator.py::test_calibrate_advanced_window_function PASSED [ 18%]
tests/test_exercise_schema.py::test_valid_exercise_draft PASSED         [ 22%]
tests/test_exercise_schema.py::test_missing_learning_outcomes_fails PASSED [ 27%]
tests/test_exercise_schema.py::test_missing_test_cases_fails PASSED    [ 31%]
tests/test_feasibility_executor.py::test_feasibility_success PASSED     [ 36%]
tests/test_feasibility_executor.py::test_feasibility_syntax_error PASSED [ 40%]
tests/test_gatekeeper_rules.py::test_gatekeeper_blocks_unapproved_publish PASSED [ 45%]
tests/test_gatekeeper_rules.py::test_gatekeeper_allows_publish_after_approval PASSED [ 50%]
tests/test_generator_api.py::test_api_health PASSED                     [ 54%]
tests/test_generator_api.py::test_api_list_datasets PASSED             [ 59%]
tests/test_generator_api.py::test_api_generate_and_list_exercises PASSED [ 63%]
tests/test_generator_api.py::test_api_metrics PASSED                    [ 68%]
tests/test_review_pass_rate.py::test_review_pass_rate_meets_dod PASSED [ 72%]
tests/test_schema_reader.py::test_list_available_datasets PASSED        [ 77%]
tests/test_schema_reader.py::test_read_retail_schema PASSED             [ 81%]
tests/test_schema_reader.py::test_read_hr_schema PASSED                 [ 86%]
tests/test_schema_reader.py::test_read_churn_schema PASSED              [ 90%]
tests/test_schema_reader.py::test_read_ai_chunks_schema PASSED          [ 95%]
tests/test_schema_reader.py::test_get_prompt_context PASSED            [100%]

============================= 22 passed in 1.45s ==============================
```

- **Tỷ lệ kiểm thử thành công**: **22/22 tests PASS (100% SUCCESS)**.
- **Thời gian thực thi**: **1.45 giây**.

---

## 5. BẢNG ĐỐI SOÁT TIÊU CHÍ NGHIỆM THU (DoD VERIFICATION MATRIX)

| STT | Tiêu chí Nghiệm thu (DoD) | Yêu cầu Kỹ thuật Cam kết | Kết quả Thực tế Ngày 23 | Bằng chứng Xác thực | Trạng thái |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **01** | **Không tự publish nội dung AI** | Mọi bản nháp AI luôn ở trạng thái draft. Chặn cấm xuất bản trực tiếp nếu chưa có phê duyệt con người. | Chặn 100% với mã HTTP `403 Forbidden` (`AUTO_PUBLISH_BLOCKED`). | `tests/test_gatekeeper_rules.py` |  **ĐẠT** |
| **02** | **Mỗi bài có learning outcome và test** | Bắt buộc khai báo chuẩn đầu ra học tập và test cases kiểm chứng khả thi. | 100% bài có $\ge 1$ learning outcome và $\ge 1$ test case (ràng buộc Pydantic). | `tests/test_exercise_schema.py` |  **ĐẠT** |
| **03** | **Ít nhất 80% bản nháp qua review sau tối đa 2 vòng** | Tỷ lệ qua vòng 1 đạt $\ge 80\%$, vòng 2 đạt tối đa sau khi tinh chỉnh. | Vòng 1 đạt **84.0%** ($\ge 80\%$), Vòng 2 đạt **100.0%**. | `scripts/run_generator_eval.py` |  **ĐẠT** |
| **04** | **Exercise generator v0.1** | Công cụ đọc schema/metadata, kiểm tra trùng lặp và phân loại độ khó. | Bàn giao trọn bộ mã nguồn `src/` và Web Review Workspace tại `/portal`. | Thư mục `src/`, `portal/` |  **ĐẠT** |
| **05** | **20 bài đã duyệt** | Ngân hàng 20 bài tập thực hành được Giảng viên phê duyệt chính thức. | Đã bàn giao tệp `data/approved_exercises_20.json` (20 bài đạt chuẩn). | `data/approved_exercises_20.json` |  **ĐẠT** |
| **06** | **Prompt/eval log** | Lưu vết lịch sử prompt và đánh giá qua các vòng kiểm duyệt. | Đã lưu vết đầy đủ trong tệp `data/prompt_eval_log.json`. | `data/prompt_eval_log.json` |  **ĐẠT** |

---

## 6. KẾT LUẬN & HƯỚNG PHÁT TRIỂN TIẾP THEO (NGÀY 24)

Cột mốc Ngày 23 đã xây dựng thành công bộ công cụ **Exercise Generator v0.1** với khả năng đọc hiểu schema dữ liệu, tiêm ngữ cảnh chuẩn xác vào prompt, vận hành Pipeline kiểm định 3 lớp tự động và thiết lập Cổng kiểm soát Human-in-the-loop Gatekeeper đạt chuẩn DoD $100\%$.

Bước sang **NGÀY 24: Theo dõi lineage và phiên bản**, đội ngũ Data & AI Lab sẽ tiếp tục hoàn thiện chuỗi sản phẩm hóa bằng cách xây dựng hệ thống **Data Lineage & Artifact Versioning** để gắn nhãn nguồn gốc phát sinh cho từng tập dữ liệu, mô hình AI, prompt template và bài tập học viên trên toàn hệ thống.
