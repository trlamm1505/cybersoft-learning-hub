# TỪ ĐIỂN DỮ LIỆU (DATA DICTIONARY) — CAPSTONE DA-02
## HỆ THỐNG CƠ SỞ DỮ LIỆU KHO VẬN CYBERSOFT LOGISTICS (6 TABLES)

---

### BẢNG 1: `warehouses.csv` (DANH MỤC TRUNG TÂM PHÂN PHỐI)
| Tên cột | Kiểu dữ liệu | Mô tả chi tiết | Ví dụ |
| :--- | :--- | :--- | :--- |
| `warehouse_id` | VARCHAR(10) | Khóa chính, mã định danh duy nhất của kho hàng | `WH-HN01`, `WH-HCM01` |
| `warehouse_name`| VARCHAR(100)| Tên đầy đủ của trung tâm phân phối | `Kho Trung Tam Ha Noi` |
| `region` | VARCHAR(20) | Vùng địa lý phụ trách (North, Central, South) | `North` |
| `capacity_sqm` | INTEGER | Diện tích mặt sàn kho bãi (m2) | `5000` |
| `manager_name` | VARCHAR(100)| Họ tên Giám đốc / Quản lý kho | `Nguyen Van Binh` |
| `status` | VARCHAR(20) | Trạng thái hoạt động (`ACTIVE`, `INACTIVE`) | `ACTIVE` |

---

### BẢNG 2: `products.csv` (DANH MỤC 50 MÃ SẢN PHẨM SKU)
| Tên cột | Kiểu dữ liệu | Mô tả chi tiết | Ví dụ |
| :--- | :--- | :--- | :--- |
| `product_id` | VARCHAR(10) | Khóa chính sản phẩm | `PROD-001` |
| `sku` | VARCHAR(20) | Mã định danh thương mại quốc tế của SKU | `SKU-ELEC-001` |
| `product_name` | VARCHAR(150)| Tên thương mại của sản phẩm | `CyberKey Pro Mechanical Keyboard`|
| `category` | VARCHAR(50) | Tên ngành hàng sản phẩm | `Electronics`, `Office Equipment`|
| `category_id` | VARCHAR(20) | Mã ngành hàng | `CAT-ELEC` |
| `unit_cost` | DECIMAL(10,2)| Giá vốn tiêu chuẩn nhập kho (USD) | `45.50` |
| `unit_price` | DECIMAL(10,2)| Giá niêm yết bán lẻ đề xuất (USD) | `79.90` |
| `lead_time_days`| INTEGER | Thời gian giao hàng tiêu chuẩn của NCC (ngày) | `7` |
| `min_safety_stock`| INTEGER | Mức tồn kho an toàn tối thiểu (units) | `30` |
| `reorder_point`| INTEGER | Điểm kích hoạt đặt hàng lại ROP (units) | `85` |

---

### BẢNG 3: `inventory_movements.csv` (SỔ CÁI BIẾN ĐỘNG KHO CHI TIẾT)
| Tên cột | Kiểu dữ liệu | Mô tả chi tiết | Ví dụ |
| :--- | :--- | :--- | :--- |
| `movement_id` | VARCHAR(15) | Khóa chính giao dịch kho | `MOV-00120` |
| `timestamp` | DATETIME | Thời điểm phát sinh giao dịch (YYYY-MM-DD HH:MM:SS) | `2024-03-15 14:20:00` |
| `warehouse_id` | VARCHAR(10) | Khóa ngoại tham chiếu `warehouses.warehouse_id` | `WH-HN01` |
| `product_id` | VARCHAR(10) | Khóa ngoại tham chiếu `products.product_id` | `PROD-001` |
| `movement_type` | VARCHAR(30) | Loại hình dịch chuyển nghiệp vụ | `INBOUND_PO`, `OUTBOUND_SALE`, `TRANSFER_IN`, `TRANSFER_OUT`, `RETURN_CUSTOMER`, `RETURN_VENDOR`, `SCRAP_DAMAGED`, `AUDIT_ADJUSTMENT` |
| `direction` | VARCHAR(5) | Chiều biến động kho (`IN`: Tăng kho, `OUT`: Giảm kho) | `IN` hoặc `OUT` |
| `quantity` | INTEGER | Số lượng sản phẩm phát sinh trong giao dịch | `15` |
| `unit_cost` | DECIMAL(10,2)| Giá vốn của lô hàng tại thời điểm giao dịch | `45.50` |
| `reference_doc`| VARCHAR(50) | Mã chứng từ liên kết gốc | `PO-2024-012`, `SO-54321`, `TRF-4521` |
| `notes` | TEXT | Ghi chú diễn giải nghiệp vụ của thủ kho | `Nhap hang theo don mua nha cung cap`|

