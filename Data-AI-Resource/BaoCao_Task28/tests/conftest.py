"""Pytest configuration and client fixture for Task 28."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

TASK28_ROOT = Path(__file__).resolve().parent.parent
if str(TASK28_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK28_ROOT))

from src.main import app  # noqa: E402
from src.config import DATA_DIR  # noqa: E402
from src.services.usability_engine import UsabilityEngine  # noqa: E402
from src.services.issue_resolver import IssueResolver  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def usability_engine():
    return UsabilityEngine(DATA_DIR)


@pytest.fixture(scope="module")
def issue_resolver():
    return IssueResolver(DATA_DIR)
