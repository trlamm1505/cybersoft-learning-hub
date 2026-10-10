from tests.helpers import assert_error_contract, assert_types


# 8 tests

def test_get_exercise_success_contract(client):
    r = client.get("/exercises/ex_001")
    assert r.status_code == 200
    body = r.json()
    assert set(body.keys()) == {"id", "title", "exercise_type", "max_score", "published"}
    assert_types(body, {"id": str, "title": str, "exercise_type": str, "max_score": int, "published": bool})


def test_get_exercise_not_found_404(client):
    r = client.get("/exercises/not-found")
    assert_error_contract(r, 404, "EXERCISE_NOT_FOUND")


def test_create_quiz_success_201(client):
    r = client.post("/exercises", json={"title": "Quiz 1", "exercise_type": "quiz", "max_score": 10})
    assert r.status_code == 201
    assert r.json()["published"] is False


def test_create_coding_success_201(client):
    r = client.post("/exercises", json={"title": "Coding 1", "exercise_type": "coding", "max_score": 100})
    assert r.status_code == 201
    assert r.json()["exercise_type"] == "coding"


def test_create_exercise_empty_title_422(client):
    r = client.post("/exercises", json={"title": "", "exercise_type": "quiz", "max_score": 10})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_create_exercise_invalid_type_422(client):
    r = client.post("/exercises", json={"title": "X", "exercise_type": "essay", "max_score": 10})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_create_exercise_score_lower_boundary_zero(client):
    r = client.post("/exercises", json={"title": "Zero score", "exercise_type": "quiz", "max_score": 0})
    assert r.status_code == 201
    assert r.json()["max_score"] == 0


def test_create_exercise_score_over_upper_boundary_101(client):
    r = client.post("/exercises", json={"title": "Too high", "exercise_type": "quiz", "max_score": 101})
    assert_error_contract(r, 422, "VALIDATION_ERROR")
