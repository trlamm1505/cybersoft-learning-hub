"""Pytest fixtures for CyberSoft Task 18."""

from __future__ import annotations

from pathlib import Path
import sys
import pytest

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.bm25 import BM25Engine  # noqa: E402
from src.embeddings import EmbeddingEngine  # noqa: E402
from src.hybrid_retriever import HybridRetriever  # noqa: E402
from src.reranker import CrossContextReranker  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


@pytest.fixture(scope="session")
def sample_corpus():
    return [
        {
            "chunk_id": "TEST_001",
            "document_id": "CS-POL-TEST",
            "section_id": "SEC-TEST-01",
            "title": "Chính sách bảo lưu khóa học tại CyberSoft Academy",
            "breadcrumbs": "# CS-POL-TEST > ## SEC-TEST-01: Quy định bảo lưu khóa học",
            "category": "Academic Policy",
            "file_path": "docs/CS-POL-TEST.md",
            "char_start": 0,
            "char_end": 200,
            "text": "Học viên được quyền bảo lưu khóa học tối đa 06 tháng khi có lý do chính đáng.",
        },
        {
            "chunk_id": "TEST_002",
            "document_id": "CS-TEC-TEST",
            "section_id": "SEC-TEST-02",
            "title": "Hướng dẫn cấu hình WSL2 và Ubuntu cho AI",
            "breadcrumbs": "# CS-TEC-TEST > ## SEC-TEST-02: Cấu hình WSL2",
            "category": "Technical Guide",
            "file_path": "docs/CS-TEC-TEST.md",
            "char_start": 0,
            "char_end": 180,
            "text": "Cài đặt WSL2 với câu lệnh wsl --install và kích hoạt card đồ họa NVIDIA CUDA.",
        },
        {
            "chunk_id": "TEST_003",
            "document_id": "CS-CRS-TEST",
            "section_id": "SEC-TEST-03",
            "title": "Lộ trình Fullstack NodeJS và React",
            "breadcrumbs": "# CS-CRS-TEST > ## SEC-TEST-03: Khóa học Frontend React",
            "category": "Curriculum",
            "file_path": "docs/CS-CRS-TEST.md",
            "char_start": 0,
            "char_end": 220,
            "text": "Khóa học trang bị React Hooks, Redux Toolkit, TailwindCSS và RESTful API integration.",
        },
    ]


@pytest.fixture(scope="session")
def test_retriever(sample_corpus):
    texts = [f"{c['title']} {c['breadcrumbs']} {c['text']}" for c in sample_corpus]
    emb = EmbeddingEngine(dimension=16).fit(texts)
    vecs = emb.encode(texts)
    vidx = VectorIndex(dimension=emb.dimension)
    vidx.add(vecs, sample_corpus)
    bm25 = BM25Engine(k1=1.5, b=0.75).fit(texts)
    reranker = CrossContextReranker()
    return HybridRetriever(
        embedding_engine=emb,
        vector_index=vidx,
        bm25_engine=bm25,
        reranker=reranker,
    )
