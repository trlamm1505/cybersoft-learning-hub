"""Test suite for Immutable Snapshot and Reproducible Assignments (Task 26)."""


def test_resolve_assignment_latest_success(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "requested_version": "latest",
        "class_id": "CLASS-DA-01",
        "exercise_slug": "da-sql-lab-01",
    }
    res = client.post("/api/v1/integration/assignments/resolve", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]

    assert data["resource_id"] == "ds-retail-ecommerce-sales-v1"
    assert data["resolved_version"] == "v1.1.0"
    assert data["is_immutable_locked"] is True
    assert len(data["snapshot_hash"]) == 64
    assert data["sandbox_metadata"]["read_only_access"] is True


def test_resolve_assignment_explicit_v1_0_0(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "requested_version": "v1.0.0",
        "class_id": "CLASS-DA-02",
        "exercise_slug": "da-sql-lab-02",
    }
    res = client.post("/api/v1/integration/assignments/resolve", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["resolved_version"] == "v1.0.0"
    assert (
        data["snapshot_hash"]
        == "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0"
    )


def test_validate_assignment_hash_matching(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "assigned_version": "v1.0.0",
        "snapshot_hash": "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
    }
    res = client.post("/api/v1/integration/assignments/validate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["valid"] is True
    assert data["is_hash_matching"] is True
    assert data["assigned_version"] == "v1.0.0"
    assert data["current_registry_version"] == "v1.1.0"
    assert data["version_drift_detected"] is True
    assert "Lưu ý: Registry đã nâng cấp lên v1.1.0" in data["message"]


def test_validate_assignment_tampered_hash_fails(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "assigned_version": "v1.0.0",
        "snapshot_hash": "tampered_fake_hash_1234567890abcdef",
    }
    res = client.post("/api/v1/integration/assignments/validate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["valid"] is False
    assert data["is_hash_matching"] is False


def test_resolve_assignment_ai_evaluation_set(client):
    payload = {
        "resource_id": "eval-rag-golden-v1",
        "requested_version": "v1.0.0",
        "class_id": "CLASS-AI-01",
    }
    res = client.post("/api/v1/integration/assignments/resolve", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["resolved_version"] == "v1.0.0"
    assert (
        data["snapshot_hash"]
        == "33445566778899aabbccddeeff00112233445566778899aabbccddeeff001122"
    )
