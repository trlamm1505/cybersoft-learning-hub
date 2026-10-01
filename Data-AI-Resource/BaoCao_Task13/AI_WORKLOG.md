# AI WORK LOG — NGÀY 13: TẠO DỰ ÁN DATA ANALYST SỐ 2 (CAPSTONE DA-02)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-17  
**Task ID**: `#DAY-13-DATA-ANALYST-CAPSTONE-02`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### 1.1. Bối Cảnh Nghiệp Vụ & Yêu Cầu Kỹ Thuật Ban Đầu
* **Mục tiêu**: Xây dựng bài tập lớn (Capstone Project) chuẩn mực công nghiệp số 2 cho học viên chuyên ngành Dữ liệu — **CyberSoft Logistics: Inventory Optimization, Multi-Warehouse Operations & Supply Chain Analytics (Mã DA-02)**. Dự án đào tạo học viên năng lực giải quyết bài toán quản trị tồn kho và vận hành logistics thực tế với 3 trung tâm phân phối (Hà Nội, Đà Nẵng, TP. Hồ Chí Minh) và danh mục 50 mã sản phẩm (SKU).
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  1. **Thời lượng chuẩn 8 — 12 giờ**: Khối lượng công việc chuẩn mực cho đồ án capstone, phân bổ theo tỷ lệ vàng 70 điểm Core (chuẩn đầu ra hành nghề) và 30 điểm Extension (phân hóa năng lực nâng cao).
  2. **10 Câu hỏi nghiệp vụ Stakeholder**: Bao quát toàn diện các mối quan tâm chiến lược từ Ban Giám đốc (COO, CFO, Warehouse Director, Procurement Lead, Head of Sales, Internal Auditor, QA/Ops Lead, Logistics Coordinator, Category Manager, CEO).
  3. **12 Nhiệm vụ kỹ thuật tuần tự**: Từ Data Profiling, Beginning Stock Accounting, Movement Classification, SKU Physical Stock & Valuation, Multi-DC Breakdown, Category Capital Allocation, COGS Accounting, Inventory Turnover & DOH, Safety Stock & ROP Alerts, Discrepancy & Shrinkage Loss, Transfer Reconciliation đến Executive BI Dashboard & Strategic Memo.
  4. **Bộ dữ liệu kép Clean & Dirty tích hợp 8 ngoại lệ nghiệp vụ**: Xây dựng 6 bảng dữ liệu (`inventory_movements`, `products`, `warehouses`, `purchase_orders`, `sales_dispatches`, `inventory_audits`) sạch chuẩn hóa và bẩn có chủ đích để thử thách kỹ năng kiểm toán dữ liệu.
  5. **Tối thiểu 3 phương pháp đối soát độc lập**: Số liệu cốt lõi (Ending Stock `9,272 units`, Ending Valuation `USD 867,636.11`, Total COGS `USD 814,742.22`, Inventory Turnover `1.22x`, DOH `300.4 ngày`) phải được chứng minh trùng khớp tuyệt đối qua SQL Ledger Engine, Python Vectorized Simulation, và Warehouse Balance Equation với sai số chéo Delta = `$0.00` và `0 units`.
  6. **Bảo mật rò rỉ đáp án (Zero Answer Leakage)**: Miền học viên (`student_edition/`) hoàn toàn sạch tệp giải, không chứa ground-truth values trong đề bài và gợi ý.
  7. **Cẩm nang 8 lỗi sai kinh điển**: Liệt kê chi tiết 8 bẫy lỗi học viên hay mắc phải trong phân tích kho vận kèm nguyên nhân gốc và cơ chế phòng ngừa.
  8. **Bộ máy chấm tự động & kiểm thử**: Hoàn thành script chấm tự động `auto_grader.py` (60 điểm định lượng) và bộ test suite Pytest 9/9 tests đạt 100% PASS trong dưới 1 giây.

