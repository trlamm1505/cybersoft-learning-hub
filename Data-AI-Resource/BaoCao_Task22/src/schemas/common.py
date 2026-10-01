"""Common schemas and uniform envelope structures for CyberSoft API v1 (Task 22)."""

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorDetail(BaseModel):
    """Detailed validation or processing error item."""

    field: str | None = Field(None, description="Tên trường phát sinh lỗi nếu có")
    issue: str = Field(..., description="Mô tả cụ thể của lỗi phát sinh")


class ErrorPayload(BaseModel):
    """Inner error payload containing standardized code, message, and metadata."""

    code: str = Field(
        ...,
        description="Mã lỗi chuẩn hóa (ví dụ: AUTH_REQUIRED, FORBIDDEN, DATASET_UNPUBLISHED_RESTRICTED)",
    )
    message: str = Field(
        ...,
        description="Thông điệp thông báo thân thiện bằng tiếng Việt hoặc tiếng Anh",
    )
    details: list[ErrorDetail] = Field(
        default_factory=list, description="Danh sách chi tiết các lỗi"
    )
    request_id: str = Field(
        ..., description="Mã định danh duy nhất của request để phục vụ truy vết log"
    )
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="Thời điểm phát sinh lỗi ISO 8601",
    )


class ErrorEnvelope(BaseModel):
    """Standardized top-level Error Envelope adhering to CyberSoft Contract."""

    success: bool = Field(
        False, description="Trạng thái thực thi luôn là false khi có lỗi"
    )
    error: ErrorPayload = Field(..., description="Chi tiết lỗi chuẩn hóa")


class SuccessEnvelope(BaseModel, Generic[T]):
    """Standardized top-level Success Envelope wrapping data payload."""

    success: bool = Field(
        True, description="Trạng thái thực thi thành công luôn là true"
    )
    data: T = Field(..., description="Payload kết quả trả về của API")
    meta: dict[str, Any] | None = Field(
        default=None, description="Metadata bổ sung (thời gian thực thi, requestId...)"
    )


class PaginationMeta(BaseModel):
    """Pagination metadata conforming to standardized REST collection responses."""

    total_records: int = Field(..., ge=0, description="Tổng số bản ghi khả dụng")
    page: int = Field(..., ge=1, description="Trang hiện tại (bắt đầu từ 1)")
    page_size: int = Field(..., ge=1, le=100, description="Số lượng bản ghi mỗi trang")
    total_pages: int = Field(..., ge=0, description="Tổng số trang khả dụng")
    has_next: bool = Field(..., description="True nếu còn trang tiếp theo")
    has_prev: bool = Field(..., description="True nếu có trang trước")


class HealthResponse(BaseModel):
    """Service health and uptime diagnostic response."""

    status: str = Field("healthy", description="Trạng thái dịch vụ")
    service: str = Field("cybersoft-resource-portal", description="Tên dịch vụ")
    version: str = Field("v1.0.0", description="Phiên bản API")
    environment: str = Field("production", description="Môi trường chạy")
    timestamp: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z",
        description="Thời gian kiểm tra sức khỏe",
    )
