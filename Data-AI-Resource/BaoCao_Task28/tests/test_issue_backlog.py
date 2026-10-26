"""Unit tests for Issue Backlog and Prioritization Matrix."""

import pytest
from src.services.issue_resolver import IssueResolver


def test_backlog_total_ten_items(issue_resolver):
    backlog = issue_resolver.get_backlog()
    assert len(backlog) == 10


def test_critical_and_high_issues_count(issue_resolver):
    critical_and_high = issue_resolver.get_critical_and_high_issues()
    assert len(critical_and_high) == 5
    critical_count = sum(1 for i in critical_and_high if i.severity == "CRITICAL")
    high_count = sum(1 for i in critical_and_high if i.severity == "HIGH")
    assert critical_count == 2
    assert high_count == 3


def test_impact_effort_matrix_structure(issue_resolver):
    backlog = issue_resolver.get_backlog()
    for item in backlog:
        assert item.impact in ("HIGH", "MEDIUM", "LOW")
        assert item.effort in ("HIGH", "MEDIUM", "LOW")
        assert item.severity in ("CRITICAL", "HIGH", "MEDIUM", "LOW")
        assert item.status in ("RESOLVED", "BACKLOG_V1_1")


def test_reported_by_references_valid_users(issue_resolver):
    valid_users = {"USR-001", "USR-002", "USR-003", "USR-004", "USR-005"}
    backlog = issue_resolver.get_backlog()
    for item in backlog:
        for reporter in item.reported_by:
            assert reporter in valid_users, f"Invalid reporter {reporter}"


def test_resolution_plan_present_for_all_issues(issue_resolver):
    backlog = issue_resolver.get_backlog()
    for item in backlog:
        assert len(item.resolution_plan.strip()) >= 10
        assert len(item.title.strip()) >= 5
