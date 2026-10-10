"""Lineage Directed Acyclic Graph (DAG) schemas."""

from typing import Any
from pydantic import BaseModel, Field
from src.schemas.artifact import ArtifactType, LifecycleState


class LineageNode(BaseModel):
    id: str
    name: str
    artifact_type: ArtifactType
    version: str
    state: LifecycleState
    content_hash: str
    upstream_ids: list[str] = Field(default_factory=list)
    downstream_ids: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class LineageEdge(BaseModel):
    source: str = Field(..., description="Upstream artifact ID (source of causality)")
    target: str = Field(..., description="Downstream artifact ID (derived artifact)")
    relationship: str = Field(
        ...,
        description="Causal relation: e.g. trained_on, generated_with, evaluated_by, derived_from",
    )


class LineageDAG(BaseModel):
    nodes: dict[str, LineageNode]
    edges: list[LineageEdge]
    root_node_ids: list[str] = Field(
        default_factory=list, description="Source nodes with no upstreams"
    )
    leaf_node_ids: list[str] = Field(
        default_factory=list, description="Terminal nodes with no downstreams"
    )
    total_nodes: int = 0
    total_edges: int = 0


class BacktraceSourceGroup(BaseModel):
    datasets: list[str] = Field(default_factory=list)
    prompts: list[str] = Field(default_factory=list)
    models: list[str] = Field(default_factory=list)
    indices: list[str] = Field(default_factory=list)
    evaluations: list[str] = Field(default_factory=list)


class BacktraceResult(BaseModel):
    target_id: str
    target_name: str
    target_type: ArtifactType
    target_version: str
    direct_parents: list[str]
    root_sources: list[str]
    ancestors_by_type: BacktraceSourceGroup
    all_ancestor_ids: list[str]
    max_lineage_depth: int
    paths_to_roots: list[list[str]]
