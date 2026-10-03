"""Tests for Dataset Registry and Project Bank endpoints."""


def test_list_datasets_all(client, student_headers):
    resp = client.get("/api/v1/registry/datasets", headers=student_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) >= 3


def test_list_datasets_filter_by_domain(client, student_headers):
    resp = client.get(
        "/api/v1/registry/datasets?domain=Retail", headers=student_headers
    )
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["domain"] == "Retail"


def test_list_datasets_pagination(client, student_headers):
    resp = client.get(
        "/api/v1/registry/datasets?limit=2&offset=0", headers=student_headers
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["items"]) == 2
    assert data["pagination"]["limit"] == 2
    assert data["pagination"]["offset"] == 0
    assert data["pagination"]["has_next"] is True


def test_get_dataset_detail_success(client, student_headers):
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}", headers=student_headers
    )
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["id"] == dataset_id
    assert "checksum_sha256" in detail
    assert "schema_definition" in detail
    assert len(detail["schema_definition"]) > 0


def test_get_dataset_detail_not_found_returns_404(client, student_headers):
    resp = client.get(
        "/api/v1/registry/datasets/non_existent_dataset_abc", headers=student_headers
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "DATASET_NOT_FOUND"


def test_list_projects(client, instructor_headers):
    resp = client.get("/api/v1/registry/projects", headers=instructor_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    assert len(items) >= 2
    tracks = [p["track"] for p in items]
    assert "Data Analyst" in tracks
    assert "AI Engineer" in tracks


def test_get_project_detail_success(client, instructor_headers):
    project_id = "proj-capstone-data-analyst-sales"
    resp = client.get(
        f"/api/v1/registry/projects/{project_id}", headers=instructor_headers
    )
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["id"] == project_id
    assert "rubric_summary" in detail
    assert "objectives" in detail
    assert len(detail["objectives"]) >= 3


def test_get_project_detail_not_found_returns_404(client, instructor_headers):
    resp = client.get(
        "/api/v1/registry/projects/non_existent_proj_xyz", headers=instructor_headers
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "PROJECT_NOT_FOUND"
