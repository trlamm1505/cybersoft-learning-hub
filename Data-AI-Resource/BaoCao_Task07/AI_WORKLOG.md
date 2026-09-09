# AI WORK LOG — NGÀY 07: DATASET NHÂN SỰ VÀ VẬN HÀNH (`HR_ops_v1`)

> **Dự án**: CyberSoft Data & AI Lab  
> **Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
> **Ngày thực hiện**: 2026-09-09  
> **Task ID**: `#DAY-07-HR-OPS-DATASET`  

---

## 1. BÀI TOÁN VÀ GIẢ ĐỊNH TRƯỚC KHI GỌI AI (PRE-AI BASELINE)

### 1.1. Mục tiêu & Giả định Nghiệp vụ
* **Mục tiêu**: Xây dựng bộ dataset đa bảng chuẩn doanh nghiệp phục vụ giảng dạy và thực hành cho các môn học SQL Nâng cao, Phân tích dữ liệu với Excel và Business Intelligence (Power BI / Tableau) tại CyberSoft.
* **Yêu cầu kỹ thuật cốt lõi**:
  * Tối thiểu **5 bảng quan hệ** với quy mô trên **5.000 bản ghi**.
  * Thiết kế 2 phiên bản độc lập đối chứng:
    * `HR_ops_v1_clean`: Chuẩn hóa 100% quan hệ PK-FK, dữ liệu thời gian và tiền lương logic, không có lỗi rò rỉ dữ liệu hoặc khóa mồ côi.
    * `HR_ops_v1_dirty`: Cài cắm có chủ ý 10 loại lỗi nghiệp vụ thực tế đóng vai trò là benchmark đối chứng cho các bài thực hành làm sạch dữ liệu.
  * Phải thiết lập được cơ chế **kiểm tra chéo KPI (Cross-Validation)** giữa các bảng (ví dụ: Số lượng nhân sự nghỉ việc trong `employees` phải khớp tuyệt đối với số hồ sơ trong `turnovers`; Không được phép phát sinh chấm công sau ngày thôi việc).
  * Biên soạn **30 bài tập chia 3 cấp độ** kèm Answer Key chuẩn ANSI SQL và thước đo DAX; **10 Business Insights kỳ vọng** mang tính mở, kích thích tư duy giải quyết vấn đề của học viên.
  * Đảm bảo tính tất định (`random.seed(42)`), Zero PII và độc lập không phụ thuộc thư viện ngoài nặng.

### 1.2. Rủi ro dự kiến & Các bẫy AI thường gặp
* **Bẫy Mâu thuẫn Trạng thái Chấm công & Giờ làm**: AI sinh trạng thái "On Leave" hoặc "Absent" nhưng vẫn tự động gán giờ check-in/check-out và số giờ làm việc là 8.0, tạo ra dữ liệu mâu thuẫn nội tại trong cùng một dòng.
* **Bẫy Chấm công sau khi Thôi việc (Ghost Attendance)**: Khi sinh dữ liệu chấm công theo chu kỳ ngày, nếu không đối soát với ngày làm việc cuối cùng (`last_working_date`) của nhân sự đã nghỉ việc, AI sẽ tiếp tục sinh dữ liệu chấm công cho người đã rời công ty.
* **Bẫy Xếp loại KPI sai lệch Ngưỡng hoàn thành**: AI thường viết hàm IF/ELIF gán rating không đồng nhất với công thức `completion_rate`, dẫn tới tình trạng tỷ lệ hoàn thành 58% nhưng lại được xếp loại "Xuất sắc".
* **Bẫy Tham chiếu Bộ nhớ (In-place Mutation)**: Khi tạo bản dirty từ bản clean, nếu chỉ gán biến (`dirty = clean`), các thao tác sửa dữ liệu sẽ làm thay đổi luôn cả bản clean.

---

## 2. NHẬT KÝ TƯƠNG TÁC AI (AI INTERACTION LOG)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Mục tiêu tương tác**: Thiết kế kiến trúc 5 bảng dữ liệu Nhân sự & Vận hành, hiện thực hóa engine sinh dữ liệu xác định (seed=42) không PII, cài cắm 10 loại lỗi có ground truth đối chứng, biên soạn Data Dictionary, 30 bài tập SQL/DAX và xây dựng CLI kiểm định chéo KPI.

### Context & Prompt chính đã sử dụng:
```text
Vai trò: Principal Data Architect & Curriculum Engineer tại CyberSoft Academy.
Nhiệm vụ: Hiện thực hóa toàn diện Task 07 - Dataset Nhân sự & Vận hành (HR_ops_v1).
Ràng buộc:
1. Tối thiểu 5 bảng: employees, turnovers, attendance, kpi_evaluations, training_records.
2. Quy mô tổng thể vượt 5.000 bản ghi, thuần Python, seed=42, Zero PII.
3. Cơ chế kiểm tra chéo KPI (Turnover headcount cross-check, Attendance logic, KPI rating logic).
4. Tạo đồng thời 2 bộ clean và dirty (cài cắm 10 lỗi thực tế kèm bảng ground truth).
5. Xây dựng Data Dictionary (MD, JSON), 30 bài tập phân cấp (kèm 100% ANSI SQL mẫu), 10 insights mở.
6. Xây dựng CLI validator kiểm tra 10 tiêu chí (Exit Code 0 clean, 1 dirty, 2 error) và pytest suite.
```

