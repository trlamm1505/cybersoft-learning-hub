"""Integration tests for FastAPI RESTful endpoints."""

from fastapi.testclient import TestClient


def test_api_get_dag(client: TestClient):
    response = client.get("/api/v1/lineage/dag")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "nodes" in data["data"]
    assert "edges" in data["data"]
    assert data["meta"]["total_nodes"] >= 16


def test_api_trace_endpoint(client: TestClient):
    target_id = "exercise_approved_exercise_bank_20_v1.0.0"
    response = client.get(f"/api/v1/lineage/trace/{target_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["target_id"] == target_id
    assert len(data["data"]["root_sources"]) >= 4
    assert len(data["data"]["ancestors_by_type"]["datasets"]) >= 4


def test_api_post_artifact_conflict_409(client: TestClient):
    # Attempting to re-register an existing artifact through the API must return HTTP 409
    payload = {
        "name": "Retail Sales Dataset",
        "artifact_type": "dataset",
        "version": "v1.0.0",
        "description": "Attempt to duplicate",
        "content": "duplicate,content\n1,2",
        "filename": "retail_sales.csv",
    }
    response = client.post("/api/v1/lineage/artifacts", json=payload)
    assert response.status_code == 409
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED"
