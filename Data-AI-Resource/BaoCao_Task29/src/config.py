"""Configuration for Task 29 Performance & Docker Deployment Service."""

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

API_TITLE = "CyberSoft Data & AI Lab — Performance & Ops Service (Task 29)"
API_VERSION = "1.0.0"
API_DESCRIPTION = (
    "Phân hệ đo lường hiệu năng tải trọng (Benchmarking), tối ưu hóa bộ nhớ đệm (Two-Tier Caching), "
    "giám sát sức khỏe container (Healthcheck) và cơ chế sao lưu phục hồi dữ liệu (Backup & Restore)."
)

import os

PORT = 8029
HOST = os.getenv("HOST", "127.0.0.1")
CORS_ORIGINS = ["*"]
