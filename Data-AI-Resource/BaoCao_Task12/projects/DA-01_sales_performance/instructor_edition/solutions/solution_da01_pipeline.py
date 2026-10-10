"""CyberSoft Mart - Capstone DA-01 Official Python Solution Pipeline.

Reference implementation used for automated testing, benchmark verification,
and ground-truth reconciliation.
"""

import os
import json
import pandas as pd


class DA01SolutionPipeline:
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.orders = None
        self.order_items = None
        self.customers = None
        self.products = None
        self.cleaned_orders = None

    def load_data(self):
        self.orders = pd.read_csv(os.path.join(self.data_dir, "orders.csv"))
        self.order_items = pd.read_csv(os.path.join(self.data_dir, "order_items.csv"))
        self.customers = pd.read_csv(os.path.join(self.data_dir, "customers.csv"))
        self.products = pd.read_csv(os.path.join(self.data_dir, "products.csv"))
        return self

    def clean_data(self):
        # 1. Deduplicate by order_id
        df = self.orders.drop_duplicates(subset=["order_id"], keep="first").copy()
        # 2. Impute missing status: default to 'completed'
        df["order_status"] = (
            df["order_status"].fillna("completed").replace("", "completed")
        )
        self.cleaned_orders = df
        return self

    def compute_financial_kpis(self) -> dict:
        total_clean = len(self.cleaned_orders)
        completed = self.cleaned_orders[
            self.cleaned_orders["order_status"] == "completed"
        ].copy()
        cancelled = self.cleaned_orders[
            self.cleaned_orders["order_status"] == "cancelled"
        ]
        returned = self.cleaned_orders[
            self.cleaned_orders["order_status"] == "returned"
        ]

        net_rev = round(float(completed["total_amount"].sum()), 2)
        aov = round(float(completed["total_amount"].mean()), 2)
        cancel_rate = round((len(cancelled) / total_clean) * 100, 2)
        return_rate = round((len(returned) / total_clean) * 100, 2)

        # Merge for gross profit
        merged = self.order_items.merge(
            self.cleaned_orders[["order_id", "order_status"]],
            on="order_id",
            how="inner",
        )
        merged = merged.merge(
            self.products[["product_id", "cost_price"]], on="product_id", how="inner"
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
            "total_raw_orders": len(self.orders),
            "total_clean_orders": total_clean,
            "completed_orders_count": len(completed),
            "cancelled_orders_count": len(cancelled),
            "returned_orders_count": len(returned),
            "net_revenue_usd": net_rev,
            "average_order_value_usd": aov,
            "cancellation_rate_pct": cancel_rate,
            "return_rate_pct": return_rate,
            "gross_profit_usd": gross_profit,
            "gross_margin_pct": gross_margin_pct,
        }

    def compute_rfm(self) -> pd.DataFrame:
        completed = self.cleaned_orders[
            self.cleaned_orders["order_status"] == "completed"
        ].copy()
        completed["order_datetime"] = pd.to_datetime(completed["order_date"])
        snapshot_date = pd.to_datetime("2024-12-31")

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

        # Rank based scoring
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

    def compute_cohort_retention(self) -> pd.DataFrame:
        completed = self.cleaned_orders[
            self.cleaned_orders["order_status"] == "completed"
        ].copy()
        completed["order_month"] = pd.to_datetime(completed["order_date"]).dt.to_period(
            "M"
        )

        # First purchase month
        first_purchase = (
            completed.groupby("customer_id")["order_month"].min().reset_index()
        )
        first_purchase.columns = ["customer_id", "cohort_month"]

        merged = completed.merge(first_purchase, on="customer_id")
        merged["cohort_index"] = (
            merged["order_month"].dt.year - merged["cohort_month"].dt.year
        ) * 12 + (merged["order_month"].dt.month - merged["cohort_month"].dt.month)

        cohort_data = (
            merged.groupby(["cohort_month", "cohort_index"])["customer_id"]
            .nunique()
            .reset_index()
        )
        cohort_pivot = cohort_data.pivot(
            index="cohort_month", columns="cohort_index", values="customer_id"
        )
        return cohort_pivot


def run_pipeline(data_dir: str):
    pipe = DA01SolutionPipeline(data_dir)
    pipe.load_data().clean_data()
    kpis = pipe.compute_financial_kpis()
    rfm = pipe.compute_rfm()
    cohort = pipe.compute_cohort_retention()
    return kpis, rfm, cohort


if __name__ == "__main__":
    default_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "student_edition", "data"
    )
    kpis, rfm, cohort = run_pipeline(default_dir)
    print(json.dumps(kpis, indent=2))
    print("\nRFM Segments:")
    print(rfm["segment"].value_counts())
