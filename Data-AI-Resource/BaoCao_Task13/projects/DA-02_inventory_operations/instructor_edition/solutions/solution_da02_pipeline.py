"""
CyberSoft Data & AI Lab — Capstone DA-02: Inventory Optimization & Logistics Pipeline.
Official Instructor Python Solution implementing full ETL, stock reconciliation,
financial valuation, ROP safety analysis, and export capabilities.
"""

import os
import sys
import pandas as pd
import numpy as np

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def run_da02_pipeline():
    clean_dir = os.path.join(PROJECT_ROOT, "student_edition", "data", "clean")

    print("=" * 80)
    print("CYBERSOFT INVENTORY & OPERATIONS ANALYTICS PIPELINE (CAPSTONE DA-02)")
    print("=" * 80)

    # 1. Ingest Data
    df_mov = pd.read_csv(os.path.join(clean_dir, "inventory_movements.csv"))
    df_prod = pd.read_csv(os.path.join(clean_dir, "products.csv"))
    df_wh = pd.read_csv(os.path.join(clean_dir, "warehouses.csv"))
    df_aud = pd.read_csv(os.path.join(clean_dir, "inventory_audits.csv"))

    print(
        f"[1] Ingested {len(df_mov)} movements, {len(df_prod)} SKUs, {len(df_wh)} warehouses."
    )

    # 2. Reconcile Stock Movements
    df_mov["qty_signed"] = np.where(
        df_mov["direction"] == "IN", df_mov["quantity"], -df_mov["quantity"]
    )
    total_physical_units = int(df_mov["qty_signed"].sum())

    # 3. Product Level Ending Valuation
    prod_stock = df_mov.groupby("product_id")["qty_signed"].sum().reset_index()
    prod_stock = prod_stock.merge(df_prod, on="product_id")
    prod_stock["ending_valuation_usd"] = (
        prod_stock["qty_signed"] * prod_stock["unit_cost"]
    )
    total_valuation_usd = float(prod_stock["ending_valuation_usd"].sum())

    # 4. Financial KPIs (COGS & Turnover)
    df_sales = df_mov[df_mov["movement_type"] == "OUTBOUND_SALE"]
    total_cogs_usd = float((df_sales["quantity"] * df_sales["unit_cost"]).sum())

    df_init = df_mov[df_mov["reference_doc"] == "INIT-BALANCE-2024"]
    beg_val_usd = float((df_init["quantity"] * df_init["unit_cost"]).sum())
    avg_inventory_usd = (beg_val_usd + total_valuation_usd) / 2.0
    turnover_ratio = float(total_cogs_usd / avg_inventory_usd)
    doh_days = float(365.0 / turnover_ratio)

    # 5. Warehouse Breakdown
    wh_summary = df_mov.groupby("warehouse_id")["qty_signed"].sum().to_dict()

    # 6. Safety Stock & Reorder Point Alerts
    stockout_skus = prod_stock[prod_stock["qty_signed"] <= 0]["product_id"].tolist()
    rop_alerts = prod_stock[prod_stock["qty_signed"] <= prod_stock["reorder_point"]][
        "product_id"
    ].tolist()

    # 7. Audit Shrinkage & Loss
    df_shrink = df_aud[df_aud["discrepancy_qty"] < 0].merge(df_prod, on="product_id")
    total_shrinkage_usd = float(
        abs(df_shrink["discrepancy_qty"] * df_shrink["unit_cost"]).sum()
    )

    df_scrap = df_mov[df_mov["movement_type"] == "SCRAP_DAMAGED"]
    total_scrap_usd = float((df_scrap["quantity"] * df_scrap["unit_cost"]).sum())

    results = {
        "ending_physical_inventory_units": total_physical_units,
        "ending_inventory_valuation_usd": round(total_valuation_usd, 2),
        "total_cogs_usd": round(total_cogs_usd, 2),
        "average_inventory_usd": round(avg_inventory_usd, 2),
        "inventory_turnover_ratio": round(turnover_ratio, 2),
        "days_of_inventory_on_hand_doh": round(doh_days, 1),
        "warehouse_distribution": {w: {"units": int(q)} for w, q in wh_summary.items()},
        "out_of_stock_skus_count": len(stockout_skus),
        "reorder_point_alerts_count": len(rop_alerts),
        "total_shrinkage_loss_usd": round(total_shrinkage_usd, 2),
        "total_scrap_loss_usd": round(total_scrap_usd, 2),
    }

    print("\n[PIPELINE SUMMARY RESULTS]")
    print(f"- Ending Units: {results['ending_physical_inventory_units']:,} units")
    print(f"- Ending Valuation: USD {results['ending_inventory_valuation_usd']:,.2f}")
    print(f"- Total COGS: USD {results['total_cogs_usd']:,.2f}")
    print(
        f"- Turnover Ratio: {results['inventory_turnover_ratio']:.2f}x (DOH: {results['days_of_inventory_on_hand_doh']} days)"
    )
    print(
        f"- Stockouts: {results['out_of_stock_skus_count']} | ROP Alerts: {results['reorder_point_alerts_count']}"
    )
    print(
        f"- Shrinkage Loss: USD {results['total_shrinkage_loss_usd']:,.2f} | Scrap Loss: USD {results['total_scrap_loss_usd']:,.2f}"
    )
    print("=" * 80)

    return results


if __name__ == "__main__":
    run_da02_pipeline()
