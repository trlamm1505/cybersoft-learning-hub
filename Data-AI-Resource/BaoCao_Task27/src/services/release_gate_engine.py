"""Chuyển hướng tương thích ngược cho release_gate_engine."""
from .qa_gate_service import (
    BypassRejectedError,
    QAGateService,
    qa_gate_service,
    release_gate_engine,
)

ReleaseGateEngine = QAGateService
__all__ = ["release_gate_engine", "ReleaseGateEngine", "BypassRejectedError"]
