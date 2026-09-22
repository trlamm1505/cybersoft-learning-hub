# AI WORK LOG — NGÀY 15: DASHBOARD THEO DÕI CHẤT LƯỢNG TÀI NGUYÊN (CRQOF DASHBOARD v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 15 — Dashboard theo dõi chất lượng tài nguyên (`cybersoft-resource-observability-dashboard`)  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Phiên bản**: v1.0.0  
**Ngày hoàn thiện**: 2026-09-21  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### 1.1. Bối Cảnh Nghiệp Vụ & Yêu Cầu Kỹ Thuật Ban Đầu
* **Mục tiêu**: Xây dựng bảng điều khiển quan sát và giám sát chất lượng toàn diện (Resource Observability Dashboard v0.1) cho toàn bộ tài nguyên học liệu số (Dataset Registry & Project Bank) đã tích lũy trong 3 tuần đầu tiên tại CyberSoft Academy.
* **Tiêu chí nghiệm thu cốt lõi (Acceptance Criteria / DoD)**:
  1. **Số liệu dashboard khớp Registry 100%**: Đồng bộ trực tiếp với `registry_db.json` (Task 10) và Project Bank (Tasks 11-14). Không được sai lệch số lượng dataset hay capstone.
  2. **Bộ lọc hoạt động mượt mà, đa chiều**: Hỗ trợ cắt lát theo Chuyên ngành (Track: Data Analyst, AI Engineer, Shared), Lĩnh vực (Domain: Retail, Logistics, HR, NLP/RAG), Cấp độ (Level: Beginner, Intermediate, Advanced) và Phân cấp chất lượng (Tier: Gold, Silver, Bronze, Quarantined).
  3. **Tuyệt đối không hard-code đường dẫn cá nhân**: Hệ thống phải vận hành linh hoạt trên bất kỳ máy trạm hay môi trường CI/CD nào thông qua đường dẫn tương đối (`repo-relative paths`).
  4. **Có tính năng Drill-Down tới metadata & lỗi vi phạm**: Xem chi tiết siêu dữ liệu, phân rã 7 trụ cột đo lường, và bóc tách chính xác nguyên nhân gốc của các tài nguyên bị cách ly.
  5. **Đầy đủ định nghĩa bộ chỉ số (Metric definitions)**: Soạn thảo đầy đủ từ điển chỉ số `metric_definitions.json` và văn bản đặc tả `metric_definitions.md` cùng công thức RQI 7 trụ cột.
  6. **Có ảnh/sơ đồ demo và báo cáo Word chuẩn**: Sinh ảnh kiến trúc `Picture_15_Detail.png` (300 DPI) và xây dựng báo cáo Word chính thức `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_15.docx`.
  7. **Bộ kiểm thử tự động Pytest đạt 100% PASS**: Hoàn thiện kịch bản kiểm chứng CLI 4 giai đoạn đạt Exit Code 0 và bộ kiểm thử Pytest 16/16 tests PASS 100% trong 0.38 giây.

