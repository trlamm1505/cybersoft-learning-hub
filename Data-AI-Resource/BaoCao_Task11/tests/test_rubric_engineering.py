"""Unit tests for Rubric Engineering constraints."""

import json
import pytest
from pathlib import Path
from src.core.validator import ProjectValidator

BASE_DIR = Path(__file__).resolve().parent.parent
MANIFEST_PATH = (
    BASE_DIR / "projects" / "sales_performance_analytics" / "project_manifest.json"
)


@pytest.fixture
def validator():
    return ProjectValidator()


@pytest.fixture
def manifest():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_rubric_total_100_points(manifest):
    rub = manifest["rubrics"]
    assert rub["total_points"] == 100
    cat_weights = sum(c["weight"] for c in rub["categories"])
    assert cat_weights == 100.0


def test_criteria_sum_matches_category_weight(manifest):
    rub = manifest["rubrics"]
    for cat in rub["categories"]:
        crit_sum = sum(c["max_points"] for c in cat["criteria"])
        assert (
            crit_sum == cat["weight"]
        ), f"Category {cat['category_id']} criteria do not sum to weight"


def test_all_criteria_have_quantitative_metrics(manifest):
    rub = manifest["rubrics"]
    for cat in rub["categories"]:
        for crit in cat["criteria"]:
            metric = crit["quantitative_metric"]
            assert len(metric) >= 10
            # Must contain numbers or concrete indicators
            assert any(char.isdigit() or char in ["%", "$"] for char in metric)


def test_core_vs_extension_ratio(manifest):
    req = manifest["requirements"]
    core = req["total_core_points"]
    ext = req["total_extension_points"]
    assert core == 70
    assert ext == 30
    assert core + ext == 100
