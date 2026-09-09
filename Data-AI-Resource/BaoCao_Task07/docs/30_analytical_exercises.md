# BỘ 30 BÀI TẬP PHÂN TÍCH KINH DOANH NHÂN SỰ & VẬN HÀNH (`HR_ops_v1`)

> **Dự án**: CyberSoft Data & AI Lab  
> **Bộ dữ liệu**: `HR_ops_v1` (5 bảng quan hệ, > 6.400 bản ghi)  
> **Cấp độ**: 3 cấp độ (Cơ bản - Trung cấp - Nâng cao & BI)  
> **Hệ quản trị tương thích**: ANSI SQL, PostgreSQL, SQLite, DuckDB, MySQL  

---

## MỤC LỤC BỘ BÀI TẬP

* **CẤP ĐỘ 1: CĂN BẢN (Bài 1 – Bài 10)**: Lọc dữ liệu, tính tổng, trung bình, nối bảng cơ bản (`SELECT`, `WHERE`, `INNER/LEFT JOIN`, `GROUP BY`, `ORDER BY`).
* **CẤP ĐỘ 2: TRUNG CẤP (Bài 11 – Bài 20)**: Phân tích nhóm, xử lý ngày tháng, Subquery, CTE, Window Functions (`RANK`, `DENSE_RANK`, `AVG() OVER (...)`, `LAG`).
* **CẤP ĐỘ 3: NÂNG CAO & BI (Bài 21 – Bài 30)**: Phân tích Cohort, Retention/Attrition modeling, tương quan Đào tạo & Hiệu suất, xây dựng DAX Measures cho Power BI.

---

# CẤP ĐỘ 1: CĂN BẢN (BÀI 1 – 10)

### Bài 1: Danh sách nhân viên đang làm việc theo phòng ban
* **Nghiệp vụ**: Phòng Nhân sự cần danh sách các nhân viên đang làm việc (`status = 'Active'`) tại phòng ban "Kỹ thuật & Công nghệ", sắp xếp theo mức lương giảm dần.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT employee_id, full_name, position, base_salary, work_location
FROM employees
WHERE department = 'Kỹ thuật & Công nghệ' AND status = 'Active'
ORDER BY base_salary DESC;
```

### Bài 2: Thống kê quy mô nhân sự và quỹ lương bình quân theo phòng ban
* **Nghiệp vụ**: Giám đốc Tài chính yêu cầu thống kê tổng số nhân viên và mức lương cơ bản trung bình của từng phòng ban (chỉ tính nhân sự đang hoạt động).
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    department,
    COUNT(employee_id) AS total_active_employees,
    ROUND(AVG(base_salary), 0) AS avg_base_salary,
    MIN(base_salary) AS min_salary,
    MAX(base_salary) AS max_salary
FROM employees
WHERE status = 'Active'
GROUP BY department
ORDER BY total_active_employees DESC;
```

### Bài 3: Danh sách nhân viên đi làm trễ nhiều nhất trong tháng
* **Nghiệp vụ**: Tìm top 10 nhân viên có số lần đi trễ (`status = 'Late'`) nhiều nhất trong kỳ chấm công.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.employee_id,
    e.full_name,
    e.department,
    COUNT(a.attendance_id) AS total_late_times
FROM employees e
JOIN attendance a ON e.employee_id = a.employee_id
WHERE a.status = 'Late'
GROUP BY e.employee_id, e.full_name, e.department
ORDER BY total_late_times DESC
LIMIT 10;
```

### Bài 4: Tổng số giờ làm thêm (OT) theo từng phòng ban
* **Nghiệp vụ**: Tổng hợp tổng số giờ làm thêm và số lượt phát sinh làm thêm giờ theo từng phòng ban trong tháng 10/2025.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.department,
    COUNT(a.attendance_id) AS ot_shifts_count,
    ROUND(SUM(a.overtime_hours), 1) AS total_ot_hours,
    ROUND(AVG(a.overtime_hours), 2) AS avg_ot_per_shift
FROM employees e
JOIN attendance a ON e.employee_id = a.employee_id
WHERE a.overtime_hours > 0
GROUP BY e.department
ORDER BY total_ot_hours DESC;
```

