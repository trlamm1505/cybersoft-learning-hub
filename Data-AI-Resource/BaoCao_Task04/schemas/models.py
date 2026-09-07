"""CyberSoft Data & AI Lab — Dataset Registry Metadata Schema Models.

Pydantic v2 implementation for dataset cataloging, lineage tracking,
PII governance, educational learning outcomes, and multi-table schemas.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


class DomainEnum(str, Enum):
    """Business & Technical domains supported in CyberSoft Lab."""

    RETAIL_ECOMMERCE = "retail_ecommerce"
    HR_OPERATIONS = "hr_operations"
    FINTECH_BANKING = "fintech_banking"
    NLP_GENAI = "nlp_genai"
    COMPUTER_VISION = "computer_vision"
    HEALTHTECH = "healthtech"
    EDUCATION = "education"
    LOGISTICS = "logistics"


class LevelEnum(str, Enum):
    """Target learner competency level."""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class DifficultyEnum(str, Enum):
    """Problem-solving complexity difficulty."""

    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class DataFormatEnum(str, Enum):
    """Storage format of data files."""

    CSV = "csv"
    PARQUET = "parquet"
    JSON = "json"
    JSONL = "jsonl"
    SQLITE = "sqlite"


class PIILevelEnum(str, Enum):
    """Sensitivity classification for Personally Identifiable Information."""

    NONE = "none"
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class ComplianceTagEnum(str, Enum):
    """Regulatory and internal compliance standards."""

    GDPR = "GDPR"
    PDPA_VN = "PDPA_VN"
    HIPAA = "HIPAA"
    CCPA = "CCPA"
    INTERNAL_CYBERSOFT = "INTERNAL_CYBERSOFT"


class RoleEnum(str, Enum):
    """Target professional career paths."""

    DATA_ANALYST = "data_analyst"
    AI_ENGINEER = "ai_engineer"
    DATA_ENGINEER = "data_engineer"
    BI_ANALYST = "bi_analyst"


class ForeignKeySchema(BaseModel):
    """Foreign key relation between tables."""

    column: str = Field(..., description="Column name in this table")
    ref_table: str = Field(..., description="Referenced parent table name")
    ref_column: str = Field(..., description="Referenced primary key column name")


class ColumnSchema(BaseModel):
    """Data dictionary entry for a single column/field."""

    name: str = Field(..., min_length=1, max_length=100, description="Column name")
    data_type: str = Field(
        ...,
        description="Data type (e.g., string, integer, float, boolean, datetime, text, vector[1536])",
    )
    nullable: bool = Field(
        default=False, description="Whether NULL/NaN values are permitted"
    )
    description: str = Field(
        ..., min_length=5, description="Clear business meaning of this field"
    )
    is_pii: bool = Field(
        default=False, description="Flag indicating whether column contains PII"
    )
    pii_type: Optional[str] = Field(
        default=None,
        description="Type of PII if applicable: name, phone, email, address, citizen_id, ip, salary",
    )
    constraints: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Integrity checks, e.g. min, max, regex, allowed_values",
    )
    example: Optional[Any] = Field(
        default=None, description="Illustrative sample value"
    )

    @model_validator(mode="after")
    def validate_pii_consistency(self) -> ColumnSchema:
        if self.is_pii and not self.pii_type:
            raise ValueError(
                f"Column '{self.name}' marked as is_pii=True must define 'pii_type'"
            )
        return self


class TableSchema(BaseModel):
    """Relational or document schema for a table/entity within a dataset."""

    table_name: str = Field(
        ..., min_length=1, max_length=100, description="Unique table name"
    )
    description: str = Field(
        ..., min_length=10, description="Purpose of this table in the dataset"
    )
    file_path: str = Field(..., description="Relative file path within dataset package")
    format: DataFormatEnum = Field(
        ..., description="File format (csv, parquet, jsonl, etc.)"
    )
    row_count: int = Field(..., ge=0, description="Total number of records")
    column_count: int = Field(..., ge=1, description="Total number of columns")
    primary_key: List[str] = Field(
        default_factory=list, description="Primary key column(s)"
    )
    foreign_keys: List[ForeignKeySchema] = Field(
        default_factory=list, description="Foreign key links"
    )
    columns: List[ColumnSchema] = Field(
        ..., min_length=1, description="List of column definitions"
    )

    @model_validator(mode="after")
    def validate_columns_match_count(self) -> TableSchema:
        if len(self.columns) != self.column_count:
            raise ValueError(
                f"Table '{self.table_name}' column_count ({self.column_count}) "
                f"does not match actual defined columns ({len(self.columns)})"
            )
        col_names = [c.name for c in self.columns]
        for pk in self.primary_key:
            if pk not in col_names:
                raise ValueError(
                    f"Primary key '{pk}' not found in columns of table '{self.table_name}'"
                )
        for fk in self.foreign_keys:
            if fk.column not in col_names:
                raise ValueError(
                    f"Foreign key '{fk.column}' not found in columns of table '{self.table_name}'"
                )
        return self


class PIIClassification(BaseModel):
    """PII governance and data protection policy."""

    level: PIILevelEnum = Field(
        ..., description="Sensitivity rating (none, low, moderate, high, critical)"
    )
    has_pii: bool = Field(
        ..., description="Whether any sensitive personal data is present"
    )
    anonymization_applied: List[str] = Field(
        default_factory=list,
        description="Techniques applied: synthetic_generation, hashing_sha256, faker_masking, etc.",
    )
    compliance_tags: List[ComplianceTagEnum] = Field(
        ...,
        min_length=1,
        description="Relevant compliance framework (e.g. PDPA_VN, GDPR, INTERNAL_CYBERSOFT)",
    )
    handling_instructions: str = Field(
        ...,
        min_length=10,
        description="Security instructions for students and instructors handling this data",
    )

    @model_validator(mode="after")
    def validate_pii_level(self) -> PIIClassification:
        if self.level == PIILevelEnum.NONE and self.has_pii:
            raise ValueError("PII level cannot be 'none' when has_pii is True")
        if self.has_pii and not self.anonymization_applied:
            raise ValueError(
                "Datasets containing PII must document at least one anonymization technique applied"
            )
        return self


class DataLineage(BaseModel):
    """Data provenance, generation history and transformation lineage."""

    source_system: str = Field(
        ..., min_length=3, description="Origin system or organization"
    )
    upstream_sources: List[str] = Field(
        default_factory=list,
        description="Upstream raw feeds, APIs or parent repositories",
    )
    ingestion_method: str = Field(
        ..., description="Method: synthetic_generator, api_sync, manual_curation"
    )
    generation_tool: Optional[str] = Field(
        default=None,
        description="Tool used for synthesis/curation: Faker, NumPy, Scrapy, CyberSoft LMS",
    )
    transformation_pipeline: List[str] = Field(
        ...,
        min_length=1,
        description="Sequence of transformation stages applied from raw to published",
    )
    raw_data_hash: Optional[str] = Field(
        default=None, description="Cryptographic hash of raw input data before cleaning"
    )


class IntegrityInfo(BaseModel):
    """Cryptographic fingerprint and payload verification."""

    algorithm: str = Field(default="SHA-256", description="Hashing algorithm used")
    checksum: str = Field(
        ...,
        pattern=r"^[a-fA-F0-9]{64}$",
        description="64-character hexadecimal SHA-256 hash",
    )
    file_size_bytes: int = Field(
        ..., ge=0, description="Total size in bytes of packaged dataset"
    )


class LearningOutcomes(BaseModel):
    """Educational alignment for CyberSoft curriculums."""

    target_roles: List[RoleEnum] = Field(
        ...,
        min_length=1,
        description="Intended career tracks (e.g., data_analyst, ai_engineer)",
    )
    core_competencies: List[str] = Field(
        ...,
        min_length=1,
        description="Skills taught: Star Schema, SQL Window Functions, RAG, Embeddings, etc.",
    )
    sample_business_questions: List[str] = Field(
        ...,
        min_length=1,
        description="Business analysis or ML problem statements students will solve",
    )
    recommended_exercises: List[str] = Field(
        ...,
        min_length=1,
        description="Recommended lab assignments or capstone challenges",
    )


class DatasetMetadata(BaseModel):
    """Master Dataset Registry Metadata Schema (DoD Standard)."""

    id: str = Field(
        ...,
        pattern=r"^ds-[a-z0-9-]+$",
        description="Globally unique slug identifier (e.g. ds-ecommerce-sales-v1)",
    )
    title: str = Field(
        ..., min_length=5, max_length=200, description="Human-readable title"
    )
    description: str = Field(
        ..., min_length=20, description="Comprehensive overview of the dataset"
    )
    version: str = Field(
        ...,
        pattern=r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([a-zA-Z0-9.-]+))?$",
        description="Semantic Versioning (SemVer 2.0: Major.Minor.Patch)",
    )
    domain: DomainEnum = Field(..., description="Business or AI domain classification")
    level: LevelEnum = Field(
        ..., description="Target proficiency level (beginner, intermediate, advanced)"
    )
    difficulty: DifficultyEnum = Field(
        ..., description="Problem difficulty (easy, medium, hard)"
    )
    license: str = Field(
        ...,
        min_length=3,
        description="Mandatory open-source or proprietary educational license (e.g., CC-BY-4.0, MIT)",
    )
    pii: PIIClassification = Field(
        ..., description="Mandatory PII governance and compliance policy"
    )
    lineage: DataLineage = Field(
        ..., description="Mandatory data provenance and lineage pipeline"
    )
    learning_outcomes: LearningOutcomes = Field(
        ..., description="Curriculum mapping and educational outcomes"
    )
    tables: List[TableSchema] = Field(
        ..., min_length=1, description="List of tables/entities in this dataset"
    )
    integrity: IntegrityInfo = Field(
        ..., description="Data integrity and checksum information"
    )
    tags: List[str] = Field(default_factory=list, description="Searchable keyword tags")
    author: str = Field(..., min_length=2, description="Dataset creator or curator")
    maintainer: str = Field(
        ..., min_length=2, description="Active maintainer contact/team"
    )
    created_at: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$",
        description="ISO 8601 creation timestamp",
    )
    updated_at: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$",
        description="ISO 8601 last update timestamp",
    )

    @field_validator("license")
    @classmethod
    def validate_license_not_empty(cls, v: str) -> str:
        if not v or v.strip().lower() in ("none", "unknown", "n/a"):
            raise ValueError(
                "License is a mandatory governance field and cannot be unknown or empty"
            )
        return v.strip()

    @model_validator(mode="after")
    def cross_validate_pii_columns(self) -> DatasetMetadata:
        """Cross-checks that if any table column has is_pii=True, dataset.pii.has_pii must be True."""
        detected_pii_cols = []
        for tbl in self.tables:
            for col in tbl.columns:
                if col.is_pii:
                    detected_pii_cols.append(f"{tbl.table_name}.{col.name}")

        if detected_pii_cols and not self.pii.has_pii:
            raise ValueError(
                f"Columns marked as PII found ({', '.join(detected_pii_cols)}), "
                f"but pii.has_pii is set to False!"
            )
        return self
