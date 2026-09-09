# 10 BUSINESS INSIGHTS KỲ VỌNG TỪ BỘ DỮ LIỆU NHÂN SỰ & VẬN HÀNH (`HR_ops_v1`)

> **Dự án**: CyberSoft Data & AI Lab  
> **Bộ dữ liệu**: `HR_ops_v1`  
> **Định hướng**: Mở rộng tư duy phân tích, không khóa cứng cách giải của học viên  
> **Đối tượng áp dụng**: Học viên Data Analyst, BI Specialist & Giảng viên bộ môn  

---

## 💡 TỔNG QUAN VỀ PHƯƠNG PHÁP KHAI THÁC INSIGHT MỞ

Khác với các bài tập kiểm tra cú pháp kỹ thuật đơn thuần, 10 Insight dưới đây đóng vai trò là **Business Discovery Challenges** — mô phỏng các bài toán thực tế mà Giám đốc Nhân sự (CHRO), Giám đốc Vận hành (COO) và CEO thường xuyên đặt câu hỏi cho đội ngũ Data & BI. Học viên được tự do lựa chọn công cụ (SQL, Excel Pivot, Python, Power BI DAX), tự do thử nghiệm các góc nhìn phân tích và bảo vệ nhận định của mình dựa trên bằng chứng dữ liệu.

---

### INSIGHT 01: "Cơn sốt" Biến động Nhân sự trong 6 Tháng Đầu Tiên (Early Attrition Spike)
* **Câu hỏi Kinh doanh**: *Tỷ lệ thôi việc có tập trung vào giai đoạn nhân viên mới thử việc và hòa nhập không? Đâu là điểm nghẽn trong quy trình Onboarding?*
* **Chỉ số & Bảng dữ liệu**: `employees.hire_date`, `turnovers.resignation_date`, `turnovers.reason`.
* **Gợi ý Hướng tiếp cận**:
  - Tính thâm niên (Tenure) của nhóm nhân sự nghỉ việc: `DATEDIFF(resignation_date, hire_date)`.
  - Phân nhóm thâm niên thành các nhóm: `< 90 ngày (Thử việc)`, `90 - 180 ngày`, `180 - 365 ngày`, `> 1 năm`.
  - Biểu diễn bằng biểu đồ Histogram hoặc Stacked Bar Chart trên Excel / Power BI.
* **Phát hiện Kỳ vọng**:
  - Gần 45% tổng số ca nghỉ việc rơi vào giai đoạn dưới 6 tháng làm việc. Lý do phổ biến nhất ở nhóm này là "Chuyển hướng chuyên môn / khởi nghiệp" hoặc "Cơ hội phát triển tốt hơn".
* **Đề xuất Hành động**: Tăng cường chương trình Buddy/Mentorship trong 90 ngày đầu tiên; rà soát lại độ chính xác của bản mô tả công việc (JD) lúc phỏng vấn tuyển dụng.

---

### INSIGHT 02: Mối Tương quan giữa Cường độ Làm thêm giờ (OT) và Sự Sụt giảm Điểm Phỏng vấn Thôi việc
* **Câu hỏi Kinh doanh**: *Làm thêm giờ liên tục có phải là nguyên nhân chính dẫn đến kiệt sức (Burnout) và thái độ bất mãn khi rời đi của nhân viên?*
* **Chỉ số & Bảng dữ liệu**: `attendance.overtime_hours`, `turnovers.exit_interview_score`.
* **Gợi ý Hướng tiếp cận**:
  - Nối bảng `turnovers` với tổng số giờ làm thêm của từng nhân viên từ bảng `attendance`.
  - Phân loại mức độ làm thêm: `Không OT`, `OT vừa (1-8 giờ/tháng)`, `OT nặng (> 8 giờ/tháng)`.
  - Tính điểm Exit Interview trung bình cho từng nhóm.
* **Phát hiện Kỳ vọng**:
  - Nhóm nhân viên có tổng giờ OT vượt trên 10 giờ có điểm khảo sát thôi việc bình quân chỉ đạt 2.1 / 5.0 (so với 3.8 / 5.0 ở nhóm ít hoặc không OT).
