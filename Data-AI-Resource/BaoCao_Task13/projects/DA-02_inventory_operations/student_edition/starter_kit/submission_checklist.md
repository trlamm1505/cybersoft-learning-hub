# BẢNG TỰ KIỂM TRA TRƯỚC KHI NỘP BÀI (SUBMISSION CHECKLIST) — CAPSTONE DA-02
## TỰ ĐÁNH GIÁ ĐỊNH LƯỢNG 10 TIÊU CHÍ

Trước khi nộp bài lên hệ thống CyberSoft Learning Hub, học viên hãy tích chọn đầy đủ các mục kiểm tra dưới đây:

---

### PHẦN 1: TÍNH TOÀN VẸN SỐ HỌC & ĐỐI SOÁT
- [ ] **1. Số dư đầu kỳ**: Đã tính đầy đủ các dòng `reference_doc = 'INIT-BALANCE-2024'`, không bị thiếu hụt tồn kho ban đầu.
- [ ] **2. Đối soát cân bằng kho**: Tổng số lượng tồn kho cuối kỳ khớp tuyệt đối giữa SQL, Python và phương trình cân bằng kho.
- [ ] **3. Chiều biến động kho**: Sử dụng chính xác cột `direction` (`IN` mang dấu dương, `OUT` mang dấu âm).
- [ ] **4. Giá vốn hàng bán (COGS)**: Chỉ tính cho các dòng `movement_type = 'OUTBOUND_SALE'`, không gộp nhầm các giao dịch điều chuyển kho nội bộ.
- [ ] **5. Định giá kho**: Sử dụng cột `unit_cost` để nhân với số lượng tồn kho, không dùng giá bán `unit_price`.
- [ ] **6. Vòng quay tồn kho**: Lấy Tổng COGS chia cho Tồn kho bình quân cả năm, không tính trung bình cộng của các tỷ lệ phần trăm.

### PHẦN 2: XỬ LÝ NGOẠI LỆ NGHIỆP VỤ & BÁO CÁO
- [ ] **7. Xử lý 8 ngoại lệ**: Đã giải trình rõ nguyên nhân và phương án xử lý cho 8 ngoại lệ nghiệp vụ trong bộ dữ liệu dirty (tồn kho âm, quét trùng, hàng đi đường, hao hụt kiểm kê...).
- [ ] **8. Cảnh báo vận hành**: Đã xác định chính xác danh sách các mã SKU chạm ngưỡng Reorder Point và mã SKU bị đứt hàng.
- [ ] **9. Mô hình Excel / BI**: Đủ 5 sheets chức năng có PivotTable, Slicers và biểu đồ trực quan sắc nét.
- [ ] **10. Executive Memo**: Bản ghi nhớ điều hành trả lời đủ 10 câu hỏi của Ban Giám đốc và đề xuất Kế hoạch hành động 90 ngày khả thi.
