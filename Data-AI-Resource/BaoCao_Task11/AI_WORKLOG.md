# AI WORK LOG — NGÀY 11: CHUẨN HÓA MẪU DỰ ÁN HỌC VIÊN

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-15  
**Task ID**: `#DAY-11-STUDENT-PROJECT-STANDARDIZATION`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu Kỹ thuật Ban đầu
* **Mục tiêu**: Xây dựng toàn diện hệ thống **Chuẩn hóa mẫu dự án học viên & Khung Project Bank v1.0**, chuyển dịch từ việc tạo các bài tập nhỏ lẻ sang bộ Capstone Projects có cấu trúc chuẩn mực, bối cảnh doanh nghiệp thực tế, và barem đánh giá định lượng minh bạch cho hệ sinh thái CyberSoft Academy.
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  1. **JSON Schema Chuẩn Hóa (`project.schema.json`)**: Định nghĩa đầy đủ 7 khối chức năng: *Bối cảnh nghiệp vụ, Tập dữ liệu, Yêu cầu phân tầng (Core 70đ + Extension 30đ), Chỉ số KPI định lượng, Barem Rubric 100đ, Gợi ý 3 tầng (Tiered Hints), và Sản phẩm kỳ vọng*.
  2. **Nguyên Tắc Rubric Engineering Đo Lường Được**: 100% tiêu chí chấm điểm loại bỏ từ ngữ cảm tính (*"đẹp", "hợp lý"*), bắt buộc có ngưỡng số học hoặc sai số tương đối kiểm chứng được ($\le 0.05\%$).
  3. **Phân Tách Hai Miền Dữ Liệu & Zero Answer Leakage**: Cách ly vật lý và logic giữa bản dành cho học viên (`student_edition`) và bản dành cho giảng viên (`instructor_edition`). Tuyệt đối không để lộ đáp án hay ground-truth KPIs trong tài nguyên học viên.
  4. **Dự Án Benchmark Chuẩn Mực**: Hoàn thành trọn vẹn dự án mẫu *CyberSoft Mart Sales Performance & Customer Retention Intelligence Capstone* kèm 4 bảng dữ liệu thực tế (402 orders, 997 order items, 100 customers, 50 products).
  5. **Bộ Công Cụ Tự Động Hóa & Chấm Điểm**: Triển khai `project_cli.py`, kịch bản `demo_project_workflow.py` (Exit Code 0), và script chấm tự động `auto_grader.py` (đối soát 60 điểm định lượng).
  6. **Kiểm thử độc lập**: Bộ Pytest đạt 100% PASS (14/14 tests) và có kịch bản kiểm thử chặn rò rỉ đáp án (Negative Testing).

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Bẫy Rubric Cảm Tính (Subjective Evaluation Trap)**: AI thường sinh ra các mô tả mang tính định tính văn hoa như *"Code viết gọn gàng, dashboard đẹp mắt, insight sâu sắc"*. Điều này khiến việc chấm thi phụ thuộc cảm tính và làm tê liệt hệ thống chấm tự động Auto-grader. *Khắc phục: Ép buộc 100% tiêu chí phải có ngưỡng định lượng số học.*
* **Bẫy Rò Rỉ Metadata Lời Giải (Manifest Metadata Leakage)**: Khi xuất bản gói học viên, AI có xu hướng copy nguyên file manifest chứa trường `expected_value` của các KPI, khiến học viên chỉ cần mở file JSON là thấy ngay đáp số. *Khắc phục: Xây dựng hàm `sanitize_manifest_for_student()` tự động xóa bỏ toàn bộ ground-truth values.*
* **Bẫy Crash Phân Vị RFM Do Trùng Lặp (Tied Bins Crash)**: Trong tập dữ liệu thực tế, nhiều khách hàng có cùng số lần mua (Frequency = 1). Nếu dùng trực tiếp hàm `pd.qcut()`, chương trình sẽ crash với lỗi `ValueError: Bin edges must be unique`. *Khắc phục: Áp dụng phương pháp xếp hạng trước khi chia phân vị `rank(method="first")`.*
* **Bẫy Tính Nhầm Doanh Thu Đơn Hủy (Cancelled Orders Trap)**: AI khi viết query thường tính tổng cột `total_amount` mà quên lọc bỏ các đơn hàng bị hủy (`cancelled`), dẫn đến sai lệch lớn so với doanh thu thực nhận. *Khắc phục: Định nghĩa tường minh công thức Net Revenue chỉ tính trên trạng thái `completed`.*
* **Bẫy Lỗi Mã Hóa Console Windows (Legacy Encoding Trap)**: Các script in thông báo tiếng Việt có dấu ra terminal PowerShell mặc định bị lỗi `UnicodeEncodeError: 'charmap'`. *Khắc phục: Bổ sung cấu hình `sys.stdout.reconfigure(encoding="utf-8")` tại đầu tất cả các scripts CLI.*

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Mục tiêu tương tác**: Thiết kế JSON Schema Draft 2020-12 cho Project Manifest, xây dựng bộ Pydantic models, triển khai validator kiểm tra ràng buộc trọng số rubric và quét rò rỉ đáp án, sinh dữ liệu bán hàng benchmark 4 bảng, lập trình script giải mẫu, engine auto-grader và bộ kiểm thử tự động Pytest 14 tests.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Architect & Curriculum Engineering Lead tại CyberSoft Academy.
Bối cảnh: Triển khai Task 11 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Chuẩn hóa mẫu dự án học viên (Student Project Standardization & Project Bank Architecture)
với cấu trúc 7 khối chức năng, nguyên tắc Rubric Engineering định lượng 100 điểm, và kiến trúc phân tách
hai miền dữ liệu (Student Edition vs Instructor Edition) tuân thủ nghiêm ngặt chuẩn Zero Answer Leakage.

