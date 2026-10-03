import os


def test_student_edition_files_exist(task12_paths):
    student_dir = task12_paths["student"]
    expected_files = [
        "PROJECT_BRIEF.md",
        "rubric.json",
        "HINTS.md",
        "data/orders.csv",
        "data/order_items.csv",
        "data/customers.csv",
        "data/products.csv",
        "starter_kit/data_dictionary.md",
        "starter_kit/analysis_starter.sql",
        "starter_kit/analysis_starter.py",
        "starter_kit/excel_template_guide.md",
        "starter_kit/submission_checklist.md",
    ]
    for f in expected_files:
        p = os.path.join(student_dir, f)
        assert os.path.exists(p), f"Tệp học viên bị thiếu: {f}"


def test_instructor_edition_files_exist(task12_paths):
    instructor_dir = task12_paths["instructor"]
    expected_files = [
        "SOLUTION_MANUAL.md",
        "expected_kpis.json",
        "common_pitfalls.md",
        "solutions/solution_queries.sql",
        "solutions/solution_da01_pipeline.py",
        "solutions/excel_model_specification.md",
        "grading/auto_grader.py",
    ]
    for f in expected_files:
        p = os.path.join(instructor_dir, f)
        assert os.path.exists(p), f"Tệp giảng viên bị thiếu: {f}"
