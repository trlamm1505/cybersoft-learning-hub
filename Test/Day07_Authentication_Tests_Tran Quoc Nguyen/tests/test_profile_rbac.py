from tests.helpers import assert_error_schema


def test_student_can_view_own_profile(client, auth_headers):
    r = client.get("/classes/class_a/students/stu_a/profile", headers=auth_headers("stu_a"))
    assert r.status_code == 200
    assert r.json()["id"] == "stu_a"


def test_student_cannot_view_other_student_same_class(client, auth_headers):
    r = client.get("/classes/class_a/students/stu_a2/profile", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "OWNERSHIP_FORBIDDEN")


def test_student_cannot_view_cross_class_profile(client, auth_headers):
    r = client.get("/classes/class_b/students/stu_b/profile", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "CROSS_CLASS_FORBIDDEN")


def test_teacher_can_view_student_in_own_class(client, auth_headers):
    r = client.get("/classes/class_a/students/stu_a/profile", headers=auth_headers("teacher_a"))
    assert r.status_code == 200


def test_teacher_cannot_view_student_cross_class(client, auth_headers):
    r = client.get("/classes/class_b/students/stu_b/profile", headers=auth_headers("teacher_a"))
    assert_error_schema(r, 403, "CROSS_CLASS_FORBIDDEN")


def test_admin_can_view_student_any_class(client, auth_headers):
    r = client.get("/classes/class_b/students/stu_b/profile", headers=auth_headers("admin"))
    assert r.status_code == 200


def test_class_path_mismatch_does_not_leak_student(client, auth_headers):
    r = client.get("/classes/class_a/students/stu_b/profile", headers=auth_headers("teacher_a"))
    assert_error_schema(r, 404, "STUDENT_NOT_FOUND")
