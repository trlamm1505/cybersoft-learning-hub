# DANH MỤC TỰ KIỂM TRA TRƯỚC KHI NỘP BÀI (SUBMISSION CHECKLIST)

Trước khi nộp bài lên hệ thống, học viên vui lòng kiểm tra từng mục dưới đây. Chỉ nộp bài khi đã tích chọn đầy đủ tất cả các tiêu chí!

---

### PHẦN 1: KIỂM TOÁN VÀ LÀM SẠCH DỮ LIỆU (DATA CLEANING)
- [ ] **CHKL-01**: Bảng `orders` sau làm sạch có đúng **400 dòng duy nhất**, không còn bất kỳ dòng nào trùng lặp mã `order_id`.
- [ ] **CHKL-02**: Đã xử lý 5 đơn hàng có trạng thái trống bằng cách điền chuẩn hóa về `completed`, không xóa bỏ các dòng này làm hao hụt doanh thu.
- [ ] **CHKL-03**: Định dạng các trường ngày tháng đã đồng nhất theo chuẩn `YYYY-MM-DD`, các trường tiền tệ có kiểu số thực.

### PHẦN 2: ĐỐI SOÁT CHỈ SỐ TÀI CHÍNH CỐT LÕI (FINANCIAL KPIS)
- [ ] **CHKL-04**: Doanh thu thực nhận Net Revenue được tính toán khớp với kết quả kiểm toán nội bộ: **$388,850.28** (chỉ tính trên 338 đơn hàng `completed`).
- [ ] **CHKL-05**: Giá trị trung bình đơn hàng AOV đạt **$1,150.44** (không nhầm lẫn giữa tính trung bình dòng mặt hàng và trung bình đơn hàng).
- [ ] **CHKL-06**: Biên lợi nhuận gộp toàn chuỗi đạt xấp xỉ **31.43%**, được tính bằng cách lấy tổng lợi nhuận gộp chia cho tổng doanh thu các mặt hàng completed.

### PHẦN 3: PHÂN TÍCH CHUYÊN SÂU & MÔ HÌNH HỌC VIÊN (ADVANCED ANALYTICS)
- [ ] **CHKL-07**: Mô hình phân khúc RFM đã phân loại đủ 5 nhóm khách hàng (Champions, Loyal, Potential, At Risk, Lost) và thuật toán không bị lỗi crash khi chia phân vị.
- [ ] **CHKL-08**: Đã tính toán đúng tỷ lệ hủy đơn hàng (**10.75%**) và tỷ lệ hoàn trả (**4.75%**) trên tổng số 400 đơn sạch, chỉ rõ COD là kênh thanh toán rủi ro cao nhất.
- [ ] **CHKL-09**: Đã xây dựng ma trận Cohort Retention và chỉ ra tỷ lệ suy giảm của khách hàng cũ qua các chu kỳ tháng.

### PHẦN 4: HỒ SƠ ĐÓNG GÓI & BÁO CÁO ĐIỀU HÀNH (DELIVERABLES)
- [ ] **CHKL-10**: File báo cáo `EXECUTIVE_REPORT.md` (hoặc PDF) trả lời trọn vẹn 10 câu hỏi stakeholder từ Ban Giám đốc và đề xuất 3 giải pháp định lượng khả thi.
- [ ] **CHKL-11**: File `cybermart_analysis_solution.sql` có cấu trúc rõ ràng, chú thích đầy đủ và chạy thành công mà không báo lỗi cú pháp.
- [ ] **CHKL-12**: File `cybermart_executive_model.xlsx` có Dashboard trực quan, bộ lọc slicer hoạt động và các ô số liệu được định dạng tiền tệ chuyên nghiệp.
