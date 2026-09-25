from tests.helpers import assert_error_schema


def test_admin_can_read_audit(client, auth_headers):
    r = client.get("/admin/audit", headers=auth_headers("admin"))
    assert r.status_code == 200


def test_teacher_cannot_read_audit(client, auth_headers):
    r = client.get("/admin/audit", headers=auth_headers("teacher_a"))
    assert_error_schema(r, 403, "ROLE_FORBIDDEN")


def test_student_cannot_read_audit(client, auth_headers):
    r = client.get("/admin/audit", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "ROLE_FORBIDDEN")


def test_unauthenticated_user_cannot_read_audit(client):
    r = client.get("/admin/audit")
    assert_error_schema(r, 401, "AUTH_REQUIRED")
