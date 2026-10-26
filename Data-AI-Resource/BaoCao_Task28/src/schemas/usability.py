"""Pydantic schemas for Task 28 Usability Testing & Issue Resolution."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class TrialTask(BaseModel):
    task_id: str
    task_name: str
    time_to_find_sec: float
    time_after_fix_sec: float
    success: bool
    notes: Optional[str] = None


class UserSession(BaseModel):
    user_id: str
    name: str
    role: str
    experience_years: int
    tasks: List[TrialTask]
    sus_answers: List[int] = Field(..., min_length=10, max_length=10)
    csat_rating: int = Field(..., ge=1, le=5)
    qualitative_feedback: str


class SUSScoreResult(BaseModel):
    user_id: str
    user_name: str
    role: str
    raw_sus_score: float
    grade: str  # A+, A, B, C, D, F
    adjective: str  # Best Imaginable, Excellent, Good, OK, Poor


class UsabilitySummary(BaseModel):
    total_users: int
    total_tasks: int
    initial_task_success_rate: float
    final_task_success_rate: float
    avg_initial_time_to_find_sec: float
    avg_final_time_to_find_sec: float
    time_reduction_percentage: float
    avg_sus_score: float
    overall_sus_grade: str
    avg_csat_rating: float
    user_evaluations: List[SUSScoreResult]


class IssueItem(BaseModel):
    issue_id: str
    title: str
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    impact: str  # HIGH, MEDIUM, LOW
    effort: str  # HIGH, MEDIUM, LOW
    status: str  # RESOLVED, BACKLOG_V1_1
    reported_by: List[str]
    description: str
    resolution_plan: str


class ResolvedFix(BaseModel):
    fix_id: str
    target_issue: str
    component: str
    file_changed: str
    commit_tag: str
    before_behavior: str
    after_behavior: str
    test_verified: str


class LocalizedError(BaseModel):
    loc: List[str]
    msg: str
    type: str
    huong_dan_khac_phuc: str
