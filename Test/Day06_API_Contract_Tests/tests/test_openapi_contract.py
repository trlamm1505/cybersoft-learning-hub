import json
from pathlib import Path


CONTRACT = json.loads((Path(__file__).parents[1] / "contracts" / "required_contract.json").read_text(encoding="utf-8"))


# 5 tests: OpenAPI integration + schema breaking detection

def test_openapi_endpoint_available(client):
    r = client.get("/openapi.json")
    assert r.status_code == 200
    assert r.json()["openapi"].startswith("3.")


def test_openapi_required_paths_and_methods(client):
    schema = client.get("/openapi.json").json()
    for path, methods in CONTRACT["paths"].items():
        assert path in schema["paths"], f"Breaking change: missing path {path}"
        for method in methods:
            assert method in schema["paths"][path], f"Breaking change: missing {method.upper()} {path}"


def _assert_schema_required_fields(schema: dict, schema_name: str, expected_fields: list[str]):
    actual = schema["components"]["schemas"][schema_name]
    properties = set(actual.get("properties", {}).keys())
    for field in expected_fields:
        assert field in properties, f"Breaking change: {schema_name} lost field {field}"


def test_openapi_login_response_fields(client):
    schema = client.get("/openapi.json").json()
    _assert_schema_required_fields(schema, "LoginResponse", CONTRACT["schemas"]["LoginResponse"])


def test_openapi_resource_and_exercise_response_fields(client):
    schema = client.get("/openapi.json").json()
    _assert_schema_required_fields(schema, "ResourceResponse", CONTRACT["schemas"]["ResourceResponse"])
    _assert_schema_required_fields(schema, "ExerciseResponse", CONTRACT["schemas"]["ExerciseResponse"])


def test_openapi_submission_response_fields(client):
    schema = client.get("/openapi.json").json()
    _assert_schema_required_fields(schema, "SubmissionResponse", CONTRACT["schemas"]["SubmissionResponse"])
