"""End-to-End integration test simulating the Teacher Assignment Workflow (Task 26)."""


def test_full_e2e_teacher_assignment_lifecycle(client):
    # Step 1: Teacher searches catalog for Machine Learning & Retention datasets
    cat_res = client.get("/api/v1/integration/catalog?role=DATA_ANALYST&type=dataset")
    assert cat_res.status_code == 200
    datasets = cat_res.json()["data"]["items"]
    target_ds = next(
        (d for d in datasets if d["resource_id"] == "ds-customer-churn-v1"), None
    )
    assert target_ds is not None

    # Step 2: Teacher inspects dataset schema & table definition
    detail_res = client.get(f"/api/v1/integration/resources/{target_ds['resource_id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()["data"]
    assert detail["name"] == "Customer Churn & Behavioral ML Dataset"
    assert len(detail["data_dictionary"]) == 1
    assert detail["data_dictionary"][0]["table_name"] == "customer_churn"

    # Step 3: Teacher selects version v1.0.0 and assigns to class CLASS-ML-K26
    assign_payload = {
        "resource_id": target_ds["resource_id"],
        "requested_version": "v1.0.0",
        "class_id": "CLASS-ML-K26",
        "exercise_slug": "da-ml-churn-classification-lab",
        "teacher_id": "teacher-kien",
    }
    assign_res = client.post(
        "/api/v1/integration/assignments/resolve", json=assign_payload
    )
    assert assign_res.status_code == 200
    assignment = assign_res.json()["data"]

    assert assignment["resolved_version"] == "v1.0.0"
    assert assignment["is_immutable_locked"] is True
    locked_hash = assignment["snapshot_hash"]
    assert len(locked_hash) == 64

    # Step 4: Time passes, Data Lab upgrades dataset to v1.1.0 in registry
    # Check that registry now reports current_version = v1.1.0
    check_cat = client.get(f"/api/v1/integration/resources/{target_ds['resource_id']}")
    assert check_cat.json()["data"]["current_version"] == "v1.1.0"

    # Step 5: Student executes assignment; Learning Hub validates frozen snapshot against registry
    val_payload = {
        "resource_id": target_ds["resource_id"],
        "assigned_version": "v1.0.0",
        "snapshot_hash": locked_hash,
    }
    val_res = client.post("/api/v1/integration/assignments/validate", json=val_payload)
    assert val_res.status_code == 200
    val_data = val_res.json()["data"]

    assert val_data["valid"] is True
    assert val_data["is_hash_matching"] is True
    assert val_data["version_drift_detected"] is True
    # Guaranteed reproducible: the student's lab environment remains consistent!
    assert "chạy an toàn trên snapshot đã khóa v1.0.0" in val_data["message"]
