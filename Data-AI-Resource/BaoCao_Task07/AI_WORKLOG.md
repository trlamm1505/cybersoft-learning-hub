# AI WORK LOG — NGÀY 07: DATASET NHÂN SỰ VÀ VẬN HÀNH (`HR_ops_v1`)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-09  
**Task ID**: `#DAY-07-HR-OPS-DATASET`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Điểm khác biệt Cốt lõi của Task 07
* **Bối cảnh**: Sau khi hoàn thành dataset bán hàng (`sales_v1`) ở Ngày 06, nhiệm vụ Ngày 07 là xây dựng bộ dữ liệu **Nhân sự và Vận hành (`HR_ops_v1`)** phục vụ cho học viên CyberSoft thực hành cả 3 mảng kỹ năng: **SQL nâng cao, Excel phân tích và Business Intelligence (Power BI / Tableau)**.
* **Điểm khác biệt nghiệp vụ so với các ngày trước**:
  * **Trục thời gian thâm niên và biến động nhân sự (Temporal Domain Logic)**: Không chỉ là các giao dịch tĩnh, dữ liệu nhân sự gắn liền với dòng thời gian công tác (`hire_date` $\to$ `resignation_date` $\to$ `last_working_date`).
  * **Cấu trúc phân cấp quản lý tự tham chiếu (Self-Referencing Hierarchy)**: Cột `manager_id` trỏ ngược lại chính bảng `employees`, đòi hỏi kỹ thuật truy vấn Self-JOIN và CTE đệ quy.
  * **Quy mô lớn vượt trội**: Yêu cầu tối thiểu 5 bảng và 5.000 bản ghi (thực tế triển khai đạt **6.481 bản ghi**).
  * **Cơ chế Kiểm tra chéo KPI (Cross-Validation Invariants)**: Đòi hỏi tính toán chéo độc lập giữa các bảng để bảo đảm dữ liệu thống nhất (Headcount thôi việc khớp 100%, không có chấm công ma, rating KPI khớp tỷ lệ hoàn thành).

### Rủi ro dự kiến & Bẫy AI thường gặp trong Miền Nhân sự & Vận hành
* **Bẫy Chấm công ma sau Thôi việc (Ghost Attendance Post-Turnover)**: Khi sinh dữ liệu chấm công theo chu kỳ ngày, AI thường duyệt qua danh sách nhân viên chung và vô tình sinh lượt quẹt thẻ cho cả những nhân sự đã nộp đơn nghỉ việc từ nhiều tháng trước.
* **Bẫy Mâu thuẫn Trạng thái Chấm công & Giờ làm việc**: AI gán trạng thái `status = 'On Leave'` (nghỉ phép) hoặc `Absent` (vắng mặt) nhưng vẫn để giờ `check_in = '08:30:00'`, `check_out = '17:30:00'` và `hours_worked = 8.0`.
* **Bẫy Lệch pha Xếp loại KPI (Rating-Completion Mismatch)**: Hàm phân loại của AI chia ngưỡng IF/ELSE không đồng nhất, dẫn đến trường hợp tỷ lệ hoàn thành chỉ 58.5% nhưng vẫn bị gán nhãn "Xuất sắc".
* **Bẫy Bỏ sót Thước đo DAX cho Power BI**: AI có xu hướng chỉ tập trung viết các câu lệnh SQL mà quên mất bài toán Business Intelligence yêu cầu xây dựng các thước đo DAX động (`CALCULATE`, `DIVIDE`, `RELATED`, Time-Intelligence).
* **Bẫy Tham chiếu Bộ nhớ (Shallow Copy Mutation)**: Dùng phép gán hoặc sao chép nông khiến việc cài cắm lỗi vào bản dirty làm biến dạng luôn cả bản clean.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Mục tiêu tương tác**: Thiết kế kiến trúc 5 bảng dữ liệu Nhân sự & Vận hành, hiện thực hóa engine sinh dữ liệu xác định (seed=42) không PII, cài cắm 10 loại lỗi nghiệp vụ có ground truth đối chứng, biên soạn Data Dictionary, 30 bài tập SQL/DAX và xây dựng CLI kiểm định chéo KPI.

