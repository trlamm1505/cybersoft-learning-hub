"""CLI Evaluation Runner for Task 26 DoD Verification.

Executes 6 verification stages:
1. Health & Gateway Verification
2. Cross-Product Catalog Discovery
3. Data Contract Compliance with Learning Hub
4. Immutable Versioned Assignment & Snapshot Freezing
5. Actionable Version Mismatch & Deprecation Guardrails
6. Pytest Automated Suite Execution (100% Pass)
"""

import sys
import subprocess
from pathlib import Path

# Ensure UTF-8 output
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
from fastapi.testclient import TestClient

TASK26_ROOT = Path(__file__).resolve().parent.parent
if str(TASK26_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK26_ROOT))

from src.main import app  # noqa: E402
from src.schemas.integration import AssignmentResolveRequest, AssignmentValidateRequest  # noqa: E402
from src.services.integration_service import version_resolver, VersionResolutionError  # noqa: E402

client = TestClient(app)


def print_stage(title: str):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def run_stage_1():
    print_stage("CHẶNG 1: KIỂM ĐỊNH CỔNG DỊCH VỤ & HEALTH CHECK")
    res = client.get("/health")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "UP"
    print("✓ [PASS] Cổng API tích hợp Gateway hoạt động bình thường.")
    print(f"  Service: {body['data']['service']} | Version: {body['data']['version']}")


def run_stage_2():
    print_stage("CHẶNG 2: DANH MỤC TÀI NGUYÊN (CATALOG DISCOVERY)")
    res = client.get("/api/v1/integration/catalog")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    print(f"✓ [PASS] Truy vấn thành công {len(items)} tài nguyên chuẩn hóa:")
    for it in items:
        print(
            f"  - [{it['type'].upper():<16}] {it['resource_id']:<30} (Ver: {it['current_version']}, Roles: {', '.join(it['target_roles'])})"
        )


def run_stage_3():
    print_stage("CHẶNG 3: ĐỐI SOÁT HỢP ĐỒNG DỮ LIỆU VỚI LEARNING HUB")
    res = client.get("/api/v1/integration/contract-summary")
    assert res.status_code == 200
    contracts = res.json()["data"]["contracts"]
    all_valid = all(c["contract_valid"] for c in contracts)
    assert all_valid, "Có tài nguyên không hợp lệ với contract!"
    print(
        f"✓ [PASS] 100% {len(contracts)}/{len(contracts)} tài nguyên thỏa mãn hợp đồng Data Contract."
    )
    print("  Khớp chính xác cấu trúc RegistryDictionaryTable & RegistryEnvelope.")


def run_stage_4():
    print_stage("CHẶNG 4: KHÓA BẤT BIẾN BÀI TẬP (IMMUTABLE SNAPSHOT)")
    req = AssignmentResolveRequest(
        resource_id="ds-retail-ecommerce-sales-v1",
        requested_version="v1.0.0",
        class_id="CLASS-DA-HCM-01",
        exercise_slug="da-sql-lab-01",
    )
    resolved = version_resolver.resolve_assignment(req)
    assert resolved.resolved_version == "v1.0.0"
    assert resolved.is_immutable_locked is True
    print("✓ [PASS] Giảng viên giao bài thành công. Snapshot đã được khóa bất biến:")
    print(f"  Class ID: CLASS-DA-HCM-01 | Resource: {resolved.resource_id}")
    print(
        f"  Resolved Version: {resolved.resolved_version} | SHA-256: {resolved.snapshot_hash}"
    )

    val_req = AssignmentValidateRequest(
        resource_id="ds-retail-ecommerce-sales-v1",
        assigned_version="v1.0.0",
        snapshot_hash=resolved.snapshot_hash,
    )
    val_res = version_resolver.validate_assignment(val_req)
    assert val_res.valid is True
    assert val_res.version_drift_detected is True
    print(f"✓ [PASS] Đối soát tái lập: {val_res.message}")


def run_stage_5():
    print_stage("CHẶNG 5: KIỂM THỬ XỬ LÝ VERSION MISMATCH & DEPRECATION")
    # Test 1: Version not found
    try:
        req_missing = AssignmentResolveRequest(
            resource_id="ds-retail-ecommerce-sales-v1",
            requested_version="v9.9.9",
        )
        version_resolver.resolve_assignment(req_missing)
        assert False, "Should have raised VersionResolutionError"
    except VersionResolutionError as e:
        assert e.code == "VERSION_NOT_FOUND"
        print("✓ [PASS] Bắt lỗi VERSION_NOT_FOUND thành công:")
        print(f"  Message: {e.message}")
        print(f"  Gợi ý khắc phục: {e.suggested_action}")

    # Test 2: Version deprecated
    try:
        req_dep = AssignmentResolveRequest(
            resource_id="ds-retail-ecommerce-sales-v1",
            requested_version="v0.9.0-beta",
        )
        version_resolver.resolve_assignment(req_dep)
        assert False, "Should have raised VersionResolutionError"
    except VersionResolutionError as e:
        assert e.code == "VERSION_DEPRECATED"
        print("✓ [PASS] Bắt lỗi VERSION_DEPRECATED thành công:")
        print(f"  Message: {e.message}")
        print(f"  Lý do ngừng hỗ trợ: {e.details['deprecated_reason']}")


def run_stage_6():
    print_stage("CHẶNG 6: THI HÀNH BỘ KIỂM THỬ TỰ ĐỘNG PYTEST")
    cmd = [sys.executable, "-m", "pytest", str(TASK26_ROOT / "tests"), "-v"]
    ret = subprocess.run(cmd, cwd=str(TASK26_ROOT))
    assert ret.returncode == 0, f"Pytest exit with code {ret.returncode}"
    print("✓ [PASS] 100% bài test Pytest hoàn thành ở trạng thái PASSED.")


def main():
    print("======================================================================")
    print("  CYBERSOFT DATA & AI LAB — BỘ KIỂM ĐỊNH TÍCH HỢP TASK 26 (CLI)")
    print("  Vai trò: Data & AI Resource Engineer (Đào Trung Kiên)")
    print("======================================================================")
    try:
        run_stage_1()
        run_stage_2()
        run_stage_3()
        run_stage_4()
        run_stage_5()
        run_stage_6()
        print("\n" + "=" * 70)
        print("  KẾT QUẢ TỔNG THỂ: 6/6 CHẶNG THẨM ĐỊNH THÀNH CÔNG RỰC RỠ!")
        print("  ĐẠT 100% TIÊU CHÍ NGHIỆM THU (DoD) CỦA TASK 26.")
        print(
            "======================================================================\n"
        )
        return 0
    except Exception as exc:
        print(f"\n❌ LỖI TRONG QUÁ TRÌNH KIỂM ĐỊNH: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
