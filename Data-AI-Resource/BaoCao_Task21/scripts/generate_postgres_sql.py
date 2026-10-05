"""Generator script to export PostgreSQL Sandbox SQL script from clean CSVs."""

import csv
import hashlib
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent.parent
CLEAN_DIR = REPO_ROOT / "Data-AI-Resource" / "BaoCao_Task06" / "data" / "clean"
OUTPUT_SQL = BASE_DIR / "data" / "postgres_sandbox_retail_sales_clean.sql"


def sql_val(v: str | None, col_type: str) -> str:
    """Format a value for SQL INSERT."""
    if v is None or v == "" or v.upper() == "NULL":
        return "NULL"
    v_clean = v.replace("'", "''")
    if "INT" in col_type or "NUMERIC" in col_type or "FLOAT" in col_type:
        return v.strip()
    return f"'{v_clean}'"


SCHEMA_DEFS = {
    "customers": [
        ("customer_id", "VARCHAR(10) PRIMARY KEY"),
        ("full_name", "VARCHAR(100) NOT NULL"),
        ("email", "VARCHAR(150) NOT NULL"),
        ("phone", "VARCHAR(15) NOT NULL"),
        ("city", "VARCHAR(50) NOT NULL"),
        ("customer_segment", "VARCHAR(20) NOT NULL"),
        ("created_at", "TIMESTAMP NOT NULL"),
    ],
    "employees": [
        ("employee_id", "VARCHAR(10) PRIMARY KEY"),
        ("full_name", "VARCHAR(100) NOT NULL"),
        ("department", "VARCHAR(50) NOT NULL"),
        ("position", "VARCHAR(50) NOT NULL"),
        ("hire_date", "DATE NOT NULL"),
        ("region", "VARCHAR(30) NOT NULL"),
    ],
    "products": [
        ("product_id", "VARCHAR(10) PRIMARY KEY"),
        ("product_name", "VARCHAR(150) NOT NULL"),
        ("category", "VARCHAR(50) NOT NULL"),
        ("cost_price", "NUMERIC(12,2) NOT NULL"),
        ("selling_price", "NUMERIC(12,2) NOT NULL"),
        ("stock_quantity", "INT NOT NULL"),
        ("status", "VARCHAR(20) NOT NULL"),
    ],
    "orders": [
        ("order_id", "VARCHAR(10) PRIMARY KEY"),
        ("customer_id", "VARCHAR(10) NOT NULL REFERENCES customers(customer_id)"),
        ("employee_id", "VARCHAR(10) NOT NULL REFERENCES employees(employee_id)"),
        ("order_date", "DATE NOT NULL"),
        ("shipping_date", "DATE"),
        ("order_status", "VARCHAR(20) NOT NULL"),
        ("payment_method", "VARCHAR(30) NOT NULL"),
        ("total_amount", "NUMERIC(14,2) NOT NULL"),
    ],
    "order_details": [
        ("order_detail_id", "VARCHAR(12) PRIMARY KEY"),
        ("order_id", "VARCHAR(10) NOT NULL REFERENCES orders(order_id)"),
        ("product_id", "VARCHAR(10) NOT NULL REFERENCES products(product_id)"),
        ("quantity", "INT NOT NULL"),
        ("unit_price", "NUMERIC(12,2) NOT NULL"),
        ("discount", "NUMERIC(4,2) NOT NULL"),
        ("line_total", "NUMERIC(14,2) NOT NULL"),
    ],
}


def generate_sql():
    lines = [
        "-- ============================================================================",
        "-- CYBERSOFT DATA & AI LAB - POSTGRES SANDBOX SEED SCRIPT",
        "-- Dataset: Retail E-Commerce Sales (sales_v1 / ds-retail-ecommerce-sales-v1)",
        "-- Variant: CLEAN (Bản sạch đã chuẩn hóa 3NF, bảo đảm toàn vẹn khóa ngoại FK)",
        "-- Target Database: PostgreSQL 13+ / 14 / 15 / 16 / 17",
        "-- Consumer Target: TTS 02 (Learning Hub Sandbox / AI Lab)",
        "-- ============================================================================\n",
        "BEGIN;\n",
        "-- 1. Drop existing tables if present (Reverse FK order)",
        "DROP TABLE IF EXISTS order_details CASCADE;",
        "DROP TABLE IF EXISTS orders CASCADE;",
        "DROP TABLE IF EXISTS products CASCADE;",
        "DROP TABLE IF EXISTS employees CASCADE;",
        "DROP TABLE IF EXISTS customers CASCADE;\n",
    ]

    for tbl, cols in SCHEMA_DEFS.items():
        csv_file = CLEAN_DIR / f"{tbl}.csv"
        with open(csv_file, "rb") as f:
            sha256 = hashlib.sha256(f.read()).hexdigest()
        with open(csv_file, encoding="utf-8") as f:
            rows = list(csv.DictReader(f))

        lines.append(
            "-- ============================================================================"
        )
        lines.append(f"-- Table: {tbl} ({len(rows)} rows, SHA-256: {sha256})")
        lines.append(
            "-- ============================================================================"
        )
        lines.append(f"CREATE TABLE {tbl} (")
        col_defs = [f"    {c_name} {c_def}" for c_name, c_def in cols]
        lines.append(",\n".join(col_defs))
        lines.append(");\n")

        col_names = [c[0] for c in cols]
        col_types = {c[0]: c[1] for c in cols}

        batch_size = 50
        cols_str = ", ".join(col_names)
        for i in range(0, len(rows), batch_size):
            batch = rows[i : i + batch_size]
            lines.append(f"INSERT INTO {tbl} ({cols_str}) VALUES")
            val_rows = []
            for r in batch:
                row_vals = [sql_val(r.get(c), col_types[c]) for c in col_names]
                val_rows.append(f"    ({', '.join(row_vals)})")
            lines.append(",\n".join(val_rows) + ";\n")

    lines.append("-- Foreign Key Indexes for Fast Join & Queries")
    lines.append("CREATE INDEX idx_orders_customer_id ON orders(customer_id);")
    lines.append("CREATE INDEX idx_orders_employee_id ON orders(employee_id);")
    lines.append("CREATE INDEX idx_order_details_order_id ON order_details(order_id);")
    lines.append(
        "CREATE INDEX idx_order_details_product_id ON order_details(product_id);\n"
    )

    lines.append("COMMIT;\n")
    lines.append(
        "-- ============================================================================"
    )
    lines.append("-- Post-Verification Query (Run to verify counts)")
    lines.append(
        "-- ============================================================================"
    )
    lines.append("""SELECT 'customers' AS table_name, count(*) AS total_rows FROM customers
UNION ALL
SELECT 'employees', count(*) FROM employees
UNION ALL
SELECT 'products', count(*) FROM products
UNION ALL
SELECT 'orders', count(*) FROM orders
UNION ALL
SELECT 'order_details', count(*) FROM order_details;
""")

    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(
        f"Generated {OUTPUT_SQL} successfully! Size: {OUTPUT_SQL.stat().st_size:,} bytes"
    )


if __name__ == "__main__":
    generate_sql()
