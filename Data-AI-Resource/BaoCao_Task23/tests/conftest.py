"""Pytest configuration and fixtures for Task 23."""

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.services.feasibility_executor import FeasibilityExecutorService
from src.services.generator_engine import GeneratorEngineService
from src.services.review_gatekeeper import ReviewGatekeeperService
from src.services.schema_reader import SchemaReaderService


@pytest.fixture(scope="session")
def client():
    """Test client fixture for FastAPI app."""
    return TestClient(app)


@pytest.fixture
def schema_reader():
    """SchemaReaderService fixture."""
    return SchemaReaderService()


@pytest.fixture
def feasibility_executor():
    """FeasibilityExecutorService fixture."""
    return FeasibilityExecutorService()


@pytest.fixture
def engine():
    """GeneratorEngineService fixture."""
    return GeneratorEngineService()


@pytest.fixture
def gatekeeper(engine):
    """ReviewGatekeeperService fixture."""
    return ReviewGatekeeperService(engine=engine)
