"""Test integrity of files, diagrams, and ensure zero hardcoded personal paths."""

import os
from pathlib import Path
import pytest

TASK15_DIR = Path(__file__).resolve().parent.parent


def test_required_files_and_directories_exist():
    required_paths = [
        TASK15_DIR / "src" / "collector.py",
        TASK15_DIR / "src" / "metrics_engine.py",
        TASK15_DIR / "src" / "filter_engine.py",
        TASK15_DIR / "src" / "app.py",
        TASK15_DIR / "catalog" / "metric_definitions.json",
        TASK15_DIR / "catalog" / "metric_definitions.md",
        TASK15_DIR / "catalog" / "aggregated_resource_snapshot.json",
        TASK15_DIR / "catalog" / "dashboard_preview.html",
        TASK15_DIR / "scripts" / "generate_task15_diagram.py",
        TASK15_DIR / "scripts" / "run_dashboard.py",
        TASK15_DIR / "scripts" / "export_static_snapshot.py",
        TASK15_DIR / "scripts" / "demo_dashboard_workflow.py",
        TASK15_DIR / "Picture_15_Detail.png",
    ]
    for p in required_paths:
        assert p.exists(), f"Required file missing: {p}"


def test_zero_hardcoded_personal_paths():
    """Ensures no hardcoded personal absolute paths exist in code files."""
    part1 = "users" + "/" + "admin"
    part2 = "users" + "\\" + "admin"
    part3 = "cybersoft" + "/" + "kien"
    part4 = "cybersoft" + "\\" + "kien"
    forbidden = [part1, part2, part3, part4]

    scan_extensions = [".py", ".json", ".yaml", ".sh", ".bat"]
    for root, _, files in os.walk(TASK15_DIR):
        for f in files:
            # Skip test files and pytest cache
            if f.startswith("test_") or ".pytest_cache" in root:
                continue
            if any(f.endswith(ext) for ext in scan_extensions):
                file_path = Path(root) / f
                try:
                    content = file_path.read_text(
                        encoding="utf-8", errors="ignore"
                    ).lower()
                    for bad in forbidden:
                        assert (
                            bad not in content
                        ), f"Hardcoded path '{bad}' detected in {file_path}"
                except Exception as e:
                    pytest.fail(f"Could not scan file {file_path}: {e}")
