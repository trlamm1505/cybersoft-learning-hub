"""Routes package initialization."""

from .health import router as health_router
from .portal import router as portal_router

__all__ = ["health_router", "portal_router"]
