"""Master Generator: Export ALL CyberSoft Datasets to PostgreSQL Sandbox SQL Scripts.

Generates PostgreSQL DDL + INSERT statements for:
1. Task 06: Retail E-Commerce Sales (customers, employees, products, orders, order_details)
2. Task 07: HR Operations & Attendance (employees, attendance, kpi_evaluations, training_records, turnovers)
3. Task 05: Student Data Quality Records (students)
4. Task 13: DA-02 Inventory & Supply Chain Operations (warehouses, products, purchase_orders, movements, dispatches, audits)
5. Master Seed Script: postgres_sandbox_all_datasets_master_clean.sql
"""

import csv
import hashlib
import sys
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = BASE_DIR.parent.parent


def sql_val(v: str | None, col_type: str = "VARCHAR") -> str:
    """Format a value for SQL INSERT."""
    if v is None or v == "" or str(v).upper() == "NULL":
        return "NULL"
    v_str = str(v).strip()
    if (
        "INT" in col_type
        or "NUMERIC" in col_type
        or "DECIMAL" in col_type
        or "FLOAT" in col_type
    ):
        try:
            # Check if valid number
            float(v_str)
            return v_str
        except ValueError:
            return "NULL"
    v_clean = v_str.replace("'", "''")
    return f"'{v_clean}'"


def infer_pg_type(col_name: str, sample_val: str) -> str:
    """Infer PostgreSQL column type from column name and sample value."""
    col_lower = col_name.lower()
    if "id" in col_lower or "code" in col_lower:
        return "VARCHAR(50)"
    if (
        "date" in col_lower
        or "birth" in col_lower
        or "hire" in col_lower
        or "work_date" in col_lower
    ):
        return "DATE"
    if "time" in col_lower and "overtime" not in col_lower:
        return "TIME"
    if (
        "salary" in col_lower
        or "amount" in col_lower
        or "price" in col_lower
        or "cost" in col_lower
        or "total" in col_lower
    ):
        return "NUMERIC(14,2)"
    if (
        "quantity" in col_lower
        or "count" in col_lower
        or "score" in col_lower
        or "hours" in col_lower
    ):
        if "." in sample_val:
            return "NUMERIC(6,2)"
        return "INT"
    if "email" in col_lower:
        return "VARCHAR(150)"
    if "phone" in col_lower:
        return "VARCHAR(25)"
    return "VARCHAR(150)"


