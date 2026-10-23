"""Portal schemas for CyberSoft Data Resource Portal v0.1 (Task 22)."""

from typing import Any
from pydantic import BaseModel, Field


class DatasetColumnSchema(BaseModel):
    """Specification of a dataset column for Schema Inspector."""

    name: str = Field(..., description="Tên cột dữ liệu")
    type: str = Field(
        ..., description="Kiểu dữ liệu (string, integer, float, datetime, boolean)"
    )
    nullable: bool = Field(False, description="Cho phép giá trị null hay không")
    description: str = Field(..., description="Mô tả nghiệp vụ sư phạm của cột")
    sample_value: Any = Field(None, description="Giá trị ví dụ mẫu")


class DatasetPortalItem(BaseModel):
    """Dataset item presented in the Resource Portal catalog."""

    id: str = Field(
        ..., description="Mã định danh duy nhất (ví dụ: ds-retail-ecommerce-sales-v1)"
    )
    name: str = Field(..., description="Tên tập dữ liệu")
    domain: str = Field(
        ..., description="Lĩnh vực (Retail, HR, AI/RAG, Telecom, Education)"
    )
    difficulty_level: str = Field(
        ..., description="Cấp độ học viên (beginner, intermediate, advanced)"
    )
    format: str = Field("csv", description="Định dạng tệp (csv, json, parquet)")
    records_count: int = Field(..., description="Tổng số dòng dữ liệu")
    file_size_bytes: int = Field(..., description="Kích thước tệp (bytes)")
    current_version: str = Field("v1.0", description="Phiên bản phát hành")
    tags: list[str] = Field(default_factory=list, description="Từ khóa nhãn dán")
    is_published: bool = Field(
        True, description="Trạng thái xuất bản (True: Sẵn sàng tải; False: Bản nháp)"
    )
    publication_status: str = Field(
        "published", description="published | draft | review"
    )
    license: str = Field(..., description="Giấy phép sử dụng học thuật")
    quality_score: float = Field(..., description="Điểm đánh giá chất lượng (0-100)")
    quality_tier: str = Field(
        "Tier A", description="Phân hạng chất lượng (Tier A, Tier B, Tier C)"
    )
    checksum_sha256: str = Field(..., description="Mã băm toàn vẹn SHA-256")
    average_rating: float = Field(
        5.0, description="Điểm đánh giá hữu ích trung bình (1.0 - 5.0)"
    )
    total_ratings: int = Field(
        0, description="Tổng số lượt đánh giá của giảng viên/học viên"
    )
    description: str = Field(..., description="Mô tả nghiệp vụ và mục đích giảng dạy")
    download_url: str = Field(..., description="Đường dẫn API tải tập dữ liệu")


class DatasetListResponse(BaseModel):
    """Response containing filtered list of datasets and portal facets."""

    items: list[DatasetPortalItem] = Field(
        ..., description="Danh sách datasets thỏa điều kiện lọc"
    )
    total: int = Field(..., description="Tổng số datasets thỏa mãn")
    domains_facet: list[str] = Field(
        default_factory=list, description="Danh mục domain khả dụng"
    )
    levels_facet: list[str] = Field(
        default_factory=list, description="Danh mục level khả dụng"
    )
    licenses_facet: list[str] = Field(
        default_factory=list, description="Danh mục license khả dụng"
    )


class DatasetPreviewResponse(BaseModel):
    """Detailed preview and column schema response for Data Preview Modal."""

    dataset_id: str = Field(..., description="Mã dataset")
    dataset_name: str = Field(..., description="Tên dataset")
    is_published: bool = Field(..., description="Trạng thái xuất bản")
    publication_status: str = Field(
        ..., description="Trạng thái chi tiết (published / draft)"
    )
    license: str = Field(..., description="Giấy phép học thuật")
    quality_score: float = Field(..., description="Điểm chất lượng")
    quality_tier: str = Field(..., description="Hạng chất lượng")
    checksum_sha256: str = Field(..., description="Mã băm SHA-256")
    file_size_bytes: int = Field(..., description="Kích thước tệp")
    columns: list[DatasetColumnSchema] = Field(
        ..., description="Lược đồ cấu trúc các cột"
    )
    sample_rows: list[dict[str, Any]] = Field(
        ..., description="Mẫu bản ghi dữ liệu (10 bản ghi đầu)"
    )
    total_rows_preview: int = Field(
        ..., description="Số dòng hiển thị trong bản xem trước"
    )
    total_dataset_records: int = Field(
        ..., description="Tổng số dòng thực tế trong toàn bộ dataset"
    )
    download_allowed: bool = Field(
        ..., description="True nếu được phép tải (chỉ khi is_published=True)"
    )


