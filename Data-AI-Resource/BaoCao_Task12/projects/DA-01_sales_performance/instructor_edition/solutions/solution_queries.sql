-- ====================================================================
-- CYBERSOFT MART — CAPSTONE DA-01 INSTRUCTOR SOLUTION REFERENCE
-- Official SQL Implementation covering Tasks 01 to 10
-- Author: CyberSoft Data & AI Lab Instructor Team
-- Target DBMS: SQLite / PostgreSQL / MySQL 8.0+
-- ====================================================================

-- --------------------------------------------------------------------
-- PHẦN 1: TẠO BẢNG DỮ LIỆU SẠCH (DATA CLEANING & DEDUPLICATION)
-- --------------------------------------------------------------------

DROP TABLE IF EXISTS cleaned_orders;
CREATE TEMP TABLE cleaned_orders AS
WITH dedup AS (
    SELECT 
        order_id,
        customer_id,
        order_date,
        -- Chuẩn hóa: Nếu null hoặc rỗng thì điền 'completed'
        CASE 
            WHEN order_status IS NULL OR TRIM(order_status) = '' THEN 'completed'
            ELSE LOWER(TRIM(order_status))
        END AS order_status,
        total_amount,
        payment_method,
        shipping_fee,
        ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date ASC) AS row_num
    FROM orders
)
SELECT 
    order_id,
    customer_id,
    order_date,
    order_status,
    total_amount,
    payment_method,
    shipping_fee
FROM dedup
WHERE row_num = 1;

-- Kiểm tra kiểm toán: Phải ra đúng 400 dòng sạch
SELECT COUNT(*) AS audit_clean_orders_count FROM cleaned_orders;


-- --------------------------------------------------------------------
-- PHẦN 2: TÍNH TOÁN BỘ CHỈ SỐ TÀI CHÍNH CỐT LÕI (CORE KPIS)
-- Ground Truth: Net Revenue = $388,850.28, AOV = $1,150.44
-- --------------------------------------------------------------------

