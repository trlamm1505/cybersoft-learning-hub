"""Configuration module for CyberSoft Data Resource Portal v0.1 (Task 22)."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Server Network Configuration
HOST = os.getenv("CYBERSOFT_PORTAL_HOST", "0.0.0.0")
PORT = int(os.getenv("CYBERSOFT_PORTAL_PORT", "8000"))
DEBUG = os.getenv("CYBERSOFT_PORTAL_DEBUG", "True").lower() in ("true", "1")

# Service Identity
SERVICE_NAME = "cybersoft-resource-portal"
SERVICE_VERSION = "0.1.0"
ENVIRONMENT = os.getenv("CYBERSOFT_ENV", "production")

# Directory Paths
DATA_DIR = BASE_DIR / "data"
DATASETS_DIR = DATA_DIR / "datasets"
FEEDBACK_FILE = DATA_DIR / "feedback_store.json"
PORTAL_STATIC_DIR = BASE_DIR / "portal"

# Mock Authentication Credentials & RBAC Roles
MOCK_API_KEYS: dict[str, dict[str, str]] = {
    "cybersoft-student-public-key-101": {
        "role": "student",
        "username": "student_trainee",
        "name": "Học viên Thực tập",
    },
    "cybersoft-instructor-key-2026": {
        "role": "instructor",
        "username": "instructor_kien",
        "name": "Giảng viên CyberSoft",
    },
    "cybersoft-qa-engineer-key-999": {
        "role": "qa_engineer",
        "username": "qa_automation",
        "name": "Kỹ sư Đảm bảo Chất lượng",
    },
    "cybersoft-admin-master-key-007": {
        "role": "admin",
        "username": "admin_lead",
        "name": "Quản trị viên Hệ thống",
    },
}