Yêu cầu kỹ thuật chi tiết:
1. Thiết kế JSON Schema Draft 2020-12 (schemas/project.schema.json) và Pydantic models (src/core/models.py):
   - Metadata, Business Context, Datasets, Requirements (Core 70đ + Extension 30đ = 100đ),
     Quantitative KPIs, Rubric Matrix (100đ, 4 levels), Tiered Hints (1-2-3), Expected Artifacts.
2. Xây dựng ProjectValidator (src/core/validator.py):
   - Thẩm định Schema JSON Draft 2020-12, ràng buộc tổng điểm Core + Ext = 100, tổng Rubric = 100.
   - Bắt buộc tiêu chí rubric phải có quantitative_metric không chứa từ ngữ cảm tính.
   - Hàm check_student_directory_leakage() quét regex chặn đứng file giải và secret keys.
3. Xây dựng ProjectPackager (src/core/packager.py):
   - Đóng gói tách biệt student_edition và instructor_edition; hàm sanitize_manifest_for_student()
     tự động ép expected_value = None cho toàn bộ KPIs trong manifest học viên.
4. Xây dựng Dự án Benchmark CyberSoft Mart Sales Performance & Customer Retention Intelligence Capstone:
   - Dữ liệu thực tế 4 bảng: orders.csv (402 dòng, 2 duplicate, 5 null status), order_items.csv (997 dòng),
     customers.csv (100 dòng), products.csv (50 dòng).
   - student_edition: PROJECT_BRIEF.md, rubric.json, HINTS.md, submission_checklist.md, data/, starter_kit/.
   - instructor_edition: SOLUTION_MANUAL.md, solutions/ (full_analysis_solution.py, SQL queries),
     expected_kpis.json (Ground Truth $388,850.28), grading/auto_grader.py (chấm 60đ định lượng).
