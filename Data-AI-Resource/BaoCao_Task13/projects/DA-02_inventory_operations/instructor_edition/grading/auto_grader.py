"""
Auto-Grader for Capstone DA-02: Inventory Optimization & Logistics Analytics.
Grades quantitative submissions (SQL or Python) against Ground Truth benchmark (60/100 points).
"""

import os
import sys
import json
import pandas as pd
import numpy as np

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def evaluate_student_results(student_metrics):
    kpi_file = os.path.join(PROJECT_ROOT, "instructor_edition", "expected_kpis.json")

    with open(kpi_file, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)["benchmark_metrics"]

    score = 0.0
    feedback = []

    # Check 1: Ending Inventory Units (10 pts)
    target_units = ground_truth["ending_physical_inventory_units"]
    actual_units = student_metrics.get("ending_physical_inventory_units")
    if actual_units is not None and int(actual_units) == target_units:
        score += 10.0
        feedback.append(
            f"[PASS 10/10] Ending Inventory Units match perfectly ({actual_units} == {target_units})."
        )
    else:
        feedback.append(
            f"[FAIL 0/10] Ending Inventory Units mismatch (Got: {actual_units}, Expected: {target_units})."
        )

    # Check 2: Ending Inventory Valuation (10 pts)
    target_val = ground_truth["ending_inventory_valuation_usd"]
    actual_val = student_metrics.get("ending_inventory_valuation_usd")
    if actual_val is not None and abs(float(actual_val) - target_val) <= 0.05:
        score += 10.0
        feedback.append(
            f"[PASS 10/10] Ending Inventory Valuation match perfectly (USD {actual_val:,.2f} == USD {target_val:,.2f})."
        )
    else:
        feedback.append(
            f"[FAIL 0/10] Ending Valuation mismatch (Got: {actual_val}, Expected: {target_val})."
        )

    # Check 3: Total COGS (10 pts)
    target_cogs = ground_truth["total_cogs_usd"]
    actual_cogs = student_metrics.get("total_cogs_usd")
    if actual_cogs is not None and abs(float(actual_cogs) - target_cogs) <= 0.05:
        score += 10.0
        feedback.append(
            f"[PASS 10/10] Total COGS match perfectly (USD {actual_cogs:,.2f} == USD {target_cogs:,.2f})."
        )
    else:
        feedback.append(
            f"[FAIL 0/10] Total COGS mismatch (Got: {actual_cogs}, Expected: {target_cogs})."
        )

    # Check 4: Inventory Turnover Ratio (10 pts)
    target_turnover = ground_truth["inventory_turnover_ratio"]
    actual_turnover = student_metrics.get("inventory_turnover_ratio")
    if (
        actual_turnover is not None
        and abs(float(actual_turnover) - target_turnover) <= 0.02
    ):
        score += 10.0
        feedback.append(
            f"[PASS 10/10] Inventory Turnover match perfectly ({actual_turnover:.2f}x == {target_turnover:.2f}x)."
        )
    else:
        feedback.append(
            f"[FAIL 0/10] Turnover mismatch (Got: {actual_turnover}, Expected: {target_turnover})."
        )

    # Check 5: Warehouse Distribution (10 pts)
    target_wh = ground_truth["warehouse_distribution"]
    actual_wh = student_metrics.get("warehouse_distribution", {})
    wh_match = True
    for wh_id, data in target_wh.items():
        if wh_id not in actual_wh or actual_wh[wh_id].get("units") != data["units"]:
            wh_match = False
            break
    if wh_match and len(actual_wh) == len(target_wh):
        score += 10.0
        feedback.append(
            "[PASS 10/10] Warehouse stock distribution matches across all 3 DCs."
        )
    else:
        feedback.append(
            f"[FAIL 0/10] Warehouse distribution mismatch (Got: {actual_wh})."
        )

    # Check 6: Alerts & Exceptions (10 pts: 5 pts ROP alerts + 5 pts Stockouts)
    target_rop = ground_truth["reorder_point_alerts_count"]
    target_stockout = ground_truth["out_of_stock_skus_count"]
    actual_rop = student_metrics.get("reorder_point_alerts_count")
    actual_stockout = student_metrics.get("out_of_stock_skus_count")

    sub_score = 0.0
    if actual_rop is not None and int(actual_rop) == target_rop:
        sub_score += 5.0
        feedback.append(
            f"[PASS 5/5] Reorder point alerts match perfectly ({actual_rop} SKUs)."
        )
    else:
        feedback.append(
            f"[FAIL 0/5] ROP alerts mismatch (Got: {actual_rop}, Expected: {target_rop})."
        )

    if actual_stockout is not None and int(actual_stockout) == target_stockout:
        sub_score += 5.0
        feedback.append(
            f"[PASS 5/5] Out-of-stock SKUs match perfectly ({actual_stockout} SKUs)."
        )
    else:
        feedback.append(
            f"[FAIL 0/5] Stockouts mismatch (Got: {actual_stockout}, Expected: {target_stockout})."
        )

    score += sub_score
    return score, feedback


def grade_solution():
    clean_dir = os.path.join(PROJECT_ROOT, "student_edition", "data", "clean")

    df_mov = pd.read_csv(os.path.join(clean_dir, "inventory_movements.csv"))
    df_prod = pd.read_csv(os.path.join(clean_dir, "products.csv"))

    df_mov["qty_signed"] = np.where(
        df_mov["direction"] == "IN", df_mov["quantity"], -df_mov["quantity"]
    )
    total_units = int(df_mov["qty_signed"].sum())

    prod_ending = df_mov.groupby("product_id")["qty_signed"].sum().reset_index()
    prod_ending = prod_ending.merge(
        df_prod[["product_id", "unit_cost", "reorder_point"]], on="product_id"
    )
    total_val = float((prod_ending["qty_signed"] * prod_ending["unit_cost"]).sum())

    df_sales = df_mov[df_mov["movement_type"] == "OUTBOUND_SALE"]
    total_cogs = float((df_sales["quantity"] * df_sales["unit_cost"]).sum())

    df_init = df_mov[df_mov["reference_doc"] == "INIT-BALANCE-2024"]
    beg_val = float((df_init["quantity"] * df_init["unit_cost"]).sum())
    avg_val = (beg_val + total_val) / 2.0
    turnover = float(total_cogs / avg_val)

    wh_group = df_mov.groupby("warehouse_id")["qty_signed"].sum().to_dict()
    wh_dist = {w: {"units": int(q)} for w, q in wh_group.items()}

    stockouts = int((prod_ending["qty_signed"] <= 0).sum())
    rop_alerts = int((prod_ending["qty_signed"] <= prod_ending["reorder_point"]).sum())

    metrics = {
        "ending_physical_inventory_units": total_units,
        "ending_inventory_valuation_usd": total_val,
        "total_cogs_usd": total_cogs,
        "inventory_turnover_ratio": turnover,
        "warehouse_distribution": wh_dist,
        "out_of_stock_skus_count": stockouts,
        "reorder_point_alerts_count": rop_alerts,
    }

    score, feedback = evaluate_student_results(metrics)
    print("=" * 70)
    print("CYBERSOFT AUTO-GRADER RESULTS (CAPSTONE DA-02)")
    print("=" * 70)
    for f in feedback:
        print(" ", f)
    print("-" * 70)
    print(f" TOTAL AUTOMATED SCORE: {score:.1f} / 60.0 POINTS")
    print("=" * 70)
    return score >= 60.0


if __name__ == "__main__":
    success = grade_solution()
    sys.exit(0 if success else 1)
