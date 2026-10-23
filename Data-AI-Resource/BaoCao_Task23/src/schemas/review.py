"""Schemas for Human Review Gatekeeper, Calibration, and DoD Tracking (Task 23)."""

from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field


class ReviewSubmissionRequest(BaseModel):
    """Payload sent by human instructor to review an exercise draft."""

    action: Literal["approve", "request_revision", "reject", "publish", "update"] = (
        Field(..., description="Quyết định của Giảng viên")
    )
    reviewer_id: str = Field(
        ..., description="Mã định danh Giảng viên / Reviewer (vd: teacher_kien)"
    )
    notes: str = Field(..., min_length=3, description="Nhận xét phản hồi sư phạm")
    calibrated_bloom: str | None = Field(
        None, description="Cấp độ Bloom sau khi Giảng viên điều chỉnh nếu cần"
    )
    calibrated_difficulty: str | None = Field(
        None, description="Độ khó sau khi Giảng viên điều chỉnh nếu cần"
    )
    title: str | None = Field(None, description="Tiêu đề sau khi Giảng viên hiệu chỉnh")
    description: str | None = Field(
        None, description="Mô tả sau khi Giảng viên hiệu chỉnh"
    )
    solution_code: str | None = Field(
        None, description="Mã giải sau khi Giảng viên hiệu chỉnh"
    )


class FeasibilityTestResult(BaseModel):
    """Result of running solution code and test cases against actual dataset."""

    exercise_id: str
    is_feasible: bool
    total_tests: int
    passed_tests: int
    failed_tests: int
    execution_time_ms: float
    output_preview: Any = None
    error_message: str | None = None


class RoundMetrics(BaseModel):
    """Review pass rate tracking to verify DoD: >= 80% pass rate in max 2 rounds."""

    total_drafts_generated: int = Field(0)
    round_1_reviewed: int = Field(0)
    round_1_passed: int = Field(0)
    round_1_pass_rate: float = Field(
        0.0, description="Tỷ lệ đạt vòng 1 (DoD yêu cầu >= 80%)"
    )
    round_2_reviewed: int = Field(0)
    round_2_passed: int = Field(0)
    round_2_pass_rate: float = Field(0.0, description="Tỷ lệ đạt vòng 2 sau hiệu chỉnh")
    final_approved_count: int = Field(
        0, description="Tổng số bài được phê duyệt chính thức (Mục tiêu: 20 bài)"
    )
    auto_publish_prevented_count: int = Field(
        0, description="Số lần chặn tự động publish thành công (DoD)"
    )


class PromptEvalLogEntry(BaseModel):
    """Comprehensive log entry capturing AI prompt, response, validation, and review."""

    log_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    dataset_id: str
    bloom_level_requested: str
    difficulty_requested: str
    prompt_template_name: str
    raw_prompt_text: str
    model_name: str = "gemini-3.8-flash"
    generation_time_ms: float
    schema_adherence_valid: bool
    deduplication_score: float
    feasibility_status: bool
    review_status: str
    review_round: int
    reviewer_feedback: str | None = None
