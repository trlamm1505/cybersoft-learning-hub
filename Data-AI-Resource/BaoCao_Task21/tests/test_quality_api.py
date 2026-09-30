"""Tests for Data Quality Validation and Metrics endpoints."""


def test_validate_dataset_clean_passed(client, qa_headers):
    payload = {
        "dataset_id": "ds-retail-ecommerce-sales-v1",
        "check_rules": ["schema_conformance", "missing_values", "duplicate_rows"],
    }
    resp = client.post(
        "/api/v1/quality/validate-dataset", json=payload, headers=qa_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] == "PASSED"
    assert data["passed_gate"] is True
    assert data["completeness_score"] == 1.0


def test_validate_dataset_dirty_failed(client, qa_headers):
    payload = {
        "dataset_id": "ds-dirty-test-quarantine",
        "check_rules": ["schema_conformance", "missing_values", "duplicate_rows"],
    }
    resp = client.post(
        "/api/v1/quality/validate-dataset", json=payload, headers=qa_headers
    )
    assert resp.status_code == 200
    body = resp.json()
    data = body["data"]
    assert data["status"] == "FAILED"
    assert data["passed_gate"] is False
    assert len(data["issues"]) > 0
    severities = [issue["severity"] for issue in data["issues"]]
    assert "CRITICAL" in severities


def test_get_quality_metrics_for_tts03_dashboard(client, qa_headers):
    resp = client.get("/api/v1/quality/metrics", headers=qa_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "data_quality_summary" in data
    assert "rag_benchmarks" in data
    bench = data["rag_benchmarks"]
    assert bench["recall_at_5"] == 100.0
    assert bench["mrr"] == 1.0
    assert bench["citation_precision"] == 96.67
    assert bench["phantom_citations"] == 0
    assert bench["tail_latency_p95_ms"] < 100.0
    assert data["ci_gate_status"] == "PASSED"
