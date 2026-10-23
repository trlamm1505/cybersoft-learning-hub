"""Routes package initialization."""

from .generator import router as generator_router
from .health import router as health_router

__all__ = ["generator_router", "health_router"]
