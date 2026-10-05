"""Artifact metadata and versioning schemas."""

from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field
import datetime


class ArtifactType(str, Enum):
    DATASET = "dataset"
    PROMPT = "prompt"
    MODEL = "model"
    INDEX = "index"
    EVALUATION = "evaluation"
    EXERCISE = "exercise"


class LifecycleState(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    RETIRED = "retired"


class VersionInfo(BaseModel):
    version: str = Field(..., description="Semantic version string, e.g. v1.0.0")
    content_hash: str = Field(..., description="SHA-256 digest of artifact payload")
    created_at: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    git_branch: str = "feature/data-ai-day24"
    git_commit: Optional[str] = None
    changelog_entry: Optional[str] = None


class ArtifactMetadata(BaseModel):
    id: str = Field(
        ..., description="Unique artifact identifier, e.g. ds_retail_sales_v1.0.0"
    )
    name: str = Field(..., description="Human-readable resource name")
    artifact_type: ArtifactType = Field(..., description="Resource category")
    version: str = Field(..., description="Semantic version, e.g. v1.0.0")
    state: LifecycleState = Field(
        default=LifecycleState.ACTIVE, description="Lifecycle status"
    )
    description: str = Field(..., description="Detailed description")
    author: str = Field(default="Đào Trung Kiên - Data & AI Resource Engineer")
    created_at: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    file_path: str = Field(
        ..., description="Relative storage path under data/artifacts/"
    )
    file_size_bytes: int = Field(default=0)
    content_hash: str = Field(..., description="SHA-256 content checksum")
    upstream_ids: list[str] = Field(
        default_factory=list, description="Immediate causal parent artifact IDs"
    )
    tags: list[str] = Field(default_factory=list)
    deprecation_reason: Optional[str] = None
    superseded_by: Optional[str] = None
    sunset_date: Optional[str] = None
    extra_metadata: dict[str, Any] = Field(default_factory=dict)


class ArtifactRegistrationRequest(BaseModel):
    name: str
    artifact_type: ArtifactType
    version: str
    description: str
    content: str
    filename: str
    upstream_ids: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    extra_metadata: dict[str, Any] = Field(default_factory=dict)
