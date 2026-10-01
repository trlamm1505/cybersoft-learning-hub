"""Health and system info routes (Task 23)."""

from fastapi import APIRouter
from src.schemas.common import HealthResponse, SuccessEnvelope

router = APIRouter(tags=["Health & System"])


@router.get("/health", response_model=SuccessEnvelope[HealthResponse])
def get_health():
    """System health check endpoint."""
    return SuccessEnvelope(
        success=True,
        data=HealthResponse(
            service="CyberSoft AI Exercise Generator v0.1",
            version="0.1.0",
            status="healthy",
            metrics={"engine": "ready", "gatekeeper": "active"},
        ),
    )
