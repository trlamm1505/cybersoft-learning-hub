"""Chuyển hướng tương thích ngược cho qa_hook_service."""
from .qa_gate_service import QAGateService, qa_gate_service, qa_hook_service

QAHookService = QAGateService
__all__ = ["qa_hook_service", "QAHookService"]