### Bài 5: Danh sách nhân sự đạt xếp loại "Xuất sắc" trong Quý 3/2025
* **Nghiệp vụ**: Trích xuất danh sách nhân viên đạt xếp loại KPI "Xuất sắc" trong kỳ đánh giá 2025-Q3 kèm điểm thực tế.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.employee_id,
    e.full_name,
    e.department,
    e.position,
    k.actual_score,
    k.completion_rate
FROM employees e
JOIN kpi_evaluations k ON e.employee_id = k.employee_id
WHERE k.evaluation_period = '2025-Q3' AND k.rating = 'Xuất sắc'
ORDER BY k.actual_score DESC;
```

### Bài 6: Tỷ lệ hoàn thành các khóa đào tạo nội bộ
* **Nghiệp vụ**: Đếm số lượng học viên hoàn thành, đang học và bỏ dở cho từng khóa đào tạo.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    course_name,
    training_type,
    COUNT(record_id) AS total_enrolled,
    SUM(CASE WHEN completion_status = 'Completed' THEN 1 ELSE 0 END) AS completed_count,
    SUM(CASE WHEN completion_status = 'Dropped' THEN 1 ELSE 0 END) AS dropped_count,
    ROUND(SUM(CASE WHEN completion_status = 'Completed' THEN 1.0 ELSE 0.0 END) / COUNT(record_id) * 100, 2) AS completion_rate_pct
FROM training_records
GROUP BY course_name, training_type
ORDER BY total_enrolled DESC;
```

### Bài 7: Tổng chi phí tài trợ đào tạo theo phòng ban
* **Nghiệp vụ**: Tính tổng ngân sách đào tạo đã đầu tư cho từng phòng ban.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.department,
    COUNT(t.record_id) AS total_training_courses,
    SUM(t.training_cost) AS total_training_investment,
    ROUND(AVG(t.training_cost), 0) AS avg_cost_per_course
FROM employees e
JOIN training_records t ON e.employee_id = t.employee_id
GROUP BY e.department
ORDER BY total_training_investment DESC;
```

### Bài 8: Thống kê lý do thôi việc phổ biến nhất
* **Nghiệp vụ**: Tổng hợp số lượng nhân sự nghỉ việc theo từng nhóm nguyên nhân trong bảng `turnovers`.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    reason,
    COUNT(turnover_id) AS resignation_count,
    ROUND(AVG(exit_interview_score), 2) AS avg_exit_satisfaction_score
FROM turnovers
GROUP BY reason
ORDER BY resignation_count DESC;
```

### Bài 9: Kiểm tra tỷ lệ chuyên cần tổng thể của toàn công ty
* **Nghiệp vụ**: Tính tỷ lệ phần trăm các trạng thái chấm công (`Present`, `Late`, `Early Departure`, `On Leave`, `Absent`).
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    status,
    COUNT(attendance_id) AS record_count,
    ROUND(COUNT(attendance_id) * 100.0 / (SELECT COUNT(*) FROM attendance), 2) AS percentage
FROM attendance
GROUP BY status
ORDER BY record_count DESC;
```

### Bài 10: Tìm các nhân viên có thâm niên trên 3 năm
* **Nghiệp vụ**: Lọc ra các nhân viên gia nhập công ty trước ngày `2023-01-01` và hiện vẫn đang làm việc.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT employee_id, full_name, department, position, hire_date
FROM employees
WHERE status = 'Active' AND hire_date < '2023-01-01'
ORDER BY hire_date ASC;
```

---

# CẤP ĐỘ 2: TRUNG CẤP (BÀI 11 – 20)

### Bài 11: Xếp hạng mức lương trong từng phòng ban (Window Function DENSE_RANK)
* **Nghiệp vụ**: Sử dụng Window Function để xếp thứ hạng mức lương của từng nhân viên trong phòng ban của họ.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    employee_id,
    full_name,
    department,
    position,
    base_salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY base_salary DESC) AS salary_rank_in_dept