class FeedbackCreateRequest(BaseModel):
    """Request payload to submit usefulness feedback (1-5 stars)."""

    rating: int = Field(
        ..., ge=1, le=5, description="Điểm đánh giá độ hữu ích (1 đến 5 sao)"
    )
    reviewer_name: str = Field(
        "Giảng viên CyberSoft",
        min_length=2,
        max_length=100,
        description="Tên người đánh giá",
    )
    role: str = Field(
        "instructor",
        description="Vai trò: instructor | teaching_assistant | student | qa_engineer",
    )
    comment: str = Field(
        ..., min_length=5, max_length=1000, description="Nhận xét độ hữu ích thực tế"
    )
    usefulness_aspects: list[str] = Field(
        default_factory=list, description="Các khía cạnh hài lòng"
    )


class FeedbackItemSchema(BaseModel):
    """Single feedback item stored in portal repository."""

    id: str = Field(..., description="Mã đánh giá duy nhất")
    dataset_id: str = Field(..., description="Mã dataset được đánh giá")
    rating: int = Field(..., ge=1, le=5, description="Điểm số 1-5")
    reviewer_name: str = Field(..., description="Tên người đánh giá")
    role: str = Field(..., description="Vai trò người đánh giá")
    comment: str = Field(..., description="Nội dung nhận xét")
    usefulness_aspects: list[str] = Field(
        default_factory=list, description="Khía cạnh đánh giá"
    )
    created_at: str = Field(..., description="Thời gian gửi phản hồi ISO 8601")


class FeedbackSummaryResponse(BaseModel):
    """Aggregated feedback summary and reviews list for a dataset."""

    dataset_id: str = Field(..., description="Mã dataset")
    average_rating: float = Field(..., description="Điểm đánh giá trung bình")
    total_ratings: int = Field(..., description="Tổng số lượt đánh giá")
    rating_distribution: dict[str, int] = Field(
        ..., description="Phân bổ số sao (5, 4, 3, 2, 1)"
    )
    reviews: list[FeedbackItemSchema] = Field(
        default_factory=list, description="Danh sách các nhận xét gần nhất"
    )


class PortalStatsResponse(BaseModel):
    """Global statistics of CyberSoft Data Resource Portal."""

    total_datasets: int = Field(..., description="Tổng số bộ dữ liệu trên cổng")
    published_datasets: int = Field(
        ..., description="Số bộ dữ liệu đã phát hành chính thức"
    )
    draft_datasets: int = Field(
        ..., description="Số bộ dữ liệu đang trong giai đoạn soạn thảo/nội bộ"
    )
    total_records: int = Field(
        ..., description="Tổng số bản ghi dữ liệu phục vụ đào tạo"
    )
    total_downloads: int = Field(..., description="Tổng lượt tải xuống thành công")
    average_portal_rating: float = Field(
        ..., description="Điểm hữu ích trung bình toàn portal"
    )


class UsabilityScenarioResult(BaseModel):
    """Result of an individual usability test scenario."""

    scenario_id: int = Field(..., description="Số thứ tự kịch bản (1-5)")
    scenario_name: str = Field(..., description="Tên kịch bản kiểm thử độ khả dụng")
    user_goal: str = Field(..., description="Mục tiêu của giảng viên")
    elapsed_seconds: float = Field(
        ..., description="Thời gian hoàn thành thực tế (giây)"
    )
    time_limit_seconds: float = Field(60.0, description="Ngưỡng SLA tối đa (60 giây)")
    status: str = Field("PASS", description="PASS hoặc FAIL")
    steps_executed: list[str] = Field(
        default_factory=list, description="Các bước thao tác đã thực hiện"
    )
    verification_evidence: str = Field(
        ..., description="Bằng chứng nghiệm thu kỹ thuật"
    )
