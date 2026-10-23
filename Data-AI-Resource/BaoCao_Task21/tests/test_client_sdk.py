"""Tests for CyberSoft Client SDK."""

import pytest
from sdk.cybersoft_client import CyberSoftAPIError, CyberSoftDataAIClient


class MockResponse:
    def __init__(self, json_data, status_code=200, ok=True, headers=None):
        self._json_data = json_data
        self.status_code = status_code
        self.ok = ok
        self.headers = headers or {"X-Request-ID": "test-req-001"}
        self.text = str(json_data)

    def json(self):
        return self._json_data

    def raise_for_status(self):
        if not self.ok:
            raise Exception(f"HTTP Error {self.status_code}")


def test_sdk_headers_generation():
    client_key = CyberSoftDataAIClient(api_key="my-key-123")
    headers = client_key._get_headers()
    assert headers["X-API-Key"] == "my-key-123"

    client_bearer = CyberSoftDataAIClient(bearer_token="my-token-456")
    headers_bearer = client_bearer._get_headers()
    assert headers_bearer["Authorization"] == "Bearer my-token-456"


def test_sdk_successful_request(monkeypatch):
    client = CyberSoftDataAIClient(api_key="cybersoft-student-public-key-101")

    def mock_request(method, url, **kwargs):
        return MockResponse({"success": True, "data": {"status": "healthy"}})

    monkeypatch.setattr(client.session, "request", mock_request)
    data = client.get_health()
    assert data["status"] == "healthy"


def test_sdk_error_envelope_raises_exception(monkeypatch):
    client = CyberSoftDataAIClient()

    def mock_request(method, url, **kwargs):
        error_payload = {
            "success": False,
            "error": {
                "code": "AUTH_REQUIRED",
                "message": "Missing authentication header",
                "details": [],
                "request_id": "req-999",
            },
        }
        return MockResponse(error_payload, status_code=401, ok=False)

    monkeypatch.setattr(client.session, "request", mock_request)

    with pytest.raises(CyberSoftAPIError) as exc_info:
        client.list_datasets()

    assert exc_info.value.code == "AUTH_REQUIRED"
    assert exc_info.value.status_code == 401
    assert exc_info.value.request_id == "req-999"
