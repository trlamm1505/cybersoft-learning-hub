"""Pydantic schemas for Learning Platform Integration (Task 26).

Fully compatible with Learning Hub TypeScript definitions:
- dataset-contract.types.ts (RegistryDictionaryTable, RegistryDictionaryColumn, RegistryEnvelope)
- immutable snapshot assignment contract
- actionable version mismatch responses
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None
    suggested_action: Optional[str] = None


class RegistryEnvelope(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None
    meta: Optional[Dict[str, Any]] = None


class RegistryDictionaryColumn(BaseModel):
    name: str
    data_type: str
    nullable: bool = False
    is_primary_key: bool = False
    is_foreign_key: bool = False
    foreign_key_target: Optional[str] = None
    description: Optional[str] = None


class RegistryDictionaryTable(BaseModel):
    table_name: str
    file_name: Optional[str] = None
    row_count: Optional[int] = None
    primary_key: Optional[str] = None
    description: Optional[str] = None
    columns: List[RegistryDictionaryColumn] = Field(default_factory=list)


class CatalogItem(BaseModel):
    resource_id: str
    name: str
    type: str  # dataset, evaluation_set, project_template
    domain: str
    target_roles: List[str]
    description: str
    current_version: str
    published_versions: List[str]
    status: str  # ACTIVE, DEPRECATED, ARCHIVED
    tags: List[str] = Field(default_factory=list)
    data_dictionary: Optional[List[RegistryDictionaryTable]] = None
    total_questions: Optional[int] = None
    starter_repo_url: Optional[str] = None
    sample_download_url: Optional[str] = None
    sandbox_schema: Optional[str] = None
    sha256_checksum: Optional[str] = None


class CatalogListResponse(BaseModel):
    total_count: int
    items: List[CatalogItem]


class AssignmentResolveRequest(BaseModel):
    resource_id: str
    requested_version: str = "latest"
    exercise_slug: Optional[str] = None
    class_id: Optional[str] = None
    teacher_id: Optional[str] = None


class AssignmentResolveResponse(BaseModel):
    resource_id: str
    resource_name: str
    resolved_version: str
    status: str
    snapshot_hash: str
    data_dictionary: Optional[List[RegistryDictionaryTable]] = None
    sandbox_metadata: Dict[str, Any]
    assigned_at: str
    is_immutable_locked: bool = True
    compatibility_guarantee: str = "Bài tập được bảo vệ tính tái lập độc lập với các bản cập nhật tương lai của Data Lab."


class AssignmentValidateRequest(BaseModel):
    resource_id: str
    assigned_version: str
    snapshot_hash: str


class AssignmentValidateResponse(BaseModel):
    valid: bool
    resource_id: str
    assigned_version: str
    current_registry_version: str
    is_hash_matching: bool
    version_drift_detected: bool
    message: str


class VersionInfo(BaseModel):
    version: str
    status: str
    release_date: str
    snapshot_hash: str
    changelog: str
    deprecated_reason: Optional[str] = None
    suggested_version: Optional[str] = None
    total_rows: Optional[int] = None
    columns_count: Optional[int] = None
    total_items: Optional[int] = None
