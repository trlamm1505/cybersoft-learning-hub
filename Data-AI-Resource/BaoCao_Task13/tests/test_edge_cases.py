"""Verify presence and detection of the 8 business edge cases in dirty dataset."""

import os
import pandas as pd


def test_eight_business_edge_cases_present(dirty_data_dir):
    df_mov = pd.read_csv(os.path.join(dirty_data_dir, "inventory_movements.csv"))
    df_prod = pd.read_csv(os.path.join(dirty_data_dir, "products.csv"))
    df_po = pd.read_csv(os.path.join(dirty_data_dir, "purchase_orders.csv"))

    # Edge Case 1: Negative stock anomaly (outbound before inbound on same day)
    assert len(df_mov[df_mov["timestamp"].str.contains("2024-02-15")]) >= 2

    # Edge Case 2: In-transit transfer mismatch (Transfer out without matching transfer in)
    intransit = df_mov[df_mov["reference_doc"] == "TRF-INTRANSIT-88"]
    assert (
        len(intransit) == 1
    ), "Expected 1 unlinked in-transit transfer in dirty movements"
    assert intransit.iloc[0]["movement_type"] == "TRANSFER_OUT"

    # Edge Case 3: Scrap damaged items logged with negative quantity
    bad_scrap = df_mov[
        (df_mov["movement_type"] == "SCRAP_DAMAGED") & (df_mov["quantity"] < 0)
    ]
    assert (
        len(bad_scrap) >= 1
    ), "Expected negative quantity entry in dirty scrap records"

    # Edge Case 4: Customer return uninspected logged directly
    uninspected = df_mov[
        df_mov["notes"].str.contains("CHUA_KIEM_DINH_PENDING_QA", na=False)
    ]
    assert len(uninspected) >= 1, "Expected uninspected customer return record"

    # Edge Case 5: Audit shrinkage missing adjustment movement (clean has 29, dirty has 26)
    dirty_adj = len(df_mov[df_mov["movement_type"] == "AUDIT_ADJUSTMENT"])
    assert (
        dirty_adj < 29
    ), "Expected dropped audit adjustment movements in dirty dataset"

    # Edge Case 6: Duplicate barcode scan
    dup_rows = df_mov[df_mov["movement_id"].str.contains("-DUP", na=False)]
    assert len(dup_rows) >= 1, "Expected duplicate barcode scan movement"

    # Edge Case 7: Extreme lead time spike in PO
    late_po = df_po[df_po["po_id"] == "PO-2024-006"]
    assert len(late_po) >= 1
    assert late_po.iloc[0]["actual_delivery_date"] == "2024-05-20"

    # Edge Case 8: Null / 0.0 unit cost on some records
    zero_costs = df_prod[df_prod["unit_cost"] == 0.0]
    assert len(zero_costs) >= 1, "Expected products with 0.0 cost in dirty dataset"
    null_mov_costs = df_mov[df_mov["unit_cost"].isnull()]
    assert (
        len(null_mov_costs) >= 1
    ), "Expected movement records with null cost in dirty dataset"
