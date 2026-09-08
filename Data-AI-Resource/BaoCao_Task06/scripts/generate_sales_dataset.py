"""
Script sinh tự động bộ dữ liệu bán hàng đa bảng (sales_v1)
CyberSoft Data & AI Lab - Tuần 2: Tạo tài nguyên dữ liệu (Task 06)
Tác giả: Đào Trung Kiên - Data & AI Resource Engineer

Tạo 5 bảng quan hệ (Star/Relational Schema):
1. customers (Khách hàng)
2. products (Sản phẩm)
3. employees (Nhân viên kinh doanh)
4. orders (Đơn hàng)
5. order_details (Chi tiết đơn hàng)

Bao gồm:
- Bản CLEAN: Toàn vẹn tham chiếu 100%, không PII thật, tính toán dòng tiền chuẩn xác.
- Bản DIRTY: Cài cắm chủ ý 10 loại lỗi dữ liệu thực tế kèm Ground Truth đối chứng.
"""

import os
import sys
import csv
import json
import random
from datetime import datetime, timedelta

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Cố định seed ngẫu nhiên để dữ liệu hoàn toàn tái lập (deterministic & reproducible)
SEED_VAL = 42
random.seed(SEED_VAL)

# Số lượng bản ghi tiêu chuẩn
NUM_CUSTOMERS = 200
NUM_PRODUCTS = 50
NUM_EMPLOYEES = 20
NUM_ORDERS = 1000

# Dữ liệu từ điển mẫu (Synthetic Reference Data)
HO_LIST = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Huỳnh",
    "Phan",
    "Vũ",
    "Võ",
    "Đặng",
    "Bùi",
    "Đỗ",
    "Hồ",
    "Ngô",
    "Dương",
]
DEM_NAM = [
    "Văn",
    "Đức",
    "Hữu",
    "Thành",
    "Minh",
    "Quốc",
    "Gia",
    "Tuấn",
    "Hoàng",
    "Quang",
]
DEM_NU = ["Thị", "Ngọc", "Thu", "Mai", "Phương", "Khánh", "Hải", "Thanh", "Mỹ", "Ánh"]
TEN_NAM = [
    "An",
    "Bình",
    "Cường",
    "Dũng",
    "Hải",
    "Huy",
    "Khoa",
    "Long",
    "Nam",
    "Phúc",
    "Quân",
    "Sơn",
    "Tùng",
    "Việt",
]
TEN_NU = [
    "Anh",
    "Chi",
    "Dung",
    "Hà",
    "Hương",
    "Linh",
    "Mai",
    "Nga",
    "Quyên",
    "Thảo",
    "Trang",
    "Uyên",
    "Vy",
    "Yến",
]

CITIES = [
    "Hà Nội",
    "Hồ Chí Minh",
    "Đà Nẵng",
    "Cần Thơ",
    "Hải Phòng",
    "Bình Dương",
    "Đồng Nai",
    "Nha Trang",
    "Huế",
    "Vũng Tàu",
]
SEGMENTS = ["Retail", "Wholesale", "VIP"]

