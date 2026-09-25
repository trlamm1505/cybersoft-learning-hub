"""Validate data schemas, row counts, and foreign key integrity for Capstone DA-02."""

import os
import pandas as pd


def test_clean_data_sanity(clean_data_dir):
    df_wh = pd.read_csv(os.path.join(clean_data_dir, "warehouses.csv"))
    df_prod = pd.read_csv(os.path.join(clean_data_dir, "products.csv"))
    df_mov = pd.read_csv(os.path.join(clean_data_dir, "inventory_movements.csv"))
    df_po = pd.read_csv(os.path.join(clean_data_dir, "purchase_orders.csv"))
    df_aud = pd.read_csv(os.path.join(clean_data_dir, "inventory_audits.csv"))

    # 1. Row counts
    assert len(df_wh) == 3, f"Expected 3 warehouses, got {len(df_wh)}"
    assert len(df_prod) == 50, f"Expected 50 products, got {len(df_prod)}"
    assert len(df_mov) > 1500, f"Expected >1500 movements, got {len(df_mov)}"
    assert len(df_po) >= 70, f"Expected >=70 POs, got {len(df_po)}"
    assert len(df_aud) == 60, f"Expected 60 audits, got {len(df_aud)}"

    # 2. Foreign Key Integrity
    wh_ids = set(df_wh["warehouse_id"])
    prod_ids = set(df_prod["product_id"])

    assert set(df_mov["warehouse_id"]).issubset(
        wh_ids
    ), "Invalid warehouse_id in movements"
    assert set(df_mov["product_id"]).issubset(
        prod_ids
    ), "Invalid product_id in movements"
    assert set(df_aud["warehouse_id"]).issubset(
        wh_ids
    ), "Invalid warehouse_id in audits"
    assert set(df_aud["product_id"]).issubset(prod_ids), "Invalid product_id in audits"

    # 3. Movements positive quantities in clean
    assert (
        df_mov["quantity"] > 0
    ).all(), "Movements should have strictly positive quantities in clean data"
    assert set(df_mov["direction"].unique()) == {
        "IN",
        "OUT",
    }, "Direction must be IN or OUT"


def test_clean_data_no_nulls(clean_data_dir):
    for fname in ["warehouses.csv", "products.csv", "inventory_movements.csv"]:
        df = pd.read_csv(os.path.join(clean_data_dir, fname))
        assert (
            df.isnull().sum().sum() == 0
        ), f"Clean table {fname} contains unexpected null values"