---

### BẢNG 4: `purchase_orders.csv` (ĐƠN ĐẶT HÀNG NHÀ CUNG CẤP)
| Tên cột | Kiểu dữ liệu | Mô tả chi tiết | Ví dụ |
| :--- | :--- | :--- | :--- |
| `po_id` | VARCHAR(20) | Khóa chính đơn đặt hàng nhà cung cấp | `PO-2024-005` |
| `vendor_name` | VARCHAR(100)| Tên nhà cung cấp | `CyberTech Supply Co.` |
| `order_date` | DATE | Ngày phát hành đơn đặt hàng | `2024-02-01` |
| `expected_delivery_date` | DATE | Ngày dự kiến nhận hàng | `2024-02-08` |
| `actual_delivery_date` | DATE | Ngày thực tế nhận hàng tại kho | `2024-02-09` |
| `status` | VARCHAR(20) | Trạng thái đơn mua (`COMPLETED`, `PENDING`) | `COMPLETED` |
| `total_amount` | DECIMAL(12,2)| Tổng giá trị hợp đồng đơn mua hàng (USD) | `14500.00` |

---

### BẢNG 5: `sales_dispatches.csv` (NHẬT TRÌNH XUẤT GIAO HÀNG BÁN)
| Tên cột | Kiểu dữ liệu | Mô tả chi tiết | Ví dụ |
| :--- | :--- | :--- | :--- |
| `dispatch_id` | VARCHAR(15) | Khóa chính phiếu xuất kho giao hàng | `DSP-00045` |
| `order_id` | VARCHAR(20) | Mã đơn hàng bán lẻ | `SO-12845` |
| `warehouse_id` | VARCHAR(10) | Kho thực hiện đóng gói và xuất giao | `WH-HCM01` |
| `dispatch_date`| DATE | Ngày xuất kho | `2024-04-12` |
| `delivery_status`| VARCHAR(20)| Trạng thái giao hàng (`DELIVERED`, `RETURNED`) | `DELIVERED` |
| `shipping_carrier`| VARCHAR(50)| Đơn vị vận chuyển liên kết | `CyberExpress`, `VNPost Logistics` |
| `lead_time_hours`| INTEGER | Thời gian hoàn tất giao vận (giờ) | `24` |

---

### BẢNG 6: `inventory_audits.csv` (BIÊN BẢN KIỂM KÊ THỰC TẾ 4 QUÝ)
| Tên cột | Kiểu dữ liệu | Mô tả chi tiết | Ví dụ |
| :--- | :--- | :--- | :--- |
| `audit_id` | VARCHAR(15) | Khóa chính đợt kiểm kê | `AUD-0012` |
| `audit_date` | DATE | Ngày thực hiện chốt sổ kiểm kê thực tế | `2024-03-31` |
| `warehouse_id` | VARCHAR(10) | Kho được kiểm tra | `WH-DN01` |
| `product_id` | VARCHAR(10) | Sản phẩm được chọn mẫu kiểm kê | `PROD-015` |
| `book_quantity`| INTEGER | Số lượng tồn trên sổ cái kế toán tại ngày kiểm kê | `85` |
| `physical_quantity`| INTEGER| Số lượng thực tế đếm được trong kho | `83` |
| `discrepancy_qty`| INTEGER | Chênh lệch (`physical_quantity - book_quantity`) | `-2` |
| `reason_code` | VARCHAR(30) | Phân loại nguyên nhân (`PILFERAGE`, `SCAN_CORRECTION`, `NORMAL_VARIANCE`) | `PILFERAGE` |