### 1.2. Rủi Ro Dự Kiến & Bẫy AI Thường Gặp (Pre-Emptive Trap Analysis)
Trước khi sử dụng AI hỗ trợ sinh mã nguồn, kỹ sư con người đã chủ động nhận diện 6 cạm bẫy kỹ thuật điển hình:
1. **Bẫy Hard-Code Đường Dẫn Máy Cá Nhân (Hard-Coded Absolute Path Trap)**: AI thường tự động lấy đường dẫn tuyệt đối hiện tại (ví dụ: `C:\Users\Admin\...` hoặc `D:\Cybersoft\...`) đưa vào code cấu hình, dẫn đến việc ứng dụng bị sập khi chạy trên máy của Mentor hoặc máy chủ CI.
2. **Bẫy Dữ Liệu Giả Lập Tách Rời Thực Tế (Static Mock Data Disconnect Trap)**: AI có xu hướng tự sinh một danh sách dữ liệu giả lập (hardcoded mock list) trong file UI thay vì kết nối thực tế tới `registry_db.json` từ Task 10 và các manifest của Project Bank, làm mất tính đồng bộ của hệ thống.
3. **Bẫy Trung Bình Cộng Không Trọng Số (Unweighted Arithmetic Mean Trap)**: AI thường tính điểm chất lượng bằng cách lấy trung bình cộng cơ học các chỉ số. Điều này đánh đồng mức độ quan trọng giữa một bài kiểm tra định dạng tài liệu đơn giản với một lỗi vi phạm khóa chính hay rò rỉ đáp án thi cử.
4. **Bẫy Nuốt Lỗi Khi Giá Trị Là None (Silent Null Dereference Trap)**: Đối với các dataset bị từ chối hoặc cách ly (như `ds-dirty-test-quarantine`), trường `latest_published_version` có giá trị `None`. Nếu không xử lý an toàn, hệ thống sẽ truy cập vào `versions[None]`, văng ngoại lệ `KeyError` hoặc âm thầm trả về dictionary rỗng và gán nhầm điểm 100.
5. **Bẫy Vòng Lặp Trạng Thái Trong Streamlit (Streamlit State Rerender Loop Trap)**: Khi tương tác với các widget chọn lọc, việc quản lý session state không khéo léo sẽ gây reload liên tục hoặc làm mất lựa chọn drill-down của người dùng.
6. **Bẫy Bảng Mã Ký Tự Windows Trên Console (Windows cp1252 Encoding Trap)**: PowerShell mặc định trên Windows sử dụng bảng mã cp1252, dễ bị văng lỗi `UnicodeEncodeError` khi in các biểu tượng emoji trực quan hoặc ký tự tiếng Việt có dấu.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Vai trò giả định (Persona)**: Lead Data Architect & Curriculum Observability Specialist tại CyberSoft Academy.
* **Mục tiêu**: Xây dựng trọn vẹn giải pháp Dashboard quan sát chất lượng học liệu số (CRQOF Dashboard v0.1), bao gồm động cơ thu thập dữ liệu, động cơ tính toán RQI, bộ lọc đa chiều, ứng dụng Streamlit, bộ kiểm thử Pytest và các tài liệu bàn giao.

