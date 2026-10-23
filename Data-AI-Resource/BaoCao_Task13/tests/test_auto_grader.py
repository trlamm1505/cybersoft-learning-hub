"""Verify auto-grader functionality and score calibration."""

import os
import sys


def test_auto_grader_execution(base_dir):
    grading_dir = os.path.join(
        base_dir,
        "projects",
        "DA-02_inventory_operations",
        "instructor_edition",
        "grading",
    )
    sys.path.insert(0, grading_dir)
    from auto_grader import evaluate_student_results, grade_solution

    # Test perfect solution
    success = grade_solution()
    assert (
        success is True
    ), "Reference solution should pass auto-grader with >= 60.0 points"

    # Test penalty on incorrect metrics
    bad_metrics = {
        "ending_physical_inventory_units": 9999,
        "ending_inventory_valuation_usd": 1000.0,
        "total_cogs_usd": 500.0,
        "inventory_turnover_ratio": 9.9,
        "warehouse_distribution": {},
        "out_of_stock_skus_count": 99,
        "reorder_point_alerts_count": 99,
    }
    score, feedback = evaluate_student_results(bad_metrics)
    assert (
        score == 0.0
    ), f"Expected 0.0 points for completely wrong metrics, got {score}"