* **Đề xuất Hành động**: Thiết lập cảnh báo tự động (Alert) khi nhân sự có số giờ OT vượt quá 12 giờ/tháng; cân đối lại khối lượng công việc (Workload Rebalancing) ở các dự án cao điểm.

---

### INSIGHT 03: Hiệu quả Đào tạo Kỹ thuật (Technical Training) trong việc Thúc đẩy Điểm KPI
* **Câu hỏi Kinh doanh**: *Ngân sách đầu tư vào các khóa đào tạo công nghệ (Data, AI, Cloud) có thực sự mang lại sự cải thiện hiệu suất công việc hay chỉ mang tính hình thức?*
* **Chỉ số & Bảng dữ liệu**: `training_records.training_type`, `training_records.completion_status`, `kpi_evaluations.actual_score`.
* **Gợi ý Hướng tiếp cận**:
  - Phân tách 2 nhóm đối tượng: Nhóm A (Hoàn thành ít nhất 1 khóa đào tạo Kỹ thuật) và Nhóm B (Không tham gia hoặc bỏ dở).
  - So sánh tốc độ tăng trưởng điểm KPI (`Growth Rate = Score_Q3 - Score_Q1`) giữa hai nhóm.
* **Phát hiện Kỳ vọng**:
  - Nhóm A có mức tăng trưởng điểm KPI trung bình cao hơn +12.4 điểm so với nhóm B. Đặc biệt, khóa "Ứng dụng AI & Prompt Engineering" mang lại mức cải thiện rõ rệt nhất cho khối Kỹ thuật và Học vụ.
* **Đề xuất Hành động**: Mở rộng quy mô đào tạo AI nội bộ; tích hợp việc hoàn thành khóa học vào tiêu chí xét thăng cấp và tăng lương định kỳ.

---

### INSIGHT 04: "Vết trượt" Hiệu suất Trước khi Nghỉ việc (Pre-Resignation Performance Degradation)
* **Câu hỏi Kinh doanh**: *Liệu một nhân sự sắp nghỉ việc có bộc lộ những tín hiệu sa sút về chuyên cần hoặc điểm đánh giá KPI trước khi nộp đơn không?*
* **Chỉ số & Bảng dữ liệu**: `kpi_evaluations.actual_score` qua các quý, `attendance.status` (tần suất đi trễ, nghỉ phép).
* **Gợi ý Hướng tiếp cận**:
  - So sánh chuỗi thời gian (Time-series) của điểm KPI từ Q1 đến Q3 giữa nhóm `Active` và `Resigned`.
  - Thống kê tần suất đi trễ (`Late`) và nghỉ phép (`On Leave`) trong 30 ngày trước khi nộp đơn.
* **Phát hiện Kỳ vọng**:
  - Điểm KPI của nhóm sắp nghỉ việc có xu hướng giảm liên tục từ Q1 sang Q3 (trung bình giảm từ 86 xuống 68 điểm), đi kèm số lượt đi trễ và vắng mặt tăng gấp đôi trong tháng cận kề thôi việc.
* **Đề xuất Hành động**: Xây dựng mô hình cảnh báo sớm nguy cơ nghỉ việc (Early Flight Risk Detector) trong hệ thống BI nội bộ để quản lý trực tiếp kịp thời lắng nghe tâm tư và giữ chân nhân sự cốt cán.

---

### INSIGHT 05: Chênh lệch Tiền lương Giữa Các Phòng ban và Áp lực Cạnh tranh Thị trường
* **Câu hỏi Kinh doanh**: *Mặt bằng lương giữa khối Kỹ thuật (Engineering) và các phòng ban Vận hành/Học vụ có tạo ra sự bất đối xứng lớn không? Phòng ban nào đang đối mặt với rủi ro mất người vì thu nhập?*
* **Chỉ số & Bảng dữ liệu**: `employees.base_salary`, `employees.department`, `turnovers.reason`.
* **Gợi ý Hướng tiếp cận**:
  - Tính trung vị (Median), trung bình (Mean) và độ lệch chuẩn của lương theo từng phòng ban.
  - Khảo sát tỷ lệ nhân sự rời đi với lý do "Thu nhập và chế độ đãi ngộ cạnh tranh" theo từng phòng ban.
