-- CyberSoft Mart Sales Performance Official SQL Solutions

-- 1. Tìm bản ghi trùng lặp khóa chính:
SELECT order_id, COUNT(*) as count
FROM orders
GROUP BY order_id
HAVING COUNT(*) > 1;

-- 2. Tính toán Doanh thu thuần và AOV trên các đơn hoàn tất:
SELECT 
    COUNT(*) AS total_clean_orders,
    SUM(CASE WHEN order_status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
    SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    ROUND(SUM(CASE WHEN order_status = 'completed' THEN total_amount ELSE 0 END), 2) AS net_revenue_usd,
    ROUND(AVG(CASE WHEN order_status = 'completed' THEN total_amount ELSE NULL END), 2) AS aov_usd
FROM orders;

-- 3. Tỷ lệ hủy đơn hàng theo phương thức thanh toán:
SELECT 
    payment_method,
    COUNT(*) AS total_orders,
    SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    ROUND(SUM(CASE WHEN order_status = 'cancelled' THEN 1.0 ELSE 0.0 END) / COUNT(*) * 100, 2) AS cancel_rate_pct
FROM orders
GROUP BY payment_method
ORDER BY cancel_rate_pct DESC;

-- 4. Top 5 Khách hàng đóng góp doanh thu lớn nhất:
SELECT 
    c.customer_id,
    c.full_name,
    c.loyalty_tier,
    c.city,
    COUNT(o.order_id) AS total_orders,
    ROUND(SUM(o.total_amount), 2) AS total_spend_usd
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_status = 'completed'
GROUP BY c.customer_id, c.full_name, c.loyalty_tier, c.city
ORDER BY total_spend_usd DESC
LIMIT 5;
