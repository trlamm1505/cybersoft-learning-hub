"""Điểm kiểm tra sức khỏe container (trỏ tới performance.py)."""
from .performance import health_router as router

__all__ = ["router"]
