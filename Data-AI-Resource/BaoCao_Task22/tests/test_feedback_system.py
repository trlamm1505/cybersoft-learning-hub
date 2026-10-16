"""Tests for Usefulness Feedback System (1-5 Stars)."""

from fastapi.testclient import TestClient


def test_submit_valid_5star_feedback(client: TestClient):
    """Gửi đánh giá 5 sao hợp lệ cho dataset bán hàng."""
    payload = {
        "rating": 5,
        "reviewer_name": "TS. Nguyen Minh Thang",
        "role": "instructor",
        "comment": "Dataset 3NF rất tốt cho học viên thực hành bài tập SQL truy vấn nâng cao.",
        "usefulness_aspects": ["clean_data", "schema_3nf"],
    }
    res = client.post(
        "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/feedback", json=payload
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]
    assert data["rating"] == 5
    assert data["reviewer_name"] == "TS. Nguyen Minh Thang"
    assert "fbk-" in data["id"]


def test_submit_invalid_rating_bounds(client: TestClient):
    """Gửi rating vượt ngưỡng (ví dụ 6 sao hoặc 0 sao) bị chặn bởi Pydantic 422."""
    res_high = client.post(
        "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/feedback",
        json={
            "rating": 6,
            "reviewer_name": "Test",
            "role": "student",
            "comment": "Quá tốt",
        },
    )
    assert res_high.status_code == 422
    assert res_high.json()["error"]["code"] == "VALIDATION_ERROR"

    res_zero = client.post(
        "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/feedback",
        json={
            "rating": 0,
            "reviewer_name": "Test",
            "role": "student",
            "comment": "Quá tệ",
        },
    )
    assert res_zero.status_code == 422


def test_submit_too_short_comment(client: TestClient):
    """Nhận xét dưới 5 ký tự bị từ chối 422."""
    res = client.post(
        "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/feedback",
        json={"rating": 4, "reviewer_name": "Test", "role": "student", "comment": "Hi"},
    )
    assert res.status_code == 422


def test_get_feedback_summary(client: TestClient):
    """Lấy danh sách đánh giá và điểm số trung bình của dataset."""
    res = client.get("/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/feedback")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    summary = body["data"]
    assert summary["dataset_id"] == "ds-retail-ecommerce-sales-v1"
    assert summary["average_rating"] >= 4.0
    assert summary["total_ratings"] >= 1
    assert "5" in summary["rating_distribution"]