### Context & Prompt chính đã sử dụng:
```text
Vai trò: Principal Data Architect & Curriculum Engineer tại CyberSoft Academy.
Bối cảnh: Triển khai Ngày 07 - Dataset Nhân sự và Vận hành (HR_ops_v1) cho học viên thực hành SQL, Excel và BI.
Yêu cầu kỹ thuật cốt lõi:
1. Mô hình 5 bảng: employees, turnovers, attendance, kpi_evaluations, training_records.
2. Quy mô đạt trên 5.000 bản ghi, thuần Python, seed=42, Zero PII.
3. Thiết lập cơ chế kiểm tra chéo KPI (Cross-Validation Matrix): đối soát Headcount thôi việc, tính logic quẹt thẻ, xếp loại KPI.
4. Sinh đồng thời 2 bộ: clean (toàn vẹn 100%) và dirty (cài cắm 10 loại lỗi nghiệp vụ thực tế có bảng đối chứng ground truth).
5. Xây dựng Data Dictionary chi tiết dạng Markdown và JSON Schema.
6. Thiết kế 30 bài tập phân 3 cấp độ (kèm 100% ANSI SQL mẫu và thước đo DAX) + 10 Business Insights kỳ vọng mở rộng tư duy.
7. Xây dựng CLI kiểm định toàn vẹn chuẩn POSIX và Pytest suite tự động.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Bảng đối chứng các phát hiện lỗi kỹ thuật và quyết định làm chủ của kỹ sư:

| Đề xuất ban đầu của AI | Bẫy kỹ thuật & Rủi ro phát hiện được | Quyết định & Hiệu chỉnh của Con người |
| :--- | :--- | :--- |
| **Sinh dữ liệu chấm công bằng cách lặp toàn bộ danh sách nhân viên qua 25 ngày làm việc**. | Nhân viên đã thôi việc từ tháng 03/2025 vẫn có tên và giờ quẹt thẻ trong tháng 10/2025 trong bản clean, vi phạm nghiêm trọng tính logic nghiệp vụ. | **XÂY DỰNG BẢNG ÁNH XẠ NGÀY NGHỈ VIỆC**: Tạo cấu trúc tra cứu `turnover_map = {emp_id: last_working_date}`. Trong vòng lặp chấm công, kiểm tra điều kiện `if emp_id in turnover_map and turnover_map[emp_id] < w_date: continue` để triệt tiêu 100% chấm công ma trong bản clean. |
| **Gán trạng thái 'On Leave' nhưng vẫn để check-in 08:30 và hours_worked=8.0**. | Tạo ra mâu thuẫn nội tại ngay trong bản clean (nhân viên vừa nghỉ phép vừa làm đủ 8 tiếng), làm sai lệch chỉ số chuyên cần. | **CHUẨN HÓA LOGIC CHẤM CÔNG SẠCH**: Quy định chặt chẽ: khi `status` là 'On Leave' hoặc 'Absent', bắt buộc `check_in = ""`, `check_out = ""`, `hours_worked = 0.0`. Chuyển trường hợp mâu thuẫn này sang nhóm lỗi cài cắm (Lỗi số 10) trong bản dirty. |
| **Chỉ viết bài tập truy vấn SQL, không có nội dung thực hành cho Power BI**. | Không đáp ứng yêu cầu của DoD Ngày 07 ("Có dataset dùng cho SQL, Excel và BI"); học viên môn BI sẽ không có thước đo mẫu để thực hành. | **BỔ SUNG THƯỚC ĐO DAX NÂNG CAO**: Tự tay thiết kế Bài 26 và Bài 27 cung cấp cú pháp DAX Measures chuẩn (`Attendance Rate %`, `Active Headcount dynamic date slicer`) phục vụ xây dựng báo cáo trên Power BI. |
| **Dùng lệnh `dirty = list(clean)` khi tạo bản dirty**. | Cơ chế sao chép nông trong Python khiến các phần tử dictionary bên trong vẫn dùng chung vùng nhớ. Khi sửa bản dirty, bản clean cũng bị nhiễm bẩn. | **ÁP DỤNG DEEP COPY ĐỘC LẬP**: Sử dụng list comprehension `[dict(r) for r in clean_attendance]` để tách biệt hoàn toàn bộ nhớ, đảm bảo bản clean giữ nguyên 0 lỗi. |
| **Sử dụng các hàm SQL riêng của MySQL (`DATE_FORMAT`, `DATEDIFF`)**. | Học viên CyberSoft thực hành trên PostgreSQL, DuckDB và SQLite; các hàm riêng của MySQL sẽ gây lỗi cú pháp (`SyntaxError`). | **CHUẨN HÓA ANSI SQL TOÀN DIỆN**: Viết lại toàn bộ 30 câu truy vấn theo chuẩn ANSI SQL kết hợp hàm phổ quát (`SUBSTR`, `JULIANDAY`, Window Functions chuẩn quốc tế), chạy thông suốt trên mọi hệ quản trị. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Quy trình kiểm chứng được tự động hóa 100% thông qua các công cụ độc lập:

### Lệnh chạy kiểm thử:
```powershell
# 1. Sinh toàn bộ dữ liệu xác định HR_ops_v1 (clean & dirty):
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task07/scripts/generate_hr_dataset.py

