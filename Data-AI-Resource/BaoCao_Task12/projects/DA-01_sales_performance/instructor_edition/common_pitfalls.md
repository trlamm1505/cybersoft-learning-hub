# DANH MỤC 8 LỖI SAI KINH ĐIỂN CỦA HỌC VIÊN & CÁCH PHÒNG TRÁNH (COMMON STUDENT PITFALLS BANK)

Tài liệu này tổng hợp 8 bẫy dữ liệu và lỗi tư duy phổ biến nhất mà học viên thường mắc phải khi thực hiện Capstone DA-01, kèm theo cơ chế phát hiện tự động cho Giảng viên / Auto-Grader.

---

### LỖI 01: TÍNH CẢ ĐƠN HÀNG BỊ HỦY VÀO DOANH THU (CANCELLED ORDERS LEAKAGE)
* **Triệu chứng**: Học viên tính Doanh thu ra `$462,310.50` thay vì `$388,850.28` (chênh lệch hơn `$73,000`).
* **Nguyên nhân gốc**: Học viên chỉ đơn giản viết `SELECT SUM(total_amount) FROM orders;` mà không lọc điều kiện `WHERE order_status = 'completed'`. Đơn hàng bị hủy (`cancelled`) không mang lại dòng tiền thực tế cho doanh nghiệp.
* **Cách phát hiện tự động**: Kiểm tra xem giá trị nộp bài có vượt quá ngưỡng `$390,000` hay không; trừ 10 điểm ở tiêu chí CRIT-02.
* **Hướng dẫn sư phạm**: Nhắc nhở học viên về khái niệm Kế toán Doanh thu dồn tích vs Doanh thu thực nhận.

---

### LỖI 02: NHÂN ĐÔI DÒNG KHI JOIN TRƯỚC KHI KHỬ TRÙNG LẶP (DUPLICATE MULTIPLICATION TRAP)
* **Triệu chứng**: Số lượng dòng trong bảng kết quả sau khi join bị tăng lên bất thường (hơn 1,005 dòng thay vì 997 dòng).
* **Nguyên nhân gốc**: Bảng `orders.csv` có 2 dòng trùng lặp hoàn toàn mã `order_id`. Khi học viên thực hiện `INNER JOIN order_items ON orders.order_id = order_items.order_id`, các mặt hàng thuộc 2 đơn hàng này bị nhân bản gấp đôi.
* **Cách phát hiện tự động**: Đếm số dòng sau khi merge; nếu `len(merged) > 997` thì cảnh báo học viên chưa làm sạch dữ liệu nguồn.
* **Hướng dẫn sư phạm**: Rèn luyện thói quen kiểm toán khóa chính (Primary Key Uniqueness Check) trước khi thực hiện bất kỳ phép JOIN nào.

---

### LỖI 03: XÓA OAN CÁC ĐƠN HÀNG THIẾU TRẠNG THÁI (DROP NULL STATUS INSTEAD OF IMPUTE)
* **Triệu chứng**: Số lượng đơn hàng sau làm sạch chỉ còn 395 đơn thay vì 400 đơn; Doanh thu bị hụt mất `$4,950.00`.
* **Nguyên nhân gốc**: Học viên sử dụng hàm `dropna(subset=['order_status'])` hoặc mệnh đề `WHERE order_status IS NOT NULL` để loại bỏ 5 đơn hàng bị khuyết trạng thái mà không kiểm tra log giao hàng thực tế.
* **Cách phát hiện tự động**: Đếm `total_clean_orders`; nếu bằng 395 thì trừ 3 điểm ở tiêu chí CRIT-01.
* **Hướng dẫn sư phạm**: Hướng dẫn nguyên tắc xử lý Missing Data: Không bao giờ tùy tiện xóa dòng nếu dữ liệu vẫn có thể cứu vãn hoặc quy chuẩn hóa có cơ sở nghiệp vụ.

---

### LỖI 04: TÍNH AOV THEO DÒNG MẶT HÀNG THAY VÌ CẤP ĐƠN HÀNG (ITEM-LEVEL VS ORDER-LEVEL AOV)
* **Triệu chứng**: AOV bị tính ra `$450.20` hoặc `$510.15` thay vì `$1,150.44`.
* **Nguyên nhân gốc**: Học viên lấy trung bình cột giá trị trên bảng `order_items` (Giá trị trung bình của từng món hàng trong giỏ) thay vì lấy tổng doanh thu chia cho số lượng đơn hàng hoàn tất. Một đơn hàng có thể chứa nhiều mặt hàng (Basket Size $> 1$).
* **Cách phát hiện tự động**: Kiểm tra giá trị AOV nộp vào; nếu $< \$700$ thì bắt lỗi tính sai cấp độ tổng hợp (Granularity Mismatch).
* **Hướng dẫn sư phạm**: Nhấn mạnh khái niệm Mức độ chi tiết của dữ liệu (Data Granularity): Cấp Header vs Cấp Line-Item.

