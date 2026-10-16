"""Điểm khởi chạy ứng dụng FastAPI cho Task 26 - Learning Platform Integrator.

File này làm gì:
- Khởi tạo ứng dụng FastAPI, cấu hình CORS và gắn route tích hợp API Contract.

Nhận vào:
- Các cấu hình từ config.py và router tích hợp.

Trả ra:
- Phiên bản ứng dụng API FastAPI sẵn sàng phục vụ các request tích hợp liên sản phẩm.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from .config import SERVICE_NAME, VERSION
from .routes.integration import router as integration_router
from .schemas.integration import ErrorDetail, RegistryEnvelope

app = FastAPI(
    title=f"CyberSoft {SERVICE_NAME}",
    version=VERSION,
    description="Cross-Product Integration API kết nối Data & AI Lab với Learning Platform.",
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

# Gắn route tích hợp duy nhất (đã bao gồm health check)
app.include_router(integration_router)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Chuyển hướng trang chủ về tài liệu hợp đồng tích hợp Swagger UI."""
    return RedirectResponse(url="/docs")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Bắt ngoại lệ toàn cục và trả về phong bì RegistryEnvelope chuẩn."""
    return JSONResponse(
        status_code=500,
        content=RegistryEnvelope(
            success=False,
            error=ErrorDetail(
                code="INTERNAL_SERVER_ERROR",
                message=str(exc),
                suggested_action="Vui lòng kiểm tra lại log hệ thống hoặc liên hệ Data Engineering.",
            ),
        ).model_dump(),
    )
