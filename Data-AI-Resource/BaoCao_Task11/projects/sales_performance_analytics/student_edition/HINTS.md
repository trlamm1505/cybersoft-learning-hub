# 💡 Gợi Ý Hướng Dẫn Thực Hiện Dự Án (Tiered Hints)

> **Lưu ý:** Dự án mô phỏng môi trường làm việc thực tế. Bạn nên cố gắng tự tư duy trước khi xem gợi ý. Hãy bắt đầu từ **Tier 1**, nếu vẫn bế tắc mới nâng lên **Tier 2**, và chỉ dùng **Tier 3** cho các ngoại lệ dữ liệu hóc búa.

---

## 🟢 TIER 1: Gợi Ý Logic Nghiệp Vụ & Khái Niệm (Conceptual Hints)
* **TASK-01 (Làm sạch):**
  * Trong hệ thống bán lẻ, một đơn hàng bị duplicate thường do người dùng bấm gửi nhiều lần hoặc mạng chập chờn. Bạn cần kiểm tra xem các dòng này có trùng `order_id` không.
  * Nếu một đơn hàng có đầy đủ tiền, đầy đủ mặt hàng mua và phương thức thanh toán hợp lệ nhưng `order_status` rỗng, nhiều khả năng đây là đơn thành công chưa kịp cập nhật cờ trạng thái.
* **TASK-02 (KPIs):**
  * Doanh thu thực nhận (Net Revenue) là tiền thật chảy vào tài khoản, do đó **không được cộng các đơn có trạng thái cancelled**.
  * AOV (Average Order Value) = Tổng Net Revenue chia cho tổng số đơn thành công.
* **TASK-03 (Trực quan hóa):**
  * Đừng chỉ vẽ biểu đồ cho đẹp. Hãy đặt câu hỏi: Biểu đồ này giúp Trưởng phòng Marketing hoặc Giám đốc CCO ra quyết định gì?
* **TASK-EXT-01 (RFM):**
  * Recency: Khách hàng mua gần đây nhất cách ngày chốt sổ bao lâu? Càng gần càng tốt.
  * Frequency: Số lần mua thành công.
  * Monetary: Tổng số tiền đã chi tiêu.

---

## 🟡 TIER 2: Gợi Ý Kỹ Thuật & Cú Pháp (Implementation Hints)
* **TASK-01 (Pandas/SQL):**
  * Pandas: `df.drop_duplicates(subset=['order_id'], keep='first')`
  * Xử lý missing status: `df['order_status'] = df['order_status'].fillna('completed').replace('', 'completed')`
* **TASK-02 (Truy vấn):**
  * SQL:
    ```sql
    SELECT 
        SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END) AS net_revenue,
        AVG(CASE WHEN order_status = 'completed' THEN total_amount ELSE NULL END) AS aov
    FROM orders;
    ```
* **TASK-EXT-01 (Phân vị RFM):**
  * Dùng `pd.qcut` để chia 5 phân vị (quintiles) từ 1 đến 5:
    ```python
    r_labels = [5, 4, 3, 2, 1]  # Mua càng gần điểm càng cao
    f_labels = [1, 2, 3, 4, 5]
    m_labels = [1, 2, 3, 4, 5]
    ```

---

## 🔴 TIER 3: Ngoại Lệ Kỹ Thuật & Dị Biệt Dữ Liệu (Edge Cases)
* **TASK-01:** File `orders.csv` có 2 dòng duplicate nằm ở cuối file được nhân bản từ các dòng 11 và 51. Nếu bạn không lọc duplicate, tổng doanh thu của bạn sẽ bị đội lên!
* **TASK-02:** Doanh thu trong `orders.csv` đã bao gồm `shipping_fee`. Khi tính lợi nhuận biên của sản phẩm, phải tính dựa trên `(unit_price - discount_amount - cost_price) * quantity` từ bảng `order_items.csv` nối với `products.csv`.
* **TASK-EXT-01:** Khi dùng `pd.qcut` cho Frequency, nếu phần lớn khách hàng chỉ mua 1 lần (giá trị trùng nhau), hàm `qcut` sẽ báo lỗi `ValueError: Bin edges must be unique`. Bạn cần truyền thêm đối số `duplicates='drop'` hoặc xếp hạng trước bằng `df['frequency'].rank(method='first')`.