5. Xây dựng CLI scripts/project_cli.py (validate, check-leakage, package, summary) mã thoát POSIX 0/1/2.
6. Xây dựng test suite Pytest 14 tests đạt 100% PASS và script demo_project_workflow.py Exit Code 0.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động kiểm soát, phát hiện các sai lệch kỹ thuật và đưa ra quyết định chỉnh sửa dứt khoát:

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Dùng các tiêu chí rubric văn hoa: *"Code viết đẹp mắt, bố cục hợp lý, insight sâu sắc"*.** | **Bẫy Rubric Cảm Tính**: Khiến người chấm theo cảm tính cá nhân, học viên không biết tiêu chuẩn cụ thể, và hệ thống máy chấm thi Online Judge hoàn toàn không thể đánh giá. | **BÁC BỎ & LƯỢNG HÓA 100% TIÊU CHÍ**: Quy định tiêu chuẩn định lượng bắt buộc: *"Khử 100% (2/2) duplicate; quy chuẩn 100% (5/5) null; sai số Net Revenue $\le 0.05\%$, AOV $\le 0.10\%$; đủ 4 biểu đồ đúng chuẩn và 3 đề xuất định lượng"*. |
| **Để file `expected_kpis.json` và code giải trong cùng thư mục dự án với student kit.** | **Bẫy Rò Rỉ Đáp Án (Answer Leakage)**: Học viên có thể vô tình hoặc cố ý mở file xem trước kết quả, phá vỡ tính công bằng và giá trị đánh giá của bài thi. | **TÁCH BIỆT VẬT LÝ HAI MIỀN DỮ LIỆU**: Cô lập hoàn toàn thư mục `student_edition/` và `instructor_edition/`. Xây dựng bộ quét `check_student_directory_leakage()` quét regex tự động chặn đứng mọi file giải. |
| **Phân bổ thang điểm dự án thành 50 điểm Cơ bản và 50 điểm Nâng cao.** | **Lệch chuẩn năng lực nghề nghiệp**: Tỷ lệ 50/50 khiến học viên trung bình dễ bị trượt môn; làm loãng các kỹ năng bắt buộc phải thành thạo của một Data Analyst. | **CHUẨN HÓA TỶ LỆ VÀNG 70% CORE : 30% EXTENSION**: 70 điểm Core đảm bảo năng lực nghề nghiệp vững vàng (đạt loại Khá 7.0/10); 30 điểm Extension dành cho học viên xuất sắc khẳng định năng lực phân khúc và tối ưu hóa. |
| **Dùng trực tiếp `pd.qcut(df['frequency'], 5)` để phân khúc khách hàng RFM.** | **Lỗi Runtime do Duplicate Bins**: Hơn 60% khách hàng chỉ mua 1 lần dẫn đến các mốc phân vị bị trùng giá trị, khiến hàm `qcut` ném lỗi `ValueError: Bin edges must be unique`. | **ÁP DỤNG KỸ THUẬT XẾP HẠNG THỨ HẠNG `rank(method="first")`**: Xếp hạng dữ liệu trước khi chia phân vị, đảm bảo thuật toán phân khúc chạy mượt mà 100% trên mọi phân phối dữ liệu rời rạc. |
| **Tính doanh thu Net Revenue bằng `SUM(total_amount)` của toàn bộ file `orders.csv`.** | **Bẫy Dữ Liệu Bẩn**: Bảng dữ liệu có 2 đơn hàng trùng lặp và 43 đơn bị hủy (`cancelled`). Nếu tính thô sẽ làm đội doanh thu lên thêm hơn $50,000. | **ĐỊNH NGHĨA CHẶT CHẼ CÔNG THỨC NET REVENUE**: Bắt buộc khử duplicate theo `order_id` và chỉ lọc tính tổng trên các đơn hàng có trạng thái `completed`, đối soát chính xác với Ground Truth $388,850.28. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi hệ thống kiểm thử tự động độc lập gồm dòng lệnh CLI, kịch bản Negative Testing và bộ 14 Pytest Unit Tests.

### 4.1. Lệnh chạy và Kết quả Demo Tổng thể (End-to-End Workflow):
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/scripts/demo_project_workflow.py
```

**Nhật ký thực tế (Console Output)**:
```text
================================================================================
🚀 CYBERSOFT DATA & AI LAB — TASK 11 END-TO-END DEMO WORKFLOW
   Module: Chuẩn Hóa Mẫu Dự Án Học Viên (Student Project Standardization)
================================================================================

📋 [BƯỚC 1/5] Kiểm định Manifest với JSON Schema Draft 2020-12 & Rubric Rules...
   ✅ Manifest đạt chuẩn 100% JSON Schema!
   ✅ Ràng buộc điểm: Core 70đ + Extension 30đ = 100đ.
   ✅ Barem Rubric: Tổng điểm 100.0 tuyệt đối.

🛡️ [BƯỚC 2/5] Quét Phòng Vệ Rò Rỉ Đáp Án (Zero-Leakage Defense) trên Student Edition...
   ✅ 100% CLEAN: Không phát hiện file đáp án, secret keys hay ground-truth KPIs.

🧪 [BƯỚC 3/5] Thử nghiệm chèn file đáp án bẫy để kiểm tra khả năng phát hiện...
   ✅ PHÒNG VỆ HOÀN HẢO: Validator phát hiện ngay lập tức (Leaked solution file detected: solution_leak_trap.py (matched pattern: .*solution.*)).
   ✅ Đã xóa file bẫy và khôi phục trạng thái an toàn.

📦 [BƯỚC 4/5] Đóng gói phân tách Student Bundle & Instructor Bundle...
   ✅ Đã xuất bản Student Bundle: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task11\dist\student_edition
   ✅ Đã xuất bản Instructor Bundle: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task11\dist\instructor_edition

🎯 [BƯỚC 5/5] Mô phỏng Chấm Điểm Tự Động (Auto-Grader Simulation)...
   📊 Kết quả chấm bài tự động: 60.0 / 60.0 điểm tự động
      • CRIT-01 PASS (20/20): File dữ liệu làm sạch chính xác 100% (400 dòng, 0 duplicate, 0 null).
      • CRIT-02 PASS (25/25): Doanh thu $388,850.28 và AOV $1,150.44 khớp Ground Truth tuyệt đối.
      • CRIT-04 PASS (15/15): Phân khúc RFM đầy đủ các nhóm khách hàng chiến lược.

