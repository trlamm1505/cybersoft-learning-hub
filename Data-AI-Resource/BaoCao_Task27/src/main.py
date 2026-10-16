"""Điểm khởi chạy ứng dụng FastAPI cho Task 27 - Master QA Quality Gate Engine.

File này làm gì:
- Khởi tạo ứng dụng FastAPI, cấu hình CORS và gắn route kiểm định chất lượng QA.

Nhận vào:
- Cấu hình từ config.py và router kiểm định chất lượng.

Trả ra:
- Phiên bản ứng dụng API FastAPI phục vụ các hook kiểm định chất lượng tự động.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from .config import SERVICE_NAME, VERSION
from .routes.qa_gate import router as qa_gate_router
from .schemas.qa_gate import ErrorDetail, RegistryEnvelope

app = FastAPI(
    title=f"CyberSoft {SERVICE_NAME}",
    version=VERSION,
    description="Cross-Product Quality Gate and QA Harness Integration Service.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn route kiểm định chất lượng tích hợp (đã gồm health check)
app.include_router(qa_gate_router)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Chuyển hướng trang chủ về tài liệu API kiểm định chất lượng Swagger UI."""
    return RedirectResponse(url="/docs")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Bắt ngoại lệ toàn cục và trả về phong bì chuẩn."""
    return JSONResponse(
        status_code=500,
        content=RegistryEnvelope(
            success=False,
            error=ErrorDetail(
                code="INTERNAL_SERVER_ERROR",
                message=str(exc),
                suggested_action="Vui lòng kiểm tra lại log kiểm định QA hoặc liên hệ phụ trách chất lượng.",
            ),
        ).model_dump(),
    )
