"""Lifecycle state transitions, deprecation, and rollback schemas."""

from typing import Optional
from pydantic import BaseModel, Field
import datetime
from src.schemas.artifact import LifecycleState


class DeprecateRequest(BaseModel):
    artifact_id: str
    reason: str = Field(..., description="Business or technical reason for deprecation")
    superseded_by: Optional[str] = Field(
        default=None, description="Recommended newer artifact ID"
    )
    sunset_date: Optional[str] = Field(
        default=None, description="ISO date when resource will be retired"
    )


class DeprecateResponse(BaseModel):
    artifact_id: str
    previous_state: LifecycleState
    new_state: LifecycleState
    deprecated_at: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    reason: str
    superseded_by: Optional[str] = None
    sunset_date: Optional[str] = None
    affected_downstream_ids: list[str] = Field(default_factory=list)
    warning_message: str


class RollbackRequest(BaseModel):
    current_release_id: str
    target_release_id: str
    operator: str = "Đào Trung Kiên"
    reason: str


class RollbackStep(BaseModel):
    step_number: int
    component: str
    action: str
    detail: str
    target_version: str
    verification_command: str


class RollbackPlan(BaseModel):
    plan_id: str
    from_release_id: str
    to_release_id: str
    created_at: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    risk_level: str = Field(default="LOW", description="LOW, MEDIUM, HIGH")
    preflight_checks: list[str] = Field(default_factory=list)
    affected_components_count: int
    steps: list[RollbackStep] = Field(default_factory=list)
    post_rollback_tests: list[str] = Field(default_factory=list)
    markdown_note: str
