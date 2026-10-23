"""Pytest fixtures for Task 29 Performance & Ops Tests."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

TASK29_ROOT = Path(__file__).resolve().parent.parent
if str(TASK29_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK29_ROOT))

from src.main import app
from src.config import DATA_DIR
from src.services.profiler import PerformanceProfiler
from src.services.cache_manager import LRUQueryCache
from src.services.backup_restore import BackupRestoreEngine


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="module")
def profiler():
    return PerformanceProfiler(DATA_DIR)


@pytest.fixture
def cache():
    return LRUQueryCache(capacity=5, default_ttl_seconds=10)


@pytest.fixture(scope="module")
def backup_engine():
    return BackupRestoreEngine(DATA_DIR / "backup_sample")
