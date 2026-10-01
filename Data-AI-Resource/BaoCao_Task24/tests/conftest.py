# ruff: noqa: E402
"""Pytest test configuration and fixtures for Task 24."""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup import path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.main import app
from src.services.immutable_store import immutable_store
from src.services.lineage_engine import lineage_engine
from src.services.manifest_builder import manifest_builder


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def store():
    return immutable_store


@pytest.fixture(scope="session")
def engine():
    return lineage_engine


@pytest.fixture(scope="session")
def builder():
    return manifest_builder
