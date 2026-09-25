"""RESTful Search API for CyberSoft RAG Hybrid Retrieval & Reranking.

Tuần 4 - RAG và AI Tutor (Task 18)
Provides FastAPI endpoints for hybrid search, lexical BM25, dense vector,
cross-context reranking, and complete Citation metadata provenance.
"""

from __future__ import annotations

import time
from typing import Dict, List, Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .hybrid_retriever import HybridRetriever


class HybridSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Truy vấn tìm kiếm người dùng")
    top_k: int = Field(default=5, ge=1, le=50, description="Số lượng kết quả trả về")
    mode: Literal[
        "dense_only", "bm25_only", "hybrid_rrf", "hybrid_weighted", "reranked"
    ] = Field(
        default="reranked",
        description="Chế độ tìm kiếm: dense_only | bm25_only | hybrid_rrf | hybrid_weighted | reranked",
    )
    category: Optional[str] = Field(
        default=None, description="Lọc theo phân loại tài liệu"
    )
    document_id: Optional[str] = Field(
        default=None, description="Lọc theo mã văn bản cụ thể"
    )
    min_score: Optional[float] = Field(
        default=None, description="Ngưỡng điểm tối thiểu"
    )


class CitationResponse(BaseModel):
    document_id: str
    section_id: str
    title: str
    breadcrumbs: str
    category: str
    file_path: str
    char_start: int
    char_end: int
    content_snippet: str


class SearchResultItem(BaseModel):
    chunk_id: str
    rank: int
    score: float
    dense_score: float
    bm25_score: float
    dense_rank: int
    bm25_rank: int
    feature_breakdown: Optional[Dict[str, float]] = None
    citation: CitationResponse


class HybridSearchResponse(BaseModel):
    query: str
    mode: str
    total_results: int
    latency_ms: float
    results: List[SearchResultItem]


class HealthResponse(BaseModel):
    status: str
    version: str
    total_chunks: int
    dimension: int
    bm25_corpus_size: int
    available_modes: List[str]


def create_app(retriever: Optional[HybridRetriever] = None) -> FastAPI:
    """Factory function to build FastAPI instance with injected HybridRetriever."""
    app = FastAPI(
        title="CyberSoft RAG Hybrid Search & Reranking API",
        version="0.2.0",
        description="RESTful Search Service for CyberSoft RAG v0.2 with BM25, Dense Vector, RRF and Reranker",
    )

    app.state.retriever = retriever

    @app.get("/api/v1/health", response_model=HealthResponse)
    def health_check():
        active_retriever: HybridRetriever = app.state.retriever
        if not active_retriever:
            return HealthResponse(
                status="uninitialized",
                version="0.2.0",
                total_chunks=0,
                dimension=0,
                bm25_corpus_size=0,
                available_modes=[
                    "dense_only",
                    "bm25_only",
                    "hybrid_rrf",
                    "hybrid_weighted",
                    "reranked",
                ],
            )

        return HealthResponse(
            status="healthy",
            version="0.2.0",
            total_chunks=len(active_retriever.vector_index),
            dimension=active_retriever.embedding_engine.dimension,
            bm25_corpus_size=active_retriever.bm25_engine.corpus_size,
            available_modes=[
                "dense_only",
                "bm25_only",
                "hybrid_rrf",
                "hybrid_weighted",
                "reranked",
            ],
        )

    @app.post("/api/v1/search", response_model=HybridSearchResponse)
    def search_documents(request: HybridSearchRequest):
        active_retriever: HybridRetriever = app.state.retriever
        if not active_retriever:
            raise HTTPException(
                status_code=503,
                detail="Hybrid Retriever engine is not initialized or index is missing.",
            )

        t0 = time.perf_counter()
        raw_results = active_retriever.search(
            query=request.query,
            top_k=request.top_k,
            mode=request.mode,
            category=request.category,
            document_id=request.document_id,
            min_score=request.min_score,
        )
        elapsed_ms = (time.perf_counter() - t0) * 1000.0

        items: List[SearchResultItem] = []
        for r in raw_results:
            c = r["citation"]
            cit = CitationResponse(
                document_id=c.get("document_id", "UNKNOWN"),
                section_id=c.get("section_id", "UNKNOWN"),
                title=c.get("title", ""),
                breadcrumbs=c.get("breadcrumbs", ""),
                category=c.get("category", "General"),
                file_path=c.get("file_path", ""),
                char_start=c.get("char_start", 0),
                char_end=c.get("char_end", 0),
                content_snippet=c.get("content_snippet", ""),
            )
            items.append(
                SearchResultItem(
                    chunk_id=r["chunk_id"],
                    rank=r["rank"],
                    score=r["score"],
                    dense_score=r.get("dense_score", 0.0),
                    bm25_score=r.get("bm25_score", 0.0),
                    dense_rank=r.get("dense_rank", 999),
                    bm25_rank=r.get("bm25_rank", 999),
                    feature_breakdown=r.get("feature_breakdown"),
                    citation=cit,
                )
            )

        return HybridSearchResponse(
            query=request.query,
            mode=request.mode,
            total_results=len(items),
            latency_ms=round(elapsed_ms, 2),
            results=items,
        )

    return app
