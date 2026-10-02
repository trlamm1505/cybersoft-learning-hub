"""Integration tests for FastAPI REST API endpoints (Task 23)."""

from fastapi.testclient import TestClient


def test_api_health(client: TestClient):
    """Verify health endpoint."""
    res = client.get("/health")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert json_data["data"]["status"] == "healthy"


def test_api_list_datasets(client: TestClient):
    """Verify listing datasets."""
    res = client.get("/api/v1/generator/datasets")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert len(json_data["data"]) >= 4


def test_api_generate_and_list_exercises(client: TestClient):
    """Verify generating exercise via API and listing."""
    res = client.post(
        "/api/v1/generator/generate",
        json={
            "dataset_id": "retail_sales_v1",
            "bloom_level": "Apply",
            "difficulty": "Intermediate",
            "count": 1,
        },
    )
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    created = json_data["data"][0]
    ex_id = created["id"]
    assert created["status"] == "draft_pending_review"

    # Test feasibility endpoint
    test_res = client.post(f"/api/v1/generator/exercises/{ex_id}/test")
    assert test_res.status_code == 200
    assert test_res.json()["data"]["is_feasible"] is True

    # Test publish without approval -> 403 Forbidden
    pub_res = client.post(f"/api/v1/generator/exercises/{ex_id}/publish")
    assert pub_res.status_code == 403

    # Review approve
    rev_res = client.post(
        f"/api/v1/generator/exercises/{ex_id}/review",
        json={
            "action": "approve",
            "reviewer_id": "teacher_kien_lead",
            "notes": "Phê duyệt kiểm thử API.",
        },
    )
    assert rev_res.status_code == 200
    assert rev_res.json()["data"]["status"] == "approved"

    # Now publish succeeds
    pub_res2 = client.post(f"/api/v1/generator/exercises/{ex_id}/publish")
    assert pub_res2.status_code == 200
    assert pub_res2.json()["data"]["status"] == "published"


def test_api_metrics(client: TestClient):
    """Verify metrics endpoint."""
    res = client.get("/api/v1/generator/metrics")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["success"] is True
    assert "round_1_pass_rate" in json_data["data"]