CATEGORIES = {
    "Electronics": [
        ("Laptop Dell XPS 13", 22000000, 27500000),
        ("Laptop Lenovo ThinkPad T14", 19000000, 24000000),
        ("Laptop Asus Zenbook 14", 17500000, 21900000),
        ("Màn hình Dell UltraSharp 27 inch", 7500000, 9500000),
        ("Màn hình LG 4K UHD 32 inch", 9000000, 11500000),
        ("Bàn phím cơ Keychron K2", 1500000, 2100000),
        ("Chuột không dây Logitech MX Master 3S", 1800000, 2450000),
        ("Tai nghe chống ồn Sony WH-1000XM5", 6500000, 8490000),
        ("Ổ cứng SSD Samsung 980 Pro 1TB", 2100000, 2850000),
        ("Webcam Logitech C922 Pro", 1600000, 2200000),
    ],
    "Accessories": [
        ("Cáp sạc USB-C Anker PowerLine III", 180000, 290000),
        ("Củ sạc nhanh Baseus GaN 65W", 380000, 550000),
        ("Pin sạc dự phòng Xiaomi 20000mAh", 350000, 490000),
        ("Giá đỡ laptop nhôm tản nhiệt Orico", 220000, 350000),
        ("Túi chống sốc Tomtoc 14 inch", 450000, 690000),
        ("Hub chuyển đổi Type-C 7 in 1 Ugreen", 520000, 790000),
        ("Miếng lót chuột Gaming Size L", 120000, 190000),
        ("Bút cảm ứng Stylus Pen iPad", 600000, 890000),
        ("Balo laptop chống nước Tigernu", 480000, 720000),
        ("Đèn led treo màn hình Baseus", 320000, 490000),
    ],
    "Office Supplies": [
        ("Ghế công thái học Sihoo M57", 3200000, 4290000),
        ("Bàn nâng hạ thông minh FlexiSpot", 5800000, 7900000),
        ("Bảng vẽ kỹ thuật số Wacom One", 1400000, 1990000),
        ("Máy in laser Canon LBP 2900", 3500000, 4490000),
        ("Máy hủy tài liệu mini Deli", 950000, 1350000),
        ("Kệ sách để bàn bằng gỗ tự nhiên", 180000, 290000),
        ("Đồng hồ hẹn giờ Pomodoro", 120000, 190000),
        ("Sổ tay bìa da cao cấp A5", 90000, 150000),
        ("Bộ bút ký kim loại Parker", 350000, 520000),
        ("Kẹp giữ dây cáp để bàn", 40000, 75000),
    ],
    "Smart Home": [
        ("Robot hút bụi lau nhà Roborock Q Revo", 12000000, 15990000),
        ("Máy lọc không khí Xiaomi 4 Pro", 3800000, 4990000),
        ("Cân điện tử thông minh Eufy Smart Scale", 650000, 990000),
        ("Ổ cắm thông minh Tuya Wifi 16A", 110000, 180000),
        ("Camera an ninh thông minh Ezviz C6N", 420000, 650000),
        ("Đèn thông minh Yeelight Smart LED", 280000, 420000),
        ("Khóa cửa điện tử vân tay Xiaomi", 3900000, 5200000),
        ("Nồi chiên không dầu Philips 5L", 1800000, 2590000),
        ("Máy đo nồng độ bụi mịn PM2.5", 850000, 1250000),
        ("Chuông cửa có hình Aqara G4", 1900000, 2690000),
    ],
    "Audio & Gadgets": [
        ("Loa Bluetooth Marshall Acton III", 6200000, 7990000),
        ("Loa Bluetooth JBL Flip 6", 2100000, 2890000),
        ("Máy đọc sách Kindle Paperwhite 5", 3100000, 3990000),
        ("Vòng đeo tay thông minh Mi Band 8", 620000, 890000),
        ("Đồng hồ thể thao Garmin Forerunner 55", 4100000, 5290000),
        ("Micro thu âm USB Rode NT-USB Mini", 2400000, 3200000),
        ("Tay cầm chơi game Xbox Wireless", 1250000, 1690000),
        ("Kính thực tế ảo Meta Quest 3", 11500000, 14900000),
        ("Bộ phát Wifi Mesh TP-Link Deco M4", 1450000, 1990000),
        ("Bộ lưu điện UPS Santak 500VA", 850000, 1190000),
    ],
}

REGIONS = ["Miền Bắc", "Miền Trung", "Miền Nam"]
POSITIONS = ["Sales Executive", "Senior Sales Specialist", "Key Account Manager"]
PAYMENT_METHODS = ["COD", "Bank Transfer", "Credit Card", "E-Wallet"]
ORDER_STATUSES = ["Completed", "Pending", "Shipping", "Cancelled"]


def generate_vietnamese_name():
    is_male = random.random() > 0.48
    ho = random.choice(HO_LIST)
    dem = random.choice(DEM_NAM if is_male else DEM_NU)
    ten = random.choice(TEN_NAM if is_male else TEN_NU)
    return f"{ho} {dem} {ten}"


def remove_accents(text):
    s1 = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ"
    s0 = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD"
    res = ""
    for c in text:
        idx = s1.find(c)
        if idx != -1:
            res += s0[idx]
        else:
            res += c
    return res