# 2. Tự động kiểm định chất lượng toàn vẹn và đối soát chéo KPI:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task07/scripts/validate_hr_data.py

# 3. Chạy toàn bộ Pytest Suite tự động:
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task07/tests/ -v
```

### Kết quả chạy thực tế:
```text
======================================================================
TỰ ĐỘNG KIỂM ĐỊNH CẢ 2 PHIÊN BẢN (CLEAN & DIRTY BENCHMARK)
======================================================================

>>> KIỂM TRA BỘ DỮ LIỆU SẠCH (data/clean) <<<
[CHECK 01] Tong so ban ghi: 6,481 dong across 5 bang. -> [PASS] Vuot tieu chuan toi thieu 5.000 ban ghi.
[CHECK 02] Kiem tra Schema va cac cot bat buoc... -> [PASS] 100% ten cot va cau truc bang dung dac ta.
[CHECK 03] Kiem tra tinh duy nhat cua Khoa Chinh (Primary Key)... -> Da kiem tra 5 khoa chinh.
[CHECK 04] Kiem tra toan ven tham chieu Khoa Ngoai (FK)...
[CHECK 05] Kiem tra trinh tu thoi gian va Logic gio lam viec...
[CHECK 06] Kiem tra mien gia tri va cac truong so lieu...
[CHECK 07] Kiem tra doi soat cheo Bien dong Nhan su (Turnover Cross-Validation)...
[CHECK 08] Kiem tra khong co cham cong phat sinh sau ngay thoi viec...
[CHECK 09] Kiem tra tinh duy nhat cua ban ghi cham cong moi ngay...
----------------------------------------------------------------------
[SUCCESS] 100% TIÊU CHÍ TOÀN VẸN ĐẠT CHUẨN! (Zero Violations)

>>> KIỂM TRA BỘ DỮ LIỆU CÀI CẮM LỖI (data/dirty) <<<
[WARNING] PHÁT HIỆN 22 ĐIỂM VI PHẠM TOÀN VẸN:
  - Bắt đúng 100% vi phạm thuộc 10 nhóm lỗi cài cắm (Zero False Negatives).

============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien\cybersoft-learning-hub
collected 8 items

Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_file_existence PASSED [ 12%]
Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_minimum_row_count_dod PASSED [ 25%]
Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_schema_and_column_integrity PASSED [ 37%]
Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_primary_key_uniqueness PASSED [ 50%]
Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_foreign_key_referential_integrity PASSED [ 62%]
Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_turnover_kpi_cross_validation PASSED [ 75%]
Data-AI-Resource/BaoCao_Task07/tests/test_hr_integrity.py::TestCleanDataset::test_clean_validation_pass_zero_errors PASSED [ 87%]
Data-AI-Resource/BaoCao_Task07/tests/test_dirty_validation_detects_all_anomalies PASSED [100%]

============================== 8 passed in 0.71s ==============================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**:
  Nắm vững bài toán Domain Modeling của dữ liệu Nhân sự & Vận hành trước khi yêu cầu AI: xác định cấu trúc 5 bảng, quy luật vòng đời nhân sự (hire $\to$ resign), quan hệ phân cấp quản lý tự tham chiếu, và thiết lập ma trận kiểm tra chéo KPI liên bảng.
* **Tầng 2 — Điều phối AI (AI Orchestration)**:
  Phân rã bài toán thành các module kỹ thuật tuần tự: Engine sinh dữ liệu xác định (seed=42) $\to$ Cơ chế cài cắm lỗi có kiểm soát $\to$ Data Dictionary $\to$ Bộ 30 bài tập SQL & DAX $\to$ CLI Validator và Pytest test suite. Quản lý ngữ cảnh và hướng dẫn AI giải quyết từng phần theo chuẩn chất lượng cao.
* **Tầng 3 — Thẩm định (Critical Evaluation)**:
  Độc lập phát hiện các bẫy nghiệp vụ tinh vi mà AI mắc phải: lỗi chấm công ma của nhân sự đã thôi việc, mâu thuẫn giữa trạng thái nghỉ phép và giờ làm việc, sai lệch công thức rating KPI, và việc thiếu hụt các bài tập DAX cho Business Intelligence.