* **Phát hiện Kỳ vọng**:
  - Phòng Kỹ thuật có mức lương bình quân cao nhất (~28 triệu), trong khi khối Vận hành và Học vụ dao động từ 12 - 16 triệu. Khối Kinh doanh & Tuyển sinh có tỷ lệ thôi việc do thu nhập cạnh tranh cao nhất (chiếm 38% lý do rời đi của phòng ban này).
* **Đề xuất Hành động**: Thiết kế lại cơ chế thưởng hoa hồng (Incentive Scheme) cho khối Sales & Tuyển sinh gắn liền với doanh số thực tế để thu nhập tổng thể cạnh tranh hơn.

---

### INSIGHT 06: "Pháo đài" Giữ chân Nhân tài — Phân tích Cohort Tuyển dụng theo Năm
* **Câu hỏi Kinh doanh**: *Chất lượng tuyển dụng của các năm có đồng đều không? Năm nào có tỷ lệ nhân sự gắn bó bền vững nhất?*
* **Chỉ số & Bảng dữ liệu**: `employees.hire_date`, `employees.status`.
* **Gợi ý Hướng tiếp cận**:
  - Xây dựng ma trận Cohort Retention: gom nhóm nhân viên theo năm gia nhập (2021 đến 2025).
  - Tính tỷ lệ phần trăm còn đang công tác (`status = 'Active'`) tại thời điểm hiện tại.
* **Phát hiện Kỳ vọng**:
  - Cohort năm 2022 và 2023 có tỷ lệ giữ chân rất cao (>88%), trong khi Cohort năm 2024 có tỷ lệ hao hụt cao hơn trong năm đầu tiên.
* **Đề xuất Hành động**: Phân tích chân dung ứng viên (Candidate Persona) của lứa tuyển dụng 2022 - 2023 để chuẩn hóa tiêu chuẩn tuyển sinh đầu vào cho các đợt tiếp theo.

---

### INSIGHT 07: Kỷ luật Chuyên cần theo Địa điểm Văn phòng (HCM vs. Hà Nội vs. Đà Nẵng)
* **Câu hỏi Kinh doanh**: *Văn hóa chuyên cần và tình trạng đi làm trễ có sự khác biệt giữa các trung tâm đào tạo ở 3 miền không?*
* **Chỉ số & Bảng dữ liệu**: `employees.work_location`, `attendance.status`, `attendance.check_in`.
* **Gợi ý Hướng tiếp cận**:
  - Tính tỷ lệ đi trễ (`status = 'Late'`) và giờ quẹt thẻ check-in trung bình theo từng địa bàn.
  - Phân tích tương quan giữa tỷ lệ đi trễ với điều kiện giao thông hoặc mô hình giờ làm linh hoạt.
* **Phát hiện Kỳ vọng**:
  - Văn phòng Hồ Chí Minh và Hà Nội có tỷ lệ đi trễ vào các ngày đầu tuần cao hơn 2.5% so với Đà Nẵng. Tuy nhiên, thời gian check-out của 2 thành phố lớn cũng trễ hơn đáng kể.
* **Đề xuất Hành động**: Xem xét áp dụng chính sách khung giờ làm việc linh hoạt (Flexible Working Hours: check-in từ 08:00 đến 09:00, đủ 8 tiếng/ngày) tại các thành phố lớn để giảm áp lực kẹt xe.

---

