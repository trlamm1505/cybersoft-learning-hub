# GIẢ ĐỊNH NGHIỆP VỤ & CÔNG THỨC KPI ĐỐI SOÁT (`HR_ops_v1`)

> **Dự án**: CyberSoft Data & AI Lab  
> **Tài liệu**: Business Assumptions, KPI Formulas & Cross-Validation Matrix  
> **Phiên bản**: 1.0.0  

---

## 1. CÁC GIẢ ĐỊNH NGHIỆP VỤ CHỦ ĐẠO (BUSINESS ASSUMPTIONS)

### 1.1. Khung thời gian & Lịch làm việc
* **Khung thời gian dữ liệu**: Năm hoạt động 2025.
* **Thời gian làm việc chuẩn**: 8 giờ/ngày, từ Thứ Hai đến Thứ Sáu (nghỉ Thứ Bảy và Chủ Nhật).
* **Khung giờ hành chính chuẩn**:
  * Check-in tiêu chuẩn: `08:30:00` (Cho phép ân hạn đến `08:35:00`).
  * Check-out tiêu chuẩn: `17:30:00` (Nghỉ trưa từ `12:00:00` đến `13:00:00`).
  * Đi trễ (`Late`): Bất kỳ lượt quẹt thẻ check-in nào sau `08:35:00`.
  * Về sớm (`Early Departure`): Bất kỳ lượt quẹt thẻ check-out nào trước `17:30:00` mà không có đơn phép.
  * Làm thêm giờ (`Overtime - OT`): Thời gian làm việc sau `18:00:00` và có đăng ký trước (tính theo block 0.5 giờ).

### 1.2. Cơ cấu Tổ chức và Thang bảng lương
* **Phòng ban (Departments)**:
  1. `Kỹ thuật & Công nghệ (Engineering)`: Phát triển nền tảng học tập, AI Tutor, LMS, Lab infrastructure.
  2. `Đào tạo & Học vụ (Academic)`: Giảng viên, Mentor, Trợ giảng, Chuyên viên thiết kế chương trình học.
  3. `Kinh doanh & Tuyển sinh (Sales & Marketing)`: Tư vấn khóa học, phát triển thị trường, Marketing số.
  4. `Nhân sự & Hành chính (Human Resources)`: Tuyển dụng, C&B, Đào tạo nội bộ, Văn hóa doanh nghiệp.
  5. `Vận hành & Hỗ trợ (Operations)`: Quản trị cơ sở vật chất, IT Helpdesk, Chăm sóc học viên (Customer Success).
* **Cấp bậc & Khung lương (Base Salary Range)**:
  * `Intern`: 5.000.000 – 7.000.000 VND
  * `Junior`: 8.000.000 – 14.000.000 VND
  * `Mid-level`: 15.000.000 – 24.000.000 VND
  * `Senior`: 25.000.000 – 35.000.000 VND
  * `Lead / Principal`: 36.000.000 – 45.000.000 VND
  * `Manager / Director`: 46.000.000 – 60.000.000 VND

### 1.3. Quy định Thôi việc & Thử việc
* **Thời gian thử việc**: 2 tháng kể từ `hire_date`. Tỷ lệ nghỉ việc trong 6 tháng đầu thường cao gấp 2.5 lần so với nhân sự thâm niên trên 2 năm.
* **Quy trình thôi việc chuẩn**:
  * Nhân viên nộp đơn báo trước (`resignation_date`) ít nhất 30 ngày (đối với hợp đồng xác định thời hạn) hoặc 45 ngày (đối với hợp đồng không xác định thời hạn) trước ngày làm việc cuối cùng (`last_working_date`).
  * Thực hiện khảo sát phỏng vấn thôi việc (Exit Interview) thang điểm 1 đến 5 (1: Rất không hài lòng, 5: Rất hài lòng).
  * Bàn giao công việc (`handover_status`): 'Completed' hoặc 'Pending'.

---

## 2. CÔNG THỨC TÍNH TOÁN CÁC CHỈ SỐ KPI CHỦ CHỐT (KEY KPI FORMULAS)

### 2.1. Nhóm Chỉ số Biến động Nhân sự (Turnover & Retention Metrics)
1. **Tỷ lệ Thôi việc Thô (Crude Turnover Rate - %)**:
   $$\text{Turnover Rate} = \frac{\text{Số nhân sự thôi việc trong kỳ}}{\text{Quy mô nhân sự bình quân trong kỳ}} \times 100\%$$
   * Trong đó: $\text{Quy mô nhân sự bình quân} = \frac{\text{Headcount đầu kỳ} + \text{Headcount cuối kỳ}}{2}$

2. **Tỷ lệ Giữ chân Nhân tài (Retention Rate - %)**:
   $$\text{Retention Rate} = 100\% - \text{Turnover Rate}$$

3. **Thời gian Cống hiến Bình quân (Average Tenure - Tháng/Năm)**:
   $$\text{Tenure (Days)} = \text{last\_working\_date} - \text{hire\_date}$$