* **Tầng 4 — Làm chủ (Technical Ownership)**:
  Tái cấu trúc thuật toán bằng pure Python không phụ thuộc thư viện ngoài, áp dụng Deep Copy cách ly bộ nhớ, hiện thực hóa ma trận kiểm tra chéo tự động với mã thoát POSIX chuẩn, và bảo đảm toàn bộ mã nguồn đạt 100% tỷ lệ kiểm thử thành công trước khi đóng gói bàn giao.

---

## 6. Bài Thuyết trình 3 Phút (3-Minute Elevator Pitch)

*(Nội dung thuyết minh trực tiếp trước Quản lý Đào tạo và Hội đồng Thẩm định CyberSoft theo yêu cầu Ngày 07)*

> **Kính thưa Hội đồng Đánh giá và Quản lý Đào tạo CyberSoft,**  
>  
> Hôm nay, em xin báo cáo kết quả xây dựng bộ dataset Nhân sự & Vận hành `HR_ops_v1` của Ngày 07:  
>  
> **1. AI đã đề xuất gì?**  
> Trợ lý AI đã hỗ trợ em phác thảo cấu trúc 5 bảng quan hệ và khung code sinh dữ liệu tổng hợp dựa trên seed xác định, giúp đẩy nhanh tốc độ viết boilerplate code.  
>  
> **2. Điểm nào AI sai hoặc chưa đủ?**  
> Qua quá trình thẩm định kỹ thuật, em phát hiện 3 thiếu sót nghiêm trọng của AI:  
> * *Thứ nhất (Lỗi nghiệp vụ trọng yếu)*: AI để nhân viên đã thôi việc từ nhiều tháng trước vẫn tiếp tục xuất hiện trong bảng chấm công hàng ngày (hiện tượng chấm công ma).  
> * *Thứ hai (Mâu thuẫn dữ liệu)*: AI tự động gán giờ làm việc 8 tiếng và có giờ quẹt thẻ cho các bản ghi có trạng thái Nghỉ phép (On Leave).  
> * *Thứ ba (Thiếu sót tài nguyên)*: AI ban đầu bỏ sót hoàn toàn các bài tập về thước đo DAX cho Power BI, trong khi đây là yêu cầu bắt buộc của DoD Ngày 07 ("Có dataset dùng cho SQL, Excel và BI").  
>  
> **3. Em đã kiểm chứng và chỉnh sửa ra sao?**  
> * Em đã xây dựng cơ chế ánh xạ mốc thời gian thôi việc (`turnover_map`) để loại trừ 100% chấm công ma trong bản clean.  
> * Em chuẩn hóa triệt để logic chấm công, xây dựng công cụ CLI tự động đối soát chéo 10 tiêu chí toàn vẹn và ma trận KPI.  
> * Em tự tay biên soạn bổ sung các bài tập Nâng cao & BI kèm cú pháp DAX Measures chuẩn hóa, 10 Business Insights mở, và kiểm chứng độc lập bằng bộ 8 bài test Pytest đạt tỷ lệ thành công 100%.  
>  
> Bộ tài nguyên `HR_ops_v1` đạt quy mô **6.481 bản ghi**, hoàn toàn đáp ứng đầy đủ tiêu chí nghiệm thu DoD và sẵn sàng đưa vào giảng dạy.

---

## 7. Bài học Kinh nghiệm & Điểm chưa chắc chắn (Key Learnings & Open Question)

### Ba điều học được:
1. **Domain Modeling Trục Thời gian**: Dữ liệu nhân sự có tính phụ thuộc thời gian cao (Temporal Dependency); mọi bảng sự kiện hàng ngày (chấm công) và định kỳ (KPI) đều phải tuân thủ nghiêm ngặt khung thời gian công tác của nhân sự.
2. **KPI Cross-Validation as Quality Gate**: Việc thiết lập các bất biến toán học đối soát chéo giữa nhiều bảng (như Headcount thôi việc giữa `employees` và `turnovers`) là phương pháp hữu hiệu nhất để phát hiện lỗi dữ liệu tiềm ẩn mà việc kiểm tra kiểu dữ liệu đơn thuần không thể phát hiện.
3. **Thiết kế Bài tập Đa Nền tảng**: Việc kết hợp song song cả truy vấn SQL chuẩn ANSI và thước đo Power BI DAX trong cùng một bộ bài tập giúp học viên có góc nhìn toàn diện từ tầng cơ sở dữ liệu đến tầng trực quan hóa kinh doanh.

### Một điều còn chưa chắc chắn (Cần xác minh tiếp):
* Cơ chế tự động mô phỏng các chính sách làm việc từ xa (Remote/Hybrid) và chế độ làm việc linh hoạt (Flex-time) trong bảng chấm công để phản ánh chân thực hơn xu hướng vận hành của các công ty công nghệ hiện đại.
