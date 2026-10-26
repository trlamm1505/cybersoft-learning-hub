"""Pytest test fixtures and configuration for CyberSoft API v1 tests."""

import sys
from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from src.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def student_headers() -> dict:
    """Header fixture for enrolled student role."""
    return {"X-API-Key": "cybersoft-student-public-key-101"}


@pytest.fixture
def instructor_headers() -> dict:
    """Header fixture for instructor role."""
    return {"X-API-Key": "cybersoft-instructor-key-2026"}


@pytest.fixture
def qa_headers() -> dict:
    """Header fixture for QA Automation Engineer role."""
    return {"X-API-Key": "cybersoft-qa-eval-key-333"}


@pytest.fixture
def admin_headers() -> dict:
    """Header fixture for system administrator role."""
    return {"X-API-Key": "cybersoft-admin-sec-key-999"}


@pytest.fixture
def bearer_headers() -> dict:
    """Header fixture for Bearer token authentication."""
    return {"Authorization": "Bearer cybersoft-student-public-key-101"}
