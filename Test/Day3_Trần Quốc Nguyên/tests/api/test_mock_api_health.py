import pytest


@pytest.mark.smoke
def test_mock_learning_platform_health_ok(learning_platform):
    assert learning_platform["system"] == "learning-hub"
    assert learning_platform["status"] == "ok"
    assert learning_platform["version"]
    assert learning_platform["health"]["api"] == "ok"
    assert learning_platform["health"]["database"] == "ok"


@pytest.mark.smoke
def test_critical_learning_flows_are_enabled(learning_platform):
    required_flows = {"course_catalog", "quiz_attempt", "code_submission"}
    flows = {flow["name"]: flow for flow in learning_platform["critical_flows"]}

    assert required_flows.issubset(flows.keys())
    assert all(flows[name]["enabled"] is True for name in required_flows)

