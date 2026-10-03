"""Endpoints for Data Quality Validation and QA/Eval Metrics."""

from fastapi import APIRouter, Depends, status

from ..auth import require_roles
from ..schemas.common import SuccessEnvelope
from ..schemas.quality import (
    DatasetValidationRequest,
    DatasetValidationResponse,
    QualityMetricsResponse,
)
from ..services.quality_service import QualityService

router = APIRouter(prefix="/quality", tags=["Data Quality & QA Metrics"])


@router.post(
    "/validate-dataset",
    response_model=SuccessEnvelope[DatasetValidationResponse],
    status_code=status.HTTP_200_OK,
    summary="Kiểm định tính toàn vẹn và chất lượng của một dataset",
    description="Thực thi các luật kiểm tra schema, missing values, duplicates và bounds; trả về kết luận PASSED hoặc FAILED cho Cổng chất lượng.",
)
def validate_dataset(
    payload: DatasetValidationRequest,
    current_user: dict = Depends(require_roles(["instructor", "qa_engineer", "admin"])),
) -> SuccessEnvelope[DatasetValidationResponse]:
    data = QualityService.validate_dataset(payload)
    return SuccessEnvelope(data=data)


@router.get(
    "/metrics",
    response_model=SuccessEnvelope[QualityMetricsResponse],
    status_code=status.HTTP_200_OK,
    summary="Truy xuất trọn bộ chỉ số Data Quality và RAG Benchmarks",
    description="Cung cấp số liệu tổng hợp cho Quality Dashboard hợp nhất của TTS 03 (QA) bao gồm Recall@5, MRR, Citation Precision, Groundedness và Latency p95.",
)
def get_quality_metrics(
    current_user: dict = Depends(require_roles(["qa_engineer", "admin", "instructor"])),
) -> SuccessEnvelope[QualityMetricsResponse]:
    data = QualityService.get_metrics_summary()
    return SuccessEnvelope(data=data)
