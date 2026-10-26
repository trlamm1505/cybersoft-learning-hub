"""RESTful API routes for AI Exercise Generator, Review Gatekeeper, and Metrics (Task 23)."""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Query, status

from src.schemas.common import ErrorEnvelope, ErrorPayload, SuccessEnvelope
from src.schemas.exercise import (
    ExerciseGenerateRequest,
)
from src.schemas.review import (
    FeasibilityTestResult,
    ReviewSubmissionRequest,
    RoundMetrics,
)
from src.services.feasibility_executor import FeasibilityExecutorService
from src.services.generator_engine import GeneratorEngineService
from src.services.review_gatekeeper import ReviewGatekeeperService
from src.services.schema_reader import SchemaReaderService

router = APIRouter(prefix="/api/v1/generator", tags=["Exercise Generator & Review"])

# Singletons shared within process
_schema_reader = SchemaReaderService()
_feasibility_executor = FeasibilityExecutorService()
_engine = GeneratorEngineService(
    schema_reader=_schema_reader, feasibility_executor=_feasibility_executor
)
_gatekeeper = ReviewGatekeeperService(engine=_engine)


def get_engine() -> GeneratorEngineService:
    return _engine


def get_gatekeeper() -> ReviewGatekeeperService:
    return _gatekeeper


def get_schema_reader() -> SchemaReaderService:
    return _schema_reader


def get_feasibility_executor() -> FeasibilityExecutorService:
    return _feasibility_executor


@router.get("/datasets", response_model=SuccessEnvelope[list[dict[str, Any]]])
def list_datasets(reader: SchemaReaderService = Depends(get_schema_reader)):
    """List available datasets and their extracted schemas."""
    dataset_ids = reader.list_available_datasets()
    schemas = []
    for d_id in dataset_ids:
        try:
            meta = reader.read_dataset_schema(d_id)
            schemas.append(meta.to_dict())
        except Exception:
            continue
    return SuccessEnvelope(success=True, data=schemas)


@router.post("/generate", response_model=SuccessEnvelope[list[dict[str, Any]]])
def generate_exercises(
    req: ExerciseGenerateRequest,
    engine: GeneratorEngineService = Depends(get_engine),
):
    """Generate controlled exercise drafts adhering to Project Schema."""
    drafts = []
    for _ in range(req.count):
        draft = engine.generate_draft(
            dataset_id=req.dataset_id,
            bloom_level=req.bloom_level,
            difficulty=req.difficulty,
            exercise_type=req.exercise_type,
        )
        drafts.append(draft.model_dump())

    return SuccessEnvelope(
        success=True,
        data=drafts,
        meta={"count": len(drafts), "status": "draft_pending_review"},
    )


@router.get("/exercises", response_model=SuccessEnvelope[list[dict[str, Any]]])
def list_exercises(
    dataset_id: str | None = Query(None, description="Lọc theo dataset"),
    bloom_level: str | None = Query(None, description="Lọc theo cấp độ Bloom"),
    difficulty: str | None = Query(None, description="Lọc theo độ khó"),
    status: str | None = Query(
        None,
        description="Lọc theo trạng thái (draft_pending_review, approved, published)",
    ),
    keyword: str | None = Query(
        None, description="Tìm kiếm từ khóa trong tiêu đề/mô tả"
    ),
    engine: GeneratorEngineService = Depends(get_engine),
):
    """Query exercises across draft and approved banks with multi-criteria filtering."""
    combined: dict[str, dict[str, Any]] = {}
    # Load all approved and drafts
    for ex in list(engine.approved.values()) + list(engine.drafts.values()):
        combined[ex["id"]] = ex

    items = list(combined.values())

    if dataset_id:
        items = [i for i in items if i.get("dataset_id") == dataset_id]
    if bloom_level:
        items = [i for i in items if i.get("bloom_level") == bloom_level]
    if difficulty:
        items = [i for i in items if i.get("difficulty") == difficulty]
    if status:
        items = [i for i in items if i.get("status") == status]
    if keyword:
        kw = keyword.lower()
        items = [
            i
            for i in items
            if kw in i.get("title", "").lower()
            or kw in i.get("description", "").lower()
        ]

    # Sort: drafts first, then newest
    items.sort(key=lambda x: (x.get("status") != "draft_pending_review", x.get("id")))

    return SuccessEnvelope(
        success=True,
        data=items,
        meta={"total": len(items)},
    )


