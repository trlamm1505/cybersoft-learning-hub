"""Test cases for retrospective, known issues, and 60-day roadmap."""

def test_known_issues_count(manifest_data):
    issues = manifest_data["known_issues_and_limitations"]
    assert len(issues) >= 3
    for iss in issues:
        assert "issue_id" in iss
        assert "severity" in iss
        assert "description" in iss
        assert "mitigation" in iss
        assert "workaround" in iss


def test_known_issues_severity_low(manifest_data):
    issues = manifest_data["known_issues_and_limitations"]
    for iss in issues:
        assert iss["severity"] == "LOW"


def test_roadmap_phases_count(manifest_data):
    roadmap = manifest_data["roadmap_60_days"]
    assert len(roadmap) == 2
    assert "Tháng 1" in roadmap[0]["phase"]
    assert "Tháng 2" in roadmap[1]["phase"]


def test_roadmap_milestones_count(manifest_data):
    roadmap = manifest_data["roadmap_60_days"]
    for phase in roadmap:
        assert len(phase["milestones"]) >= 3


def test_api_get_known_issues(client):
    res = client.get("/api/v1/handover/known-issues")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    assert data[0]["issue_id"] == "KNOWN-001"


def test_api_get_roadmap(client):
    res = client.get("/api/v1/handover/roadmap")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 2
    assert "milestones" in data[0]
