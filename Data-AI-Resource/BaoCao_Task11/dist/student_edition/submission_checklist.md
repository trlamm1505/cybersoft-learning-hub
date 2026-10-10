# ✅ Danh Mục Kiểm Tra Nghiệm Thu Trước Khi Nộp Bài

Học viên vui lòng tự kiểm tra danh mục dưới đây trước khi đóng gói nộp bài:

- [ ] **1. Tính toàn vẹn dữ liệu:** File `orders_cleaned.csv` có đúng 400 bản ghi (loại bỏ hoàn toàn 2 bản ghi trùng lặp).
- [ ] **2. Không còn missing status:** Cột `order_status` không còn giá trị `null` hoặc rỗng `""`.
- [ ] **3. Tính đúng Net Revenue:** Doanh thu chỉ tính trên các đơn hàng có trạng thái `completed`.
- [ ] **4. Bóc tách chiết khấu:** Khi tính lợi nhuận sản phẩm đã trừ `discount_amount` và so sánh với `cost_price`.
- [ ] **5. File kết quả KPI:** Đã lưu kết quả tính toán vào `reports/kpi_summary.json` theo đúng cấu trúc.
- [ ] **6. Truy vấn SQL:** Đã lưu các câu lệnh truy vấn chuẩn hóa vào file `queries/sales_kpis.sql`.
- [ ] **7. Biểu đồ trực quan:** Có tối thiểu 4 biểu đồ trực quan hóa được lưu vào thư mục `reports/`.
- [ ] **8. Báo cáo quản trị:** File `reports/executive_summary.md` có đầy đủ 3 giải pháp kinh doanh định lượng.
- [ ] **9. Phân khúc RFM (Nếu làm phần mở rộng):** File `rfm_customer_segments.csv` gán nhãn cho toàn bộ khách hàng.
- [ ] **10. Khả năng tái lập:** File mã nguồn Python `src/sales_analysis.py` có thể chạy độc lập từ đầu đến cuối không lỗi.