### INSIGHT 08: Lợi tức Đầu tư Đào tạo (Training Cost vs. Completion Yield)
* **Câu hỏi Kinh doanh**: *Khóa đào tạo nào mang lại hiệu quả chi phí cao nhất trên mỗi học viên hoàn thành xuất sắc? Khóa học nào đang bị lãng phí ngân sách do tỷ lệ bỏ dở cao?*
* **Chỉ số & Bảng dữ liệu**: `training_records.course_name`, `training_records.completion_status`, `training_records.training_cost`, `training_records.score`.
* **Gợi ý Hướng tiếp cận**:
  - Tính chi phí bình quân cho mỗi học viên tốt nghiệp: `Total Cost / Completed Students`.
  - Nhận diện các khóa học có tỷ lệ `Dropped` vượt quá 10%.
* **Phát hiện Kỳ vọng**:
  - Khóa "Quản trị Dự án Agile/Scrum" có chi phí cao nhất (5 triệu/người) nhưng tỷ lệ hoàn thành đạt tới 95% và điểm thi cao. Ngược lại, một số khóa kỹ năng chung có tỷ lệ bỏ dở cao hơn do thời lượng kéo dài.
* **Đề xuất Hành động**: Tối ưu hóa cấu trúc khóa học dài ngày thành các module Micro-learning ngắn gọn từ 3 - 5 ngày để giảm tỷ lệ bỏ học giữa chừng.

---

### INSIGHT 09: Hiệu ứng "Người Quản lý Trực tiếp" Đối với Sự Hài lòng và Giữ chân Nhân viên
* **Câu hỏi Kinh doanh**: *Liệu tỷ lệ thôi việc và điểm khảo sát phỏng vấn nghỉ việc có tập trung bất thường dưới quyền một số nhà quản lý cụ thể không? ("People leave managers, not companies")*
* **Chỉ số & Bảng dữ liệu**: `employees.manager_id`, `turnovers.exit_interview_score`, `turnovers.turnover_id`.
* **Gợi ý Hướng tiếp cận**:
  - Nhóm dữ liệu nhân sự thôi việc theo `manager_id`.
  - Tính số lượng nhân sự nghỉ việc và điểm đánh giá Exit Interview trung bình của từng nhóm quản lý.
* **Phát hiện Kỳ vọng**:
  - Phần lớn các nhà quản lý duy trì tỷ lệ thôi việc đội ngũ dưới 12%. Tuy nhiên, có sự chênh lệch đáng kể về điểm đánh giá lãnh đạo trong phỏng vấn thôi việc giữa các đội ngũ.
* **Đề xuất Hành động**: Triển khai chương trình huấn luyện kỹ năng lãnh đạo thấu cảm (Empathetic Leadership) và kỹ năng phản hồi 1-on-1 định kỳ cho cấp quản lý trung gian.

---

### INSIGHT 10: Cơ cấu Giới tính và Cơ hội Phát triển Thăng tiến (Gender Diversity in Leadership)
* **Câu hỏi Kinh doanh**: *Tổ chức đã đạt được sự cân bằng giới tính ở các vị trí chuyên môn kỹ thuật và cấp bậc quản lý cấp cao chưa?*
* **Chỉ số & Bảng dữ liệu**: `employees.gender`, `employees.department`, `employees.position`, `employees.base_salary`.
* **Gợi ý Hướng tiếp cận**:
  - Tính tỷ lệ Nam/Nữ trong từng phòng ban và phân cấp vị trí: `Intern/Junior`, `Mid/Senior`, `Lead/Manager/Director`.
  - So sánh mức lương trung bình theo giới tính tại cùng một chức danh công việc.
* **Phát hiện Kỳ vọng**:
  - Tỷ lệ nữ giới chiếm ưu thế tại các khối Nhân sự, Marketing và Vận hành (>60%), trong khi khối Kỹ thuật chiếm khoảng 35%. Tại cấp bậc Quản lý và Trưởng nhóm, tỷ lệ phân bổ giới tính đạt mức cân bằng tương đối ổn định (xấp xỉ 48% Nữ - 52% Nam).
* **Đề xuất Hành động**: Phát động các chương trình hỗ trợ phát triển sự nghiệp công nghệ cho nữ giới (Women in Tech & AI) và đảm bảo nguyên tắc công bằng tiền lương không phân biệt giới tính (Equal Pay for Equal Work).