### 1.2. Rủi Ro Dự Kiến & Bẫy AI Thường Gặp (Pre-Emptive Trap Analysis)
Trước khi đưa chỉ dẫn vào các mô hình AI, kỹ sư con người đã dự báo và thiết lập chốt chặn phòng ngừa 8 cạm bẫy kỹ thuật điển hình:
1. **Bẫy Tính Tồn Kho Thô Quên Số Dư Đầu Kỳ (Naive Net Calculation Trap)**: AI thường chỉ tính `SUM(IN) - SUM(OUT)` các giao dịch phát sinh trong năm 2024 mà bỏ quên dòng số dư đầu kỳ `INIT-BALANCE-2024` tại ngày 01/01/2024, làm hụt mất 5,317 units và `$473,436.40` giá trị tài sản.
2. **Bẫy Nhầm Lẫn Điều Chuyển Liên Kho với Bán Hàng (Transfer Distortion Trap)**: AI có xu hướng gộp chung `TRANSFER_OUT` vào giá vốn bán hàng (COGS) và `TRANSFER_IN` vào mua hàng từ NCC, làm sai lệch chỉ số COGS hơn `$80,000` và bóp méo vòng quay tồn kho toàn chuỗi.
3. **Bẫy Gộp Hàng Hỏng / Cách Ly Vào Hàng Khả Dụng (Quarantine Blind Spot Trap)**: AI lấy toàn bộ tồn kho vật lý làm cơ sở xác định khả năng đáp ứng đơn hàng (Available to Promise - ATP) mà không trừ đi hàng hỏng (`SCRAP_DAMAGED`) và hàng trả về chờ kiểm định QA, gây nguy cơ bán khống.
4. **Bẫy Định Giá Kho Bằng Giá Niêm Yết Thay Vì Giá Vốn (Valuation Basis Fallacy)**: AI nhân số lượng tồn kho với cột `unit_price` thay vì `unit_cost`, vi phạm chuẩn mực kế toán hàng tồn kho IAS 02 và thổi phồng giá trị tài sản kho từ 40% đến 80%.
5. **Bẫy Đếm Trùng Chi Phí Hao Hụt Kiểm Kê (Double Counting Shrinkage Trap)**: AI cộng dồn cả chênh lệch trong `inventory_audits.csv` và các bút toán điều chỉnh `AUDIT_ADJUSTMENT` trong sổ cái, làm nhân đôi chi phí tổn thất lên `$6,152.48` thay vì con số thực tế `$3,076.24`.
6. **Bẫy Trung Bình Cộng Không Trọng Số Cho Vòng Quay (Unweighted Turnover Average)**: AI tính vòng quay riêng cho từng ngành hàng rồi lấy trung bình cộng `AVERAGE(...)`, vi phạm nguyên tắc toán tài chính.
7. **Bẫy Xóa Bỏ Bản Ghi Tồn Kho Âm (Negative Stock Rash Deletion Trap)**: Khi thấy số dư tồn kho bị âm tạm thời trong file dirty, AI đề xuất dùng `DROP` xóa bỏ bản ghi thay vì nhận diện đó là độ trễ nhập liệu (Data Entry Latency) và áp dụng kỹ thuật Re-sequencing.
8. **Bẫy Lỗi Mã Hóa Console & Matplotlib Mathtext (Encoding & Parser Crash)**: PowerShell 5.1 tự chèn UTF-8 BOM (`\ufeff`) khi xuất file gây crash `json.load`, đồng thời matplotlib mặc định phân tích ký tự `$` như công thức toán học LaTeX gây lỗi ParseException.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Vai trò giả định (Persona)**: Principal Supply Chain Architect & Head of Assessment Engineering tại CyberSoft Academy.
* **Mục tiêu**: Thiết kế toàn diện cấu trúc dự án Capstone DA-02, sinh bộ dữ liệu sạch và bẩn 6 bảng, xây dựng động cơ đối soát 3 chiều, máy chấm tự động 60 điểm và bộ kiểm thử tự động Pytest.

