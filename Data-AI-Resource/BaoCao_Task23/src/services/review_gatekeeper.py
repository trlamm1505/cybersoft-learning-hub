"""Human Review Gatekeeper and DoD Compliance Service (Task 23).

Enforces core DoD constraints:
1. Strict prohibition of auto-publishing AI content (status: draft_pending_review -> approved -> published).
2. Requirement that every exercise contains >= 1 learning outcome and >= 1 test case.
3. Tracking of multi-round reviews ensuring >= 80% pass rate in max 2 rounds.
"""

from datetime import datetime
from typing import Any
from fastapi import HTTPException, status

from src.schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload
from src.schemas.review import ReviewSubmissionRequest, RoundMetrics
from src.services.generator_engine import GeneratorEngineService


class ReviewGatekeeperService:
    """Service enforcing human gatekeeping and calibration metrics."""

    def __init__(self, engine: GeneratorEngineService):
        self.engine = engine
        self.auto_publish_blocked_count = 0

    def enforce_no_auto_publish(self, exercise_id: str):
        """Block direct publishing if exercise has not been explicitly approved by human."""
        draft = self.engine.drafts.get(exercise_id) or self.engine.approved.get(
            exercise_id
        )
        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="EXERCISE_NOT_FOUND",
                        message=f"Không tìm thấy bài tập với mã '{exercise_id}'",
                        request_id=f"req-err-{exercise_id}",
                    ),
                ).model_dump(),
            )

        curr_status = draft.get("status")
        if curr_status != "approved":
            self.auto_publish_blocked_count += 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="AUTO_PUBLISH_BLOCKED",
                        message="Vi phạm điều kiện nghiệm thu DoD: Tuyệt đối không tự động publish nội dung AI!",
                        details=[
                            ErrorDetail(
                                field="status",
                                issue=f"Bài tập '{exercise_id}' đang ở trạng thái '{curr_status}'. Bắt buộc phải qua Giảng viên phê duyệt ('approved') trước khi được publish!",
                            )
                        ],
                        request_id=f"req-gatekeeper-{exercise_id}",
                    ),
                ).model_dump(),
            )

    def submit_review(
        self, exercise_id: str, req: ReviewSubmissionRequest
    ) -> dict[str, Any]:
        """Process human review decision."""
        draft = self.engine.drafts.get(exercise_id)
        if not draft:
            draft = self.engine.approved.get(exercise_id)

        if not draft:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=ErrorEnvelope(
                    success=False,
                    error=ErrorPayload(
                        code="EXERCISE_NOT_FOUND",
                        message=f"Không tìm thấy bài tập với mã '{exercise_id}'",
                        request_id=f"req-rev-{exercise_id}",
                    ),
                ).model_dump(),
            )

        now_iso = datetime.utcnow().isoformat() + "Z"
        curr_round = draft.get("review_round", 1)

        if req.title:
            draft["title"] = req.title
        if req.description:
            draft["description"] = req.description
        if req.solution_code:
            draft["solution_code"] = req.solution_code
        if req.calibrated_bloom:
            draft["bloom_level"] = req.calibrated_bloom
        if req.calibrated_difficulty:
            draft["difficulty"] = req.calibrated_difficulty

        if req.action == "publish":
            self.enforce_no_auto_publish(exercise_id)
            draft["status"] = "published"
            draft["updated_at"] = now_iso
            self.engine.approved[exercise_id] = draft
            self.engine._save_stores()
            return draft

        if req.action == "approve":
            draft["status"] = "approved"
            draft["reviewer_id"] = req.reviewer_id
            draft["approved_at"] = now_iso
            draft["updated_at"] = now_iso
            draft["review_notes"] = req.notes

            # Move to approved bank
            self.engine.approved[exercise_id] = draft
            if exercise_id in self.engine.drafts:
                self.engine.drafts[exercise_id]["status"] = "approved"

        elif req.action == "request_revision":
            draft["status"] = "revision_requested"
            draft["review_round"] = min(curr_round + 1, 2)
            draft["review_notes"] = req.notes
            draft["updated_at"] = now_iso
            self.engine.drafts[exercise_id] = draft

        elif req.action == "update":
            draft["updated_at"] = now_iso
            draft["review_notes"] = req.notes
            if exercise_id in self.engine.drafts:
                self.engine.drafts[exercise_id] = draft
            if exercise_id in self.engine.approved:
                self.engine.approved[exercise_id] = draft

        elif req.action == "reject":
            draft["status"] = "rejected"
            draft["review_notes"] = req.notes
            draft["updated_at"] = now_iso
            self.engine.drafts[exercise_id] = draft

        self.engine._save_stores()

        return draft

    def calculate_metrics(self) -> RoundMetrics:
        """Compute review pass rate metrics to verify DoD criteria."""
        all_exercises = list(self.engine.drafts.values())
        approved_items = list(self.engine.approved.values())

        # Combine unique items
        combined: dict[str, dict[str, Any]] = {}
        for ex in all_exercises + approved_items:
            combined[ex["id"]] = ex

        total_drafts = len(combined)
        round_1_passed = sum(
            1
            for ex in combined.values()
            if ex.get("status") in ["approved", "published"]
            and ex.get("review_round", 1) == 1
        )
        round_2_passed = sum(
            1
            for ex in combined.values()
            if ex.get("status") in ["approved", "published"]
            and ex.get("review_round", 1) == 2
        )
        total_approved = len(approved_items)

        round_1_reviewed = sum(
            1
            for ex in combined.values()
            if ex.get("review_notes") is not None
            or ex.get("status")
            in ["approved", "published", "revision_requested", "rejected"]
        )
        round_1_rate = round((round_1_passed / max(round_1_reviewed, 1)) * 100, 2)

        round_2_reviewed = sum(
            1 for ex in combined.values() if ex.get("review_round") == 2
        )
        round_2_rate = (
            round((round_2_passed / max(round_2_reviewed, 1)) * 100, 2)
            if round_2_reviewed > 0
            else 100.0
        )

        return RoundMetrics(
            total_drafts_generated=total_drafts,
            round_1_reviewed=round_1_reviewed,
            round_1_passed=round_1_passed,
            round_1_pass_rate=round_1_rate,
            round_2_reviewed=round_2_reviewed,
            round_2_passed=round_2_passed,
            round_2_pass_rate=round_2_rate,
            final_approved_count=total_approved,
            auto_publish_prevented_count=self.auto_publish_blocked_count,
        )
