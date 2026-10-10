-- ==============================================================================
-- CYBERSOFT DATA & AI LAB — CAPSTONE DA-02: STARTER SQL SCRIPT
-- NAME: [Họ và tên học viên]
-- CLASS / BATCH: [Khóa học]
-- DATE: [Ngày thực hiện]
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- TASK 01: KIỂM TOÁN TỔNG QUAN DỮ LIỆU & QUY MÔ SỔ CÁI
-- Hướng dẫn: Đếm số dòng của từng bảng để xác nhận việc nạp dữ liệu đầy đủ.
-- ------------------------------------------------------------------------------
-- TODO: Viết câu lệnh đếm số dòng cho cả 6 bảng dữ liệu.



-- ------------------------------------------------------------------------------
-- TASK 02: XÁC MINH SỐ DƯ TỒN KHO ĐẦU KỲ (2024-01-01)
-- Hướng dẫn: Lọc các bản ghi có reference_doc = 'INIT-BALANCE-2024'.
-- ------------------------------------------------------------------------------
-- TODO: Tính tổng số lượng và giá trị số dư đầu kỳ.



-- ------------------------------------------------------------------------------
-- TASK 03: PHÂN TÍCH BIẾN ĐỘNG THEO LOẠI GIAO DỊCH
-- Hướng dẫn: Nhóm theo movement_type và direction, tính tổng số lượng và giá trị.
-- ------------------------------------------------------------------------------
-- TODO: Viết truy vấn phân tích luồng biến động.



-- ------------------------------------------------------------------------------
-- TASK 04: SỐ DƯ TỒN KHO VẬT LÝ & ĐỊNH GIÁ CUỐI KỲ THEO TỪNG SKU
-- Hướng dẫn: Dùng CASE WHEN direction = 'IN' THEN quantity ELSE -quantity END.
-- Ghép với bảng products để tính định giá tồn kho cuối kỳ.
-- ------------------------------------------------------------------------------
-- TODO: Tính tồn cuối kỳ và giá trị tồn kho của từng SKU.



-- ------------------------------------------------------------------------------
-- TASK 05: PHÂN BỔ TỒN KHO THEO TRUNG TÂM PHÂN PHỐI (WAREHOUSES)
-- Hướng dẫn: Nhóm theo warehouse_id và tính tỷ trọng giá trị tồn kho.
-- ------------------------------------------------------------------------------
-- TODO: Viết truy vấn phân bổ tồn kho giữa HN, DN, HCM.



-- ------------------------------------------------------------------------------
-- TASK 06: PHÂN BỔ DANH MỤC SẢN PHẨM & CƠ CẤU VỐN
-- Hướng dẫn: Nhóm theo category và tính tỷ trọng vốn tồn kho.
-- ------------------------------------------------------------------------------
-- TODO: Phân tích cơ cấu vốn theo 5 ngành hàng.



-- ------------------------------------------------------------------------------
-- TASK 07: TÍNH GIÁ VỐN HÀNG BÁN (COGS) CHO CÁC ĐƠN XUẤT BÁN
-- Hướng dẫn: Lọc movement_type = 'OUTBOUND_SALE'.
-- ------------------------------------------------------------------------------
-- TODO: Tính tổng COGS năm 2024.



-- ------------------------------------------------------------------------------
-- TASK 08: VÒNG QUAY TỒN KHO & SỐ NGÀY HÀNG TỒN (INVENTORY TURNOVER & DOH)
-- Hướng dẫn: Áp dụng công thức COGS / Average_Inventory.
-- ------------------------------------------------------------------------------
-- TODO: Viết CTE hoặc Subquery tính Inventory Turnover và DOH.



-- ------------------------------------------------------------------------------
-- TASK 09: DANH SÁCH CẢNH BÁO TÁI ĐẶT HÀNG (REORDER POINT ALERTS)
-- Hướng dẫn: Lọc các SKU có ending_stock <= reorder_point.
-- ------------------------------------------------------------------------------
-- TODO: Liệt kê các SKU cần đặt hàng khẩn cấp.



-- ------------------------------------------------------------------------------
-- TASK 10: KIỂM TOÁN THẤT THOÁT & PHẾ PHẨM (SHRINKAGE & SCRAP LOSS)
-- Hướng dẫn: Tổng hợp tổn thất từ inventory_audits và các dòng SCRAP_DAMAGED.
-- ------------------------------------------------------------------------------
-- TODO: Tính chi phí hao hụt và phế phẩm.



-- ------------------------------------------------------------------------------
-- TASK 11: ĐỐI SOÁT ĐIỀU CHUYỂN LIÊN KHO (INTER-WAREHOUSE TRANSFERS)
-- Hướng dẫn: Đối soát giữa TRANSFER_OUT và TRANSFER_IN theo reference_doc.
-- ------------------------------------------------------------------------------
-- TODO: Tìm các lô hàng đang đi đường chưa có phiếu nhập.



-- ------------------------------------------------------------------------------
-- TASK 12: TỔNG HỢP CHỈ SỐ ĐIỀU HÀNH CHUỖI CUNG ỨNG (EXECUTIVE VIEW)
-- Hướng dẫn: Xuất 1 hàng kết quả chứa các chỉ số KPI điều hành chủ chốt.
-- ------------------------------------------------------------------------------
-- TODO: Tạo View hoặc câu lệnh SELECT tổng hợp toàn bộ các chỉ số KPI.
