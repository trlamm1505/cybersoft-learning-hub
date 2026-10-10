"""Verify Zero Answer Leakage defense in student_edition."""

import os
import re


def test_zero_answer_leakage_in_student_edition(base_dir):
    student_dir = os.path.join(
        base_dir, "projects", "DA-02_inventory_operations", "student_edition"
    )

    # Ground truth values that must NOT appear in student_edition
    leakage_patterns = [
        (r"867[,.]?636", "Ending inventory valuation leaked"),
        (r"814[,.]?742", "Total COGS leaked"),
        (r"300\.4\s*d", "Days of inventory on hand leaked"),
        (r"670[,.]?536", "Average inventory valuation leaked"),
        (
            r"solution_queries\.sql",
            "Instructor solution file referenced in student edition",
        ),
        (r"auto_grader\.py", "Auto-grader code referenced in student edition"),
    ]

    violations = []
    for root, _, files in os.walk(student_dir):
        for f in files:
            if f.endswith((".md", ".sql", ".py", ".json")):
                fp = os.path.join(root, f)
                with open(fp, "r", encoding="utf-8", errors="ignore") as file_obj:
                    content = file_obj.read()
                    for pat, reason in leakage_patterns:
                        if re.search(pat, content):
                            violations.append(
                                (os.path.relpath(fp, student_dir), reason)
                            )

    assert (
        len(violations) == 0
    ), f"Zero-leakage violations detected in student_edition: {violations}"
