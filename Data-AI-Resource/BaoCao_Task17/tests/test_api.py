"""Tests for FastAPI Search Endpoints."""

from fastapi.testclient import TestClient
import pytest
from src.api import create_app
from src.embeddings import EmbeddingEngine
from src.retriever import BaselineRetriever
from src.vector_index import VectorIndex


@pytest.fixture
def test_client():
    corpus = [
        "Quy chế bảo lưu khóa học tại học viện đào tạo CyberSoft",
        "Chính sách hoàn trả học phí và rút hồ sơ nhập học học viên",
    ]
    meta = [
        {
            "chunk_id": "c1",
            "document_id": "CS-POL-001",
            "section_id": "SEC-01",
            "text": corpus[0],
            "metadata": {
                "title": "Quy chế bảo lưu",
                "breadcrumbs": "# Title > ## Sec 1",
                "file_path": "path/doc1.md",
                "category": "Policy",
            },
        },
        {
            "chunk_id": "c2",
            "document_id": "CS-POL-002",
            "section_id": "SEC-02",
            "text": corpus[1],
            "metadata": {
                "title": "Chính sách hoàn phí",
                "breadcrumbs": "# Title > ## Sec 2",
                "file_path": "path/doc2.md",
                "category": "Finance",
            },
        },
    ]
    engine = EmbeddingEngine(dimension=2)
    engine.fit(corpus)
    vecs = engine.encode(corpus)
    idx = VectorIndex(dimension=engine.dimension)
    idx.add(vecs, meta)
    retriever = BaselineRetriever(embedding_engine=engine, vector_index=idx)
    app = create_app(retriever=retriever)
    return TestClient(app)


def test_api_health_endpoint(test_client):
    resp = test_client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["vectors_count"] == 2


def test_api_stats_endpoint(test_client):
    resp = test_client.get("/api/v1/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_chunks_indexed"] == 2
    assert data["unique_documents"] == 2
    assert "Policy" in data["categories"]


def test_api_search_endpoint_success(test_client):
    resp = test_client.post(
        "/api/v1/search",
        json={"query": "bảo lưu khóa học", "top_k": 2},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_results"] > 0
    hit = data["results"][0]
    assert "chunk_id" in hit
    assert "citation" in hit
    assert hit["citation"]["breadcrumbs"] == "# Title > ## Sec 1"


def test_api_search_validation_error(test_client):
    resp = test_client.post("/api/v1/search", json={"query": ""})
    assert resp.status_code == 422
