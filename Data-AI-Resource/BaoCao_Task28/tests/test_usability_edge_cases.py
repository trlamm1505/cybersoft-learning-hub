"""Edge case and robustness tests for Task 28."""

import pytest
from src.services.usability_engine import UsabilityEngine
from src.services.issue_resolver import IssueResolver


def test_sus_extreme_all_ones(usability_engine):
    ans = [1] * 10
    score = usability_engine.calculate_sus(ans)
    assert score == 50.0
    grd, adj = usability_engine.grade_sus(score)
    assert grd == "F" and adj == "Poor"


def test_sus_extreme_all_fives(usability_engine):
    ans = [5] * 10
    score = usability_engine.calculate_sus(ans)
    assert score == 50.0


def test_empty_error_list_localization(issue_resolver):
    res = issue_resolver.localize_pydantic_error([])
    assert res == []


def test_download_size_small_bytes(issue_resolver):
    assert issue_resolver.format_download_header_size(0) == "0 B"
    assert issue_resolver.format_download_header_size(1023) == "1023 B"


def test_download_size_gigabytes(issue_resolver):
    gb = 1024 * 1024 * 1024 * 2
    size_str = issue_resolver.format_download_header_size(gb)
    assert "MB" in size_str


def test_citation_formatting_with_newlines(issue_resolver):
    quote = "Dòng 1\nDòng 2\nDòng 3"
    formatted = issue_resolver.format_citation_copy_tag("DOC-1", "SEC-1", quote)
    assert "\n" not in formatted
    assert "Dòng 1 Dòng 2 Dòng 3" in formatted
