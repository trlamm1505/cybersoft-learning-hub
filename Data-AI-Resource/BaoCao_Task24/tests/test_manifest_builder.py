"""Tests for Release Manifest generation and holistic checksum verification."""

import pytest
from src.services.immutable_store import ImmutableArtifactError
from src.services.manifest_builder import ManifestBuilder


def test_manifest_generation_completeness(builder: ManifestBuilder):
    manifest_v1_0 = builder.get_manifest("v1.0.0")
    assert manifest_v1_0.version == "v1.0.0"
    assert len(manifest_v1_0.components) == 13
    assert len(manifest_v1_0.holistic_checksum) == 64
    assert manifest_v1_0.component_counts.get("dataset", 0) >= 4
    assert manifest_v1_0.component_counts.get("model", 0) >= 2


def test_holistic_checksum_deterministic(builder: ManifestBuilder):
    manifest_v1_0 = builder.get_manifest("v1.0.0")
    recalculated_hash = builder.compute_holistic_checksum(manifest_v1_0.components)
    assert recalculated_hash == manifest_v1_0.holistic_checksum


def test_manifest_immutability_blocked(builder: ManifestBuilder):
    # Attempting to re-build existing release version must fail (WORM violation)
    with pytest.raises(ImmutableArtifactError):
        builder.build_manifest(
            version="v1.0.0",
            release_name="Duplicate Release",
            description="Overwrite attempt.",
            release_notes="Should fail.",
            git_tag="v1.0.0-dup",
        )


def test_retrieve_manifest_by_version(builder: ManifestBuilder):
    m1 = builder.get_manifest("v1.0.0")
    m2 = builder.get_manifest("v1.1.0")
    assert m1.release_id == "rel_v1.0.0"
    assert m2.release_id == "rel_v1.1.0"
    assert m1.holistic_checksum != m2.holistic_checksum
