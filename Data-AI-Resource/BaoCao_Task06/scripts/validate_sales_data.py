"""
Validation Script cho Bộ Dữ liệu Bán hàng Đa bảng (sales_v1)
CyberSoft Data & AI Lab - Tuần 2: Tạo tài nguyên dữ liệu (Task 06)
Tác giả: Đào Trung Kiên - Data & AI Resource Engineer

Kiểm tra toàn diện 10 khía cạnh chất lượng & toàn vẹn dữ liệu:
1. Schema & Cột bắt buộc
2. Tính duy nhất của Khóa chính (Primary Key Uniqueness)
3. Tính toàn vẹn tham chiếu Khóa ngoại (Foreign Key Referential Integrity)
4. Giá trị khuyết thiếu (Null / Missing Check)
5. Định dạng Regex (Email, Phone)
6. Nghịch lý trình tự thời gian (Temporal Order Check)
7. Miền giá trị số (Range & Negative Values)
8. Tính nhất quán danh mục (Categorical Standardization)
9. Tính đúng đắn của phép tính số học (Financial Math Discrepancy)
10. Khoảng trắng dư thừa & Xung đột trạng thái (Whitespace & State Conflict)
"""

import os
import sys
import csv
import re
import argparse
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

APPROVED_CITIES = [
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

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
PHONE_REGEX = re.compile(r"^0\d{9,10}$")


def read_csv(file_path):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Không tìm thấy tệp: {file_path}")
    rows = []
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)
    return rows