### Context & Prompt Chính Đã Sử Dụng:
```text
Bạn là Principal Supply Chain Architect & Head of Assessment Engineering tại CyberSoft Academy.
Bối cảnh: Triển khai NGÀY 13 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng dự án Data Analyst số 2 (Capstone DA-02: CyberSoft Logistics Inventory Optimization,
Multi-Warehouse Operations & Supply Chain Analytics) sử dụng kết hợp SQL, Python và mô hình Excel/BI.

Yêu cầu kỹ thuật chi tiết:
1. Soạn thảo PROJECT_BRIEF.md cho học viên:
   - Bối cảnh mạng lưới phân phối 3 kho (WH-HN01, WH-DN01, WH-HCM01) và 50 mã SKU.
   - 10 câu hỏi nghiệp vụ từ Ban Giám đốc (COO, CFO, Warehouse Director, Procurement, Sales...).
   - 12 nhiệm vụ kỹ thuật chi tiết từ Data Profiling đến Executive BI Dashboard.
   - Định nghĩa rõ 8 ngoại lệ nghiệp vụ trong bộ dữ liệu dirty để học viên kiểm toán.
   - Thời lượng chuẩn: 8 - 12 giờ; chuẩn Zero Answer Leakage.
2. Xây dựng starter_kit/ cho học viên:
   - data_dictionary.md (mô tả 6 bảng movements, products, warehouses, POs, dispatches, audits).
   - analysis_starter.sql (mã khung SQL kèm hướng dẫn các tác vụ).
   - analysis_starter.py (mã khởi động Python pipeline tương thích auto-grader).
   - excel_template_guide.md (hướng dẫn thiết kế workbook 5 sheets).
   - submission_checklist.md (bảng tự kiểm tra 10 tiêu chí).
3. Thiết lập rubric.json theo chuẩn JSON Schema:
   - 100 điểm: 70 điểm Core (Data, Stock, Valuation, Turnover, DC Breakdown, Edge Cases) và 30 điểm Extension.
   - 100% tiêu chí quy định ngưỡng số học khách quan, không dùng từ ngữ cảm tính.
4. Xây dựng instructor_edition/:
   - SOLUTION_MANUAL.md (đáp án 10 câu hỏi C-Level và kế hoạch hành động 90 ngày).
   - expected_kpis.json (Ground Truth: Ending Stock 9,272 units, Valuation $867,636.11, COGS $814,742.22, Turnover 1.22x).
   - common_pitfalls.md (8 bẫy lỗi kinh điển của học viên trong kho vận).
   - solutions/ (solution_queries.sql, solution_da02_pipeline.py, excel_model_specification.md).
   - grading/auto_grader.py (chấm tự động 60/100 điểm định lượng).
5. Xây dựng scripts/cross_verification_engine.py:
   - Đối soát số liệu 3 chiều độc lập: SQL Ledger vs Python Pandas vs Cumulative Balance Matrix.
   - Chứng minh độ lệch Delta = $0.00 và 0 units.
6. Bộ kiểm thử Pytest 9 tests đạt 100% PASS và sơ đồ kiến trúc Picture_13-Detail.png.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động rà soát mã nguồn, phân tích nguyên lý kế toán kho và đưa ra các quyết định hiệu chỉnh dứt khoát:

| Đề xuất Ban Đầu của AI | Vấn Đề / Rủi Ro Phát Hiện Được | Quyết Định & Chỉnh Sửa của Con Người |
| :--- | :--- | :--- |
| **1. Tính tồn kho cuối kỳ bằng `SUM(IN) - SUM(OUT)` trên các phát sinh trong năm.** | **Bẫy Thiếu Số Dư Đầu Kỳ**: Bỏ sót các dòng số dư đầu kỳ `INIT-BALANCE-2024` tại ngày 01/01/2024, làm hụt mất 5,317 units và `$473,436.40` giá trị tài sản kho. | **BÁC BỎ & ÉP BUỘC TÍNH SỐ DƯ ĐẦU KỲ**: Bắt buộc gộp số dư đầu kỳ vào tổng nhập hoặc xử lý như điểm mốc ban đầu của phương trình cân bằng kho: `Ending = Init + In - Out + NetAudit`. |
| **2. Tính Giá vốn hàng bán (COGS) bằng tổng toàn bộ các dòng có `direction = 'OUT'`.** | **Bẫy Thổi Phồng COGS Do Điều Chuyển Nội Bộ**: Gộp cả `TRANSFER_OUT`, `RETURN_VENDOR` và `SCRAP_DAMAGED` vào COGS, làm đội giá vốn lên hơn `$80,000` và làm sai lệch vòng quay kho. | **BÁC BỎ & PHÂN TÁCH LUỒNG GIAO DỊCH**: Chỉ tính COGS cho các giao dịch bán lẻ thực tế `movement_type = 'OUTBOUND_SALE'`. Giao dịch điều chuyển liên kho có Net Zero đối với tài sản toàn chuỗi. |
| **3. Định giá kho bằng cách nhân tồn kho với cột `unit_price` trong bảng sản phẩm.** | **Vi Phạm Chuẩn Mực Kế Toán IAS 02**: Hàng tồn kho phải được ghi nhận theo giá vốn gốc (`unit_cost`), không được ghi nhận theo giá bán niêm yết dự kiến (`unit_price`). | **CHỈNH SỬA TOÀN BỘ CÔNG THỨC ĐỊNH GIÁ**: Nhân tồn kho với `unit_cost`. Cột `unit_price` chỉ dùng để ước tính doanh thu bán hàng tiềm năng. |
| **4. Tính hệ số vòng quay tồn kho toàn chuỗi bằng trung bình cộng các tỷ lệ ngành hàng.** | **Ngụy Biện Bình Quân Tỷ Lệ Phần Trăm**: Lấy trung bình cộng của các phân số có mẫu số vốn khác nhau không đại diện cho vòng quay vốn của toàn doanh nghiệp. | **CHUẨN HÓA CÔNG THỨC TÀI CHÍNH CÓ TRỌNG SỐ**: Lấy Tổng COGS chia cho Tổng Tồn kho bình quân: `Turnover = Total COGS / Average Inventory = 1.22x` (DOH = 300.4 ngày). |
| **5. Dùng lệnh `DROP` xóa bỏ các bản ghi làm tồn kho bị âm tạm thời trong dirty data.** | **Bẫy Mất Mát Dữ Liệu Giao Dịch Hợp Lệ**: Tồn kho âm thực tế phát sinh do độ trễ nhập liệu ERP (xuất bán lúc 08:00 sáng trước khi nhập PO lúc 18:00 chiều cùng ngày). | **ÁP DỤNG KỸ THUẬT RE-SEQUENCING**: Giữ nguyên dữ liệu bán hàng, giải thích căn nguyên do độ trễ ERP và điều chỉnh lại trình tự chuỗi thời gian logic trong ngày. |
| **6. Gộp hàng trả về chưa kiểm định QA (`PENDING_INSPECTION`) vào hàng khả dụng để bán.** | **Rủi Ro Bán Khống Hàng Lỗi Cho Khách Tiếp Theo**: Hàng khách hoàn trả chưa qua kiểm định kỹ thuật nếu đưa vào bán ngay sẽ gây phàn nàn dịch vụ. | **CÁCH LY VÀO PHÂN VÙNG QUARANTINE**: Xây dựng công thức phân biệt rõ giữa Tồn kho vật lý (Physical Stock) và Tồn kho thương mại khả dụng (Available Stock). |
| **7. Xuất file `rubric.json` bằng PowerShell `Out-File -Encoding utf8`.** | **Lỗi Crash Hệ Thống do UTF-8 BOM**: PowerShell 5.1 tự chèn byte order mark `\ufeff` vào đầu file JSON, khiến hàm `json.load()` của Python ném lỗi `JSONDecodeError`. | **CHUẨN HÓA PURE UTF-8 QUA PYTHON FILE I/O**: Sử dụng Python file I/O không BOM để lưu toàn bộ file JSON, bảo đảm tính tương thích tuyệt đối cho môi trường Linux/CI/CD. |
| **8. Dùng ký tự `$` trong nhãn văn bản của script vẽ sơ đồ kiến trúc Matplotlib.** | **Lỗi Runtime Matplotlib Mathtext ParseException**: Matplotlib mặc định coi ký tự `$` là ký hiệu mở công thức toán học LaTeX. | **THAY THẾ BẰNG KÝ HIỆU TIỀN TỆ `USD`**: Chuẩn hóa toàn bộ nhãn biểu đồ sang định dạng `USD`, loại bỏ hoàn toàn lỗi cú pháp vẽ sơ đồ. |

---

## 4. Kiểm chứng Độc lập (Independent Verification Logs)

Mọi cấu phần kỹ thuật của Task 13 đều được kiểm chứng độc lập thông qua dòng lệnh CLI, kịch bản workflow và bộ kiểm thử tự động.

### 4.1. Kết Quả Chạy Động Cơ Đối Soát Số Liệu 3 Chiều (`cross_verification_engine.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task13/scripts/cross_verification_engine.py
```
**Nhật ký thực tế từ Terminal**:
```text
================================================================================
CYBERSOFT DATA & AI LAB — 3-WAY INVENTORY RECONCILIATION ENGINE (CAPSTONE DA-02)
================================================================================

