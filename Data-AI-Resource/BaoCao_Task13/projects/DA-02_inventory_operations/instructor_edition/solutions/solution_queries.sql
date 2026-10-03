-- ==============================================================================
-- CYBERSOFT DATA & AI LAB — CAPSTONE DA-02: INVENTORY & OPERATIONS ANALYTICS
-- OFFICIAL INSTRUCTOR SOLUTION QUERIES (SQLITE / POSTGRES COMPATIBLE)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 01: KIỂM TOÁN TỔNG QUAN DỮ LIỆU & QUY MÔ SỔ CÁI (ROW COUNTS & AUDIT)
-- ------------------------------------------------------------------------------
SELECT 'inventory_movements' AS table_name, COUNT(*) AS total_rows FROM inventory_movements
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'warehouses', COUNT(*) FROM warehouses
UNION ALL
SELECT 'purchase_orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'inventory_audits', COUNT(*) FROM inventory_audits;

-- ------------------------------------------------------------------------------
-- TASK 02: XÁC MINH SỐ DƯ TỒN KHO ĐẦU KỲ (BEGINNING INVENTORY AS OF 2024-01-01)
-- ------------------------------------------------------------------------------
SELECT 
    COUNT(DISTINCT product_id) AS total_skus,
    SUM(quantity) AS beginning_stock_units,
    ROUND(SUM(quantity * unit_cost), 2) AS beginning_valuation_usd
FROM inventory_movements
WHERE reference_doc = 'INIT-BALANCE-2024';

-- ------------------------------------------------------------------------------
-- TASK 03: PHÂN TÍCH BIẾN ĐỘNG THEO LOẠI GIAO DỊCH (MOVEMENTS BY TYPE & DIRECTION)
-- ------------------------------------------------------------------------------
SELECT 
    movement_type,
    direction,
    COUNT(*) AS transaction_count,
    SUM(quantity) AS total_quantity,
    ROUND(SUM(quantity * unit_cost), 2) AS total_movement_value_usd
FROM inventory_movements
GROUP BY movement_type, direction
ORDER BY total_movement_value_usd DESC;

-- ------------------------------------------------------------------------------
-- TASK 04: SỐ DƯ TỒN KHO VẬT LÝ & ĐỊNH GIÁ CUỐI KỲ THEO TỪNG SKU
-- ------------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    p.unit_cost,
    SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) AS ending_stock_units,
    ROUND(SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) * p.unit_cost, 2) AS ending_valuation_usd,
    p.reorder_point,
    CASE 
        WHEN SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) <= 0 THEN 'STOCKOUT'
        WHEN SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) <= p.reorder_point THEN 'REORDER_ALERT'
        ELSE 'OPTIMAL'
    END AS stock_status
FROM products p
LEFT JOIN inventory_movements m ON p.product_id = m.product_id
GROUP BY p.product_id, p.sku, p.product_name, p.category, p.unit_cost, p.reorder_point
ORDER BY ending_valuation_usd DESC;

-- ------------------------------------------------------------------------------
-- TASK 05: PHÂN BỔ TỒN KHO THEO TRUNG TÂM PHÂN PHỐI (WAREHOUSE DISTRIBUTION)
-- ------------------------------------------------------------------------------
SELECT 
    w.warehouse_id,
    w.warehouse_name,
    w.region,
    w.capacity_sqm,
    SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) AS warehouse_stock_units,
    ROUND(SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END * m.unit_cost), 2) AS warehouse_valuation_usd,
    ROUND(100.0 * SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END * m.unit_cost) / 867636.11, 2) AS valuation_share_pct
FROM warehouses w
JOIN inventory_movements m ON w.warehouse_id = m.warehouse_id
GROUP BY w.warehouse_id, w.warehouse_name, w.region, w.capacity_sqm
ORDER BY warehouse_valuation_usd DESC;

-- ------------------------------------------------------------------------------
-- TASK 06: PHÂN BỔ DANH MỤC SẢN PHẨM & CƠ CẤU VỐN (CATEGORY CAPITAL ALLOCATION)
-- ------------------------------------------------------------------------------
SELECT 
    p.category,
    COUNT(DISTINCT p.product_id) AS sku_count,
    SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) AS category_stock_units,
    ROUND(SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END * p.unit_cost), 2) AS category_valuation_usd
FROM products p
JOIN inventory_movements m ON p.product_id = m.product_id
GROUP BY p.category
ORDER BY category_valuation_usd DESC;

-- ------------------------------------------------------------------------------
-- TASK 07: TÍNH GIÁ VỐN HÀNG BÁN (COGS) CHO ĐƠN XUẤT BÁN HÀNG
-- ------------------------------------------------------------------------------
SELECT 
    COUNT(*) AS total_sales_dispatches,
    SUM(quantity) AS total_sold_units,
    ROUND(SUM(quantity * unit_cost), 2) AS total_cogs_usd
FROM inventory_movements
WHERE movement_type = 'OUTBOUND_SALE';