def validate_dataset(data_dir, verbose=False):
    issues = []
    print(f"\n{'='*70}")
    print(f"BẮT ĐẦU KIỂM ĐỊNH TÍNH TOÀN VẸN: {data_dir}")
    print(f"{'='*70}")

    cust_path = os.path.join(data_dir, "customers.csv")
    prod_path = os.path.join(data_dir, "products.csv")
    emp_path = os.path.join(data_dir, "employees.csv")
    ord_path = os.path.join(data_dir, "orders.csv")
    dtl_path = os.path.join(data_dir, "order_details.csv")

    try:
        customers = read_csv(cust_path)
        products = read_csv(prod_path)
        employees = read_csv(emp_path)
        orders = read_csv(ord_path)
        order_details = read_csv(dtl_path)
    except Exception as e:
        print(f"[FATAL ERROR] Lỗi nạp tệp CSV: {e}")
        return [f"Fatal load error: {e}"]

    # 1. Kiểm tra Khóa chính (Primary Key Uniqueness)
    def check_pk(rows, pk_field, table_name):
        seen = set()
        for idx, r in enumerate(rows):
            val = r.get(pk_field, "").strip()
            if not val:
                issues.append(
                    f"[{table_name}] Khóa chính '{pk_field}' bị rỗng tại dòng {idx+2}"
                )
            elif val in seen:
                issues.append(
                    f"[{table_name}] Trùng lặp khóa chính '{pk_field}' = '{val}' tại dòng {idx+2} (ERR_PK_DUP)"
                )
            seen.add(val)
        return seen

    cust_pks = check_pk(customers, "customer_id", "customers")
    prod_pks = check_pk(products, "product_id", "products")
    emp_pks = check_pk(employees, "employee_id", "employees")
    ord_pks = check_pk(orders, "order_id", "orders")
    check_pk(order_details, "order_detail_id", "order_details")

    # 2. Kiểm tra Khóa ngoại (Foreign Key Referential Integrity)
    for idx, r in enumerate(orders):
        cid = r.get("customer_id", "").strip()
        eid = r.get("employee_id", "").strip()
        oid = r.get("order_id", f"row_{idx+2}")

        if cid not in cust_pks:
            issues.append(
                f"[orders] Khóa ngoại mồ côi: customer_id '{cid}' tại đơn hàng {oid} không tồn tại trong customers (ERR_FK_ORPHAN)"
            )
        if eid not in emp_pks:
            issues.append(
                f"[orders] Khóa ngoại mồ côi: employee_id '{eid}' tại đơn hàng {oid} không tồn tại trong employees (ERR_FK_ORPHAN)"
            )

    for idx, r in enumerate(order_details):
        oid = r.get("order_id", "").strip()
        pid = r.get("product_id", "").strip()
        did = r.get("order_detail_id", f"row_{idx+2}")

        if oid not in ord_pks:
            issues.append(
                f"[order_details] Khóa ngoại mồ côi: order_id '{oid}' tại dòng {did} không tồn tại trong orders (ERR_FK_ORPHAN)"
            )
        if pid not in prod_pks:
            issues.append(
                f"[order_details] Khóa ngoại mồ côi: product_id '{pid}' tại dòng {did} không tồn tại trong products (ERR_FK_ORPHAN)"
            )

    # 3. Kiểm tra trường bắt buộc không được NULL (Missing Mandatory Fields)
    for idx, r in enumerate(orders):
        if not r.get("order_date", "").strip():
            issues.append(
                f"[orders] Thiếu trường bắt buộc 'order_date' tại đơn {r.get('order_id')} (ERR_NULL_MANDATORY)"
            )

    # 4. Kiểm tra Regex Email & Phone
    for idx, r in enumerate(customers):
        cid = r.get("customer_id")
        email = r.get("email", "")
        phone = r.get("phone", "")
        if not EMAIL_REGEX.match(email):
            issues.append(
                f"[customers] Email không hợp lệ '{email}' tại khách hàng {cid} (ERR_INVALID_FORMAT)"
            )
        if not PHONE_REGEX.match(phone):
            issues.append(
                f"[customers] Số điện thoại không hợp lệ '{phone}' tại khách hàng {cid} (ERR_INVALID_FORMAT)"
            )

    # 5. Kiểm tra Nghịch lý thời gian (Date Paradox)
    for idx, r in enumerate(orders):
        odt_str = r.get("order_date", "").strip()
        sdt_str = r.get("shipping_date", "").strip()
        oid = r.get("order_id")
        if odt_str and sdt_str:
            try:
                odt = datetime.strptime(odt_str, "%Y-%m-%d")
                sdt = datetime.strptime(sdt_str, "%Y-%m-%d")
                if sdt < odt:
                    issues.append(
                        f"[orders] Nghịch lý thời gian tại đơn {oid}: shipping_date ({sdt_str}) < order_date ({odt_str}) (ERR_TEMPORAL_PARADOX)"
                    )
            except ValueError:
                issues.append(
                    f"[orders] Lỗi định dạng ngày tại đơn {oid}: {odt_str} hoặc {sdt_str}"
                )

    # 6. Kiểm tra Miền giá trị số (Range & Out of Bounds)
    for idx, r in enumerate(order_details):
        did = r.get("order_detail_id")
        try:
            qty = int(r.get("quantity", 0))
            price = float(r.get("unit_price", 0.0))
            disc = float(r.get("discount", 0.0))
            if qty <= 0:
                issues.append(
                    f"[order_details] Số lượng không hợp lệ (qty = {qty} <= 0) tại dòng {did} (ERR_OUT_OF_RANGE)"
                )
            if price <= 0:
                issues.append(
                    f"[order_details] Đơn giá không hợp lệ (unit_price = {price} <= 0) tại dòng {did} (ERR_OUT_OF_RANGE)"
                )
            if disc < 0.0 or disc > 1.0:
                issues.append(
                    f"[order_details] Tỷ lệ chiết khấu vượt ngưỡng (discount = {disc}) tại dòng {did} (ERR_OUT_OF_RANGE)"
                )
        except ValueError:
            issues.append(f"[order_details] Lỗi chuyển đổi số tại dòng {did}")

    # 7. Kiểm tra Danh mục chuẩn hóa (Categorical Values)
    for idx, r in enumerate(customers):
        city = r.get("city", "").strip()
        cid = r.get("customer_id")
        if city not in APPROVED_CITIES:
            issues.append(
                f"[customers] Tên thành phố chưa chuẩn hóa '{city}' tại khách hàng {cid} (ERR_INCONSISTENT_CAT)"
            )

    # 8. Kiểm tra Tính toán tài chính (Math Discrepancy)
    for idx, r in enumerate(order_details):
        did = r.get("order_detail_id")
        try:
            qty = int(r.get("quantity", 0))
            price = float(r.get("unit_price", 0.0))
            disc = float(r.get("discount", 0.0))
            line_tot = float(r.get("line_total", 0.0))
            expected_line = round(qty * price * (1.0 - disc), 2)
            if abs(line_tot - expected_line) > 1.0:
                issues.append(
                    f"[order_details] Sai lệch dòng tiền tại {did}: ghi nhận {line_tot:,.2f} VNĐ nhưng tính toán là {expected_line:,.2f} VNĐ (ERR_MATH_DISCREPANCY)"
                )
        except ValueError:
            pass

    # 9. Kiểm tra Khoảng trắng dư thừa (Whitespace Artifacts)
    for r in products:
        pname = r.get("product_name", "")
        if pname != pname.strip() or "   " in pname:
            issues.append(
                f"[products] Dư khoảng trắng tại sản phẩm {r.get('product_id')}: '{pname}' (ERR_WHITESPACE_ARTIFACT)"
            )
    for r in employees:
        ename = r.get("full_name", "")
        if ename != ename.strip() or "\t" in ename:
            issues.append(
                f"[employees] Dư khoảng trắng/tab tại nhân viên {r.get('employee_id')}: '{ename}' (ERR_WHITESPACE_ARTIFACT)"
            )

    # 10. Kiểm tra Xung đột trạng thái nghiệp vụ (Workflow State Conflict)
    for r in orders:
        status = r.get("order_status", "")
        ship_date = r.get("shipping_date", "").strip()
        oid = r.get("order_id")
        if status == "Cancelled" and ship_date:
            issues.append(
                f"[orders] Đơn hàng {oid} trạng thái Cancelled nhưng có shipping_date = '{ship_date}' (ERR_STATUS_CONFLICT)"
            )

    # In kết quả tổng kết
    print("\n[KẾT QUẢ KIỂM ĐỊNH]")
    print(f"Tổng số vấn đề phát hiện: {len(issues)}")
    if len(issues) == 0:
        print("[STATUS: PASS] 100% dữ liệu đạt chuẩn toàn vẹn nghiệp vụ!")
    else:
        print(f"[STATUS: VIOLATIONS DETECTED] Tìm thấy {len(issues)} điểm vi phạm:")
        for idx, iss in enumerate(issues, 1):
            print(f"  {idx:02d}. {iss}")

    return issues


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_clean = os.path.join(base_dir, "data", "clean")
    default_dirty = os.path.join(base_dir, "data", "dirty")

    parser = argparse.ArgumentParser(
        description="Kiểm tra chất lượng bộ dữ liệu sales_v1."
    )
    parser.add_argument(
        "--dataset-dir",
        "-d",
        type=str,
        default=None,
        help="Đường dẫn thư mục chứa 5 tệp CSV (mặc định: tự động kiểm tra cả clean và dirty)",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Trả về Exit Code 1 nếu phát hiện bất kỳ vi phạm nào",
    )
    args = parser.parse_args()

    if args.dataset_dir:
        issues = validate_dataset(args.dataset_dir)
        if len(issues) > 0:
            sys.exit(1)
        else:
            sys.exit(0)
    else:
        print("\n[*] Bạn không truyền tham số -d / --dataset-dir.")
        print(
            "[*] Tự động thực thi kiểm định toàn diện trên cả 2 bộ dữ liệu (CLEAN & DIRTY)..."
        )

        print("\n>>> 1. KIỂM ĐỊNH BẢN CLEAN:")
        clean_issues = validate_dataset(default_clean)

        print("\n>>> 2. KIỂM ĐỊNH BẢN DIRTY:")
        dirty_issues = validate_dataset(default_dirty)

        print("\n" + "=" * 70)
        print("TỔNG KẾT KIỂM ĐỊNH TOÀN BỘ DATASET TASK 06")
        print("=" * 70)
        print(
            f"  - Bản Clean: {len(clean_issues)} lỗi vi phạm -> {'[PASS]' if len(clean_issues) == 0 else '[FAIL]'}"
        )
        print(
            f"  - Bản Dirty: {len(dirty_issues)} lỗi vi phạm được phát hiện -> {'[PASS: ĐÃ BẮT TRÚNG LỖI]' if len(dirty_issues) >= 10 else '[FAIL]'}"
        )
        print("=" * 70)

        if len(clean_issues) == 0 and len(dirty_issues) >= 10:
            sys.exit(0)
        else:
            sys.exit(1)


if __name__ == "__main__":
    main()
