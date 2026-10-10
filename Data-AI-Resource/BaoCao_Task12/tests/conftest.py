import os
import sys
import pytest

base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
scripts_dir = os.path.join(base_dir, "scripts")
solutions_dir = os.path.join(
    base_dir, "projects", "DA-01_sales_performance", "instructor_edition", "solutions"
)
grading_dir = os.path.join(
    base_dir, "projects", "DA-01_sales_performance", "instructor_edition", "grading"
)

for d in [scripts_dir, solutions_dir, grading_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)


@pytest.fixture
def task12_paths():
    return {
        "base": base_dir,
        "student": os.path.join(
            base_dir, "projects", "DA-01_sales_performance", "student_edition"
        ),
        "instructor": os.path.join(
            base_dir, "projects", "DA-01_sales_performance", "instructor_edition"
        ),
        "data": os.path.join(
            base_dir, "projects", "DA-01_sales_performance", "student_edition", "data"
        ),
        "expected_kpis": os.path.join(
            base_dir,
            "projects",
            "DA-01_sales_performance",
            "instructor_edition",
            "expected_kpis.json",
        ),
        "rubric": os.path.join(
            base_dir,
            "projects",
            "DA-01_sales_performance",
            "student_edition",
            "rubric.json",
        ),
    }
