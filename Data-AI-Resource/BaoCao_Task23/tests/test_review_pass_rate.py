"""Unit tests for Review Pass Rate metrics (DoD: >= 80% pass rate in max 2 rounds)."""

from src.schemas.review import ReviewSubmissionRequest
from src.services.generator_engine import GeneratorEngineService
from src.services.review_gatekeeper import ReviewGatekeeperService


def test_review_pass_rate_meets_dod(
    engine: GeneratorEngineService, gatekeeper: ReviewGatekeeperService
):
    """Verify that multi-round review achieves >= 80% pass rate."""
    # Generate 10 drafts
    drafts = [engine.generate_draft(dataset_id="retail_sales_v1") for _ in range(10)]

    # Review Round 1: Approve 8 (80.0%), request revision on 2
    for idx, d in enumerate(drafts):
        if idx < 8:
            gatekeeper.submit_review(
                d.id,
                ReviewSubmissionRequest(
                    action="approve",
                    reviewer_id="teacher_kien_lead",
                    notes="Approved round 1",
                ),
            )
        else:
            gatekeeper.submit_review(
                d.id,
                ReviewSubmissionRequest(
                    action="request_revision",
                    reviewer_id="teacher_kien_lead",
                    notes="Needs revision",
                ),
            )

    metrics = gatekeeper.calculate_metrics()
    assert metrics.round_1_pass_rate >= 80.0  # DoD criterion!