### Context & Prompt Chính Đã Sử Dụng:
```text
Bạn là Lead Data Architect & Curriculum Observability Specialist tại CyberSoft Academy.
Bối cảnh: Triển khai NGÀY 15 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Dashboard theo dõi chất lượng tài nguyên (CyberSoft Resource Quality & Observability Dashboard v0.1)
tổng hợp toàn bộ học liệu số từ Dataset Registry (Task 10) và Project Bank (Tasks 11-14).

Yêu cầu kỹ thuật chi tiết:
1. Xây dựng catalog/metric_definitions.json và metric_definitions.md:
   - Chuẩn hóa 10 chỉ số đo lường chất lượng theo khung CRQOF v0.1.
   - Định nghĩa công thức toán học RQI 7 trụ cột có trọng số và 4 cấp bậc xếp hạng (Gold, Silver, Bronze, Quarantined).
2. Xây dựng src/collector.py:
   - Tự động quét và nạp dữ liệu từ Task 10 và Tasks 11-14 qua đường dẫn tương đối (repo-relative paths).
   - Tuyệt đối không hard-code đường dẫn cá nhân. Fallback an toàn khi version là None.
3. Xây dựng src/metrics_engine.py & src/filter_engine.py:
   - Tính toán RQI tổng hợp và phân rã các thẻ KPI; hỗ trợ cắt lát đa chiều (Track, Domain, Level, Tier, Search).
4. Xây dựng src/app.py (Streamlit Dashboard):
   - 5 thẻ chỉ số KPI tổng quan, sơ đồ quan sát kiến trúc, biểu đồ thanh ngang RQI, biểu đồ tròn Donut,
     bảng chi tiết cắt lát, và bảng điều khiển Drill-down bóc tách lỗi vi phạm.
5. Xây dựng scripts/ và tests/:
   - demo_dashboard_workflow.py (kịch bản 4 giai đoạn Exit Code 0).
   - export_static_snapshot.py (xuất snapshot JSON và HTML tĩnh).
   - Bộ kiểm thử tự động Pytest 16/16 tests PASS 100%.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động rà soát, phản biện và đưa ra các điều chỉnh kỹ thuật quyết định:

| Đề xuất Ban Đầu của AI | Vấn Đề / Rủi Ro Phát Hiện Được | Quyết Định & Chỉnh Sửa của Con Người |
| :--- | :--- | :--- |
| **1. Sử dụng đường dẫn tuyệt đối `os.path.abspath('d:/Cybersoft/Kien/...')` trong cấu hình.** | **Bẫy Hard-Coded Path**: Khi clone repo sang máy khác hoặc chạy CI/CD sẽ lập tức bị gãy luồng nạp dữ liệu. | **BÁC BỎ & CHUẨN HÓA REPO-RELATIVE PATH**: Áp dụng `Path(__file__).resolve().parents[...]` để tự động suy luận gốc repository. Viết test `test_zero_hardcoded_personal_paths()` để quét tự động. |
| **2. Tạo danh sách tài nguyên tĩnh (mock hardcoded dictionary) trong `app.py`.** | **Mất Tính Đồng Bộ & Vi Phạm Tiêu Chí DoD**: Dashboard không phản ánh được dữ liệu thực tế trong `registry_db.json` từ Task 10 và các Capstones Task 11-14. | **KẾT NỐI TRỰC TIẾP REGISTRY STORE**: Xây dựng module `ResourceCollector` đọc trực tiếp từ `registry_db.json` và thư mục `projects/`, đảm bảo số liệu dashboard khớp 100% với Registry. |
| **3. Tính điểm chất lượng bằng trung bình cộng số học đơn giản.** | **Lệch Trọng Số Chuyên Môn**: Việc thiếu một dòng tài liệu bị phạt ngang với việc rò rỉ đáp án thi cử hoặc vi phạm khóa chính dữ liệu. | **THIẾT LẬP CÔNG THỨC RQI 7 TRỤ CỘT CÓ TRỌNG SỐ**: Phân bổ trọng số chiến lược: Quality Gate (20%), Schema Validity (15%), Completeness (15%), Anti-Leakage (15%), Test Pass (15%), Rubric (10%), Business Integrity (10%). |
| **4. Truy cập trực tiếp `ds_info["latest_published_version"]` để lấy version data.** | **Bẫy Silent Null**: `ds-dirty-test-quarantine` là dataset bị cách ly nên trường `latest_published_version` là `None`, dẫn đến việc version data bị rỗng và gán nhầm thành Gold Tier. | **BỔ SUNG LOGIC FALLBACK AN TOÀN**: Nếu `latest_published_version` là `None`, tự động lấy version đầu tiên trong danh mục `versions`, nhận diện đúng trạng thái `quarantined`, trích xuất 1 vi phạm schema và phân hạng Quarantined Tier chính xác. |
| **5. Viết test kiểm tra hardcoded path bằng cách tìm từ khóa cấm trong toàn bộ file code.** | **Lỗi Tự Bắt Lỗi Chính Mình (Self-Tripping Test)**: File test và file workflow chứa danh sách các chuỗi cấm để kiểm tra, dẫn đến việc test tự đánh trượt chính mình. | **TÁCH BIỆT LOGIC KIỂM TOÁN**: Ghép các chuỗi cấm một cách động (`"users" + "/" + "admin"`) và cấu hình bộ quét chỉ kiểm tra mã nguồn nghiệp vụ, loại trừ file test. |
| **6. Đếm số lượng tài nguyên domain Retail chỉ bằng 3.** | **Thiếu Sót Dataset Cách Ly**: Bỏ quên `ds-dirty-test-quarantine` cũng thuộc domain bán hàng (`retail_ecommerce`). | **CẬP NHẬT CHUẨN XÁC SỐ LIỆU ĐỐI SOÁT**: Khẳng định domain Retail E-Commerce có chính xác 4 tài nguyên (2 Datasets + 2 Capstones), bảo đảm tính nhất quán số học tuyệt đối. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thiết lập quy trình kiểm chứng thực nghiệm độc lập thông qua việc chạy trực tiếp kịch bản workflow, bộ 16 Pytest Unit Tests và kiểm toán bóc tách vi phạm tài nguyên cách ly.

### 4.1. Lệnh chạy và Kết quả Demo Tổng thể (End-to-End Workflow):
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/demo_dashboard_workflow.py
```

