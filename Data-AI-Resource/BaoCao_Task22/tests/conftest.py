"""Pytest configuration and fixtures for Task 22 test suite."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    """Session-wide test client fixture."""
    return TestClient(app)


@pytest.fixture
def student_headers() -> dict[str, str]:
    """Headers for student role."""
    return {"X-API-Key": "cybersoft-student-public-key-101"}


@pytest.fixture
def instructor_headers() -> dict[str, str]:
    """Headers for instructor role."""
    return {"X-API-Key": "cybersoft-instructor-key-2026"}


@pytest.fixture
def qa_headers() -> dict[str, str]:
    """Headers for QA automation engineer role."""
    return {"X-API-Key": "cybersoft-qa-engineer-key-999"}
