"""Configuration for Task 30 Final Handover & Graduation Defense Service."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MANIFEST_FILE = DATA_DIR / "handover_manifest.json"

API_TITLE = "CyberSoft Data & AI Lab — Final Handover & Defense Service (Task 30)"
API_VERSION = "1.0.0"
API_DESCRIPTION = (
    "Phân hệ bàn giao tổng kết toàn diện 30 ngày: Danh mục tài nguyên, Sổ tay kỹ thuật, "
    "Chỉ số cam kết SLA, Danh sách hạn chế đã biết, và Lộ trình phát triển 60 ngày tiếp theo."
)

import os

PORT = 8030
HOST = os.getenv("HOST", "127.0.0.1")
CORS_ORIGINS = ["*"]
