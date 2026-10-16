"""Test suite for Master Release Quality Gate (Task 27)."""

import pytest


def test_release_check_clean_package_passes(client):
    payload = {
        "release_version": "v1.1.0-clean",
        "target_datasets": ["ds-retail-ecommerce-sales-v1", "ds-customer-churn-v1"],
        "target_benchmarks": ["eval-rag-golden-v1", "eval-policy-curriculum-v1"],
        "target_contents": ["lesson-da-01-intro", "lesson-ai-01-rag-architecture"],
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]

    assert data["overall_status"] == "PASSED"
    assert data["can_release"] is True
    assert data["failure_count"] == 0
    assert len(data["component_gates"]) == 6
    assert all(g["status"] == "PASSED" for g in data["component_gates"].values())


def test_release_check_with_corrupted_dataset_blocks(client):
    payload = {
        "release_version": "v1.1.0-bad-dataset",
        "target_datasets": ["ds-retail-ecommerce-sales-v1", "ds-corrupted-sample-test"],
        "target_benchmarks": ["eval-rag-golden-v1"],
        "target_contents": ["lesson-da-01-intro"],
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["overall_status"] == "BLOCKED"
    assert data["can_release"] is False
    assert data["failure_count"] >= 1
    assert any("ds-corrupted-sample-test" in s for s in data["actionable_summary"])


def test_release_check_with_hallucinated_rag_blocks(client):
    payload = {
        "release_version": "v1.1.0-bad-rag",
        "target_datasets": ["ds-retail-ecommerce-sales-v1"],
        "target_benchmarks": ["eval-hallucinated-model-test"],
        "target_contents": ["lesson-da-01-intro"],
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["overall_status"] == "BLOCKED"
    assert data["can_release"] is False
    assert any("eval-hallucinated-model-test" in s for s in data["actionable_summary"])


def test_release_check_with_broken_content_warns_only(client):
    # Content warning should not block the release if no datasets or RAG failed
    payload = {
        "release_version": "v1.1.0-content-warning",
        "target_datasets": ["ds-retail-ecommerce-sales-v1"],
        "target_benchmarks": ["eval-rag-golden-v1"],
        "target_contents": ["lesson-broken-sample"],
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["overall_status"] == "WARNING"
    assert data["can_release"] is True
    assert data["warning_count"] >= 1
    assert data["failure_count"] == 0


def test_release_check_all_failing_components(client):
    payload = {
        "release_version": "v1.1.0-nightmare",
        "target_datasets": ["ds-corrupted-sample-test"],
        "target_benchmarks": ["eval-hallucinated-model-test"],
        "target_contents": ["lesson-broken-sample"],
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["overall_status"] == "BLOCKED"
    assert data["can_release"] is False
    assert data["failure_count"] >= 2
    assert len(data["actionable_summary"]) >= 4
