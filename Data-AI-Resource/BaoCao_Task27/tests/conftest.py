"""Pytest configuration and client fixture for Task 27."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

TASK27_ROOT = Path(__file__).resolve().parent.parent
if str(TASK27_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK27_ROOT))

from src.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