def export_dataset(
    dataset_name: str,
    table_files: dict[str, Path],
    output_clean_sql: Path,
    output_dirty_sql: Path | None = None,
    dirty_files: dict[str, Path] | None = None,
    schema: str | None = None,
):
    """Export a set of CSV tables to PostgreSQL clean and dirty scripts."""
    print("\n========================================================")
    print(f"Generating PostgreSQL SQL for: {dataset_name}")
    print("========================================================")

    # 1. Clean Script
    lines_clean = [
        "-- ============================================================================",
        "-- CYBERSOFT DATA & AI LAB - POSTGRES SANDBOX SEED SCRIPT",
        f"-- Dataset: {dataset_name} (Variant: CLEAN)",
        "-- ============================================================================\n",
        "BEGIN;\n",
    ]

    if schema:
        lines_clean.append(f"CREATE SCHEMA IF NOT EXISTS {schema};")
        lines_clean.append(f"SET search_path TO {schema};\n")

    # Drops
    for tbl in reversed(list(table_files.keys())):
        target = f"{schema}.{tbl}" if schema else tbl
        lines_clean.append(f"DROP TABLE IF EXISTS {target} CASCADE;")
    lines_clean.append("")

    for tbl, csv_path in table_files.items():
        if not csv_path.exists():
            print(f"Warning: {csv_path} does not exist, skipping table {tbl}")
            continue

        with open(csv_path, "rb") as f:
            sha = hashlib.sha256(f.read()).hexdigest()

        with open(csv_path, encoding="utf-8") as f:
            reader = list(csv.DictReader(f))

        if not reader:
            continue

        cols = list(reader[0].keys())
        lines_clean.append(f"-- Table: {tbl} ({len(reader)} rows, SHA-256: {sha})")
        lines_clean.append(f"CREATE TABLE {tbl} (")
        col_defs = []
        col_types = {}
        for c in cols:
            sample_val = next((r[c] for r in reader if r.get(c)), "")
            t = infer_pg_type(c, sample_val)
            col_types[c] = t
            # First ID column as PK candidate
            if c == cols[0] and "id" in c.lower():
                col_defs.append(f"    {c} {t} PRIMARY KEY")
            else:
                col_defs.append(f"    {c} {t}")
        lines_clean.append(",\n".join(col_defs))
        lines_clean.append(");\n")

        # Inserts in batches
        batch_size = 50
        cols_str = ", ".join(cols)
        for i in range(0, len(reader), batch_size):
            batch = reader[i : i + batch_size]
            lines_clean.append(f"INSERT INTO {tbl} ({cols_str}) VALUES")
            val_rows = []
            for r in batch:
                row_vals = [sql_val(r.get(c), col_types[c]) for c in cols]
                val_rows.append(f"    ({', '.join(row_vals)})")
            lines_clean.append(",\n".join(val_rows) + ";\n")

    lines_clean.append("COMMIT;\n")

    output_clean_sql.parent.mkdir(parents=True, exist_ok=True)
    with open(output_clean_sql, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_clean))
    print(
        f"-> Clean SQL saved: {output_clean_sql} ({output_clean_sql.stat().st_size:,} bytes)"
    )

    # 2. Dirty Script (if dirty_files provided)
    if output_dirty_sql and dirty_files:
        lines_dirty = [
            "-- ============================================================================",
            "-- CYBERSOFT DATA & AI LAB - POSTGRES SANDBOX SEED SCRIPT (DIRTY VARIANT)",
            f"-- Dataset: {dataset_name} (Variant: DIRTY Staging)",
            "-- ============================================================================\n",
            "BEGIN;\n",
        ]
        for tbl in reversed(list(dirty_files.keys())):
            lines_dirty.append(f"DROP TABLE IF EXISTS raw_{tbl} CASCADE;")
        lines_dirty.append("")

        for tbl, csv_path in dirty_files.items():
            if not csv_path.exists():
                continue
            with open(csv_path, "rb") as f:
                sha = hashlib.sha256(f.read()).hexdigest()
            with open(csv_path, encoding="utf-8") as f:
                reader = list(csv.DictReader(f))
            if not reader:
                continue

            cols = list(reader[0].keys())
            lines_dirty.append(
                f"-- Staging Table: raw_{tbl} ({len(reader)} rows, SHA-256: {sha})"
            )
            lines_dirty.append(f"CREATE TABLE raw_{tbl} (")
            col_defs = [f"    {c} VARCHAR(255)" for c in cols]
            lines_dirty.append(",\n".join(col_defs))
            lines_dirty.append(");\n")

            batch_size = 50
            cols_str = ", ".join(cols)
            for i in range(0, len(reader), batch_size):
                batch = reader[i : i + batch_size]
                lines_dirty.append(f"INSERT INTO raw_{tbl} ({cols_str}) VALUES")
                val_rows = []
                for r in batch:
                    row_vals = [sql_val(r.get(c), "VARCHAR") for c in cols]
                    val_rows.append(f"    ({', '.join(row_vals)})")
                lines_dirty.append(",\n".join(val_rows) + ";\n")

        lines_dirty.append("COMMIT;\n")
        output_dirty_sql.parent.mkdir(parents=True, exist_ok=True)
        with open(output_dirty_sql, "w", encoding="utf-8") as f:
            f.write("\n".join(lines_dirty))
        print(
            f"-> Dirty SQL saved: {output_dirty_sql} ({output_dirty_sql.stat().st_size:,} bytes)"
        )


