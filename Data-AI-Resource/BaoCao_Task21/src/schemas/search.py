"""Schemas for Semantic & Hybrid Search endpoints."""

from typing import Any

from pydantic import BaseModel, Field


class SemanticSearchRequest(BaseModel):
    """Payload for executing hybrid semantic search over CyberSoft course corpus."""

    query: str = Field(
        ...,
        min_length=2,
        max_length=500,
        description="Truy vấn tìm kiếm của người dùng hoặc học viên",
    )
    top_k: int = Field(
        5,
        ge=1,
        le=20,
        description="Số lượng kết quả phù hợp nhất cần trả về (1 đến 20)",
    )
    similarity_threshold: float = Field(
        0.1,
        ge=0.0,
        le=1.0,
        description="Ngưỡng điểm tương đồng tối thiểu để đưa vào kết quả",
    )
    filters: dict[str, Any] | None = Field(
        default=None, description="Bộ lọc nâng cao (document_title, tags...)"
    )


class SearchChunkItem(BaseModel):
    """Retrieved chunk item with relevance score and source metadata."""

    chunk_id: str = Field(..., description="Mã định danh duy nhất của đoạn văn bản")
    document_title: str = Field(..., description="Tên tài liệu / giáo trình nguồn")
    section_header: str = Field(..., description="Tiêu đề mục hoặc chương sách")
    content: str = Field(..., description="Nội dung chi tiết của đoạn trích")
    relevance_score: float = Field(
        ..., description="Điểm số tương đồng tổng hợp kết hợp RRF (0.0 đến 1.0)"
    )
    source_citation: str = Field(
        ..., description="Chuỗi trích nguồn tiêu chuẩn dạng [Doc X, Mục Y]"
    )
    tags: list[str] = Field(default_factory=list, description="Thẻ phân loại chuyên đề")


class SemanticSearchResponse(BaseModel):
    """Response payload for semantic search."""

    query: str = Field(..., description="Truy vấn gốc đã thực thi")
    total_found: int = Field(
        ..., description="Tổng số đoạn trích tìm thấy vượt qua ngưỡng lọc"
    )
    execution_time_ms: float = Field(
        ..., description="Thời gian thực thi tìm kiếm lai tính bằng milliseconds"
    )
    results: list[SearchChunkItem] = Field(
        ..., description="Danh sách các đoạn trích phù hợp nhất xếp theo thứ hạng"
    )
