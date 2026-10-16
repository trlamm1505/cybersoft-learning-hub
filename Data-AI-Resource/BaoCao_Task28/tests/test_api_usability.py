"""Integration tests for Task 28 FastAPI Endpoints."""

import pytest


def test_api_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UP"
    assert "Task 28" in data["service"]


def test_api_usability_summary(client):
    res = client.get("/api/v1/usability/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_users"] == 5
    assert data["total_tasks"] == 25
    assert data["avg_sus_score"] >= 80.0
    assert data["overall_sus_grade"] in ("A", "A+")
    assert data["time_reduction_percentage"] >= 50.0


def test_api_get_issue_backlog_all(client):
    res = client.get("/api/v1/usability/backlog")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 10


def test_api_get_issue_backlog_filtered_critical(client):
    res = client.get("/api/v1/usability/backlog?severity=CRITICAL")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    for item in data:
        assert item["severity"] == "CRITICAL"


def test_api_get_resolved_fixes(client):
    res = client.get("/api/v1/usability/fixes")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 5
    assert data[0]["fix_id"] == "FIX-001"


def test_api_localize_error_endpoint(client):
    raw_err = [{"loc": ["body", "test_field"], "msg": "required", "type": "value_error.missing"}]
    res = client.post("/api/v1/usability/tools/localize-error", json=raw_err)
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert "test_field" in data[0]["msg"]


def test_api_citation_copy_endpoint(client):
    res = client.get("/api/v1/usability/tools/citation-copy?doc=CS-TEC-001&section=env_setup&quote=Cai_dat_Python")
    assert res.status_code == 200
    data = res.json()
    assert "[CS-TEC-001#env_setup]" in data["formatted_citation"]
