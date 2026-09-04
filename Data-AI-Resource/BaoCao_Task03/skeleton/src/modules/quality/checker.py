"""Data Quality Checker: Thẩm định 7 nhóm lỗi dữ liệu trước khi Publish."""

import re
from typing import Any


class DataQualityChecker:
    """Bộ kiểm định chất lượng dữ liệu tự động (Quality Gate)."""

    def __init__(self, min_score_threshold: float = 85.0):
        self.min_score_threshold = min_score_threshold

    def check_pii(self, texts: list[str]) -> list[str]:
        """Quét và phát hiện số điện thoại và email chưa ẩn danh (PII)."""
        phone_pattern = re.compile(r"(\+?84|0[3|5|7|8|9])[0-9]{8}\b")
        email_pattern = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

        detected = []
        for text in texts:
            if phone_pattern.search(text):
                detected.append("PII:PHONE")
            if email_pattern.search(text):
                detected.append("PII:EMAIL")
        return list(set(detected))

    def evaluate_quality_score(
        self, missing_ratio: float, duplicate_ratio: float
    ) -> dict[str, Any]:
        """Tính điểm chất lượng từ 0-100 dựa trên tỷ lệ khuyết thiếu và trùng lặp."""
        score = 100.0 - (missing_ratio * 40.0) - (duplicate_ratio * 40.0)
        score = max(0.0, min(100.0, score))
        passed = score >= self.min_score_threshold
        return {
            "quality_score": round(score, 2),
            "passed": passed,
            "min_threshold": self.min_score_threshold,
        }
