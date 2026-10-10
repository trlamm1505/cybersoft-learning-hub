# TỪ ĐIỂN DỮ LIỆU — CYBERSOFT MART CAPSTONE (DA-01)

Dự án sử dụng 4 bảng dữ liệu quan hệ mô phỏng hệ thống vận hành thực tế năm 2024 của chuỗi bán lẻ CyberSoft Mart.

---

## 1. BẢNG `orders.csv` (Thông tin Đơn hàng)
* **Số dòng thô**: 402 dòng (Chứa 2 dòng trùng lặp khóa chính và 5 ô trống `order_status`).
* **Số dòng sau làm sạch kỳ vọng**: 400 dòng duy nhất.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ & Quy Chuẩn |
| :--- | :--- | :--- | :--- |
| `order_id` | String / INT | Primary Key | Mã định danh duy nhất của đơn hàng (VD: `ORD-1001`). |
| `customer_id` | String / INT | Foreign Key | Mã khách hàng thực hiện đơn (Liên kết với `customers.csv`). |
| `order_date` | Date / String | NOT NULL | Ngày đặt hàng theo định dạng chuẩn ISO `YYYY-MM-DD`. |
| `order_status` | String | Nullable | Trạng thái: `completed` (hoàn tất), `cancelled` (hủy), `returned` (hoàn trả). |
| `total_amount` | Float / Numeric | >= 0 | Tổng giá trị thanh toán của đơn hàng (đơn vị: USD). |
| `payment_method`| String | Enum | Phương thức thanh toán: `COD` (tiền mặt khi nhận), `Banking`, `Credit Card`. |
| `shipping_fee` | Float / Numeric | >= 0 | Phí vận chuyển của đơn hàng (USD). |

---

## 2. BẢNG `order_items.csv` (Chi tiết Mặt hàng trong Đơn)
* **Số dòng**: 997 dòng.
* **Mối quan hệ**: Nhiều - Một ($N:1$) với `orders.csv` và `products.csv`.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ & Quy Chuẩn |
| :--- | :--- | :--- | :--- |
| `item_id` | String / INT | Primary Key | Mã định danh duy nhất của dòng mặt hàng. |
| `order_id` | String / INT | Foreign Key | Mã đơn hàng chứa mặt hàng này. |
| `product_id` | String / INT | Foreign Key | Mã sản phẩm được mua (Liên kết với `products.csv`). |
| `quantity` | Integer | > 0 | Số lượng sản phẩm được đặt mua trong dòng này. |
| `unit_price` | Float / Numeric | > 0 | Đơn giá niêm yết tại thời điểm mua (USD). |
| `discount_amount`| Float / Numeric | >= 0 | Số tiền chiết khấu giảm trực tiếp trên mỗi đơn vị sản phẩm (USD). |

---

## 3. BẢNG `customers.csv` (Hồ sơ Khách hàng)
* **Số dòng**: 100 khách hàng.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ & Quy Chuẩn |
| :--- | :--- | :--- | :--- |
| `customer_id` | String / INT | Primary Key | Mã định danh duy nhất của khách hàng (VD: `CUST-001`). |
| `full_name` | String | NOT NULL | Họ và tên khách hàng. |
| `email` | String | Unique | Địa chỉ thư điện tử đã được ẩn danh hóa. |
| `city` | String | NOT NULL | Thành phố cư trú của khách hàng. |
| `registration_date`| Date / String | NOT NULL | Ngày đăng ký tài khoản thành viên (`YYYY-MM-DD`). |
| `customer_tier` | String | Enum | Phân hạng hội viên: `Standard`, `Silver`, `Gold`, `Platinum`. |

---

## 4. BẢNG `products.csv` (Danh mục Sản phẩm)
* **Số dòng**: 50 sản phẩm.

| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Ý Nghĩa Nghiệp Vụ & Quy Chuẩn |
| :--- | :--- | :--- | :--- |
| `product_id` | String / INT | Primary Key | Mã định danh duy nhất của sản phẩm (VD: `PROD-01`). |
| `product_name` | String | NOT NULL | Tên thương mại của sản phẩm. |
| `category` | String | Enum | Ngành hàng: `Electronics`, `Smart Home`, `Audio`, `Accessories`, `Wearables`. |
| `cost_price` | Float / Numeric | > 0 | Giá vốn nhập kho bình quân của sản phẩm (USD). |
| `list_price` | Float / Numeric | > cost_price | Giá bán lẻ niêm yết chính thức (USD). |

---

## 5. SƠ ĐỒ MỐI QUAN HỆ THỰC THỂ (ERD / STAR SCHEMA)
```text
      [customers] (1) ────┐
                          ▼
                       [orders] (1) ────┐
                                        ▼
      [products]  (1) ───────────► [order_items] (N)
```
* **Bảng Fact**: `order_items` lưu trữ sự kiện giao dịch chi tiết (Transaction Fact).
* **Bảng Dimensions**: `orders` (Header Dimension), `customers` (Customer Dimension), `products` (Product Dimension).
