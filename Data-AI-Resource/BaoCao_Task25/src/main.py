"""Main FastAPI application entry point for CyberSoft Security & Privacy Guard (Task 25)."""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
import time

from src.config import PORTAL_DIR
from src.routes.health import router as health_router
from src.routes.security import router as security_router

app = FastAPI(
    title="CyberSoft Security & Privacy Guard API",
    description="Hệ thống kiểm thử bảo mật, che giấu dữ liệu riêng tư (PII), phòng vệ Prompt Injection, Path Traversal và Security Quality Gate v0.1",
    version="v1.0.0",
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
async def security_headers_middleware(request: Request, call_next):
    """Enforces essential HTTP security headers on all responses."""
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"
    return response


# Uniform Error Envelope Handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Formats all HTTPExceptions into CyberSoft Uniform Error Envelope."""
    detail = exc.detail
    if isinstance(detail, dict):
        error_code = detail.get("error_code", "HTTP_ERROR")
        message = detail.get("message", "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.")
        extra = detail
    else:
        error_code = f"HTTP_{exc.status_code}"
        message = str(detail)
        extra = {}

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "status_code": exc.status_code,
                "path": str(request.url.path),
                "details": extra,
            },
        },
    )


# Include API Routers
app.include_router(health_router)
app.include_router(security_router)

# Mount Portal SPA if directory exists
if PORTAL_DIR.exists():
    app.mount(
        "/portal", StaticFiles(directory=str(PORTAL_DIR), html=True), name="portal"
    )


@app.get("/", include_in_schema=False)
def root_redirect():
    """Redirect root path to interactive Portal SPA."""
    return RedirectResponse(url="/portal/")
