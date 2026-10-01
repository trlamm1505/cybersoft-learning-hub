"""Tests for Access Rules and Download Restrictions (Core DoD Requirement)."""

from fastapi.testclient import TestClient


def test_download_published_dataset_success(client: TestClient):
    """Tải tập dữ liệu đã xuất bản thành công với mã 200 và header SHA-256."""
    res = client.get("/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/download")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "X-Checksum-SHA256" in res.headers
    assert (
        res.headers["X-Checksum-SHA256"]
        == "99b617486fd299e5037eff1cf44e35511c306722c60f243fbe223c5dca1e16b8"
    )
    assert len(res.content) > 0


def test_block_download_unpublished_draft_dataset(client: TestClient):
    """
    TIÊU CHÍ NGHIỆM THU (DoD):
    Hệ thống BẮT BUỘC CHẶN tải tập dữ liệu chưa xuất bản (is_published=False)
    với mã HTTP 403 Forbidden và Uniform Error Envelope.
    """
    res = client.get(
        "/api/v1/portal/datasets/ds-cyber-ai-student-survey-draft/download"
    )
    assert res.status_code == 403
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "DATASET_UNPUBLISHED_RESTRICTED"
    assert "chưa xuất bản" in body["error"]["message"].lower()


def test_download_not_found(client: TestClient):
    """Tải dataset không tồn tại trả về 404."""
    res = client.get("/api/v1/portal/datasets/ds-fake-non-existent/download")
    assert res.status_code == 404
    body = res.json()
    assert body["error"]["code"] == "DATASET_NOT_FOUND"
