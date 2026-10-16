"""CyberSoft Mart - Sales Performance & Customer Retention Intelligence
Starter Code Template for Students.
"""

import os
import json
import pandas as pd


def load_datasets(data_dir: str = "../data"):
    """Load all 4 datasets."""
    print("Loading datasets from:", data_dir)
    orders = pd.read_csv(os.path.join(data_dir, "orders.csv"))
    order_items = pd.read_csv(os.path.join(data_dir, "order_items.csv"))
    customers = pd.read_csv(os.path.join(data_dir, "customers.csv"))
    products = pd.read_csv(os.path.join(data_dir, "products.csv"))
    return orders, order_items, customers, products


def clean_data(orders: pd.DataFrame) -> pd.DataFrame:
    """TASK-01: Clean duplicates and handle missing values."""
    print("Executing TASK-01: Data Cleaning...")
    # TODO: Remove duplicates by order_id
    # TODO: Fill missing order_status
    cleaned_orders = orders.copy()
    return cleaned_orders


def calculate_business_kpis(
    orders: pd.DataFrame, order_items: pd.DataFrame, products: pd.DataFrame
):
    """TASK-02: Calculate key business KPIs."""
    print("Executing TASK-02: Calculating KPIs...")
    # TODO: Compute Net Revenue, AOV, Cancellation Rate, Return Rate, Gross Margin
    kpis = {
        "net_revenue_usd": 0.0,
        "average_order_value_usd": 0.0,
        "cancellation_rate_pct": 0.0,
        "return_rate_pct": 0.0,
        "gross_margin_pct": 0.0,
    }
    return kpis


def rfm_segmentation(orders: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
    """TASK-EXT-01: RFM Customer Segmentation."""
    print("Executing TASK-EXT-01: RFM Segmentation...")
    # TODO: Calculate Recency, Frequency, Monetary and assign 5 segments
    return pd.DataFrame()


def main():
    orders, order_items, customers, products = load_datasets()
    cleaned_orders = clean_data(orders)
    kpis = calculate_business_kpis(cleaned_orders, order_items, products)
    print("Computed KPIs:", json.dumps(kpis, indent=2))


if __name__ == "__main__":
    main()
