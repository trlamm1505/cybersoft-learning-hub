"""Endpoints for Semantic & Hybrid Search."""

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import require_roles
from ..schemas.common import SuccessEnvelope
from ..schemas.search import (
    SearchChunkItem,
    SemanticSearchRequest,
    SemanticSearchResponse,
)
from ..services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Semantic Search & Retrieval"])


@router.post(
    "/semantic",
    response_model=SuccessEnvelope[SemanticSearchResponse],
    status_code=status.HTTP_200_OK,
    summary="Tìm kiếm lai kết hợp ngữ nghĩa và từ khóa trên học liệu",
    description="Thực thi thuật toán kết hợp BM25 và Vector Dense RRF để tìm các đoạn trích giáo trình phù hợp nhất.",
)
def search_semantic(
    payload: SemanticSearchRequest,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[SemanticSearchResponse]:
    data = SearchService.hybrid_search(payload)
    return SuccessEnvelope(data=data)


@router.get(
    "/chunks/{chunk_id}",
    response_model=SuccessEnvelope[SearchChunkItem],
    status_code=status.HTTP_200_OK,
    summary="Tra cứu chi tiết một đoạn trích giáo trình theo mã chunk_id",
    description="Trả về toàn văn nội dung, tiêu đề tài liệu, mục và thẻ phân loại của chunk.",
)
def get_chunk(
    chunk_id: str,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[SearchChunkItem]:
    chunk = SearchService.get_chunk_by_id(chunk_id)
    if not chunk:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "CHUNK_NOT_FOUND",
                "message": f"Không tìm thấy đoạn trích học liệu với mã chunk_id '{chunk_id}'.",
                "details": [
                    {
                        "field": "chunk_id",
                        "issue": "Chunk does not exist in indexed corpus",
                    }
                ],
            },
        )
    return SuccessEnvelope(data=chunk)
