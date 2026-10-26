"""Test suite for QA Rules and Shared Fixtures Integrity (Task 27)."""

import pytest


def test_get_qa_rules_endpoint(client):
    res = client.get("/api/v1/qa/rules")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["rules_count"] >= 6
    rules = body["data"]["rules"]
    rule_ids = [r["rule_id"] for r in rules]
    assert "QA-RULE-01" in rule_ids
    assert "QA-RULE-02" in rule_ids
    assert "QA-RULE-03" in rule_ids
    assert "QA-RULE-04" in rule_ids
    assert "QA-RULE-05" in rule_ids
    assert "QA-RULE-06" in rule_ids


def test_qa_fixtures_summary_endpoint(client):
    res = client.get("/api/v1/qa/fixtures-summary")
    assert res.status_code == 200
    data = res.json()["data"]
    assert "ds-retail-ecommerce-sales-v1" in data["datasets_available"]
    assert "eval-rag-golden-v1" in data["benchmarks_available"]
    assert "lesson-da-01-intro" in data["contents_available"]


def test_rule_severity_structure(client):
    res = client.get("/api/v1/qa/rules")
    rules = res.json()["data"]["rules"]
    for r in rules:
        assert r["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        assert r["gate_action"] in ["BLOCK_RELEASE", "WARNING"]
