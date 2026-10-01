"""Tests for Health and Info endpoints."""


def test_get_health(client):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"
    assert "services" in data
    assert "dataset_registry" in data["services"]
    assert "hybrid_retriever" in data["services"]
    assert "ai_tutor_engine" in data["services"]
    assert "quality_harness" in data["services"]


def test_get_info(client):
    resp = client.get("/api/v1/info")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["name"] == "CyberSoft Data & AI Lab Integration Service"
    assert data["version"] == "1.0.0"
    assert data["openapi_spec_url"] == "/api/v1/openapi.json"
    assert "sla_target" in data
    assert "maintainer" in data


def test_openapi_yaml_endpoint(client):
    resp = client.get("/api/v1/openapi.yaml")
    assert resp.status_code == 200
    assert "openapi: 3.1" in resp.text or "openapi:" in resp.text
