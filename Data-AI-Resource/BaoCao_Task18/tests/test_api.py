"""Unit tests for FastAPI REST API endpoints."""

from fastapi.testclient import TestClient

from src.api import create_app


def test_api_health_check(test_retriever):
    app = create_app(test_retriever)
    client = TestClient(app)

    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["total_chunks"] == 3
    assert "reranked" in data["available_modes"]


def test_api_search_endpoint(test_retriever):
    app = create_app(test_retriever)
    client = TestClient(app)

    # Valid search request
    req = {
        "query": "Cấu hình WSL2",
        "top_k": 2,
        "mode": "reranked",
    }
    response = client.post("/api/v1/search", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == "Cấu hình WSL2"
    assert len(data["results"]) > 0
    assert data["results"][0]["citation"]["document_id"] == "CS-TEC-TEST"


def test_api_validation_error(test_retriever):
    app = create_app(test_retriever)
    client = TestClient(app)

    # Empty query should fail validation
    response = client.post("/api/v1/search", json={"query": ""})
    assert response.status_code == 422
