"""Tests for Immutable WORM storage and SHA-256 integrity."""

import pytest
from src.schemas.artifact import ArtifactType, LifecycleState
from src.services.immutable_store import (
    ImmutableArtifactError,
    ImmutableStore,
)


def test_register_new_artifact_success(tmp_path):
    store = ImmutableStore(base_artifacts_dir=tmp_path / "artifacts")
    meta = store.register_artifact(
        name="Test Sales Sample",
        artifact_type=ArtifactType.DATASET,
        version="v1.0.0",
        description="Sample dataset for WORM test.",
        content="id,val\n1,100",
        filename="sales_sample.csv",
        tags=["test"],
    )
    assert meta.id == "dataset_test_sales_sample_v1.0.0"
    assert meta.state == LifecycleState.ACTIVE
    assert len(meta.content_hash) == 64  # SHA-256 length
    assert meta.file_size_bytes > 0


def test_overwrite_existing_artifact_blocked(tmp_path):
    store = ImmutableStore(base_artifacts_dir=tmp_path / "artifacts")
    store.register_artifact(
        name="Test Immutable",
        artifact_type=ArtifactType.PROMPT,
        version="v1.0.0",
        description="First version.",
        content="PROMPT CONTENT V1",
        filename="prompt.txt",
    )
    # Attempting to overwrite MUST raise ImmutableArtifactError (WORM violation)
    with pytest.raises(ImmutableArtifactError) as exc_info:
        store.register_artifact(
            name="Test Immutable",
            artifact_type=ArtifactType.PROMPT,
            version="v1.0.0",
            description="Attempted overwrite.",
            content="PROMPT CONTENT OVERWRITE",
            filename="prompt.txt",
        )
    assert "already exists" in str(exc_info.value)


def test_list_and_filter_artifacts(store):
    all_artifacts = store.list_artifacts()
    assert len(all_artifacts) >= 14

    datasets = store.list_artifacts(artifact_type=ArtifactType.DATASET)
    assert all(a.artifact_type == ArtifactType.DATASET for a in datasets)
    assert len(datasets) >= 4

    deprecated = store.list_artifacts(state=LifecycleState.DEPRECATED)
    assert any(a.state == LifecycleState.DEPRECATED for a in deprecated)


def test_content_hash_integrity(store):
    meta, content_bytes = store.get_artifact_content(
        "dataset_retail_sales_dataset_v1.0.0"
    )
    computed_hash = store.compute_sha256(content_bytes)
    assert computed_hash == meta.content_hash
