from tests.helpers import assert_error_schema


def test_student_can_view_own_submission(client, auth_headers):
    r = client.get("/classes/class_a/submissions/sub_a1", headers=auth_headers("stu_a"))
    assert r.status_code == 200
    assert r.json()["user_id"] == "stu_a"


def test_student_cannot_view_other_submission_same_class(client, auth_headers):
    r = client.get("/classes/class_a/submissions/sub_a2", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "IDOR_BLOCKED")


def test_student_cannot_view_cross_class_submission(client, auth_headers):
    r = client.get("/classes/class_b/submissions/sub_b1", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "CROSS_CLASS_FORBIDDEN")


def test_teacher_can_view_submission_in_own_class(client, auth_headers):
    r = client.get("/classes/class_a/submissions/sub_a1", headers=auth_headers("teacher_a"))
    assert r.status_code == 200


def test_teacher_cannot_view_cross_class_submission(client, auth_headers):
    r = client.get("/classes/class_b/submissions/sub_b1", headers=auth_headers("teacher_a"))
    assert_error_schema(r, 403, "CROSS_CLASS_FORBIDDEN")


def test_admin_can_view_submission_any_class(client, auth_headers):
    r = client.get("/classes/class_b/submissions/sub_b1", headers=auth_headers("admin"))
    assert r.status_code == 200


def test_unknown_submission_returns_404_without_leaking_other_data(client, auth_headers):
    r = client.get("/classes/class_a/submissions/not_found", headers=auth_headers("teacher_a"))
    assert_error_schema(r, 404, "SUBMISSION_NOT_FOUND")
