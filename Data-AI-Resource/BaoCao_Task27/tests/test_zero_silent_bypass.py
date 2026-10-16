"""Test suite for Zero Silent Bypass policy enforcement (Task 27)."""

import pytest


def test_silent_bypass_empty_reason_rejected(client):
    payload = {
        "release_version": "v1.1.0-bypass-attempt",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "",  # EMPTY -> VIOLATION
            "authorized_by": "TechLead",
        },
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is False
    assert body["error"]["code"] == "BYPASS_REJECTED"
    assert "quá ngắn" in body["error"]["message"] or "trống" in body["error"]["message"]


def test_silent_bypass_short_reason_rejected(client):
    payload = {
        "release_version": "v1.1.0-bypass-attempt",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "short",  # < 15 chars
            "authorized_by": "TechLead",
        },
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is False
    assert body["error"]["code"] == "BYPASS_REJECTED"


def test_silent_bypass_missing_authorizer_rejected(client):
    payload = {
        "release_version": "v1.1.0-bypass-attempt",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "Lý do giải trình hợp lệ nhưng thiếu người duyệt",
            "authorized_by": "",  # MISSING
        },
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is False
    assert body["error"]["code"] == "BYPASS_REJECTED"
    assert "người phê duyệt" in body["error"]["message"]


def test_valid_authorized_bypass_succeeds_and_audited(client):
    payload = {
        "release_version": "v1.1.0-valid-bypass",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "Phê duyệt phát hành thử nghiệm sandbox phục vụ thẩm định nội bộ",
            "authorized_by": "QA Lead Tran Quoc Nguyen",
        },
    }
    res = client.post("/api/v1/qa/gate/release-check", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is True
    data = body["data"]
    assert data["can_release"] is True
    assert data["audit_record"] is not None
    assert data["audit_record"]["authorized_by"] == "QA Lead Tran Quoc Nguyen"
    assert "thử nghiệm sandbox" in data["audit_record"]["reason"]


def test_audit_trail_endpoint_records_entries(client):
    res = client.get("/api/v1/qa/audit-trail")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total_records"] >= 1
    recent = body["data"]["records"][-1]
    assert recent["authorized_by"] == "QA Lead Tran Quoc Nguyen"
