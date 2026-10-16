"""Release Security Scanner Service (Task 24 -> Task 25 Integration).

Scans official release manifests produced by Task 24 (Lineage & WORM Store):
1. Verifies cryptographic SHA-256 integrity of all release artifacts against the manifest.
2. Scans datasets and exercises for sensitive PII exposure.
3. Inspects RAG knowledge chunks and prompt templates for indirect prompt injection and secret leaks.
4. Produces a verifiable Security Quality Gate verdict (PASSED / BLOCKED).
"""

import hashlib
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from src.services.pii_scanner import pii_scanner
from src.services.injection_guard import injection_guard


class ReleaseArtifactFinding(BaseModel):
    artifact_id: str
    artifact_type: str
    relative_path: str
    check_type: str  # INTEGRITY, PII, INJECTION
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    description: str
    details: Dict[str, Any] = Field(default_factory=dict)


class ReleaseScanAuditReport(BaseModel):
    manifest_file: str
    release_version: str
    release_name: str
    total_components_checked: int
    integrity_verified_count: int
    hash_tampered_count: int
    pii_violations_count: int
    injection_violations_count: int
    findings: List[ReleaseArtifactFinding]
    quality_gate_passed: bool
    status: str  # PASSED or BLOCKED
    verdict_message: str


class ReleaseScannerService:
    """Evaluates release packages against cybersecurity and privacy quality gates."""

    def __init__(self, workspace_root: Optional[Path] = None):
        self.task25_dir = Path(__file__).resolve().parent.parent.parent
        self.task24_dir = self.task25_dir.parent / "BaoCao_Task24"
        if workspace_root is None:
            self.workspace_root = self.task25_dir.parent.parent
        else:
            self.workspace_root = workspace_root

    def scan_release_manifest(
        self, manifest_path: Path, artifacts_base_dir: Optional[Path] = None
    ) -> ReleaseScanAuditReport:
        if not manifest_path.is_absolute():
            if (self.workspace_root / manifest_path).exists():
                manifest_path = self.workspace_root / manifest_path
            elif (self.task25_dir / manifest_path).exists():
                manifest_path = self.task25_dir / manifest_path
            elif Path(manifest_path).resolve().exists():
                manifest_path = Path(manifest_path).resolve()

        if not manifest_path.exists():
            raise FileNotFoundError(f"Release manifest not found at: {manifest_path}")

        manifest_data = json.loads(manifest_path.read_text(encoding="utf-8"))
        release_version = manifest_data.get("version", "unknown")
        release_name = manifest_data.get("release_name", "CyberSoft Release")
        components = manifest_data.get("components", {})

        if artifacts_base_dir is None:
            # Default to Task 24 base dir
            artifacts_base_dir = self.task24_dir
        elif not artifacts_base_dir.is_absolute():
            if (self.workspace_root / artifacts_base_dir).exists():
                artifacts_base_dir = self.workspace_root / artifacts_base_dir
            elif (self.task25_dir / artifacts_base_dir).exists():
                artifacts_base_dir = self.task25_dir / artifacts_base_dir
            elif Path(artifacts_base_dir).resolve().exists():
                artifacts_base_dir = Path(artifacts_base_dir).resolve()

        findings: List[ReleaseArtifactFinding] = []
        integrity_ok = 0
        hash_tampered = 0
        pii_violations = 0
        injection_violations = 0

        for comp_id, comp_meta in components.items():
            rel_path = comp_meta.get("storage_path", "")
            expected_hash = comp_meta.get("content_hash", "")
            art_type = comp_meta.get("artifact_type", "unknown")

            file_path = artifacts_base_dir / rel_path

            # 1. Check file existence & SHA-256 integrity
            if not file_path.exists():
                findings.append(
                    ReleaseArtifactFinding(
                        artifact_id=comp_id,
                        artifact_type=art_type,
                        relative_path=rel_path,
                        check_type="INTEGRITY",
                        severity="CRITICAL",
                        description=f"Artifact payload file missing: {rel_path}",
                    )
                )
                hash_tampered += 1
                continue

            content_bytes = file_path.read_bytes()
            actual_hash = hashlib.sha256(content_bytes).hexdigest()

            if actual_hash != expected_hash:
                findings.append(
                    ReleaseArtifactFinding(
                        artifact_id=comp_id,
                        artifact_type=art_type,
                        relative_path=rel_path,
                        check_type="INTEGRITY",
                        severity="CRITICAL",
                        description=f"SHA-256 mismatch (Tampered WORM content): expected {expected_hash[:12]}... got {actual_hash[:12]}...",
                        details={"expected": expected_hash, "actual": actual_hash},
                    )
                )
                hash_tampered += 1
            else:
                integrity_ok += 1

            # Try to decode content for text scanning
            try:
                content_text = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                continue

            # 2. PII Scan on datasets and exercises
            if art_type in ("dataset", "exercise") or file_path.suffix in (
                ".csv",
                ".json",
            ):
                pii_res = pii_scanner.scan_text(content_text, source_name=comp_id)
                critical_entities = [
                    e for e in pii_res.entities if e.risk_level in ("CRITICAL", "HIGH")
                ]
                if critical_entities:
                    pii_violations += len(critical_entities)
                    findings.append(
                        ReleaseArtifactFinding(
                            artifact_id=comp_id,
                            artifact_type=art_type,
                            relative_path=rel_path,
                            check_type="PII",
                            severity="CRITICAL" if pii_res.has_critical_pii else "HIGH",
                            description=f"Detected {len(critical_entities)} sensitive unmasked PII entities in release payload",
                            details={
                                "entities": [
                                    {
                                        "type": e.entity_type,
                                        "masked": e.masked_value,
                                        "risk": e.risk_level,
                                    }
                                    for e in critical_entities
                                ]
                            },
                        )
                    )

            # 3. Injection Scan on prompts and knowledge chunks
            if art_type in ("prompt", "dataset") or file_path.suffix in (
                ".txt",
                ".md",
                ".csv",
            ):
                inj_res = injection_guard.inspect_prompt(content_text)
                if inj_res.is_injection_detected and inj_res.action_taken == "BLOCK":
                    injection_violations += 1
                    findings.append(
                        ReleaseArtifactFinding(
                            artifact_id=comp_id,
                            artifact_type=art_type,
                            relative_path=rel_path,
                            check_type="INJECTION",
                            severity=inj_res.risk_level,
                            description=f"Adversarial prompt injection pattern detected in release artifact ({', '.join(inj_res.attack_categories)})",
                            details={
                                "indicators": [
                                    i.description for i in inj_res.indicators
                                ]
                            },
                        )
                    )

        # Quality Gate condition: zero Critical and zero High findings
        open_critical_high = [f for f in findings if f.severity in ("CRITICAL", "HIGH")]
        gate_passed = len(open_critical_high) == 0

        verdict_msg = (
            f"PASSED: Gói phát hành {release_version} đạt chuẩn an toàn 100%. "
            f"Tất cả {len(components)} thành phần toàn vẹn, không rò rỉ PII và không chứa prompt injection."
            if gate_passed
            else f"BLOCKED: Gói phát hành {release_version} bị chặn bởi Security Quality Gate. "
            f"Phát hiện {len(open_critical_high)} vi phạm an ninh mức độ Critical/High cần xử lý."
        )

        return ReleaseScanAuditReport(
            manifest_file=manifest_path.name,
            release_version=release_version,
            release_name=release_name,
            total_components_checked=len(components),
            integrity_verified_count=integrity_ok,
            hash_tampered_count=hash_tampered,
            pii_violations_count=pii_violations,
            injection_violations_count=injection_violations,
            findings=findings,
            quality_gate_passed=gate_passed,
            status="PASSED" if gate_passed else "BLOCKED",
            verdict_message=verdict_msg,
        )


release_scanner = ReleaseScannerService()
