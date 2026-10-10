"""Test directory structure and file integrity of Capstone DA-02."""

import os


def test_directory_structure_exists(base_dir):
    expected_paths = [
        "projects/DA-02_inventory_operations/student_edition/PROJECT_BRIEF.md",
        "projects/DA-02_inventory_operations/student_edition/rubric.json",
        "projects/DA-02_inventory_operations/student_edition/HINTS.md",
        "projects/DA-02_inventory_operations/student_edition/starter_kit/data_dictionary.md",
        "projects/DA-02_inventory_operations/student_edition/starter_kit/analysis_starter.sql",
        "projects/DA-02_inventory_operations/student_edition/starter_kit/analysis_starter.py",
        "projects/DA-02_inventory_operations/student_edition/starter_kit/excel_template_guide.md",
        "projects/DA-02_inventory_operations/student_edition/starter_kit/submission_checklist.md",
        "projects/DA-02_inventory_operations/instructor_edition/SOLUTION_MANUAL.md",
        "projects/DA-02_inventory_operations/instructor_edition/expected_kpis.json",
        "projects/DA-02_inventory_operations/instructor_edition/common_pitfalls.md",
        "projects/DA-02_inventory_operations/instructor_edition/solutions/solution_queries.sql",
        "projects/DA-02_inventory_operations/instructor_edition/solutions/solution_da02_pipeline.py",
        "projects/DA-02_inventory_operations/instructor_edition/solutions/excel_model_specification.md",
        "projects/DA-02_inventory_operations/instructor_edition/grading/auto_grader.py",
        "scripts/cross_verification_engine.py",
        "scripts/demo_capstone_workflow.py",
        "scripts/generate_task13_diagram.py",
    ]
    for rel_path in expected_paths:
        abs_path = os.path.join(base_dir, rel_path)
        assert os.path.exists(abs_path), f"Missing file: {rel_path}"
        assert os.path.getsize(abs_path) > 0, f"File is empty: {rel_path}"

    pic1 = os.path.join(base_dir, "Picture_13_Detail.png")
    pic2 = os.path.join(base_dir, "Picture_13-Detail.png")
    assert os.path.exists(pic1) or os.path.exists(
        pic2
    ), "Missing architecture diagram: Picture_13_Detail.png"


def test_clean_and_dirty_datasets_exist(clean_data_dir, dirty_data_dir):
    tables = [
        "warehouses.csv",
        "products.csv",
        "inventory_movements.csv",
        "purchase_orders.csv",
        "sales_dispatches.csv",
        "inventory_audits.csv",
    ]
    for t in tables:
        assert os.path.exists(
            os.path.join(clean_data_dir, t)
        ), f"Missing clean table: {t}"
        assert os.path.exists(
            os.path.join(dirty_data_dir, t)
        ), f"Missing dirty table: {t}"
