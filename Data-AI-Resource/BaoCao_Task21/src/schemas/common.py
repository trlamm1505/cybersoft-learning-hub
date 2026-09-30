"""Common schemas and uniform envelope structures for CyberSoft API v1."""

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
        description="Mã lỗi chuẩn hóa (ví dụ: AUTH_REQUIRED, FORBIDDEN, ENTITY_NOT_FOUND)",
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
    """Pagination metadata for list endpoints."""

    total: int = Field(..., description="Tổng số bản ghi thỏa điều kiện")
    limit: int = Field(..., description="Số bản ghi tối đa trên một trang")
    offset: int = Field(..., description="Vị trí bắt đầu của danh sách kết quả")
    has_next: bool = Field(..., description="Có trang tiếp theo hay không")


class HealthServiceStatus(BaseModel):
    """Health status of an internal subsystem."""

    status: str = Field("healthy", description="healthy | degraded | down")
    message: str = Field("Sẵn sàng phục vụ", description="Thông điệp trạng thái")
    latency_ms: float = Field(
        0.0, description="Độ trễ phản hồi của phân hệ tính bằng milliseconds"
    )


class HealthResponse(BaseModel):
    """System health check payload."""

    status: str = Field(
        "healthy", description="Trạng thái sức khỏe tổng thể: healthy | degraded"
    )
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    uptime_seconds: float = Field(
        ..., description="Thời gian hoạt động liên tục của dịch vụ"
    )
    version: str = Field(..., description="Phiên bản API hiện tại")
    services: dict[str, HealthServiceStatus] = Field(
        ..., description="Chi tiết trạng thái từng phân hệ"
    )


class APIInfoResponse(BaseModel):
    """API metadata, contract specification and SLA commitments."""

    name: str = Field(..., description="Tên dịch vụ tích hợp")
    version: str = Field(..., description="Phiên bản hiện tại")
    description: str = Field(..., description="Mô tả chức năng hệ thống")
    openapi_spec_url: str = Field(
        "/api/v1/openapi.json", description="Đường dẫn tải hợp đồng OpenAPI JSON"
    )
    swagger_docs_url: str = Field("/docs", description="Giao diện tra cứu Swagger UI")
    redoc_url: str = Field("/redoc", description="Giao diện tra cứu ReDoc")
    sla_target: dict[str, str] = Field(
        ..., description="Cam kết chất lượng dịch vụ SLA (Độ trễ p95, Uptime)"
    )
    maintainer: dict[str, str] = Field(
        ..., description="Thông tin đội ngũ kỹ sư phụ trách"
    )
