"""Test cases for end-to-end demo flows and verification sandbox."""

def test_healthcheck_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UP"
    assert data["http_code"] == 200
    assert "memory_rss_mb" in data


def test_handover_summary_endpoint(client):
    res = client.get("/api/v1/handover/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["release_version"] == "v1.0.0"
    assert data["sla_compliance_rate_pct"] == 100.0
    assert data["status"] == "APPROVED_FOR_RELEASE"


def test_verify_all_handover_criteria(client):
    res = client.post("/api/v1/handover/verify-all")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PASSED"
    assert data["total_checks"] == 6
    assert data["passed_checks"] == 6
    assert data["compliance_rate_pct"] == 100.0
    assert len(data["details"]) == 6


def test_demo_flow_dataset_access(service):
    datasets = service.get_datasets()
    assert any(ds["id"] == "DS-001" and "Retail" in ds["name"] for ds in datasets)
    assert any(ds["id"] == "DS-003" and "RAG" in ds["name"] for ds in datasets)


def test_demo_flow_capstone_access(service):
    capstones = service.get_capstones()
    assert any(cap["id"] == "CAP-001" and "Data Analyst" in cap["title"] for cap in capstones)
    assert any(cap["id"] == "CAP-002" and "AI Engineer" in cap["title"] for cap in capstones)


def test_portal_html_available():
    from pathlib import Path
    portal_index = Path(__file__).resolve().parent.parent / "portal" / "index.html"
    assert portal_index.exists()
    content = portal_index.read_text(encoding="utf-8")
    assert "BẢNG ĐIỀU KHIỂN BÀN GIAO & TỔNG KẾT ĐỒ ÁN (TASK 30)" in content
