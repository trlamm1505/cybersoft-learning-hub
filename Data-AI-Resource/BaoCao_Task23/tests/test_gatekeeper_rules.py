"""Unit tests for Review Gatekeeper and DoD Auto-Publish Prohibition (Task 23)."""

import pytest
from fastapi import HTTPException
from src.schemas.review import ReviewSubmissionRequest
from src.services.generator_engine import GeneratorEngineService
from src.services.review_gatekeeper import ReviewGatekeeperService


def test_gatekeeper_blocks_unapproved_publish(
    engine: GeneratorEngineService, gatekeeper: ReviewGatekeeperService
):
    """Verify DoD constraint: Cannot auto-publish unapproved AI draft."""
    draft = engine.generate_draft(dataset_id="retail_sales_v1")
    assert draft.status == "draft_pending_review"

    with pytest.raises(HTTPException) as exc_info:
        gatekeeper.enforce_no_auto_publish(draft.id)

    assert exc_info.value.status_code == 403
    assert "AUTO_PUBLISH_BLOCKED" in str(exc_info.value.detail)


def test_gatekeeper_allows_publish_after_approval(
    engine: GeneratorEngineService, gatekeeper: ReviewGatekeeperService
):
    """Verify that after human approval, publishing is permitted."""
    draft = engine.generate_draft(dataset_id="retail_sales_v1")
    req = ReviewSubmissionRequest(
        action="approve",
        reviewer_id="teacher_kien_lead",
        notes="Đạt chuẩn sư phạm.",
    )
    approved = gatekeeper.submit_review(draft.id, req)
    assert approved["status"] == "approved"

    # Now publish
    pub_req = ReviewSubmissionRequest(
        action="publish",
        reviewer_id="teacher_kien_lead",
        notes="Xuất bản chính thức.",
    )
    published = gatekeeper.submit_review(draft.id, pub_req)
    assert published["status"] == "published"
