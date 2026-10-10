"""CyberSoft Mart - Sales Performance & Customer Retention Intelligence
Official Instructor Solution Reference Implementation.
"""

import os
import json
import pandas as pd


def load_datasets(data_dir: str):
    orders = pd.read_csv(os.path.join(data_dir, "orders.csv"))
    order_items = pd.read_csv(os.path.join(data_dir, "order_items.csv"))
    customers = pd.read_csv(os.path.join(data_dir, "customers.csv"))
    products = pd.read_csv(os.path.join(data_dir, "products.csv"))
    return orders, order_items, customers, products


def clean_orders_data(orders: pd.DataFrame) -> pd.DataFrame:
    # 1. Deduplicate by order_id
    cleaned = orders.drop_duplicates(subset=["order_id"], keep="first").copy()
    # 2. Impute missing status: default to completed
    cleaned["order_status"] = (
        cleaned["order_status"].fillna("completed").replace("", "completed")
    )
    return cleaned


def compute_kpis(
    orders: pd.DataFrame, order_items: pd.DataFrame, products: pd.DataFrame
):
    total_orders = len(orders)
    completed_orders = orders[orders["order_status"] == "completed"].copy()
    cancelled_orders = orders[orders["order_status"] == "cancelled"]
    returned_orders = orders[orders["order_status"] == "returned"]

    net_revenue = round(float(completed_orders["total_amount"].sum()), 2)
    aov = round(float(completed_orders["total_amount"].mean()), 2)
    cancellation_rate = round((len(cancelled_orders) / total_orders) * 100, 2)
    return_rate = round((len(returned_orders) / total_orders) * 100, 2)

    # Product level profit
    merged = order_items.merge(
        orders[["order_id", "order_status"]], on="order_id", how="inner"
    )
    merged = merged.merge(
        products[["product_id", "cost_price"]], on="product_id", how="inner"
    )
    comp_items = merged[merged["order_status"] == "completed"].copy()

    comp_items["item_rev"] = (
        comp_items["unit_price"] - comp_items["discount_amount"]
    ) * comp_items["quantity"]
    comp_items["item_cost"] = comp_items["cost_price"] * comp_items["quantity"]

    gross_profit = round(
        float((comp_items["item_rev"] - comp_items["item_cost"]).sum()), 2
    )
    gross_margin_pct = round(
        (gross_profit / float(comp_items["item_rev"].sum())) * 100, 2
    )

    return {
        "total_raw_orders": 402,
        "total_clean_orders": total_orders,
        "completed_orders_count": len(completed_orders),
        "cancelled_orders_count": len(cancelled_orders),
        "returned_orders_count": len(returned_orders),
        "net_revenue_usd": net_revenue,
        "average_order_value_usd": aov,
        "cancellation_rate_pct": cancellation_rate,
        "return_rate_pct": return_rate,
        "gross_profit_usd": gross_profit,
        "gross_margin_pct": gross_margin_pct,
    }


def compute_rfm_segments(orders: pd.DataFrame, customers: pd.DataFrame) -> pd.DataFrame:
    completed = orders[orders["order_status"] == "completed"].copy()
    completed["order_datetime"] = pd.to_datetime(completed["order_date"])
    snapshot_date = completed["order_datetime"].max() + pd.Timedelta(days=1)

    rfm = (
        completed.groupby("customer_id")
        .agg(
            {
                "order_datetime": lambda x: (snapshot_date - x.max()).days,
                "order_id": "count",
                "total_amount": "sum",
            }
        )
        .reset_index()
    )

    rfm.columns = ["customer_id", "recency", "frequency", "monetary"]

    # Rank based scoring to avoid duplicate bin errors
    rfm["r_score"] = pd.qcut(
        rfm["recency"].rank(method="first"), 5, labels=[5, 4, 3, 2, 1]
    )
    rfm["f_score"] = pd.qcut(
        rfm["frequency"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]
    )
    rfm["m_score"] = pd.qcut(
        rfm["monetary"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]
    )

    rfm["rfm_score"] = (
        rfm["r_score"].astype(int)
        + rfm["f_score"].astype(int)
        + rfm["m_score"].astype(int)
    )

    def assign_segment(score):
        if score >= 13:
            return "Champions"
        elif score >= 10:
            return "Loyal Customers"
        elif score >= 8:
            return "Potential Loyalists"
        elif score >= 6:
            return "At Risk"
        else:
            return "Hibernating / Lost"

    rfm["segment"] = rfm["rfm_score"].apply(assign_segment)
    return rfm


def main():
    data_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "student_edition", "data"
    )
    orders, items, customers, products = load_datasets(data_dir)
    cleaned = clean_orders_data(orders)
    kpis = compute_kpis(cleaned, items, products)
    print("=== OFFICIAL GROUND TRUTH KPIS ===")
    print(json.dumps(kpis, indent=2))


if __name__ == "__main__":
    main()
