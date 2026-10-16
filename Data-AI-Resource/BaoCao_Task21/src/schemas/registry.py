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


class ColumnDictionaryItem(BaseModel):
    """Definition of a table column in the data dictionary."""

    name: str = Field(..., description="Tên cột")
    data_type: str = Field(..., description="Kiểu dữ liệu SQL (VARCHAR, INT, DATE...)")
    nullable: bool = Field(False, description="Cho phép giá trị NULL hay không")
    is_primary_key: bool = Field(False, description="Khóa chính (PK) của bảng")
    is_foreign_key: bool = Field(False, description="Khóa ngoại (FK) liên kết")
    foreign_key_target: str | None = Field(
        None, description="Bảng và cột đích tham chiếu nếu là khóa ngoại (bảng.cột)"
    )
    description: str = Field("", description="Mô tả ý nghĩa nghiệp vụ của cột")


class TableDictionaryItem(BaseModel):
    """Definition of a table schema in the data dictionary."""

    table_name: str = Field(..., description="Tên bảng dữ liệu")
    file_name: str | None = Field(None, description="Tên tệp CSV lưu trữ tương ứng")
    row_count: int | None = Field(None, description="Số lượng bản ghi chuẩn của bảng")
    primary_key: str | None = Field(None, description="Tên cột khóa chính")
    description: str | None = Field(None, description="Mô tả nghiệp vụ của bảng")
    columns: list[ColumnDictionaryItem] = Field(
        default_factory=list, description="Danh sách cột của bảng"
    )


class DatasetDetail(DatasetItem):
    """Detailed metadata and contracts for a registered dataset."""

    description: str = Field(
        ..., description="Mô tả chi tiết bài toán và ngữ cảnh ứng dụng"
    )
    schema_definition: list[DatasetColumnSchema] = Field(
        default_factory=list, description="Cấu trúc lược đồ dữ liệu chi tiết"
    )
    data_dictionary: list[TableDictionaryItem] | None = Field(
        default=None,
        description="Từ điển dữ liệu (Data Dictionary) gồm danh sách các bảng và chi tiết các cột (tên, kiểu dữ liệu, nullable, PK, FK, mô tả)",
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


class EvaluationQuestionItem(BaseModel):
    """Single evaluation question item for AI Lab automated grading."""

    question_id: str = Field(
        ..., description="Mã định danh câu hỏi kiểm thử (ví dụ: EVAL-STD-01)"
    )
    query: str = Field(..., description="Nội dung câu hỏi học viên hoặc kiểm thử")
    ground_truth_answer: str = Field(
        ..., description="Câu trả lời chuẩn mực (ground-truth)"
    )
    expected_behavior: str = Field(
        ...,
        description="Hành vi kỳ vọng của mô hình AI: ANSWER, ABSTAIN, REJECT, GUARD_BLOCKED",
    )
    category: str | None = Field(
        default=None,
        description="Phân loại ca kiểm thử (standard_qa, multi_hop, out_of_domain, adversarial_jailbreak)",
    )
    expected_doc_ids: list[str] = Field(
        default_factory=list, description="Danh sách mã tài liệu kỳ vọng trích xuất"
    )
    expected_chunk_ids: list[str] = Field(
        default_factory=list, description="Danh sách chunk ID kỳ vọng"
    )
    ground_truth_keywords: list[str] = Field(
        default_factory=list, description="Từ khóa bắt buộc phải có trong câu trả lời"
    )


class EvaluationSetDetail(BaseModel):
    """Detailed evaluation set for AI Lab benchmarking."""

    id: str = Field(..., description="Mã định danh bộ dữ liệu đánh giá")
    name: str = Field(..., description="Tên bộ dữ liệu đánh giá")
    version: str = Field(..., description="Phiên bản phát hành")
    target_system: str = Field(
        default="RAG AI Tutor", description="Phân hệ hoặc mô hình đánh giá"
    )
    total_questions: int = Field(..., description="Tổng số lượng câu hỏi đánh giá")
    description: str = Field(..., description="Mô tả mục đích và phạm vi đánh giá")
    questions: list[EvaluationQuestionItem] = Field(
        ..., description="Danh sách toàn bộ câu hỏi và ground-truth tương ứng"
    )


class EvaluationSetListItem(BaseModel):
    """Summary item for evaluation sets list."""

    id: str = Field(..., description="Mã bộ đánh giá")
    name: str = Field(..., description="Tên bộ đánh giá")
    version: str = Field(..., description="Phiên bản")
    target_system: str = Field(..., description="Hệ thống mục tiêu")
    total_questions: int = Field(..., description="Tổng số câu hỏi")
    description: str = Field(..., description="Mô tả")


class EvaluationSetListResponse(BaseModel):
    """List response for evaluation sets."""

    total: int = Field(..., description="Tổng số bộ đánh giá")
    items: list[EvaluationSetListItem] = Field(
        ..., description="Danh sách các bộ đánh giá"
    )


class TableDataResponse(BaseModel):
    """Paginated table data for loading into Postgres Sandbox."""

    dataset_id: str = Field(..., description="Mã dataset")
    table_name: str = Field(..., description="Tên bảng dữ liệu")
    variant: str = Field(
        ...,
        description="Trạng thái bản dữ liệu được cấp: 'clean' (chuẩn sạch nạp DB) hoặc 'dirty' (bản kiểm thử)",
    )
    variant_description: str = Field(
        ...,
        description="Thông báo rõ ràng bản được cấp là clean hay dirty và mục đích sử dụng",
    )
    current_version: str = Field(
        ..., description="Phiên bản hiện tại của bộ dữ liệu (e.g. v1.0)"
    )
    checksum_sha256: str = Field(
        ..., description="Mã băm SHA-256 của tệp bảng tương ứng"
    )
    total_rows: int = Field(..., description="Tổng số bản ghi của bảng")
    page: int = Field(..., description="Trang hiện tại (1-indexed)")
    page_size: int = Field(..., description="Số lượng bản ghi mỗi trang")
    total_pages: int = Field(..., description="Tổng số trang")
    columns: list[str] = Field(..., description="Danh sách tên các cột")
    rows: list[dict[str, Any]] = Field(
        ..., description="Danh sách các bản ghi dữ liệu dạng dict"
    )


class TableSummaryItem(BaseModel):
    """Summary information of an available table in a dataset."""

    table_name: str = Field(..., description="Tên bảng dữ liệu")
    row_count: int = Field(..., description="Số lượng dòng bản ghi")
    primary_key: str | None = Field(None, description="Cột khóa chính")
    available_variants: list[str] = Field(
        default=["clean", "dirty"], description="Các bản dữ liệu có sẵn"
    )
    description: str | None = Field(None, description="Mô tả bảng")


class TableListResponse(BaseModel):
    """List of available tables in a dataset."""

    dataset_id: str = Field(..., description="Mã dataset")
    total_tables: int = Field(..., description="Tổng số bảng")
    tables: list[TableSummaryItem] = Field(..., description="Danh sách các bảng")


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
