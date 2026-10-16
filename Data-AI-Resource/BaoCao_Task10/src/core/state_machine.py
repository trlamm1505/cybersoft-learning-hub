"""CyberSoft Dataset Registry - State Machine.

Governs state transitions for dataset versions:
    DRAFT -> UNDER_REVIEW -> PUBLISHED
                          -> REJECTED -> DRAFT

Enforces immutability for PUBLISHED versions and prevents unvetted publishing.
"""

from __future__ import annotations

from typing import Set, Tuple
from .models import DatasetState, QualityGateResult


class InvalidStateTransitionError(Exception):
    """Raised when an illegal lifecycle transition is requested."""

    pass


class QualityGateFailedError(Exception):
    """Raised when a dataset fails the automated quality gate criteria."""

    pass


class DatasetStateMachine:
    """Finite State Machine enforcing data governance and release gates."""

    ALLOWED_TRANSITIONS: Set[Tuple[DatasetState, DatasetState]] = {
        (DatasetState.DRAFT, DatasetState.UNDER_REVIEW),
        (DatasetState.UNDER_REVIEW, DatasetState.PUBLISHED),
        (DatasetState.UNDER_REVIEW, DatasetState.REJECTED),
        (DatasetState.REJECTED, DatasetState.DRAFT),
    }

    PUBLISH_SCORE_THRESHOLD: float = 95.0

    @classmethod
    def can_transition(cls, current: DatasetState, target: DatasetState) -> bool:
        """Checks if a transition between two states is structurally allowed."""
        return (current, target) in cls.ALLOWED_TRANSITIONS

    @classmethod
    def transition(
        cls,
        current: DatasetState,
        target: DatasetState,
        quality_gate: QualityGateResult | None = None,
    ) -> DatasetState:
        """Executes a validated state transition.

        Args:
            current: Current lifecycle state.
            target: Desired target state.
            quality_gate: Evaluation results (mandatory when targeting PUBLISHED).

        Returns:
            The new DatasetState.

        Raises:
            InvalidStateTransitionError: If the transition is prohibited or published state is mutated.
            QualityGateFailedError: If target is PUBLISHED but quality gate failed or threshold not met.
        """
        if current == DatasetState.PUBLISHED:
            raise InvalidStateTransitionError(
                "PUBLISHED datasets are immutable. You must register a new version to modify data."
            )

        if not cls.can_transition(current, target):
            raise InvalidStateTransitionError(
                f"Illegal state transition from '{current.value}' to '{target.value}'."
            )

        if target == DatasetState.PUBLISHED:
            if quality_gate is None:
                raise QualityGateFailedError(
                    "Cannot publish dataset without an automated Quality Gate evaluation report."
                )
            if (
                not quality_gate.passed
                or quality_gate.score < cls.PUBLISH_SCORE_THRESHOLD
            ):
                violations_str = (
                    "; ".join(quality_gate.violations)
                    if quality_gate.violations
                    else "Score below threshold"
                )
                raise QualityGateFailedError(
                    f"Quality Gate FAILED (Score: {quality_gate.score:.1f}% < {cls.PUBLISH_SCORE_THRESHOLD}%). "
                    f"Blocking violations: {violations_str}"
                )
            if not quality_gate.schema_valid:
                raise QualityGateFailedError(
                    "Dataset metadata violates JSON Schema standard (dataset.schema.json)."
                )

        return target