@router.get("/exercises/{exercise_id}", response_model=SuccessEnvelope[dict[str, Any]])
def get_exercise_detail(
    exercise_id: str,
    engine: GeneratorEngineService = Depends(get_engine),
):
    """Retrieve full exercise specification."""
    ex = engine.drafts.get(exercise_id) or engine.approved.get(exercise_id)
    if not ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorEnvelope(
                success=False,
                error=ErrorPayload(
                    code="EXERCISE_NOT_FOUND",
                    message=f"Không tìm thấy bài tập với mã '{exercise_id}'",
                    request_id=f"req-detail-{exercise_id}",
                ),
            ).model_dump(),
        )
    return SuccessEnvelope(success=True, data=ex)


@router.post(
    "/exercises/{exercise_id}/test",
    response_model=SuccessEnvelope[FeasibilityTestResult],
)
def test_exercise_feasibility(
    exercise_id: str,
    engine: GeneratorEngineService = Depends(get_engine),
    executor: FeasibilityExecutorService = Depends(get_feasibility_executor),
):
    """Run feasibility test by executing solution code against real dataset."""
    ex = engine.drafts.get(exercise_id) or engine.approved.get(exercise_id)
    if not ex:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ErrorEnvelope(
                success=False,
                error=ErrorPayload(
                    code="EXERCISE_NOT_FOUND",
                    message=f"Không tìm thấy bài tập với mã '{exercise_id}'",
                    request_id=f"req-test-{exercise_id}",
                ),
            ).model_dump(),
        )

    res = executor.execute_and_verify(
        exercise_id=exercise_id,
        dataset_id=ex["dataset_id"],
        solution_code=ex["solution_code"],
        test_cases=ex["test_cases"],
    )

    # Update feasibility flag
    ex["is_feasible"] = res.is_feasible
    engine._save_stores()

    return SuccessEnvelope(success=True, data=res)


@router.post(
    "/exercises/{exercise_id}/review", response_model=SuccessEnvelope[dict[str, Any]]
)
def review_exercise(
    exercise_id: str,
    req: ReviewSubmissionRequest,
    gatekeeper: ReviewGatekeeperService = Depends(get_gatekeeper),
):
    """Submit human review decision (approve, request_revision, reject, publish)."""
    updated = gatekeeper.submit_review(exercise_id, req)
    return SuccessEnvelope(
        success=True,
        data=updated,
        meta={"action": req.action, "reviewer_id": req.reviewer_id},
    )


@router.post(
    "/exercises/{exercise_id}/publish", response_model=SuccessEnvelope[dict[str, Any]]
)
def publish_exercise(
    exercise_id: str,
    gatekeeper: ReviewGatekeeperService = Depends(get_gatekeeper),
):
    """Strictly publish an approved exercise. Throws 403 Forbidden if not approved (DoD)."""
    gatekeeper.enforce_no_auto_publish(exercise_id)
    req = ReviewSubmissionRequest(
        action="publish",
        reviewer_id="system_gatekeeper",
        notes="Xuất bản chính thức sau khi hoàn tất kiểm duyệt con người.",
    )
    res = gatekeeper.submit_review(exercise_id, req)
    return SuccessEnvelope(success=True, data=res)


@router.get("/metrics", response_model=SuccessEnvelope[RoundMetrics])
def get_metrics(gatekeeper: ReviewGatekeeperService = Depends(get_gatekeeper)):
    """Retrieve calibration and review pass rate metrics for DoD audit."""
    metrics = gatekeeper.calculate_metrics()
    return SuccessEnvelope(success=True, data=metrics)