FROM employees
WHERE status = 'Active';
```

### Bài 12: So sánh lương nhân viên với mức lương trung bình phòng ban
* **Nghiệp vụ**: Tính khoảng chênh lệch giữa lương của mỗi nhân viên và lương trung bình của phòng ban họ trực thuộc.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    employee_id,
    full_name,
    department,
    base_salary,
    ROUND(AVG(base_salary) OVER (PARTITION BY department), 0) AS dept_avg_salary,
    ROUND(base_salary - AVG(base_salary) OVER (PARTITION BY department), 0) AS salary_diff_from_avg
FROM employees
WHERE status = 'Active'
ORDER BY department, salary_diff_from_avg DESC;
```

### Bài 13: Xu hướng biến động điểm KPI qua 3 Quý (Window Function LAG)
* **Nghiệp vụ**: Đo lường sự tiến bộ hoặc sụt giảm điểm KPI của từng nhân viên giữa Quý 2 và Quý 3 năm 2025.
* **Truy vấn mẫu (SQL)**:
```sql
WITH kpi_progression AS (
    SELECT 
        employee_id,
        evaluation_period,
        actual_score,
        LAG(actual_score) OVER (PARTITION BY employee_id ORDER BY evaluation_period) AS prev_quarter_score
    FROM kpi_evaluations
)
SELECT 
    e.employee_id,
    e.full_name,
    e.department,
    kp.evaluation_period,
    kp.actual_score,
    kp.prev_quarter_score,
    ROUND(kp.actual_score - kp.prev_quarter_score, 2) AS score_growth
FROM kpi_progression kp
JOIN employees e ON kp.employee_id = e.employee_id
WHERE kp.prev_quarter_score IS NOT NULL AND kp.evaluation_period = '2025-Q3'
ORDER BY score_growth ASC;
```

### Bài 14: Tỷ lệ nhân sự nghỉ việc theo từng phòng ban (Turnover Rate by Dept)
* **Nghiệp vụ**: Tính tỷ lệ nghỉ việc (%) của từng phòng ban dựa trên tổng nhân sự từng tuyển dụng.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    department,
    COUNT(employee_id) AS total_headcount_ever,
    SUM(CASE WHEN status = 'Resigned' THEN 1 ELSE 0 END) AS resigned_count,
    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS active_count,
    ROUND(SUM(CASE WHEN status = 'Resigned' THEN 1.0 ELSE 0.0 END) / COUNT(employee_id) * 100, 2) AS turnover_rate_pct
FROM employees
GROUP BY department
ORDER BY turnover_rate_pct DESC;
```

### Bài 15: Phân tích thời gian cống hiến trung bình của nhóm nhân viên thôi việc
* **Nghiệp vụ**: Tính số ngày làm việc trung bình từ lúc gia nhập đến lúc nghỉ việc của 35 nhân sự thôi việc, chia theo lý do nghỉ việc.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    t.reason,
    COUNT(t.turnover_id) AS turnover_count,
    ROUND(AVG(JULIANDAY(t.last_working_date) - JULIANDAY(e.hire_date)), 0) AS avg_tenure_days,
    ROUND(AVG(t.exit_interview_score), 2) AS avg_exit_score
FROM turnovers t
JOIN employees e ON t.employee_id = e.employee_id
GROUP BY t.reason
ORDER BY avg_tenure_days ASC;
```

### Bài 16: Tìm các nhân viên có trên 3 lần làm thêm giờ (OT) nhưng KPI dưới mức Đạt
* **Nghiệp vụ**: Phát hiện dấu hiệu kiệt sức (Burnout Risk) — nhân sự cày cuốc làm thêm giờ nhưng kết quả đánh giá KPI Q3 lại không đạt hiệu quả cao.
* **Truy vấn mẫu (SQL)**:
```sql
WITH high_ot_staff AS (
    SELECT employee_id, COUNT(*) AS ot_shifts, SUM(overtime_hours) AS total_ot_hours
    FROM attendance
    WHERE overtime_hours > 0
    GROUP BY employee_id
    HAVING COUNT(*) >= 3
),
low_kpi_staff AS (
    SELECT employee_id, actual_score, rating
    FROM kpi_evaluations
    WHERE evaluation_period = '2025-Q3' AND rating IN ('Cần cải thiện', 'Không đạt')
)
SELECT 
    e.employee_id,
    e.full_name,
    e.department,
    h.ot_shifts,
    h.total_ot_hours,
    k.actual_score AS q3_kpi_score,
    k.rating AS q3_rating
FROM high_ot_staff h
JOIN low_kpi_staff k ON h.employee_id = k.employee_id
JOIN employees e ON h.employee_id = e.employee_id
ORDER BY h.total_ot_hours DESC;
```