---

## 3. THẨM ĐỊNH VÀ QUYẾT ĐỊNH CỦA CON NGƯỜI (HUMAN EVALUATION & DECISIONS)

| Đề xuất ban đầu của AI | Vấn đề / Bẫy kỹ thuật phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đề xuất sinh chấm công cho toàn bộ nhân viên trong tất cả các ngày mà không xét trạng thái thôi việc**. | Nhân viên đã thôi việc từ tháng 03/2025 vẫn có lượt quẹt thẻ chấm công vào tháng 10/2025 trong bản clean, phá vỡ tính logic nghiệp vụ và làm sai lệch chỉ số chuyên cần. | **ĐỐI SOÁT NGÀY THÔI VIỆC**: Xây dựng bảng tra cứu `turnover_map = {emp_id: last_working_date}`. Trong vòng lặp sinh chấm công, kiểm tra nghiêm ngặt `if emp_id in turnover_map and turnover_map[emp_id] < w_date: continue` để đảm bảo bản clean tuyệt đối không có chấm công ma. |
| **Gán trạng thái 'On Leave' nhưng vẫn để check_in='08:30:00' và hours_worked=8.0**. | Tạo ra sự mâu thuẫn giữa trạng thái nghỉ phép và dữ liệu quẹt thẻ thực tế ngay trong bộ dữ liệu sạch. | **TÁCH BIỆT LOGIC VẮNG MẶT**: Quy định rõ ràng trong bản clean: nếu `status` là 'On Leave' hoặc 'Absent' thì `check_in = ""`, `check_out = ""`, `hours_worked = 0.0`, `overtime_hours = 0.0`. Chuyển trường hợp mâu thuẫn này sang nhóm lỗi cài cắm có kiểm soát (Lỗi số 10) trong bản dirty. |
| **Dùng lệnh sao chép nông (`dirty = list(clean)`) khi tạo bản bẩn**. | Lệnh `list(clean)` chỉ tạo danh sách mới chứa các tham chiếu trỏ cùng tới các dictionary trong bộ nhớ. Khi sửa bản dirty, bản clean cũng bị biến dạng. | **ÁP DỤNG DEEP COPY ĐỘC LẬP**: Sử dụng list comprehension tạo dictionary mới hoàn toàn: `dirty_att = [dict(r) for r in clean_attendance]`, cách ly 100% vùng nhớ giữa 2 phiên bản. |
| **Viết các câu lệnh SQL mẫu bằng hàm đặc thù của MySQL (`YEAR()`, `DATEDIFF()`)**. | Học viên CyberSoft thực hành trên nhiều nền tảng (PostgreSQL, DuckDB, SQLite, Snowflake); hàm riêng biệt gây lỗi cú pháp khi nạp dữ liệu. | **CHUẨN HÓA ANSI SQL**: Viết lại toàn bộ 30 câu truy vấn theo chuẩn ANSI SQL kết hợp cú pháp phổ quát (`SUBSTR`, `JULIANDAY`, Window Functions chuẩn quốc tế), đảm bảo chạy thông suốt trên mọi hệ quản trị. |
| **Bỏ sót thước đo DAX trong bộ bài tập BI**. | Kế hoạch ngày 07 yêu cầu bộ bài tập phục vụ cả SQL, Excel và BI; nếu thiếu DAX thì học viên BI không có tài nguyên thực hành mô hình hóa. | **BỔ SUNG THƯỚC ĐO DAX CHUẨN**: Thiết kế riêng Bài 26 & Bài 27 cung cấp cú pháp DAX Measures chuyên sâu (CALCULATE, DIVIDE, RELATED, Dynamic Date Filtering) phục vụ thực hành Power BI. |

---

## 4. BẰNG CHỨNG KIỂM CHỨNG ĐỘC LẬP (INDEPENDENT VERIFICATION)

### 4.1. Kết quả Sinh Dữ liệu
```powershell
python Data-AI-Resource/BaoCao_Task07/scripts/generate_hr_dataset.py
```
* **Kết quả**: Sinh thành công **6.481 bản ghi clean** (Vượt mốc 5.000 dòng):
  * `employees.csv`: 250 dòng (215 Active, 35 Resigned)
  * `turnovers.csv`: 35 dòng (Khớp 100% nhân sự Resigned)
  * `attendance.csv`: 5.092 dòng (25 ngày công tiêu chuẩn)
  * `kpi_evaluations.csv`: 654 dòng (Đánh giá định kỳ Q1, Q2, Q3)
  * `training_records.csv`: 450 dòng
