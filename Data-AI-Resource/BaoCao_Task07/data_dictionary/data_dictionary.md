# TỪ ĐIỂN DỮ LIỆU BỘ DỮ LIỆU NHÂN SỰ & VẬN HÀNH (`HR_ops_v1`)

> **Dự án**: CyberSoft Data & AI Lab  
> **Bộ dữ liệu**: `HR_ops_v1`  
> **Mô hình**: Relational / Star Schema  
> **Số lượng bảng**: 5 bảng  
> **Quy mô**: 6.481 bản ghi (Clean)  

---

## 1. BẢNG `employees` (Danh mục Nhân sự)
* **Mô tả**: Bảng Dimension lưu trữ thông tin lý lịch, phòng ban, vị trí công tác, mức lương cơ bản và trạng thái của toàn bộ nhân viên.
* **Số lượng bản ghi**: 250 dòng.
* **Khóa chính (PK)**: `employee_id`.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả Nghiệp Vụ | Ví Dụ |
| :--- | :--- | :--- | :--- | :--- |
| `employee_id` | VARCHAR(10) | PRIMARY KEY, NOT NULL | Mã định danh nhân viên duy nhất (chuỗi EMP + 3 số) | `EMP001`, `EMP045` |
| `full_name` | VARCHAR(100) | NOT NULL | Họ và tên đầy đủ của nhân sự (Zero PII) | `Nguyễn Văn An`, `Trần Thị Mai` |
| `gender` | VARCHAR(10) | NOT NULL, IN ('Nam', 'Nữ') | Giới tính của nhân viên | `Nam`, `Nữ` |
| `birth_date` | DATE | NOT NULL, YYYY-MM-DD | Ngày tháng năm sinh (Độ tuổi 22 - 50) | `1992-05-14` |
| `department` | VARCHAR(50) | NOT NULL | Tên phòng ban trực thuộc | `Kỹ thuật & Công nghệ`, `Đào tạo & Học vụ` |
| `position` | VARCHAR(100) | NOT NULL | Chức vụ / Vị trí công việc đảm nhiệm | `Data Engineer`, `Giảng viên Full-stack` |
| `hire_date` | DATE | NOT NULL, YYYY-MM-DD | Ngày ký hợp đồng chính thức gia nhập | `2022-03-15` |
| `base_salary` | DECIMAL(12, 2) | NOT NULL, > 0 | Lương cơ bản hàng tháng (VND) | `22000000.00` |
| `status` | VARCHAR(20) | NOT NULL, IN ('Active', 'Resigned') | Trạng thái công tác hiện tại | `Active`, `Resigned` |
| `manager_id` | VARCHAR(10) | NULLABLE, FK (`employees.employee_id`) | Mã nhân viên của người quản lý trực tiếp | `EMP001`, NULL (nếu là cấp cao nhất) |
| `work_location` | VARCHAR(50) | NOT NULL | Địa điểm văn phòng làm việc | `Hồ Chí Minh`, `Hà Nội`, `Đà Nẵng` |

---

## 2. BẢNG `attendance` (Chấm công & Chuyên cần Hàng ngày)
* **Mô tả**: Bảng Fact ghi nhận lịch sử vào ca, ra ca, số giờ làm việc thực tế, thời gian làm thêm (OT) và trạng thái chuyên cần theo ngày.
* **Số lượng bản ghi**: 5.092 dòng.
* **Khóa chính (PK)**: `attendance_id`.
* **Khóa ngoại (FK)**: `employee_id` trỏ đến `employees(employee_id)`.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả Nghiệp Vụ | Ví Dụ |
| :--- | :--- | :--- | :--- | :--- |
| `attendance_id` | VARCHAR(15) | PRIMARY KEY, NOT NULL | Mã bản ghi chấm công (chuỗi ATT + 5 số) | `ATT00001`, `ATT01520` |
| `employee_id` | VARCHAR(10) | FOREIGN KEY, NOT NULL | Mã nhân viên tương ứng | `EMP012` |
| `work_date` | DATE | NOT NULL, YYYY-MM-DD | Ngày làm việc trong lịch công tác | `2025-10-15` |
| `check_in` | TIME | NULLABLE, HH:MM:SS | Giờ quẹt thẻ vào ca (Chuẩn: 08:30:00) | `08:24:15`, NULL (nếu vắng/nghỉ phép) |
| `check_out` | TIME | NULLABLE, HH:MM:SS | Giờ quẹt thẻ ra ca (Chuẩn: 17:30:00) | `17:45:00`, `19:30:00` |
| `hours_worked` | DECIMAL(4, 1) | NOT NULL, >= 0 | Tổng số giờ làm việc thực tế trong ngày | `8.0`, `9.5`, `0.0` |
| `overtime_hours`| DECIMAL(4, 1) | NOT NULL, >= 0 | Số giờ làm thêm ngoài giờ hành chính | `0.0`, `1.5`, `2.0` |
| `status` | VARCHAR(25) | NOT NULL | Trạng thái chuyên cần trong ngày | `Present`, `Late`, `Early Departure`, `On Leave`, `Absent` |

---

