"""Kiểm tra logic sơ bộ của Quality Gate, Registry và RAG Retriever."""

import pytest

from src.modules.project.manager import ProjectBankManager
from src.modules.quality.checker import DataQualityChecker
from src.modules.rag.retriever import SemanticRetriever


def test_quality_checker_pii(sample_pii_texts):
    """Kiểm tra khả năng phát hiện PII (SĐT, Email)."""
    checker = DataQualityChecker(min_score_threshold=85.0)
    detected = checker.check_pii(sample_pii_texts)
    assert "PII:PHONE" in detected
    assert "PII:EMAIL" in detected


def test_quality_score_calculation():
    """Kiểm tra tính điểm chất lượng dữ liệu."""
    checker = DataQualityChecker(min_score_threshold=85.0)

    # Trường hợp sạch
    result_clean = checker.evaluate_quality_score(
        missing_ratio=0.01, duplicate_ratio=0.01
    )
    assert result_clean["passed"] is True
    assert result_clean["quality_score"] >= 90.0

    # Trường hợp bẩn vượt ngưỡng
    result_dirty = checker.evaluate_quality_score(
        missing_ratio=0.20, duplicate_ratio=0.25
    )
    assert result_dirty["passed"] is False
    assert result_dirty["quality_score"] < 85.0


def test_project_bank_rubric_validation():
    """Kiểm tra ràng buộc Rubric đồ án phải đủ 100 điểm."""
    manager = ProjectBankManager()

    # Hợp lệ (100 điểm)
    valid_rubric = {"data_cleaning": 30, "eda": 30, "modeling": 40}
    project = manager.register_project(
        "PRJ-01", "Capstone DA", "Data Analytics", valid_rubric
    )
    assert project["project_id"] == "PRJ-01"

    # Không hợp lệ (90 điểm)
    invalid_rubric = {"data_cleaning": 30, "eda": 30, "modeling": 30}
    with pytest.raises(ValueError, match="Tổng điểm Rubric phải bằng đúng 100 điểm"):
        manager.register_project("PRJ-02", "Capstone Lỗi", "AI", invalid_rubric)


def test_rag_retriever_abstention():
    """Kiểm tra cơ chế Abstention từ chối trả lời khi độ tương đồng thấp."""
    retriever = SemanticRetriever(similarity_threshold=0.65)

    low_score_chunks = [
        {"doc_id": "DOC-01", "score": 0.42, "content": "Nội dung không liên quan"},
    ]
    result = retriever.search_with_abstention("Hỏi về quy chế thi", low_score_chunks)
    assert result["is_abstained"] is True

    high_score_chunks = [
        {
            "doc_id": "DOC-02",
            "score": 0.88,
            "content": "Quy chế thi tốt nghiệp CyberSoft",
        },
    ]
    result_high = retriever.search_with_abstention(
        "Quy chế thi tốt nghiệp", high_score_chunks
    )
    assert result_high["is_abstained"] is False
    assert "DOC-02" in result_high["citations"]
