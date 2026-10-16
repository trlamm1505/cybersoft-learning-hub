"""Test suite for Catalog Discovery API (Task 26)."""


def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "UP"
    assert body["data"]["cross_product_ready"] is True


def test_get_catalog_all(client):
    res = client.get("/api/v1/integration/catalog")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "data" in body
    items = body["data"]["items"]
    assert len(items) >= 6
    assert any(i["resource_id"] == "ds-retail-ecommerce-sales-v1" for i in items)
    assert any(i["resource_id"] == "eval-rag-golden-v1" for i in items)


def test_get_catalog_filter_role_data_analyst(client):
    res = client.get("/api/v1/integration/catalog?role=DATA_ANALYST")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 2
    for it in items:
        assert "DATA_ANALYST" in it["target_roles"]


def test_get_catalog_filter_role_ai_engineer(client):
    res = client.get("/api/v1/integration/catalog?role=AI_ENGINEER")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 3
    for it in items:
        assert "AI_ENGINEER" in it["target_roles"]


def test_get_catalog_filter_type_dataset(client):
    res = client.get("/api/v1/integration/catalog?type=dataset")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 2
    for it in items:
        assert it["type"] == "dataset"


def test_get_catalog_filter_type_evaluation_set(client):
    res = client.get("/api/v1/integration/catalog?type=evaluation_set")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 2
    for it in items:
        assert it["type"] == "evaluation_set"


def test_get_catalog_search_query(client):
    res = client.get("/api/v1/integration/catalog?search=churn")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) >= 1
    assert items[0]["resource_id"] == "ds-customer-churn-v1"


def test_get_resource_detail_success(client):
    res = client.get("/api/v1/integration/resources/ds-retail-ecommerce-sales-v1")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["resource_id"] == "ds-retail-ecommerce-sales-v1"
    assert len(body["data"]["data_dictionary"]) >= 3


def test_get_resource_detail_not_found(client):
    res = client.get("/api/v1/integration/resources/unknown-resource-999")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_get_resource_versions_success(client):
    res = client.get(
        "/api/v1/integration/resources/ds-retail-ecommerce-sales-v1/versions"
    )
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    versions = body["data"]["versions"]
    assert "v1.0.0" in versions
    assert "v1.1.0" in versions
