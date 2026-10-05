"""Release Manifest Builder Service.

Generates production release manifests adhering to CyberSoft standards:
- Aggregates all registered components into a single manifest.
- Computes holistic cryptographic checksums (SHA-256).
- Preserves release immutability (WORM guarantee on release manifests).
"""

import hashlib
import json
from pathlib import Path
from typing import Optional

from src.config import config
from src.schemas.artifact import LifecycleState
from src.schemas.manifest import ReleaseComponent, ReleaseManifest
from src.services.immutable_store import (
    ImmutableArtifactError,
    ImmutableStore,
    immutable_store,
)


class ManifestBuilder:
    def __init__(
        self,
        store: Optional[ImmutableStore] = None,
        releases_dir: Optional[Path] = None,
    ):
        self.store = store or immutable_store
        self.releases_dir = releases_dir or config.releases_dir
        self.releases_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def compute_holistic_checksum(components: dict[str, ReleaseComponent]) -> str:
        """Calculates deterministic aggregate SHA-256 over all sorted components."""
        tokens = []
        for art_id in sorted(components.keys()):
            comp = components[art_id]
            tokens.append(
                f"{art_id}:{comp.version}:{comp.content_hash}:{comp.state.value}"
            )
        payload = "\n".join(tokens)
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def build_manifest(
        self,
        version: str,
        release_name: str,
        description: str,
        release_notes: str,
        git_tag: str,
        include_drafts: bool = False,
    ) -> ReleaseManifest:
        """Packages active/current artifacts into a Release Manifest."""
        clean_version = version.strip()
        if not clean_version.startswith("v"):
            clean_version = f"v{clean_version}"

        release_id = f"rel_{clean_version}"
        target_file = self.releases_dir / f"release_manifest_{clean_version}.json"

        artifacts = self.store.list_artifacts()
        components: dict[str, ReleaseComponent] = {}
        counts: dict[str, int] = {}

        for art in artifacts:
            if not include_drafts and art.state == LifecycleState.DRAFT:
                continue
            comp = ReleaseComponent(
                artifact_id=art.id,
                name=art.name,
                artifact_type=art.artifact_type,
                version=art.version,
                content_hash=art.content_hash,
                state=art.state,
                storage_path=art.file_path,
                upstream_ids=art.upstream_ids,
            )
            components[art.id] = comp
            t = art.artifact_type.value
            counts[t] = counts.get(t, 0) + 1

        holistic_hash = self.compute_holistic_checksum(components)

        manifest = ReleaseManifest(
            release_id=release_id,
            version=clean_version,
            release_name=release_name,
            description=description,
            holistic_checksum=holistic_hash,
            components=components,
            component_counts=counts,
            git_tag=git_tag,
            release_notes=release_notes,
        )

        # WORM check: Do not overwrite if release manifest file exists
        if target_file.exists():
            raise ImmutableArtifactError(release_id, str(target_file))

        target_file.write_text(
            manifest.model_dump_json(indent=2),
            encoding="utf-8",
        )
        return manifest

    def get_manifest(self, version_or_id: str) -> ReleaseManifest:
        """Retrieves an existing release manifest by version or id."""
        clean = version_or_id.replace("rel_", "")
        if not clean.startswith("v"):
            clean = f"v{clean}"
        target_file = self.releases_dir / f"release_manifest_{clean}.json"
        if not target_file.exists():
            # Try searching all json files in releases_dir
            for f in self.releases_dir.glob("*.json"):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    if (
                        data.get("release_id") == version_or_id
                        or data.get("version") == version_or_id
                    ):
                        return ReleaseManifest.model_validate(data)
                except Exception:
                    continue
            raise FileNotFoundError(f"Release manifest '{version_or_id}' not found.")
        data = json.loads(target_file.read_text(encoding="utf-8"))
        return ReleaseManifest.model_validate(data)

    def list_manifests(self) -> list[ReleaseManifest]:
        """Lists all existing release manifests sorted by version."""
        manifests = []
        for f in self.releases_dir.glob("release_manifest_*.json"):
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                manifests.append(ReleaseManifest.model_validate(data))
            except Exception:
                continue
        return sorted(manifests, key=lambda m: m.version)


manifest_builder = ManifestBuilder()
