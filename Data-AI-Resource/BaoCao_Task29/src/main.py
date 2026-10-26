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

# Mount unified portal web static files
portal_dir = BASE_DIR / "portal"
if portal_dir.exists():
    app.mount(
        "/portal", StaticFiles(directory=str(portal_dir), html=True), name="portal"
    )


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root path to interactive Unified Portal."""
    return RedirectResponse(url="/portal/")


@app.get("/datasets", include_in_schema=False)
@app.get("/datasets/", include_in_schema=False)
def redirect_datasets():
    """Redirect legacy datasets route to Tab 1 (Kho 3NF)."""
    return RedirectResponse(url="/portal/#tab-catalog")


@app.get("/search", include_in_schema=False)
@app.get("/search/", include_in_schema=False)
def redirect_search():
    """Redirect legacy search route to Tab 2 (Hybrid RAG)."""
    return RedirectResponse(url="/portal/#tab-caching")


@app.get("/generator", include_in_schema=False)
@app.get("/generator/", include_in_schema=False)
def redirect_generator():
    """Redirect legacy generator route to Tab 3 (Bloom Exercise)."""
    return RedirectResponse(url="/portal/#tab-bloom-worm")


@app.get("/lineage", include_in_schema=False)
@app.get("/lineage/", include_in_schema=False)
def redirect_lineage():
    """Redirect legacy lineage route to Tab 3 (Lineage WORM)."""
    return RedirectResponse(url="/portal/#tab-bloom-worm")


@app.get("/security", include_in_schema=False)
@app.get("/security/", include_in_schema=False)
def redirect_security():
    """Redirect legacy security route to Tab 4 (Security QA)."""
    return RedirectResponse(url="/portal/#tab-security-qa")


@app.get("/ops", include_in_schema=False)
@app.get("/ops/", include_in_schema=False)
def redirect_ops():
    """Redirect ops route to Tab 5 (Docker Ops)."""
    return RedirectResponse(url="/portal/#tab-docker")
