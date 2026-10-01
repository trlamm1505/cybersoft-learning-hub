"""FastAPI Main Application for CyberSoft Lineage & Versioning System v0.1."""

import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from src.config import config
from src.routes.changelog import router as changelog_router
from src.routes.health import router as health_router
from src.routes.lifecycle import router as lifecycle_router
from src.routes.lineage import router as lineage_router
from src.routes.releases import router as releases_router
from src.services.immutable_store import ArtifactNotFoundError, ImmutableArtifactError

app = FastAPI(
    title="CyberSoft Data & AI Lab - Lineage & Versioning Service",
    description="Hệ thống quản lý nguồn gốc dữ liệu (Data Lineage DAG), Cửa hàng bất biến (WORM Store), "
    "Bản đồ phát hành (Release Manifests) và Quy trình vòng đời tài nguyên v0.1.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time_ms = (time.perf_counter() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time_ms:.2f}"
    return response


# Exception Handlers: Uniform Error Envelope
@app.exception_handler(ImmutableArtifactError)
async def immutable_artifact_exception_handler(
    request: Request, exc: ImmutableArtifactError
):
    return JSONResponse(
        status_code=409,
        content={
            "success": False,
            "error": {
                "code": "IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED",
                "message": str(exc),
                "details": {"artifact_id": exc.artifact_id, "path": exc.path},
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    )


@app.exception_handler(ArtifactNotFoundError)
async def artifact_not_found_exception_handler(
    request: Request, exc: ArtifactNotFoundError
):
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": {
                "code": "ARTIFACT_NOT_FOUND",
                "message": str(exc),
                "details": {"artifact_id": exc.artifact_id},
            },
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        },
    )


# Include Routers
app.include_router(health_router)
app.include_router(lineage_router, prefix="/api/v1")
app.include_router(releases_router, prefix="/api/v1")
app.include_router(changelog_router, prefix="/api/v1")
app.include_router(lifecycle_router, prefix="/api/v1")

# Mount Portal Web UI
if config.portal_dir.exists():
    app.mount(
        "/portal",
        StaticFiles(directory=str(config.portal_dir), html=True),
        name="portal",
    )


@app.get("/", include_in_schema=False)
def root_redirect():
    return RedirectResponse(url="/portal/")
