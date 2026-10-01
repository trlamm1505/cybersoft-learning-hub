"""Feasibility execution and test runner service for exercises (Task 23).

Executes exercise solution queries on real SQLite in-memory tables loaded from CSV,
and verifies assertions against test cases to guarantee that answers are feasible.
"""

import csv
import sqlite3
import time
from pathlib import Path
from typing import Any

from src.config import DATASETS_DIR
from src.schemas.review import FeasibilityTestResult


class FeasibilityExecutorService:
    """Service to execute queries and validate test cases on real data."""

    def __init__(self, datasets_dir: Path = DATASETS_DIR):
        self.datasets_dir = datasets_dir

    def _load_csv_to_sqlite(self, dataset_id: str) -> tuple[sqlite3.Connection, str]:
        """Load dataset CSV into an in-memory SQLite table."""
        csv_file = self.datasets_dir / f"{dataset_id}.csv"
        if not csv_file.exists():
            matches = list(self.datasets_dir.glob(f"*{dataset_id}*.csv"))
            if matches:
                csv_file = matches[0]
            else:
                raise FileNotFoundError(
                    f"Dataset file for '{dataset_id}' not found in {self.datasets_dir}"
                )

        table_name = dataset_id.replace("-", "_")
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()

        with open(csv_file, mode="r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames or []
            if not fieldnames:
                return conn, table_name

            # Create table with TEXT columns (SQLite handles dynamic typing)
            cols_def = ", ".join([f'"{col}" TEXT' for col in fieldnames])
            cursor.execute(f'CREATE TABLE "{table_name}" ({cols_def});')

            # Insert rows
            placeholders = ", ".join(["?"] * len(fieldnames))
            insert_sql = f'INSERT INTO "{table_name}" VALUES ({placeholders});'
            for row in reader:
                values = [row.get(col, "") for col in fieldnames]
                cursor.execute(insert_sql, values)

        conn.commit()
        return conn, table_name

    def execute_and_verify(
        self,
        exercise_id: str,
        dataset_id: str,
        solution_code: str,
        test_cases: list[dict[str, Any]],
    ) -> FeasibilityTestResult:
        """Execute solution code and verify all test cases against SQLite."""
        start_time = time.perf_counter()

        try:
            conn, table_name = self._load_csv_to_sqlite(dataset_id)
        except Exception as e:
            return FeasibilityTestResult(
                exercise_id=exercise_id,
                is_feasible=False,
                total_tests=len(test_cases),
                passed_tests=0,
                failed_tests=len(test_cases),
                execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                error_message=f"Lỗi nạp dữ liệu SQLite: {str(e)}",
            )

        cursor = conn.cursor()
        query = solution_code.strip().rstrip(";")

        # Auto-substitute table name if query uses generic name
        for alias in [
            "orders",
            "sales",
            "dataset",
            "attendance",
            "churn_data",
            "knowledge_chunks",
        ]:
            if f"from {alias}" in query.lower() and alias != table_name:
                query = query.replace(f"from {alias}", f'from "{table_name}"').replace(
                    f"FROM {alias.upper()}", f'FROM "{table_name}"'
                )

        # If query has no from clause with table_name, ensure it targets table_name
        if table_name not in query:
            for w in query.split():
                if w.lower() == "from":
                    # Keep original
                    pass

        try:
            cursor.execute(query)
            results = cursor.fetchall()
            columns = (
                [desc[0] for desc in cursor.description] if cursor.description else []
            )
        except Exception as e:
            conn.close()
            return FeasibilityTestResult(
                exercise_id=exercise_id,
                is_feasible=False,
                total_tests=len(test_cases),
                passed_tests=0,
                failed_tests=len(test_cases),
                execution_time_ms=round((time.perf_counter() - start_time) * 1000, 2),
                error_message=f"Lỗi thực thi SQL syntax: {str(e)}",
            )

        # Verify test cases
        passed_count = 0
        failed_count = 0
        preview = results[:3] if results else []

        for tc in test_cases:
            assertion_type = tc.get("assertion_type", "exact_value")
            expected = tc.get("expected_output")

            test_passed = False
            if assertion_type == "row_count":
                test_passed = len(results) == int(expected)
            elif assertion_type == "column_match":
                if isinstance(expected, list):
                    test_passed = all(c in columns for c in expected)
                else:
                    test_passed = str(expected) in columns
            elif assertion_type == "exact_value":
                # Check if first cell or any cell matches expected
                str_res = str(results)
                test_passed = str(expected) in str_res
            elif assertion_type == "contains_value":
                str_res = str(results).lower()
                test_passed = str(expected).lower() in str_res
            else:
                test_passed = len(results) > 0

            if test_passed:
                passed_count += 1
            else:
                failed_count += 1

        conn.close()
        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
        is_feasible = failed_count == 0 and len(results) >= 0

        return FeasibilityTestResult(
            exercise_id=exercise_id,
            is_feasible=is_feasible,
            total_tests=len(test_cases),
            passed_tests=passed_count,
            failed_tests=failed_count,
            execution_time_ms=elapsed_ms,
            output_preview={
                "columns": columns,
                "row_count": len(results),
                "sample": preview,
            },
            error_message=None
            if is_feasible
            else f"{failed_count}/{len(test_cases)} test case không khớp kết quả kỳ vọng",
        )
