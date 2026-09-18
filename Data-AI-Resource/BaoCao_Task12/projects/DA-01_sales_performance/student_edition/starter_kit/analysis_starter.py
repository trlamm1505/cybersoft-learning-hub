"""CyberSoft Mart - Capstone DA-01 Python Analysis Starter Kit.

Học viên sử dụng script này để:
1. Tải và kiểm tra 4 file CSV đầu vào.
2. Kiểm tra tính toàn vẹn dữ liệu và kiểm toán sơ bộ.
3. Xuất các bảng dữ liệu sạch để nạp vào Excel hoặc PowerBI.
"""

import os
import sys
import pandas as pd


def main():
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    if not os.path.exists(data_dir):
        data_dir = "data"

    print("=" * 60)
    print("🛒 CYBERSOFT MART - CAPSTONE DA-01 STARTER KIT")
    print("=" * 60)

    # 1. Đọc dữ liệu
    try:
        orders = pd.read_csv(os.path.join(data_dir, "orders.csv"))
        order_items = pd.read_csv(os.path.join(data_dir, "order_items.csv"))
        customers = pd.read_csv(os.path.join(data_dir, "customers.csv"))
        products = pd.read_csv(os.path.join(data_dir, "products.csv"))
        print(f"✅ Đã tải orders.csv: {orders.shape}")
        print(f"✅ Đã tải order_items.csv: {order_items.shape}")
        print(f"✅ Đã tải customers.csv: {customers.shape}")
        print(f"✅ Đã tải products.csv: {products.shape}")
    except Exception as e:
        print(f"❌ Lỗi khi đọc file CSV: {e}")
        sys.exit(1)

    # 2. Phát hiện dị biệt sơ bộ
    dup_orders = orders.duplicated(subset=["order_id"]).sum()
    null_status = (
        orders["order_status"].isna().sum() + (orders["order_status"] == "").sum()
    )
    print("\n🔍 [KIỂM TOÁN DỮ LIỆU BAN ĐẦU]")
    print(f"  - Số bản ghi trùng lặp mã đơn (order_id): {dup_orders}")
    print(f"  - Số đơn hàng thiếu trạng thái (order_status): {null_status}")

    # 3. Hướng dẫn các bước tiếp theo
    print("\n📝 [CÁC BƯỚC THỰC HIỆN TIẾP THEO]")
    print("  1. Khử duplicate và điền khuyết thiếu cho bảng orders.")
    print("  2. Thực hiện tính toán các chỉ số Net Revenue, AOV, Gross Margin.")
    print("  3. Tham khảo tài liệu HINTS.md nếu gặp khó khăn.")
    print("  4. Chạy đối soát kết quả với bảng tiêu chí trong submission_checklist.md.")
    print("=" * 60)


if __name__ == "__main__":
    main()
