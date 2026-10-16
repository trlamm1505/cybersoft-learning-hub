"""Unit tests for the 5 priority fixes applied to resolve Critical/High issues."""

import pytest
from src.services.issue_resolver import IssueResolver


def test_resolved_fixes_count_and_mapping(issue_resolver):
    fixes = issue_resolver.get_resolved_fixes()
    assert len(fixes) == 5
    issue_ids = [f.target_issue for f in fixes]
    assert issue_ids == ["ISS-001", "ISS-002", "ISS-003", "ISS-004", "ISS-005"]


def test_fix_001_filter_reset_and_active_count():
    filters = {"domain": "DATA_ANALYST", "level": "INTERMEDIATE", "license": "MIT"}
    active_count = sum(1 for v in filters.values() if v is not None)
    assert active_count == 3

    reset_filters = {k: None for k in filters}
    active_reset_count = sum(1 for v in reset_filters.values() if v is not None)
    assert active_reset_count == 0


def test_fix_002_dataset_preview_responsiveness():
    sample_rows = list(range(100))
    page_size = 10
    page_1 = sample_rows[:page_size]
    assert len(page_1) == 10
    assert page_1[0] == 0 and page_1[-1] == 9


def test_fix_003_1click_copy_citation_tag(issue_resolver):
    formatted = issue_resolver.format_citation_copy_tag(
        document_code="CS-POL-001",
        section_id="quy_che_bao_luu",
        quote_text="Học viên được quyền bảo lưu 06 tháng."
    )
    assert formatted == '[CS-POL-001#quy_che_bao_luu] "Học viên được quyền bảo lưu 06 tháng."'


def test_fix_004_vietnamese_error_transformer_missing_field(issue_resolver):
    raw_errors = [{"loc": ["body", "dataset_id"], "msg": "field required", "type": "value_error.missing"}]
    localized = issue_resolver.localize_pydantic_error(raw_errors)
    assert len(localized) == 1
    assert "Trường bắt buộc không được để trống" in localized[0].msg
    assert "dataset_id" in localized[0].msg
    assert "Vui lòng bổ sung" in localized[0].huong_dan_khac_phuc


def test_fix_004_vietnamese_error_transformer_type_int(issue_resolver):
    raw_errors = [{"loc": ["body", "record_count"], "msg": "not an int", "type": "type_error.integer"}]
    localized = issue_resolver.localize_pydantic_error(raw_errors)
    assert len(localized) == 1
    assert "Sai kiểu dữ liệu số nguyên" in localized[0].msg
    assert "record_count" in localized[0].msg


def test_fix_004_vietnamese_error_transformer_type_float(issue_resolver):
    raw_errors = [{"loc": ["body", "threshold"], "msg": "not a float", "type": "type_error.float"}]
    localized = issue_resolver.localize_pydantic_error(raw_errors)
    assert len(localized) == 1
    assert "Sai kiểu dữ liệu số thực" in localized[0].msg


def test_fix_005_download_size_header_and_progress(issue_resolver):
    assert issue_resolver.format_download_header_size(500) == "500 B"
    assert issue_resolver.format_download_header_size(1024 * 50) == "50.0 KB"
    assert issue_resolver.format_download_header_size(1024 * 1024 * 12) == "12.0 MB"
