"""Main FastAPI application for CyberSoft Data & AI Lab Integration Service."""

import time
import uuid
from datetime import datetime

import yaml
from fastapi import FastAPI, HTTPException, Request, Response, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from .config import (
    API_DESCRIPTION,
    API_TITLE,
    API_VERSION,
    CORS_ORIGINS,
)
from .routes import (
    health_router,
    quality_router,
    registry_router,
    search_router,
    tutor_router,
)
from .schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload

# OpenAPI Tag metadata
OPENAPI_TAGS = [
    {
        "name": "Health & Metadata",
        "description": "Endpoints kiểm tra sức khỏe hệ thống, uptime và thông tin hợp đồng OpenAPI.",
    },
    {
        "name": "Dataset Registry & Projects",
        "description": "Quản lý danh mục bộ dữ liệu (Datasets) và ngân hàng đề án học viên (Project Bank).",
    },
    {
        "name": "Semantic Search & Retrieval",
        "description": "Tìm kiếm ngữ nghĩa và tìm kiếm lai (Hybrid Search BM25 + Vector Dense RRF) trên học liệu.",
    },
    {
        "name": "AI Tutor & RAG Engine",
        "description": "Hỏi đáp Trợ giảng AI có trích nguồn xác thực và vành đai bảo vệ Guardrails.",
    },
    {
        "name": "Data Quality & QA Metrics",
        "description": "Cổng kiểm định chất lượng dữ liệu và trích xuất chỉ số RAG Eval cho Dashboard hợp nhất của TTS 03.",
    },
]

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    openapi_tags=OPENAPI_TAGS,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_middleware(request: Request, call_next):
    """Inject Request-ID and calculate execution time."""
    request_id = request.headers.get("X-Request-ID") or f"req-{uuid.uuid4().hex[:8]}"
    request.state.request_id = request_id

    start_time = time.perf_counter()
    response: Response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.2f}"
    return response


# Standardized Exception Handlers enforcing Uniform Error Envelope
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")

    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", "HTTP_ERROR")
        message = exc.detail.get(
            "message", "Đã xảy ra lỗi trong quá trình xử lý yêu cầu"
        )
        raw_details = exc.detail.get("details", [])
        details = [
            ErrorDetail(field=d.get("field"), issue=d.get("issue", ""))
            if isinstance(d, dict)
            else ErrorDetail(field=None, issue=str(d))
            for d in raw_details
        ]
    else:
        code = f"HTTP_{exc.status_code}"
        message = str(exc.detail)
        details = []

    envelope = ErrorEnvelope(
        success=False,
        error=ErrorPayload(
            code=code,
            message=message,
            details=details,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
        ),
    )
    return JSONResponse(status_code=exc.status_code, content=envelope.model_dump())


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    details = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        details.append(ErrorDetail(field=field_path, issue=msg))

    envelope = ErrorEnvelope(
        success=False,
        error=ErrorPayload(
            code="VALIDATION_ERROR",
            message="Dữ liệu đầu vào của yêu cầu không hợp lệ theo lược đồ Pydantic",
            details=details,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
        ),
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=envelope.model_dump()
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", f"req-{uuid.uuid4().hex[:8]}")
    envelope = ErrorEnvelope(
        success=False,
        error=ErrorPayload(
            code="INTERNAL_SERVER_ERROR",
            message="Lỗi hệ thống nội bộ không mong muốn. Vui lòng liên hệ quản trị viên kèm request_id để xử lý.",
            details=[ErrorDetail(field=None, issue=str(exc))],
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat() + "Z",
        ),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=envelope.model_dump()
    )


# Include Routers under /api/v1
app.include_router(health_router, prefix="/api/v1")
app.include_router(registry_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(tutor_router, prefix="/api/v1")
app.include_router(quality_router, prefix="/api/v1")


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root path to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")


@app.get("/api/v1/openapi.yaml", include_in_schema=False)
def get_openapi_yaml():
    """Endpoint serving OpenAPI specification in YAML format."""
    openapi_json = app.openapi()
    yaml_content = yaml.dump(openapi_json, allow_unicode=True, sort_keys=False)
    return Response(content=yaml_content, media_type="application/x-yaml")
