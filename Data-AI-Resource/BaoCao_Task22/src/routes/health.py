"""Health and diagnostic routes."""

from fastapi import APIRouter
from ..config import ENVIRONMENT, SERVICE_NAME, SERVICE_VERSION
from ..schemas.common import HealthResponse, SuccessEnvelope

router = APIRouter(tags=["Health & System Diagnostics"])


@router.get("/health", response_model=SuccessEnvelope[HealthResponse])
async def health_check():
    """Service health and uptime status."""
    return SuccessEnvelope(
        success=True,
        data=HealthResponse(
            status="healthy",
            service=SERVICE_NAME,
            version=SERVICE_VERSION,
            environment=ENVIRONMENT,
        ),
    )


@router.get("/info", response_model=SuccessEnvelope[dict])
async def system_info():
    """System information and environment specs."""
    return SuccessEnvelope(
        success=True,
        data={
            "service": SERVICE_NAME,
            "version": SERVICE_VERSION,
            "stage": "Tuần 5 - Sản phẩm hóa (Mốc Ngày 22)",
            "owner": "Đào Trung Kiên (Data & AI Resource Engineer)",
            "institution": "CyberSoft Academy",
            "features": [
                "Instant Keyword Search (< 60s Discovery)",
                "Multi-faceted Filtering (Domain, Level, License, Status)",
                "Interactive Tabular Data Preview",
                "Schema & Column Inspector (3NF)",
                "Strict Access Rules (Block Unpublished Downloads - 403 Forbidden)",
                "Usefulness Feedback Engine (1-5 Stars)",
                "5 Usability Automated Benchmark Scenarios",
            ],
        },
    )
