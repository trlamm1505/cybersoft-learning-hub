"""Unit tests for Student vs Instructor Separation and Zero Answer Leakage."""

import json
import os
import pytest
from pathlib import Path
from src.core.validator import ProjectValidator
from src.core.packager import ProjectPackager

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_DIR = BASE_DIR / "projects" / "sales_performance_analytics"
STUDENT_DIR = PROJECT_DIR / "student_edition"


@pytest.fixture
def validator():
    return ProjectValidator()


def test_student_edition_zero_leakage(validator):
    passed, leakages = validator.check_student_directory_leakage(STUDENT_DIR)
    assert passed is True, f"Found leakages in student edition: {leakages}"
    assert len(leakages) == 0


def test_leakage_detection_when_solution_injected(validator, tmp_path):
    # Create mock student dir
    mock_student = tmp_path / "mock_student"
    os.makedirs(mock_student)

    # Inject trap file
    trap_file = mock_student / "my_solution_queries.sql"
    with open(trap_file, "w", encoding="utf-8") as f:
        f.write("SELECT * FROM secret_solution_table;")

    passed, leakages = validator.check_student_directory_leakage(mock_student)
    assert passed is False
    assert any("my_solution_queries.sql" in lk for lk in leakages)


def test_packager_sanitizes_expected_kpis(tmp_path):
    packager = ProjectPackager(PROJECT_DIR)
    with open(PROJECT_DIR / "project_manifest.json", "r", encoding="utf-8") as f:
        manifest = json.load(f)

    sanitized = packager.sanitize_manifest_for_student(manifest)
    assert sanitized["metadata"]["edition"] == "student"

    for kpi in sanitized["kpis"]["business_kpis"]:
        assert kpi["expected_value"] is None

    for kpi in sanitized["kpis"]["technical_kpis"]:
        assert kpi["expected_value"] is None
