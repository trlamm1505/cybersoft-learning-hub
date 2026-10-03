"""Tests for Semantic & Hybrid Search endpoints."""


def test_semantic_search_success(client, student_headers):
    payload = {
        "query": "thuật toán xếp hạng lai RRF kết hợp BM25 và Vector Dense",
        "top_k": 3,
        "similarity_threshold": 0.1,
    }
    resp = client.post("/api/v1/search/semantic", json=payload, headers=student_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["total_found"] > 0
    assert len(data["results"]) <= 3
    assert data["execution_time_ms"] > 0
    first = data["results"][0]
    assert "chunk_id" in first
    assert "source_citation" in first
    assert first["relevance_score"] >= 0.1


def test_semantic_search_validation_error_min_length(client, student_headers):
    payload = {"query": "a", "top_k": 3}
    resp = client.post("/api/v1/search/semantic", json=payload, headers=student_headers)
    assert resp.status_code == 422
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert len(body["error"]["details"]) > 0


def test_get_chunk_detail_success(client, student_headers):
    from src.services.search_service import SearchService

    first_chunk = SearchService._load_chunks()[0]
    target_id = first_chunk["chunk_id"]

    resp = client.get(f"/api/v1/search/chunks/{target_id}", headers=student_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["chunk_id"] == target_id


def test_get_chunk_detail_not_found(client, student_headers):
    resp = client.get(
        "/api/v1/search/chunks/non_existent_chunk_999", headers=student_headers
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "CHUNK_NOT_FOUND"
