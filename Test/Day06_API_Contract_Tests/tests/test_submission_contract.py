from tests.helpers import assert_error_contract, assert_types


# 8 tests

def valid_submission():
    return {
        "user_id": "usr_seed20260908_w0_001",
        "exercise_id": "ex_001",
        "answer": "A",
    }


def test_create_submission_success_201(client):
    r = client.post("/submissions", json=valid_submission())
    assert r.status_code == 201
    assert r.json()["status"] == "submitted"


def test_create_submission_response_contract(client):
    r = client.post("/submissions", json=valid_submission())
    body = r.json()
    assert set(body.keys()) == {"id", "user_id", "exercise_id", "status", "score"}
    assert_types(body, {"id": str, "user_id": str, "exercise_id": str, "status": str})
    assert body["score"] is None


def test_submission_unknown_user_404(client):
    data = valid_submission(); data["user_id"] = "unknown"
    r = client.post("/submissions", json=data)
    assert_error_contract(r, 404, "USER_NOT_FOUND")


def test_submission_unknown_exercise_404(client):
    data = valid_submission(); data["exercise_id"] = "unknown"
    r = client.post("/submissions", json=data)
    assert_error_contract(r, 404, "EXERCISE_NOT_FOUND")


def test_submission_empty_answer_422(client):
    data = valid_submission(); data["answer"] = ""
    r = client.post("/submissions", json=data)
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_submission_answer_min_boundary_one_char(client):
    data = valid_submission(); data["answer"] = "X"
    r = client.post("/submissions", json=data)
    assert r.status_code == 201


def test_submission_answer_max_boundary_5000(client):
    data = valid_submission(); data["answer"] = "A" * 5000
    r = client.post("/submissions", json=data)
    assert r.status_code == 201


def test_submission_answer_over_max_boundary_5001(client):
    data = valid_submission(); data["answer"] = "A" * 5001
    r = client.post("/submissions", json=data)
    assert_error_contract(r, 422, "VALIDATION_ERROR")
