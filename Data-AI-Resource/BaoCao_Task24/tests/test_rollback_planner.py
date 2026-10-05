"""Tests for rollback plan and Rollback Note generation."""

from src.schemas.lifecycle import RollbackRequest
from src.services.rollback_planner import rollback_planner


def test_generate_rollback_plan_steps():
    req = RollbackRequest(
        current_release_id="rel_v1.1.0",
        target_release_id="rel_v1.0.0",
        operator="Đào Trung Kiên",
        reason="Kiểm thử quy trình hoàn tác định kỳ.",
    )
    plan = rollback_planner.generate_plan(req)

    assert plan.from_release_id == "rel_v1.1.0"
    assert plan.to_release_id == "rel_v1.0.0"
    assert plan.risk_level == "LOW"
    assert len(plan.steps) >= 4
    assert len(plan.preflight_checks) >= 3
    assert len(plan.post_rollback_tests) >= 3


def test_rollback_note_markdown_content():
    req = RollbackRequest(
        current_release_id="rel_v1.1.0",
        target_release_id="rel_v1.0.0",
        operator="Đào Trung Kiên",
        reason="Kiểm thử an toàn hoàn tác.",
    )
    plan = rollback_planner.generate_plan(req)

    note = plan.markdown_note
    assert "TÀI LIỆU HƯỚNG DẪN HOÀN TÁC (ROLLBACK NOTE)" in note
    assert "v1.1.0" in note
    assert "v1.0.0" in note
    # Strict verification: Ensure forbidden term is NEVER present in note
    forbidden_pattern = "kịch" + " bản"
    assert forbidden_pattern not in note.lower()
