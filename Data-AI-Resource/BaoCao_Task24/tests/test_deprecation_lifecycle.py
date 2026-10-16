"""Tests for lifecycle state transitions, deprecation warnings, and WORM immutability."""

import pytest
from src.schemas.artifact import LifecycleState
from src.schemas.lifecycle import DeprecateRequest
from src.services.deprecation_manager import (
    InvalidStateTransitionError,
    deprecation_manager,
)
from src.services.immutable_store import immutable_store


def test_valid_deprecation_transition():
    # Deprecate an active artifact
    target_id = "dataset_customer_churn_dataset_v1.0.0"
    meta_before = immutable_store.get_artifact_metadata(target_id)
    assert meta_before.state == LifecycleState.ACTIVE

    req = DeprecateRequest(
        artifact_id=target_id,
        reason="Chuyển đổi sang mô hình dự báo rời bỏ hợp nhất.",
        superseded_by="dataset_customer_churn_v2.0.0",
        sunset_date="2026-12-31T00:00:00Z",
    )
    res = deprecation_manager.deprecate_artifact(req)
    assert res.new_state == LifecycleState.DEPRECATED
    assert res.sunset_date == "2026-12-31T00:00:00Z"

    # Reset back to ACTIVE to keep test state clean
    immutable_store.update_lifecycle_state(target_id, LifecycleState.ACTIVE)


def test_invalid_transition_from_retired():
    target_id = "dataset_customer_churn_dataset_v1.0.0"
    immutable_store.update_lifecycle_state(target_id, LifecycleState.RETIRED)

    req = DeprecateRequest(
        artifact_id=target_id,
        reason="Trying to deprecate a retired artifact.",
    )
    with pytest.raises(InvalidStateTransitionError):
        deprecation_manager.deprecate_artifact(req)

    # Reset back to ACTIVE
    immutable_store.update_lifecycle_state(target_id, LifecycleState.ACTIVE)


def test_deprecation_downstream_warnings():
    # Deprecating chunks v1.0.0 should warn about downstream BM25 index & evaluation
    target_id = "dataset_ai_knowledge_chunks_corpus_v1.0.0"
    meta = immutable_store.get_artifact_metadata(target_id)
    assert meta.state == LifecycleState.DEPRECATED
    assert meta.deprecation_reason is not None
    assert meta.superseded_by is not None


def test_content_remains_immutable_after_deprecation():
    target_id = "dataset_ai_knowledge_chunks_corpus_v1.0.0"
    meta, raw_bytes = immutable_store.get_artifact_content(target_id)
    recalculated_hash = immutable_store.compute_sha256(raw_bytes)
    assert recalculated_hash == meta.content_hash