## 3. BẢNG `kpi_evaluations` (Đánh giá Hiệu suất Định kỳ)
* **Mô tả**: Bảng Fact ghi nhận kết quả đánh giá KPI hàng quý (Q1, Q2, Q3) theo mục tiêu, tỷ lệ hoàn thành và xếp loại hiệu suất.
* **Số lượng bản ghi**: 654 dòng.
* **Khóa chính (PK)**: `kpi_id`.
* **Khóa ngoại (FK)**: `employee_id` trỏ đến `employees(employee_id)`, `reviewer_id` trỏ đến `employees(employee_id)`.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả Nghiệp Vụ | Ví Dụ |
| :--- | :--- | :--- | :--- | :--- |
| `kpi_id` | VARCHAR(12) | PRIMARY KEY, NOT NULL | Mã bản ghi đánh giá KPI (chuỗi KPI + 4 số) | `KPI0001`, `KPI0245` |
| `employee_id` | VARCHAR(10) | FOREIGN KEY, NOT NULL | Mã nhân viên được đánh giá | `EMP025` |
| `evaluation_period` | VARCHAR(10) | NOT NULL | Kỳ đánh giá hiệu suất | `2025-Q1`, `2025-Q2`, `2025-Q3` |
| `target_score` | DECIMAL(5, 1) | NOT NULL, DEFAULT 100.0 | Điểm mục tiêu tiêu chuẩn của kỳ đánh giá | `100.0` |
| `actual_score` | DECIMAL(5, 1) | NOT NULL, >= 0 | Điểm thực tế nhân viên đạt được | `94.5`, `108.2` |
| `completion_rate` | DECIMAL(5, 2) | NOT NULL | Tỷ lệ hoàn thành mục tiêu (%) | `94.50`, `108.20` |
| `rating` | VARCHAR(30) | NOT NULL | Xếp loại hiệu suất tương ứng với tỷ lệ hoàn thành | `Xuất sắc`, `Đạt`, `Cần cải thiện`, `Không đạt` |
| `reviewer_id` | VARCHAR(10) | FOREIGN KEY, NOT NULL | Mã người quản lý thực hiện đánh giá | `EMP001`, `EMP015` |

---

## 4. BẢNG `training_records` (Đào tạo & Phát triển Năng lực)
* **Mô tả**: Bảng ghi nhận các khóa đào tạo nội bộ, nâng cao chuyên môn, kỹ năng mềm và chứng chỉ mà nhân sự tham gia.
* **Số lượng bản ghi**: 450 dòng.
* **Khóa chính (PK)**: `record_id`.
* **Khóa ngoại (FK)**: `employee_id` trỏ đến `employees(employee_id)`.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả Nghiệp Vụ | Ví Dụ |
| :--- | :--- | :--- | :--- | :--- |
| `record_id` | VARCHAR(12) | PRIMARY KEY, NOT NULL | Mã khóa đào tạo nhân sự (chuỗi TRG + 4 số) | `TRG0001`, `TRG0120` |
| `employee_id` | VARCHAR(10) | FOREIGN KEY, NOT NULL | Mã nhân viên tham gia đào tạo | `EMP033` |
| `course_name` | VARCHAR(150) | NOT NULL | Tên khóa đào tạo kỹ năng hoặc chuyên môn | `Phân tích Dữ liệu với SQL & Power BI` |
| `training_type` | VARCHAR(50) | NOT NULL | Phân loại chương trình đào tạo | `Kỹ thuật`, `Kỹ năng mềm`, `Lãnh đạo`, `Tuân thủ` |
| `start_date` | DATE | NOT NULL, YYYY-MM-DD | Ngày bắt đầu khóa học | `2025-04-10` |
| `end_date` | DATE | NOT NULL, >= `start_date` | Ngày kết thúc khóa học | `2025-04-25` |
| `score` | DECIMAL(4, 1) | NULLABLE | Điểm thi kết thúc khóa (Thang điểm 100) | `85.5`, NULL (nếu đang học hoặc bỏ dở) |
| `completion_status` | VARCHAR(25) | NOT NULL | Trạng thái hoàn thành khóa học | `Completed`, `In Progress`, `Dropped` |
| `training_cost` | DECIMAL(12, 2) | NOT NULL, >= 0 | Chi phí đào tạo do tổ chức tài trợ (VND) | `3500000.00` |

---

## 5. BẢNG `turnovers` (Biến động Nhân sự & Thôi việc)
* **Mô tả**: Bảng lưu trữ chi tiết nguyên nhân, thời gian và kết quả phỏng vấn thôi việc (Exit Interview) của nhân viên đã rời công ty.
* **Số lượng bản ghi**: 35 dòng (Khớp 100% với các nhân sự có `status = 'Resigned'`).
* **Khóa chính (PK)**: `turnover_id`.
* **Khóa ngoại (FK)**: `employee_id` trỏ đến `employees(employee_id)` (Quan hệ 1 - 1).

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả Nghiệp Vụ | Ví Dụ |
| :--- | :--- | :--- | :--- | :--- |
| `turnover_id` | VARCHAR(12) | PRIMARY KEY, NOT NULL | Mã hồ sơ thôi việc (chuỗi TRN + 3 số) | `TRN001`, `TRN025` |
| `employee_id` | VARCHAR(10) | FOREIGN KEY, UNIQUE, NOT NULL | Mã nhân viên thôi việc | `EMP018` |
| `resignation_date` | DATE | NOT NULL, YYYY-MM-DD | Ngày nộp đơn xin thôi việc chính thức | `2025-06-12` |
| `last_working_date` | DATE | NOT NULL, >= `resignation_date` | Ngày làm việc cuối cùng tại công ty | `2025-07-15` |
| `reason` | VARCHAR(150) | NOT NULL | Lý do nhân viên đưa ra khi xin thôi việc | `Cơ hội phát triển nghề nghiệp tốt hơn` |
| `exit_interview_score` | DECIMAL(3, 1) | NOT NULL, 1.0 đến 5.0 | Điểm đánh giá mức độ hài lòng về môi trường (Thang 1-5) | `3.5`, `2.0` |
| `handover_status` | VARCHAR(25) | NOT NULL | Trạng thái bàn giao trang thiết bị và công việc | `Completed`, `Pending` |