def generate_clean_dataset():
    """Sinh bộ dữ liệu chuẩn sạch 100%."""
    # 1. Bảng Customers
    customers = []
    base_customer_date = datetime(2024, 1, 1)
    for i in range(1, NUM_CUSTOMERS + 1):
        cid = f"CUST_{i:05d}"
        name = generate_vietnamese_name()
        ascii_name = remove_accents(name).lower().replace(" ", ".")
        email = f"{ascii_name}.{i:03d}@example.com"
        phone = f"09{random.randint(10000000, 99999999)}"
        city = random.choice(CITIES)
        segment = random.choices(SEGMENTS, weights=[0.65, 0.25, 0.10])[0]
        created_at = (
            base_customer_date + timedelta(days=random.randint(0, 360))
        ).strftime("%Y-%m-%d %H:%M:%S")
        customers.append(
            {
                "customer_id": cid,
                "full_name": name,
                "email": email,
                "phone": phone,
                "city": city,
                "customer_segment": segment,
                "created_at": created_at,
            }
        )

    # 2. Bảng Employees
    employees = []
    base_emp_date = datetime(2022, 1, 1)
    for i in range(1, NUM_EMPLOYEES + 1):
        eid = f"EMP_{i:03d}"
        name = generate_vietnamese_name()
        department = "Sales Department"
        position = random.choice(POSITIONS)
        hire_date = (base_emp_date + timedelta(days=random.randint(0, 800))).strftime(
            "%Y-%m-%d"
        )
        region = random.choice(REGIONS)
        employees.append(
            {
                "employee_id": eid,
                "full_name": name,
                "department": department,
                "position": position,
                "hire_date": hire_date,
                "region": region,
            }
        )

    # 3. Bảng Products
    products = []
    p_idx = 1
    for cat, item_list in CATEGORIES.items():
        for pname, cost, price in item_list:
            pid = f"PROD_{p_idx:04d}"
            stock = random.randint(10, 250)
            status = "Active" if stock > 0 else "Out of Stock"
            products.append(
                {
                    "product_id": pid,
                    "product_name": pname,
                    "category": cat,
                    "cost_price": float(cost),
                    "selling_price": float(price),
                    "stock_quantity": stock,
                    "status": status,
                }
            )
            p_idx += 1

    # 4. Bảng Orders & Order Details
    orders = []
    order_details = []
    detail_counter = 1
    base_order_date = datetime(2025, 1, 1)

    for i in range(1, NUM_ORDERS + 1):
        oid = f"ORD_{i:05d}"
        cust = random.choice(customers)
        emp = random.choice(employees)

        # Ngày đặt hàng trong khoảng 2025-01-01 đến 2026-06-30
        order_dt = base_order_date + timedelta(days=random.randint(0, 540))
        status = random.choices(ORDER_STATUSES, weights=[0.75, 0.10, 0.10, 0.05])[0]

        if status in ["Completed", "Shipping"]:
            ship_days = random.randint(1, 5)
            ship_dt = (order_dt + timedelta(days=ship_days)).strftime("%Y-%m-%d")
        elif status == "Cancelled":
            ship_dt = ""
        else:  # Pending
            ship_dt = ""

        payment = random.choice(PAYMENT_METHODS)

        # Sinh từ 1 đến 4 sản phẩm trong mỗi đơn
        num_items = random.choices([1, 2, 3, 4], weights=[0.45, 0.35, 0.15, 0.05])[0]
        selected_prods = random.sample(products, num_items)
        order_total = 0.0

        for prod in selected_prods:
            did = f"DTL_{detail_counter:06d}"
            detail_counter += 1
            qty = random.choices([1, 2, 3, 5], weights=[0.70, 0.20, 0.08, 0.02])[0]
            unit_price = prod["selling_price"]
            # Giảm giá 0%, 5%, 10%, 15%
            discount = random.choices(
                [0.0, 0.05, 0.10, 0.15], weights=[0.70, 0.15, 0.10, 0.05]
            )[0]
            line_total = round(qty * unit_price * (1.0 - discount), 2)
            order_total += line_total

            order_details.append(
                {
                    "order_detail_id": did,
                    "order_id": oid,
                    "product_id": prod["product_id"],
                    "quantity": qty,
                    "unit_price": unit_price,
                    "discount": discount,
                    "line_total": line_total,
                }
            )

        orders.append(
            {
                "order_id": oid,
                "customer_id": cust["customer_id"],
                "employee_id": emp["employee_id"],
                "order_date": order_dt.strftime("%Y-%m-%d"),
                "shipping_date": ship_dt,
                "order_status": status,
                "payment_method": payment,
                "total_amount": round(order_total, 2),
            }
        )

    return customers, products, employees, orders, order_details


