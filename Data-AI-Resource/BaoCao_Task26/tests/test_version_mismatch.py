"""Test suite for Version Mismatch, Deprecation, and Actionable Error Handling (Task 26)."""


def test_version_not_found_actionable_error(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "requested_version": "v9.9.9",
        "class_id": "CLASS-TEST",
    }
    res = client.post("/api/v1/integration/assignments/resolve", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is False
    err = body["error"]
    assert err["code"] == "VERSION_NOT_FOUND"
    assert "v9.9.9" in err["message"]
    assert "available_versions" in err["details"]
    assert "v1.0.0" in err["details"]["available_versions"]
    assert "v1.1.0" in err["details"]["available_versions"]
    assert err["suggested_action"] is not None
    assert "v1.1.0" in err["suggested_action"]


def test_version_deprecated_actionable_error(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "requested_version": "v0.9.0-beta",
        "class_id": "CLASS-TEST",
    }
    res = client.post("/api/v1/integration/assignments/resolve", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is False
    err = body["error"]
    assert err["code"] == "VERSION_DEPRECATED"
    assert "v0.9.0-beta" in err["message"]
    assert err["details"]["deprecated_reason"] is not None
    assert err["details"]["suggested_version"] == "v1.0.0"
    assert "v1.0.0" in err["suggested_action"]


def test_resource_not_found_error(client):
    payload = {
        "resource_id": "non-existent-dataset-xyz",
        "requested_version": "latest",
    }
    res = client.post("/api/v1/integration/assignments/resolve", json=payload)
    assert res.status_code == 200
    body = res.json()

    assert body["success"] is False
    err = body["error"]
    assert err["code"] == "RESOURCE_NOT_FOUND"
    assert err["suggested_action"] is not None
