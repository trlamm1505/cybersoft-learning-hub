"""Routes package initialization."""

from .health import router as health_router
from .security import router as security_router

__all__ = ["health_router", "security_router"]
