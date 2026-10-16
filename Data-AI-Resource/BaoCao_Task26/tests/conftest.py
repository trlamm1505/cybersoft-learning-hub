"""Pytest configuration and client fixture for Task 26."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure root of BaoCao_Task26 is in sys.path
TASK26_ROOT = Path(__file__).resolve().parent.parent
if str(TASK26_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK26_ROOT))

from src.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c