### Bài 17: Phân cấp quản lý trực tiếp (Self-Join Hierarchy)
* **Nghiệp vụ**: Liệt kê tên của từng nhân viên cùng với tên và chức vụ của người quản lý trực tiếp của họ.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.employee_id,
    e.full_name AS employee_name,
    e.department,
    e.position,
    COALESCE(m.full_name, 'Ban Giám Đốc') AS direct_manager_name,
    COALESCE(m.position, 'C-Level') AS manager_position
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.employee_id
WHERE e.status = 'Active'
ORDER BY e.department, direct_manager_name;
```

### Bài 18: Thống kê tỷ lệ hoàn thành khóa học theo phân loại (Technical vs Soft skills)
* **Nghiệp vụ**: Phân tích xem loại hình đào tạo nào có tỷ lệ hoàn thành và điểm số kết thúc khóa cao nhất.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    training_type,
    COUNT(record_id) AS total_enrollments,
    ROUND(SUM(CASE WHEN completion_status = 'Completed' THEN 1.0 ELSE 0.0 END) / COUNT(record_id) * 100, 2) AS completion_rate,
    ROUND(AVG(CASE WHEN completion_status = 'Completed' THEN score ELSE NULL END), 2) AS avg_exam_score,
    SUM(training_cost) AS total_cost
FROM training_records
GROUP BY training_type
ORDER BY completion_rate DESC;
```

### Bài 19: Tìm 5 nhân viên có tỷ lệ đi làm đúng giờ (Punctuality) cao nhất
* **Nghiệp vụ**: Lọc ra các nhân sự gương mẫu có tỷ lệ đi làm đúng giờ đạt 100% trong suốt kỳ công tác.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.employee_id,
    e.full_name,
    e.department,
    COUNT(a.attendance_id) AS total_working_days,
    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS on_time_days,
    ROUND(SUM(CASE WHEN a.status = 'Present' THEN 1.0 ELSE 0.0 END) / COUNT(a.attendance_id) * 100, 2) AS punctuality_rate
FROM employees e
JOIN attendance a ON e.employee_id = a.employee_id
GROUP BY e.employee_id, e.full_name, e.department
HAVING COUNT(a.attendance_id) >= 20
ORDER BY punctuality_rate DESC, on_time_days DESC
LIMIT 5;
```

### Bài 20: Tỷ lệ phân bổ giới tính và mức lương bình quân theo giới tính
* **Nghiệp vụ**: Khảo sát tính đa dạng giới và cân bằng tiền lương (Gender Pay Gap Analysis).
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    gender,
    COUNT(employee_id) AS employee_count,
    ROUND(COUNT(employee_id) * 100.0 / (SELECT COUNT(*) FROM employees WHERE status = 'Active'), 2) AS gender_ratio_pct,
    ROUND(AVG(base_salary), 0) AS avg_base_salary
FROM employees
WHERE status = 'Active'
GROUP BY gender;
```

---

# CẤP ĐỘ 3: NÂNG CAO & BI (BÀI 21 – 30)

### Bài 21: Phân tích Cohort tuyển dụng theo năm (Hiring Cohort Retention)
* **Nghiệp vụ**: Tính tỷ lệ giữ chân (Retention Rate) của từng nhóm nhân viên gia nhập theo năm tuyển dụng (2021, 2022, 2023, 2024, 2025).
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    SUBSTR(hire_date, 1, 4) AS hire_year,
    COUNT(employee_id) AS total_hired,
    SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS currently_active,
    SUM(CASE WHEN status = 'Resigned' THEN 1 ELSE 0 END) AS resigned_count,
    ROUND(SUM(CASE WHEN status = 'Active' THEN 1.0 ELSE 0.0 END) / COUNT(employee_id) * 100, 2) AS retention_rate_pct
