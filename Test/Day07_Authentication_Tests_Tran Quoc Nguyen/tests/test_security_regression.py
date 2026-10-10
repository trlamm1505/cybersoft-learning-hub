from tests.helpers import assert_error_schema

SENSITIVE_GETS = [
    "/me",
    "/classes/class_a/students/stu_a/profile",
    "/classes/class_a/submissions/sub_a1",
    "/admin/audit",
]


def test_all_sensitive_get_endpoints_require_authentication(client):
    for path in SENSITIVE_GETS:
        r = client.get(path)
        assert r.status_code == 401, f"{path} must require authentication"


def test_401_error_schema_is_consistent(client):
    r = client.get("/me")
    assert_error_schema(r, 401, "AUTH_REQUIRED")


def test_403_error_schema_is_consistent(client, auth_headers):
    r = client.get("/admin/audit", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "ROLE_FORBIDDEN")


def test_error_response_does_not_echo_bearer_token(client, auth_headers):
    headers = auth_headers("stu_a")
    token_value = headers["Authorization"].split(" ", 1)[1]
    r = client.get("/admin/audit", headers=headers)
    assert r.status_code == 403
    assert token_value not in r.text


def test_idor_regression_student_a_cannot_read_student_b_submission(client, auth_headers):
    r = client.get("/classes/class_b/submissions/sub_b1", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "CROSS_CLASS_FORBIDDEN")
