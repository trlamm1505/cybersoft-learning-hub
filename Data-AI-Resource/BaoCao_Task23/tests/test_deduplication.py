"""Unit tests for Deduplication Service (Task 23)."""

from src.services.deduplicator import DeduplicationService


def test_deduplication_exact_match():
    """Verify that exact or near-identical text triggers duplicate warning."""
    dedup = DeduplicationService(threshold=0.70)
    cand = {
        "id": "EX-NEW",
        "title": "Liệt Kê Các Đơn Hàng Đã Hoàn Thành",
        "description": "Viết câu truy vấn SQL liệt kê toàn bộ thông tin các đơn hàng có trạng thái là Completed từ bảng retail_sales_v1.",
    }
    bank = [
        {
            "id": "EX-EXISTING",
            "title": "Liệt Kê Các Đơn Hàng Đã Hoàn Thành",
            "description": "Viết câu truy vấn SQL liệt kê toàn bộ thông tin các đơn hàng có trạng thái là Completed từ bảng retail_sales_v1.",
        }
    ]

    is_dup, score, matched_id = dedup.check_duplication(cand, bank)
    assert is_dup is True
    assert score >= 0.70
    assert matched_id == "EX-EXISTING"


def test_deduplication_distinct_exercise():
    """Verify that distinct exercises have similarity well below 0.70."""
    dedup = DeduplicationService(threshold=0.70)
    cand = {
        "id": "EX-NEW",
        "title": "Phân Tích Tương Quan Thời Gian Churn",
        "description": "Phân nhóm khách hàng theo thời gian gắn bó viễn thông và cước phí hàng tháng.",
    }
    bank = [
        {
            "id": "EX-EXISTING",
            "title": "Thống Kê Giờ Làm Việc Nhân Sự",
            "description": "Tính số giờ làm việc trung bình của nhân viên theo từng phòng ban.",
        }
    ]

    is_dup, score, matched_id = dedup.check_duplication(cand, bank)
    assert is_dup is False
    assert score < 0.70
