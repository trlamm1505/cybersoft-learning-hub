"""Health check router."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str


@router.get("/health", response_model=HealthResponse)
def get_health():
    """Returns service health status."""
    return HealthResponse(
        status="healthy",
        service="cybersoft-security-privacy-guard",
        version="v1.0.0",
        environment="production",
    )
