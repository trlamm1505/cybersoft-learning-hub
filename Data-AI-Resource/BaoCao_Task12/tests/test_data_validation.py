import os
import pandas as pd


def test_csv_shapes_and_columns(task12_paths):
    data_dir = task12_paths["data"]

    orders = pd.read_csv(os.path.join(data_dir, "orders.csv"))
    items = pd.read_csv(os.path.join(data_dir, "order_items.csv"))
    customers = pd.read_csv(os.path.join(data_dir, "customers.csv"))
    products = pd.read_csv(os.path.join(data_dir, "products.csv"))

    # Kiểm tra số dòng thô
    assert len(orders) == 402, f"Expected 402 raw orders, got {len(orders)}"
    assert len(items) == 997, f"Expected 997 order items, got {len(items)}"
    assert len(customers) == 100, f"Expected 100 customers, got {len(customers)}"
    assert len(products) == 50, f"Expected 50 products, got {len(products)}"

    # Kiểm tra các cột chính
    assert "order_id" in orders.columns
    assert "total_amount" in orders.columns
    assert "shipping_fee" in orders.columns
    assert "payment_method" in orders.columns

    assert "item_id" in items.columns
    assert "order_id" in items.columns
    assert "product_id" in items.columns
    assert "unit_price" in items.columns
    assert "discount_amount" in items.columns

    assert "customer_id" in customers.columns
    assert "city" in customers.columns

    assert "product_id" in products.columns
    assert "cost_price" in products.columns
    assert "list_price" in products.columns


def test_known_data_anomalies_present(task12_paths):
    """Kiểm tra chắc chắn các dị biệt cố ý để học viên rèn luyện làm sạch vẫn tồn tại."""
    data_dir = task12_paths["data"]
    orders = pd.read_csv(os.path.join(data_dir, "orders.csv"))

    # Đúng 2 dòng duplicate mã order_id
    dup_count = orders.duplicated(subset=["order_id"]).sum()
    assert dup_count == 2, f"Expected 2 duplicate orders, found {dup_count}"

    # Đúng 5 dòng null hoặc rỗng ở order_status
    null_count = (
        orders["order_status"].isna().sum() + (orders["order_status"] == "").sum()
    )
    assert null_count == 5, f"Expected 5 missing status orders, found {null_count}"
