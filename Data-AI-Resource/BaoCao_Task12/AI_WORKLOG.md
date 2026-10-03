# AI WORK LOG — NGÀY 12: TẠO DỰ ÁN DATA ANALYST SỐ 1 (CAPSTONE DA-01)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-16  
**Task ID**: `#DAY-12-DATA-ANALYST-CAPSTONE-01`  

---

## 1. BÀI TOÁN VÀ GIẢ ĐỊNH TRƯỚC KHI GỌI AI (PRE-AI BASELINE)

### 1.1. Bối Cảnh Nghiệp Vụ & Yêu Cầu Kỹ Thuật Ban Đầu
* **Mục tiêu**: Xây dựng bài tập lớn (Capstone Project) chuẩn mực công nghiệp số 1 cho học viên chuyên ngành Dữ liệu — **CyberSoft Mart Sales Performance, Customer Cohorts & Executive BI (Mã DA-01)**. Dự án phải trang bị đầy đủ tài nguyên cho học viên (`student_edition`), cẩm nang giải pháp và máy chấm tự động cho giảng viên (`instructor_edition`), barem rubric 100 điểm định lượng, 3 phương pháp kiểm chứng số liệu độc lập, danh mục 8 lỗi thường gặp, và bộ máy chấm tự động auto_grader.
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  1. **Thời lượng chuẩn 8 — 12 giờ**: Thiết kế khối lượng công việc phù hợp cho đồ án capstone, phân tầng rõ 70 điểm Core (năng lực hành nghề tiêu chuẩn) và 30 điểm Extension (năng lực nâng cao RFM & Cohort).
  2. **10 Câu hỏi nghiệp vụ Stakeholder**: Bao quát toàn diện các mối quan tâm chiến lược từ Ban Giám đốc (CEO, CFO, CCO, CMO, Head of Ops).
  3. **12 Nhiệm vụ kỹ thuật tuần tự**: Từ Data Profiling, Cleansing, Dimensional Modeling, SQL Aggregation, Time-series, Pareto, Geographic, Operational Risk, RFM Quintiles, Cohort Retention đến Executive Dashboard Mockup và Executive Memo.
  4. **Tối thiểu 3 phương pháp đối soát độc lập**: Số liệu cốt lõi (Net Revenue `$388,850.28`, Gross Margin `31.43%`, AOV `$1,150.44`) phải được chứng minh trùng khớp tuyệt đối qua SQL Queries, Python Pandas, và Matrix Line-Item Model với sai số chéo Delta = `$0.00`.
  5. **Bảo mật rò rỉ đáp án (Zero Answer Leakage)**: Miền học viên hoàn toàn sạch tệp giải, không chứa ground-truth values trong đề bài.
  6. **Cẩm nang 8 lỗi sai kinh điển**: Liệt kê chi tiết 8 bẫy lỗi học viên hay mắc phải kèm nguyên nhân gốc và cơ chế phát hiện tự động.
  7. **Bộ máy chấm tự động & kiểm thử**: Hoàn thành script chấm tự động `auto_grader.py` (60 điểm) và bộ test suite Pytest 100% PASS.
  8. **Kiểm thử tự động & Báo cáo Word**: Pytest suite đạt 100% PASS, kịch bản demo đạt Exit Code 0, và văn bản Word chính thức được sinh tự động.

