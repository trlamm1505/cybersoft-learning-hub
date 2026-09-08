# BỘ 20 CÂU HỎI PHÂN TÍCH KINH DOANH (DATA ANALYST PRACTICE SET)
## DATASET BÁN HÀNG ĐA BẢNG (`sales_v1`) — CYBERSOFT DATA & AI LAB

**Tác giả**: Đào Trung Kiên — Data & AI Resource Engineer  
**Đối tượng sử dụng**: Học viên khóa Data Analyst cơ bản — trung cấp & AI Engineer  
**Bộ dữ liệu áp dụng**: `sales_v1_clean` (5 bảng: `customers`, `products`, `employees`, `orders`, `order_details`)  

---

## MỤC LỤC PHÂN CẤP
1. [CẤP ĐỘ 1: CƠ BẢN (BASIC SQL & DESCRIPTIVE STATS - 7 CÂU)](#cấp-độ-1-cơ-bản-basic-sql--descriptive-stats)
2. [CẤP ĐỘ 2: TRUNG CẤP (MULTI-TABLE JOIN, GROUP BY & BUSINESS METRICS - 8 CÂU)](#cấp-độ-2-trung-cấp-multi-table-join-group-by--business-metrics)
3. [CẤP ĐỘ 3: NÂNG CAO & BI (WINDOW FUNCTIONS, COHORT & RFM ANALYSIS - 5 CÂU)](#cấp-độ-3-nâng-cao--bi-window-functions-cohort--rfm-analysis)

---

## CẤP ĐỘ 1: CƠ BẢN (BASIC SQL & DESCRIPTIVE STATS)

### Câu 1: Tổng quan chỉ số kinh doanh toàn diện
* **Câu hỏi nghiệp vụ**: Thống kê tổng doanh thu thực tế, tổng số đơn hàng đã phát sinh, tổng số lượng sản phẩm bán ra và giá trị trung bình của mỗi đơn hàng (AOV).
* **Mục tiêu phân tích**: Nắm bắt bức tranh tổng quan (High-level Executive Summary) về quy mô hoạt động kinh doanh.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(od.quantity) AS total_items_sold,
    ROUND(SUM(od.line_total), 2) AS total_revenue_vnd,
    ROUND(AVG(o.total_amount), 2) AS overall_aov_vnd
FROM orders o
JOIN order_details od ON o.order_id = od.order_id
WHERE o.order_status != 'Cancelled';
```
* **Ý nghĩa & Quyết định**: Đo lường sức khỏe tài chính chung; loại trừ đơn bị hủy để tránh thổi phồng doanh thu thực nhận.

---

### Câu 2: Top 5 sản phẩm mang lại doanh thu cao nhất
* **Câu hỏi nghiệp vụ**: Tìm danh sách 5 sản phẩm có đóng góp doanh thu lớn nhất cho công ty kèm theo ngành hàng của chúng.
* **Mục tiêu phân tích**: Xác định các sản phẩm "át chủ bài" (Hero Products) theo nguyên lý Pareto 80/20.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    SUM(od.quantity) AS total_quantity_sold,
    ROUND(SUM(od.line_total), 2) AS product_revenue_vnd
FROM order_details od
JOIN products p ON od.product_id = p.product_id
JOIN orders o ON od.order_id = o.order_id
WHERE o.order_status = 'Completed'
GROUP BY p.product_id, p.product_name, p.category
ORDER BY product_revenue_vnd DESC
LIMIT 5;
```
* **Ý nghĩa & Quyết định**: Đảm bảo nguồn hàng ổn định cho Top 5, tập trung ngân sách quảng cáo và bảo vệ biên lợi nhuận.

---

### Câu 3: Xu hướng doanh thu theo tháng (Monthly Revenue Trend)
* **Câu hỏi nghiệp vụ**: Tổng doanh thu và số lượng đơn hàng biến thiên như thế nào theo từng tháng trong năm?
* **Mục tiêu phân tích**: Phát hiện tính thời vụ (Seasonality) và xu hướng tăng trưởng doanh thu.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    SUBSTRING(order_date, 1, 7) AS order_month,
    COUNT(order_id) AS total_orders,
    ROUND(SUM(total_amount), 2) AS monthly_revenue_vnd
FROM orders
WHERE order_status = 'Completed'
GROUP BY SUBSTRING(order_date, 1, 7)
ORDER BY order_month ASC;
```
* **Ý nghĩa & Quyết định**: Hỗ trợ bộ phận Supply Chain lên kế hoạch nhập hàng trước các tháng cao điểm.

---

### Câu 4: Phân bố tỷ trọng phương thức thanh toán
* **Câu hỏi nghiệp vụ**: Khách hàng ưa chuộng phương thức thanh toán nào nhất (COD, Chuyển khoản, Thẻ tín dụng, Ví điện tử)?
* **Mục tiêu phân tích**: Đánh giá hành vi thanh toán không tiền mặt và rủi ro hoàn hàng (thường cao ở đơn COD).
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    payment_method,
    COUNT(order_id) AS order_count,
    ROUND(COUNT(order_id) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS percentage_share,
    ROUND(SUM(total_amount), 2) AS total_value_vnd
FROM orders
GROUP BY payment_method
ORDER BY order_count DESC;
```
* **Ý nghĩa & Quyết định**: Đàm phán mức phí giao dịch với cổng thanh toán điện tử nếu tỷ lệ thanh toán online gia tăng.

---

### Câu 5: Phân bổ địa lý của tập khách hàng
* **Câu hỏi nghiệp vụ**: Thống kê số lượng khách hàng đã đăng ký tài khoản tại mỗi tỉnh/thành phố.
* **Mục tiêu phân tích**: Đo lường mức độ thâm nhập thị trường theo khu vực địa lý.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    city,
    COUNT(customer_id) AS total_customers,
    ROUND(COUNT(customer_id) * 100.0 / (SELECT COUNT(*) FROM customers), 2) AS customer_percentage
FROM customers
GROUP BY city
ORDER BY total_customers DESC;
```
* **Ý nghĩa & Quyết định**: Phân bổ ngân sách tiếp thị địa phương (Geo-targeted ads) cho các thành phố trọng điểm như TP.HCM và Hà Nội.

---

### Câu 6: Cảnh báo hàng tồn kho dưới ngưỡng an toàn
* **Câu hỏi nghiệp vụ**: Liệt kê các sản phẩm đang kinh doanh (`Active`) nhưng có số lượng tồn kho thấp hơn 20 đơn vị.
* **Mục tiêu phân tích**: Ngăn ngừa rủi ro đứt gãy chuỗi cung ứng (Stock-out Risk).
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    product_id,
    product_name,
    category,
    stock_quantity,
    status
FROM products
WHERE status = 'Active' AND stock_quantity < 20
ORDER BY stock_quantity ASC;
```
* **Ý nghĩa & Quyết định**: Phát cảnh báo khẩn cấp cho phòng Mua hàng (Procurement) để kích hoạt đơn đặt hàng bổ sung.

---

### Câu 7: Tỷ lệ hoàn tất và hủy đơn hàng
* **Câu hỏi nghiệp vụ**: Thống kê số lượng và tỷ lệ % đơn hàng theo từng trạng thái (`Completed`, `Shipping`, `Pending`, `Cancelled`).
* **Mục tiêu phân tích**: Đo lường tỷ lệ hoàn tất đơn hàng (Fulfillment Rate) và tỷ lệ hủy đơn (Cancellation Rate).
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    order_status,
    COUNT(order_id) AS order_count,
    ROUND(COUNT(order_id) * 100.0 / (SELECT COUNT(*) FROM orders), 2) AS status_percentage
FROM orders
GROUP BY order_status
ORDER BY order_count DESC;
```
* **Ý nghĩa & Quyết định**: Nếu tỷ lệ hủy đơn vượt quá 5%, cần điều tra nguyên nhân (thời gian giao chậm, phí ship cao, hay hết hàng).

---

## CẤP ĐỘ 2: TRUNG CẤP (MULTI-TABLE JOIN, GROUP BY & BUSINESS METRICS)

### Câu 8: Giá trị đơn hàng trung bình (AOV) theo phân khúc khách hàng
* **Câu hỏi nghiệp vụ**: Mức chi tiêu trung bình trên mỗi đơn hàng giữa khách hàng `Retail`, `Wholesale` và `VIP` chênh lệch ra sao?
* **Mục tiêu phân tích**: Đánh giá giá trị kinh tế của từng nhóm phân khúc đối tượng.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    c.customer_segment,
    COUNT(DISTINCT o.order_id) AS total_orders,
    ROUND(SUM(o.total_amount), 2) AS segment_revenue_vnd,
    ROUND(AVG(o.total_amount), 2) AS avg_order_value_vnd
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.order_status = 'Completed'
GROUP BY c.customer_segment
ORDER BY avg_order_value_vnd DESC;
```
* **Ý nghĩa & Quyết định**: Thiết kế chính sách chăm sóc riêng cho VIP để nâng cao chỉ số Customer Lifetime Value (CLV).

---

### Câu 9: Bảng xếp hạng doanh số nhân viên kinh doanh
* **Câu hỏi nghiệp vụ**: Đánh giá hiệu suất bán hàng của từng nhân viên kinh doanh kèm vùng thị trường phụ trách.
* **Mục tiêu phân tích**: Làm căn cứ tính thưởng KPI (Incentives / Commission) cho đội ngũ Sales.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    e.employee_id,
    e.full_name,
    e.region,
    e.position,
    COUNT(o.order_id) AS completed_orders,
    ROUND(SUM(o.total_amount), 2) AS total_sales_vnd
FROM employees e
JOIN orders o ON e.employee_id = o.employee_id
WHERE o.order_status = 'Completed'
GROUP BY e.employee_id, e.full_name, e.region, e.position
ORDER BY total_sales_vnd DESC;
```
* **Ý nghĩa & Quyết định**: Tuyên dương cá nhân xuất sắc và lên kế hoạch đào tạo bổ trợ kỹ năng cho nhân sự doanh số thấp.

---

### Câu 10: Biên lợi nhuận gộp (Gross Margin) theo danh mục ngành hàng
* **Câu hỏi nghiệp vụ**: Ngành hàng nào mang lại tỷ suất lợi nhuận gộp cao nhất cho doanh nghiệp?
* **Mục tiêu phân tích**: Phân định ngành hàng mang lại doanh thu cao nhưng biên mỏng so với ngành hàng biên lợi nhuận dày.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    p.category,
    ROUND(SUM(od.line_total), 2) AS total_revenue_vnd,
    ROUND(SUM(od.quantity * p.cost_price), 2) AS total_cogs_vnd,
    ROUND(SUM(od.line_total) - SUM(od.quantity * p.cost_price), 2) AS gross_profit_vnd,
    ROUND((SUM(od.line_total) - SUM(od.quantity * p.cost_price)) * 100.0 / SUM(od.line_total), 2) AS gross_margin_percentage
FROM order_details od
JOIN products p ON od.product_id = p.product_id
JOIN orders o ON od.order_id = o.order_id
WHERE o.order_status = 'Completed'
GROUP BY p.category
ORDER BY gross_margin_percentage DESC;
```
* **Ý nghĩa & Quyết định**: Phụ kiện (Accessories) thường có biên lợi nhuận cao (>35%), có thể dùng làm quà tặng kèm để kích cầu đồ điện tử đắt tiền.

---

### Câu 11: Tỷ lệ khách hàng mua lặp lại (Repeat Purchase Rate)
* **Câu hỏi nghiệp vụ**: Có bao nhiêu % khách hàng đã mua từ 2 đơn hàng trở lên trong toàn bộ lịch sử?
* **Mục tiêu phân tích**: Đo lường độ trung thành của khách hàng và hiệu quả của chính sách Retention.
* **Truy vấn SQL mẫu**:
```sql
WITH CustomerOrders AS (
    SELECT 
        customer_id,
        COUNT(order_id) AS order_count
    FROM orders
    WHERE order_status = 'Completed'
    GROUP BY customer_id
)
SELECT 
    COUNT(customer_id) AS active_customers,
    SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END) AS repeat_customers,
    ROUND(SUM(CASE WHEN order_count > 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(customer_id), 2) AS repeat_purchase_rate
FROM CustomerOrders;
```
* **Ý nghĩa & Quyết định**: Nếu tỷ lệ mua lại thấp (<25%), cần bổ sung các chương trình Re-engagement, tích điểm đổi quà (Loyalty points).

---

### Câu 12: Thời gian xử lý & giao hàng trung bình (Lead Time) theo khu vực
* **Câu hỏi nghiệp vụ**: Thời gian từ khi khách chốt đơn đến khi đối tác vận chuyển giao thành công trung bình là bao nhiêu ngày tại từng vùng?
* **Mục tiêu phân tích**: Giám sát SLA chất lượng dịch vụ vận tải và logistics.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    e.region,
    COUNT(o.order_id) AS delivered_orders,
    ROUND(AVG(JULIANDAY(o.shipping_date) - JULIANDAY(o.order_date)), 2) AS avg_lead_time_days
FROM orders o
JOIN employees e ON o.employee_id = e.employee_id
WHERE o.order_status = 'Completed' AND o.shipping_date IS NOT NULL AND o.shipping_date != ''
GROUP BY e.region
ORDER BY avg_lead_time_days ASC;
```
* **Ý nghĩa & Quyết định**: Đàm phán lại SLA với đơn vị chuyển phát nhanh tại những khu vực có Lead Time vượt quá 3 ngày.

---

### Câu 13: Kích thước giỏ hàng trung bình (Basket Size Analysis)
* **Câu hỏi nghiệp vụ**: Trung bình một đơn hàng chứa bao nhiêu loại sản phẩm khác nhau và tổng số lượng hàng là bao nhiêu?
* **Mục tiêu phân tích**: Đánh giá khả năng bán chéo (Cross-selling) và độ sâu giỏ hàng.
* **Truy vấn SQL mẫu**:
```sql
WITH OrderBasket AS (
    SELECT 
        order_id,
        COUNT(product_id) AS distinct_products_count,
        SUM(quantity) AS total_items_count
    FROM order_details
    GROUP BY order_id
)
SELECT 
    ROUND(AVG(distinct_products_count), 2) AS avg_distinct_products_per_order,
    ROUND(AVG(total_items_count), 2) AS avg_total_units_per_order
FROM OrderBasket;
```
* **Ý nghĩa & Quyết định**: Cải thiện thuật toán gợi ý sản phẩm liên quan trên website để nâng kích thước giỏ hàng lên >2.5 sản phẩm/đơn.

---

### Câu 14: Hiệu quả của chính sách chiết khấu giảm giá
* **Câu hỏi nghiệp vụ**: Các dòng sản phẩm có áp dụng giảm giá (`discount > 0`) có tạo ra số lượng bán vượt trội so với dòng bán nguyên giá không?
* **Mục tiêu phân tích**: Đo lường độ co giãn của cầu theo giá và hiệu quả của các chương trình khuyến mãi.
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    CASE WHEN discount > 0 THEN 'Discounted Items' ELSE 'Full Price Items' END AS promo_type,
    COUNT(order_detail_id) AS line_count,
    SUM(quantity) AS total_units_sold,
    ROUND(SUM(line_total), 2) AS total_revenue_vnd,
    ROUND(AVG(line_total), 2) AS avg_line_value_vnd
FROM order_details
GROUP BY CASE WHEN discount > 0 THEN 'Discounted Items' ELSE 'Full Price Items' END;
```
* **Ý nghĩa & Quyết định**: Kiểm tra xem chiết khấu có thực sự tạo ra lượng đơn vượt trội để bù đắp cho phần doanh thu bị cắt giảm hay không.

---

### Câu 15: Cặp sản phẩm thường xuyên được mua cùng nhau (Market Basket Affinity)
* **Câu hỏi nghiệp vụ**: Tìm những cặp sản phẩm nào thường xuyên xuất hiện cùng nhau nhất trong cùng một đơn hàng?
* **Mục tiêu phân tích**: Khám phá hành vi mua sắm đồng thời để tạo gói combo (Product Bundling).
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    p1.product_name AS product_A,
    p2.product_name AS product_B,
    COUNT(*) AS times_bought_together
FROM order_details d1
JOIN order_details d2 ON d1.order_id = d2.order_id AND d1.product_id < d2.product_id
JOIN products p1 ON d1.product_id = p1.product_id
JOIN products p2 ON d2.product_id = p2.product_id
GROUP BY p1.product_name, p2.product_name
ORDER BY times_bought_together DESC
LIMIT 5;
```
* **Ý nghĩa & Quyết định**: Đóng gói thành Combo (ví dụ: Bàn phím cơ + Chuột không dây) với mức giá ưu đãi nhẹ để kích cầu mua trọn bộ.

---

## CẤP ĐỘ 3: NÂNG CAO & BI (WINDOW FUNCTIONS, COHORT & RFM ANALYSIS)

### Câu 16: Phân tích RFM (Recency - Frequency - Monetary) phân loại khách hàng
* **Câu hỏi nghiệp vụ**: Phân nhóm khách hàng theo 3 chiều: Ngày mua gần nhất (Recency), Tần suất mua hàng (Frequency) và Tổng tiền tích lũy (Monetary) bằng hàm phân vị `NTILE(4)`.
* **Mục tiêu phân tích**: Xây dựng ma trận phân khúc khách hàng tự động phục vụ chiến dịch CRM cá nhân hóa.
* **Truy vấn SQL mẫu**:
```sql
WITH CustomerMetrics AS (
    SELECT 
        c.customer_id,
        c.full_name,
        JULIANDAY('2026-07-01') - JULIANDAY(MAX(o.order_date)) AS recency_days,
        COUNT(DISTINCT o.order_id) AS frequency,
        ROUND(SUM(o.total_amount), 2) AS monetary
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    WHERE o.order_status = 'Completed'
    GROUP BY c.customer_id, c.full_name
),
RFM_Scores AS (
    SELECT 
        customer_id,
        full_name,
        recency_days,
        frequency,
        monetary,
        NTILE(4) OVER (ORDER BY recency_days DESC) AS r_score, -- Mua càng gần điểm càng cao
        NTILE(4) OVER (ORDER BY frequency ASC) AS f_score,
        NTILE(4) OVER (ORDER BY monetary ASC) AS m_score
    FROM CustomerMetrics
)
SELECT 
    customer_id,
    full_name,
    recency_days,
    frequency,
    monetary,
    (r_score + f_score + m_score) AS rfm_total_score,
    CASE 
        WHEN (r_score + f_score + m_score) >= 10 THEN 'Champions / VIPs'
        WHEN (r_score + f_score + m_score) >= 7 THEN 'Loyal Customers'
        WHEN (r_score + f_score + m_score) >= 5 THEN 'Potential Loyalists'
        ELSE 'At Risk / Hibernating'
    END AS customer_tier
FROM RFM_Scores
ORDER BY rfm_total_score DESC;
```
* **Ý nghĩa & Quyết định**: Gửi voucher tri ân cho Champions; gửi email đánh thức (Win-back campaign) cho nhóm At Risk.

---

### Câu 17: Xếp hạng sản phẩm có doanh thu cao nhất trong từng ngành hàng (Window Function)
* **Câu hỏi nghiệp vụ**: Dùng hàm `DENSE_RANK()` để tìm ra Top 2 sản phẩm dẫn đầu doanh thu bên trong mỗi ngành hàng.
* **Mục tiêu phân tích**: Tránh trường hợp ngành hàng lớn lấn át hoàn toàn các ngành hàng ngách trong bảng xếp hạng tổng.
* **Truy vấn SQL mẫu**:
```sql
WITH ProductSales AS (
    SELECT 
        p.category,
        p.product_id,
        p.product_name,
        ROUND(SUM(od.line_total), 2) AS category_product_revenue
    FROM order_details od
    JOIN products p ON od.product_id = p.product_id
    JOIN orders o ON od.order_id = o.order_id
    WHERE o.order_status = 'Completed'
    GROUP BY p.category, p.product_id, p.product_name
),
RankedProducts AS (
    SELECT 
        category,
        product_name,
        category_product_revenue,
        DENSE_RANK() OVER (PARTITION BY category ORDER BY category_product_revenue DESC) AS rank_in_category
    FROM ProductSales
)
SELECT 
    category,
    rank_in_category,
    product_name,
    category_product_revenue
FROM RankedProducts
WHERE rank_in_category <= 2
ORDER BY category, rank_in_category;
```
* **Ý nghĩa & Quyết định**: Đặt sản phẩm Top 1 của từng ngành lên banner nổi bật của từng chuyên mục trên ứng dụng/web.

---

### Câu 18: Tỷ lệ tăng trưởng doanh thu theo tháng MoM (Month-over-Month Growth)
* **Câu hỏi nghiệp vụ**: Tính tỷ lệ % tăng trưởng doanh thu của tháng hiện tại so với tháng liền trước bằng hàm `LAG()`.
* **Mục tiêu phân tích**: Theo dõi động lượng tăng trưởng doanh thu (Revenue Momentum).
* **Truy vấn SQL mẫu**:
```sql
WITH MonthlyRev AS (
    SELECT 
        SUBSTRING(order_date, 1, 7) AS month_year,
        ROUND(SUM(total_amount), 2) AS current_month_revenue
    FROM orders
    WHERE order_status = 'Completed'
    GROUP BY SUBSTRING(order_date, 1, 7)
)
SELECT 
    month_year,
    current_month_revenue,
    LAG(current_month_revenue, 1) OVER (ORDER BY month_year) AS prev_month_revenue,
    ROUND(
        (current_month_revenue - LAG(current_month_revenue, 1) OVER (ORDER BY month_year)) * 100.0 / 
        LAG(current_month_revenue, 1) OVER (ORDER BY month_year), 
        2
    ) AS mom_growth_rate_pct
FROM MonthlyRev
ORDER BY month_year;
```
* **Ý nghĩa & Quyết định**: Đánh giá hiệu quả của các chiến dịch Marketing theo quý dựa trên biến động MoM.

---

### Câu 19: Phân tích Cohort doanh thu theo tháng đăng ký tài khoản (Cohort Retention)
* **Câu hỏi nghiệp vụ**: Các nhóm khách hàng đăng ký tài khoản trong quý 1 năm 2024 đóng góp bao nhiêu doanh thu trong các quý tiếp theo?
* **Mục tiêu phân tích**: Đánh giá chất lượng của các đợt người dùng mới đăng ký (User Acquisition Quality).
* **Truy vấn SQL mẫu**:
```sql
SELECT 
    SUBSTRING(c.created_at, 1, 7) AS signup_cohort,
    SUBSTRING(o.order_date, 1, 7) AS purchase_month,
    COUNT(DISTINCT o.customer_id) AS active_buyers,
    ROUND(SUM(o.total_amount), 2) AS cohort_revenue_vnd
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_status = 'Completed'
GROUP BY SUBSTRING(c.created_at, 1, 7), SUBSTRING(o.order_date, 1, 7)
ORDER BY signup_cohort, purchase_month;
```
* **Ý nghĩa & Quyết định**: Xác định vòng đời chi tiêu của khách hàng theo thời gian kể từ ngày mở tài khoản.

---

### Câu 20: Phát hiện khách hàng nguy cơ rời bỏ (Churn Risk Detection)
* **Câu hỏi nghiệp vụ**: Xác định danh sách khách hàng thuộc phân khúc `VIP` hoặc `Wholesale` từng chi tiêu trên 20.000.000 VNĐ nhưng không có đơn hàng nào trong vòng 90 ngày qua (tính đến mốc phân tích `2026-07-01`).
* **Mục tiêu phân tích**: Kích hoạt quy trình can thiệp chủ động để cứu vãn khách hàng giá trị cao trước khi mất vĩnh viễn.
* **Truy vấn SQL mẫu**:
```sql
WITH HighValueCustomers AS (
    SELECT 
        c.customer_id,
        c.full_name,
        c.customer_segment,
        c.phone,
        ROUND(SUM(o.total_amount), 2) AS lifetime_spend,
        MAX(o.order_date) AS last_order_date,
        ROUND(JULIANDAY('2026-07-01') - JULIANDAY(MAX(o.order_date)), 0) AS days_since_last_order
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    WHERE o.order_status = 'Completed' AND c.customer_segment IN ('VIP', 'Wholesale')
    GROUP BY c.customer_id, c.full_name, c.customer_segment, c.phone
    HAVING SUM(o.total_amount) >= 20000000
)
SELECT 
    customer_id,
    full_name,
    customer_segment,
    phone,
    lifetime_spend,
    last_order_date,
    days_since_last_order
FROM HighValueCustomers
WHERE days_since_last_order >= 90
ORDER BY lifetime_spend DESC;
```
* **Ý nghĩa & Quyết định**: Chuyển ngay danh sách khách hàng này cho Trưởng phòng Chăm sóc khách hàng hoặc Account Manager gọi điện trực tiếp thăm hỏi và tặng ưu đãi cá nhân hóa.