[BANG DOI SOAT SO LIEU 3 CHIEU DOC LAP (TRIANGULATION TABLE)]
----------------------------------------------------------------------------------------
Chi so doi soat (KPI)            | Method 1 (SQL)  | Method 2 (Pandas) | Method 3 (Matrix)
----------------------------------------------------------------------------------------
Ending Physical Stock (Units)    | 9272            | 9272              | 9272            
Ending Inventory Valuation       | USD 867,636.11  | USD 867,636.11    | USD 867,636.11  
Total Cost of Goods Sold (COGS)  | USD 814,742.22  | USD 814,742.22    | USD 814,742.22  
----------------------------------------------------------------------------------------

[KET QUA DO LECH CHEO (CROSS-VERIFICATION DELTAS)]
- Delta Units: 0 (Tolerance: 0 units)
- Delta Valuation: USD 0.00 (Tolerance: USD 0.05)
- Delta COGS: USD 0.00 (Tolerance: USD 0.05)

[DOI SOAT VOI CHUAN GROUND TRUTH BENCHMARK]
- Ground Truth Units: 9272 -> Status: MATCH
- Ground Truth Valuation: USD 867,636.11 -> Status: MATCH
- Ground Truth COGS: USD 814,742.22 -> Status: MATCH

>>> KET LUAN: DOI SOAT 3 CHIEU THANH CONG TUYET DOI (100% RECONCILED - ZERO DELTA) <<<
```

### 4.2. Kết Quả Chạy Kịch Bản Demo Toàn Diện (`demo_capstone_workflow.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task13/scripts/demo_capstone_workflow.py
```
**Nhật ký thực tế từ Terminal**:
```text
================================================================================
CYBERSOFT DATA & AI LAB — DEMO WORKFLOW KIỂM ĐỊNH TOÀN DIỆN CAPSTONE DA-02
================================================================================