### 1.2. Rủi Ro Dự Kiến & Bẫy AI Thường Gặp (Pre-Emptive Trap Analysis)
Trước khi đưa câu lệnh vào các mô hình AI, kỹ sư con người đã dự báo và thiết lập chốt chặn phòng ngừa 6 cạm bẫy kỹ thuật điển hình:
1. **Bẫy Tính Cả Đơn Hàng Hủy Vào Doanh Thu (Cancelled Orders Revenue Trap)**: AI thường viết truy vấn ngây thơ `SELECT SUM(total_amount) FROM orders`, dẫn đến tính cả 43 đơn bị hủy và 19 đơn hoàn trả, làm sai lệch doanh thu hơn `$73,000` so với dòng tiền thực tế.
2. **Bẫy Nhân Đôi Mặt Hàng Khi JOIN Bảng Thô (Duplicate Multiplication Trap)**: Nếu thực hiện `JOIN` giữa `orders` và `order_items` trước khi khử 2 dòng trùng lặp khóa chính `order_id`, số lượng mặt hàng sẽ bị nhân bản, thổi phồng doanh thu và lợi nhuận.
3. **Bẫy Xóa Nhầm Đơn Hàng Khuyết Trạng Thái (Dropna Missing Status Trap)**: AI có xu hướng dùng `dropna()` để xử lý các ô rỗng trong `order_status`, vô tình xóa bỏ 5 đơn hàng giao dịch thành công, làm thất thoát gần `$5,000` doanh thu hợp lệ.
4. **Bẫy Ngụy Biện "Trung Bình của Các Tỷ Lệ Phần Trăm" (Average of Percentages Fallacy)**: AI tính biên lợi nhuận của từng sản phẩm rồi dùng `AVERAGE()` để tính biên lợi nhuận toàn chuỗi, vi phạm nguyên lý toán học thống kê có trọng số.
5. **Bẫy Crash Phân Vị RFM Do Dữ Liệu Trùng Lặp (Tied Bins Quantile Crash)**: Khi nhiều khách hàng có cùng số lần mua hàng ($F = 1$), hàm `pd.qcut` của Pandas sẽ crash với lỗi `ValueError: Bin edges must be unique`.
6. **Bẫy Bỏ Quên Phí Vận Chuyển Khi Đối Soát Cấp Mặt Hàng (Shipping Fee Discrepancy Trap)**: Doanh thu trên bảng `orders` chứa cả tiền hàng và phí ship (`shipping_fee = $1,755.00`). Nếu đối soát cấp mặt hàng (`order_items`) mà không cộng phí ship thì 2 phương pháp sẽ lệch nhau đúng `$1,755.00`.

---

## 2. NHẬT KÝ TƯƠNG TÁC AI (AI INTERACTION LOG)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Vai trò giả định (Persona)**: Principal Data Architect & Curriculum Lead tại CyberSoft Academy.
* **Mục tiêu**: Xây dựng toàn bộ các tệp đặc tả, starter kit, cẩm nang giải pháp, động cơ đối soát 3 chiều, máy chấm tự động và bộ kiểm thử tự động Pytest cho Capstone DA-01.

### Context & Prompt Chính Đã Sử Dụng:
```text
Bạn là Principal Data Architect & Head of Assessment Engineering tại CyberSoft Academy.
Bối cảnh: Triển khai NGÀY 12 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng dự án Data Analyst số 1 (Capstone DA-01: CyberSoft Mart Sales Performance,
Customer Cohorts & Executive BI) dùng phối hợp Excel, SQL và BI Dashboard.

Yêu cầu kỹ thuật chi tiết:
1. Soạn thảo PROJECT_BRIEF.md cho học viên:
   - Bối cảnh chuỗi bán lẻ CyberSoft Mart năm 2024.
   - 10 câu hỏi nghiệp vụ từ C-Level (CEO, CFO, CCO, CMO, Ops).
   - 12 nhiệm vụ kỹ thuật chi tiết từ Data Profiling đến Executive Dashboard.
   - Thời lượng chuẩn: 8 - 12 giờ.
2. Xây dựng starter_kit/ cho học viên:
   - data_dictionary.md (mô tả 4 bảng orders, order_items, customers, products).
   - analysis_starter.sql (mã khung SQL kèm chú thích các nhiệm vụ).
   - analysis_starter.py (mã khởi động Python kiểm tra dữ liệu ban đầu).
   - excel_template_guide.md (hướng dẫn cấu trúc 5 sheets và công thức Excel nâng cao).
   - submission_checklist.md (danh mục 12 tiêu chí tự kiểm tra).
3. Thiết lập rubric.json theo chuẩn JSON Schema Draft 2020-12:
   - 100 điểm: 70 điểm Core (Clean, SQL/Financial, Product/Geo, Dashboard) và 30 điểm Extension (RFM, Cohort).
   - 100% tiêu chí có quantitative_metric số học, không dùng từ ngữ cảm tính.
4. Xây dựng instructor_edition/:
   - SOLUTION_MANUAL.md (lời giải cho 10 câu hỏi C-Level và khuyến nghị Quý 1).
   - expected_kpis.json (Ground Truth Net Revenue $388,850.28, Gross Margin 31.43%, AOV $1,150.44).
   - common_pitfalls.md (8 bẫy lỗi kinh điển của học viên).
   - solutions/ (solution_queries.sql, solution_da01_pipeline.py, excel_model_specification.md).
   - grading/auto_grader.py (chấm tự động 60/100 điểm định lượng).
5. Xây dựng scripts/cross_verification_engine.py:
   - Đối soát số liệu 3 chiều độc lập: SQL Engine vs Python Pandas vs Matrix Line-Item Model.
   - Chứng minh độ lệch Delta = $0.00.
6. Bộ kiểm thử Pytest 11 tests đạt 100% PASS và sơ đồ kiến trúc Picture_12-Detail.png.
```

