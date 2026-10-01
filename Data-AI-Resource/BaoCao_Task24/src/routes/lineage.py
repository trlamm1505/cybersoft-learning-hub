"""Lineage DAG and Provenance Backtrace endpoints."""

from typing import Optional
from fastapi import APIRouter, HTTPException
from src.schemas.artifact import (
    ArtifactMetadata,
    ArtifactRegistrationRequest,
    ArtifactType,
    LifecycleState,
)
from src.schemas.common import SuccessEnvelope
from src.schemas.lineage import BacktraceResult, LineageDAG
from src.services.immutable_store import ArtifactNotFoundError, immutable_store
from src.services.lineage_engine import lineage_engine

router = APIRouter(prefix="/lineage", tags=["Lineage & Provenance"])


@router.get("/dag", response_model=SuccessEnvelope[LineageDAG])
def get_lineage_dag():
    """Returns the complete Directed Acyclic Graph (DAG) across all registered resources."""
    dag = lineage_engine.build_dag()
    return SuccessEnvelope(
        data=dag, meta={"total_nodes": dag.total_nodes, "total_edges": dag.total_edges}
    )


@router.get("/trace/{artifact_id}", response_model=SuccessEnvelope[BacktraceResult])
def trace_artifact_lineage(artifact_id: str):
    """Backtraces an artifact to its root datasets, prompts, models, and indices."""
    try:
        result = lineage_engine.trace_to_source(artifact_id)
        return SuccessEnvelope(data=result)
    except ArtifactNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Không tìm thấy tài nguyên '{artifact_id}'."
        )


@router.get("/artifacts", response_model=SuccessEnvelope[list[ArtifactMetadata]])
def list_artifacts(
    artifact_type: Optional[ArtifactType] = None,
    state: Optional[LifecycleState] = None,
):
    """Lists all artifacts in the immutable WORM storage."""
    artifacts = immutable_store.list_artifacts(artifact_type=artifact_type, state=state)
    return SuccessEnvelope(data=artifacts, meta={"count": len(artifacts)})


@router.get(
    "/artifacts/{artifact_id}", response_model=SuccessEnvelope[ArtifactMetadata]
)
def get_artifact(artifact_id: str):
    """Retrieves metadata of a specific artifact."""
    try:
        meta = immutable_store.get_artifact_metadata(artifact_id)
        return SuccessEnvelope(data=meta)
    except ArtifactNotFoundError:
        raise HTTPException(
            status_code=404, detail=f"Không tìm thấy tài nguyên '{artifact_id}'."
        )


@router.post(
    "/artifacts", response_model=SuccessEnvelope[ArtifactMetadata], status_code=201
)
def register_artifact(req: ArtifactRegistrationRequest):
    """Registers a new artifact under immutable WORM storage rules."""
    meta = immutable_store.register_artifact(
        name=req.name,
        artifact_type=req.artifact_type,
        version=req.version,
        description=req.description,
        content=req.content,
        filename=req.filename,
        upstream_ids=req.upstream_ids,
        tags=req.tags,
        extra_metadata=req.extra_metadata,
    )
    return SuccessEnvelope(data=meta)