[BƯỚC 1/4] KIỂM TRA CẤU TRÚC THƯ MỤC VÀ TÍNH TOÀN VẸN DỮ LIỆU...
  [PASS] Toàn bộ 7 thư mục cốt lõi của Capstone DA-02 tồn tại đầy đủ.

[BƯỚC 2/4] QUÉT PHÒNG VỆ RÒ RỈ ĐÁP ÁN (ZERO ANSWER LEAKAGE SCAN)...
  [PASS] Miền student_edition hoàn toàn sạch (100% CLEAN - Không rò rỉ Ground Truth).

[BƯỚC 3/4] KHỞI CHẠY ĐỘNG CƠ ĐỐI SOÁT SỐ LIỆU 3 CHIỀU...
  [PASS] Đối soát 3 chiều độc lập (SQL vs Pandas vs Matrix) thành công (Delta = 0.00).

[BƯỚC 4/4] KHỞI CHẠY MÁY CHẤM TỰ ĐỘNG (AUTO-GRADER 60 ĐIỂM)...
======================================================================
CYBERSOFT AUTO-GRADER RESULTS (CAPSTONE DA-02)
======================================================================
  [PASS 10/10] Ending Inventory Units match perfectly (9272 == 9272).
  [PASS 10/10] Ending Inventory Valuation match perfectly (USD 867,636.11 == USD 867,636.11).
  [PASS 10/10] Total COGS match perfectly (USD 814,742.22 == USD 814,742.22).
  [PASS 10/10] Inventory Turnover match perfectly (1.22x == 1.22x).
  [PASS 10/10] Warehouse stock distribution matches across all 3 DCs.
  [PASS 5/5] Reorder point alerts match perfectly (10 SKUs).
  [PASS 5/5] Out-of-stock SKUs match perfectly (1 SKUs).
