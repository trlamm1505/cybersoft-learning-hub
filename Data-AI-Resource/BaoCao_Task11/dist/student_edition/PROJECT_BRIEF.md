# 📊 Đề Bài Dự Án: CyberSoft Mart Sales Performance & Customer Retention Intelligence

## 🏢 1. Bối Cảnh Doanh Nghiệp (Business Context)
**CyberSoft Mart** là chuỗi bán lẻ đa kênh (Omnichannel Retail) cung cấp hơn 50 mặt hàng tiêu dùng thuộc 5 ngành hàng: *Electronics, Home & Kitchen, Fashion, Books, Sports*. Trong năm vừa qua, dù lưu lượng truy cập và số lượng đơn hàng tăng trưởng 25%, Ban Giám Đốc nhận thấy các tín hiệu cảnh báo tài chính:
- Tỷ lệ hủy đơn và hoàn hàng tăng bất thường.
- Chi phí thu hút khách hàng mới (CAC) cao nhưng tỷ lệ khách hàng quay lại mua lần 2 (Repeat Purchase Rate) rất thấp.
- Nhiều ngành hàng có doanh thu lớn nhưng biên lợi nhuận ròng thực tế lại âm do chiết khấu và chi phí vận chuyển.

## 🎯 2. Mục Tiêu Dự Án (Project Objectives)
Với vai trò **Junior Data Analyst**, bạn được giao nhiệm vụ thực hiện một cuộc kiểm toán dữ liệu và phân tích hiệu quả kinh doanh toàn diện:
1. **Kiểm tra & Làm sạch Dữ liệu:** Hợp nhất 4 bảng dữ liệu, xử lý các dị biệt dữ liệu (duplicate, missing values, anomaly records).
2. **Đo lường Chỉ số Kinh doanh (KPIs):** Xác định chính xác Doanh thu thực nhận (Net Revenue), Giá trị trung bình đơn (AOV), Tỷ lệ hủy đơn, và Biên lợi nhuận gộp theo từng ngành hàng.
3. **Phân khúc Khách hàng RFM:** Áp dụng mô hình Recency - Frequency - Monetary để chia tập khách hàng thành các nhóm hành vi cụ thể.
4. **Báo cáo Chiến lược (Executive Presentation):** Thiết kế trực quan hóa 4 biểu đồ then chốt và đề xuất tối thiểu 3 giải pháp kinh doanh định lượng cho Ban Giám Đốc.

## 📁 3. Tập Dữ Liệu Cung Cấp (Datasets)
Nằm trong thư mục `data/`:
- `orders.csv`: 402 giao dịch đơn hàng (có chứa dị biệt thực tế).
- `order_items.csv`: 997 dòng chi tiết mặt hàng trong từng đơn.
- `customers.csv`: 100 khách hàng tích cực và thông tin địa lý, hạng hội viên.
- `products.csv`: Danh mục 50 sản phẩm kèm giá vốn và giá niêm yết.

## 📝 4. Danh Sách Nhiệm Vụ (Tasks)

### A. Nhiệm Vụ Cơ Bản (Core Tasks - 70 Điểm)
- **TASK-01: Tiền xử lý & Làm sạch dữ liệu (20đ)**
  - Tìm và loại bỏ 100% các bản ghi trùng lặp khóa chính `order_id`.
  - Quy chuẩn hóa 100% các giá trị rỗng (`null`) tại trường `order_status` kèm log giải thích logic xử lý.
  - Kiểm tra tính toàn vẹn quan hệ PK-FK giữa 4 bảng.
  - Xuất ra file `orders_cleaned.csv` và báo cáo `data_cleaning_log.md`.
- **TASK-02: Phân tích KPI Kinh doanh Then chốt (25đ)**
  - Tính Doanh thu thực nhận (Net Revenue) từ các đơn hàng thành công (`completed`).
  - Tính AOV, Tỷ lệ hủy đơn (Cancellation Rate), và Tỷ suất lợi nhuận gộp (Gross Margin %).
  - Phân tích Top 5 khách hàng đóng góp doanh thu cao nhất.
  - Viết truy vấn SQL sạch và lưu kết quả vào `kpi_summary.json`.
- **TASK-03: Trực quan hóa & Insight Nghiệp vụ (25đ)**
  - Xây dựng 4 biểu đồ: (1) Doanh thu theo tháng; (2) Tỷ trọng doanh thu theo Category; (3) Tỷ lệ hủy theo phương thức thanh toán; (4) Phân phối giá trị đơn hàng.
  - Viết bản báo cáo `executive_summary.md` (tối đa 2 trang) chứa 3 đề xuất định lượng.

### B. Nhiệm Vụ Mở Rộng (Extension Tasks - 30 Điểm)
- **TASK-EXT-01: Phân khúc Khách hàng RFM (15đ)**
  - Tính toán điểm R, F, M cho từng khách hàng (dùng phân vị hoặc ngưỡng nghiệp vụ).
  - Gán nhãn thành 5 nhóm: *Champions, Loyal Customers, Potential Loyalists, At Risk, Lost*.
  - Đề xuất chiến dịch kích hoạt riêng cho nhóm *At Risk*.
- **TASK-EXT-02: Bóc tách Nguyên nhân Hủy đơn & Kế hoạch Tối ưu (15đ)**
  - Phân tích tương quan giữa hình thức thanh toán (COD vs E-Wallet/Card) và tỷ lệ hủy đơn.
  - Đề xuất giải pháp định lượng nhằm giảm tỷ lệ hủy đơn tổng thể xuống dưới 8%.

## ⏱️ 5. Thời Gian & Quy Định Bàn Giao
- Thời lượng ước tính: **12 giờ**.
- Tham khảo barem chấm điểm tại `rubric.json` và bảng gợi ý tại `HINTS.md`.
- Kiểm tra danh mục trước khi nộp tại `submission_checklist.md`.
