"""Immutable Write-Once-Read-Many (WORM) Artifact Storage Service.

Enforces:
1. Strict content addressing and SHA-256 integrity hashing.
2. Zero overwrite tolerance: Attempting to rewrite an existing artifact raises
   ImmutableArtifactError (HTTP 409 Conflict).
3. Version-partitioned directory layout: data/artifacts/{type}/{name}/{version}/
"""

import hashlib
import json
from pathlib import Path
from typing import Optional, Union

from src.config import config
from src.schemas.artifact import (
    ArtifactMetadata,
    ArtifactType,
    LifecycleState,
)


class ImmutableArtifactError(Exception):
    """Raised when an attempt is made to overwrite an existing immutable artifact."""

    def __init__(self, artifact_id: str, path: str):
        super().__init__(
            f"Artifact '{artifact_id}' already exists at '{path}' and cannot be overwritten (WORM policy enforced)."
        )
        self.artifact_id = artifact_id
        self.path = path


class ArtifactNotFoundError(Exception):
    """Raised when an artifact cannot be located."""

    def __init__(self, artifact_id: str):
        super().__init__(f"Artifact '{artifact_id}' was not found in storage.")
        self.artifact_id = artifact_id


class ImmutableStore:
    def __init__(self, base_artifacts_dir: Optional[Path] = None):
        self.artifacts_dir = base_artifacts_dir or config.artifacts_dir
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def compute_sha256(content: Union[str, bytes]) -> str:
        """Calculates deterministic SHA-256 digest with canonical newlines."""
        if isinstance(content, str):
            content_bytes = content.replace("\r\n", "\n").encode("utf-8")
        else:
            content_bytes = content
        return hashlib.sha256(content_bytes).hexdigest()

    def _get_target_dir(
        self, artifact_type: ArtifactType, name: str, version: str
    ) -> Path:
        clean_name = name.strip().lower().replace(" ", "_").replace("-", "_")
        clean_version = version.strip()
        type_dir = self.artifacts_dir / f"{artifact_type.value}s"
        return type_dir / clean_name / clean_version

    def register_artifact(
        self,
        name: str,
        artifact_type: ArtifactType,
        version: str,
        description: str,
        content: Union[str, bytes],
        filename: str,
        upstream_ids: Optional[list[str]] = None,
        tags: Optional[list[str]] = None,
        extra_metadata: Optional[dict] = None,
        state: LifecycleState = LifecycleState.ACTIVE,
    ) -> ArtifactMetadata:
        """Registers a new artifact with WORM guarantee."""
        clean_name = name.strip().lower().replace(" ", "_").replace("-", "_")
        clean_version = version.strip()
        artifact_id = f"{artifact_type.value}_{clean_name}_{clean_version}"
        target_dir = self._get_target_dir(artifact_type, clean_name, clean_version)
        metadata_file = target_dir / "metadata.json"

        # WORM Enforcement: Check if artifact version already exists
        if metadata_file.exists():
            raise ImmutableArtifactError(artifact_id, str(target_dir))

        target_dir.mkdir(parents=True, exist_ok=True)
        payload_file = target_dir / filename

        # Compute payload hash and write bytes directly to prevent OS newline mutation
        if isinstance(content, str):
            payload_bytes = content.replace("\r\n", "\n").encode("utf-8")
        else:
            payload_bytes = content

        content_hash = hashlib.sha256(payload_bytes).hexdigest()
        payload_file.write_bytes(payload_bytes)
        file_size = len(payload_bytes)

        # Cross-drive safe relative path
        try:
            rel_path = str(payload_file.relative_to(config.base_dir)).replace("\\", "/")
        except ValueError:
            rel_path = str(payload_file).replace("\\", "/")

        meta = ArtifactMetadata(
            id=artifact_id,
            name=name,
            artifact_type=artifact_type,
            version=clean_version,
            state=state,
            description=description,
            file_path=rel_path,
            file_size_bytes=file_size,
            content_hash=content_hash,
            upstream_ids=upstream_ids or [],
            tags=tags or [],
            extra_metadata=extra_metadata or {},
        )

        metadata_file.write_text(
            meta.model_dump_json(indent=2),
            encoding="utf-8",
        )
        return meta

    def get_artifact_metadata(self, artifact_id: str) -> ArtifactMetadata:
        """Finds and reads metadata by artifact ID."""
        for meta_file in self.artifacts_dir.glob("*/*/*/metadata.json"):
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                if data.get("id") == artifact_id:
                    return ArtifactMetadata.model_validate(data)
            except Exception:
                continue
        raise ArtifactNotFoundError(artifact_id)

    def get_artifact_content(self, artifact_id: str) -> tuple[ArtifactMetadata, bytes]:
        """Returns metadata and raw byte content for an artifact."""
        meta = self.get_artifact_metadata(artifact_id)
        p = Path(meta.file_path)
        if p.is_absolute():
            file_path = p
        else:
            file_path = config.base_dir / p

        if not file_path.exists():
            raise FileNotFoundError(
                f"Payload file '{file_path}' missing for artifact '{artifact_id}'."
            )
        return meta, file_path.read_bytes()

    def list_artifacts(
        self,
        artifact_type: Optional[ArtifactType] = None,
        state: Optional[LifecycleState] = None,
    ) -> list[ArtifactMetadata]:
        """Lists all registered artifacts, optionally filtered by type or lifecycle state."""
        artifacts: list[ArtifactMetadata] = []
        for meta_file in self.artifacts_dir.glob("*/*/*/metadata.json"):
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                item = ArtifactMetadata.model_validate(data)
                if artifact_type and item.artifact_type != artifact_type:
                    continue
                if state and item.state != state:
                    continue
                artifacts.append(item)
            except Exception:
                continue
        # Deterministic sort by id
        return sorted(artifacts, key=lambda a: a.id)

    def update_lifecycle_state(
        self,
        artifact_id: str,
        new_state: LifecycleState,
        deprecation_reason: Optional[str] = None,
        superseded_by: Optional[str] = None,
        sunset_date: Optional[str] = None,
    ) -> ArtifactMetadata:
        """Safely transitions lifecycle state (draft -> active -> deprecated -> retired).

        Notice: Payload content remains strictly immutable! Only the lifecycle state tag
        in metadata is transitioned.
        """
        for meta_file in self.artifacts_dir.glob("*/*/*/metadata.json"):
            try:
                data = json.loads(meta_file.read_text(encoding="utf-8"))
                if data.get("id") == artifact_id:
                    meta = ArtifactMetadata.model_validate(data)
                    meta.state = new_state
                    if deprecation_reason:
                        meta.deprecation_reason = deprecation_reason
                    if superseded_by:
                        meta.superseded_by = superseded_by
                    if sunset_date:
                        meta.sunset_date = sunset_date

                    meta_file.write_text(
                        meta.model_dump_json(indent=2),
                        encoding="utf-8",
                    )
                    return meta
            except Exception:
                continue
        raise ArtifactNotFoundError(artifact_id)


immutable_store = ImmutableStore()
