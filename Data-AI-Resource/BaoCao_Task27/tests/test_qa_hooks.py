"""Test suite for QA Quality Hooks (Task 27)."""

import pytest


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "UP"
    assert body["data"]["qa_harness_connected"] is True


def test_evaluate_clean_dataset_passes(client):
    res = client.post("/api/v1/qa/evaluate/dataset?dataset_id=ds-retail-ecommerce-sales-v1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "PASSED"
    assert data["score"] == 100.0
    assert data["violations_count"] == 0
    assert len(data["findings"]) == 0


def test_evaluate_churn_dataset_passes(client):
    res = client.post("/api/v1/qa/evaluate/dataset?dataset_id=ds-customer-churn-v1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "PASSED"
    assert data["score"] == 100.0


def test_evaluate_corrupted_dataset_blocked(client):
    res = client.post("/api/v1/qa/evaluate/dataset?dataset_id=ds-corrupted-sample-test")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "BLOCKED"
    assert data["violations_count"] >= 3
    rule_ids = [f["rule_id"] for f in data["findings"]]
    assert "QA-RULE-01" in rule_ids  # secret leak
    assert "QA-RULE-02" in rule_ids  # PII leak
    assert "QA-RULE-03" in rule_ids  # schema integrity / orphan
    assert len(data["actionable_reasons"]) > 0


def test_evaluate_non_existent_dataset_blocked(client):
    res = client.post("/api/v1/qa/evaluate/dataset?dataset_id=ghost-dataset-404")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "BLOCKED"
    assert "không tồn tại" in data["findings"][0]["message"]


def test_evaluate_golden_rag_passes(client):
    res = client.post("/api/v1/qa/evaluate/rag?benchmark_id=eval-rag-golden-v1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "PASSED"
    assert data["score"] >= 90.0


def test_evaluate_curriculum_rag_passes(client):
    res = client.post("/api/v1/qa/evaluate/rag?benchmark_id=eval-policy-curriculum-v1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "PASSED"


def test_evaluate_hallucinated_rag_blocked(client):
    res = client.post("/api/v1/qa/evaluate/rag?benchmark_id=eval-hallucinated-model-test")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "BLOCKED"
    assert data["violations_count"] >= 3
    assert any("Faithfulness" in f["message"] for f in data["findings"])
    assert any("Context Recall" in f["message"] for f in data["findings"])
    assert any("Abstention" in f["message"] for f in data["findings"])


def test_evaluate_clean_content_passes(client):
    res = client.post("/api/v1/qa/evaluate/content?content_id=lesson-da-01-intro")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "PASSED"
    assert data["score"] == 100.0


def test_evaluate_broken_content_warning(client):
    res = client.post("/api/v1/qa/evaluate/content?content_id=lesson-broken-sample")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["status"] == "WARNING"
    assert data["violations_count"] >= 2
    assert any("trống" in f["message"] for f in data["findings"])
