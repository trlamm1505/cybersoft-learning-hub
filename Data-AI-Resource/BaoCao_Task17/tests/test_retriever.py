"""Tests for BaselineRetriever."""

import pytest
from src.embeddings import EmbeddingEngine
from src.retriever import BaselineRetriever, SearchResult
from src.vector_index import VectorIndex


@pytest.fixture
def configured_retriever():
    corpus = [
        "Quy chế bảo lưu khóa học tại học viện đào tạo CyberSoft",
        "Chính sách hoàn trả học phí và rút hồ sơ nhập học học viên",
        "Quy định chuyên cần và điểm danh lớp học lập trình",
    ]
    meta = [
        {
            "chunk_id": "c1",
            "document_id": "CS-POL-001",
            "section_id": "SEC-01",
            "text": corpus[0],
            "char_start": 0,
            "char_end": 50,
            "metadata": {
                "title": "Quy chế bảo lưu",
                "breadcrumbs": "# Title > ## Sec 1",
                "file_path": "data/corpus/doc1.md",
                "category": "Policy",
            },
        },
        {
            "chunk_id": "c2",
            "document_id": "CS-POL-002",
            "section_id": "SEC-02",
            "text": corpus[1],
            "char_start": 0,
            "char_end": 50,
            "metadata": {
                "title": "Chính sách hoàn phí",
                "breadcrumbs": "# Title > ## Sec 2",
                "file_path": "data/corpus/doc2.md",
                "category": "Policy",
            },
        },
        {
            "chunk_id": "c3",
            "document_id": "CS-POL-003",
            "section_id": "SEC-03",
            "text": corpus[2],
            "char_start": 0,
            "char_end": 50,
            "metadata": {
                "title": "Quy định chuyên cần",
                "breadcrumbs": "# Title > ## Sec 3",
                "file_path": "data/corpus/doc3.md",
                "category": "Attendance",
            },
        },
    ]

    engine = EmbeddingEngine(dimension=4)
    engine.fit(corpus)
    vecs = engine.encode(corpus)

    idx = VectorIndex(dimension=engine.dimension)
    idx.add(vecs, meta)

    return BaselineRetriever(embedding_engine=engine, vector_index=idx)


def test_retriever_search_returns_citation(configured_retriever):
    results = configured_retriever.search("bảo lưu khóa học", top_k=2)

    assert len(results) > 0
    top = results[0]
    assert isinstance(top, SearchResult)
    assert top.citation.document_id == "CS-POL-001"
    assert top.citation.section_id == "SEC-01"
    assert top.citation.title == "Quy chế bảo lưu"
    assert top.citation.breadcrumbs == "# Title > ## Sec 1"
    assert top.citation.file_path == "data/corpus/doc1.md"


def test_retriever_category_filter(configured_retriever):
    results = configured_retriever.search(
        "quy chế học tập",
        top_k=5,
        category="Attendance",
    )

    assert len(results) == 1
    assert results[0].chunk_id == "c3"


def test_retriever_empty_query(configured_retriever):
    assert configured_retriever.search("") == []
    assert configured_retriever.search("   ") == []


def test_retriever_min_score_cutoff(configured_retriever):
    # If min_score is set to an impossibly high value
    results = configured_retriever.search("bảo lưu khóa học", top_k=5, min_score=0.999)
    assert isinstance(results, list)