----------------------------------------------------------------------
 TOTAL AUTOMATED SCORE: 60.0 / 60.0 POINTS
======================================================================
  [PASS] Máy chấm tự động hoàn tất và đạt điểm tuyệt đối 60.0 / 60.0 điểm.

================================================================================
>>> TỔNG KẾT: 4/4 BƯỚC KIỂM ĐỊNH ĐẠT 100% THÀNH CÔNG (EXIT CODE: 0) <<<
================================================================================
```

### 4.3. Kết Quả Chạy Bộ Kiểm Thử Tự Động Pytest (`pytest`)
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task13/tests/ -v
```
**Nhật ký thực tế từ Terminal**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
plugins: anyio-4.14.2, Faker-40.38.0
collected 9 items

tests/test_auto_grader.py::test_auto_grader_execution PASSED                   [ 11%]
tests/test_capstone_integrity.py::test_directory_structure_exists PASSED       [ 22%]
tests/test_capstone_integrity.py::test_clean_and_dirty_datasets_exist PASSED   [ 33%]
tests/test_cross_verification.py::test_cross_verification_engine_runs_successfully PASSED [ 44%]
tests/test_data_validation.py::test_clean_data_sanity PASSED                   [ 55%]
tests/test_data_validation.py::test_clean_data_no_nulls PASSED                 [ 66%]
tests/test_edge_cases.py::test_eight_business_edge_cases_present PASSED        [ 77%]
tests/test_rubric_schema.py::test_rubric_structure PASSED                     [ 88%]
tests/test_zero_leakage.py::test_zero_answer_leakage_in_student_edition PASSED [100%]

============================== 9 passed in 0.46s ==============================
```

---

## 5. Bốn Tầng Năng lực AI theo chuẩn CyberSoft (Four AI Tiers)

| Tầng Năng Lực AI | Biểu Hiện Trong Quá Trình Thực Hiện Task 13 | Minh Chứng Kỹ Thuật Cụ Thể |
| :--- | :--- | :--- |
| **Tầng 1: Prompting & Context Ingestion** | Nạp toàn bộ bối cảnh chuỗi logistics 3 kho, cấu trúc 6 bảng dữ liệu quan hệ, các thông số kỹ thuật (Lead time, Safety stock, ROP) và 10 câu hỏi C-Level vào LLM có cấu trúc logic rõ ràng. | Prompt chi tiết phân vai Principal Supply Chain Architect; yêu cầu sinh ra các truy vấn SQL chuẩn ANSI và mã nguồn Python pipeline có cấu trúc chặt chẽ. |
| **Tầng 2: Harness Engineering & Guardrails** | Xây dựng dàn khung kiểm soát chặt chẽ: bộ quét regex chống rò rỉ đáp án `test_zero_leakage.py`, bộ kiểm tra ràng buộc 100 điểm rubric `test_rubric_schema.py`, và bộ kiểm tra ngoại lệ `test_edge_cases.py`. | Chặn đứng hoàn toàn việc rò rỉ Ground Truth KPIs trong `student_edition/`; phát hiện và kiểm soát 8 ngoại lệ nghiệp vụ trong dữ liệu dirty. |
| **Tầng 3: Evaluation & Ground-Truth Calibration** | Thiết lập hệ thống Ground Truth không thể chối cãi bằng 3 phương pháp đối soát độc lập (SQL Ledger, Python Pandas, Matrix Balance Equation); hiệu chuẩn số liệu với độ lệch Delta = `$0.00` và `0 units`. | `cross_verification_engine.py` chứng minh tính nhất quán số học tuyệt đối: Ending Stock 9,272 units, Ending Valuation $867,636.11, Total COGS $814,742.22. |
| **Tầng 4: Autonomous AI-Native & System Integration** | Tự động hóa hoàn toàn quy trình kiểm thử tự động, đóng gói và chấm điểm độc lập qua `auto_grader.py` (60 điểm). | Kịch bản `demo_capstone_workflow.py` chạy qua 4 giai đoạn tự động, tích hợp hoàn hảo với Pytest suite đạt 9/9 tests passed trong 0.46 giây. |

---
