"""Automated Quality Gate enforcement and negative test cases."""

from __future__ import annotations

import csv
import json
from pathlib import Path
import pytest

from src.core.models import DatasetState, QualityGateResult
from src.core.registry_manager import RegistryManager
from src.core.state_machine import (
    DatasetStateMachine,
    QualityGateFailedError,
    InvalidStateTransitionError,
)


@pytest.fixture
def clean_dataset_fixture(tmp_path: Path) -> tuple[Path, Path]:
    task04_sample = (
        Path(__file__).resolve().parent.parent.parent
        / "BaoCao_Task04"
        / "metadata_samples"
        / "01_da_ecommerce_sales.json"
    )
    task06_clean_data = (
        Path(__file__).resolve().parent.parent.parent
        / "BaoCao_Task06"
        / "data"
        / "clean"
        / "customers.csv"
    )
    return task04_sample, task06_clean_data


@pytest.fixture
def dirty_dataset_fixture(tmp_path: Path) -> tuple[Path, Path]:
    dirty_file = tmp_path / "dirty_corrupt.csv"
    with open(dirty_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["student_id", "full_name", "score", "status"])
        # Intentional duplicate primary keys and null values
        writer.writerow(["STU_001", "Duplicate A", "90.0", "ACTIVE"])
        writer.writerow(["STU_001", "Duplicate B", "NULL", "ACTIVE"])
        writer.writerow(["STU_002", "Valid Student", "NULL", "NULL"])

    dirty_manifest_file = tmp_path / "dirty_manifest.json"
    dirty_manifest = {
        "id": "ds-dirty-test-corrupt",
        "title": "Dirty Corrupt Dataset",
        "description": "Flawed dataset containing duplicate PKs and excess nulls.",
        "version": "1.0.0",
        "domain": "education",
        "level": "beginner",
        "difficulty": "hard",
        "license": "CC-BY-4.0",
        "pii": {"has_pii": False},
        "learning_outcomes": {
            "target_roles": ["qa_engineer"],
            "core_competencies": ["Defect Detection"],
        },
    }
    with open(dirty_manifest_file, "w", encoding="utf-8") as f:
        json.dump(dirty_manifest, f)

    return dirty_manifest_file, dirty_file


def test_quality_gate_passes_clean_data(tmp_path: Path, clean_dataset_fixture):
    manifest_p, data_p = clean_dataset_fixture
    manager = RegistryManager(store_dir=tmp_path / "reg_store")

    manager.register_dataset(manifest_p, [data_p])
    gate_res = manager.validate_dataset("ds-retail-ecommerce-sales-v1", "1.0.0")

    assert gate_res.passed is True
    assert gate_res.score >= 95.0
    assert len(gate_res.violations) == 0

    # Can now publish successfully
    rec = manager.publish_dataset("ds-retail-ecommerce-sales-v1", "1.0.0")
    assert rec.versions["1.0.0"].state == DatasetState.PUBLISHED
    assert rec.latest_published_version == "1.0.0"


def test_quality_gate_strictly_rejects_dirty_data(
    tmp_path: Path, dirty_dataset_fixture
):
    manifest_p, dirty_p = dirty_dataset_fixture
    manager = RegistryManager(store_dir=tmp_path / "reg_store")

    manager.register_dataset(manifest_p, [dirty_p])

    # Validate fails
    gate_res = manager.validate_dataset("ds-dirty-test-corrupt", "1.0.0")
    assert gate_res.passed is False
    assert len(gate_res.violations) > 0

    # Publish MUST raise QualityGateFailedError and be blocked
    with pytest.raises(QualityGateFailedError):
        manager.publish_dataset("ds-dirty-test-corrupt", "1.0.0")

    rec = manager.get_dataset("ds-dirty-test-corrupt")
    assert rec.latest_published_version is None
    assert rec.versions["1.0.0"].state == DatasetState.REJECTED


def test_state_machine_blocks_publishing_without_quality_gate():
    with pytest.raises(QualityGateFailedError):
        DatasetStateMachine.transition(
            current=DatasetState.UNDER_REVIEW,
            target=DatasetState.PUBLISHED,
            quality_gate=None,
        )


def test_state_machine_blocks_mutation_of_published_dataset():
    gate_ok = QualityGateResult(
        passed=True, score=100.0, total_checks=10, passed_checks=10
    )
    # Published version cannot be transitioned to DRAFT
    with pytest.raises(InvalidStateTransitionError):
        DatasetStateMachine.transition(
            current=DatasetState.PUBLISHED,
            target=DatasetState.DRAFT,
            quality_gate=gate_ok,
        )
