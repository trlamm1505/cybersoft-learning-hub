import pytest
from tests.helpers import assert_error_contract, assert_types


# 8 tests: positive + negative + boundary

def test_auth_login_success_contract(client, student):
    r = client.post("/auth/login", json={"email": student["email"], "password": student["password"]})
    assert r.status_code == 200
    body = r.json()
    assert set(body.keys()) == {"token", "token_type", "user_id", "role"}
    assert_types(body, {"token": str, "token_type": str, "user_id": str, "role": str})
    assert body["token_type"] == "bearer"


def test_auth_teacher_success_role(client):
    r = client.post("/auth/login", json={"email": "teacher@example.test", "password": "123456"})
    assert r.status_code == 200
    assert r.json()["role"] == "teacher"


def test_auth_wrong_password_401_error_schema(client, student):
    r = client.post("/auth/login", json={"email": student["email"], "password": "wrong1"})
    assert_error_contract(r, 401, "INVALID_CREDENTIALS")


def test_auth_unknown_email_401(client):
    r = client.post("/auth/login", json={"email": "nobody@example.test", "password": "123456"})
    assert_error_contract(r, 401, "INVALID_CREDENTIALS")


def test_auth_missing_email_422(client):
    r = client.post("/auth/login", json={"password": "123456"})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_auth_invalid_email_format_422(client):
    r = client.post("/auth/login", json={"email": "abc", "password": "123456"})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_auth_password_below_min_boundary_422(client):
    r = client.post("/auth/login", json={"email": "student@example.test", "password": "12345"})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_auth_password_at_min_boundary_accepted_by_validation(client):
    r = client.post("/auth/login", json={"email": "student@example.test", "password": "123456"})
    assert r.status_code == 200
