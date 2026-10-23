"""Edge case tests for Task 27."""

import pytest


def test_release_check_empty_targets_returns_passed(client):
    payload = {
        "release_version": "v1.0.0-empty",
        "target_datasets": [],
        "target_benchmarks": [],
        "target_contents": [],
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["overall_status"] == "PASSED"
    assert data["can_release"] is True
    assert len(data["component_gates"]) == 0


def test_rag_gate_high_latency_triggers_warning_not_block():
    from src.services.qa_hook_service import qa_hook_service

    # Temporarily evaluate a simulated high-latency item
    qa_hook_service.benchmarks["eval-high-latency-only"] = {
        "benchmark_id": "eval-high-latency-only",
        "version": "v1.0.0",
        "measured_metrics": {
            "faithfulness": 0.95,
            "context_recall": 0.90,
            "abstention_accuracy": 0.95,
            "p95_latency_sec": 3.5,  # > 2.5s -> MEDIUM severity
            "prompt_injection_resistance": 1.0,
        },
    }
    res = qa_hook_service.evaluate_rag_gate("eval-high-latency-only")
    assert res.status == "WARNING"
    assert res.score == 80.0
    assert any("P95" in f.message for f in res.findings)


def test_dataset_gate_secret_leak_causes_zero_score():
    from src.services.qa_hook_service import qa_hook_service

    qa_hook_service.datasets["ds-secret-leak-test"] = {
        "resource_id": "ds-secret-leak-test",
        "version": "v1.0.0",
        "secret_leak_count": 5,
        "pii_leak_count": 2,
        "missing_pk_count": 1,
        "orphan_records": 10,
    }
    res = qa_hook_service.evaluate_dataset_gate("ds-secret-leak-test")
    assert res.status == "BLOCKED"
    assert res.violations_count >= 3
    assert res.score == 0.0  # heavily penalized


def test_bypass_reject_spaces_only_reason(client):
    payload = {
        "release_version": "v1.1.0-spaces",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "               ",  # spaces only
            "authorized_by": "Lead",
        },
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert res.json()["error"]["code"] == "BYPASS_REJECTED"


def test_bypass_reject_spaces_only_authorizer(client):
    payload = {
        "release_version": "v1.1.0-spaces-auth",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "Lý do giải trình hợp lệ với độ dài trên 15 ký tự",
            "authorized_by": "   ",  # spaces only
        },
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    assert res.json()["success"] is False
    assert res.json()["error"]["code"] == "BYPASS_REJECTED"


def test_audit_trail_immutable_and_incrementing(client):
    # Perform another valid bypass
    payload = {
        "release_version": "v1.1.0-audit-seq-test",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "Ngoại lệ phát hành đợt 2 cho kiểm thử CI runner nội bộ",
            "authorized_by": "Lead Engineer Kien",
        },
    }
    res1 = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res1.status_code == 200

    res2 = client.get("/api/v1/qa/audit-trail")
    assert res2.status_code == 200
    records = res2.json()["data"]["records"]
    assert len(records) >= 1
    assert records[-1]["authorized_by"] == "Lead Engineer Kien"


def test_content_gate_missing_id_returns_warning():
    from src.services.qa_hook_service import qa_hook_service
    res = qa_hook_service.evaluate_content_gate("unknown-content-id-999")
    assert res.status == "WARNING"
    assert "chưa qua đăng ký" in res.actionable_reasons[0]
