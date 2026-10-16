"""Test suite for contract compatibility with Learning Hub TypeScript specifications (Task 26)."""


def test_contract_summary_endpoint(client):
    res = client.get("/api/v1/integration/contract-summary")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    contracts = body["data"]["contracts"]
    assert len(contracts) >= 6
    for c in contracts:
        assert c["contract_valid"] is True
        assert len(c["contract_issues"]) == 0


def test_dataset_data_dictionary_schema_shape(client):
    res = client.get("/api/v1/integration/resources/ds-retail-ecommerce-sales-v1")
    assert res.status_code == 200
    data = res.json()["data"]

    # Must contain data_dictionary as list of tables
    dict_tables = data["data_dictionary"]
    assert isinstance(dict_tables, list)

    table_names = [t["table_name"] for t in dict_tables]
    assert "customers" in table_names
    assert "orders" in table_names
    assert "order_details" in table_names

    for t in dict_tables:
        assert "table_name" in t
        assert "columns" in t
        assert len(t["columns"]) > 0
        for col in t["columns"]:
            assert "name" in col
            assert "data_type" in col
            assert "is_primary_key" in col
            assert "is_foreign_key" in col


def test_dataset_foreign_key_references(client):
    res = client.get("/api/v1/integration/resources/ds-retail-ecommerce-sales-v1")
    tables = res.json()["data"]["data_dictionary"]
    orders_table = next(t for t in tables if t["table_name"] == "orders")
    cust_fk = next(c for c in orders_table["columns"] if c["name"] == "customer_id")

    assert cust_fk["is_foreign_key"] is True
    assert cust_fk["foreign_key_target"] == "customers.customer_id"


def test_evaluation_set_contract_shape(client):
    res = client.get("/api/v1/integration/resources/eval-rag-golden-v1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["type"] == "evaluation_set"
    assert data["total_questions"] == 30
    assert data["sha256_checksum"] is not None


def test_project_template_contract_shape(client):
    res = client.get("/api/v1/integration/resources/proj-da-inventory-v1")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["type"] == "project_template"
    assert "starter_repo_url" in data
    assert data["starter_repo_url"].startswith("https://")
