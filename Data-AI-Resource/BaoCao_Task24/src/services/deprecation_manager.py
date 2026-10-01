"""Deprecation and Lifecycle State Machine Service.

Enforces:
1. Valid lifecycle state transitions:
   - DRAFT -> ACTIVE
   - ACTIVE -> DEPRECATED
   - DEPRECATED -> RETIRED
   - ACTIVE -> RETIRED (direct retirement if critical security issue)
2. Impact analysis on downstream lineage dependents.
3. Recording sunset dates, reasons, and recommended replacements.
"""

from typing import Optional
from src.schemas.artifact import LifecycleState
from src.schemas.lifecycle import DeprecateRequest, DeprecateResponse
from src.services.immutable_store import ImmutableStore, immutable_store
from src.services.lineage_engine import LineageEngine, lineage_engine


class InvalidStateTransitionError(Exception):
    def __init__(
        self, artifact_id: str, from_state: LifecycleState, to_state: LifecycleState
    ):
        super().__init__(
            f"Invalid lifecycle transition for '{artifact_id}': cannot move from '{from_state.value}' to '{to_state.value}'."
        )


class DeprecationManager:
    def __init__(
        self,
        store: Optional[ImmutableStore] = None,
        engine: Optional[LineageEngine] = None,
    ):
        self.store = store or immutable_store
        self.engine = engine or lineage_engine

    VALID_TRANSITIONS = {
        LifecycleState.DRAFT: {LifecycleState.ACTIVE},
        LifecycleState.ACTIVE: {LifecycleState.DEPRECATED, LifecycleState.RETIRED},
        LifecycleState.DEPRECATED: {LifecycleState.RETIRED, LifecycleState.ACTIVE},
        LifecycleState.RETIRED: set(),  # Terminal state
    }

    def deprecate_artifact(self, req: DeprecateRequest) -> DeprecateResponse:
        """Transitions an artifact from ACTIVE to DEPRECATED with lineage impact warnings."""
        meta = self.store.get_artifact_metadata(req.artifact_id)
        current_state = meta.state

        if LifecycleState.DEPRECATED not in self.VALID_TRANSITIONS.get(
            current_state, set()
        ):
            raise InvalidStateTransitionError(
                req.artifact_id, current_state, LifecycleState.DEPRECATED
            )

        # Update metadata state
        self.store.update_lifecycle_state(
            artifact_id=req.artifact_id,
            new_state=LifecycleState.DEPRECATED,
            deprecation_reason=req.reason,
            superseded_by=req.superseded_by,
            sunset_date=req.sunset_date,
        )

        # Lineage impact: find all downstream dependents
        dag = self.engine.build_dag()
        downstream_ids = []
        if req.artifact_id in dag.nodes:
            downstream_ids = dag.nodes[req.artifact_id].downstream_ids

        warning_msg = (
            f"CẢNH BÁO: Tài nguyên '{req.artifact_id}' đã chuyển sang trạng thái DEPRECATED. "
            f"Lý do: {req.reason}. "
            f"Có {len(downstream_ids)} tài nguyên phụ thuộc hạ nguồn cần chuyển đổi sang "
            f"phiên bản thay thế '{req.superseded_by or 'N/A'}' trước ngày hết hạn '{req.sunset_date or 'N/A'}'."
        )

        return DeprecateResponse(
            artifact_id=req.artifact_id,
            previous_state=current_state,
            new_state=LifecycleState.DEPRECATED,
            reason=req.reason,
            superseded_by=req.superseded_by,
            sunset_date=req.sunset_date,
            affected_downstream_ids=downstream_ids,
            warning_message=warning_msg,
        )


deprecation_manager = DeprecationManager()