---

## 3. THẨM ĐỊNH VÀ QUYẾT ĐỊNH CỦA CON NGƯỜI (HUMAN EVALUATION & DECISIONS)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động rà soát mã nguồn, phân tích nguyên lý kế toán và đưa ra các quyết định hiệu chỉnh dứt khoát:

| Đề xuất Ban Đầu của AI | Vấn Đề / Rủi Ro Phát Hiện Được | Quyết Định & Chỉnh Sửa của Con Người |
| :--- | :--- | :--- |
| **Tính Net Revenue bằng tổng cột `total_amount` của toàn bộ bảng `orders.csv`.** | **Bẫy Doanh Thu Đơn Hủy**: Đơn hàng có trạng thái `cancelled` (43 đơn) và `returned` (19 đơn) không mang lại dòng tiền thực nhận, làm phồng doanh thu lên `$462,310.50`. | **BÁC BỎ & ÉP BUỘC ĐIỀU KIỆN LỌC NGHIỆM NGẶT**: Định nghĩa Net Revenue chỉ tính trên các đơn hàng có trạng thái `completed` (338 đơn), đối soát chính xác với Ground Truth `$388,850.28`. |
| **Bỏ qua phí vận chuyển khi đối soát cấp dòng mặt hàng (`order_items`).** | **Lệch Số Học Giữa Hai Cấp Độ Chi Tiết**: Tổng doanh thu mặt hàng là `$387,095.28`, trong khi doanh thu cấp đơn hàng là `$388,850.28` (lệch đúng `$1,755.00`). | **BỔ SUNG ĐỐI SOÁT PHÍ VẬN CHUYỂN**: Làm rõ nguyên lý kế toán: `Tổng Hóa Đơn = Tiền Hàng ($387,095.28) + Tiền Ship ($1,755.00) = $388,850.28`. Hiệu chỉnh Phương pháp 3 để Delta chênh lệch đạt `$0.00` tuyệt đối. |
| **Tự động dùng `dropna(subset=['order_status'])` khi viết code làm sạch.** | **Bẫy Thất Thoát Dữ Liệu Hợp Lệ**: Làm mất 5 đơn hàng hợp lệ đã giao nhận thành công, khiến số đơn sạch giảm còn 395 dòng và hụt `$4,950` doanh thu. | **THAY THẾ BẰNG QUY CHUẨN ĐIỀN KHUYẾT CÓ CƠ SỞ (IMPUTATION)**: Sử dụng hàm `COALESCE(NULLIF(order_status, ''), 'completed')`, bảo toàn đầy đủ 400 đơn hàng sạch duy nhất. |
| **Dùng trực tiếp `pd.qcut(df['frequency'], 5)` trong script tính RFM.** | **Lỗi Runtime Crash do Trùng Phân Vị**: Hơn 50% khách hàng chỉ mua 1 lần dẫn đến các mốc phân vị bị trùng nhau, làm crash hàm `qcut`. | **ÁP DỤNG KỸ THUẬT XẾP HẠNG DUY NHẤT**: Dùng `df['frequency'].rank(method='first')` trước khi chia phân vị, giúp thuật toán phân loại RFM chạy mượt mà 100%. |
| **Dùng cột `shipping_city` trong bảng `orders.csv` khi viết code mẫu.** | **Lỗi Lệch Schema Thực Tế**: Trong cơ sở dữ liệu, bảng `orders` chỉ có cột `shipping_fee`; thông tin địa lý `city` nằm ở bảng `customers.csv`. | **CHỈNH SỬA TOÀN BỘ CÂU TRUY VẤN VÀ TỪ ĐIỂN DỮ LIỆU**: Khôi phục đúng cấu trúc schema chuẩn, yêu cầu học viên thực hiện `JOIN` bảng `customers` khi phân tích thị trường theo Tỉnh/Thành phố. |
| **Chỉ định nghĩa 3 nhóm RFM (High, Medium, Low) với tiêu chí cảm tính.** | **Thiếu Độ Phân Hóa Sư Phạm**: Không đủ độ sâu để rèn luyện kỹ năng phân khúc khách hàng đa chiều cho học viên. | **CHUẨN HÓA MÔ HÌNH RFM 5 PHÂN KHÚC QUINTILES**: Xây dựng 5 nhóm chuẩn công nghiệp: *Champions, Loyal Customers, Potential Loyalists, At Risk, Hibernating / Lost* với phân bổ thực tế chuẩn xác (20, 26, 13, 15, 21 khách). |

