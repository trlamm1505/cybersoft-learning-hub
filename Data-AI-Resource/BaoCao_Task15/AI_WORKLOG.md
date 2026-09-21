# AI WORK LOG — NGÀY 15: DASHBOARD THEO DÕI CHẤT LƯỢNG TÀI NGUYÊN (CRQOF DASHBOARD v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-19  
**Task ID**: `#DAY-15-RESOURCE-QUALITY-OBSERVABILITY-DASHBOARD`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### 1.1. Bối Cảnh Nghiệp Vụ & Yêu Cầu Kỹ Thuật Ban Đầu
* **Mục tiêu**: Xây dựng bảng điều khiển quan sát và giám sát chất lượng toàn diện (Resource Observability Dashboard v0.1) cho toàn bộ tài nguyên học liệu số (Dataset Registry & Project Bank) đã tích lũy trong 3 tuần đầu tiên tại CyberSoft Academy.
* **Tiêu chí nghiệm thu cốt lõi (Acceptance Criteria / DoD)**:
  1. **Số liệu dashboard khớp Registry 100%**: Đồng bộ trực tiếp với `registry_db.json` (Task 10) và Project Bank (Tasks 11-14). Không được sai lệch số lượng dataset hay capstone.
  2. **Bộ lọc hoạt động mượt mà, đa chiều**: Hỗ trợ cắt lát theo Chuyên ngành (Track: Data Analyst, AI Engineer, Shared), Lĩnh vực (Domain: Retail, Logistics, HR, NLP/RAG), Cấp độ (Level: Beginner, Intermediate, Advanced) và Phân cấp chất lượng (Tier: Gold, Silver, Bronze, Quarantined).
  3. **Tuyệt đối không hard-code đường dẫn cá nhân**: Hệ thống phải vận hành linh hoạt trên bất kỳ máy trạm hay môi trường CI/CD nào thông qua đường dẫn tương đối (`repo-relative paths`).
  4. **Tính năng Drill-Down tới metadata & lỗi vi phạm**: Xem chi tiết siêu dữ liệu, phân rã 7 trụ cột đo lường, và bóc tách chính xác nguyên nhân gốc của các tài nguyên bị cách ly.
  5. **Bộ chỉ số đo lường chuẩn hóa**: Soạn thảo đầy đủ từ điển chỉ số `metric_definitions.json` và công thức tính Chỉ số Chất lượng Tài nguyên Tổng hợp (Resource Quality Index - RQI).
  6. **Đầy đủ bằng chứng kiểm thử & báo cáo**: Hoàn thiện kịch bản kiểm chứng CLI 4 giai đoạn đạt Exit Code 0, bộ kiểm thử tự động Pytest 16/16 tests PASS 100%, sơ đồ kiến trúc 300 DPI và báo cáo Word chính thức.

### 1.2. Rủi Ro Dự Kiến & Bẫy AI Thường Gặp (Pre-Emptive Trap Analysis)
Trước khi sử dụng AI hỗ trợ sinh mã nguồn, kỹ sư con người đã chủ động nhận diện 6 cạm bẫy kỹ thuật điển hình:
1. **Bẫy Hard-Code Đường Dẫn Máy Cá Nhân (Hard-Coded Absolute Path Trap)**: AI thường tự động lấy đường dẫn tuyệt đối hiện tại (ví dụ: `C:\Users\Admin\...` hoặc `D:\Cybersoft\...`) đưa vào code cấu hình, dẫn đến việc ứng dụng bị sập khi chạy trên máy của Mentor hoặc máy chủ CI.
2. **Bẫy Dữ Liệu Giả Lập Tách Rời Thực Tế (Static Mock Data Disconnect Trap)**: AI có xu hướng tự sinh một danh sách dữ liệu giả lập (hardcoded mock list) trong file UI thay vì kết nối thực tế tới `registry_db.json` từ Task 10 và các manifest của Project Bank, làm mất tính đồng bộ của hệ thống.
3. **Bẫy Trung Bình Cộng Không Trọng Số (Unweighted Arithmetic Mean Trap)**: AI thường tính điểm chất lượng bằng cách lấy trung bình cộng cơ học các chỉ số. Điều này đánh đồng mức độ quan trọng giữa một bài kiểm tra định dạng tài liệu đơn giản với một lỗi vi phạm khóa chính hay rò rỉ đáp án thi cử.
4. **Bẫy Nuốt Lỗi Khi Giá Trị Là None (Silent Null Dereference Trap)**: Đối với các dataset bị từ chối hoặc cách ly (như `ds-dirty-test-quarantine`), trường `latest_published_version` có giá trị `None`. Nếu không xử lý an toàn, hệ thống sẽ truy cập vào `versions[None]`, văng ngoại lệ `KeyError` hoặc âm thầm trả về dictionary rỗng và gán nhầm điểm 100.
5. **Bẫy Vòng Lặp Trạng Thái Trong Streamlit (Streamlit State Rerender Loop Trap)**: Khi tương tác với các widget chọn lọc, việc quản lý session state không khéo léo sẽ gây reload liên tục hoặc làm mất lựa chọn drill-down của người dùng.
6. **Bẫy Bảng Mã Ký Tự Windows Trên Console (Windows cp1252 Encoding Trap)**: PowerShell mặc định trên Windows sử dụng bảng mã cp1252, dễ bị văng lỗi `UnicodeEncodeError` khi in các biểu tượng emoji trực quan hoặc ký tự tiếng Việt có dấu.