def inject_10_errors(customers, products, employees, orders, order_details):
    """
    Cài đặt chủ ý 10 loại lỗi dữ liệu vào bản DIRTY và ghi lại Ground Truth chi tiết.
    """
    # Tạo bản sao sâu (deep copy)
    dirty_cust = [dict(r) for r in customers]
    dirty_prod = [dict(r) for r in products]
    dirty_emp = [dict(r) for r in employees]
    dirty_ord = [dict(r) for r in orders]
    dirty_dtl = [dict(r) for r in order_details]

    ground_truth = []

    # -------------------------------------------------------------
    # Lỗi 1: Trùng lặp khóa chính (Duplicate Primary Key)
    # Nhân bản customer_id CUST_00015 vào dòng CUST_00088 nhưng đổi tên
    # -------------------------------------------------------------
    target_cust_idx = 87  # index 87 là CUST_00088
    orig_id = dirty_cust[target_cust_idx]["customer_id"]
    dup_id = "CUST_00015"
    dirty_cust[target_cust_idx]["customer_id"] = dup_id
    ground_truth.append(
        {
            "error_id": "ERR_01_PK_DUP",
            "error_type": "Duplicate Primary Key",
            "table": "customers",
            "column": "customer_id",
            "row_identifier": f"Original row with name {dirty_cust[target_cust_idx]['full_name']}",
            "dirty_value": dup_id,
            "expected_value": orig_id,
            "impact": "Vi phạm tính toàn vẹn thực thể (Entity Integrity). Gây sai lệch khi JOIN với bảng orders (1-N thành N-N).",
            "resolution_sql": f"UPDATE customers SET customer_id = '{orig_id}' WHERE full_name = '{dirty_cust[target_cust_idx]['full_name']}' AND customer_id = '{dup_id}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 2: Khóa ngoại mồ côi (Orphan Foreign Key Record)
    # Sửa product_id trong chi tiết đơn DTL_000250 thành PROD_9999 không tồn tại
    # -------------------------------------------------------------
    orphan_dtl_idx = 249  # DTL_000250
    orig_prod_id = dirty_dtl[orphan_dtl_idx]["product_id"]
    dirty_dtl[orphan_dtl_idx]["product_id"] = "PROD_9999"
    ground_truth.append(
        {
            "error_id": "ERR_02_FK_ORPHAN",
            "error_type": "Orphan Foreign Key",
            "table": "order_details",
            "column": "product_id",
            "row_identifier": dirty_dtl[orphan_dtl_idx]["order_detail_id"],
            "dirty_value": "PROD_9999",
            "expected_value": orig_prod_id,
            "impact": "Vi phạm toàn vẹn tham chiếu (Referential Integrity). INNER JOIN sẽ làm mất đơn hàng khỏi báo cáo doanh thu sản phẩm.",
            "resolution_sql": f"UPDATE order_details SET product_id = '{orig_prod_id}' WHERE order_detail_id = '{dirty_dtl[orphan_dtl_idx]['order_detail_id']}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 3: Khuyết thiếu trường bắt buộc (Missing Mandatory Field)
    # Đặt order_date = None/Rỗng cho đơn hàng ORD_00120
    # -------------------------------------------------------------
    null_ord_idx = 119  # ORD_00120
    orig_order_date = dirty_ord[null_ord_idx]["order_date"]
    dirty_ord[null_ord_idx]["order_date"] = ""
    ground_truth.append(
        {
            "error_id": "ERR_03_NULL_MANDATORY",
            "error_type": "Missing Value in Mandatory Column",
            "table": "orders",
            "column": "order_date",
            "row_identifier": dirty_ord[null_ord_idx]["order_id"],
            "dirty_value": "",
            "expected_value": orig_order_date,
            "impact": "Lỗi NULL trong trường thời gian quan trọng. Khiến đơn hàng bị loại khỏi các báo cáo doanh thu theo tháng/quý.",
            "resolution_sql": f"UPDATE orders SET order_date = '{orig_order_date}' WHERE order_id = '{dirty_ord[null_ord_idx]['order_id']}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 4: Sai định dạng Email & SĐT (Invalid Format / Regex Mismatch)
    # Email thiếu domain '@' và SĐT chứa chữ cái
    # -------------------------------------------------------------
    fmt_cust_idx = 34  # CUST_00035
    orig_email = dirty_cust[fmt_cust_idx]["email"]
    orig_phone = dirty_cust[fmt_cust_idx]["phone"]
    dirty_cust[fmt_cust_idx]["email"] = "nguyenvana_invalid_email.com"
    dirty_cust[fmt_cust_idx]["phone"] = "090PHONE123"
    ground_truth.append(
        {
            "error_id": "ERR_04_INVALID_FORMAT",
            "error_type": "Invalid Syntax / Regex Mismatch",
            "table": "customers",
            "column": "email & phone",
            "row_identifier": dirty_cust[fmt_cust_idx]["customer_id"],
            "dirty_value": "email='nguyenvana_invalid_email.com', phone='090PHONE123'",
            "expected_value": f"email='{orig_email}', phone='{orig_phone}'",
            "impact": "Không thể gửi email xác nhận hoặc SMS Marketing. CRM pipeline bị gián đoạn.",
            "resolution_sql": f"UPDATE customers SET email = '{orig_email}', phone = '{orig_phone}' WHERE customer_id = '{dirty_cust[fmt_cust_idx]['customer_id']}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 5: Nghịch lý thời gian (Date Paradox / Temporal Violation)
    # Giao hàng trước ngày đặt hàng: shipping_date < order_date
    # -------------------------------------------------------------
    paradox_ord_idx = 75  # ORD_00076
    orig_ship_date = dirty_ord[paradox_ord_idx]["shipping_date"]
    dirty_ord[paradox_ord_idx]["shipping_date"] = "2024-12-01"  # order_date trong 2025
    ground_truth.append(
        {
            "error_id": "ERR_05_TEMPORAL_PARADOX",
            "error_type": "Temporal Sequence Paradox",
            "table": "orders",
            "column": "shipping_date",
            "row_identifier": dirty_ord[paradox_ord_idx]["order_id"],
            "dirty_value": "2024-12-01",
            "expected_value": orig_ship_date,
            "impact": "Tính toán thời gian giao hàng (Lead Time) ra số âm (-35 ngày), làm sai lệch KPI Logistics.",
            "resolution_sql": f"UPDATE orders SET shipping_date = '{orig_ship_date}' WHERE order_id = '{dirty_ord[paradox_ord_idx]['order_id']}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 6: Giá trị âm / Vượt ngưỡng (Out of Range Numeric Value)
    # Số lượng mua âm (quantity = -5) trong chi tiết đơn DTL_000500
    # -------------------------------------------------------------
    range_dtl_idx = 499  # DTL_000500
    orig_qty = dirty_dtl[range_dtl_idx]["quantity"]
    dirty_dtl[range_dtl_idx]["quantity"] = -5
    ground_truth.append(
        {
            "error_id": "ERR_06_OUT_OF_RANGE",
            "error_type": "Out of Range / Negative Number",
            "table": "order_details",
            "column": "quantity",
            "row_identifier": dirty_dtl[range_dtl_idx]["order_detail_id"],
            "dirty_value": -5,
            "expected_value": orig_qty,
            "impact": "Làm âm tổng số lượng hàng bán ra và kéo giảm sai lệch tổng doanh thu của sản phẩm.",
            "resolution_sql": f"UPDATE order_details SET quantity = {orig_qty} WHERE order_detail_id = '{dirty_dtl[range_dtl_idx]['order_detail_id']}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 7: Danh mục không chuẩn hóa (Inconsistent Categorical Naming)
    # Tên thành phố bị gõ hỗn tạp: "HCM", "TP.HCM", "hồ chí minh", "HN"
    # -------------------------------------------------------------
    messy_indices = [10, 22, 55, 68]
    messy_values = ["TP.HCM", "HCM", "hồ chí minh", "HN"]
    for idx, m_val in zip(messy_indices, messy_values):
        dirty_cust[idx]["city"] = m_val
    ground_truth.append(
        {
            "error_id": "ERR_07_INCONSISTENT_CAT",
            "error_type": "Inconsistent Categorical Labeling",
            "table": "customers",
            "column": "city",
            "row_identifier": f"Customer rows: {[dirty_cust[i]['customer_id'] for i in messy_indices]}",
            "dirty_value": f"Mix values: {messy_values}",
            "expected_value": "Chuẩn hóa theo danh mục chuẩn: 'Hồ Chí Minh', 'Hà Nội'",
            "impact": "Phép toán GROUP BY city bị phân mảnh thành nhiều nhóm rời rạc, làm sai biểu đồ địa lý BI.",
            "resolution_sql": "UPDATE customers SET city = 'Hồ Chí Minh' WHERE LOWER(city) IN ('tp.hcm', 'hcm', 'hồ chí minh'); UPDATE customers SET city = 'Hà Nội' WHERE city = 'HN';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 8: Sai lệch tính toán tài chính (Mathematical Calculation Discrepancy)
    # line_total trong DTL_000800 bị ghi sai 99,999,999 VNĐ
    # -------------------------------------------------------------
    calc_dtl_idx = 799  # DTL_000800
    orig_line_total = dirty_dtl[calc_dtl_idx]["line_total"]
    dirty_dtl[calc_dtl_idx]["line_total"] = 99999999.0
    ground_truth.append(
        {
            "error_id": "ERR_08_MATH_DISCREPANCY",
            "error_type": "Business Logic Calculation Mismatch",
            "table": "order_details",
            "column": "line_total",
            "row_identifier": dirty_dtl[calc_dtl_idx]["order_detail_id"],
            "dirty_value": 99999999.0,
            "expected_value": orig_line_total,
            "impact": "Làm đội doanh thu tổng thể lên gần 100 triệu VNĐ, vi phạm định luật tính tiền: line_total = quantity * unit_price * (1 - discount).",
            "resolution_sql": f"UPDATE order_details SET line_total = ROUND(quantity * unit_price * (1 - discount), 2) WHERE order_detail_id = '{dirty_dtl[calc_dtl_idx]['order_detail_id']}';",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 9: Dư thừa khoảng trắng & ký tự lạ (Whitespace Artifacts)
    # Dư khoảng trắng ở tên sản phẩm và tên nhân viên
    # -------------------------------------------------------------
    prod_space_idx = 4  # PROD_0005
    emp_space_idx = 2  # EMP_003
    orig_pname = dirty_prod[prod_space_idx]["product_name"]
    orig_ename = dirty_emp[emp_space_idx]["full_name"]
    dirty_prod[prod_space_idx]["product_name"] = f"   {orig_pname}   "
    dirty_emp[emp_space_idx]["full_name"] = f"{orig_ename}  \t"
    ground_truth.append(
        {
            "error_id": "ERR_09_WHITESPACE_ARTIFACT",
            "error_type": "Leading / Trailing Whitespace Padding",
            "table": "products & employees",
            "column": "product_name, full_name",
            "row_identifier": f"PROD: {dirty_prod[prod_space_idx]['product_id']}, EMP: {dirty_emp[emp_space_idx]['employee_id']}",
            "dirty_value": f"'{dirty_prod[prod_space_idx]['product_name']}', '{dirty_emp[emp_space_idx]['full_name']}'",
            "expected_value": f"'{orig_pname}', '{orig_ename}'",
            "impact": "Tìm kiếm chuỗi bằng mệnh đề WHERE name = '...' hoặc JOIN chuỗi bị thất bại do khoảng trắng ẩn.",
            "resolution_sql": "UPDATE products SET product_name = TRIM(product_name); UPDATE employees SET full_name = TRIM(full_name);",
        }
    )

    # -------------------------------------------------------------
    # Lỗi 10: Xung đột trạng thái nghiệp vụ (State / Status Conflict)
    # Đơn hàng trạng thái Cancelled nhưng vẫn ghi ngày giao và phương thức thanh toán hoàn tất
    # -------------------------------------------------------------
    conflict_ord_idx = 210  # ORD_00211
    dirty_ord[conflict_ord_idx]["order_status"] = "Cancelled"
    dirty_ord[conflict_ord_idx]["shipping_date"] = "2025-08-15"
    ground_truth.append(
        {
            "error_id": "ERR_10_STATUS_CONFLICT",
            "error_type": "Workflow State Conflict",
            "table": "orders",
            "column": "order_status vs shipping_date",
            "row_identifier": dirty_ord[conflict_ord_idx]["order_id"],
            "dirty_value": "order_status='Cancelled' nhưng shipping_date='2025-08-15'",
            "expected_value": "Nếu Cancelled thì shipping_date phải rỗng (NULL)",
            "impact": "Gây mâu thuẫn báo cáo logistics: một đơn hàng đã hủy không thể phát sinh hoạt động giao vận thành công.",
            "resolution_sql": f"UPDATE orders SET shipping_date = NULL WHERE order_id = '{dirty_ord[conflict_ord_idx]['order_id']}' AND order_status = 'Cancelled';",
        }
    )

    return dirty_cust, dirty_prod, dirty_emp, dirty_ord, dirty_dtl, ground_truth


def save_csv(data, filepath, fieldnames):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)


def main():
    print("=" * 60)
    print("CYBERSOFT DATA & AI LAB - TASK 06 GENERATOR")
    print("Mô hình: Bán hàng đa bảng (sales_v1) - Star Schema")
    print("=" * 60)

    # Đường dẫn thư mục
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    clean_dir = os.path.join(base_dir, "data", "clean")
    dirty_dir = os.path.join(base_dir, "data", "dirty")
    docs_dir = os.path.join(base_dir, "docs")

    print(f"[*] Base Directory: {base_dir}")

    # 1. Sinh bộ dữ liệu sạch
    print("[1/3] Đang tạo bộ dữ liệu CLEAN...")
    cust, prod, emp, ords, dtl = generate_clean_dataset()

    save_csv(cust, os.path.join(clean_dir, "customers.csv"), list(cust[0].keys()))
    save_csv(prod, os.path.join(clean_dir, "products.csv"), list(prod[0].keys()))
    save_csv(emp, os.path.join(clean_dir, "employees.csv"), list(emp[0].keys()))
    save_csv(ords, os.path.join(clean_dir, "orders.csv"), list(ords[0].keys()))
    save_csv(dtl, os.path.join(clean_dir, "order_details.csv"), list(dtl[0].keys()))

    print(f"  + customers.csv: {len(cust)} rows")
    print(f"  + products.csv: {len(prod)} rows")
    print(f"  + employees.csv: {len(emp)} rows")
    print(f"  + orders.csv: {len(ords)} rows")
    print(f"  + order_details.csv: {len(dtl)} rows")

    # 2. Cài cắm 10 lỗi vào bản dirty
    print("[2/3] Đang cài cắm 10 loại lỗi vào bộ dữ liệu DIRTY...")
    d_cust, d_prod, d_emp, d_ords, d_dtl, ground_truth = inject_10_errors(
        cust, prod, emp, ords, dtl
    )

    save_csv(d_cust, os.path.join(dirty_dir, "customers.csv"), list(d_cust[0].keys()))
    save_csv(d_prod, os.path.join(dirty_dir, "products.csv"), list(d_prod[0].keys()))
    save_csv(d_emp, os.path.join(dirty_dir, "employees.csv"), list(d_emp[0].keys()))
    save_csv(d_ords, os.path.join(dirty_dir, "orders.csv"), list(d_ords[0].keys()))
    save_csv(d_dtl, os.path.join(dirty_dir, "order_details.csv"), list(d_dtl[0].keys()))

    # 3. Xuất Ground Truth đối chứng
    print("[3/3] Đang xuất tệp đối chứng Ground Truth (JSON & Markdown)...")
    os.makedirs(docs_dir, exist_ok=True)
    gt_json_path = os.path.join(docs_dir, "dirty_data_ground_truth.json")
    with open(gt_json_path, "w", encoding="utf-8") as f:
        json.dump(ground_truth, f, ensure_ascii=False, indent=2)

    gt_md_path = os.path.join(docs_dir, "dirty_data_ground_truth.md")
    with open(gt_md_path, "w", encoding="utf-8") as f:
        f.write("# BẢNG ĐÁP ÁN ĐỐI CHỨNG 10 LOẠI LỖI CÀI CẮM (GROUND TRUTH)\n\n")
        f.write("**Bộ dữ liệu**: `sales_v1_dirty` | **CyberSoft Data & AI Lab**\n\n")
        f.write(
            "| Mã lỗi | Loại lỗi | Bảng & Cột | Dòng định danh | Giá trị bẩn | Giá trị chuẩn | Hậu quả phân tích | Câu lệnh SQL khắc phục |\n"
        )
        f.write("|---|---|---|---|---|---|---|---|\n")
        for g in ground_truth:
            f.write(
                f"| `{g['error_id']}` | {g['error_type']} | `{g['table']}.{g['column']}` | {g['row_identifier']} | `{g['dirty_value']}` | `{g['expected_value']}` | {g['impact']} | `{g['resolution_sql']}` |\n"
            )

    print("\n[SUCCESS] Hoàn tất sinh dữ liệu Task 06 thành công!")
    print(f"Clean files: {clean_dir}")
    print(f"Dirty files: {dirty_dir}")
    print(f"Ground truth: {gt_json_path}")


if __name__ == "__main__":
    main()