* Đã xuất bản bẩn với 22 điểm lỗi cài cắm thuộc 10 nhóm lỗi nghiệp vụ.

### 4.2. Kết quả Chạy CLI Validator
```powershell
python Data-AI-Resource/BaoCao_Task07/scripts/validate_hr_data.py
```
* **Bản clean**: 100% Tiêu chí toàn vẹn ĐẠT CHUẨN (0 vi phạm, Exit Code 0).
* **Bản dirty**: Bắt chính xác 22 vi phạm thuộc 10 nhóm lỗi (Exit Code 0 khi chạy ở chế độ dual-benchmark).

### 4.3. Kết quả Chạy Pytest Suite
```powershell
pytest Data-AI-Resource/BaoCao_Task07/tests/ -v
```
* **Kết quả**: `8 passed in 0.49s` — 100% Test Cases PASSED.

---

## 5. BÀI HỌC KINH NGHIỆM & ĐIỂM CHƯA CHẮC CHẮN

### 5.1. Ba điều học được (Key Learnings)
1. **Domain Modeling trong Dữ liệu Vận hành**: Mô hình hóa dữ liệu nhân sự đòi hỏi sự gắn kết chặt chẽ giữa trục thời gian công tác (`hire_date` $\to$ `resignation_date` $\to$ `last_working_date`) với các bảng Fact phát sinh hàng ngày như Chấm công và KPI.
2. **KPI Cross-Validation as Quality Gate**: Việc đối soát chéo các chỉ số giữa nhiều bảng độc lập (như Headcount thôi việc giữa `employees` và `turnovers`) là chốt chặn quan trọng nhất để ngăn ngừa dữ liệu "rác" lọt vào kho dữ liệu phân tích.
3. **Thiết kế Bài tập Mở (Open Insights)**: Trong đào tạo Data Analyst, bên cạnh việc rèn luyện cú pháp SQL cứng, việc cung cấp các câu hỏi kinh doanh mở kèm gợi ý hướng tiếp cận giúp học viên phát triển tư duy phản biện (Critical Thinking) và kỹ năng kể chuyện bằng dữ liệu (Data Storytelling).

### 5.2. Một điều còn chưa chắc chắn (Open Question)
* Việc tích hợp trực tiếp file cấu hình Calendar tự động (Holiday & Leave Schedule) vào script sinh dữ liệu để mô phỏng chính xác các ngày nghỉ lễ quốc gia của Việt Nam (Tết Nguyên Đán, Giỗ Tổ Hùng Vương, Quốc khánh 2/9) nhằm tăng tính thực tế cho các bài tập phân tích ngày công của học viên.

---

## 6. BÀI THUYẾT TRÌNH 3 PHÚT (3-MINUTE ELEVATOR PITCH)

> *"Kính thưa Hội đồng Đánh giá và Quản lý Đào tạo CyberSoft,*  
> *Hôm nay, em xin trình bày kết quả xây dựng bộ dataset Nhân sự & Vận hành `HR_ops_v1` cho Ngày 07:*  
>  
> *1. **AI đã đề xuất gì?**: Trợ lý AI đã hỗ trợ em phác thảo cấu trúc 5 bảng quan hệ và khung code sinh dữ liệu tổng hợp dựa trên seed xác định.*  
>  
> *2. **Điểm nào AI sai hoặc chưa đủ?**:*  
> *- Thứ nhất, AI mắc lỗi logic nghiêm trọng khi để nhân viên đã thôi việc từ nhiều tháng trước vẫn tiếp tục xuất hiện trong bảng chấm công hàng ngày.*  
> *- Thứ hai, AI tự động gán giờ làm việc 8 tiếng và có quẹt thẻ cho các bản ghi có trạng thái Nghỉ phép (On Leave), gây mâu thuẫn dữ liệu.*  
> *- Thứ ba, AI ban đầu quên thiết kế các bài tập về thước đo DAX trong khi đây là yêu cầu sống còn cho môn Business Intelligence của CyberSoft.*  
>  
> *3. **Em đã kiểm chứng và chỉnh sửa ra sao?**:*  
> *- Em đã tái cấu trúc thuật toán sinh dữ liệu, bổ sung cơ chế kiểm soát mốc thời gian thôi việc để loại trừ hoàn toàn các bản ghi chấm công ma trong bản clean.*  
> *- Em tách biệt triệt để logic chấm công, xây dựng công cụ CLI tự động đối soát chéo 10 tiêu chí toàn vẹn và ma trận KPI.*  
> *- Em đã tự tay biên soạn bổ sung 10 bài tập Nâng cao & BI kèm cú pháp DAX Measures chuẩn hóa, 10 Business Insights mở, và kiểm chứng độc lập bằng bộ 8 test cases Pytest đạt tỷ lệ thành công 100%.*  
>  
> *Sản phẩm bàn giao hoàn toàn đáp ứng đầy đủ tiêu chí nghiệm thu DoD và sẵn sàng đưa vào giảng dạy."*
