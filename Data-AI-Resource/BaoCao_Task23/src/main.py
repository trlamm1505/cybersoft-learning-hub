"""Main FastAPI application for CyberSoft AI Exercise Generator v0.1 (Task 23)."""

import time
import uuid
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from src.config import PORTAL_STATIC_DIR
from src.routes.generator import router as generator_router
from src.routes.health import router as health_router
from src.schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload

app = FastAPI(
    title="CyberSoft AI Exercise Generator v0.1",
    description="Hệ thống AI gợi ý bài tập theo dataset có kiểm soát chất lượng, hiệu chuẩn Bloom, kiểm tra trùng lặp và Human-in-the-loop Gatekeeper.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Execution-Time-MS"],
)


@app.middleware("http")
async def add_timing_and_request_id(request: Request, call_next):
    """Add unique Request-ID and execution time headers."""
    request_id = request.headers.get("X-Request-ID", f"req-{uuid.uuid4().hex[:8]}")
    start_time = time.perf_counter()

    response = await call_next(request)

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Execution-Time-MS"] = str(elapsed_ms)
    return response


# Global Exception Handlers for Uniform Error Envelope
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format validation errors into Uniform Error Envelope."""
    details = [
        ErrorDetail(
            field=".".join([str(loc) for loc in err["loc"] if loc != "body"]),
            issue=err["msg"],
        )
        for err in exc.errors()
    ]
    payload = ErrorEnvelope(
        success=False,
        error=ErrorPayload(
            code="VALIDATION_ERROR",
            message="Dữ liệu đầu vào không hợp lệ theo Project Schema contract.",
            details=details,
            request_id=request.headers.get(
                "X-Request-ID", f"req-{uuid.uuid4().hex[:8]}"
            ),
        ),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload.model_dump()
    )


# Mount API routers
app.include_router(health_router)
app.include_router(generator_router)

# Mount Portal SPA if directory exists
if PORTAL_STATIC_DIR.exists():
    app.mount(
        "/portal",
        StaticFiles(directory=str(PORTAL_STATIC_DIR), html=True),
        name="portal",
    )


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root to /portal/."""
    return RedirectResponse(url="/portal/")