---

### LỖI 05: LẤY TRUNG BÌNH CỘNG CỦA CÁC TỶ LỆ PHẦN TRĂM (AVERAGE OF PERCENTAGES FALLACY)
* **Triệu chứng**: Biên lợi nhuận gộp toàn chuỗi bị tính ra `34.80%` hoặc `28.10%` thay vì `31.43%`.
* **Nguyên nhân gốc**: Học viên tính biên lợi nhuận của từng sản phẩm rồi dùng hàm `AVERAGE()` để tính bình quân toàn chuỗi. Điều này vi phạm nguyên lý toán học vì các sản phẩm có doanh số bán khác nhau, không thể gộp bình quân giản đơn không trọng số.
* **Cách phát hiện tự động**: Kiểm tra công thức DAX / Excel của học viên; nếu dùng `AVERAGE(Gross_Margin_Pct)` thì đánh dấu lỗi nghiêm trọng.
* **Hướng dẫn sư phạm**: Luôn tính Tổng Lợi nhuận gộp chia cho Tổng Doanh thu.

---

### LỖI 06: CRASH CHƯƠNG TRÌNH KHI CHIA PHÂN VỊ RFM VÌ TRÙNG LẶP TẦN SUẤT (TIED QUANTILE CRASH)
* **Triệu chứng**: Mã nguồn Python ném ngoại lệ: `ValueError: Bin edges must be unique`.
* **Nguyên nhân gốc**: Có hơn 50% khách hàng chỉ mua đúng 1 đơn ($F = 1$). Khi chia 5 phân vị bằng `pd.qcut()`, các điểm phân vị $q_{20}, q_{40}, q_{60}$ đều có giá trị bằng 1, khiến các mốc biên giới hạn bị trùng lặp.
* **Cách phát hiện tự động**: Chạy file Python của học viên với bộ test có nhiều số trùng; bắt ngoại lệ ValueError.
* **Hướng dẫn sư phạm**: Sử dụng kỹ thuật xếp hạng thứ tự duy nhất trước khi phân vị: `df['frequency'].rank(method='first')`.

---

### LỖI 07: BỎ QUÊN CHIẾT KHẤU KHI TÍNH LỢI NHUẬN MẶT HÀNG (IGNORING ITEM DISCOUNTS)
* **Triệu chứng**: Lợi nhuận gộp bị tính ra `$135,200.00` thay vì `$121,652.51` (thổi phồng lợi nhuận thêm gần `$14,000`).
* **Nguyên nhân gốc**: Học viên tính giá bán bằng `unit_price` mà quên trừ đi `discount_amount` được giảm trực tiếp cho khách hàng.
* **Cách phát hiện tự động**: Kiểm tra độ lệch của Gross Profit so với Ground Truth `$121,652.51`.
* **Hướng dẫn sư phạm**: Đọc kỹ Từ điển Dữ liệu (Data Dictionary), nắm rõ các trường trừ lùi trước khi tính Gross Profit.

---

### LỖI 08: SAI MẪU SỐ KHI TÍNH TỶ LỆ HỦY ĐƠN HÀNG (WRONG DENOMINATOR FOR CANCELLATION RATE)
* **Triệu chứng**: Tỷ lệ hủy đơn bị tính ra `12.72%` thay vì `10.75%`.
* **Nguyên nhân gốc**: Học viên lấy 43 đơn hủy chia cho 338 đơn hoàn tất (`43 / 338 = 12.72%`) thay vì chia cho tổng số đơn hàng phát sinh sau làm sạch (`43 / 400 = 10.75%`).
* **Cách phát hiện tự động**: Kiểm tra kết quả `cancellation_rate_pct`; nếu xấp xỉ `12.7%` thì bắt lỗi sai mẫu số.
* **Hướng dẫn sư phạm**: Tỷ lệ của một phần trong tổng thể luôn có mẫu số là toàn bộ không gian mẫu (Total Clean Population).