---

## 4. KIỂM CHỨNG ĐỘC LẬP (INDEPENDENT VERIFICATION LOGS)

Mọi cấu phần kỹ thuật của Task 12 đều được kiểm chứng độc lập thông qua dòng lệnh CLI và kiểm thử tự động.

### 4.1. Kết Quả Chạy Động Cơ Đối Soát Số Liệu 3 Chiều (`cross_verification_engine.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task12/scripts/cross_verification_engine.py
```
**Nhật ký thực tế từ Terminal**:
```text
================================================================================
🔬 CYBERSOFT MART CAPSTONE DA-01 — 3-WAY CROSS-VERIFICATION AUDIT
================================================================================

▶ 1. SQL Engine (SQLite Queries):
   • Total Clean Orders: 400
   • Completed Orders:   338
   • Net Revenue:        $388,850.28
   • Average Order Value:$1,150.44
   • Gross Profit:       $121,652.51
   • Gross Margin:       31.43%

▶ 2. Python Pandas (Vectorized Dataframe):
   • Total Clean Orders: 400
   • Completed Orders:   338
   • Net Revenue:        $388,850.28
   • Average Order Value:$1,150.44
   • Gross Profit:       $121,652.51
   • Gross Margin:       31.43%

▶ 3. Matrix & Line-Item Analytical Model:
   • Total Clean Orders: 400
   • Completed Orders:   338
   • Net Revenue:        $388,850.28
   • Average Order Value:$1,150.44
   • Gross Profit:       $121,652.51
   • Gross Margin:       31.43%

--------------------------------------------------------------------------------
🎯 KẾT QUẢ ĐỐI SOÁT CHÉO: ✅ HOÀN TOÀN TRÙNG KHỚP 100% (DELTA = $0.00)
   Delta Doanh thu: $0.0
   Delta Lợi nhuận: $0.0
   Delta Biên lãi:  0.0%
================================================================================
```

### 4.2. Kết Quả Chạy Kịch Bản Demo Toàn Diện (`demo_capstone_workflow.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task12/scripts/demo_capstone_workflow.py
```
**Nhật ký thực tế từ Terminal**:
```text
================================================================================
🚀 CYBERSOFT DATA & AI LAB — TASK 12 END-TO-END DEMO WORKFLOW
   Dự án: Capstone DA-01 (Sales Performance & Customer Intelligence)
================================================================================

📋 [BƯỚC 1/5] Kiểm tra Cấu Trúc Dự Án Capstone DA-01...
   ✅ Toàn bộ 12 tài nguyên trong student_edition đầy đủ và hợp lệ!
   ✅ Toàn bộ 7 tài nguyên trong instructor_edition đầy đủ và bảo mật!

🛡️ [BƯỚC 2/5] Quét Phòng Vệ Chống Rò Rỉ Đáp Án (Zero-Leakage Scanner)...
   ✅ Kết quả quét: 100% CLEAN — Không tồn tại bất kỳ tệp lời giải nào trong thư mục học viên!

🔬 [BƯỚC 3/5] Thực thi Đối Soát Số Liệu 3 Chiều Độc Lập...
   ✅ 3 Phương pháp đối soát độc lập (SQL, Pandas, Matrix Line-Item) khớp tuyệt đối:
      • Net Revenue:    $388,850.28
      • Gross Margin:   31.43%
      • AOV:            $1,150.44
      • Delta chênh lệch: $0.00 (Chính xác 100%)

