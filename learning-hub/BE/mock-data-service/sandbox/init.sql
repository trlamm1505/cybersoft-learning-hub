-- Sandbox DB mô phỏng do TTS 01 cấp phát cho lab SQL (sales_v1 thu nhỏ, dữ liệu tổng hợp).
-- Chạy tự động khi container Postgres khởi tạo lần đầu (docker-entrypoint-initdb.d).
-- Tạo bởi script sinh dữ liệu, total_amount = tổng line_total của đơn.

CREATE TABLE customers (
  customer_id VARCHAR(10) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  city VARCHAR(50) NOT NULL,
  customer_segment VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL
);
CREATE TABLE employees (
  employee_id VARCHAR(10) PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  position VARCHAR(50) NOT NULL,
  hire_date DATE NOT NULL,
  region VARCHAR(30) NOT NULL
);
CREATE TABLE products (
  product_id VARCHAR(10) PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL,
  selling_price NUMERIC(12,2) NOT NULL,
  stock_quantity INT NOT NULL,
  status VARCHAR(20) NOT NULL
);
CREATE TABLE orders (
  order_id VARCHAR(10) PRIMARY KEY,
  customer_id VARCHAR(10) NOT NULL REFERENCES customers(customer_id),
  employee_id VARCHAR(10) NOT NULL REFERENCES employees(employee_id),
  order_date DATE NOT NULL,
  shipping_date DATE,
  order_status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL
);
CREATE TABLE order_details (
  order_detail_id VARCHAR(12) PRIMARY KEY,
  order_id VARCHAR(10) NOT NULL REFERENCES orders(order_id),
  product_id VARCHAR(10) NOT NULL REFERENCES products(product_id),
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  discount NUMERIC(4,2) NOT NULL,
  line_total NUMERIC(14,2) NOT NULL
);

INSERT INTO customers VALUES
  ('CUST_001', 'Nguyễn Minh Anh', 'minh.anh@example.com', '0901000001', 'Hà Nội', 'VIP', '2024-01-15 09:00:00'),
  ('CUST_002', 'Trần Quốc Bảo', 'quoc.bao@example.com', '0901000002', 'TP.HCM', 'Retail', '2024-02-20 10:30:00'),
  ('CUST_003', 'Lê Thu Cúc', 'thu.cuc@example.com', '0901000003', 'Đà Nẵng', 'Wholesale', '2024-03-05 14:00:00'),
  ('CUST_004', 'Phạm Đức Dũng', 'duc.dung@example.com', '0901000004', 'TP.HCM', 'VIP', '2024-03-18 08:15:00'),
  ('CUST_005', 'Hoàng Gia Hân', 'gia.han@example.com', '0901000005', 'Hà Nội', 'Retail', '2024-04-02 16:45:00'),
  ('CUST_006', 'Võ Thanh Khoa', 'thanh.khoa@example.com', '0901000006', 'Cần Thơ', 'Retail', '2024-05-11 11:20:00'),
  ('CUST_007', 'Đặng Mỹ Linh', 'my.linh@example.com', '0901000007', 'Hải Phòng', 'Wholesale', '2024-06-23 13:10:00'),
  ('CUST_008', 'Bùi Hoàng Nam', 'hoang.nam@example.com', '0901000008', 'TP.HCM', 'Retail', '2024-07-30 09:40:00'),
  ('CUST_009', 'Ngô Phương Oanh', 'phuong.oanh@example.com', '0901000009', 'Đà Nẵng', 'VIP', '2024-08-14 15:25:00'),
  ('CUST_010', 'Đỗ Minh Quân', 'minh.quan@example.com', '0901000010', 'Hà Nội', 'Retail', '2024-09-01 10:00:00');

INSERT INTO employees VALUES
  ('EMP_01', 'Trịnh Văn Long', 'Sales Department', 'Sales Executive', '2022-03-01', 'Miền Bắc'),
  ('EMP_02', 'Lý Thị Mai', 'Sales Department', 'Key Account Manager', '2021-07-15', 'Miền Nam'),
  ('EMP_03', 'Phan Văn Nghĩa', 'Sales Department', 'Sales Executive', '2023-01-10', 'Miền Trung'),
  ('EMP_04', 'Dương Thị Phượng', 'Sales Department', 'Sales Executive', '2023-05-20', 'Miền Nam'),
  ('EMP_05', 'Cao Minh Tuấn', 'Sales Department', 'Sales Manager', '2020-11-02', 'Miền Bắc');

INSERT INTO products VALUES
  ('PROD_01', 'Laptop Dell XPS 13', 'Electronics', 22000000, 27500000, 15, 'Active'),
  ('PROD_02', 'Tai nghe Sony WH-1000XM5', 'Electronics', 6000000, 7990000, 40, 'Active'),
  ('PROD_03', 'Điện thoại iPhone 15', 'Electronics', 19000000, 22990000, 25, 'Active'),
  ('PROD_04', 'Áo khoác gió Uniqlo', 'Fashion', 450000, 790000, 120, 'Active'),
  ('PROD_05', 'Giày chạy bộ Nike', 'Fashion', 1800000, 2590000, 60, 'Active'),
  ('PROD_06', 'Nồi chiên không dầu Philips', 'Home', 2100000, 3290000, 35, 'Active'),
  ('PROD_07', 'Sách Data Analysis 101', 'Books', 120000, 250000, 200, 'Active'),
  ('PROD_08', 'Máy lọc không khí Xiaomi', 'Home', 2500000, 3490000, 0, 'Discontinued');

