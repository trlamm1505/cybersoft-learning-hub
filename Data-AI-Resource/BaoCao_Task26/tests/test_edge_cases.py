"""Edge case and security checks for Task 26 APIs."""


def test_catalog_empty_search_returns_zero(client):
    res = client.get("/api/v1/integration/catalog?search=non_existent_keyword_xyz_123")
    assert res.status_code == 200
    assert len(res.json()["data"]["items"]) == 0


def test_catalog_combined_filters(client):
    res = client.get("/api/v1/integration/catalog?role=AI_ENGINEER&type=evaluation_set")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) == 2
    for it in items:
        assert "AI_ENGINEER" in it["target_roles"]
        assert it["type"] == "evaluation_set"


def test_assignment_resolve_missing_resource_id(client):
    res = client.post("/api/v1/integration/assignments/resolve", json={})
    assert res.status_code == 422  # Pydantic validation error


def test_assignment_validate_unknown_resource(client):
    payload = {
        "resource_id": "ghost-resource-404",
        "assigned_version": "v1.0.0",
        "snapshot_hash": "dummy",
    }
    res = client.post("/api/v1/integration/assignments/validate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["valid"] is False
    assert "không còn tồn tại" in data["message"]


def test_assignment_validate_unknown_version_drift(client):
    payload = {
        "resource_id": "ds-retail-ecommerce-sales-v1",
        "assigned_version": "v0.0.1-prehistoric",
        "snapshot_hash": "dummy",
    }
    res = client.post("/api/v1/integration/assignments/validate", json=payload)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["valid"] is False
    assert "không tìm thấy trong lịch sử phiên bản" in data["message"]


def test_contract_validator_detects_malformed_dataset():
    from src.schemas.integration import CatalogItem
    from src.services import contract_validator

    malformed_item = CatalogItem(
        resource_id="bad-ds",
        name="Bad Dataset",
        type="dataset",
        domain="testing",
        target_roles=["DATA_ANALYST"],
        description="Dataset with empty dictionary",
        current_version="v1.0.0",
        published_versions=["v1.0.0"],
        status="ACTIVE",
        data_dictionary=[],  # empty
    )
    is_valid, errs = contract_validator.validate_dataset_contract(malformed_item)
    assert is_valid is False
    assert any("ít nhất 1 bảng" in e for e in errs)
