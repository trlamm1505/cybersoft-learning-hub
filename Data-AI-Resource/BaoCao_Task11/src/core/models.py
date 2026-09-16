"""Pydantic models for CyberSoft Student Project Bank."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DomainEnum(str, Enum):
    RETAIL_ECOMMERCE = "retail_ecommerce"
    HR_OPERATIONS = "hr_operations"
    FINANCE_BANKING = "finance_banking"
    NLP_GENAI = "nlp_genai"
    COMPUTER_VISION = "computer_vision"
    RECOMMENDER_SYSTEM = "recommender_system"
    EDTECH_ANALYTICS = "edtech_analytics"


class LevelEnum(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class RoleEnum(str, Enum):
    DATA_ANALYST = "data_analyst"
    AI_ENGINEER = "ai_engineer"
    DATA_ENGINEER = "data_engineer"
    QA_ENGINEER = "qa_engineer"


class FormatEnum(str, Enum):
    CSV = "csv"
    JSON = "json"
    PARQUET = "parquet"
    SQLITE = "sqlite"


class ScoringLevelEnum(str, Enum):
    EXEMPLARY = "exemplary"
    PROFICIENT = "proficient"
    DEVELOPING = "developing"
    UNSATISFACTORY = "unsatisfactory"


class ArtifactTypeEnum(str, Enum):
    CODE = "code"
    SQL = "sql"
    NOTEBOOK = "notebook"
    REPORT = "report"
    DASHBOARD = "dashboard"
    DATASET = "dataset"


class MetadataModel(BaseModel):
    id: str = Field(..., pattern=r"^[a-z0-9-]+$")
    title: str = Field(..., min_length=5)
    domain: DomainEnum
    level: LevelEnum
    target_role: RoleEnum
    estimated_hours: float = Field(..., ge=1, le=60)
    version: str = Field(..., pattern=r"^\d+\.\d+\.\d+$")
    author: str
    created_date: Optional[str] = None
    tags: List[str] = Field(..., min_length=1)


class BusinessContextModel(BaseModel):
    company_name: str
    industry: str
    problem_statement: str = Field(..., min_length=20)
    business_objectives: List[str] = Field(..., min_length=1)
    target_stakeholders: List[str] = Field(..., min_length=1)


class ColumnModel(BaseModel):
    name: str
    type: str
    description: str
    primary_key: Optional[bool] = False
    foreign_key: Optional[str] = None


class DatasetModel(BaseModel):
    dataset_id: str
    name: str
    file_path: str
    format: FormatEnum
    description: str
    record_count: int = Field(..., ge=1)
    columns: List[ColumnModel]
    known_data_issues: Optional[List[str]] = Field(default_factory=list)


class TaskItemModel(BaseModel):
    task_id: str
    name: str
    description: str
    points: int = Field(..., ge=1)
    learning_outcomes: List[str] = Field(..., min_length=1)
    expected_outputs: List[str] = Field(..., min_length=1)


class RequirementsModel(BaseModel):
    total_core_points: int = Field(..., ge=50, le=80)
    total_extension_points: int = Field(..., ge=20, le=50)
    core_tasks: List[TaskItemModel] = Field(..., min_length=1)
    extension_tasks: List[TaskItemModel] = Field(..., min_length=1)


class KPIItemModel(BaseModel):
    kpi_id: str
    name: str
    formula: str
    expected_value: Optional[Any] = None
    unit: str
    tolerance_pct: float = Field(..., ge=0, le=10)


class KPIsModel(BaseModel):
    business_kpis: List[KPIItemModel] = Field(..., min_length=1)
    technical_kpis: List[KPIItemModel] = Field(..., min_length=1)


class ScoringLevelModel(BaseModel):
    level: ScoringLevelEnum
    points: float = Field(..., ge=0)
    descriptor: str


class RubricCriterionModel(BaseModel):
    criterion_id: str
    name: str
    max_points: float = Field(..., ge=1)
    quantitative_metric: str = Field(..., min_length=10)
    scoring_levels: List[ScoringLevelModel] = Field(..., min_length=2)


class RubricCategoryModel(BaseModel):
    category_id: str
    name: str
    weight: float = Field(..., ge=1, le=100)
    criteria: List[RubricCriterionModel] = Field(..., min_length=1)


class RubricsModel(BaseModel):
    total_points: int = 100
    categories: List[RubricCategoryModel] = Field(..., min_length=1)


class HintTierModel(BaseModel):
    tier: int = Field(..., ge=1, le=3)
    tier_name: str
    task_hints: Dict[str, str]


class ExpectedArtifactModel(BaseModel):
    artifact_id: str
    name: str
    type: ArtifactTypeEnum
    file_pattern: str
    required: bool
    description: str


class ProjectManifestModel(BaseModel):
    schema_url: str = Field(alias="$schema")
    metadata: MetadataModel
    business_context: BusinessContextModel
    datasets: List[DatasetModel]
    requirements: RequirementsModel
    kpis: KPIsModel
    rubrics: RubricsModel
    hints: List[HintTierModel]
    expected_artifacts: List[ExpectedArtifactModel]
