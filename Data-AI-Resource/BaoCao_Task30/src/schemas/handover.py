"""Pydantic schemas for Task 30 Final Handover."""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class DatasetItem(BaseModel):
    id: str
    name: str
    schema_standard: str
    formats: List[str]
    clean_dirty_pair: bool
    data_dictionary: str
    records_count: int
    status: str


class CapstoneItem(BaseModel):
    id: str
    title: str
    target_learners: str
    deliverables: List[str]
    status: str


class SLABenchmarks(BaseModel):
    hybrid_search_p95_ms: float
    hybrid_search_sla_limit_ms: float
    ai_tutor_p95_ms: float
    ai_tutor_sla_limit_ms: float
    throughput_rps: float
    cache_hit_rate_pct: float
    system_usability_scale_sus: float
    time_to_find_reduction_pct: float
    task_completion_rate_pct: float
    disaster_recovery_checksum_match_pct: float


class KnownIssue(BaseModel):
    issue_id: str
    severity: str
    description: str
    mitigation: str
    workaround: str


class RoadmapPhase(BaseModel):
    phase: str
    focus: str
    milestones: List[str]


class HandoverSummary(BaseModel):
    release_version: str
    project_name: str
    handover_date: str
    lead_engineer: str
    role: str
    deliverables_summary: Dict[str, Any]
    datasets_count: int
    capstones_count: int
    sla_compliance_rate_pct: float
    status: str


class VerificationResult(BaseModel):
    verified_at: str
    total_checks: int
    passed_checks: int
    compliance_rate_pct: float
    status: str
    details: List[str]
