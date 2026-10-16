"""Pytest fixtures and test client configuration for Task 30."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

TASK30_ROOT = Path(__file__).resolve().parent.parent
if str(TASK30_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK30_ROOT))

from src.main import app  # noqa: E402
from src.services.handover_service import handover_service  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def service():
    handover_service.reload()
    return handover_service


@pytest.fixture(scope="session")
def manifest_data(service):
    return service._data
