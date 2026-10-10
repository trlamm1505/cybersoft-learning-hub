"""Tests for Mock Authentication and RBAC."""


def test_auth_missing_header_returns_401(client):
    resp = client.get("/api/v1/registry/datasets")
    assert resp.status_code == 401
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "AUTH_REQUIRED"
    assert "request_id" in body["error"]
    assert "timestamp" in body["error"]


def test_auth_invalid_key_returns_401(client):
    resp = client.get(
        "/api/v1/registry/datasets", headers={"X-API-Key": "invalid_fake_key_999"}
    )
    assert resp.status_code == 401
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"


def test_auth_bearer_token_success(client, bearer_headers):
    resp = client.get("/api/v1/registry/datasets", headers=bearer_headers)
    assert resp.status_code == 200
    assert resp.json()["success"] is True


def test_rbac_student_forbidden_for_quality_validation(client, student_headers):
    payload = {"dataset_id": "ds-retail-ecommerce-sales-v1"}
    resp = client.post(
        "/api/v1/quality/validate-dataset", json=payload, headers=student_headers
    )
    assert resp.status_code == 403
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "FORBIDDEN_INSUFFICIENT_PERMISSIONS"


def test_rbac_qa_engineer_allowed_for_quality_validation(client, qa_headers):
    payload = {"dataset_id": "ds-retail-ecommerce-sales-v1"}
    resp = client.post(
        "/api/v1/quality/validate-dataset", json=payload, headers=qa_headers
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True
