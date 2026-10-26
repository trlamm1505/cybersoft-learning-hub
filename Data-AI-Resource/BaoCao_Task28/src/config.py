"""Configuration for Task 28 Usability & Issue Resolution Service."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

API_TITLE = "CyberSoft Data & AI Lab — Usability & User Testing Service (Task 28)"
API_VERSION = "1.0.0"
API_DESCRIPTION = (
    "Phân hệ đo lường trải nghiệm người dùng thử, đánh giá chỉ số SUS, "
    "quản lý danh mục vấn đề (Issue Backlog) và kiểm chứng 5 bản vá ưu tiên."
)

import os

PORT = 8028
HOST = os.getenv("HOST", "127.0.0.1")
CORS_ORIGINS = ["*"]
