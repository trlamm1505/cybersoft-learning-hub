"""Unit tests for Bloom Taxonomy and Difficulty Calibration (Task 23)."""

from src.services.difficulty_calibrator import DifficultyCalibratorService


def test_calibrate_beginner_remember():
    """Verify Remember verb leads to Beginner difficulty."""
    calibrator = DifficultyCalibratorService()
    ex = {
        "bloom_level": "Remember",
        "difficulty": "Beginner",
        "description": "Liệt kê danh sách nhân viên đi làm đúng giờ",
        "learning_outcomes": ["Học viên liệt kê được các bản ghi đơn giản."],
        "solution_code": "SELECT * FROM hr_attendance_v1 WHERE status = 'OnTime';",
    }
    is_valid, bloom, diff, reasons = calibrator.calibrate(ex)
    assert bloom == "Remember"
    assert diff == "Beginner"


def test_calibrate_advanced_window_function():
    """Verify advanced SQL overrides difficulty to Advanced."""
    calibrator = DifficultyCalibratorService()
    ex = {
        "bloom_level": "Evaluate",
        "difficulty": "Beginner",  # Incorrectly declared
        "description": "Đánh giá xếp hạng doanh thu sử dụng window function",
        "learning_outcomes": ["Học viên đánh giá được phân hạng."],
        "solution_code": "SELECT order_id, ROW_NUMBER() OVER (PARTITION BY city ORDER BY total_amount DESC) FROM retail_sales_v1;",
    }
    is_valid, bloom, diff, reasons = calibrator.calibrate(ex)
    assert diff == "Advanced"
    assert is_valid is False
    assert len(reasons) > 0