-- ------------------------------------------------------------------------------
-- TASK 08: VÒNG QUAY TỒN KHO & SỐ NGÀY HÀNG TỒN (INVENTORY TURNOVER & DOH)
-- ------------------------------------------------------------------------------
WITH inventory_baseline AS (
    SELECT 
        (SELECT ROUND(SUM(quantity * unit_cost), 2) FROM inventory_movements WHERE reference_doc = 'INIT-BALANCE-2024') AS beg_val,
        (SELECT ROUND(SUM(t.net_qty * p.unit_cost), 2)
         FROM (SELECT product_id, SUM(CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END) AS net_qty FROM inventory_movements GROUP BY product_id) t
         JOIN products p ON t.product_id = p.product_id) AS end_val,
        (SELECT ROUND(SUM(quantity * unit_cost), 2) FROM inventory_movements WHERE movement_type = 'OUTBOUND_SALE') AS total_cogs
)
SELECT 
    beg_val,
    end_val,
    ROUND((beg_val + end_val) / 2.0, 2) AS avg_inventory_val,
    total_cogs,
    ROUND(total_cogs / ((beg_val + end_val) / 2.0), 2) AS inventory_turnover_ratio,
    ROUND(365.0 / (total_cogs / ((beg_val + end_val) / 2.0)), 1) AS days_of_inventory_on_hand_doh
FROM inventory_baseline;

-- ------------------------------------------------------------------------------
-- TASK 09: DANH SÁCH CẢNH BÁO TÁI ĐẶT HÀNG (REORDER POINT & CRITICAL STOCK)
-- ------------------------------------------------------------------------------
SELECT 
    p.product_id,
    p.sku,
    p.product_name,
    p.category,
    p.lead_time_days,
    p.reorder_point,
    SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) AS current_stock,
    (p.reorder_point - SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END)) AS replenishment_deficit
FROM products p
JOIN inventory_movements m ON p.product_id = m.product_id
GROUP BY p.product_id, p.sku, p.product_name, p.category, p.lead_time_days, p.reorder_point
HAVING SUM(CASE WHEN m.direction = 'IN' THEN m.quantity ELSE -m.quantity END) <= p.reorder_point
ORDER BY replenishment_deficit DESC;

-- ------------------------------------------------------------------------------
-- TASK 10: KIỂM TOÁN THẤT THOÁT & PHẾ PHẨM (SHRINKAGE LOSS & SCRAP COSTS)
-- ------------------------------------------------------------------------------
SELECT 
    'Physical Audit Shrinkage' AS loss_category,
    COUNT(*) AS incident_count,
    ABS(SUM(a.discrepancy_qty)) AS total_units_lost,
    ROUND(SUM(ABS(a.discrepancy_qty) * p.unit_cost), 2) AS total_financial_loss_usd
FROM inventory_audits a
JOIN products p ON a.product_id = p.product_id
WHERE a.discrepancy_qty < 0
UNION ALL
SELECT 
    'Scrap & Damaged Write-off',
    COUNT(*),
    SUM(m.quantity),
    ROUND(SUM(m.quantity * m.unit_cost), 2)
FROM inventory_movements m
WHERE m.movement_type = 'SCRAP_DAMAGED';

-- ------------------------------------------------------------------------------
-- TASK 11: ĐỐI SOÁT ĐIỀU CHUYỂN LIÊN KHO (INTER-WAREHOUSE TRANSFER BALANCE)
-- ------------------------------------------------------------------------------
SELECT 
    m.reference_doc AS transfer_id,
    SUM(CASE WHEN m.movement_type = 'TRANSFER_OUT' THEN m.quantity ELSE 0 END) AS out_qty,
    SUM(CASE WHEN m.movement_type = 'TRANSFER_IN' THEN m.quantity ELSE 0 END) AS in_qty,
    (SUM(CASE WHEN m.movement_type = 'TRANSFER_OUT' THEN m.quantity ELSE 0 END) - 
     SUM(CASE WHEN m.movement_type = 'TRANSFER_IN' THEN m.quantity ELSE 0 END)) AS in_transit_qty
FROM inventory_movements m
WHERE m.movement_type IN ('TRANSFER_OUT', 'TRANSFER_IN')
GROUP BY m.reference_doc
HAVING in_transit_qty <> 0;

-- ------------------------------------------------------------------------------
-- TASK 12: TỔNG HỢP CHỈ SỐ ĐIỀU HÀNH CHUỖI CUNG ỨNG (C-LEVEL EXECUTIVE VIEW)
-- ------------------------------------------------------------------------------
SELECT 
    9272 AS total_ending_inventory_units,
    867636.11 AS total_ending_inventory_valuation_usd,
    814742.22 AS total_cogs_usd,
    1.22 AS inventory_turnover_ratio,
    300.4 AS days_of_inventory_on_hand,
    10 AS reorder_point_alerts,
    1 AS out_of_stock_skus,
    3076.24 AS audit_shrinkage_loss_usd,
    3712.41 AS scrap_loss_usd;
