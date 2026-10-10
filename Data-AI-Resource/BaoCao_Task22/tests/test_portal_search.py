"""Tests for Portal discovery, multi-faceted filtering, and search latency."""

from fastapi.testclient import TestClient


def test_list_all_datasets(client: TestClient):
    """Xác thực danh sách đầy đủ 5 datasets trong hệ thống."""
    res = client.get("/api/v1/portal/datasets")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["total"] == 5
    assert len(body["data"]["items"]) == 5
    assert "meta" in body
    assert body["meta"]["execution_time_ms"] < 100.0  # DoD SLA


def test_keyword_search_retail(client: TestClient):
    """Tìm kiếm từ khóa 'bán hàng' trả về đúng dataset Retail Sales."""
    res = client.get("/api/v1/portal/datasets?q=bán hàng")
    assert res.status_code == 200
    body = res.json()
    items = body["data"]["items"]
    assert len(items) >= 1
    assert any(ds["id"] == "ds-retail-ecommerce-sales-v1" for ds in items)


def test_filter_by_domain(client: TestClient):
    """Lọc theo lĩnh vực HR chỉ trả về tập dữ liệu HR."""
    res = client.get("/api/v1/portal/datasets?domain=HR")
    assert res.status_code == 200
    body = res.json()
    items = body["data"]["items"]
    assert len(items) == 1
    assert items[0]["id"] == "ds-hr-operations-attendance-v1"
    assert items[0]["domain"] == "HR"


def test_filter_by_level_advanced(client: TestClient):
    """Lọc cấp độ 'advanced' trả về dataset AI/RAG."""
    res = client.get("/api/v1/portal/datasets?level=advanced")
    assert res.status_code == 200
    body = res.json()
    items = body["data"]["items"]
    assert len(items) == 1
    assert items[0]["id"] == "ds-ai-rag-knowledge-chunks-v1"


def test_filter_by_publication_status(client: TestClient):
    """Lọc theo trạng thái đã phát hành (published) loại trừ bản nháp."""
    res = client.get("/api/v1/portal/datasets?status=published")
    assert res.status_code == 200
    body = res.json()
    items = body["data"]["items"]
    assert len(items) == 4
    assert all(ds["is_published"] is True for ds in items)

    # Lọc bản nháp (draft)
    res_draft = client.get("/api/v1/portal/datasets?status=draft")
    assert res_draft.status_code == 200
    items_draft = res_draft.json()["data"]["items"]
    assert len(items_draft) == 1
    assert items_draft[0]["id"] == "ds-cyber-ai-student-survey-draft"
    assert items_draft[0]["is_published"] is False


def test_combined_search_and_filter(client: TestClient):
    """Kết hợp vừa tìm từ khóa 'churn' vừa lọc Domain Telecom."""
    res = client.get("/api/v1/portal/datasets?q=churn&domain=Telecom")
    assert res.status_code == 200
    body = res.json()
    items = body["data"]["items"]
    assert len(items) == 1
    assert items[0]["id"] == "ds-customer-churn-classification-v1"


def test_get_dataset_detail_success(client: TestClient):
    """Tra cứu chi tiết một dataset tồn tại."""
    res = client.get("/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1")
    assert res.status_code == 200
    body = res.json()
    assert body["data"]["id"] == "ds-retail-ecommerce-sales-v1"
    assert body["data"]["quality_tier"] == "Tier A"
    assert body["data"]["quality_score"] == 98.5


def test_get_dataset_detail_not_found(client: TestClient):
    """Tra cứu dataset không tồn tại trả về 404 trong Uniform Error Envelope."""
    res = client.get("/api/v1/portal/datasets/ds-non-existent-999")
    assert res.status_code == 404
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "DATASET_NOT_FOUND"