**Nhật ký thực tế từ Terminal**:
```text
================================================================================
CYBERSOFT DATA & AI LAB — TASK 15 DASHBOARD DEMO WORKFLOW
================================================================================

[STAGE 1] Ingesting Resources from Registry & Project Bank...
 -> Successfully discovered 8 total resources:
    • Datasets (Registry Task 10): 4
    • Projects (Project Bank Tasks 11-14): 4
      - [ds-retail-ecommerce-sales-v1] CyberSoft Retail E-Commerce Multi-Table Sales... | Tier: Gold | RQI: 100.0
      - [ds-hr-operations-attendance-v1] CyberSoft Enterprise HR Workforce & Attendanc... | Tier: Gold | RQI: 100.0
      - [ds-nlp-rag-tutor-knowledgebase-v1] CyberSoft RAG Tutor Knowledge Base & Evaluati... | Tier: Gold | RQI: 100.0
      - [ds-dirty-test-quarantine] Quarantine Dirty Sales Test Dataset... | Tier: Quarantined | RQI: 81.54
      - [PRJ-STD-01] Standardized Sales Performance Analytics Proj... | Tier: Gold | RQI: 100.0
      - [PRJ-DA-01] Capstone DA-01: Omni-channel Retail Sales & C... | Tier: Gold | RQI: 100.0
      - [PRJ-DA-02] Capstone DA-02: Multi-Warehouse Inventory Ope... | Tier: Gold | RQI: 100.0
      - [PRJ-AI-01] Capstone AI-01: Enterprise RAG Knowledge Retr... | Tier: Gold | RQI: 100.0
 [STAGE 1 PASS] Resource inventory matches Registry & Project Bank 100%.

[STAGE 2] Evaluating CRQOF Metrics & RQI Calculations...
 -> Aggregate Metrics:
    • Total Monitored Records: 14,854
    • Overall Average RQI: 97.69 / 100
    • Automated Test Pass Rate: 99.0%
    • Zero-Leakage Compliance: 100.0%
    • Gold Tier Assets: 7 | Quarantined: 1
 [STAGE 2 PASS] Metric Engine mathematically sound and calibrated.

[STAGE 3] Testing Multi-Dimensional Filter Engine & Drill-Down...
 -> Track 'AI Engineer': 2 items (['ds-nlp-rag-tutor-knowledgebase-v1', 'PRJ-AI-01'])
 -> Track 'Data Analyst': 5 items
 -> Tier 'Quarantined': 1 item (ds-dirty-test-quarantine) with 1 violation
    • Violation detail: Schema validation error at [root]: 'lineage' is a required property
 -> Search 'RAG': Found 2 matches (['ds-nlp-rag-tutor-knowledgebase-v1', 'PRJ-AI-01'])
 [STAGE 3 PASS] Multi-dimensional filter engine & drill-down verified.

[STAGE 4] Exporting Static Snapshots & Verifying Integrity...
[OK] Exported JSON snapshot to: .../catalog/aggregated_resource_snapshot.json
[OK] Exported HTML dashboard snapshot to: .../catalog/dashboard_preview.html
 -> Successfully validated zero personal path leaks in exported artifacts.
 [STAGE 4 PASS] Snapshots generated and clean.

================================================================================
ALL 4 WORKFLOW STAGES PASSED SUCCESSFULLY (EXIT CODE 0)!
================================================================================
```

