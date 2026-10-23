"""Unit and integration tests for STRIDE Threat Engine and Security Quality Gate."""

from src.services.threat_engine import ThreatEngineService
from src.schemas.security import ThreatItem


def test_default_threat_model_quality_gate_passed(threat_service: ThreatEngineService):
    tm = threat_service.get_threat_model()
    assert tm.total_threats == 10
    assert tm.quality_gate_passed is True
    assert tm.unresolved_critical_high == 0

    gate = threat_service.evaluate_quality_gate()
    assert gate.gate_passed is True
    assert gate.status == "PASSED"
    assert gate.release_allowed is True


def test_quality_gate_blocked_when_critical_threat_open():
    critical_threat = ThreatItem(
        threat_id="TEST-CRIT-01",
        stride_category="INFORMATION_DISCLOSURE",
        title="Unpatched real database credentials leak",
        description="Credentials exposed in test script",
        component="Database",
        severity="CRITICAL",
        status="OPEN",
        mitigation_strategy="Pending vault integration",
    )
    engine = ThreatEngineService(threats=[critical_threat])
    gate = engine.evaluate_quality_gate()
    assert gate.gate_passed is False
    assert gate.status == "BLOCKED"
    assert gate.release_allowed is False
    assert gate.open_critical_count == 1
    assert any("CRITICAL VULNERABILITY OPEN" in r for r in gate.blocked_reasons)


def test_quality_gate_blocked_when_high_threat_open():
    high_threat = ThreatItem(
        threat_id="TEST-HIGH-01",
        stride_category="DENIAL_OF_SERVICE",
        title="Uncapped batch search endpoint",
        description="Client can request 1 million embeddings at once",
        component="Embedding Service",
        severity="HIGH",
        status="OPEN",
        mitigation_strategy="Pending rate limiter",
    )
    engine = ThreatEngineService(threats=[high_threat])
    gate = engine.evaluate_quality_gate()
    assert gate.gate_passed is False
    assert gate.status == "BLOCKED"
    assert gate.open_high_count == 1
    assert gate.release_allowed is False


def test_quality_gate_passed_after_mitigation():
    patched_threat = ThreatItem(
        threat_id="TEST-FIX-01",
        stride_category="ELEVATION_OF_PRIVILEGE",
        title="Directory traversal vulnerability",
        description="Path traversal in file reader",
        component="File Reader",
        severity="CRITICAL",
        status="PATCHED",
        mitigation_strategy="Resolved via validate_safe_path sandbox",
    )
    engine = ThreatEngineService(threats=[patched_threat])
    gate = engine.evaluate_quality_gate()
    assert gate.gate_passed is True
    assert gate.status == "PASSED"
    assert gate.release_allowed is True
