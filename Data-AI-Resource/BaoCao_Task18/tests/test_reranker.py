"""Unit tests for CrossContextReranker."""

from src.reranker import CrossContextReranker


def test_reranker_feature_scoring():
    reranker = CrossContextReranker()
    candidate = {
        "chunk_id": "C_TEST",
        "title": "Chính sách bảo lưu khóa học",
        "breadcrumbs": "# Chính sách > ## Bảo lưu",
        "text": "Học viên được phép nộp đơn xin bảo lưu khóa học tại văn phòng đào tạo.",
    }
    query = "Làm thế nào để xin bảo lưu khóa học?"
    scores = reranker.score_candidate(query, candidate, initial_dense_score=0.75)

    assert "rerank_score" in scores
    assert scores["feature_coverage"] > 0.0
    assert scores["feature_title_match"] > 0.0
    assert scores["feature_proximity"] > 0.0
    assert 0.0 <= scores["rerank_score"] <= 1.0


def test_reranker_reordering():
    reranker = CrossContextReranker()
    cand1 = {
        "chunk_id": "general_doc",
        "metadata": {
            "title": "Nội quy chung toàn trường",
            "breadcrumbs": "# Nội quy chung",
            "text": "Sinh viên và học viên tuân thủ các quy định chung của học viện.",
        },
        "score": 0.85,
    }
    cand2 = {
        "chunk_id": "exact_doc",
        "metadata": {
            "title": "Quy chế bảo lưu khóa học CyberSoft",
            "breadcrumbs": "# Học vụ > ## Quy chế bảo lưu khóa học",
            "text": "Thời hạn bảo lưu khóa học tối đa 06 tháng đối với học viên chính thức.",
        },
        "score": 0.80,
    }

    query = "Quy chế bảo lưu khóa học"
    reranked = reranker.rerank(query, [cand1, cand2], top_k=2)

    # exact_doc should be reranked to rank 1 due to high title match & phrase proximity
    assert reranked[0]["chunk_id"] == "exact_doc"
    assert reranked[0]["rerank_rank"] == 1
