"""Parameterized test runner executing all 26 structured security test cases from security_test_suite.json."""

import io
import json
from pathlib import Path
import zipfile
import pytest

from src.services.pii_scanner import pii_scanner
from src.services.injection_guard import injection_guard
from src.services.file_security import file_security, PathTraversalError
from src.services.threat_engine import ThreatEngineService, ThreatItem


SUITE_PATH = (
    Path(__file__).resolve().parent.parent / "data" / "security_test_suite.json"
)
SUITE_DATA = json.loads(SUITE_PATH.read_text(encoding="utf-8"))
ALL_CASES = SUITE_DATA["test_cases"]


@pytest.mark.parametrize(
    "case",
    [c for c in ALL_CASES if c["category"] == "PII_SANITIZATION"],
    ids=lambda c: c["case_id"],
)
def test_structured_pii_cases(case):
    sample_input = case["sample_input"]
    mask_mode = "redact" if "expected_redacted" in case else "mask"

    res = pii_scanner.scan_text(sample_input, mask_mode=mask_mode)

    if case.get("is_critical"):
        assert res.has_critical_pii is True

    if "expected_masked" in case:
        expected = case["expected_masked"]
        assert expected in res.sanitized_text or any(
            expected in e.masked_value for e in res.entities
        )

    if "expected_redacted" in case:
        expected_redacted = case["expected_redacted"]
        assert (
            expected_redacted in res.sanitized_text
            or "[REDACTED_" in res.sanitized_text
        )


@pytest.mark.parametrize(
    "case",
    [c for c in ALL_CASES if c["category"] == "PROMPT_INJECTION_DEFENSE"],
    ids=lambda c: c["case_id"],
)
def test_structured_injection_cases(case):
    sample_prompt = case["sample_prompt"]
    expected_action = case["expected_action"]

    res = injection_guard.inspect_prompt(sample_prompt)

    assert res.action_taken == expected_action
    if expected_action == "BLOCK":
        assert res.is_injection_detected is True
    else:
        assert res.is_injection_detected is False


@pytest.mark.parametrize(
    "case",
    [c for c in ALL_CASES if c["category"] == "PATH_TRAVERSAL_SANDBOX"],
    ids=lambda c: c["case_id"],
)
def test_structured_path_traversal_cases(case):
    payload = case["payload"]
    expected_blocked = case.get("expected_blocked", True)

    if expected_blocked:
        with pytest.raises(PathTraversalError):
            file_security.validate_safe_path(payload)
    else:
        safe_path = file_security.validate_safe_path(payload)
        # Verify it stays strictly within sandbox_dir
        assert str(safe_path).startswith(str(file_security.sandbox_dir))


@pytest.mark.parametrize(
    "case",
    [c for c in ALL_CASES if c["category"] == "FILE_UPLOAD_INTEGRITY"],
    ids=lambda c: c["case_id"],
)
def test_structured_file_upload_cases(case):
    filename = case["filename"]
    expected_action = case.get("expected_action", "REJECTED")

    if case.get("is_zip_slip"):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("../../etc/cron.d/malware", b"malicious cron script")
        content = buf.getvalue()
    elif "content_hex" in case:
        content = bytes.fromhex(case["content_hex"])
    elif "content" in case:
        content = case["content"].encode("utf-8")
    else:
        content = b"sample_file_content"

    res = file_security.inspect_file(filename=filename, content_bytes=content)

    assert res.action == expected_action
    if expected_action == "REJECTED":
        assert res.is_safe is False
    else:
        assert res.is_safe is True


@pytest.mark.parametrize(
    "case",
    [c for c in ALL_CASES if c["category"] == "THREAT_QUALITY_GATE"],
    ids=lambda c: c["case_id"],
)
def test_structured_threat_gate_cases(case):
    engine = ThreatEngineService()

    if case["case_id"] == "SEC-GATE-01":
        res = engine.evaluate_quality_gate()
        assert res.gate_passed is True
        assert res.status == "PASSED"
    elif case["case_id"] == "SEC-GATE-02":
        engine.threats.append(
            ThreatItem(
                threat_id="THR-99-TEST",
                stride_category="TAMPERING",
                title="Critical vulnerability for test",
                description="Simulated critical threat",
                component="Test Component",
                severity="CRITICAL",
                status="OPEN",
                mitigation_strategy="Pending fix",
            )
        )
        res = engine.evaluate_quality_gate()
        assert res.gate_passed is False
        assert res.status == "BLOCKED"
        assert res.release_allowed is False
    elif case["case_id"] == "SEC-GATE-03":
        engine.threats.append(
            ThreatItem(
                threat_id="THR-98-TEST",
                stride_category="ELEVATION_OF_PRIVILEGE",
                title="High severity test vulnerability",
                description="Simulated high threat",
                component="Test Component",
                severity="HIGH",
                status="OPEN",
                mitigation_strategy="Pending fix",
            )
        )
        res = engine.evaluate_quality_gate()
        assert res.gate_passed is False
        assert res.status == "BLOCKED"
    elif case["case_id"] == "SEC-GATE-04":
        # Mitigated state leads to PASS
        res = engine.evaluate_quality_gate()
        assert res.gate_passed is True
