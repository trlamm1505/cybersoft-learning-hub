def assert_error_schema(response, expected_status: int, expected_code: str | None = None):
    assert response.status_code == expected_status
    body = response.json()
    assert "detail" in body
    assert isinstance(body["detail"], dict)
    assert "code" in body["detail"]
    assert "message" in body["detail"]
    if expected_code:
        assert body["detail"]["code"] == expected_code
