"""Pydantic schemas for Task 27 - QA Harness Integration & Quality Gate."""

from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class GateStatus(str, Enum):
    PASSED = "PASSED"
    WARNING = "WARNING"
    BLOCKED = "BLOCKED"


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


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


class FindingItem(BaseModel):
    rule_id: str
    category: str
    severity: SeverityLevel
    component_id: str
    message: str
    actionable_fix: str


class GateEvaluationResult(BaseModel):
    gate_name: str
    category: str
    status: GateStatus
    score: float
    violations_count: int
    findings: List[FindingItem] = Field(default_factory=list)
    actionable_reasons: List[str] = Field(default_factory=list)


class BypassRequest(BaseModel):
    requested: bool = False
    reason: Optional[str] = None
    authorized_by: Optional[str] = None


class BypassAuditRecord(BaseModel):
    bypass_granted: bool
    reason: str
    authorized_by: str
    timestamp: str
    ip_or_source: str = "Internal CI/CD"


class ReleaseGateRequest(BaseModel):
    release_version: str
    target_datasets: List[str] = Field(default_factory=list)
    target_benchmarks: List[str] = Field(default_factory=list)
    target_contents: List[str] = Field(default_factory=list)
    bypass: Optional[BypassRequest] = None


class ReleaseGateResponse(BaseModel):
    release_version: str
    overall_status: GateStatus
    can_release: bool
    failure_count: int
    warning_count: int
    component_gates: Dict[str, GateEvaluationResult]
    actionable_summary: List[str]
    audit_record: Optional[BypassAuditRecord] = None
    evaluated_at: str
