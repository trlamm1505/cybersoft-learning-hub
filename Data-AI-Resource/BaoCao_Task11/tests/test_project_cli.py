"""Unit tests for Project Bank CLI."""

import subprocess
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CLI_PATH = BASE_DIR / "scripts" / "project_cli.py"
MANIFEST_PATH = (
    BASE_DIR / "projects" / "sales_performance_analytics" / "project_manifest.json"
)
STUDENT_DIR = BASE_DIR / "projects" / "sales_performance_analytics" / "student_edition"


def test_cli_validate_success():
    res = subprocess.run(
        [sys.executable, str(CLI_PATH), "validate", str(MANIFEST_PATH)],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    assert "[SUCCESS]" in res.stdout


def test_cli_check_leakage_success():
    res = subprocess.run(
        [sys.executable, str(CLI_PATH), "check-leakage", str(STUDENT_DIR)],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    assert "[SUCCESS] Zero Answer Leakage" in res.stdout


def test_cli_summary_success():
    res = subprocess.run(
        [sys.executable, str(CLI_PATH), "summary", str(MANIFEST_PATH)],
        capture_output=True,
        text=True,
    )
    assert res.returncode == 0
    assert "CyberSoft Mart" in res.stdout
    assert "Core Points: 70" in res.stdout
