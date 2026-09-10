# AI WORK LOG — NGÀY 07: DATASET NHÂN SỰ VÀ VẬN HÀNH (`HR_ops_v1`)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-09  
**Task ID**: `#DAY-07-HR-OPS-DATASET`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Tiếp nối chuỗi đầu việc "Tạo tài nguyên dữ liệu" của Tuần 2, nhiệm vụ Ngày 07 là kiến tạo bộ dữ liệu Nhân sự và Vận hành đa bảng (`HR_ops_v1`) phục vụ học viên CyberSoft thực hành cả 3 phân môn: SQL nâng cao (Window Functions, CTEs, Self-JOIN), Excel phân tích (Pivot, XLOOKUP, Dynamic Arrays) và Business Intelligence (Power BI / Tableau với DAX Measures).
* **Yêu cầu kỹ thuật cốt lõi**:
  * Xây dựng mô hình quan hệ gồm tối thiểu **5 bảng dữ liệu**: `employees` (Danh mục nhân sự), `turnovers` (Biến động thôi việc), `attendance` (Chấm công hàng ngày), `kpi_evaluations` (Đánh giá hiệu suất theo quý) và `training_records` (Lịch sử đào tạo nội bộ).
  * Quy mô dữ liệu đạt tối thiểu **5.000 bản ghi** (thực tế triển khai đạt **6.481 bản ghi**).
  * Xây dựng đồng thời 2 phiên bản đối chứng độc lập:
    * `HR_ops_v1_clean`: Đạt chuẩn toàn vẹn thực thể và toàn vẹn tham chiếu 100% (PK-FK), ngày tháng logic, không rò rỉ dữ liệu cá nhân thật (Zero PII Leakage), sẵn sàng cho học viên thực hành.
    * `HR_ops_v1_dirty`: Cài cắm có chủ ý 10 loại lỗi nghiệp vụ thực tế đóng vai trò là "bãi thử nghiệm đối chứng" (testing benchmark) phục vụ bài tập kiểm định chất lượng và làm sạch dữ liệu.
  * Thiết lập cơ chế **kiểm tra chéo KPI (Cross-Validation)** giữa các bảng: Headcount nhân viên thôi việc khớp tuyệt đối 100% giữa `employees` và `turnovers`; không có chấm công ma sau ngày nghỉ việc; xếp loại KPI khớp chính xác với công thức tỷ lệ hoàn thành.
  * Dữ liệu mang tính xác định (deterministic & reproducible) bằng cách cố định `random.seed(42)`.
  * Biên soạn Từ điển dữ liệu chuẩn (Data Dictionary) định dạng Markdown và JSON; thiết kế bộ 30 bài tập phân tích kinh doanh chia 3 cấp độ kèm 100% truy vấn mẫu chuẩn ANSI SQL và thước đo DAX; viết 10 Business Insights kỳ vọng mở rộng tư duy phân tích.
  * Xây dựng công cụ kiểm định tự động (`validate_hr_data.py`) và bộ test suite `pytest`.

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Chấm công ma sau thôi việc (Ghost Attendance)**: Khi sinh dữ liệu chấm công theo chu kỳ ngày, AI thường duyệt qua toàn bộ danh sách nhân viên và vô tình sinh lượt quẹt thẻ cho cả những nhân sự đã thôi việc từ nhiều tháng trước, phá vỡ tính logic thời gian công tác.
* **Mâu thuẫn trạng thái chấm công & Giờ làm việc**: AI gán trạng thái `status = 'On Leave'` (nghỉ phép) hoặc `Absent` (vắng mặt) nhưng vẫn tự động gán giờ `check_in = '08:30:00'`, `check_out = '17:30:00'` và `hours_worked = 8.0`.
* **Lệch pha xếp loại KPI (Rating Mismatch)**: Hàm phân loại IF/ELSE của AI chia ngưỡng không đồng nhất, dẫn đến trường hợp tỷ lệ hoàn thành chỉ 58.5% nhưng vẫn bị gán nhãn "Xuất sắc".
* **Bỏ sót thước đo DAX cho Power BI**: AI có xu hướng chỉ tập trung viết các câu lệnh SQL mà quên mất yêu cầu của DoD Ngày 07 đòi hỏi tài nguyên phục vụ cả mảng Business Intelligence với các thước đo DAX Measures.
* **Bẫy tham chiếu bộ nhớ (Shallow Copy Mutation)**: Sử dụng phép gán nông khiến thao tác sửa dữ liệu khi cài cắm lỗi ở bản dirty làm biến dạng luôn cả bản clean.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash / Claude 3.5 Sonnet).
* **Mục tiêu tương tác**: Thiết kế kiến trúc mô hình quan hệ Star Schema 5 thực thể, hiện thực hóa script sinh dữ liệu tổng hợp xác định (seed=42) không PII, cài cắm 10 lỗi dữ liệu thực tế có ground truth đối chứng, biên soạn Data Dictionary, 30 bài tập SQL/DAX và xây dựng CLI kiểm định chéo KPI.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data Architect & Senior Data Modeler tại CyberSoft Academy.
Bối cảnh: Tiếp nối thành quả Ngày 06 (hoàn thành dataset bán hàng sales_v1), hãy thiết kế và xây dựng bộ dữ liệu nhân sự và vận hành đa bảng (HR_ops_v1) phục vụ học viên thực hành SQL, Excel và Business Intelligence (Power BI).
Ràng buộc kỹ thuật: Local-first, thuần Python (không phụ thuộc thư viện bên ngoài nặng), deterministic với random.seed(42), Zero PII, tương thích hoàn toàn môi trường Windows PowerShell.
Hãy thực hiện các yêu cầu sau theo chuẩn công nghiệp:
1. Thiết kế mô hình Star Schema gồm 5 bảng: employees (250), turnovers (35), attendance (~5.000 dòng), kpi_evaluations (~650 dòng), training_records (450 dòng). Tổng số bản ghi vượt 5.000 dòng.
2. Xây dựng script scripts/generate_hr_dataset.py sinh đồng thời 2 bản: clean (toàn vẹn 100%) và dirty (cài cắm 10 loại lỗi nghiệp vụ thực tế).
3. Thiết lập cơ chế kiểm tra chéo KPI (Cross-Validation Matrix): đối soát Headcount thôi việc, loại trừ chấm công ma, logic quẹt thẻ và thang điểm KPI.
4. Lưu trữ bảng đáp án đối chứng Ground Truth (dirty_data_ground_truth.json và .md) ghi rõ vị trí dòng, cột, giá trị sai, giá trị chuẩn và câu lệnh SQL khắc phục.
5. Viết Data Dictionary chi tiết cấu trúc 5 bảng dạng Markdown và JSON Schema.
6. Biên soạn 30 bài tập phân tích kinh doanh chia 3 cấp độ (Cơ bản, Trung cấp, Nâng cao & BI) kèm 100% truy vấn mẫu chuẩn ANSI SQL và thước đo DAX Measures, đi cùng 10 Business Insights kỳ vọng mở rộng.
7. Xây dựng CLI validate_hr_data.py kiểm tra 10 khía cạnh chất lượng và đối soát chéo KPI, tự động kiểm tra cả 2 bộ clean và dirty.
8. Xây dựng bộ test suite tests/test_hr_integrity.py bằng Pytest kiểm tra toàn diện 8 tiêu chí nghiệm thu.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Sinh dữ liệu chấm công bằng cách lặp toàn bộ danh sách nhân viên qua 25 ngày làm việc**. | Nhân viên đã thôi việc từ tháng 03/2025 vẫn có tên và giờ quẹt thẻ trong tháng 10/2025 trong bản clean, vi phạm nghiêm trọng tính logic nghiệp vụ. | **XÂY DỰNG BẢNG ÁNH XẠ NGÀY NGHỈ VIỆC**: Tạo cấu trúc tra cứu `turnover_map = {emp_id: last_working_date}`. Trong vòng lặp chấm công, kiểm tra điều kiện `if emp_id in turnover_map and turnover_map[emp_id] < w_date: continue` để triệt tiêu 100% chấm công ma trong bản clean. |
| **Gán trạng thái 'On Leave' nhưng vẫn để check-in 08:30 và hours_worked=8.0**. | Tạo ra mâu thuẫn nội tại ngay trong bản clean (nhân viên vừa nghỉ phép vừa làm đủ 8 tiếng), làm sai lệch chỉ số chuyên cần. | **CHUẨN HÓA LOGIC CHẤM CÔNG SẠCH**: Quy định chặt chẽ: khi `status` là 'On Leave' hoặc 'Absent', bắt buộc `check_in = ""`, `check_out = ""`, `hours_worked = 0.0`. Chuyển trường hợp mâu thuẫn này sang nhóm lỗi cài cắm (Lỗi số 10) trong bản dirty. |
| **Chỉ viết bài tập truy vấn SQL, không có nội dung thực hành cho Power BI**. | Không đáp ứng yêu cầu của DoD Ngày 07 ("Có dataset dùng cho SQL, Excel và BI"); học viên môn BI sẽ không có thước đo mẫu để thực hành. | **BỔ SUNG THƯỚC ĐO DAX NÂNG CAO**: Tự tay thiết kế Bài 26 và Bài 27 cung cấp cú pháp DAX Measures chuẩn (`Attendance Rate %`, `Active Headcount dynamic date slicer`) phục vụ xây dựng báo cáo trên Power BI. |
| **Dùng lệnh `dirty = list(clean)` khi tạo bản dirty**. | Cơ chế sao chép nông trong Python khiến các phần tử dictionary bên trong vẫn dùng chung vùng nhớ. Khi sửa bản dirty, bản clean cũng bị nhiễm bẩn. | **ÁP DỤNG DEEP COPY ĐỘC LẬP**: Sử dụng list comprehension `[dict(r) for r in rows]` để tách biệt hoàn toàn 2 vùng nhớ độc lập giữa `clean` và `dirty`, bảo toàn tính nguyên vẹn 100% cho bản clean. |
| **Sử dụng các hàm SQL riêng của MySQL (`DATE_FORMAT`, `DATEDIFF`)**. | Học viên CyberSoft thực hành trên PostgreSQL, DuckDB và SQLite; các hàm riêng của MySQL sẽ gây lỗi cú pháp (`SyntaxError`). | **CHUẨN HÓA ANSI SQL TOÀN DIỆN**: Viết lại toàn bộ 30 câu truy vấn theo chuẩn ANSI SQL kết hợp hàm tương thích cao (`SUBSTR`, `JULIANDAY`, Window Functions `DENSE_RANK()`, `LAG()`, `NTILE()`), chạy mượt mà trên mọi hệ quản trị. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi hệ thống kiểm thử tự động độc lập gồm script sinh dữ liệu, CLI validator và bộ 8 Pytest unit tests.

