"""RESTful Search API for CyberSoft RAG Baseline.

Tuần 4 - RAG và AI Tutor (Task 17)
Provides FastAPI endpoints for vector search, health check, and index statistics
with complete Citation provenance metadata.
"""

from __future__ import annotations

import time
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from .retriever import BaselineRetriever


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Truy vấn tìm kiếm")
    top_k: int = Field(
        default=5, ge=1, le=50, description="Số lượng chunks tối đa trả về"
    )
    category: Optional[str] = Field(
        default=None, description="Lọc theo phân loại tài liệu"
    )
    document_id: Optional[str] = Field(
        default=None, description="Lọc theo mã tài liệu cụ thể"
    )
    min_score: float = Field(
        default=0.0, ge=0.0, le=1.0, description="Ngưỡng điểm tương đồng tối thiểu"
    )


class CitationResponse(BaseModel):
    document_id: str
    section_id: str
    title: str
    breadcrumbs: str
    file_path: str
    char_start: int
    char_end: int


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    score: float
    text: str
    citation: CitationResponse


class SearchResponse(BaseModel):
    query: str
    total_results: int
    latency_ms: float
    results: List[SearchResultItem]


class HealthResponse(BaseModel):
    status: str
    vectors_count: int
    dimension: int
    model_name: str


def create_app(retriever: Optional[BaselineRetriever] = None) -> FastAPI:
    """Factory function to build FastAPI instance with injected retriever."""
    app = FastAPI(
        title="CyberSoft RAG Retriever API",
        version="0.1.0",
        description="RESTful Search Engine for CyberSoft Academic Knowledge Base",
    )

    # State container
    app.state.retriever = retriever

    @app.get("/api/v1/health", response_model=HealthResponse)
    def health_check():
        active_retriever: BaselineRetriever = app.state.retriever
        if active_retriever is None:
            return HealthResponse(
                status="uninitialized",
                vectors_count=0,
                dimension=0,
                model_name="none",
            )
        idx = active_retriever.vector_index
        return HealthResponse(
            status="healthy",
            vectors_count=len(idx),
            dimension=idx.dimension,
            model_name="TFIDF-SVD-L2",
        )

    @app.post("/api/v1/search", response_model=SearchResponse)
    def search_chunks(req: SearchRequest):
        active_retriever: BaselineRetriever = app.state.retriever
        if active_retriever is None:
            raise HTTPException(
                status_code=503,
                detail="Retriever index not loaded into API service.",
            )

        start_t = time.perf_counter()
        matches = active_retriever.search(
            query=req.query,
            top_k=req.top_k,
            category=req.category,
            document_id=req.document_id,
            min_score=req.min_score,
        )
        latency_ms = round((time.perf_counter() - start_t) * 1000.0, 2)

        items = [
            SearchResultItem(
                chunk_id=m.chunk_id,
                document_id=m.document_id,
                score=round(m.score, 4),
                text=m.text,
                citation=CitationResponse(
                    document_id=m.citation.document_id,
                    section_id=m.citation.section_id,
                    title=m.citation.title,
                    breadcrumbs=m.citation.breadcrumbs,
                    file_path=m.citation.file_path,
                    char_start=m.citation.char_start,
                    char_end=m.citation.char_end,
                ),
            )
            for m in matches
        ]

        return SearchResponse(
            query=req.query,
            total_results=len(items),
            latency_ms=latency_ms,
            results=items,
        )

    @app.get("/api/v1/stats")
    def get_stats():
        active_retriever: BaselineRetriever = app.state.retriever
        if active_retriever is None:
            raise HTTPException(status_code=503, detail="Retriever not initialized.")

        idx = active_retriever.vector_index
        categories: Dict[str, int] = {}
        docs: Dict[str, int] = {}

        for meta in idx.metadata_list:
            cat = meta.get("metadata", {}).get("category", "Uncategorized")
            d_id = meta.get("document_id", "UNKNOWN")
            categories[cat] = categories.get(cat, 0) + 1
            docs[d_id] = docs.get(d_id, 0) + 1

        return {
            "total_chunks_indexed": len(idx),
            "vector_dimension": idx.dimension,
            "unique_documents": len(docs),
            "categories": categories,
        }

    return app
