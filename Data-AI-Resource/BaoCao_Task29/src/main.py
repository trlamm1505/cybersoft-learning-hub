"""Main FastAPI application for Task 29 Performance & Docker Service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS, BASE_DIR
from .routes.health import router as health_router
from .routes.performance import router as performance_router

app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    docs_url="/docs",
    redoc_url="/redoc",
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

# Mount dedicated task web portals
task22_portal = BASE_DIR.parent / "BaoCao_Task22" / "portal"
if task22_portal.exists():
    app.mount(
        "/datasets",
        StaticFiles(directory=str(task22_portal), html=True),
        name="portal_datasets",
    )

task23_portal = BASE_DIR.parent / "BaoCao_Task23" / "portal"
if task23_portal.exists():
    app.mount(
        "/generator",
        StaticFiles(directory=str(task23_portal), html=True),
        name="portal_generator",
    )

task24_portal = BASE_DIR.parent / "BaoCao_Task24" / "portal"
if task24_portal.exists():
    app.mount(
        "/lineage",
        StaticFiles(directory=str(task24_portal), html=True),
        name="portal_lineage",
    )

task25_portal = BASE_DIR.parent / "BaoCao_Task25" / "portal"
if task25_portal.exists():
    app.mount(
        "/security",
        StaticFiles(directory=str(task25_portal), html=True),
        name="portal_security",
    )

task19_ui = BASE_DIR.parent / "BaoCao_Task19" / "ui"
if task19_ui.exists():
    app.mount(
        "/search",
        StaticFiles(directory=str(task19_ui), html=True),
        name="portal_search",
    )

# Mount unified portal web static files
portal_dir = BASE_DIR / "portal"
if portal_dir.exists():
    app.mount(
        "/portal", StaticFiles(directory=str(portal_dir), html=True), name="portal"
    )


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root path to interactive Performance & Docker Monitoring Portal."""
    return RedirectResponse(url="/portal/")
