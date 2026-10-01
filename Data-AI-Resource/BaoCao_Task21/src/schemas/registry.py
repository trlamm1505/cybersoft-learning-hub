"""Schemas for Dataset Registry and Project Bank endpoints."""

from typing import Any

from pydantic import BaseModel, Field

from .common import PaginationMeta


class DatasetColumnSchema(BaseModel):
    """Schema definition for a dataset column."""

    name: str = Field(..., description="Tên trường dữ liệu")
    type: str = Field(
        ..., description="Kiểu dữ liệu (string, integer, float, datetime, boolean)"
    )
    nullable: bool = Field(False, description="Trường có thể rỗng hay không")
    description: str = Field("", description="Mô tả ý nghĩa nghiệp vụ của trường")


class DatasetItem(BaseModel):
    """Summary item of a registered dataset."""

    id: str = Field(..., description="Mã định danh duy nhất của dataset")
    name: str = Field(..., description="Tên dataset")
    domain: str = Field(
        ..., description="Lĩnh vực (Retail, HR/Operations, NLP/RAG, Education)"
    )
    difficulty_level: str = Field(
        ..., description="Độ khó (beginner, intermediate, advanced)"
    )
    format: str = Field(..., description="Định dạng tệp (csv, json, jsonl, parquet)")
    records_count: int = Field(..., description="Tổng số bản ghi dữ liệu")
    current_version: str = Field("v1.0", description="Phiên bản phát hành hiện tại")
    tags: list[str] = Field(
        default_factory=list, description="Danh mục thẻ tìm kiếm nhanh"
    )
    is_public: bool = Field(
        True, description="Học viên có quyền truy cập trực tiếp hay không"
    )


class DatasetDetail(DatasetItem):
    """Detailed metadata and contracts for a registered dataset."""

    description: str = Field(
        ..., description="Mô tả chi tiết bài toán và ngữ cảnh ứng dụng"
    )
    schema_definition: list[DatasetColumnSchema] = Field(
        default_factory=list, description="Cấu trúc lược đồ dữ liệu chi tiết"
    )
    checksum_sha256: str = Field(..., description="Mã băm toàn vẹn SHA-256")
    file_size_bytes: int = Field(0, description="Kích thước tệp tính bằng bytes")
    created_at: str = Field(..., description="Thời điểm khởi tạo ISO 8601")
    license: str = Field(
        "CyberSoft Academy Internal Use", description="Bản quyền sử dụng"
    )
    sample_preview: list[dict[str, Any]] = Field(
        default_factory=list, description="Mẫu 3 bản ghi đầu tiên xem trước"
    )


class DatasetListResponse(BaseModel):
    """Response payload for datasets list."""

    items: list[DatasetItem] = Field(
        ..., description="Danh sách các dataset thỏa điều kiện"
    )
    pagination: PaginationMeta = Field(..., description="Thông tin phân trang")


class ProjectItem(BaseModel):
    """Summary item of a student capstone project."""

    id: str = Field(..., description="Mã định danh duy nhất của đề án")
    title: str = Field(..., description="Tên đề tài dự án")
    track: str = Field(
        ..., description="Chuyên ngành (Data Analyst, AI Engineer, Fullstack)"
    )
    target_audience: str = Field(
        ..., description="Đối tượng phù hợp (K3-12, Đại học, Người chuyển ngành)"
    )
    difficulty: str = Field(..., description="Mức độ phức tạp (Level 1-5)")
    estimated_hours: int = Field(..., description="Thời lượng thực hiện ước tính (giờ)")
    associated_dataset_ids: list[str] = Field(
        default_factory=list, description="Danh sách dataset sử dụng trong đề án"
    )


class ProjectDetail(ProjectItem):
    """Detailed specification and grading rubric for a student capstone project."""

    objectives: list[str] = Field(..., description="Mục tiêu đầu ra của dự án")
    deliverables: list[str] = Field(
        ..., description="Sản phẩm học viên cần nộp (Dashboard, Notebook, REST API...)"
    )
    rubric_summary: dict[str, int] = Field(
        ..., description="Trọng số các tiêu chí chấm điểm (%)"
    )
    recommended_tools: list[str] = Field(
        default_factory=list,
        description="Công cụ khuyến nghị (PowerBI, Python, SQL...)",
    )


class ProjectListResponse(BaseModel):
    """Response payload for capstone projects list."""

    items: list[ProjectItem] = Field(..., description="Danh sách đề tài thỏa điều kiện")
    pagination: PaginationMeta = Field(..., description="Thông tin phân trang")
