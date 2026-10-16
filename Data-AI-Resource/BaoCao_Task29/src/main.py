"""Main FastAPI application for Task 29 Performance & Docker Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from .config import API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS, BASE_DIR
from .routes.health import router as health_router
from .routes.performance import router as performance_router

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(performance_router)

# Mount portal web static files
portal_dir = BASE_DIR / "portal"
if portal_dir.exists():
    app.mount("/portal", StaticFiles(directory=str(portal_dir), html=True), name="portal")


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root path to interactive Performance & Docker Monitoring Portal."""
    return RedirectResponse(url="/portal/")

