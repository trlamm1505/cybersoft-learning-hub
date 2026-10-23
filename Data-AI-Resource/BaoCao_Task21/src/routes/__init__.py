"""Export all routers for CyberSoft API v1."""

from .health import router as health_router
from .quality import router as quality_router
from .registry import router as registry_router
from .search import router as search_router
from .tutor import router as tutor_router

__all__ = [
    "health_router",
    "registry_router",
    "search_router",
    "tutor_router",
    "quality_router",
]
