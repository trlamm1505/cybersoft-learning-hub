import pytest
from fastapi.testclient import TestClient

from app import app, issue_token


@pytest.fixture(scope="session")
def client():
    return TestClient(app)


@pytest.fixture
def token_for():
    return lambda user_id, expires_in=3600: issue_token(user_id, expires_in=expires_in)


@pytest.fixture
def auth_headers(token_for):
    def _headers(user_id, expires_in=3600):
        return {"Authorization": f"Bearer {token_for(user_id, expires_in)}"}
    return _headers