FROM employees
GROUP BY SUBSTR(hire_date, 1, 4)
ORDER BY hire_year ASC;
```

### Bài 22: Tương quan giữa Điểm KPI và Tỷ lệ Thôi việc (Attrition Correlation)
* **Nghiệp vụ**: So sánh điểm KPI trung bình trong Quý 2 và Quý 3 giữa nhóm nhân viên tiếp tục làm việc và nhóm nhân viên đã thôi việc.
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.status,
    k.evaluation_period,
    COUNT(DISTINCT e.employee_id) AS employee_count,
    ROUND(AVG(k.actual_score), 2) AS avg_kpi_score,
    ROUND(AVG(k.completion_rate), 2) AS avg_completion_rate
FROM employees e
JOIN kpi_evaluations k ON e.employee_id = k.employee_id
WHERE k.evaluation_period IN ('2025-Q2', '2025-Q3')
GROUP BY e.status, k.evaluation_period
ORDER BY k.evaluation_period, e.status;
```

### Bài 23: Tác động của Đào tạo đối với Cải thiện Hiệu suất KPI (Training ROI)
* **Nghiệp vụ**: Phân tích xem nhân viên hoàn thành khóa đào tạo kỹ thuật có mức tăng trưởng điểm KPI từ Q1 lên Q3 cao hơn nhóm không tham gia hay không.
* **Truy vấn mẫu (SQL)**:
```sql
WITH training_completed AS (
    SELECT DISTINCT employee_id
    FROM training_records
    WHERE completion_status = 'Completed' AND training_type = 'Kỹ thuật'
),
kpi_q1_q3 AS (
    SELECT 
        employee_id,
        MAX(CASE WHEN evaluation_period = '2025-Q1' THEN actual_score END) AS q1_score,
        MAX(CASE WHEN evaluation_period = '2025-Q3' THEN actual_score END) AS q3_score
    FROM kpi_evaluations
    GROUP BY employee_id
    HAVING MAX(CASE WHEN evaluation_period = '2025-Q1' THEN actual_score END) IS NOT NULL
       AND MAX(CASE WHEN evaluation_period = '2025-Q3' THEN actual_score END) IS NOT NULL
)
SELECT 
    CASE WHEN tc.employee_id IS NOT NULL THEN 'Đã hoàn thành Đào tạo Kỹ thuật' ELSE 'Không tham gia Đào tạo Kỹ thuật' END AS training_group,
    COUNT(kq.employee_id) AS total_employees,
    ROUND(AVG(kq.q1_score), 2) AS avg_q1_kpi,
    ROUND(AVG(kq.q3_score), 2) AS avg_q3_kpi,
    ROUND(AVG(kq.q3_score - kq.q1_score), 2) AS avg_score_growth
FROM kpi_q1_q3 kq
LEFT JOIN training_completed tc ON kq.employee_id = tc.employee_id
GROUP BY CASE WHEN tc.employee_id IS NOT NULL THEN 'Đã hoàn thành Đào tạo Kỹ thuật' ELSE 'Không tham gia Đào tạo Kỹ thuật' END;
```

