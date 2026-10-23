"""Tests verifying all 5 official instructor usability scenarios (DoD Condition)."""

from fastapi.testclient import TestClient


def test_all_five_usability_scenarios_pass(client: TestClient):
    """
    TIÊU CHÍ NGHIỆM THU (DoD):
    Toàn bộ 5 kịch bản kiểm thử độ khả dụng (Usability Scenarios) phải đạt PASS 100%
    và hoàn thành trong ngưỡng cam kết dưới 60 giây.
    """
    res = client.post("/api/v1/portal/usability-benchmark")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["meta"]["all_passed"] is True
    assert body["meta"]["total_scenarios"] == 5

    scenarios = body["data"]
    assert len(scenarios) == 5

    for sc in scenarios:
        assert sc["status"] == "PASS"
        assert (
            sc["elapsed_seconds"] < 60.0
        ), f"Scenario {sc['scenario_id']} exceeded 60s threshold!"
        assert len(sc["steps_executed"]) >= 3
        assert len(sc["verification_evidence"]) > 10