---

## 2. Nhật Ký Tương Tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Vai trò giả định (Persona)**: Lead Data Architect & Curriculum Observability Specialist tại CyberSoft Academy.
* **Mục tiêu**: Xây dựng trọn vẹn giải pháp Dashboard quan sát chất lượng học liệu số (CRQOF Dashboard v0.1), bao gồm động cơ thu thập dữ liệu, động cơ tính toán RQI, bộ lọc đa chiều, ứng dụng Streamlit, bộ kiểm thử Pytest và các tài liệu bàn giao.

### Context & Prompt Chính Đã Sử Dụng:
```text
Bạn là Lead Data Architect & Curriculum Observability Specialist tại CyberSoft Academy.
Bối cảnh: Triển khai NGÀY 15 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Dashboard theo dõi chất lượng tài nguyên (CyberSoft Resource Quality & Observability Dashboard v0.1).

Yêu cầu kỹ thuật chi tiết:
1. Động cơ Thu thập Siêu dữ liệu (src/collector.py):
   - Quét và nạp dữ liệu từ Task 10 (registry_db.json) và Tasks 11-14 (Project Bank).
   - Tuyệt đối KHÔNG hard-code đường dẫn tuyệt đối cá nhân; sử dụng Path(__file__).resolve() tương đối với repo.
   - Nhận diện đúng trạng thái published/quarantined, xử lý trường hợp latest_published_version là None.
2. Động cơ Chỉ số & Phân tích (src/metrics_engine.py & src/filter_engine.py):
   - Định nghĩa công thức RQI tổng hợp 7 trụ cột có trọng số:
     RQI = 0.20*QG + 0.15*SV + 0.15*CP + 0.15*AL + 0.15*TPR + 0.10*RO + 0.10*BI.
   - Cung cấp tính năng lọc đa chiều: Track, Domain, Level, Tier, Type, Text Search.
3. Giao diện Người dùng Streamlit (src/app.py):
   - 5 thẻ KPI tổng quan: Tổng tài nguyên, Tổng bản ghi, Điểm RQI bình quân, Tỷ lệ Test Pass, Zero-Leakage.
   - Bảng danh mục tài nguyên tương tác, phân cấp huy hiệu Gold/Quarantined.
   - Tab Drill-Down bóc tách siêu dữ liệu, 7 trụ cột đo lường, kiểm toán vi phạm chất lượng và kỹ năng.
4. Động cơ Xuất Dữ liệu & Công cụ Kiểm tra (scripts/):
   - export_static_snapshot.py: Xuất snapshot JSON và HTML tĩnh phục vụ kiểm tra headless.
   - demo_dashboard_workflow.py: Kịch bản kiểm chứng tự động 4 giai đoạn với mã thoát POSIX Exit Code 0.
   - generate_task15_diagram.py: Sinh sơ đồ đồ họa chất lượng cao Picture_15_Detail.png (300 DPI).
5. Bộ Kiểm thử Tự động Pytest (tests/):
   - Bao phủ 100% các góc cạnh: Tính toàn vẹn tệp, không hardcode path, sync với Registry, filter đa chiều, drill-down và công thức RQI.
```

---

## 3. Thẩm Định và Quyết Định của Con Người (Human Evaluation & Decisions)

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

## 4. Kiểm Chứng Độc Lập (Independent Verification Logs)

Toàn bộ hệ thống được nghiệm thu độc lập thông qua dòng lệnh CLI, kịch bản workflow và bộ kiểm thử tự động Pytest:

### 4.1. Kết Quả Chạy Kịch Bản Toàn Diện (`demo_dashboard_workflow.py`)
```powershell
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

### 4.2. Kết Quả Kiểm Thử Tự Động Pytest Suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/tests/ -v
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
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
tests/test_registry_sync.py::test_zero_leakage_is_maintained_across_all_capstones PASSED [100%]

============================= 16 passed in 0.80s ==============================
```

---

## 5. Bốn Tầng Năng Lực AI Cần Đạt (Four Tiers of AI Competence)

1. **Tầng 1: Prompt & Code Generation (Tạo Mã Nhanh)**: Sử dụng mô hình AI tạo khung sườn cho ứng dụng Streamlit, giao diện CSS và các hàm lọc cơ bản.
2. **Tầng 2: Harness & State Machine Engineering (Kỹ Nghệ Dàn Khung)**: Thiết lập cấu trúc module tách biệt hoàn toàn giữa tầng thu thập (`collector.py`), tầng tính toán (`metrics_engine.py`), tầng cắt lát (`filter_engine.py`) và tầng hiển thị (`app.py`), cho phép kiểm thử độc lập mà không cần mở trình duyệt.
3. **Tầng 3: Observability & Quality Telemetry (Đo Lường & Giám Sát)**: Thiết lập chuẩn hóa công thức đo lường RQI 7 trụ cột, tự động trích xuất các vi phạm chất lượng và liên kết trực tiếp với các manifest thực tế trong kho lưu trữ.
4. **Tầng 4: System Thinking & Architectural Stewardship (Tư Duy Hệ Thống)**: Làm chủ nguyên lý Zero Hardcoded Paths, kiểm soát an toàn dữ liệu, phòng chống rò rỉ đáp án và xây dựng hệ thống kiểm định tự động giúp sản phẩm đạt chuẩn chuyển giao công nghiệp.

---

## 6. Kịch Bản Thuyết Trình 3 Phút (3-Minute Defense Script)

* **Phút 1 — Vấn Đề & Bối Cảnh (Problem Statement)**:  
  *"Kính thưa Ban Giám khảo và Mentor, sau 14 ngày xây dựng kho tài nguyên, chúng ta đã có 4 bộ dataset lớn và 4 bài tập Capstone đồ sộ cho cả Data Analyst và AI Engineer. Tuy nhiên, thách thức lớn nhất của một hệ thống đào tạo AI-Native là: Làm sao để Ban Đào tạo có thể theo dõi tức thì sức khỏe chất lượng của hàng chục ngàn bản ghi dữ liệu và hàng trăm tiêu chí rubric mà không phải đọc code thủ công từng ngày? Task 15 giải quyết triệt để bài toán này bằng việc xây dựng Dashboard Theo Dõi Chất Lượng Tài Nguyên v0.1."*

* **Phút 2 — Giải Pháp & Kiến Trúc Đo Lường (Solution & Metrics Architecture)**:  
  *"Em đã xây dựng khung đo lường CRQOF v0.1 kết tinh thành Chỉ số RQI tổng hợp 7 trụ cột có trọng số khách quan: từ Quality Gate, Schema Validity, Completeness, Anti-Leakage đến Test Pass Rate. Hệ thống không dùng dữ liệu giả lập mà kết nối trực tiếp với Registry Task 10 và Project Bank Tasks 11-14 thông qua đường dẫn tương đối, bảo đảm zero hardcoded path. Trên giao diện Streamlit, người dùng có thể cắt lát đa chiều theo Chuyên ngành, Lĩnh vực, Cấp độ, và đặc biệt là tính năng Drill-down bóc tách chính xác lỗi vi phạm của các tài nguyên bị cách ly như `ds-dirty-test-quarantine`."*

* **Phút 3 — Bằng Chứng Thực Nghiệm & Kết Quả (Evidence & Results)**:  
  *"Toàn bộ giải pháp đã được kiểm chứng độc lập và tự động hóa 100%: Kịch bản demo workflow vượt qua cả 4 giai đoạn đạt Exit Code 0; bộ kiểm thử Pytest 16/16 tests PASS tuyệt đối trong 0.80 giây; hệ thống hỗ trợ xuất snapshot JSON và HTML tĩnh không cần server. Điểm RQI bình quân toàn hệ thống đạt 97.69 điểm với 7/8 tài nguyên đạt Gold Tier chuẩn mực. Đây là bản lề hoàn hảo để chúng ta chính thức bước sang Tuần 4 — xây dựng Ingest và Chunking Pipeline cho Trợ lý RAG thông minh."*