### 2.2. Nhóm Chỉ số Chuyên cần & Vận hành (Attendance & Operational Metrics)
1. **Tỷ lệ Chuyên cần (Attendance Rate - %)**:
   $$\text{Attendance Rate} = \frac{\text{Số ngày đi làm thực tế (Present + Late + Early Departure)}}{\text{Tổng số ngày công tiêu chuẩn theo lịch}} \times 100\%$$

2. **Tỷ lệ Đi trễ (Punctuality / Tardiness Rate - %)**:
   $$\text{Tardiness Rate} = \frac{\text{Số lượt đi trễ (status = 'Late')}}{\text{Tổng số lượt đi làm thực tế}} \times 100\%$$

3. **Cường độ Làm thêm giờ Bình quân (Average OT Hours per Active Employee)**:
   $$\text{Avg OT Hours} = \frac{\sum \text{overtime\_hours}}{\text{Tổng số nhân sự đang hoạt động}}$$

### 2.3. Nhóm Chỉ số Hiệu suất Đánh giá (KPI Performance Metrics)
1. **Tỷ lệ Hoàn thành KPI (% Completion Rate)**:
   $$\text{Completion Rate} = \text{round}\left(\frac{\text{actual\_score}}{\text{target\_score}} \times 100, 2\right)$$

2. **Thang xếp loại Hiệu suất (Rating Tier)**:
   * $\ge 105.00\%$: **Xuất sắc (Exceeds Expectations)**
   * $90.00\% - 104.99\%$: **Đạt (Meets Expectations)**
   * $70.00\% - 89.99\%$: **Cần cải thiện (Needs Improvement)**
   * $< 70.00\%$: **Không đạt (Unsatisfactory)**

3. **Chỉ số Tác động Hiệu suất đến Thôi việc (Performance-Attrition Correlation)**:
   * So sánh điểm KPI trung bình của nhóm nhân viên đã thôi việc (`status = 'Resigned'`) với nhóm nhân viên đang cống hiến (`status = 'Active'`).

### 2.4. Nhóm Chỉ số Đào tạo & Phát triển (Training & ROI Metrics)
1. **Tỷ lệ Hoàn thành Khóa học (Training Completion Rate - %)**:
   $$\text{Training Completion Rate} = \frac{\text{Số lượt hoàn thành (status = 'Completed')}}{\text{Tổng số lượt đăng ký}} \times 100\%$$

2. **Chi phí Đào tạo Bình quân trên Nhân sự (Training Cost per Head)**:
   $$\text{Avg Training Cost} = \frac{\sum \text{training\_cost}}{\text{Tổng số nhân viên tham gia đào tạo}}$$

---

## 3. MA TRẬN ĐỐI SOÁT CHÉO TOÀN VẸN DỮ LIỆU (CROSS-VALIDATION MATRIX)

Hệ thống kiểm định tự động bắt buộc thực hiện kiểm tra chéo (cross-validation) các mối quan hệ bất biến (Invariants) sau giữa 5 bảng:

| STT | Bảng Tham chiếu 1 | Bảng Tham chiếu 2 | Điều kiện Bất biến (Mathematical Invariant) | Ý nghĩa Nghiệp vụ |
| :---: | :--- | :--- | :--- | :--- |
| **CV-01** | `employees` | `turnovers` | `COUNT(employees.status = 'Resigned') == COUNT(turnovers)` | Mọi nhân viên nghỉ việc đều phải có đúng 1 hồ sơ thôi việc. |
| **CV-02** | `turnovers` | `employees` | `turnovers.employee_id ⊆ employees.employee_id` | Khóa ngoại thôi việc phải tồn tại trong danh mục nhân viên. |
| **CV-03** | `employees` | `turnovers` | `turnovers.last_working_date >= employees.hire_date` | Ngày nghỉ việc không thể diễn ra trước ngày vào làm. |
| **CV-04** | `turnovers` | `attendance` | `attendance.work_date <= turnovers.last_working_date` (đối với nhân sự thôi việc) | Không thể có chấm công phát sinh sau ngày làm việc cuối cùng. |
| **CV-05** | `attendance` | `employees` | `attendance.employee_id ⊆ employees.employee_id` | Không có chấm công của nhân viên mồ côi (Orphan FK). |
| **CV-06** | `kpi_evaluations` | `employees` | `kpi_evaluations.employee_id ⊆ employees.employee_id` | Mọi bản ghi đánh giá KPI phải thuộc về nhân viên hợp lệ. |
| **CV-07** | `training_records` | `employees` | `training_records.employee_id ⊆ employees.employee_id` | Nhân viên tham gia đào tạo phải có mã nhân viên hợp lệ. |
| **CV-08** | `attendance` | Chính nó | `check_out > check_in` khi trạng thái là `Present`/`Late` | Thời gian check-out phải sau check-in. |
| **CV-09** | `training_records` | Chính nó | `end_date >= start_date` | Ngày kết thúc khóa đào tạo phải sau hoặc bằng ngày bắt đầu. |
| **CV-10** | `kpi_evaluations` | Chính nó | `0 <= actual_score <= 150.0` và `rating` khớp công thức | Điểm KPI nằm trong khoảng hợp lệ và xếp loại chính xác. |
