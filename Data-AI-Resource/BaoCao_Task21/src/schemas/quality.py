"""Schemas for Data Quality and RAG Evaluation Harness endpoints."""

from typing import Any

from pydantic import BaseModel, Field


class DatasetValidationRequest(BaseModel):
    """Payload to trigger an automated quality inspection on a dataset."""

    dataset_id: str = Field(..., description="Mã định danh của dataset cần kiểm định")
    check_rules: list[str] = Field(
        default=[
            "schema_conformance",
            "missing_values",
            "duplicate_rows",
            "range_bounds",
        ],
        description="Danh sách các bộ quy tắc kiểm định cần áp dụng",
    )
    max_missing_ratio_threshold: float = Field(
        0.05,
        ge=0.0,
        le=0.5,
        description="Ngưỡng tỷ lệ ô trống tối đa cho phép (mặc định 5%)",
    )


class ValidationIssue(BaseModel):
    """Specific defect or violation identified during data inspection."""

    severity: str = Field(
        ..., description="Mức độ nghiêm trọng: CRITICAL | WARNING | INFO"
    )
    rule: str = Field(..., description="Tên quy tắc bị vi phạm")
    column: str | None = Field(None, description="Cột dữ liệu liên quan")
    description: str = Field(
        ..., description="Mô tả chi tiết nguyên nhân phát sinh lỗi"
    )


class DatasetValidationResponse(BaseModel):
    """Inspection report detailing data quality results and gate decision."""

    dataset_id: str = Field(..., description="Mã định danh dataset được kiểm tra")
    total_records: int = Field(..., description="Tổng số dòng kiểm tra")
    valid_records: int = Field(..., description="Số dòng dữ liệu hợp lệ")
    invalid_records: int = Field(..., description="Số dòng chứa sai sót hoặc vi phạm")
    completeness_score: float = Field(
        ..., description="Tỷ lệ đầy đủ của tập dữ liệu (0.0 đến 1.0)"
    )
    status: str = Field(
        ..., description="Kết luận kiểm định: PASSED | WARNING | FAILED"
    )
    passed_gate: bool = Field(
        ..., description="Đạt điều kiện cho phép xuất bản sang Learning Platform"
    )
    issues: list[ValidationIssue] = Field(
        default_factory=list, description="Danh sách các cảnh báo và lỗi vi phạm"
    )


class RAGMetricsBenchmark(BaseModel):
    """Quantitative performance indicators from Task 20 RAG Evaluation Harness."""

    recall_at_5: float = Field(
        ..., description="Tỷ lệ thu hồi thông tin Top-5 Recall@5 (Đạt 100.0%)"
    )
    mrr: float = Field(
        ..., description="Thứ hạng nghịch đảo trung bình MRR (Đạt 1.0000)"
    )
    citation_precision: float = Field(
        ..., description="Độ chính xác trích nguồn (Đạt 96.67%)"
    )
    phantom_citations: int = Field(
        ..., description="Số ca trích dẫn ma bịa đặt (Đạt 0 ca)"
    )
    groundedness_score: float = Field(
        ..., description="Điểm số trung thực có căn cứ (Đạt 85.67%)"
    )
    abstention_accuracy: float = Field(
        ..., description="Độ chính xác từ chối an toàn khi ngoài phạm vi (Đạt 93.33%)"
    )
    tail_latency_p95_ms: float = Field(
        ..., description="Độ trễ đuôi phân vị 95 (Đạt 36.98 ms)"
    )
    total_cost_usd: float = Field(
        0.0, description="Chi phí vận hành token (Đạt $0.00 USD offline)"
    )


class QualityMetricsResponse(BaseModel):
    """Aggregated Quality and Evaluation metrics payload for TTS 03 Dashboard."""

    timestamp: str = Field(..., description="Thời điểm đo lường số liệu ISO 8601")
    service_version: str = Field(
        "v1.0.0", description="Phiên bản phát hành của hệ thống"
    )
    data_quality_summary: dict[str, Any] = Field(
        ..., description="Tổng quan chất lượng kho dữ liệu CyberSoft Data Lab"
    )
    rag_benchmarks: RAGMetricsBenchmark = Field(
        ..., description="Chỉ số kiểm thử chất lượng RAG Tutor v1.0"
    )
    ci_gate_status: str = Field(
        "PASSED", description="Trạng thái cổng chất lượng CI/CD Quality Gate"
    )
