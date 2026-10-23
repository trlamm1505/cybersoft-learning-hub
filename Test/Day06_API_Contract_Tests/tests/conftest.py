import pytest
from fastapi.testclient import TestClient
from app import app


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture(scope="session")
def student():
    return {
        "email": "student@example.test",
        "password": "123456",
        "user_id": "usr_seed20260908_w0_001",
    }
