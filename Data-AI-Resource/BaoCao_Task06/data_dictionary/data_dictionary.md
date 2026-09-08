# TỪ ĐIỂN DỮ LIỆU (DATA DICTIONARY) — DATASET BÁN HÀNG ĐA BẢNG (sales_v1)

**Dự án**: CyberSoft Data & AI Lab  
**Phiên bản**: v1.0 (Tuần 2 - Task 06)  
**Tác giả**: Đào Trung Kiên — Data & AI Resource Engineer  
**Mục đích**: Tài liệu hóa cấu trúc dữ liệu, kiểu dữ liệu, ràng buộc quan hệ và ý nghĩa nghiệp vụ của 5 bảng dữ liệu trong mô hình bán hàng đa bảng phục vụ thực hành cho học viên Data Analyst.

---

## 1. Sơ đồ Quan hệ Thực thể (Entity Relationship Diagram)

```text
[CUSTOMERS] 1 ----- <N> [ORDERS] <N> ----- 1 [EMPLOYEES]
                            | 1
                            |
                           <N>
                     [ORDER_DETAILS] <N> ----- 1 [PRODUCTS]
```

* **CUSTOMERS** (Khách hàng): Lưu trữ hồ sơ định danh, thông tin liên lạc, phân khúc và tỉnh thành.
* **EMPLOYEES** (Nhân viên kinh doanh): Lưu trữ thông tin nhân viên phụ trách bán hàng và địa bàn quản lý.
* **PRODUCTS** (Sản phẩm): Danh mục hàng hóa, giá vốn, giá niêm yết và số lượng tồn kho.
* **ORDERS** (Đơn hàng): Giao dịch bán hàng, liên kết khách hàng với nhân viên phụ trách, trạng thái xử lý và hình thức thanh toán.
* **ORDER_DETAILS** (Chi tiết đơn hàng): Dòng chi tiết sản phẩm mua, số lượng, chiết khấu và thành tiền.

---

## 2. Đặc tả Chi tiết từng Bảng Dữ liệu

### 2.1. Bảng `customers` (Khách hàng)
* **Tệp dữ liệu**: `customers.csv`
* **Số lượng bản ghi**: 200 bản ghi
* **Mô tả**: Dimension table lưu danh sách khách hàng tham gia mua sắm.

| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Miền giá trị / Định dạng | Diễn giải nghiệp vụ |
|---|---|---|---|---|---|
| `customer_id` | VARCHAR(10) | **PK** | Không | `CUST_00001` - `CUST_00200` | Mã định danh duy nhất của mỗi khách hàng. |
| `full_name` | VARCHAR(100) | Không | Không | Họ tên tiếng Việt có dấu | Tên đầy đủ của khách hàng (giả lập theo cơ cấu họ tên Việt Nam). |
| `email` | VARCHAR(150) | Không | Không | Regex `^.+@.+\..+$` | Địa chỉ thư điện tử để liên lạc và gửi thông báo đơn hàng. |
| `phone` | VARCHAR(15) | Không | Không | `09xxxxxxxx` (10 chữ số) | Số điện thoại di động sử dụng nhận hàng. |
| `city` | VARCHAR(50) | Không | Không | 10 thành phố chuẩn | Tỉnh/thành phố nơi khách hàng sinh sống (Hà Nội, TP.HCM, Đà Nẵng,...). |
| `customer_segment` | VARCHAR(20) | Không | Không | `Retail`, `Wholesale`, `VIP` | Phân khúc khách hàng (Bán lẻ: 65%, Bán buôn: 25%, Khách VIP: 10%). |
| `created_at` | DATETIME | Không | Không | `YYYY-MM-DD HH:MM:SS` | Thời điểm khách hàng đăng ký tài khoản trên hệ thống. |

---

### 2.2. Bảng `employees` (Nhân viên bán hàng)
* **Tệp dữ liệu**: `employees.csv`
* **Số lượng bản ghi**: 20 bản ghi
* **Mô tả**: Dimension table lưu danh sách nhân viên phụ trách tư vấn và chốt đơn hàng.

| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Miền giá trị / Định dạng | Diễn giải nghiệp vụ |
|---|---|---|---|---|---|
| `employee_id` | VARCHAR(10) | **PK** | Không | `EMP_001` - `EMP_020` | Mã định danh duy nhất của nhân viên kinh doanh. |
| `full_name` | VARCHAR(100) | Không | Không | Họ tên tiếng Việt | Tên đầy đủ của nhân viên bán hàng. |
| `department` | VARCHAR(50) | Không | Không | `Sales Department` | Phòng ban công tác. |
| `position` | VARCHAR(50) | Không | Không | `Sales Executive`, `Senior...`, `Key Account Manager` | Vị trí chức danh chuyên môn. |
| `hire_date` | DATE | Không | Không | `YYYY-MM-DD` | Ngày bắt đầu vào làm việc tại công ty. |
| `region` | VARCHAR(30) | Không | Không | `Miền Bắc`, `Miền Trung`, `Miền Nam` | Vùng thị trường nhân viên phụ trách quản lý. |

---

### 2.3. Bảng `products` (Danh mục Sản phẩm)
* **Tệp dữ liệu**: `products.csv`
* **Số lượng bản ghi**: 50 sản phẩm thuộc 5 ngành hàng
* **Mô tả**: Dimension table lưu trữ thông tin sản phẩm và chính sách giá.

| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Miền giá trị / Định dạng | Diễn giải nghiệp vụ |
|---|---|---|---|---|---|
| `product_id` | VARCHAR(10) | **PK** | Không | `PROD_0001` - `PROD_0050` | Mã số quản lý sản phẩm duy nhất. |
| `product_name` | VARCHAR(150) | Không | Không | Tên thiết bị/phụ kiện | Tên thương mại của sản phẩm. |
| `category` | VARCHAR(50) | Không | Không | `Electronics`, `Accessories`, `Office Supplies`, `Smart Home`, `Audio & Gadgets` | Phân nhóm ngành hàng sản phẩm. |
| `cost_price` | NUMERIC(12,2) | Không | Không | > 0 VNĐ | Giá vốn nhập kho của sản phẩm. |
| `selling_price` | NUMERIC(12,2) | Không | Không | > cost_price VNĐ | Giá bán niêm yết của sản phẩm tới khách hàng. |
| `stock_quantity` | INT | Không | Không | >= 0 | Số lượng sản phẩm còn tồn trong kho hàng. |
| `status` | VARCHAR(20) | Không | Không | `Active`, `Out of Stock` | Trạng thái kinh doanh hiện tại của mặt hàng. |

---

### 2.4. Bảng `orders` (Đơn hàng)
* **Tệp dữ liệu**: `orders.csv`
* **Số lượng bản ghi**: 1.000 đơn hàng
* **Mô tả**: Fact table cấp độ đơn hàng (Order header level).

| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Miền giá trị / Định dạng | Diễn giải nghiệp vụ |
|---|---|---|---|---|---|
| `order_id` | VARCHAR(10) | **PK** | Không | `ORD_00001` - `ORD_01000` | Mã số đơn hàng duy nhất. |
| `customer_id` | VARCHAR(10) | **FK** | Không | Tham chiếu `customers(customer_id)` | Khách hàng thực hiện đặt mua đơn hàng này. |
| `employee_id` | VARCHAR(10) | **FK** | Không | Tham chiếu `employees(employee_id)` | Nhân viên kinh doanh tư vấn/xử lý đơn hàng. |
| `order_date` | DATE | Không | Không | `YYYY-MM-DD` | Ngày khách hàng tiến hành chốt đặt đơn. |
| `shipping_date` | DATE | Không | Có | `YYYY-MM-DD` hoặc Rỗng | Ngày đơn hàng được chuyển đi giao (chỉ có khi Completed/Shipping). |
| `order_status` | VARCHAR(20) | Không | Không | `Completed`, `Pending`, `Shipping`, `Cancelled` | Tiến trình vòng đời của đơn hàng. |
| `payment_method` | VARCHAR(30) | Không | Không | `COD`, `Bank Transfer`, `Credit Card`, `E-Wallet` | Phương thức thanh toán được lựa chọn. |
| `total_amount` | NUMERIC(14,2) | Không | Không | >= 0 VNĐ | Tổng giá trị thanh toán của đơn hàng (bằng tổng `line_total` của các chi tiết đơn). |

---

### 2.5. Bảng `order_details` (Chi tiết Đơn hàng)
* **Tệp dữ liệu**: `order_details.csv`
* **Số lượng bản ghi**: 1.803 dòng chi tiết
* **Mô tả**: Fact table cấp độ chi tiết dòng hàng (Line item level).

| Tên cột | Kiểu dữ liệu | Khóa | Cho phép NULL | Miền giá trị / Định dạng | Diễn giải nghiệp vụ |
|---|---|---|---|---|---|
| `order_detail_id` | VARCHAR(12) | **PK** | Không | `DTL_000001` - `DTL_001803` | Mã dòng chi tiết đơn hàng duy nhất. |
| `order_id` | VARCHAR(10) | **FK** | Không | Tham chiếu `orders(order_id)` | Mã đơn hàng sở hữu dòng chi tiết này. |
| `product_id` | VARCHAR(10) | **FK** | Không | Tham chiếu `products(product_id)` | Mã sản phẩm được mua trong dòng này. |
| `quantity` | INT | Không | Không | >= 1 (thường từ 1 đến 5) | Số lượng sản phẩm khách đặt mua. |
| `unit_price` | NUMERIC(12,2) | Không | Không | > 0 VNĐ | Đơn giá bán tại thời điểm lập đơn. |
| `discount` | NUMERIC(4,2) | Không | Không | `0.00`, `0.05`, `0.10`, `0.15` | Tỷ lệ chiết khấu giảm giá (0% đến 15%). |
| `line_total` | NUMERIC(14,2) | Không | Không | >= 0 VNĐ | Thành tiền của dòng: `ROUND(quantity * unit_price * (1 - discount), 2)`. |

---

## 3. Ràng buộc Nghiệp vụ Cốt lõi (Business Rules & Invariants)

1. **Ràng buộc Toàn vẹn Thực thể (Entity Integrity)**:
   - Các trường khóa chính (`customer_id`, `product_id`, `employee_id`, `order_id`, `order_detail_id`) phải có giá trị và không được phép trùng lặp trong bản clean.
2. **Ràng buộc Toàn vẹn Tham chiếu (Referential Integrity)**:
   - Mọi `customer_id` trong `orders` phải tồn tại trong `customers`.
   - Mọi `employee_id` trong `orders` phải tồn tại trong `employees`.
   - Mọi `order_id` trong `order_details` phải tồn tại trong `orders`.
   - Mọi `product_id` trong `order_details` phải tồn tại trong `products`.
3. **Ràng buộc Tài chính (Financial Consistency)**:
   - `order_details.line_total = ROUND(quantity * unit_price * (1.0 - discount), 2)`.
   - `orders.total_amount = SUM(order_details.line_total) WHERE order_details.order_id = orders.order_id`.
4. **Ràng buộc Trình tự Thời gian (Temporal Consistency)**:
   - `shipping_date >= order_date`.
   - Nếu `order_status = 'Cancelled'`, `shipping_date` phải là `NULL`/Rỗng.
