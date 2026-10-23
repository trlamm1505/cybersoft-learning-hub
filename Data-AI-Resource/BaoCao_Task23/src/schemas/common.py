"""Common schemas and uniform envelope structures for CyberSoft API v1 (Task 23)."""

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
        description="Mã lỗi chuẩn hóa (ví dụ: EXERCISE_VALIDATION_ERROR, ACCESS_FORBIDDEN, AUTO_PUBLISH_BLOCKED)",
    )
    message: str = Field(
        ...,
        description="Thông điệp thông báo thân thiện bằng tiếng Việt",
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


class HealthResponse(BaseModel):
    """Health check response schema."""

    service: str = Field("CyberSoft AI Exercise Generator v0.1")
    version: str = Field("0.1.0")
    status: str = Field("healthy")
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    metrics: dict[str, Any] = Field(default_factory=dict)
