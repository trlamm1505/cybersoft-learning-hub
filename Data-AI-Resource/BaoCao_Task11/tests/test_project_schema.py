"""Unit tests for Project Schema validation."""

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
def valid_manifest():
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def test_valid_manifest(validator, valid_manifest):
    is_valid, errors, _ = validator.validate_manifest(valid_manifest)
    assert is_valid is True
    assert len(errors) == 0


def test_missing_required_section(validator, valid_manifest):
    manifest = valid_manifest.copy()
    del manifest["rubrics"]
    is_valid, errors, _ = validator.validate_manifest(manifest)
    assert is_valid is False
    assert any("'rubrics' is a required property" in e for e in errors)


def test_invalid_domain_enum(validator, valid_manifest):
    manifest = json.loads(json.dumps(valid_manifest))
    manifest["metadata"]["domain"] = "invalid_crypto_domain"
    is_valid, errors, _ = validator.validate_manifest(manifest)
    assert is_valid is False
    assert any("domain" in e for e in errors)


def test_invalid_task_points_sum(validator, valid_manifest):
    manifest = json.loads(json.dumps(valid_manifest))
    manifest["requirements"]["core_tasks"][0]["points"] = 99
    is_valid, errors, _ = validator.validate_manifest(manifest)
    assert is_valid is False
    assert any("Core tasks points sum" in e for e in errors)
