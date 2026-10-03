"""Unit tests for Exercise Schema compliance and DoD constraints (Task 23)."""

import pytest
from pydantic import ValidationError
from src.schemas.exercise import ExerciseDraft, TestCase


def test_valid_exercise_draft():
    """Verify that a properly structured draft passes validation."""
    draft = ExerciseDraft(
        id="EX-TEST-01",
        dataset_id="retail_sales_v1",
        title="Bài tập kiểm thử chuẩn",
        description="Đề bài kiểm tra câu lệnh SELECT cơ bản trong bán hàng.",
        bloom_level="Remember",
        difficulty="Beginner",
        exercise_type="SQL",
        learning_outcomes=["Học viên nắm vững cú pháp SELECT."],
        schema_dependencies=["order_id", "status"],
        solution_code="SELECT order_id FROM retail_sales_v1;",
        test_cases=[
            TestCase(
                id="TC-01",
                description="Kiểm tra kết quả",
                expected_output=10,
                assertion_type="row_count",
            )
        ],
    )
    assert draft.id == "EX-TEST-01"
    assert draft.status == "draft_pending_review"  # DoD: Must default to draft
    assert len(draft.learning_outcomes) >= 1
    assert len(draft.test_cases) >= 1


def test_missing_learning_outcomes_fails():
    """Verify DoD constraint: Every exercise MUST have >= 1 learning outcome."""
    with pytest.raises(ValidationError):
        ExerciseDraft(
            id="EX-FAIL-01",
            dataset_id="retail_sales_v1",
            title="Bài tập thiếu outcome",
            description="Đề bài không có chuẩn đầu ra sư phạm.",
            bloom_level="Remember",
            difficulty="Beginner",
            exercise_type="SQL",
            learning_outcomes=[],  # Violates DoD!
            solution_code="SELECT * FROM retail_sales_v1;",
            test_cases=[
                TestCase(
                    id="TC-01",
                    description="Test",
                    expected_output=1,
                    assertion_type="row_count",
                )
            ],
        )


def test_missing_test_cases_fails():
    """Verify DoD constraint: Every exercise MUST have >= 1 test case."""
    with pytest.raises(ValidationError):
        ExerciseDraft(
            id="EX-FAIL-02",
            dataset_id="retail_sales_v1",
            title="Bài tập thiếu test case",
            description="Đề bài không có test case kiểm chứng khả thi.",
            bloom_level="Remember",
            difficulty="Beginner",
            exercise_type="SQL",
            learning_outcomes=["Có chuẩn đầu ra."],
            solution_code="SELECT * FROM retail_sales_v1;",
            test_cases=[],  # Violates DoD!
        )
