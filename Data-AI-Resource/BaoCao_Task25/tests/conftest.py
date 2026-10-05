"""Pytest configuration and shared fixtures for Task 25."""

import pytest
from fastapi.testclient import TestClient
import sys
from pathlib import Path

# Ensure task directory is in sys.path
TASK_DIR = Path(__file__).resolve().parent.parent
if str(TASK_DIR) not in sys.path:
    sys.path.insert(0, str(TASK_DIR))

from src.main import app  # noqa: E402
from src.services.file_security import FileSecurityService  # noqa: E402
from src.services.injection_guard import InjectionGuardService  # noqa: E402
from src.services.pii_scanner import PIIScannerService  # noqa: E402
from src.services.threat_engine import ThreatEngineService  # noqa: E402


@pytest.fixture
def client():
    """Test client for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def pii_service():
    """PII scanner instance."""
    return PIIScannerService()


@pytest.fixture
def injection_service():
    """Injection guard instance."""
    return InjectionGuardService()


@pytest.fixture
def file_service(tmp_path):
    """File security instance with isolated temporary sandbox."""
    return FileSecurityService(sandbox_dir=tmp_path)


@pytest.fixture
def threat_service():
    """Threat engine instance."""
    return ThreatEngineService()