### Bài 24: Mô hình Điểm rủi ro nghỉ việc (Flight Risk Scorecard)
* **Nghiệp vụ**: Xây dựng mô hình tính điểm rủi ro nghỉ việc (0 - 100) cho các nhân viên Active dựa trên 3 tín hiệu: (1) Điểm KPI Q3 thấp (<75), (2) Đi trễ nhiều (>2 lần), (3) Thâm niên dưới 1 năm.
* **Truy vấn mẫu (SQL)**:
```sql
WITH kpi_signal AS (
    SELECT employee_id, actual_score, CASE WHEN actual_score < 75 THEN 40 ELSE 0 END AS kpi_risk_points
    FROM kpi_evaluations
    WHERE evaluation_period = '2025-Q3'
),
attendance_signal AS (
    SELECT employee_id, COUNT(*) AS late_count, CASE WHEN COUNT(*) >= 2 THEN 30 ELSE 0 END AS attendance_risk_points
    FROM attendance
    WHERE status = 'Late'
    GROUP BY employee_id
),
tenure_signal AS (
    SELECT employee_id, CASE WHEN hire_date >= '2024-10-01' THEN 30 ELSE 0 END AS tenure_risk_points
    FROM employees
    WHERE status = 'Active'
)
SELECT 
    e.employee_id,
    e.full_name,
    e.department,
    e.position,
    COALESCE(k.kpi_risk_points, 0) + COALESCE(a.attendance_risk_points, 0) + t.tenure_risk_points AS total_flight_risk_score,
    CASE 
        WHEN (COALESCE(k.kpi_risk_points, 0) + COALESCE(a.attendance_risk_points, 0) + t.tenure_risk_points) >= 60 THEN 'Rất Cao (Critical)'
        WHEN (COALESCE(k.kpi_risk_points, 0) + COALESCE(a.attendance_risk_points, 0) + t.tenure_risk_points) >= 30 THEN 'Trung Bình (Moderate)'
        ELSE 'Thấp (Low)'
    END AS risk_tier
FROM employees e
JOIN tenure_signal t ON e.employee_id = t.employee_id
LEFT JOIN kpi_signal k ON e.employee_id = k.employee_id
LEFT JOIN attendance_signal a ON e.employee_id = a.employee_id
WHERE e.status = 'Active'
ORDER BY total_flight_risk_score DESC, e.employee_id ASC;
```

### Bài 25: Tối ưu hóa Ngân sách Đào tạo (Training Cost Effectiveness)
* **Nghiệp vụ**: Tính toán chi phí đầu tư trên mỗi điểm số kiểm tra đạt được cho từng khóa học (Cost per Grade Point).
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    course_name,
    training_type,
    COUNT(record_id) AS enrolled_students,
    SUM(training_cost) AS total_investment,
    ROUND(AVG(score), 2) AS avg_score,
    ROUND(SUM(training_cost) / NULLIF(SUM(score), 0), 0) AS cost_per_score_point
FROM training_records
WHERE completion_status = 'Completed'
GROUP BY course_name, training_type
ORDER BY cost_per_score_point ASC;
```

### Bài 26: Xây dựng Thước đo DAX cho Power BI: Tỷ lệ Chuyên cần Thực tế
* **Nghiệp vụ**: Hướng dẫn học viên viết công thức DAX Measure tính tỷ lệ chuyên cần tích lũy có tính đến bộ lọc ngày động (Dynamic Date Filter).
* **Công thức DAX mẫu**:
```dax
Attendance Rate % = 
VAR TotalDays = COUNTROWS(attendance)
VAR PresentDays = 
    CALCULATE(
        COUNTROWS(attendance),
        attendance[status] IN {"Present", "Late", "Early Departure"}
    )
RETURN
    DIVIDE(PresentDays, TotalDays, 0) * 100
```

### Bài 27: Xây dựng Thước đo DAX cho Power BI: Headcount Động theo thời gian
* **Nghiệp vụ**: Viết công thức DAX tính số lượng nhân sự đang hoạt động tại bất kỳ thời điểm nào được chọn trên Date Slicer.
* **Công thức DAX mẫu**:
```dax
Active Headcount = 
VAR SelectedDate = MAX('Calendar'[Date])
RETURN
    CALCULATE(
        COUNTROWS(employees),
        employees[hire_date] <= SelectedDate,
        ISBLANK(RELATED(turnovers[last_working_date])) || RELATED(turnovers[last_working_date]) > SelectedDate
    )
```

### Bài 28: Phân bổ Nhân lực theo Địa điểm và Hiệu quả Quỹ lương
* **Nghiệp vụ**: Phân tích cơ cấu nhân sự theo địa điểm văn phòng (HCM, Hà Nội, Đà Nẵng), so sánh tỷ lệ chi phí lương với năng suất trung bình (KPI Score).
* **Truy vấn mẫu (SQL)**:
```sql
SELECT 
    e.work_location,
    COUNT(DISTINCT e.employee_id) AS active_headcount,
    ROUND(SUM(e.base_salary), 0) AS total_monthly_payroll,
    ROUND(AVG(e.base_salary), 0) AS avg_salary,
    ROUND(AVG(k.actual_score), 2) AS avg_kpi_score
