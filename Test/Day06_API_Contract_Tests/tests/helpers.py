from typing import Any


def assert_error_contract(response, expected_status: int, expected_code: str | None = None):
    assert response.status_code == expected_status
    body = response.json()
    assert set(body.keys()) == {"error"}
    assert isinstance(body["error"], dict)
    assert set(body["error"].keys()) == {"code", "message", "details"}
    assert isinstance(body["error"]["code"], str)
    assert isinstance(body["error"]["message"], str)
    assert isinstance(body["error"]["details"], dict)
    if expected_code:
        assert body["error"]["code"] == expected_code


def assert_types(body: dict[str, Any], contract: dict[str, type]):
    for field, expected_type in contract.items():
        assert field in body, f"Missing contract field: {field}"
        assert isinstance(body[field], expected_type), (
            f"Field {field} expected {expected_type.__name__}, got {type(body[field]).__name__}"
        )
