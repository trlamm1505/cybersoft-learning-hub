"""Test cases for handover manifest and inventory registry."""

def test_manifest_metadata_validity(manifest_data):
    assert manifest_data["release_version"] == "v1.0.0"
    assert manifest_data["project_name"] == "CyberSoft Data & AI Lab"
    assert manifest_data["lead_engineer"] == "Đào Trung Kiên"
    assert manifest_data["role"] == "Data & AI Resource Engineer"


def test_deliverables_summary(manifest_data):
    summary = manifest_data["deliverables_summary"]
    assert summary["total_days_completed"] == 30
    assert summary["total_datasets"] >= 4
    assert summary["total_capstones"] >= 2
    assert summary["test_pass_rate"] == 100.0


def test_datasets_registry_structure(manifest_data):
    datasets = manifest_data["datasets_registry"]
    assert len(datasets) >= 3
    for ds in datasets:
        assert "id" in ds and ds["id"].startswith("DS-")
        assert "name" in ds
        assert "schema_standard" in ds
        assert ds["clean_dirty_pair"] is True
        assert len(ds["formats"]) >= 1


def test_capstone_projects_structure(manifest_data):
    capstones = manifest_data["capstone_projects"]
    assert len(capstones) >= 2
    for cap in capstones:
        assert "id" in cap and cap["id"].startswith("CAP-")
        assert "title" in cap
        assert "deliverables" in cap
        assert len(cap["deliverables"]) >= 4
        assert cap["status"] == "READY_FOR_TEACHING"


def test_api_get_datasets(client):
    res = client.get("/api/v1/handover/datasets")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    assert data[0]["id"] == "DS-001"


def test_api_get_capstones(client):
    res = client.get("/api/v1/handover/capstones")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 2
    assert data[0]["id"] == "CAP-001"