INSERT INTO orders VALUES
  ('ORD_001', 'CUST_001', 'EMP_01', '2025-01-12', '2025-01-14', 'Completed', 'Credit Card', 26625000.0),
  ('ORD_002', 'CUST_002', 'EMP_02', '2025-02-03', '2025-02-05', 'Completed', 'Bank Transfer', 4701000.0),
  ('ORD_003', 'CUST_003', 'EMP_03', '2025-03-21', '2025-03-24', 'Completed', 'Bank Transfer', 13844000.0),
  ('ORD_004', 'CUST_004', 'EMP_02', '2025-04-09', '2025-04-10', 'Completed', 'Credit Card', 51671000.0),
  ('ORD_005', 'CUST_005', 'EMP_05', '2025-05-17', NULL, 'Cancelled', 'COD', 5180000),
  ('ORD_006', 'CUST_006', 'EMP_04', '2025-06-02', '2025-06-06', 'Completed', 'COD', 1830000),
  ('ORD_007', 'CUST_001', 'EMP_01', '2025-07-25', '2025-07-27', 'Completed', 'Credit Card', 14382000.0),
  ('ORD_008', 'CUST_007', 'EMP_05', '2025-08-14', '2025-08-18', 'Completed', 'Bank Transfer', 23099000.0),
  ('ORD_009', 'CUST_008', 'EMP_04', '2025-09-30', '2025-10-02', 'Cancelled', 'E-Wallet', 22990000),
  ('ORD_010', 'CUST_009', 'EMP_03', '2025-10-11', '2025-10-13', 'Completed', 'Credit Card', 33715500.0),
  ('ORD_011', 'CUST_004', 'EMP_02', '2025-11-20', '2025-11-21', 'Completed', 'Credit Card', 26125000.0),
  ('ORD_012', 'CUST_002', 'EMP_04', '2025-12-05', '2025-12-08', 'Completed', 'E-Wallet', 3340000),
  ('ORD_013', 'CUST_010', 'EMP_01', '2026-01-18', NULL, 'Pending', 'COD', 3290000),
  ('ORD_014', 'CUST_009', 'EMP_03', '2026-02-22', '2026-02-24', 'Completed', 'Bank Transfer', 23420500.0),
  ('ORD_015', 'CUST_005', 'EMP_05', '2026-03-10', NULL, 'Pending', 'E-Wallet', 7990000);

INSERT INTO order_details VALUES
  ('DTL_0001', 'ORD_001', 'PROD_01', 1, 27500000, 0.05, 26125000.0),
  ('DTL_0002', 'ORD_001', 'PROD_07', 2, 250000, 0, 500000),
  ('DTL_0003', 'ORD_002', 'PROD_04', 3, 790000, 0, 2370000),
  ('DTL_0004', 'ORD_002', 'PROD_05', 1, 2590000, 0.1, 2331000.0),
  ('DTL_0005', 'ORD_003', 'PROD_06', 4, 3290000, 0.1, 11844000.0),
  ('DTL_0006', 'ORD_003', 'PROD_07', 10, 250000, 0.2, 2000000.0),
  ('DTL_0007', 'ORD_004', 'PROD_03', 2, 22990000, 0.05, 43681000.0),
  ('DTL_0008', 'ORD_004', 'PROD_02', 1, 7990000, 0, 7990000),
  ('DTL_0009', 'ORD_005', 'PROD_05', 2, 2590000, 0, 5180000),
  ('DTL_0010', 'ORD_006', 'PROD_04', 2, 790000, 0, 1580000),
  ('DTL_0011', 'ORD_006', 'PROD_07', 1, 250000, 0, 250000),
  ('DTL_0012', 'ORD_007', 'PROD_02', 2, 7990000, 0.1, 14382000.0),
  ('DTL_0013', 'ORD_008', 'PROD_06', 6, 3290000, 0.15, 16779000.0),
  ('DTL_0014', 'ORD_008', 'PROD_04', 10, 790000, 0.2, 6320000.0),
  ('DTL_0015', 'ORD_009', 'PROD_03', 1, 22990000, 0, 22990000),
  ('DTL_0016', 'ORD_010', 'PROD_01', 1, 27500000, 0.05, 26125000.0),
  ('DTL_0017', 'ORD_010', 'PROD_02', 1, 7990000, 0.05, 7590500.0),
  ('DTL_0018', 'ORD_011', 'PROD_01', 1, 27500000, 0.05, 26125000.0),
  ('DTL_0019', 'ORD_012', 'PROD_07', 3, 250000, 0, 750000),
  ('DTL_0020', 'ORD_012', 'PROD_05', 1, 2590000, 0, 2590000),
  ('DTL_0021', 'ORD_013', 'PROD_06', 1, 3290000, 0, 3290000),
  ('DTL_0022', 'ORD_014', 'PROD_03', 1, 22990000, 0.05, 21840500.0),
  ('DTL_0023', 'ORD_014', 'PROD_04', 2, 790000, 0, 1580000),
  ('DTL_0024', 'ORD_015', 'PROD_02', 1, 7990000, 0, 7990000);

-- Tài khoản chỉ đọc lab_reader (mật khẩu lấy từ biến môi trường LAB_READER_PASSWORD)
-- được tạo trong 02-lab-reader.sh, chạy ngay sau file này.