================================================================================
🎉 TOÀN BỘ WORKFLOW TASK 11 HOÀN TẤT THÀNH CÔNG RỰC RỠ! (EXIT CODE 0)
================================================================================
```

### 4.2. Kết quả Bộ Kiểm thử Tự động (Pytest Test Suite — 14/14 PASS):
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/ -v
```

**Nhật ký thực tế (Console Output)**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
plugins: anyio-4.14.2, Faker-40.38.0
collecting ... collected 14 items

cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_cli.py::test_cli_validate_success PASSED [  7%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_cli.py::test_cli_check_leakage_success PASSED [ 14%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_cli.py::test_cli_summary_success PASSED [ 21%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_schema.py::test_valid_manifest PASSED [ 28%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_schema.py::test_missing_required_section PASSED [ 35%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_schema.py::test_invalid_domain_enum PASSED [ 42%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_project_schema.py::test_invalid_task_points_sum PASSED [ 50%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_rubric_engineering.py::test_rubric_total_100_points PASSED [ 57%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_rubric_engineering.py::test_criteria_sum_matches_category_weight PASSED [ 64%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_rubric_engineering.py::test_all_criteria_have_quantitative_metrics PASSED [ 71%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_rubric_engineering.py::test_core_vs_extension_ratio PASSED [ 78%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_student_instructor_separation.py::test_student_edition_zero_leakage PASSED [ 85%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_student_instructor_separation.py::test_leakage_detection_when_solution_injected PASSED [ 92%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/tests/test_student_instructor_separation.py::test_packager_sanitizes_expected_kpis PASSED [100%]

============================= 14 passed in 3.05s ==============================
```

### 4.3. Bằng chứng Kiểm chứng Chặn Rò rỉ Đáp án (Negative Testing Proof):
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/scripts/project_cli.py check-leakage cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task11/projects/sales_performance_analytics/student_edition
```
* Khi chèn tệp bẫy giả định `solution_leak_trap.py` vào thư mục học viên, hàm `check_student_directory_leakage()` lập tức phát hiện:
  - Khớp mẫu tệp cấm `.*solution.*`.
  - Phát hiện chuỗi regex nhạy cảm `SOLUTION_KEY`.
* CLI lập tức kích hoạt mã thoát POSIX `2` (Exit Code 2 - Critical Leakage Detected) và chặn đứng quy trình phát hành, bảo vệ toàn vẹn tính công bằng của kỳ thi.

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Nắm vững bản chất kiến trúc của bài toán chuẩn hóa dự án học viên: Schema-driven Architecture, Rubric Engineering định lượng và Zero Answer Leakage. Nhận thức rõ ràng rằng việc thiết kế một bài tập lớn (Capstone) không đơn thuần là viết đề bài, mà là xây dựng một hợp đồng dữ liệu chuẩn mực (Data Contract) tích hợp đồng bộ giữa nền tảng thi đấu (Contest Hub) và hệ sinh thái kiểm định chất lượng (QA Content Lint).
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal Data Architect & Curriculum Lead, điều phối trợ lý AI xây dựng đồng bộ 6 cấu phần kỹ thuật lớn: JSON Schema Draft 2020-12, Core Pydantic Models, Validator kiểm định đa tầng, Packager phân tách hai miền, Benchmark Project Sales Performance 4 bảng dữ liệu, và Auto-grader engine tự động chấm điểm.
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Độc lập phát hiện và xử lý ngay 5 cạm bẫy kỹ thuật do AI đề xuất:
  1. Loại bỏ triệt để các tiêu chí rubric định tính cảm tính, lượng hóa 100% chỉ số đo lường.
  2. Bác bỏ việc lưu chung file lời giải với starter kit, thiết lập kiến trúc phân tách vật lý và quét regex Zero-Leakage.
  3. Chuẩn hóa tỷ lệ vàng 70% Core : 30% Extension thay vì tỷ lệ 50/50 gây lệch chuẩn đào tạo.
  4. Khắc phục lỗi crash duplicate bins trong phân vị RFM bằng phương pháp xếp hạng `rank(method="first")`.
  5. Sửa lỗi tính nhầm doanh thu đơn hủy bằng việc bóc tách chính xác chỉ số Net Revenue trên trạng thái `completed`.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự tay hoàn thiện toàn bộ mã nguồn hệ thống, bộ công cụ CLI (`project_cli.py`), kịch bản thực hành mẫu, bộ kiểm thử tự động 14 unit tests đạt 100% PASS trong 3.05 giây, và Báo cáo chính thức đạt chuẩn doanh nghiệp phục vụ vận hành thực tế tại CyberSoft Academy.