### Lệnh chạy kiểm thử:
```powershell
# 1. Sinh dữ liệu xác định HR_ops_v1 (clean & dirty):
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task07/scripts/generate_hr_dataset.py

# 2. Tự động kiểm định chất lượng toàn vẹn và đối soát chéo KPI:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task07/scripts/validate_hr_data.py

# 3. Chạy toàn bộ Pytest Suite tự động:
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task07/tests/ -v
```

### Kết quả chạy thực tế:
```text
======================================================================
TỔNG KẾT KIỂM ĐỊNH TOÀN BỘ DATASET TASK 07
======================================================================
  - Bản Clean: 0 lỗi vi phạm -> [PASS]
  - Bản Dirty: 22 lỗi vi phạm được phát hiện -> [PASS: ĐÃ BẮT TRÚNG LỖI]
======================================================================

============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien\cybersoft-learning-hub
collected 8 items

tests/test_hr_integrity.py::TestCleanDataset::test_file_existence PASSED [ 12%]
tests/test_hr_integrity.py::TestCleanDataset::test_minimum_row_count_dod PASSED [ 25%]
tests/test_hr_integrity.py::TestCleanDataset::test_schema_and_column_integrity PASSED [ 37%]
tests/test_hr_integrity.py::TestCleanDataset::test_primary_key_uniqueness PASSED [ 50%]
tests/test_hr_integrity.py::TestCleanDataset::test_foreign_key_referential_integrity PASSED [ 62%]
tests/test_hr_integrity.py::TestCleanDataset::test_turnover_kpi_cross_validation PASSED [ 75%]
tests/test_hr_integrity.py::TestCleanDataset::test_clean_validation_pass_zero_errors PASSED [ 87%]
tests/test_hr_integrity.py::TestDirtyDataset::test_dirty_validation_detects_all_anomalies PASSED [100%]

============================== 8 passed in 0.71s ==============================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Phân tích bài toán Domain Modeling của dữ liệu Nhân sự & Vận hành trước khi gọi AI: xác định cấu trúc 5 bảng quan hệ, quy luật vòng đời nhân sự (`hire_date` $\to$ `resignation_date`), quan hệ phân cấp quản lý tự tham chiếu, và thiết lập ma trận kiểm tra chéo KPI liên bảng.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal Data Architect, giao prompt có cấu trúc rõ ràng, kiểm soát chặt chẽ từng module (Data Generator, Clean/Dirty Injection, Data Dictionary, Bộ 30 bài tập SQL & DAX, CLI Validator và Pytest test suite).
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Độc lập phát hiện và loại bỏ các lỗi logic nghiệp vụ do AI sinh ra: xử lý triệt để hiện tượng chấm công ma của nhân sự đã thôi việc, xóa bỏ mâu thuẫn giữa trạng thái nghỉ phép và giờ làm việc, hiệu chỉnh sai lệch thang rating KPI, và bổ sung các thước đo DAX cho Business Intelligence.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự viết engine Synthetic Generator thuần Python với seed xác định không PII, thiết lập bảng đối chứng Ground Truth chi tiết từng dòng cột và câu lệnh SQL khắc phục, hiện thực hóa CLI tự động kiểm định 2 chiều chuẩn mã thoát POSIX, và làm chủ 100% tài nguyên kỹ thuật bàn giao.
