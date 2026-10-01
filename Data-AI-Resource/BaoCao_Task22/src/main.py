"""Main FastAPI Application for CyberSoft Data Resource Portal v0.1 (Task 22)."""

import time
import uuid
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

from .config import PORTAL_STATIC_DIR, SERVICE_VERSION
from .routes.health import router as health_router
from .routes.portal import router as portal_router
from .schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload

app = FastAPI(
    title="CyberSoft Data & AI Lab — Resource Portal API",
    version=SERVICE_VERSION,
    description="Cổng giao diện tìm kiếm, xem trước lược đồ, kiểm soát tải và đánh giá độ hữu ích tài nguyên dữ liệu giáo dục.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_observability_headers(request: Request, call_next):
    """Gắn mã định danh request duy nhất và đo thời gian xử lý."""
    request_id = request.headers.get("X-Request-ID", f"req-{uuid.uuid4().hex[:8]}")
    request.state.request_id = request_id
    start_time = time.perf_counter()

    response = await call_next(request)

    process_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = str(process_time_ms)
    return response


# Uniform Error Handlers
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """Bọc toàn bộ HTTPException trong Uniform Error Envelope."""
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")

    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    code_map = {
        400: "BAD_REQUEST",
        401: "AUTH_REQUIRED",
        403: "FORBIDDEN_ACCESS",
        404: "NOT_FOUND",
        422: "VALIDATION_ERROR",
        500: "INTERNAL_SERVER_ERROR",
    }
    error_code = code_map.get(exc.status_code, "ERROR")

    payload = ErrorEnvelope(
        success=False,
        error=ErrorPayload(
            code=error_code,
            message=str(exc.detail),
            details=[ErrorDetail(issue=str(exc.detail))],
            request_id=request_id,
        ),
    )
    return JSONResponse(status_code=exc.status_code, content=payload.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Bọc lỗi validate Pydantic trong Uniform Error Envelope."""
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    details = [
        ErrorDetail(
            field=" -> ".join(str(loc) for loc in err.get("loc", [])),
            issue=err.get("msg", "Validation error"),
        )
        for err in exc.errors()
    ]
    payload = ErrorEnvelope(
        success=False,
        error=ErrorPayload(
            code="VALIDATION_ERROR",
            message="Dữ liệu gửi lên không đúng định dạng schema yêu cầu",
            details=details,
            request_id=request_id,
        ),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=payload.model_dump()
    )


# Register API Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(portal_router, prefix="/api/v1")


# Serve Web Portal Static Files & Redirect Root
if PORTAL_STATIC_DIR.exists():
    app.mount(
        "/portal",
        StaticFiles(directory=str(PORTAL_STATIC_DIR), html=True),
        name="portal",
    )


@app.get("/", include_in_schema=False)
async def root_redirect():
    """Chuyển hướng trang chủ sang giao diện Web Portal."""
    return RedirectResponse(url="/portal/")