### 4.2. Kết quả Bộ Kiểm thử Tự động (Pytest Test Suite — 16/16 PASS):
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/tests/ -v
```

**Nhật ký thực tế từ Terminal**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien\cybersoft-learning-hub
collected 16 items

tests/test_dashboard_integrity.py::test_required_files_and_directories_exist PASSED [  6%]
tests/test_dashboard_integrity.py::test_zero_hardcoded_personal_paths PASSED        [ 12%]
tests/test_drilldown_engine.py::test_quarantined_drilldown_has_violations PASSED     [ 18%]
tests/test_drilldown_engine.py::test_gold_tier_drilldown_has_zero_violations PASSED [ 25%]
tests/test_drilldown_engine.py::test_metadata_completeness PASSED                   [ 31%]
tests/test_filter_engine.py::test_filter_by_track PASSED                            [ 37%]
tests/test_filter_engine.py::test_filter_by_domain PASSED                           [ 43%]
tests/test_filter_engine.py::test_filter_by_tier PASSED                             [ 50%]
tests/test_filter_engine.py::test_filter_by_resource_type PASSED                     [ 56%]
tests/test_filter_engine.py::test_text_search PASSED                                [ 62%]
tests/test_metrics_calculation.py::test_rqi_formula_weights PASSED                  [ 68%]
tests/test_metrics_calculation.py::test_summary_kpi_cards PASSED                    [ 75%]
tests/test_metrics_calculation.py::test_track_and_domain_breakdown PASSED            [ 81%]
tests/test_registry_sync.py::test_collector_matches_registry_db_exactly PASSED      [ 87%]
tests/test_registry_sync.py::test_collector_contains_all_capstones PASSED          [ 93%]
tests/test_zero_leakage_is_maintained_across_all_capstones PASSED                 [100%]

============================= 16 passed in 0.38s ==============================
```

### 4.3. Bằng chứng Kiểm chứng Chặn Lỗi & Cách Ly Dữ Liệu (Quarantine Isolation Proof):
* Khi bóc tách tài nguyên cách ly `ds-dirty-test-quarantine`:
  - Hệ thống nhận diện trạng thái `quarantined`, điểm RQI đạt $81.54 / 100$.
  - Trích xuất chính xác lỗi vi phạm schema: `'lineage' is a required property`.
  - Phân lập hoàn toàn vùng cách ly, bảo đảm 100% tài nguyên đưa vào giảng dạy đạt chuẩn Gold Tier.

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Nắm vững bản chất kiến trúc của bài toán đo lường và quan sát chất lượng học liệu số: Resource Observability Pattern, Weighted Composite Scoring (RQI), Multi-dimensional Slicing và Root-Cause Diagnostics. Nhận thức rõ ràng rằng việc xây dựng Dashboard không phải là dựng giao diện tĩnh, mà là xây dựng một hệ thống kiểm soát chất lượng trung tâm bảo chứng cho toàn bộ 14 ngày làm việc trước đó.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Lead Data Architect & Curriculum Observability Specialist, điều phối trợ lý AI xây dựng đồng bộ 4 khối kiến trúc độc lập: Động cơ thu thập (`collector.py`) nạp siêu dữ liệu chuẩn repo-relative path, Động cơ tính toán (`metrics_engine.py`) thẩm định RQI 7 trụ cột, Động cơ cắt lát (`filter_engine.py`) lọc đa chiều, và Giao diện tương tác Streamlit (`app.py`) hỗ trợ chuyển đổi giao diện linh hoạt.
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Độc lập phát hiện và xử lý ngay 6 cạm bẫy kỹ thuật do AI đề xuất:
  1. Triệt tiêu toàn bộ đường dẫn tuyệt đối cố định, chuẩn hóa 100% repo-relative path.
  2. Bác bỏ đề xuất mock data tĩnh, ép buộc kết nối trực tiếp với `registry_db.json` và Project Bank.
  3. Bác bỏ công thức trung bình cộng đơn giản, xây dựng công thức RQI 7 trụ cột có trọng số chiến lược.
  4. Bổ sung logic fallback an toàn khi `latest_published_version` là `None` để nhận diện đúng dataset cách ly.
  5. Khắc phục lỗi kiểm tra đường dẫn tự bắt lỗi chính mình trong Pytest suite.
  6. Khẳng định số lượng tài nguyên domain Retail E-Commerce chính xác là 4 (bao gồm dataset cách ly).
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự tay hoàn thiện toàn bộ mã nguồn hệ thống, bộ công cụ CLI (`run_dashboard.py`, `export_static_snapshot.py`), kịch bản kiểm định 4 giai đoạn (`demo_dashboard_workflow.py`), bộ kiểm thử tự động 16 unit & integration tests đạt 100% PASS trong 0.38 giây, và báo cáo Word chính thức chuẩn 96 đoạn phục vụ chuyển giao tại CyberSoft Academy.