FROM employees e
LEFT JOIN kpi_evaluations k ON e.employee_id = k.employee_id AND k.evaluation_period = '2025-Q3'
WHERE e.status = 'Active'
GROUP BY e.work_location
ORDER BY active_headcount DESC;
```

### Bài 29: Phân tích Tương quan OT và Mức độ Hài lòng khi Thôi việc
* **Nghiệp vụ**: Đối với 35 nhân sự đã thôi việc, kiểm tra xem những người có số giờ OT cao có điểm đánh giá phỏng vấn thôi việc (`exit_interview_score`) thấp hơn hay không.
* **Truy vấn mẫu (SQL)**:
```sql
WITH employee_ot AS (
    SELECT employee_id, COALESCE(SUM(overtime_hours), 0) AS total_ot_hours
    FROM attendance
    GROUP BY employee_id
)
SELECT 
    CASE 
        WHEN COALESCE(o.total_ot_hours, 0) >= 10 THEN 'OT Nhiều (>= 10h)'
        WHEN COALESCE(o.total_ot_hours, 0) > 0 THEN 'OT Vừa (1-9h)'
        ELSE 'Không OT (0h)'
    END AS ot_intensity_tier,
    COUNT(t.turnover_id) AS resigned_count,
    ROUND(AVG(t.exit_interview_score), 2) AS avg_exit_interview_score
FROM turnovers t
LEFT JOIN employee_ot o ON t.employee_id = o.employee_id
GROUP BY CASE 
        WHEN COALESCE(o.total_ot_hours, 0) >= 10 THEN 'OT Nhiều (>= 10h)'
        WHEN COALESCE(o.total_ot_hours, 0) > 0 THEN 'OT Vừa (1-9h)'
        ELSE 'Không OT (0h)'
    END
ORDER BY avg_exit_interview_score ASC;
```

### Bài 30: Báo cáo Executive Dashboard Tổng thể Nhân sự & Vận hành (Executive KPI Summary)
* **Nghiệp vụ**: Tổng hợp một dòng báo cáo duy nhất cho Ban Điều Hành gồm 6 chỉ số cốt lõi: Tổng Headcount đang làm việc, Tỷ lệ Thôi việc, Tỷ lệ Chuyên cần, Điểm KPI Q3 trung bình, Tỷ lệ Hoàn thành Đào tạo, và Tổng Quỹ lương hàng tháng.
* **Truy vấn mẫu (SQL)**:
```sql
WITH active_metrics AS (
    SELECT 
        COUNT(employee_id) AS active_headcount,
        SUM(base_salary) AS monthly_payroll
    FROM employees
    WHERE status = 'Active'
),
turnover_metric AS (
    SELECT 
        ROUND(COUNT(turnover_id) * 100.0 / (SELECT COUNT(*) FROM employees), 2) AS overall_turnover_rate
    FROM turnovers
),
attendance_metric AS (
    SELECT 
        ROUND(SUM(CASE WHEN status IN ('Present', 'Late', 'Early Departure') THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS attendance_rate
    FROM attendance
),
kpi_metric AS (
    SELECT 
        ROUND(AVG(actual_score), 2) AS avg_q3_kpi
    FROM kpi_evaluations
    WHERE evaluation_period = '2025-Q3'
),
training_metric AS (
    SELECT 
        ROUND(SUM(CASE WHEN completion_status = 'Completed' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS training_completion_rate
    FROM training_records
)
SELECT 
    am.active_headcount,
    am.monthly_payroll,
    tm.overall_turnover_rate,
    att.attendance_rate,
    km.avg_q3_kpi,
    trm.training_completion_rate
FROM active_metrics am
CROSS JOIN turnover_metric tm
CROSS JOIN attendance_metric att
CROSS JOIN kpi_metric km
CROSS JOIN training_metric trm;
```
