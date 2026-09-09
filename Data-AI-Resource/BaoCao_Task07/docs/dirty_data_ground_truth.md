# BẢNG ĐÁP ÁN ĐỐI CHỨNG CÁC LỖI CÀI CẮM (`HR_ops_v1_dirty`)

> **Dự án**: CyberSoft Data & AI Lab  
> **Tổng số điểm vi phạm**: 20 lỗi thuộc 10 nhóm lỗi nghiệp vụ  

| Mã Lỗi | Nhóm Lỗi | Tệp | Vị trí (Dòng, Cột) | Giá trị Sai | Giá trị Chuẩn | Mã SQL Khắc phục |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ANO-01-1` | **Foreign Key Orphan** | `attendance.csv` | Dòng 104, `employee_id` | `EMP999` | `EMP115` | `UPDATE attendance SET employee_id = 'EMP115' WHERE attendance_id = 'ATT00103';` |
| `ANO-01-2` | **Foreign Key Orphan** | `attendance.csv` | Dòng 542, `employee_id` | `EMP999` | `EMP107` | `UPDATE attendance SET employee_id = 'EMP107' WHERE attendance_id = 'ATT00541';` |
| `ANO-01-3` | **Foreign Key Orphan** | `attendance.csv` | Dòng 1207, `employee_id` | `EMP999` | `EMP103` | `UPDATE attendance SET employee_id = 'EMP103' WHERE attendance_id = 'ATT01206';` |
| `ANO-02-1` | **Inverted Datetime** | `attendance.csv` | Dòng 322, `check_out` | `08:30:00 (trước check-in 17:30:00)` | `17:30:00` | `UPDATE attendance SET check_in = '08:30:00', check_out = '17:30:00' WHERE attendance_id = 'ATT00321';` |
| `ANO-02-2` | **Inverted Datetime** | `attendance.csv` | Dòng 892, `check_out` | `08:30:00 (trước check-in 17:30:00)` | `17:30:00` | `UPDATE attendance SET check_in = '08:30:00', check_out = '17:30:00' WHERE attendance_id = 'ATT00891';` |
| `ANO-02-3` | **Inverted Datetime** | `attendance.csv` | Dòng 1642, `check_out` | `08:30:00 (trước check-in 17:30:00)` | `17:30:00` | `UPDATE attendance SET check_in = '08:30:00', check_out = '17:30:00' WHERE attendance_id = 'ATT01641';` |
| `ANO-03-1` | **Duplicate Attendance Record** | `attendance.csv` | Dòng 52, `attendance_id, employee_id, work_date` | `EMP004 - 2025-10-05` | `Duy nhất một bản ghi chấm công mỗi nhân viên mỗi ngày` | `DELETE FROM attendance WHERE attendance_id = 'ATT_DUP_1';` |
| `ANO-03-2` | **Duplicate Attendance Record** | `attendance.csv` | Dòng 252, `attendance_id, employee_id, work_date` | `EMP005 - 2025-10-08` | `Duy nhất một bản ghi chấm công mỗi nhân viên mỗi ngày` | `DELETE FROM attendance WHERE attendance_id = 'ATT_DUP_2';` |
| `ANO-04-1` | **Out-of-bounds KPI Score** | `kpi_evaluations.csv` | Dòng 27, `actual_score` | `999.0` | `95.0` | `UPDATE kpi_evaluations SET actual_score = 95.0, completion_rate = 95.0 WHERE kpi_id = 'KPI0026';` |
| `ANO-04-2` | **Out-of-bounds KPI Score** | `kpi_evaluations.csv` | Dòng 114, `actual_score` | `-25.0` | `75.0` | `UPDATE kpi_evaluations SET actual_score = 75.0, completion_rate = 75.0 WHERE kpi_id = 'KPI0113';` |
| `ANO-05-1` | **KPI Rating Mismatch** | `kpi_evaluations.csv` | Dòng 50, `rating` | `Xuất sắc (trong khi completion_rate = 58.5%)` | `Không đạt` | `UPDATE kpi_evaluations SET rating = 'Không đạt' WHERE kpi_id = 'KPI0049';` |
| `ANO-05-2` | **KPI Rating Mismatch** | `kpi_evaluations.csv` | Dòng 187, `rating` | `Xuất sắc (trong khi completion_rate = 58.5%)` | `Không đạt` | `UPDATE kpi_evaluations SET rating = 'Không đạt' WHERE kpi_id = 'KPI0186';` |
| `ANO-06-1` | **Ghost Attendance Post-Turnover** | `attendance.csv` | Dòng 5096, `work_date` | `2025-10-15` | `Không có bản ghi sau ngày 2025-03-11` | `DELETE FROM attendance WHERE attendance_id = 'ATT_GHOST_1';` |
| `ANO-07-1` | **Turnover Status Discrepancy** | `employees.csv` | Dòng 38, `status` | `Active` | `Resigned` | `UPDATE employees SET status = 'Resigned' WHERE employee_id = 'EMP037';` |
| `ANO-08-1` | **Invalid Base Salary** | `employees.csv` | Dòng 17, `base_salary` | `-15000000.0` | `18000000.0` | `UPDATE employees SET base_salary = 18000000.0 WHERE employee_id = 'EMP016';` |
| `ANO-08-2` | **Invalid Base Salary** | `employees.csv` | Dòng 80, `base_salary` | `0.0` | `18000000.0` | `UPDATE employees SET base_salary = 18000000.0 WHERE employee_id = 'EMP079';` |
| `ANO-09-1` | **Inverted Training Dates** | `training_records.csv` | Dòng 44, `end_date` | `2025-08-10 (trước start_date 2025-08-20)` | `2025-08-25` | `UPDATE training_records SET start_date = '2025-03-14', end_date = '2025-08-25' WHERE record_id = 'TRG0043';` |
| `ANO-09-2` | **Inverted Training Dates** | `training_records.csv` | Dòng 170, `end_date` | `2025-08-10 (trước start_date 2025-08-20)` | `2025-08-25` | `UPDATE training_records SET start_date = '2025-08-20', end_date = '2025-08-25' WHERE record_id = 'TRG0169';` |
| `ANO-10-1` | **Inconsistent Attendance Status** | `attendance.csv` | Dòng 217, `status, hours_worked` | `status='On Leave', hours_worked=8.0` | `status='Present' hoặc hours_worked=0.0` | `UPDATE attendance SET status = 'Present' WHERE attendance_id = 'ATT00215';` |
| `ANO-10-2` | **Inconsistent Attendance Status** | `attendance.csv` | Dòng 672, `status, hours_worked` | `status='On Leave', hours_worked=8.0` | `status='Present' hoặc hours_worked=0.0` | `UPDATE attendance SET status = 'Present' WHERE attendance_id = 'ATT00669';` |
