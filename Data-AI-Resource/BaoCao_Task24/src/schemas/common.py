"""Common API envelope schemas adhering to CyberSoft Gold Standard."""

from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field
import datetime

T = TypeVar("T")


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Unique machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    details: Optional[dict[str, Any]] = Field(
        default=None, description="Detailed diagnostic context"
    )


class ErrorEnvelope(BaseModel):
    success: bool = Field(default=False)
    error: ErrorDetail
    timestamp: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )


class SuccessEnvelope(BaseModel, Generic[T]):
    success: bool = Field(default=True)
    data: T
    meta: Optional[dict[str, Any]] = Field(default=None)
    timestamp: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )


class HealthResponse(BaseModel):
    status: str = "healthy"
    service: str = "cybersoft-lineage-tracker"
    version: str = "0.1.0"
    worm_storage_status: str = "active"
    total_artifacts: int = 0
    total_releases: int = 0
    timestamp: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
