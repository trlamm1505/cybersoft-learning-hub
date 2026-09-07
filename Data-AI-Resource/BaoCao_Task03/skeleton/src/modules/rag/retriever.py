"""Semantic Retriever: Tìm kiếm ngữ nghĩa trên giáo trình và chính sách từ chối (Abstention)."""

from typing import Any


class SemanticRetriever:
    """Bộ truy xuất ngữ nghĩa hỗ trợ RAG kèm chính sách chống ảo giác (Zero Hallucination)."""

    def __init__(self, similarity_threshold: float = 0.65):
        self.similarity_threshold = similarity_threshold

    def search_with_abstention(
        self, query: str, chunks_with_scores: list[dict[str, Any]]
    ) -> dict[str, Any]:
        """Truy xuất các chunk liên quan nhất.

        Nếu điểm tương đồng cao nhất dưới ngưỡng, kích hoạt cờ is_abstained.
        """
        if not chunks_with_scores:
            return {
                "query": query,
                "is_abstained": True,
                "reason": "Không tìm thấy dữ liệu đối soát",
                "citations": [],
            }

        sorted_chunks = sorted(
            chunks_with_scores, key=lambda x: x.get("score", 0.0), reverse=True
        )
        top_chunk = sorted_chunks[0]

        if top_chunk.get("score", 0.0) < self.similarity_threshold:
            return {
                "query": query,
                "is_abstained": True,
                "reason": f"Độ tương đồng cao nhất ({top_chunk.get('score')}) dưới ngưỡng tin cậy ({self.similarity_threshold})",
                "citations": [],
            }

        return {
            "query": query,
            "is_abstained": False,
            "top_score": top_chunk.get("score"),
            "citations": [
                c.get("doc_id")
                for c in sorted_chunks
                if c.get("score", 0.0) >= self.similarity_threshold
            ],
        }
