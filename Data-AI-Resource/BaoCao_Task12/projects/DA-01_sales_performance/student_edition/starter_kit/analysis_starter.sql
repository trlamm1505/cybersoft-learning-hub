-- ====================================================================
-- CYBERSOFT MART — CAPSTONE DA-01 SQL STARTER SCRIPT
-- Bài tập lớn: Phân tích Hiệu suất Kinh doanh & Giữ chân Khách hàng
-- Người thực hiện: [Điền Họ và Tên Học Viên]
-- Ngày nộp: [YYYY-MM-DD]
-- Cơ sở dữ liệu: SQLite / PostgreSQL / MySQL
-- ====================================================================

-- --------------------------------------------------------------------
-- NHIỆM VỤ 01 & 02: LÀM SẠCH VÀ CHUẨN HÓA DỮ LIỆU ĐƠN HÀNG
-- Yêu cầu: Khử 2 dòng trùng lặp, điền 'completed' cho 5 đơn null
-- --------------------------------------------------------------------

-- Tạo bảng tạm orders_clean chứa dữ liệu đã chuẩn hóa
DROP TABLE IF EXISTS orders_clean;
CREATE TEMP TABLE orders_clean AS
WITH deduplicated AS (
    SELECT 
        order_id,
        customer_id,
        order_date,
        -- Điền giá trị mặc định 'completed' nếu trạng thái bị NULL hoặc rỗng
        COALESCE(NULLIF(order_status, ''), 'completed') AS order_status,
        total_amount,
        payment_method,
        shipping_fee,
        ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY order_date ASC) AS rn
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
FROM deduplicated
WHERE rn = 1;

-- Kiểm tra số lượng dòng sau làm sạch (Kỳ vọng: Đúng 400 dòng duy nhất)
SELECT COUNT(*) AS total_clean_orders FROM orders_clean;


-- --------------------------------------------------------------------
-- NHIỆM VỤ 04: BỘ CHỈ SỐ TÀI CHÍNH CỐT LÕI (CORE KPIS)
-- Yêu cầu: Tính Net Revenue, AOV, Gross Profit và Gross Margin %
-- Lưu ý: Chỉ tính trên các đơn hàng có trạng thái 'completed'
-- --------------------------------------------------------------------

-- 1. Tính Doanh thu thực nhận (Net Revenue) và AOV
SELECT 
    COUNT(*) AS completed_orders_count,
    ROUND(SUM(total_amount), 2) AS net_revenue_usd,
    ROUND(AVG(total_amount), 2) AS average_order_value_usd
FROM orders_clean
WHERE order_status = 'completed';

-- 2. Tính Lợi nhuận gộp (Gross Profit) và Biên lợi nhuận gộp (Gross Margin %)
-- Gợi ý: Join bảng order_items với orders_clean và products
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]


-- --------------------------------------------------------------------
-- NHIỆM VỤ 05: PHÂN TÍCH XU HƯỚNG THEO THÁNG VÀ TĂNG TRƯỞNG MOM %
-- --------------------------------------------------------------------
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]


-- --------------------------------------------------------------------
-- NHIỆM VỤ 06: TOP 10 SẢN PHẨM & CƠ CẤU DANH MỤC PARETO 80/20
-- --------------------------------------------------------------------
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]


-- --------------------------------------------------------------------
-- NHIỆM VỤ 07: PHÂN TÍCH ĐỊA LÝ & THỊ TRƯỜNG TRỌNG ĐIỂM
-- --------------------------------------------------------------------
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]


-- --------------------------------------------------------------------
-- NHIỆM VỤ 08: KIỂM TOÁN TỶ LỆ HỦY & HOÀN THEO PHƯƠNG THỨC THANH TOÁN
-- --------------------------------------------------------------------
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]


-- --------------------------------------------------------------------
-- NHIỆM VỤ 09: MÔ HÌNH PHÂN KHÚC KHÁCH HÀNG RFM (EXTENSION)
-- Yêu cầu: Tính Recency, Frequency, Monetary; chia 5 phân khúc
-- --------------------------------------------------------------------
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]


-- --------------------------------------------------------------------
-- NHIỆM VỤ 10: PHÂN TÍCH COHORT RETENTION THEO THÁNG GIA NHẬP (EXTENSION)
-- --------------------------------------------------------------------
-- [HỌC VIÊN VIẾT CÂU LỆNH TẠI ĐÂY]
