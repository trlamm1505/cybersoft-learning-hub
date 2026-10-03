"""Tests for Preview endpoint, sample rows extraction, and Schema Inspector."""

from fastapi.testclient import TestClient


def test_preview_retail_dataset(client: TestClient):
    """Xem trước dữ liệu bảng và kiểm tra lược đồ cột của Retail Sales."""
    res = client.get(
        "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/preview?limit=10"
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]

    assert data["dataset_id"] == "ds-retail-ecommerce-sales-v1"
    assert data["download_allowed"] is True
    assert len(data["sample_rows"]) == 10
    assert len(data["columns"]) == 7

    # Verify column specs (Schema Inspector requirements)
    col_names = [c["name"] for c in data["columns"]]
    assert "order_id" in col_names
    assert "total_amount" in col_names
    assert "customer_id" in col_names

    # Check order_id NOT NULL constraint
    order_id_col = next(c for c in data["columns"] if c["name"] == "order_id")
    assert order_id_col["nullable"] is False
    assert order_id_col["type"] == "string"


def test_preview_unpublished_draft_dataset(client: TestClient):
    """Xem trước bản nháp vẫn hiển thị schema nhưng đánh dấu download_allowed=False."""
    res = client.get("/api/v1/portal/datasets/ds-cyber-ai-student-survey-draft/preview")
    assert res.status_code == 200
    body = res.json()
    data = body["data"]
    assert data["is_published"] is False
    assert data["download_allowed"] is False
    assert len(data["columns"]) >= 5


def test_preview_not_found(client: TestClient):
    """Xem trước dataset không tồn tại trả về 404."""
    res = client.get("/api/v1/portal/datasets/ds-unknown-000/preview")
    assert res.status_code == 404
    body = res.json()
    assert body["error"]["code"] == "DATASET_NOT_FOUND"
