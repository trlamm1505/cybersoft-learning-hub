"""Unit tests for Registry Manager and core data models."""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from src.core.models import DatasetState, DatasetVersionEntry
from src.core.registry_manager import RegistryManager, VersionAlreadyExistsError


@pytest.fixture
def temp_manager(tmp_path: Path) -> RegistryManager:
    return RegistryManager(store_dir=tmp_path / "registry_store")


@pytest.fixture
def sample_manifest(tmp_path: Path) -> Path:
    manifest_data = {
        "id": "ds-test-sample-v1",
        "title": "Test Dataset Sample",
        "description": "Sample unit test dataset for verification.",
        "version": "1.0.0",
        "domain": "ecommerce",
        "level": "beginner",
        "difficulty": "easy",
        "license": "CC-BY-4.0",
        "pii": {"has_pii": False},
        "learning_outcomes": {
            "target_roles": ["data_analyst"],
            "core_competencies": ["SQL Basics", "Data Cleaning"],
        },
    }
    p = tmp_path / "sample_manifest.json"
    with open(p, "w", encoding="utf-8") as f:
        json.dump(manifest_data, f)
    return p


def test_register_dataset_initial_state_is_draft(
    temp_manager: RegistryManager, sample_manifest: Path
):
    record = temp_manager.register_dataset(sample_manifest)
    assert record.id == "ds-test-sample-v1"
    assert "1.0.0" in record.versions
    assert record.versions["1.0.0"].state == DatasetState.DRAFT
    assert record.latest_published_version is None


def test_semver_validation():
    valid = DatasetVersionEntry(
        version="1.2.3",
        manifest_path="path/to/manifest.json",
    )
    assert valid.version == "1.2.3"

    with pytest.raises(ValueError):
        DatasetVersionEntry(
            version="invalid_v1",
            manifest_path="path/to/manifest.json",
        )


def test_search_by_domain_and_skills(
    temp_manager: RegistryManager, sample_manifest: Path
):
    temp_manager.register_dataset(sample_manifest)

    # Search domain
    found_domain = temp_manager.search_datasets(domain="ecommerce")
    assert len(found_domain) == 1
    assert found_domain[0].id == "ds-test-sample-v1"

    # Search non-matching domain
    none_domain = temp_manager.search_datasets(domain="healthcare")
    assert len(none_domain) == 0

    # Search skill
    found_skill = temp_manager.search_datasets(skill="SQL Basics")
    assert len(found_skill) == 1

    # Search role
    found_role = temp_manager.search_datasets(role="data_analyst")
    assert len(found_role) == 1


def test_get_nonexistent_dataset_returns_none(temp_manager: RegistryManager):
    assert temp_manager.get_dataset("non-existent-id") is None


def test_search_by_text_query(temp_manager: RegistryManager, sample_manifest: Path):
    temp_manager.register_dataset(sample_manifest)
    res = temp_manager.search_datasets(query="Cleaning")
    assert len(res) == 1
    assert res[0].id == "ds-test-sample-v1"

    no_res = temp_manager.search_datasets(query="Kubernetes")
    assert len(no_res) == 0


def test_immutability_re_registering_published_version_fails(
    temp_manager: RegistryManager, sample_manifest: Path
):
    temp_manager.register_dataset(sample_manifest)
    # Simulate publish
    rec = temp_manager.get_dataset("ds-test-sample-v1")
    rec.versions["1.0.0"].state = DatasetState.PUBLISHED
    rec.latest_published_version = "1.0.0"
    temp_manager._save_db()

    with pytest.raises(VersionAlreadyExistsError):
        temp_manager.register_dataset(sample_manifest)
