"""Lifecycle transitions, deprecation and rollback endpoints."""

from fastapi import APIRouter, HTTPException
from src.schemas.common import SuccessEnvelope
from src.schemas.lifecycle import (
    DeprecateRequest,
    DeprecateResponse,
    RollbackPlan,
    RollbackRequest,
)
from src.services.deprecation_manager import (
    InvalidStateTransitionError,
    deprecation_manager,
)
from src.services.immutable_store import ArtifactNotFoundError
from src.services.rollback_planner import rollback_planner

router = APIRouter(tags=["Lifecycle & Deprecation"])


@router.post(
    "/artifacts/{artifact_id}/deprecate",
    response_model=SuccessEnvelope[DeprecateResponse],
)
def deprecate_artifact(artifact_id: str, req: DeprecateRequest):
    """Deprecates an active artifact and emits lineage impact warnings."""
    if req.artifact_id != artifact_id:
        req.artifact_id = artifact_id
    try:
        res = deprecation_manager.deprecate_artifact(req)
        return SuccessEnvelope(data=res)
    except ArtifactNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Không tìm thấy tài nguyên '{artifact_id}'."
        )
    except InvalidStateTransitionError as e:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_LIFECYCLE_TRANSITION",
                "message": str(e),
            },
        )


@router.post("/releases/rollback-plan", response_model=SuccessEnvelope[RollbackPlan])
def create_rollback_plan(req: RollbackRequest):
    """Generates an actionable rollback plan and formal Rollback Note."""
    try:
        plan = rollback_planner.generate_plan(req)
        return SuccessEnvelope(data=plan)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
