"""Release Manifest and Changelog schemas."""

from typing import Any, Optional
from pydantic import BaseModel, Field
import datetime
from src.schemas.artifact import ArtifactType, LifecycleState


class ReleaseComponent(BaseModel):
    artifact_id: str
    name: str
    artifact_type: ArtifactType
    version: str
    content_hash: str
    state: LifecycleState
    storage_path: str
    upstream_ids: list[str] = Field(default_factory=list)


class ReleaseManifest(BaseModel):
    release_id: str = Field(..., description="Unique release id, e.g. rel_v1.1.0")
    version: str = Field(..., description="Semantic version of release, e.g. v1.1.0")
    release_name: str
    release_date: str = Field(
        default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat()
    )
    author: str = "Đào Trung Kiên - Data & AI Resource Engineer"
    description: str
    holistic_checksum: str = Field(
        ..., description="SHA-256 of sorted component content hashes"
    )
    components: dict[str, ReleaseComponent] = Field(
        ..., description="Map of artifact_id to ReleaseComponent"
    )
    component_counts: dict[str, int] = Field(default_factory=dict)
    git_branch: str = "feature/data-ai-day24"
    git_tag: str
    release_notes: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ComponentDiffItem(BaseModel):
    artifact_id: str
    name: str
    artifact_type: ArtifactType
    old_version: Optional[str] = None
    new_version: Optional[str] = None
    change_type: str = Field(
        ..., description="added, updated, deprecated, retired, removed"
    )
    summary: str


class ReleaseDiff(BaseModel):
    base_release_id: str
    target_release_id: str
    base_version: str
    target_version: str
    total_changes: int
    added: list[ComponentDiffItem] = Field(default_factory=list)
    updated: list[ComponentDiffItem] = Field(default_factory=list)
    deprecated: list[ComponentDiffItem] = Field(default_factory=list)
    retired: list[ComponentDiffItem] = Field(default_factory=list)
    unchanged_count: int = 0


class ChangelogItem(BaseModel):
    category: str = Field(
        ..., description="Added, Changed, Deprecated, Removed, Fixed, Security"
    )
    description: str
    artifact_ids: list[str] = Field(default_factory=list)


class ChangelogReleaseEntry(BaseModel):
    version: str
    release_date: str
    release_name: str
    items: list[ChangelogItem] = Field(default_factory=list)
    breaking_changes: list[str] = Field(default_factory=list)
