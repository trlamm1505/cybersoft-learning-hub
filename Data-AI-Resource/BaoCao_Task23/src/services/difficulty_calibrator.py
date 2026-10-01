"""Bloom Taxonomy and Difficulty Calibration Service (Task 23).

Ensures pedagogical alignment between Bloom cognitive levels, difficulty classification,
and technical complexity of SQL/Python solutions.
"""

from typing import Any

from src.config import BLOOM_LEVELS


class DifficultyCalibratorService:
    """Service to calibrate and validate exercise difficulty against Bloom Taxonomy."""

    BLOOM_KEYWORDS = {
        "Remember": [
            "liệt kê",
            "chỉ ra",
            "xác định",
            "tìm kiếm",
            "list",
            "select",
            "find",
            "retrieve",
            "xem",
        ],
        "Understand": [
            "giải thích",
            "phân loại",
            "mô tả",
            "tóm tắt",
            "explain",
            "describe",
            "classify",
            "summarize",
        ],
        "Apply": [
            "tính toán",
            "áp dụng",
            "lọc",
            "sắp xếp",
            "viết truy vấn",
            "calculate",
            "apply",
            "filter",
            "order",
        ],
        "Analyze": [
            "phân tích",
            "so sánh",
            "gom nhóm",
            "tổng hợp",
            "đối chiếu",
            "group by",
            "aggregate",
            "analyze",
            "join",
        ],
        "Evaluate": [
            "đánh giá",
            "kiểm định",
            "thẩm định",
            "so sánh hiệu suất",
            "evaluate",
            "assess",
            "judge",
            "optimize",
        ],
        "Create": [
            "thiết kế",
            "xây dựng",
            "tạo mới",
            "mô hình hóa",
            "design",
            "construct",
            "synthesize",
            "model",
        ],
    }

    BLOOM_TO_DIFFICULTY = {
        "Remember": "Beginner",
        "Understand": "Beginner",
        "Apply": "Intermediate",
        "Analyze": "Intermediate",
        "Evaluate": "Advanced",
        "Create": "Advanced",
    }

    def calibrate(self, exercise: dict[str, Any]) -> tuple[bool, str, str, list[str]]:
        """Calibrate exercise Bloom level and difficulty.

        Returns:
            (is_valid, calibrated_bloom, calibrated_difficulty, reasons)
        """
        declared_bloom = exercise.get("bloom_level", "Apply")
        declared_diff = exercise.get("difficulty", "Intermediate")
        outcomes = exercise.get("learning_outcomes", [])
        desc = exercise.get("description", "").lower()
        solution = exercise.get("solution_code", "").lower()

        reasons: list[str] = []

        # Analyze keywords in learning outcomes & description
        combined_text = (desc + " " + " ".join(outcomes)).lower()

        detected_bloom = None
        max_hits = 0
        for bloom, keywords in self.BLOOM_KEYWORDS.items():
            hits = sum(1 for kw in keywords if kw in combined_text)
            if hits > max_hits:
                max_hits = hits
                detected_bloom = bloom

        calibrated_bloom = (
            declared_bloom
            if declared_bloom in BLOOM_LEVELS
            else (detected_bloom or "Apply")
        )

        # Technical complexity check from solution code
        is_advanced_sql = any(
            k in solution
            for k in ["over (", "partition by", "with ", "union", "case when", "window"]
        )
        is_intermediate_sql = any(
            k in solution for k in ["group by", "having", "join", "distinct", "round("]
        )

        expected_diff = self.BLOOM_TO_DIFFICULTY.get(calibrated_bloom, "Intermediate")

        # Override difficulty if solution clearly requires advanced techniques
        if is_advanced_sql:
            calibrated_diff = "Advanced"
        elif is_intermediate_sql:
            calibrated_diff = (
                "Intermediate" if expected_diff != "Advanced" else "Advanced"
            )
        else:
            calibrated_diff = expected_diff

        is_valid = True
        if declared_bloom != calibrated_bloom:
            reasons.append(
                f"Cấp độ Bloom khai báo ({declared_bloom}) được hiệu chuẩn sang ({calibrated_bloom}) theo từ khóa sư phạm."
            )
            is_valid = False

        if declared_diff != calibrated_diff:
            reasons.append(
                f"Độ khó khai báo ({declared_diff}) được điều chỉnh sang ({calibrated_diff}) theo độ phức tạp mã giải pháp."
            )
            is_valid = False

        return is_valid, calibrated_bloom, calibrated_diff, reasons
