from tests.helpers import assert_error_contract, assert_types


# 8 tests

def test_get_resource_success_contract(client):
    r = client.get("/resources/res_001")
    assert r.status_code == 200
    body = r.json()
    assert set(body.keys()) == {"id", "name", "type", "version"}
    assert_types(body, {"id": str, "name": str, "type": str, "version": int})


def test_get_resource_not_found_404_schema(client):
    r = client.get("/resources/not-found")
    assert_error_contract(r, 404, "RESOURCE_NOT_FOUND")


def test_create_resource_success_201(client):
    r = client.post("/resources", json={"name": "New lesson", "type": "lesson"})
    assert r.status_code == 201
    assert r.json()["version"] == 1


def test_create_resource_response_contract(client):
    r = client.post("/resources", json={"name": "Video 01", "type": "video"})
    body = r.json()
    assert set(body.keys()) == {"id", "name", "type", "version"}
    assert_types(body, {"id": str, "name": str, "type": str, "version": int})


def test_create_resource_empty_name_422(client):
    r = client.post("/resources", json={"name": "", "type": "lesson"})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_create_resource_invalid_type_422(client):
    r = client.post("/resources", json={"name": "abc", "type": "unknown"})
    assert_error_contract(r, 422, "VALIDATION_ERROR")


def test_create_resource_name_at_max_boundary_50(client):
    r = client.post("/resources", json={"name": "A" * 50, "type": "document"})
    assert r.status_code == 201
    assert len(r.json()["name"]) == 50


def test_create_resource_name_over_max_boundary_51(client):
    r = client.post("/resources", json={"name": "A" * 51, "type": "document"})
    assert_error_contract(r, 422, "VALIDATION_ERROR")
