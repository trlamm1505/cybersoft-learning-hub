"""Unit tests for Feasibility Execution on SQLite (Task 23)."""

from src.services.feasibility_executor import FeasibilityExecutorService


def test_feasibility_success(feasibility_executor: FeasibilityExecutorService):
    """Verify that a correct query runs and matches test case assertions."""
    query = "SELECT order_id, status FROM retail_sales_v1 WHERE status = 'Completed';"
    test_cases = [
        {
            "id": "TC-01",
            "description": "Row count check",
            "expected_output": 7,
            "assertion_type": "row_count",
        },
        {
            "id": "TC-02",
            "description": "Column match check",
            "expected_output": ["order_id", "status"],
            "assertion_type": "column_match",
        },
    ]
    res = feasibility_executor.execute_and_verify(
        exercise_id="EX-TEST",
        dataset_id="retail_sales_v1",
        solution_code=query,
        test_cases=test_cases,
    )
    assert res.is_feasible is True
    assert res.passed_tests == 2
    assert res.failed_tests == 0
    assert res.execution_time_ms < 500.0  # Fast sub-second in-memory execution


def test_feasibility_syntax_error(feasibility_executor: FeasibilityExecutorService):
    """Verify that syntax errors are gracefully caught and reported."""
    query = "SELECT INVALID SYNTAX FROM retail_sales_v1;"
    test_cases = [
        {
            "id": "TC-01",
            "description": "Dummy",
            "expected_output": 1,
            "assertion_type": "row_count",
        }
    ]
    res = feasibility_executor.execute_and_verify(
        exercise_id="EX-ERR",
        dataset_id="retail_sales_v1",
        solution_code=query,
        test_cases=test_cases,
    )
    assert res.is_feasible is False
    assert "syntax" in res.error_message.lower()
