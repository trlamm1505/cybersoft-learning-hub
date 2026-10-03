"""
CyberSoft Data & AI Lab — Capstone DA-02: Starter Python Pipeline
Student Implementation Template
"""

import os
import pandas as pd

# Load Data
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "clean")


def load_data():
    """Load all clean dataset CSV files."""
    movements = pd.read_csv(os.path.join(DATA_DIR, "inventory_movements.csv"))
    products = pd.read_csv(os.path.join(DATA_DIR, "products.csv"))
    warehouses = pd.read_csv(os.path.join(DATA_DIR, "warehouses.csv"))
    purchase_orders = pd.read_csv(os.path.join(DATA_DIR, "purchase_orders.csv"))
    audits = pd.read_csv(os.path.join(DATA_DIR, "inventory_audits.csv"))
    return movements, products, warehouses, purchase_orders, audits


def calculate_inventory_kpis():
    """
    TODO: Implement complete inventory calculations.
    Return a dictionary formatted for Auto-Grader evaluation:
    {
        "ending_physical_inventory_units": int,
        "ending_inventory_valuation_usd": float,
        "total_cogs_usd": float,
        "inventory_turnover_ratio": float,
        "warehouse_distribution": {
            "WH-DN01": {"units": int},
            "WH-HCM01": {"units": int},
            "WH-HN01": {"units": int}
        },
        "out_of_stock_skus_count": int,
        "reorder_point_alerts_count": int
    }
    """
    movements, products, warehouses, purchase_orders, audits = load_data()

    # -------------------------------------------------------------
    # BƯỚC 1: Xử lý dấu biến động kho (direction IN vs OUT)
    # -------------------------------------------------------------
    # TODO: movements['qty_signed'] = ...

    # -------------------------------------------------------------
    # BƯỚC 2: Tính tồn kho và định giá từng SKU
    # -------------------------------------------------------------
    # TODO: Tính tổng tồn kho và ghép với products để tính ending_valuation_usd

    # -------------------------------------------------------------
    # BƯỚC 3: Tính Giá vốn hàng bán (COGS) và Vòng quay tồn kho
    # -------------------------------------------------------------
    # TODO: Lọc OUTBOUND_SALE, tính COGS, tính Tồn kho bình quân và Turnover

    # -------------------------------------------------------------
    # BƯỚC 4: Phân tích theo kho và phát hiện cảnh báo ROP / Stockouts
    # -------------------------------------------------------------
    # TODO: Nhóm theo warehouse_id, đếm stockouts và ROP alerts

    metrics = {
        "ending_physical_inventory_units": 0,
        "ending_inventory_valuation_usd": 0.0,
        "total_cogs_usd": 0.0,
        "inventory_turnover_ratio": 0.0,
        "warehouse_distribution": {},
        "out_of_stock_skus_count": 0,
        "reorder_point_alerts_count": 0,
    }
    return metrics


if __name__ == "__main__":
    kpis = calculate_inventory_kpis()
    print("Calculated KPIs:", kpis)
