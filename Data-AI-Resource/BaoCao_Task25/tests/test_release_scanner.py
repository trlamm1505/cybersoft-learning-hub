"""Unit tests for Task 24 -> Task 25 Release Security Scanner and Quality Gate."""

from pathlib import Path
from src.services.release_scanner import ReleaseScannerService


def test_scan_official_task24_release_v110(tmp_path):
    scanner = ReleaseScannerService()
    manifest_path = Path(
        "Data-AI-Resource/BaoCao_Task24/data/releases/release_manifest_v1.1.0.json"
    )

    report = scanner.scan_release_manifest(manifest_path)

    assert report.release_version == "v1.1.0"
    assert report.total_components_checked == 16
    assert report.integrity_verified_count == 16
    assert report.hash_tampered_count == 0
    assert report.pii_violations_count == 0
    assert report.injection_violations_count == 0
    assert report.quality_gate_passed is True
    assert report.status == "PASSED"
    assert "PASSED" in report.verdict_message


def test_scan_official_task24_release_v100(tmp_path):
    scanner = ReleaseScannerService()
    manifest_path = Path(
        "Data-AI-Resource/BaoCao_Task24/data/releases/release_manifest_v1.0.0.json"
    )

    report = scanner.scan_release_manifest(manifest_path)

    assert report.release_version == "v1.0.0"
    assert report.total_components_checked == 13
    assert report.integrity_verified_count == 13
    assert report.hash_tampered_count == 0
    assert report.quality_gate_passed is True
    assert report.status == "PASSED"


def test_scan_tampered_release_manifest_blocked():
    scanner = ReleaseScannerService()
    manifest_path = Path(
        "Data-AI-Resource/BaoCao_Task25/data/test_payloads/tampered_release_manifest.json"
    )
    artifacts_base = Path("Data-AI-Resource/BaoCao_Task25")

    report = scanner.scan_release_manifest(
        manifest_path, artifacts_base_dir=artifacts_base
    )

    assert report.quality_gate_passed is False
    assert report.status == "BLOCKED"
    assert report.hash_tampered_count >= 1
    assert report.pii_violations_count >= 1
    assert report.injection_violations_count >= 1
    assert len(report.findings) >= 3
    assert "BLOCKED" in report.verdict_message
