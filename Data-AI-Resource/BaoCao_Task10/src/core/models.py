"""CyberSoft Dataset Registry & Publishing Portal - Data Models.

Defines Pydantic models and Enums for dataset lifecycle, state transitions,
metadata records, quality gate results, and version tracking.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
import re
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


class DatasetState(str, Enum):
    """Lifecycle states for dataset versions in the registry."""

    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    PUBLISHED = "published"
    REJECTED = "rejected"


class Domain(str, Enum):
    """Business and learning domains."""

    ECOMMERCE = "ecommerce"
    HUMAN_RESOURCES = "human_resources"
    AI_RAG = "ai_rag"
    EDUCATION = "education"
    GENERAL = "general"


class DifficultyLevel(str, Enum):
    """Pedagogical difficulty level."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class TargetRole(str, Enum):
    """Target learner role."""

    DATA_ANALYST = "data_analyst"
    AI_ENGINEER = "ai_engineer"
    QA_ENGINEER = "qa_engineer"


SEMVER_REGEX = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([a-zA-Z0-9.-]+))?$"
)


class QualityGateResult(BaseModel):
    """Result summary from automated Data Quality Harness and Schema validation."""

    passed: bool = Field(
        description="True if quality checks satisfy publishing gate threshold"
    )
    score: float = Field(
        ge=0.0, le=100.0, description="Overall quality score (0.0 to 100.0)"
    )
    schema_valid: bool = Field(
        default=True, description="Conforms to dataset.schema.json"
    )
    total_checks: int = Field(default=0, ge=0)
    passed_checks: int = Field(default=0, ge=0)
    failed_checks: int = Field(default=0, ge=0)
    violations: List[str] = Field(
        default_factory=list, description="List of blocking defects"
    )
    warnings: List[str] = Field(
        default_factory=list, description="Non-blocking observations"
    )
    evaluated_at: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    details: Dict[str, Any] = Field(default_factory=dict)


class DatasetVersionEntry(BaseModel):
    """Tracks a single semantic version of a dataset."""

    version: str = Field(description="Semantic version string (e.g., 1.0.0)")
    state: DatasetState = Field(default=DatasetState.DRAFT)
    manifest_path: str = Field(description="Relative path to dataset manifest JSON")
    data_paths: List[str] = Field(
        default_factory=list, description="Relative paths to CSV/JSON files"
    )
    quality_gate: Optional[QualityGateResult] = Field(default=None)
    changelog: str = Field(default="Initial release")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    published_at: Optional[str] = Field(default=None)

    @field_validator("version")
    @classmethod
    def validate_semver(cls, v: str) -> str:
        if not SEMVER_REGEX.match(v):
            raise ValueError(
                f"Invalid semantic version: '{v}'. Must match SemVer (e.g., 1.0.0)"
            )
        return v


class DatasetRecord(BaseModel):
    """Complete registry record for a dataset across all its versions."""

    id: str = Field(
        description="Unique dataset slug identifier (e.g. da_ecommerce_sales)"
    )
    name: str = Field(description="Human-readable title")
    description: str = Field(description="Comprehensive dataset summary")
    domain: str = Field(default="general")
    difficulty_level: str = Field(default="beginner")
    target_roles: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    license: str = Field(default="CC-BY-4.0")
    pii_safe: bool = Field(default=True)
    author: str = Field(default="CyberSoft Data & AI Team")
    latest_published_version: Optional[str] = Field(default=None)
    versions: Dict[str, DatasetVersionEntry] = Field(default_factory=dict)


class RegistryDatabase(BaseModel):
    """Top-level database storage format for the Dataset Registry."""

    schema_version: str = Field(default="1.0.0")
    last_updated: str = Field(
        default_factory=lambda: datetime.utcnow().isoformat() + "Z"
    )
    datasets: Dict[str, DatasetRecord] = Field(default_factory=dict)
