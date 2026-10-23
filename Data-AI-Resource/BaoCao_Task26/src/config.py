"""Cấu hình cho dịch vụ Tích hợp Learning Platform (Task 26)."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "127.0.0.1")
SERVICE_NAME = "cybersoft-learning-platform-integrator"
VERSION = "v1.0.0"
API_PREFIX = "/api/v1/integration"

# Đường dẫn danh mục tài nguyên và sổ đăng ký phiên bản
CATALOG_PATH = DATA_DIR / "catalog.json"
VERSION_REGISTRY_PATH = DATA_DIR / "version_registry.json"
