"""Điểm khởi chạy ứng dụng FastAPI cho Task 28 - Usability Testing & Issue Tracking.

File này làm gì:
- Khởi tạo ứng dụng FastAPI, cấu hình CORS, gắn route đo lường trải nghiệm và 5 bản vá ưu tiên.

Nhận vào:
- Cấu hình từ config.py và router usability.

Trả ra:
- Phiên bản ứng dụng API FastAPI phục vụ các báo cáo SUS, Backlog và 5 bản vá ưu tiên.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from .config import API_DESCRIPTION, API_TITLE, API_VERSION, CORS_ORIGINS
from .routes.usability import router as usability_router

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

# Gắn router duy nhất (đã bao gồm health check)
app.include_router(usability_router)


@app.get("/", include_in_schema=False)
def root_redirect():
    """Chuyển hướng trang chủ về tài liệu Swagger API (/docs)."""
    return RedirectResponse(url="/docs")