def main():
    # 1. Task 07: HR Operations & Attendance
    t7_clean_dir = REPO_ROOT / "Data-AI-Resource" / "BaoCao_Task07" / "data" / "clean"
    t7_dirty_dir = REPO_ROOT / "Data-AI-Resource" / "BaoCao_Task07" / "data" / "dirty"
    t7_tables = [
        "employees",
        "attendance",
        "kpi_evaluations",
        "training_records",
        "turnovers",
    ]
    t7_clean_map = {t: t7_clean_dir / f"{t}.csv" for t in t7_tables}
    t7_dirty_map = {t: t7_dirty_dir / f"{t}.csv" for t in t7_tables}

    export_dataset(
        "HR Operations & Attendance (ds-hr-operations-attendance-v1)",
        t7_clean_map,
        BASE_DIR / "data" / "postgres_sandbox_hr_operations_clean.sql",
        BASE_DIR / "data" / "postgres_sandbox_hr_operations_dirty.sql",
        t7_dirty_map,
    )
    # Also save in Task 07 directory
    export_dataset(
        "HR Operations & Attendance (ds-hr-operations-attendance-v1)",
        t7_clean_map,
        REPO_ROOT
        / "Data-AI-Resource"
        / "BaoCao_Task07"
        / "data"
        / "postgres_sandbox_hr_operations_clean.sql",
        REPO_ROOT
        / "Data-AI-Resource"
        / "BaoCao_Task07"
        / "data"
        / "postgres_sandbox_hr_operations_dirty.sql",
        t7_dirty_map,
    )

    # 2. Task 05: Student Data Quality Records
    t5_dir = REPO_ROOT / "Data-AI-Resource" / "BaoCao_Task05" / "data_samples"
    t5_clean_map = {"students": t5_dir / "clean_students.csv"}
    t5_dirty_map = {"students": t5_dir / "dirty_students.csv"}

    export_dataset(
        "Student Data Quality Benchmark (students_record)",
        t5_clean_map,
        BASE_DIR / "data" / "postgres_sandbox_students_clean.sql",
        BASE_DIR / "data" / "postgres_sandbox_students_dirty.sql",
        t5_dirty_map,
    )

    # 3. Task 13: DA-02 Inventory Operations & Supply Chain
    t13_clean_dir = (
        REPO_ROOT
        / "Data-AI-Resource"
        / "BaoCao_Task13"
        / "projects"
        / "DA-02_inventory_operations"
        / "student_edition"
        / "data"
        / "clean"
    )
    t13_dirty_dir = (
        REPO_ROOT
        / "Data-AI-Resource"
        / "BaoCao_Task13"
        / "projects"
        / "DA-02_inventory_operations"
        / "student_edition"
        / "data"
        / "dirty"
    )
    t13_tables = [
        "warehouses",
        "products",
        "purchase_orders",
        "inventory_movements",
        "sales_dispatches",
        "inventory_audits",
    ]
    t13_clean_map = {t: t13_clean_dir / f"{t}.csv" for t in t13_tables}
    t13_dirty_map = {t: t13_dirty_dir / f"{t}.csv" for t in t13_tables}

    export_dataset(
        "Inventory Operations & Supply Chain (DA-02)",
        t13_clean_map,
        BASE_DIR / "data" / "postgres_sandbox_inventory_clean.sql",
        BASE_DIR / "data" / "postgres_sandbox_inventory_dirty.sql",
        t13_dirty_map,
    )

    # 4. Master All-In-One Clean SQL with Schema Namespaces
    master_sql_path = (
        BASE_DIR / "data" / "postgres_sandbox_all_datasets_master_clean.sql"
    )
    print("\n========================================================")
    print(f"Creating Master All-In-One Clean SQL: {master_sql_path.name}")
    print("========================================================")

    # Temporary schema-isolated files for master
    m_retail = BASE_DIR / "data" / "_tmp_retail.sql"
    m_hr = BASE_DIR / "data" / "_tmp_hr.sql"
    m_edu = BASE_DIR / "data" / "_tmp_edu.sql"
    m_inv = BASE_DIR / "data" / "_tmp_inv.sql"

    t6_clean_dir = REPO_ROOT / "Data-AI-Resource" / "BaoCao_Task06" / "data" / "clean"
    t6_tables = ["customers", "employees", "products", "orders", "order_details"]
    t6_clean_map = {t: t6_clean_dir / f"{t}.csv" for t in t6_tables}

    export_dataset(
        "Retail Sales (retail schema)", t6_clean_map, m_retail, schema="retail"
    )
    export_dataset("HR Operations (hr schema)", t7_clean_map, m_hr, schema="hr")
    export_dataset(
        "Student Records (education schema)", t5_clean_map, m_edu, schema="education"
    )
    export_dataset(
        "Inventory (inventory schema)", t13_clean_map, m_inv, schema="inventory"
    )

    with open(master_sql_path, "w", encoding="utf-8") as out_f:
        out_f.write(
            "-- ============================================================================\n"
            "-- CYBERSOFT DATA & AI LAB - MASTER POSTGRES SANDBOX SEED SCRIPT (ALL 4 DATASETS)\n"
            "-- Organized into 4 Schema Namespaces to Prevent Table Name Collisions:\n"
            "--   1. retail.*    (Task 06: customers, employees, products, orders, order_details)\n"
            "--   2. hr.*        (Task 07: employees, attendance, kpi_evaluations, training_records, turnovers)\n"
            "--   3. education.* (Task 05: students)\n"
            "--   4. inventory.* (Task 13: warehouses, products, purchase_orders, movements, dispatches, audits)\n"
            "-- ============================================================================\n\n"
        )
        for tmp_file in [m_retail, m_hr, m_edu, m_inv]:
            if tmp_file.exists():
                with open(tmp_file, encoding="utf-8") as inf:
                    out_f.write(inf.read())
                    out_f.write("\n\n")
                tmp_file.unlink(missing_ok=True)

        out_f.write(
            "-- Set search path to access all schemas easily\n"
            "SET search_path TO retail, hr, education, inventory, public;\n\n"
            "-- Post-verification query\n"
            "SELECT 'retail.customers' AS tbl, count(*) FROM retail.customers\n"
            "UNION ALL SELECT 'retail.orders', count(*) FROM retail.orders\n"
            "UNION ALL SELECT 'hr.employees', count(*) FROM hr.employees\n"
            "UNION ALL SELECT 'hr.attendance', count(*) FROM hr.attendance\n"
            "UNION ALL SELECT 'education.students', count(*) FROM education.students\n"
            "UNION ALL SELECT 'inventory.warehouses', count(*) FROM inventory.warehouses;\n"
        )

    print(
        f"SUCCESS: Master All-In-One SQL generated: {master_sql_path} ({master_sql_path.stat().st_size:,} bytes)"
    )


if __name__ == "__main__":
    main()
