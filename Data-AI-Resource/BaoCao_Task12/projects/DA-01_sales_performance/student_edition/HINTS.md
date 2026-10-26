# HỆ THỐNG GỢI Ý PHÂN TẦNG — CAPSTONE DA-01 (TIERED HINTS)

Tài liệu này cung cấp giàn giáo sư phạm (Scaffolding) nhằm hỗ trợ học viên vượt qua các rào cản kỹ thuật mà **không làm lộ lời giải (Zero Answer Leakage)**. Hãy tham khảo tuần tự từ Tier 1 đến Tier 3 khi gặp bế tắc.

---

## TẦNG 1: GỢI Ý KHÁI NIỆM & HƯỚNG TIẾP CẬN (TIER 1 — CONCEPTUAL HINTS)

### Hint 1.1: Định nghĩa Doanh thu Thực nhận (Net Revenue)
* **Câu hỏi**: Tại sao doanh thu tính được bằng tổng cột `total_amount` trong `orders.csv` lại không khớp với báo cáo tài chính?
* **Khái niệm**: Trong thương mại điện tử, một đơn hàng phát sinh không đồng nghĩa với việc doanh nghiệp đã thu được tiền. Có 3 trạng thái cần lưu ý:
  - `completed`: Giao hàng thành công và đã đối soát thu tiền.
  - `cancelled`: Khách hủy trước hoặc trong khi giao (không phát sinh dòng tiền thực tế).
  - `returned`: Khách nhận nhưng đổi trả/hoàn tiền sau đó.
* **Gợi ý**: Net Revenue chỉ nên tính trên những đơn hàng đã thực sự hoàn tất thành công (`completed`).

### Hint 1.2: Phân biệt Giá niêm yết (List Price) và Giá thực bán (Net Price)
* **Khái niệm**: Lợi nhuận gộp của từng dòng sản phẩm không thể lấy `list_price - cost_price` vì doanh nghiệp có thể đã áp dụng giảm giá.
* **Gợi ý**: Hãy kiểm tra xem trong bảng `order_items.csv` có cột `discount_amount` hoặc `discount_percent` hay không. Doanh thu của một mặt hàng được tính bằng:
  $$\text{Item Net Revenue} = (\text{unit\_price} - \text{discount\_amount}) \times \text{quantity}$$

### Hint 1.3: Bản chất của Mô hình RFM
* **Khái niệm**: RFM phân tích hành vi khách hàng dựa trên 3 trụ cột:
  - *Recency (R)*: Khách hàng mua gần đây nhất cách ngày chốt sổ bao nhiêu ngày? (R càng nhỏ thì khách càng "nóng", điểm càng cao).
  - *Frequency (F)*: Khách đã hoàn tất bao nhiêu đơn hàng? (F càng lớn, điểm càng cao).
  - *Monetary (M)*: Khách đã đóng góp bao nhiêu tiền? (M càng lớn, điểm càng cao).

---

## TẦNG 2: GỢI Ý KỸ THUẬT & CÚ PHÁP (TIER 2 — TECHNICAL & SYNTAX HINTS)

### Hint 2.1: Truy vấn SQL gom nhóm theo Tháng và tính MoM %
* **Cú pháp gợi ý**: Sử dụng hàm trích xuất tháng và hàm cửa sổ `LAG()`:
```sql
WITH monthly_sales AS (
    SELECT 
        STRFTIME('%Y-%m', order_date) AS sales_month,
        ROUND(SUM(total_amount), 2) AS monthly_net_revenue
    FROM orders
    WHERE order_status = 'completed'
    GROUP BY STRFTIME('%Y-%m', order_date)
)
SELECT 
    sales_month,
    monthly_net_revenue,
    LAG(monthly_net_revenue, 1) OVER (ORDER BY sales_month) AS prev_month_revenue,
    ROUND(
        (monthly_net_revenue - LAG(monthly_net_revenue, 1) OVER (ORDER BY sales_month)) 
        * 100.0 / LAG(monthly_net_revenue, 1) OVER (ORDER BY sales_month), 
        2
    ) AS mom_growth_pct
FROM monthly_sales;
```

### Hint 2.2: Tránh lỗi Crash khi chia Phân vị RFM trong Python
* **Vấn đề**: Khi nhiều khách hàng có cùng số lần mua hàng ($F = 1$), hàm `pd.qcut(df['frequency'], 5)` sẽ báo lỗi `ValueError: Bin edges must be unique`.
* **Cú pháp giải quyết**: Sử dụng phương thức xếp hạng trước khi phân vị:
```python
# Sử dụng rank(method='first') để phân tách các giá trị bằng nhau
rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), 5, labels=[1, 2, 3, 4, 5])
```

### Hint 2.3: Công thức Excel đối soát Ma trận (Matrix Reconciliation)
* **Kỹ thuật**: Trong Excel, để tính tổng doanh thu thỏa mãn nhiều điều kiện mà không cần Pivot Table:
```excel
=SUMIFS(orders!E:E, orders!D:D, "completed", orders!C:C, ">=2024-01-01", orders!C:C, "<=2024-12-31")
```

---

## TẦNG 3: BẪY DỮ LIỆU & NGOẠI LỆ NGHIỆP VỤ (TIER 3 — EDGE CASES & PITFALLS)

### Hint 3.1: Bẫy Trùng lặp Khóa chính (Duplicate Primary Key)
* **Cảnh báo**: Trong file `orders.csv` có tồn tại 2 dòng trùng lặp hoàn toàn mã `order_id`.
* **Hậu quả**: Nếu bạn thực hiện phép `JOIN` giữa `orders` và `order_items` trước khi khử trùng lặp, các mặt hàng trong đơn hàng đó sẽ bị nhân đôi số lượng, dẫn đến doanh thu và lợi nhuận bị sai lệch nghiêm trọng.
* **Hành động**: Luôn thực hiện bước `deduplicate` bảng `orders` trước khi thực hiện bất kỳ phép JOIN nào.

### Hint 3.2: Bẫy Đơn hàng có Trạng thái Rỗng (Missing Status)
* **Cảnh báo**: Có 5 đơn hàng trong `orders.csv` có cột `order_status` bị để trống (NULL hoặc rỗng `""`).
* **Hậu quả**: Nếu bạn dùng mệnh đề `WHERE order_status = 'completed'`, 5 đơn hàng này sẽ bị loại trừ oan, làm thất thoát gần $5,000 doanh thu hợp lệ.
* **Hành động**: Kiểm tra ngày giao hàng và lịch sử thanh toán của 5 đơn này để thấy chúng đều đã hoàn tất giao dịch; hãy điền khuyết thiếu (`impute`) bằng giá trị `'completed'`.

### Hint 3.3: Bẫy Tính Trung bình của Tỷ lệ Phần trăm (Average of Percentages Trap)
* **Cảnh báo**: Không bao giờ được tính Biên lợi nhuận gộp toàn chuỗi (Total Gross Margin %) bằng cách lấy trung bình cộng (`AVERAGE`) của cột tỷ lệ phần trăm từng sản phẩm!
* **Hậu quả**: Vi phạm quy tắc thống kê trọng số. Sản phẩm bán 1 cái lãi 80% sẽ bị đánh đồng ngang với sản phẩm bán 10,000 cái lãi 10%.
* **Hành động**: Luôn tính:
  $$\text{Gross Margin \%} = \frac{\sum \text{Gross Profit}}{\sum \text{Net Revenue}} \times 100\%$$
