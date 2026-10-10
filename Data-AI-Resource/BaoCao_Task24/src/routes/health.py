"""Health check endpoint."""

from fastapi import APIRouter
from src.schemas.common import HealthResponse
from src.services.immutable_store import immutable_store
from src.services.manifest_builder import manifest_builder

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health():
    total_artifacts = len(immutable_store.list_artifacts())
    total_releases = len(manifest_builder.list_manifests())
    return HealthResponse(
        status="healthy",
        service="cybersoft-lineage-tracker",
        version="0.1.0",
        worm_storage_status="active",
        total_artifacts=total_artifacts,
        total_releases=total_releases,
    )
