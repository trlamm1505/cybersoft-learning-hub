from app import issue_token, sanitize_headers
from tests.helpers import assert_error_schema


def test_student_valid_token_can_read_me(client, auth_headers):
    r = client.get("/me", headers=auth_headers("stu_a"))
    assert r.status_code == 200
    assert r.json()["role"] == "student"


def test_teacher_valid_token_can_read_me(client, auth_headers):
    r = client.get("/me", headers=auth_headers("teacher_a"))
    assert r.status_code == 200
    assert r.json()["role"] == "teacher"


def test_admin_valid_token_can_read_me(client, auth_headers):
    r = client.get("/me", headers=auth_headers("admin"))
    assert r.status_code == 200
    assert r.json()["role"] == "admin"


def test_missing_token_is_401(client):
    r = client.get("/me")
    assert_error_schema(r, 401, "AUTH_REQUIRED")


def test_wrong_auth_scheme_is_401(client, token_for):
    r = client.get("/me", headers={"Authorization": f"Basic {token_for('stu_a')}"})
    assert_error_schema(r, 401, "AUTH_SCHEME_INVALID")


def test_expired_token_is_401(client, auth_headers):
    r = client.get("/me", headers=auth_headers("stu_a", expires_in=-10))
    assert_error_schema(r, 401, "TOKEN_EXPIRED")


def test_tampered_token_is_401(client, token_for):
    token = token_for("stu_a")

    payload, signature = token.split(".", 1)

    tampered_signature = (
        ("A" if signature[0] != "A" else "B")
        + signature[1:]
    )

    tampered_token = f"{payload}.{tampered_signature}"

    r = client.get(
        "/me",
        headers={"Authorization": f"Bearer {tampered_token}"}
    )

    assert_error_schema(r, 401, "TOKEN_INVALID")


def test_malformed_token_is_401(client):
    r = client.get("/me", headers={"Authorization": "Bearer not-a-token"})
    assert_error_schema(r, 401, "TOKEN_INVALID")


def test_unknown_user_in_signed_token_is_401(client):
    token = issue_token("ghost_user")
    r = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert_error_schema(r, 401, "USER_NOT_FOUND")


def test_sensitive_headers_are_redacted_before_logging(token_for):
    token = token_for("stu_a")
    safe = sanitize_headers({"Authorization": f"Bearer {token}", "X-Request-ID": "req-1"})
    assert safe["Authorization"] == "[REDACTED]"
    assert token not in str(safe)


def test_cookie_is_redacted_before_logging():
    safe = sanitize_headers({"Cookie": "session=secret", "User-Agent": "pytest"})
    assert safe["Cookie"] == "[REDACTED]"
