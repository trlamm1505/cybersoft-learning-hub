"""Tests for Dataset Registry and Project Bank endpoints."""


def test_list_datasets_all(client, student_headers):
    resp = client.get("/api/v1/registry/datasets", headers=student_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert "items" in data
    assert "pagination" in data
    assert len(data["items"]) >= 3


def test_list_datasets_filter_by_domain(client, student_headers):
    resp = client.get(
        "/api/v1/registry/datasets?domain=Retail", headers=student_headers
    )
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    assert len(items) == 1
    assert items[0]["domain"] == "Retail"


def test_list_datasets_pagination(client, student_headers):
    resp = client.get(
        "/api/v1/registry/datasets?limit=2&offset=0", headers=student_headers
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["items"]) == 2
    assert data["pagination"]["limit"] == 2
    assert data["pagination"]["offset"] == 0
    assert data["pagination"]["has_next"] is True


def test_get_dataset_detail_success(client, student_headers):
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}", headers=student_headers
    )
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["id"] == dataset_id
    assert "checksum_sha256" in detail
    assert "schema_definition" in detail
    assert len(detail["schema_definition"]) > 0


def test_get_dataset_detail_not_found_returns_404(client, student_headers):
    resp = client.get(
        "/api/v1/registry/datasets/non_existent_dataset_abc", headers=student_headers
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "DATASET_NOT_FOUND"


def test_list_projects(client, instructor_headers):
    resp = client.get("/api/v1/registry/projects", headers=instructor_headers)
    assert resp.status_code == 200
    items = resp.json()["data"]["items"]
    assert len(items) >= 2
    tracks = [p["track"] for p in items]
    assert "Data Analyst" in tracks
    assert "AI Engineer" in tracks


def test_get_project_detail_success(client, instructor_headers):
    project_id = "proj-capstone-data-analyst-sales"
    resp = client.get(
        f"/api/v1/registry/projects/{project_id}", headers=instructor_headers
    )
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert detail["id"] == project_id
    assert "rubric_summary" in detail
    assert "objectives" in detail
    assert len(detail["objectives"]) >= 3


def test_get_project_detail_not_found_returns_404(client, instructor_headers):
    resp = client.get(
        "/api/v1/registry/projects/non_existent_proj_xyz", headers=instructor_headers
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "PROJECT_NOT_FOUND"


# --- Tests for 3 New Capabilities Requested by Consumers ---


def test_get_dataset_detail_has_data_dictionary(client, student_headers):
    """Test Requirement 1: GET /api/v1/registry/datasets/{id} returns data_dictionary."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}", headers=student_headers
    )
    assert resp.status_code == 200
    detail = resp.json()["data"]
    assert "data_dictionary" in detail
    data_dict = detail["data_dictionary"]
    assert isinstance(data_dict, list)
    assert len(data_dict) == 5  # customers, employees, products, orders, order_details

    table_names = [t["table_name"] for t in data_dict]
    assert "customers" in table_names
    assert "orders" in table_names
    assert "order_details" in table_names

    # Check columns in customers table
    cust_table = next(t for t in data_dict if t["table_name"] == "customers")
    assert cust_table["primary_key"] == "customer_id"
    col_names = [c["name"] for c in cust_table["columns"]]
    assert "customer_id" in col_names
    assert "full_name" in col_names
    assert "email" in col_names

    # Check column attributes (name, data_type, nullable, is_primary_key, is_foreign_key, description)
    pk_col = next(c for c in cust_table["columns"] if c["name"] == "customer_id")
    assert pk_col["data_type"] == "VARCHAR(10)"
    assert pk_col["is_primary_key"] is True
    assert pk_col["nullable"] is False
    assert pk_col["description"] != ""


def test_list_evaluation_sets(client, student_headers):
    """Test listing available benchmark evaluation sets."""
    resp = client.get("/api/v1/registry/evaluation-sets", headers=student_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["total"] >= 1
    ids = [s["id"] for s in data["items"]]
    assert "eval-rag-golden-v1" in ids


def test_get_evaluation_set_detail_success(client, student_headers):
    """Test Requirement 2: GET /api/v1/registry/evaluation-sets/{id} for AI Lab grading."""
    resp = client.get(
        "/api/v1/registry/evaluation-sets/eval-rag-golden-v1",
        headers=student_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    eval_set = body["data"]
    assert eval_set["id"] == "eval-rag-golden-v1"
    assert eval_set["total_questions"] == 30
    assert len(eval_set["questions"]) == 30

    # Verify each question has question_id, query, ground_truth_answer, expected_behavior
    q0 = eval_set["questions"][0]
    assert "question_id" in q0 and q0["question_id"]
    assert "query" in q0 and q0["query"]
    assert "ground_truth_answer" in q0 and q0["ground_truth_answer"]
    assert "expected_behavior" in q0 and q0["expected_behavior"]


def test_get_evaluation_set_alias_success(client, student_headers):
    """Test alias IDs for evaluation set (e.g. golden_rag_eval_v1)."""
    resp = client.get(
        "/api/v1/registry/evaluation-sets/golden_rag_eval_v1",
        headers=student_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["data"]["total_questions"] == 30


def test_get_evaluation_set_not_found(client, student_headers):
    """Test 404 for non-existent evaluation set."""
    resp = client.get(
        "/api/v1/registry/evaluation-sets/non_existent_eval_set_999",
        headers=student_headers,
    )
    assert resp.status_code == 404
    body = resp.json()
    assert body["success"] is False
    assert body["error"]["code"] == "EVALUATION_SET_NOT_FOUND"


def test_list_dataset_tables(client, student_headers):
    """Test listing tables of a dataset."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}/tables", headers=student_headers
    )
    assert resp.status_code == 200
    tables = resp.json()["data"]["tables"]
    assert len(tables) == 5
    names = [t["table_name"] for t in tables]
    assert "customers" in names
    assert "orders" in names


def test_get_dataset_table_clean_paginated(client, student_headers):
    """Test Requirement 3: GET table data with clean variant, pagination, version & checksum."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}/tables/customers?variant=clean&page=1&page_size=25",
        headers=student_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    data = body["data"]
    assert data["dataset_id"] == dataset_id
    assert data["table_name"] == "customers"
    assert data["variant"] == "clean"
    assert "CHUẨN SẠCH" in data["variant_description"]
    assert data["current_version"] == "v1.0"
    assert data["checksum_sha256"] != ""
    assert data["total_rows"] == 200
    assert data["page"] == 1
    assert data["page_size"] == 25
    assert len(data["rows"]) == 25
    assert "customer_id" in data["columns"]


def test_get_dataset_table_dirty_variant(client, student_headers):
    """Test Requirement 3: GET table data with dirty variant."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}/tables/customers?variant=dirty&page=1&page_size=10",
        headers=student_headers,
    )
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["variant"] == "dirty"
    assert "NHIỄU" in data["variant_description"]
    assert len(data["rows"]) == 10


def test_get_dataset_table_download_csv(client, student_headers):
    """Test Requirement 3: Download table directly as CSV file with metadata headers."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}/tables/customers?variant=clean&download=true",
        headers=student_headers,
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert resp.headers["x-current-version"] == "v1.0"
    assert "x-checksum-sha256" in resp.headers
    assert resp.headers["x-data-variant"] == "clean"
    assert "attachment" in resp.headers["content-disposition"]
    # Check CSV body has lines
    content = resp.text
    lines = content.strip().split("\n")
    assert len(lines) == 201  # header + 200 rows


def test_get_dataset_table_invalid_variant_returns_400(client, student_headers):
    """Test error handling when passing invalid variant."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}/tables/customers?variant=invalid_variant",
        headers=student_headers,
    )
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "INVALID_VARIANT"


def test_get_dataset_table_not_found_returns_404(client, student_headers):
    """Test 404 when table does not exist."""
    dataset_id = "ds-retail-ecommerce-sales-v1"
    resp = client.get(
        f"/api/v1/registry/datasets/{dataset_id}/tables/non_existent_table_xyz",
        headers=student_headers,
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "TABLE_NOT_FOUND"
