"""RESTful API for CyberSoft AI Tutor Grounded Generation & Abstention Engine v0.1.

Tuần 4 - RAG và AI Tutor (Task 19)
Provides FastAPI endpoints for learner Q&A, grounded citations, abstention,
and adversarial evaluation.
"""

from __future__ import annotations

import json
from pathlib import Path
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .tutor_engine import CyberSoftAITutor


class TutorChatRequest(BaseModel):
    query: str = Field(
        ..., min_length=1, description="Câu hỏi hoặc truy vấn của học viên"
    )
    top_k: int = Field(
        default=3,
        ge=1,
        le=10,
        description="Số lượng chunks ngữ cảnh lấy từ Retriever v0.2",
    )
    category: Optional[str] = Field(
        default=None, description="Lọc theo phân loại học liệu"
    )
    document_id: Optional[str] = Field(
        default=None, description="Lọc theo mã tài liệu quy chế cụ thể"
    )


class CitationItemDTO(BaseModel):
    chunk_id: str
    document_code: str
    section_title: str
    exact_quote: str


class TutorChatResponse(BaseModel):
    status: str
    answer: str
    citations: List[CitationItemDTO]
    confidence_score: float
    abstain_reason: Optional[str] = None
    guardrail_status: Dict[str, Any]
    latency_ms: float


class HealthResponse(BaseModel):
    status: str
    version: str
    product_name: str
    retriever_initialized: bool
    total_indexed_chunks: int
    similarity_threshold: float
    guardrails_active: bool


def create_app(tutor: Optional[CyberSoftAITutor] = None) -> FastAPI:
    """Factory function to build FastAPI instance with injected CyberSoftAITutor."""
    app = FastAPI(
        title="CyberSoft AI Tutor Grounded Generation & Abstention API",
        version="0.1.0",
        description="RESTful API for CyberSoft AI Tutor v0.1 with mandatory citations, safe abstention, and multi-layer guardrails.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.state.tutor = tutor or CyberSoftAITutor()

    # Mount UI static folder if present
    ui_dir = Path(__file__).resolve().parent.parent / "ui"
    if ui_dir.exists():
        app.mount("/static", StaticFiles(directory=str(ui_dir)), name="static")

    @app.get("/", include_in_schema=False)
    def serve_ui():
        index_file = ui_dir / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return {
            "message": "CyberSoft AI Tutor API v0.1 is running. Visit /docs for Swagger UI."
        }

    @app.get("/api/v1/tutor/health", response_model=HealthResponse)
    def health_check():
        active_tutor: CyberSoftAITutor = app.state.tutor
        retriever_ok = active_tutor.retriever is not None
        chunk_count = len(active_tutor.retriever.vector_index) if retriever_ok else 0

        return HealthResponse(
            status="healthy",
            version="0.1.0",
            product_name="CyberSoft AI Tutor Grounded Generation & Abstention Engine",
            retriever_initialized=retriever_ok,
            total_indexed_chunks=chunk_count,
            similarity_threshold=active_tutor.similarity_threshold,
            guardrails_active=True,
        )

    @app.post("/api/v1/tutor/chat", response_model=TutorChatResponse)
    def tutor_chat(req: TutorChatRequest):
        active_tutor: CyberSoftAITutor = app.state.tutor
        start_time = time.perf_counter()

        try:
            res_dto = active_tutor.ask(
                query=req.query,
                top_k=req.top_k,
                category=req.category,
                document_id=req.document_id,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0

            citations = [
                CitationItemDTO(
                    chunk_id=c.get("chunk_id", ""),
                    document_code=c.get("document_code", ""),
                    section_title=c.get("section_title", ""),
                    exact_quote=c.get("exact_quote", ""),
                )
                for c in res_dto.citations
            ]

            return TutorChatResponse(
                status=res_dto.status,
                answer=res_dto.answer,
                citations=citations,
                confidence_score=res_dto.confidence_score,
                abstain_reason=res_dto.abstain_reason,
                guardrail_status=res_dto.guardrail_status,
                latency_ms=round(elapsed_ms, 2),
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Internal Tutor Error: {str(e)}"
            )

    @app.post("/api/v1/tutor/evaluate-adversarial")
    def run_adversarial_eval():
        active_tutor: CyberSoftAITutor = app.state.tutor
        eval_file = (
            Path(__file__).resolve().parent.parent
            / "data"
            / "eval"
            / "adversarial_tests_20.json"
        )
        if not eval_file.exists():
            raise HTTPException(
                status_code=404, detail="Adversarial dataset not found."
            )

        with open(eval_file, "r", encoding="utf-8") as f:
            test_cases = json.load(f)

        return active_tutor.evaluate_adversarial(test_cases)

    return app