🤖 [BƯỚC 4/5] Kiểm thử Khởi Chạy Bộ Chấm Tự Động (Auto-Grading Engine)...
   ✅ Auto-Grader hoàn thành: 60.0 / 60.0 điểm (100.0%)
      • CRIT-01 (Cleaning): 15.0/15.0đ (Khử 100% duplicate thành công (+7.5đ); Đủ 400 dòng sạch và quy chuẩn 5 null thành công (+7.5đ))
      • CRIT-02 (Financial KPIs): 25.0/25.0đ (Net Revenue $388850.28 khớp chuẩn (sai số 0.000% <= 0.05%) (+10đ); AOV $1150.44 khớp chuẩn (+5đ); Gross Margin 31.43% khớp chuẩn (+10đ))
      • CRIT-03 (Operational Metrics): 10.0/10.0đ (Tỷ lệ hủy 10.75% khớp chuẩn (+5đ); Tỷ lệ hoàn 4.75% khớp chuẩn (+5đ))
      • CRIT-05 (RFM Extension): 10.0/10.0đ (Phân loại chuẩn cả 5 nhóm phân khúc RFM (+10đ))


================================================================================
🎉 TẤT CẢ 4 BƯỚC KIỂM ĐỊNH ĐÃ THÀNH CÔNG VƯỢT TRỘI! (EXIT CODE: 0)
================================================================================
```

### 4.3. Kết Quả Chạy Bộ Kiểm Thử Tự Động Pytest (`pytest`)
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task12/tests/ -v
```
**Nhật ký thực tế từ Terminal**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
collected 11 items

tests/test_auto_grader.py::test_auto_grader_perfect_submission PASSED        [  9%]
tests/test_auto_grader.py::test_auto_grader_catches_flawed_submission PASSED [ 18%]
tests/test_capstone_integrity.py::test_student_edition_files_exist PASSED     [ 27%]
tests/test_capstone_integrity.py::test_instructor_edition_files_exist PASSED  [ 36%]
tests/test_cross_verification.py::test_cross_verification_delta_zero PASSED   [ 45%]
tests/test_cross_verification.py::test_cross_verification_matches_ground_truth PASSED [ 54%]
tests/test_data_validation.py::test_csv_shapes_and_columns PASSED            [ 63%]
tests/test_data_validation.py::test_known_data_anomalies_present PASSED      [ 72%]
tests/test_rubric_schema.py::test_rubric_structure_and_point_allocation PASSED [ 81%]
tests/test_zero_leakage.py::test_no_solution_files_in_student_edition PASSED  [ 90%]
tests/test_zero_leakage.py::test_no_ground_truth_kpis_in_student_brief PASSED [100%]

============================= 11 passed in 2.14s ==============================
```

---

## 5. BỐN TẦNG NĂNG LỰC AI THEO CHUẨN CYBERSOFT (FOUR AI TIERS)

| Tầng Năng Lực AI | Biểu Hiện Trong Quá Trình Thực Hiện Task 12 | Minh Chứng Kỹ Thuật Cụ Thể |
| :--- | :--- | :--- |
| **Tầng 1: Prompting & Context Ingestion** | Nạp toàn bộ bối cảnh chuỗi bán lẻ CyberSoft Mart, cấu trúc 4 bảng dữ liệu, các dị biệt cố ý và các câu hỏi stakeholder vào LLM có cấu trúc rõ ràng. | Prompt chi tiết phân vai Principal Data Architect; yêu cầu trả về theo schema JSON Draft 2020-12 và SQL chuẩn ANSI. |
| **Tầng 2: Harness Engineering & Guardrails** | Xây dựng dàn khung kiểm soát chặt chẽ: bộ quét regex chống rò rỉ đáp án, ràng buộc tổng điểm rubric bằng 100, và bộ linter kiểm tra tính toàn vẹn file. | `test_zero_leakage.py` tự động quét phát hiện file giải; hàm sanitize ép `expected_value = None` trong bản học viên. |
| **Tầng 3: Evaluation & Ground-Truth Calibration** | Thiết lập hệ thống Ground Truth không thể chối cãi bằng 3 phương pháp đối soát độc lập (SQL, Python, Matrix Line-Item); hiệu chuẩn số liệu với sai số Delta = `$0.00`. | `cross_verification_engine.py` chứng minh tính nhất quán tuyệt đối giữa doanh thu cấp đơn hàng và doanh thu dòng mặt hàng + phí ship. |
| **Tầng 4: Autonomous AI-Native & System Integration** | Tự động hóa hoàn toàn quy trình kiểm thử tự động, đóng gói và chấm điểm độc lập qua auto_grader.py. | Kịch bản `demo_capstone_workflow.py` chạy qua 4 giai đoạn tự động, xuất phiếu điểm và mã thoát POSIX 0. |
