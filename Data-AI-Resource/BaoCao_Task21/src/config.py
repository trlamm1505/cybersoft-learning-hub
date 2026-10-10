"""Configuration settings for CyberSoft Data & AI API Service."""

import os
from pathlib import Path

# Base directory for Task 21
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
INDEXES_DIR = BASE_DIR / "indexes"
CONTRACTS_DIR = BASE_DIR / "contracts"

# Service info
API_TITLE = "CyberSoft Data & AI Lab Integration Service"
API_VERSION = "1.0.0"
API_DESCRIPTION = (
    "Cổng dịch vụ RESTful API v1.0 chuẩn hóa theo OpenAPI 3.1 cho phân hệ CyberSoft Data & AI Lab. "
    "Cung cấp hợp đồng tích hợp chính thức giữa phân hệ Data & AI Resource (TTS 01) với "
    "CyberSoft Learning & Contest Hub (TTS 02) và QA/Eval Platform (TTS 03)."
)

# Server config
HOST = os.getenv("CYBERSOFT_API_HOST", "0.0.0.0")
PORT = int(os.getenv("CYBERSOFT_API_PORT", "8000"))

# CORS origins
CORS_ORIGINS: list[str] = [
    "http://localhost:5173",  # FE Vite React
    "http://localhost:3000",  # BE NestJS
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*",
]

# Mock API Key & Bearer Token Store mapping to Roles
# Roles: student, instructor, qa_engineer, admin
API_KEYS_STORE: dict[str, dict[str, str]] = {
    "cybersoft-admin-sec-key-999": {
        "role": "admin",
        "username": "admin_sys",
        "description": "System Administrator (Full Privileges)",
    },
    "cybersoft-instructor-key-2026": {
        "role": "instructor",
        "username": "instructor_gv",
        "description": "CyberSoft Lecturer / Content Author",
    },
    "cybersoft-qa-eval-key-333": {
        "role": "qa_engineer",
        "username": "qa_nguyen",
        "description": "QA Automation & Evaluation Team (TTS 03)",
    },
    "cybersoft-student-public-key-101": {
        "role": "student",
        "username": "student_learner",
        "description": "Learning Hub Enrolled Student (TTS 02)",
    },
}

# Role hierarchy and permissions
ROLE_PERMISSIONS = {
    "admin": {
        "read_all",
        "write_all",
        "eval_rag",
        "validate_data",
        "view_metrics",
        "search",
        "tutor",
    },
    "qa_engineer": {
        "read_all",
        "eval_rag",
        "validate_data",
        "view_metrics",
        "search",
        "tutor",
    },
    "instructor": {"read_all", "validate_data", "view_metrics", "search", "tutor"},
    "student": {"read_public", "search", "tutor"},
}
