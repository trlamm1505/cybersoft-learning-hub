"""Generator script to export PostgreSQL Sandbox SQL script from DIRTY CSVs (Staging Schema)."""

import csv
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent.parent
DIRTY_DIR = REPO_ROOT / "Data-AI-Resource" / "BaoCao_Task06" / "data" / "dirty"
OUTPUT_SQL = BASE_DIR / "data" / "postgres_sandbox_retail_sales_dirty.sql"


def sql_val(v: str | None) -> str:
    """Format a value for SQL INSERT in staging table."""
    if v is None or v == "" or v.upper() == "NULL":
        return "NULL"
    v_clean = v.replace("'", "''")
    return f"'{v_clean}'"


# Staging schema without rigid PK/FK constraints to allow loading dirty anomalies
SCHEMA_DEFS = {
    "customers": [
        ("customer_id", "VARCHAR(50)"),  # Has duplicate PKs for cleaning exercise
        ("full_name", "VARCHAR(150)"),
        ("email", "VARCHAR(255)"),  # Has invalid regex/syntax
        ("phone", "VARCHAR(50)"),
        ("city", "VARCHAR(100)"),
        ("customer_segment", "VARCHAR(50)"),
        ("created_at", "VARCHAR(50)"),
    ],
    "employees": [
        ("employee_id", "VARCHAR(50)"),
        ("full_name", "VARCHAR(150)"),
        ("department", "VARCHAR(100)"),
        ("position", "VARCHAR(100)"),
        ("hire_date", "VARCHAR(50)"),
        ("region", "VARCHAR(50)"),
    ],
    "products": [
        ("product_id", "VARCHAR(50)"),
        ("product_name", "VARCHAR(255)"),
        ("category", "VARCHAR(100)"),
        ("cost_price", "NUMERIC(14,2)"),
        ("selling_price", "NUMERIC(14,2)"),  # Has negative/outlier pricing
        ("stock_quantity", "INT"),
        ("status", "VARCHAR(50)"),
    ],
    "orders": [
        ("order_id", "VARCHAR(50)"),
        ("customer_id", "VARCHAR(50)"),  # Has orphan foreign keys
        ("employee_id", "VARCHAR(50)"),
        ("order_date", "VARCHAR(50)"),  # Has missing/null dates
        ("shipping_date", "VARCHAR(50)"),
        ("order_status", "VARCHAR(50)"),
        ("payment_method", "VARCHAR(50)"),
        ("total_amount", "NUMERIC(16,2)"),
    ],
    "order_details": [
        ("order_detail_id", "VARCHAR(50)"),
        ("order_id", "VARCHAR(50)"),
        ("product_id", "VARCHAR(50)"),  # Has orphan foreign key PROD_9999
        ("quantity", "INT"),
        ("unit_price", "NUMERIC(14,2)"),
        ("discount", "NUMERIC(6,2)"),
        ("line_total", "NUMERIC(16,2)"),
    ],
}


def generate_dirty_sql():
    lines = [
        "-- ============================================================================",
        "-- CYBERSOFT DATA & AI LAB - POSTGRES SANDBOX SEED SCRIPT (DIRTY VARIANT)",
        "-- Dataset: Retail E-Commerce Sales (sales_v1 / ds-retail-ecommerce-sales-v1)",
        "-- Variant: DIRTY (Bản chứa lỗi thực tế phục vụ bài tập Data Cleaning / ETL / QA Test)",
        "-- Target Database: PostgreSQL 13+ / 14 / 15 / 16 / 17 (Staging Schema)",
        "-- Ghi chú: Dùng lược đồ Staging linh hoạt (không khóa cứng PK/FK) để nạp được dữ liệu lỗi",
        "-- Consumer Target: TTS 02 (Learning Hub Sandbox / Data Cleaning Lab)",
        "-- ============================================================================\n",
        "BEGIN;\n",
        "-- 1. Drop existing dirty/raw tables if present",
        "DROP TABLE IF EXISTS raw_order_details CASCADE;",
        "DROP TABLE IF EXISTS raw_orders CASCADE;",
        "DROP TABLE IF EXISTS raw_products CASCADE;",
        "DROP TABLE IF EXISTS raw_employees CASCADE;",
        "DROP TABLE IF EXISTS raw_customers CASCADE;\n",
    ]

    for tbl, cols in SCHEMA_DEFS.items():
        raw_tbl = f"raw_{tbl}"
        csv_file = DIRTY_DIR / f"{tbl}.csv"
        with open(csv_file, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()
        with open(csv_file, encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

        lines.append(
            "-- ============================================================================"
        )
        lines.append(f"-- Table: {raw_tbl} ({len(rows)} rows, SHA-256: {sha256})")
        lines.append(
            "-- ============================================================================"
        )
        lines.append(f"CREATE TABLE {raw_tbl} (")
        col_defs = [f"    {c_name} {c_def}" for c_name, c_def in cols]
        lines.append(",\n".join(col_defs))
        lines.append(");\n")

        col_names = [c[0] for c in cols]
        batch_size = 50
        cols_str = ", ".join(col_names)
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            lines.append(f"INSERT INTO {raw_tbl} ({cols_str}) VALUES")
            val_rows = []
            for r in batch:
                row_vals = [sql_val(r.get(c)) for c in col_names]
                val_rows.append(f"    ({', '.join(row_vals)})")
            lines.append(",\n".join(val_rows) + ";\n")

    lines.append("COMMIT;\n")
    lines.append(
        "-- ============================================================================"
    )
    lines.append("-- Queries phát hiện lỗi mẫu cho học viên thực hành:")
    lines.append("-- 1. Phát hiện trùng lặp khóa chính Customer ID:")
    lines.append(
        "--    SELECT customer_id, count(*) FROM raw_customers GROUP BY customer_id HAVING count(*) > 1;"
    )
    lines.append("-- 2. Phát hiện khóa ngoại mồ côi (Orphan FK Product ID):")
    lines.append(
        "--    SELECT od.order_detail_id, od.product_id FROM raw_order_details od LEFT JOIN raw_products p ON od.product_id = p.product_id WHERE p.product_id IS NULL;"
    )
    lines.append("-- 3. Phát hiện đơn hàng bị thiếu ngày order_date:")
    lines.append(
        "--    SELECT order_id, order_date FROM raw_orders WHERE order_date IS NULL OR order_date = '';"
    )
    lines.append(
        "-- ============================================================================\n"
    )
    lines.append("""SELECT 'raw_customers' AS table_name, count(*) AS total_rows FROM raw_customers
UNION ALL
SELECT 'raw_employees', count(*) FROM raw_employees
UNION ALL
SELECT 'raw_products', count(*) FROM raw_products
UNION ALL
SELECT 'raw_orders', count(*) FROM raw_orders
UNION ALL
SELECT 'raw_order_details', count(*) FROM raw_order_details;
""")

    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(
        f"Generated {OUTPUT_SQL} successfully! Size: {OUTPUT_SQL.stat().st_size:,} bytes"
    )


if __name__ == "__main__":
    generate_dirty_sql()
