from tests.helpers import assert_error_schema


def test_teacher_can_create_exercise_in_own_class(client, auth_headers):
    r = client.post("/classes/class_a/exercises", headers=auth_headers("teacher_a"), json={"title": "New Quiz"})
    assert r.status_code == 201
    assert r.json()["class_id"] == "class_a"


def test_teacher_cannot_create_exercise_cross_class(client, auth_headers):
    r = client.post("/classes/class_b/exercises", headers=auth_headers("teacher_a"), json={"title": "New Quiz"})
    assert_error_schema(r, 403, "CROSS_CLASS_FORBIDDEN")


def test_student_cannot_create_exercise(client, auth_headers):
    r = client.post("/classes/class_a/exercises", headers=auth_headers("stu_a"), json={"title": "New Quiz"})
    assert_error_schema(r, 403, "ROLE_FORBIDDEN")


def test_admin_can_create_exercise_any_class(client, auth_headers):
    r = client.post("/classes/class_b/exercises", headers=auth_headers("admin"), json={"title": "Admin Quiz"})
    assert r.status_code == 201


def test_missing_token_cannot_create_exercise(client):
    r = client.post("/classes/class_a/exercises", json={"title": "New Quiz"})
    assert_error_schema(r, 401, "AUTH_REQUIRED")


def test_only_admin_can_delete_exercise(client, auth_headers):
    r = client.delete("/classes/class_a/exercises/ex_a", headers=auth_headers("admin"))
    assert r.status_code == 204


def test_teacher_cannot_delete_exercise(client, auth_headers):
    r = client.delete("/classes/class_a/exercises/ex_a", headers=auth_headers("teacher_a"))
    assert_error_schema(r, 403, "ROLE_FORBIDDEN")


def test_student_cannot_delete_exercise(client, auth_headers):
    r = client.delete("/classes/class_a/exercises/ex_a", headers=auth_headers("stu_a"))
    assert_error_schema(r, 403, "ROLE_FORBIDDEN")
