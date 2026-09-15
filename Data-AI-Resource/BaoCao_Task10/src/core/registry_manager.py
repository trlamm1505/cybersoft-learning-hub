"""CyberSoft Dataset Registry - Core Registry Manager.

Handles dataset lifecycle operations:
- Registration of new datasets and semantic versions
- Automated quality gate execution and state transitions
- Publishing and immutability enforcement
- Semantic search and multi-attribute filtering (domain, level, role, skills)
"""

from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path
import shutil
from typing import List, Optional

from .models import (
    DatasetRecord,
    DatasetState,
    DatasetVersionEntry,
    QualityGateResult,
    RegistryDatabase,
)
from .state_machine import DatasetStateMachine, QualityGateFailedError
from ..quality_gate.gate_checker import QualityGateChecker


class DatasetNotFoundError(Exception):
    pass


class VersionAlreadyExistsError(Exception):
    pass


class RegistryManager:
    """Central manager for dataset cataloging, versioning, and publishing."""

    def __init__(self, store_dir: Optional[Path] = None):
        self.base_dir = Path(__file__).resolve().parent.parent.parent
        self.repo_root = self._detect_repo_root()
        self.store_dir = store_dir or (self.base_dir / "registry_store")
        self.db_file = self.store_dir / "registry_db.json"
        self.manifests_dir = self.store_dir / "manifests"
        self.changelogs_dir = self.store_dir / "changelogs"

        self.manifests_dir.mkdir(parents=True, exist_ok=True)
        self.changelogs_dir.mkdir(parents=True, exist_ok=True)

        self.checker = QualityGateChecker()
        self.db = self._load_db()

    def _detect_repo_root(self) -> Path:
        """Dynamically detects repository root (where .git or Data-AI-Resource lives)."""
        curr = self.base_dir.resolve()
        for p in [curr] + list(curr.parents):
            if (p / ".git").exists() or (p / "Data-AI-Resource").exists():
                return p
        return curr.parents[1] if len(curr.parents) >= 2 else curr

    def to_portable_path(self, path: Path | str) -> str:
        """Converts an absolute filesystem path into a portable, repo-relative POSIX path.
        Eliminates machine-specific hardcoded paths (e.g. D:/Cybersoft/Kien/...) so it works
        on any other machine, operating system (Windows/Linux/Mac), or CI/CD runner.
        """
        p = Path(path).resolve()
        try:
            return p.relative_to(self.repo_root).as_posix()
        except ValueError:
            pass
        try:
            return p.relative_to(self.base_dir).as_posix()
        except ValueError:
            pass
        return p.as_posix()

    def resolve_path(self, path_str: str) -> Path:
        """Resolves a portable stored path into a concrete Path on the current host machine."""
        p = Path(path_str)
        if p.is_absolute() and p.exists():
            return p

        # Check candidate 1: Relative to Data-AI-Resource
        cand_ai = (self.base_dir.parent / p).resolve()
        if cand_ai.exists():
            return cand_ai

        # Check candidate 2: Relative to Monorepo root
        cand_repo = (self.repo_root / p).resolve()
        if cand_repo.exists():
            return cand_repo

        # Check candidate 3: Relative to BaoCao_Task10
        cand_base = (self.base_dir / p).resolve()
        if cand_base.exists():
            return cand_base

        return cand_ai

    def _load_db(self) -> RegistryDatabase:
        if self.db_file.exists():
            try:
                with open(self.db_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return RegistryDatabase.model_validate(data)
            except Exception:
                pass
        db = RegistryDatabase()
        self._save_db(db)
        return db

    def _save_db(self, db: Optional[RegistryDatabase] = None) -> None:
        if db is not None:
            self.db = db
        self.db.last_updated = datetime.utcnow().isoformat() + "Z"
        with open(self.db_file, "w", encoding="utf-8") as f:
            json.dump(self.db.model_dump(), f, indent=2, ensure_ascii=False)

    def register_dataset(
        self,
        manifest_path: Path,
        data_files: Optional[List[Path]] = None,
        changelog: str = "Initial registration",
    ) -> DatasetRecord:
        """Registers a new dataset or adds a new version from a manifest file."""
        if not manifest_path.exists():
            raise FileNotFoundError(f"Manifest not found: {manifest_path}")

        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)

        dataset_id = manifest_data.get("id")
        version_str = manifest_data.get("version", "1.0.0")

        if not dataset_id:
            raise ValueError("Manifest must contain a unique 'id' field")

        # Copy manifest into internal registry store
        dest_manifest_name = f"{dataset_id}_v{version_str}.json"
        dest_manifest_path = self.manifests_dir / dest_manifest_name
        shutil.copy2(manifest_path, dest_manifest_path)

        data_paths_str = [self.to_portable_path(p) for p in (data_files or [])]
        rel_manifest = self.to_portable_path(dest_manifest_path)

        new_version = DatasetVersionEntry(
            version=version_str,
            state=DatasetState.DRAFT,
            manifest_path=rel_manifest,
            data_paths=data_paths_str,
            changelog=changelog,
        )

        if dataset_id not in self.db.datasets:
            # Extract metadata
            learning_outcomes = manifest_data.get("learning_outcomes", {})
            target_roles = learning_outcomes.get("target_roles", [])
            skills = learning_outcomes.get("core_competencies", [])

            record = DatasetRecord(
                id=dataset_id,
                name=manifest_data.get("title", dataset_id),
                description=manifest_data.get("description", ""),
                domain=manifest_data.get("domain", "general"),
                difficulty_level=manifest_data.get("level", "beginner"),
                target_roles=target_roles,
                skills=skills,
                license=manifest_data.get("license", "CC-BY-4.0"),
                pii_safe=not manifest_data.get("pii", {}).get("has_pii", False),
                versions={version_str: new_version},
            )
            self.db.datasets[dataset_id] = record
        else:
            record = self.db.datasets[dataset_id]
            if version_str in record.versions:
                existing_state = record.versions[version_str].state
                if existing_state == DatasetState.PUBLISHED:
                    raise VersionAlreadyExistsError(
                        f"Version {version_str} of dataset '{dataset_id}' is already PUBLISHED and immutable."
                    )
            record.versions[version_str] = new_version

        self._save_db()
        return record

    def validate_dataset(
        self,
        dataset_id: str,
        version: str,
    ) -> QualityGateResult:
        """Executes automated quality gate verification for a specific version."""
        if dataset_id not in self.db.datasets:
            raise DatasetNotFoundError(f"Dataset '{dataset_id}' not found in registry")

        record = self.db.datasets[dataset_id]
        if version not in record.versions:
            raise ValueError(
                f"Version '{version}' not found for dataset '{dataset_id}'"
            )

        v_entry = record.versions[version]
        manifest_full_path = self.resolve_path(v_entry.manifest_path)

        with open(manifest_full_path, "r", encoding="utf-8") as f:
            manifest_data = json.load(f)

        data_files = [self.resolve_path(p) for p in v_entry.data_paths]
        result = self.checker.evaluate(
            manifest_data=manifest_data, data_files=data_files
        )

        # Update state via State Machine
        if DatasetStateMachine.can_transition(v_entry.state, DatasetState.UNDER_REVIEW):
            v_entry.state = DatasetStateMachine.transition(
                v_entry.state, DatasetState.UNDER_REVIEW
            )

        v_entry.quality_gate = result

        if not result.passed:
            v_entry.state = DatasetState.REJECTED

        self._save_db()
        return result

    def publish_dataset(
        self,
        dataset_id: str,
        version: str,
    ) -> DatasetRecord:
        """Publishes a validated dataset version, locking it into the public catalog."""
        if dataset_id not in self.db.datasets:
            raise DatasetNotFoundError(f"Dataset '{dataset_id}' not found")

        record = self.db.datasets[dataset_id]
        if version not in record.versions:
            raise ValueError(f"Version '{version}' does not exist")

        v_entry = record.versions[version]

        # Auto-validate if not yet checked
        if v_entry.quality_gate is None:
            self.validate_dataset(dataset_id, version)

        # Check quality gate explicitly before state transition
        if v_entry.quality_gate is not None and (
            not v_entry.quality_gate.passed or v_entry.state == DatasetState.REJECTED
        ):
            violations_str = (
                "; ".join(v_entry.quality_gate.violations)
                if v_entry.quality_gate.violations
                else "Score below threshold"
            )
            raise QualityGateFailedError(
                f"Quality Gate FAILED (Score: {v_entry.quality_gate.score:.1f}%). "
                f"Blocking violations: {violations_str}"
            )

        # Transition to PUBLISHED
        new_state = DatasetStateMachine.transition(
            current=v_entry.state,
            target=DatasetState.PUBLISHED,
            quality_gate=v_entry.quality_gate,
        )

        v_entry.state = new_state
        v_entry.published_at = datetime.utcnow().isoformat() + "Z"
        record.latest_published_version = version

        # Record changelog
        cl_file = self.changelogs_dir / f"{dataset_id}.md"
        with open(cl_file, "a", encoding="utf-8") as f:
            f.write(
                f"\n## [{version}] - {v_entry.published_at}\n"
                f"- Status: **PUBLISHED**\n"
                f"- Quality Score: **{v_entry.quality_gate.score if v_entry.quality_gate else 0.0:.1f}%**\n"
                f"- Notes: {v_entry.changelog}\n"
            )

        self._save_db()
        return record

    def search_datasets(
        self,
        query: Optional[str] = None,
        domain: Optional[str] = None,
        difficulty: Optional[str] = None,
        role: Optional[str] = None,
        skill: Optional[str] = None,
        state: Optional[DatasetState] = None,
    ) -> List[DatasetRecord]:
        """Searches and filters datasets by query keywords, metadata attributes, or lifecycle state."""
        results = []
        q_lower = query.lower() if query else None

        for record in self.db.datasets.values():
            # State filter
            if state:
                has_state = any(v.state == state for v in record.versions.values())
                if not has_state:
                    continue

            # Domain filter
            if domain and record.domain.lower() != domain.lower():
                continue

            # Difficulty filter
            if difficulty and record.difficulty_level.lower() != difficulty.lower():
                continue

            # Target role filter
            if role:
                if not any(role.lower() in r.lower() for r in record.target_roles):
                    continue

            # Skill filter
            if skill:
                if not any(skill.lower() in s.lower() for s in record.skills):
                    continue

            # Text query
            if q_lower:
                text_corpus = f"{record.id} {record.name} {record.description} {' '.join(record.skills)}".lower()
                if q_lower not in text_corpus:
                    continue

            results.append(record)

        return results

    def list_all(self) -> List[DatasetRecord]:
        return list(self.db.datasets.values())

    def get_dataset(self, dataset_id: str) -> Optional[DatasetRecord]:
        return self.db.datasets.get(dataset_id)
