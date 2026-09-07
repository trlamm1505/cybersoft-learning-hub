"""Evaluation Harness: Đo lường chất lượng định lượng cho RAG và Quality Gate."""


class EvaluationHarness:
    """Hệ thống đánh giá hồi quy tự động trên bộ Ground Truth."""

    def __init__(self):
        pass

    def calculate_hit_at_k(
        self, predictions: list[list[str]], ground_truths: list[str], k: int = 3
    ) -> float:
        """Tính toán tỷ lệ Hit@K (Liệu ground truth có nằm trong top K kết quả dự đoán)."""
        if (
            not predictions
            or not ground_truths
            or len(predictions) != len(ground_truths)
        ):
            return 0.0

        hits = 0
        for preds, truth in zip(predictions, ground_truths, strict=False):
            if truth in preds[:k]:
                hits += 1

        return round(hits / len(ground_truths), 4)

    def calculate_citation_precision(
        self, cited_docs: list[str], relevant_docs: list[str]
    ) -> float:
        """Đo lường độ chính xác của các trích dẫn nguồn giáo trình."""
        if not cited_docs:
            return 0.0

        valid_citations = [doc for doc in cited_docs if doc in relevant_docs]
        return round(len(valid_citations) / len(cited_docs), 4)
