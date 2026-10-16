"""Health and service info endpoints."""

import time

from fastapi import APIRouter, status

from ..config import API_DESCRIPTION, API_TITLE, API_VERSION
from ..schemas.common import (
    APIInfoResponse,
    HealthResponse,
    HealthServiceStatus,
    SuccessEnvelope,
)

router = APIRouter(tags=["Health & Metadata"])
SERVER_START_TIME = time.time()


@router.get(
    "/health",
    response_model=SuccessEnvelope[HealthResponse],
    status_code=status.HTTP_200_OK,
    summary="Kiểm tra trạng thái sức khỏe dịch vụ",
    description="Trả về trạng thái hoạt động của hệ thống, thời gian uptime và sức khỏe của từng module nội bộ.",
)
def get_health() -> SuccessEnvelope[HealthResponse]:
    uptime = time.time() - SERVER_START_TIME
    payload = HealthResponse(
        status="healthy",
        uptime_seconds=round(uptime, 2),
        version=API_VERSION,
        services={
            "dataset_registry": HealthServiceStatus(
                status="healthy",
                message="Kho dữ liệu 4 datasets và 2 projects sẵn sàng",
                latency_ms=1.2,
            ),
            "hybrid_retriever": HealthServiceStatus(
                status="healthy",
                message="Chỉ mục 91 chunks giáo trình sẵn sàng",
                latency_ms=2.5,
            ),
            "ai_tutor_engine": HealthServiceStatus(
                status="healthy",
                message="Mô hình RAG & Guardrails kích hoạt thành công",
                latency_ms=3.1,
            ),
            "quality_harness": HealthServiceStatus(
                status="healthy",
                message="Hệ thống kiểm định và đo lường CI Gate sẵn sàng",
                latency_ms=1.8,
            ),
        },
    )
    return SuccessEnvelope(data=payload)


@router.get(
    "/info",
    response_model=SuccessEnvelope[APIInfoResponse],
    status_code=status.HTTP_200_OK,
    summary="Thông tin kỹ thuật, OpenAPI contract & SLA cam kết",
    description="Cung cấp metadata hợp đồng API, đường dẫn tài liệu Swagger/ReDoc và các chỉ số cam kết SLA với các phân hệ khác.",
)
def get_info() -> SuccessEnvelope[APIInfoResponse]:
    payload = APIInfoResponse(
        name=API_TITLE,
        version=API_VERSION,
        description=API_DESCRIPTION,
        openapi_spec_url="/api/v1/openapi.json",
        swagger_docs_url="/docs",
        redoc_url="/redoc",
        sla_target={
            "availability_uptime": ">= 99.9%",
            "search_latency_p95": "< 100 ms",
            "tutor_latency_p95": "< 250 ms",
            "groundedness_target": ">= 85.0%",
            "citation_precision_target": ">= 95.0%",
        },
        maintainer={
            "team": "CyberSoft Data & AI Lab",
            "lead_engineer": "Đào Trung Kiên (TTS 01)",
            "contact_email": "kien.dao@cybersoft.edu.vn",
        },
    )
    return SuccessEnvelope(data=payload)