-- 1. Net Revenue, AOV, Tỷ lệ Hủy và Hoàn đơn
SELECT 
    COUNT(*) AS total_orders,
    SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(CASE WHEN order_status = 'returned' THEN 1 ELSE 0 END) AS returned_orders,
    ROUND(SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END), 2) AS net_revenue_usd,
    ROUND(AVG(CASE WHEN order_status = 'completed' THEN total_amount ELSE NULL END), 2) AS aov_usd,
    ROUND(SUM(CASE WHEN order_status = 'cancelled' THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 2) AS cancellation_rate_pct,
    ROUND(SUM(CASE WHEN order_status = 'returned' THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 2) AS return_rate_pct
FROM cleaned_orders;

-- 2. Gross Profit và Gross Margin % toàn chuỗi
-- Ground Truth: Gross Profit = $121,652.51, Gross Margin = 31.43%
WITH item_financials AS (
    SELECT 
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
        oi.discount_amount,
        p.cost_price,
        -- Doanh thu thực nhận trên từng mặt hàng
        (oi.unit_price - oi.discount_amount) * oi.quantity AS item_net_revenue,
        -- Giá vốn mặt hàng
        p.cost_price * oi.quantity AS item_total_cost,
        -- Lợi nhuận gộp mặt hàng
        ((oi.unit_price - oi.discount_amount) - p.cost_price) * oi.quantity AS item_gross_profit
    FROM order_items oi
    INNER JOIN cleaned_orders o ON oi.order_id = o.order_id
    INNER JOIN products p ON oi.product_id = p.product_id
    WHERE o.order_status = 'completed'
)
SELECT 
    ROUND(SUM(item_net_revenue), 2) AS total_items_revenue,
    ROUND(SUM(item_total_cost), 2) AS total_cogs_usd,
    ROUND(SUM(item_gross_profit), 2) AS total_gross_profit_usd,
    ROUND(SUM(item_gross_profit) * 100.0 / SUM(item_net_revenue), 2) AS gross_margin_pct
FROM item_financials;


-- --------------------------------------------------------------------
-- PHẦN 3: XU HƯỚNG DOANH THU THEO THÁNG & TĂNG TRƯỞNG MOM %
-- --------------------------------------------------------------------

WITH monthly_sales AS (
    SELECT 
        STRFTIME('%Y-%m', order_date) AS order_month,
        COUNT(*) AS monthly_orders,
        ROUND(SUM(total_amount), 2) AS monthly_revenue
    FROM cleaned_orders
    WHERE order_status = 'completed'
    GROUP BY STRFTIME('%Y-%m', order_date)
)
SELECT 
    order_month,
    monthly_orders,
    monthly_revenue,
    LAG(monthly_revenue, 1) OVER (ORDER BY order_month) AS prev_month_revenue,
    ROUND(
        (monthly_revenue - LAG(monthly_revenue, 1) OVER (ORDER BY order_month)) * 100.0 /
        LAG(monthly_revenue, 1) OVER (ORDER BY order_month),
        2
    ) AS mom_growth_pct
FROM monthly_sales
ORDER BY order_month;


-- --------------------------------------------------------------------
-- PHẦN 4: HIỆU SUẤT THEO DANH MỤC & TOP 10 SẢN PHẨM CHỦ LỰC
-- --------------------------------------------------------------------

-- Doanh thu & Lợi nhuận gộp theo Danh mục sản phẩm
SELECT 
    p.category,
    COUNT(DISTINCT oi.order_id) AS total_orders_involved,
    SUM(oi.quantity) AS total_units_sold,
    ROUND(SUM((oi.unit_price - oi.discount_amount) * oi.quantity), 2) AS category_net_revenue,
    ROUND(SUM(((oi.unit_price - oi.discount_amount) - p.cost_price) * oi.quantity), 2) AS category_gross_profit,
    ROUND(
        SUM(((oi.unit_price - oi.discount_amount) - p.cost_price) * oi.quantity) * 100.0 /
        SUM((oi.unit_price - oi.discount_amount) * oi.quantity), 
        2
    ) AS category_margin_pct
FROM order_items oi
INNER JOIN cleaned_orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_status = 'completed'
GROUP BY p.category
ORDER BY category_net_revenue DESC;

-- Top 10 Sản phẩm có doanh thu cao nhất
SELECT 
    p.product_id,
    p.product_name,
    p.category,
    SUM(oi.quantity) AS total_quantity,
    ROUND(SUM((oi.unit_price - oi.discount_amount) * oi.quantity), 2) AS product_net_revenue,
    ROUND(SUM(((oi.unit_price - oi.discount_amount) - p.cost_price) * oi.quantity), 2) AS product_gross_profit
FROM order_items oi
INNER JOIN cleaned_orders o ON oi.order_id = o.order_id
INNER JOIN products p ON oi.product_id = p.product_id
WHERE o.order_status = 'completed'
GROUP BY p.product_id, p.product_name, p.category
ORDER BY product_net_revenue DESC
LIMIT 10;


-- --------------------------------------------------------------------
-- PHẦN 5: PHÂN TÍCH RỦI RO HỦY HOÀN THEO HÌNH THỨC THANH TOÁN
-- --------------------------------------------------------------------

SELECT 
    payment_method,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(CASE WHEN order_status = 'returned' THEN 1 ELSE 0 END) AS returned_orders,
    ROUND(SUM(CASE WHEN order_status = 'cancelled' THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 2) AS cancellation_rate_pct,
    ROUND(SUM(CASE WHEN order_status = 'returned' THEN 1.0 ELSE 0 END) * 100.0 / COUNT(*), 2) AS return_rate_pct
FROM cleaned_orders
GROUP BY payment_method
ORDER BY cancellation_rate_pct DESC;


-- --------------------------------------------------------------------
-- PHẦN 6: MÔ HÌNH PHÂN KHÚC KHÁCH HÀNG RFM (EXTENSION)
-- Snapshot Date: 2024-12-31
-- --------------------------------------------------------------------

WITH customer_rfm_raw AS (
    SELECT 
        c.customer_id,
        c.full_name,
        -- Recency: Số ngày kể từ lần mua cuối tới 2024-12-31
        CAST(JULIANDAY('2024-12-31') - JULIANDAY(MAX(o.order_date)) AS INT) AS recency_days,
        -- Frequency: Số đơn hoàn tất
        COUNT(o.order_id) AS frequency_orders,
        -- Monetary: Tổng chi tiêu thực tế
        ROUND(SUM(o.total_amount), 2) AS monetary_usd
    FROM customers c
    INNER JOIN cleaned_orders o ON c.customer_id = o.customer_id
    WHERE o.order_status = 'completed'
    GROUP BY c.customer_id, c.full_name
),
rfm_ranked AS (
    SELECT 
        customer_id,
        full_name,
        recency_days,
        frequency_orders,
        monetary_usd,
        -- Xếp hạng theo phân vị (NTILE 5)
        NTILE(5) OVER (ORDER BY recency_days DESC) AS r_score, -- Recency nhỏ thì điểm cao, nên order DESC cho ntile
        NTILE(5) OVER (ORDER BY frequency_orders ASC) AS f_score,
        NTILE(5) OVER (ORDER BY monetary_usd ASC) AS m_score
    FROM customer_rfm_raw
),
rfm_scored AS (
    SELECT 
        customer_id,
        full_name,
        recency_days,
        frequency_orders,
        monetary_usd,
        r_score,
        f_score,
        m_score,
        (r_score + f_score + m_score) AS total_rfm_score
    FROM rfm_ranked
)
SELECT 
    CASE 
        WHEN total_rfm_score >= 13 THEN 'Champions'
        WHEN total_rfm_score >= 10 THEN 'Loyal Customers'
        WHEN total_rfm_score >= 8 THEN 'Potential Loyalists'
        WHEN total_rfm_score >= 6 THEN 'At Risk'
        ELSE 'Hibernating / Lost'
    END AS customer_segment,
    COUNT(*) AS total_customers,
    ROUND(SUM(monetary_usd), 2) AS total_segment_revenue,
    ROUND(AVG(monetary_usd), 2) AS avg_segment_revenue,
    ROUND(AVG(recency_days), 1) AS avg_recency_days,
    ROUND(AVG(frequency_orders), 1) AS avg_frequency_orders
FROM rfm_scored
GROUP BY customer_segment
ORDER BY total_segment_revenue DESC;
