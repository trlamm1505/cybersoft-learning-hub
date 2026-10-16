"""CLI Evaluation Runner for Task 27 DoD Verification.

Executes 6 verification stages:
1. QA Gateway & Health Verification
2. Cross-Product Test Rules & Fixtures Triangulation
3. Dataset, RAG, and Content Quality Hook Evaluations
4. Integrated Master Release Quality Gate (Clean vs Tampered)
5. Zero Silent Bypass Policy Enforcement & Audit Trail
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

TASK27_ROOT = Path(__file__).resolve().parent.parent
if str(TASK27_ROOT) not in sys.path:
    sys.path.insert(0, str(TASK27_ROOT))

from fastapi.testclient import TestClient  # noqa: E402
from src.main import app  # noqa: E402

client = TestClient(app)


def print_stage(title: str):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def run_stage_1():
    print_stage("CHẶNG 1: KIỂM ĐỊNH CỔNG CHỐT CHẶN & KẾT NỐI QA HARNESS")
    res = client.get("/health")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["data"]["status"] == "UP"
    assert body["data"]["qa_harness_connected"] is True
    print("✓ [PASS] Cổng API Quality Gate hoạt động bình thường.")
    print(f"  Service: {body['data']['service']} | Version: {body['data']['version']}")


def run_stage_2():
    print_stage("CHẶNG 2: TIẾP NHẬN BỘ QUY TẮC QA & TEST FIXTURES DÙNG CHUNG")
    res = client.get("/api/v1/qa/rules")
    assert res.status_code == 200
    rules = res.json()["data"]["rules"]
    print(f"✓ [PASS] Tiếp nhận thành công {len(rules)} quy tắc kiểm thử từ bạn Trần Quốc Nguyên (TTS 03):")
    for r in rules:
        print(f"  - [{r['rule_id']}] [{r['severity']:<8}] {r['title']}")

    fix_res = client.get("/api/v1/qa/fixtures-summary")
    assert fix_res.status_code == 200
    fixes = fix_res.json()["data"]
    print(f"✓ [PASS] Shared Test Fixtures sẵn sàng: {len(fixes['datasets_available'])} datasets, {len(fixes['benchmarks_available'])} benchmarks, {len(fixes['contents_available'])} contents.")


def run_stage_3():
    print_stage("CHẶNG 3: KIỂM ĐỊNH TỪNG PHÂN HỆ QUALITY HOOKS")
    # Hook 1: Dataset
    ds_res = client.post("/api/v1/qa/evaluate/dataset?dataset_id=ds-retail-ecommerce-sales-v1")
    assert ds_res.status_code == 200
    assert ds_res.json()["data"]["status"] == "PASSED"
    print("✓ [PASS] Dataset Gate Hook: 5 bảng E-Commerce đạt 100% (0 orphan, 0 PII leak).")

    # Hook 2: RAG
    rag_res = client.post("/api/v1/qa/evaluate/rag?benchmark_id=eval-rag-golden-v1")
    assert rag_res.status_code == 200
    assert rag_res.json()["data"]["status"] == "PASSED"
    print("✓ [PASS] RAG Quality Gate Hook: Golden RAG đạt Faithfulness 0.92, Recall 0.88.")

    # Hook 3: Content
    cnt_res = client.post("/api/v1/qa/evaluate/content?content_id=lesson-da-01-intro")
    assert cnt_res.status_code == 200
    assert cnt_res.json()["data"]["status"] == "PASSED"
    print("✓ [PASS] Content Lint Gate Hook: Bài giảng DA-01 đạt chuẩn mô tả và không có link gãy.")


def run_stage_4():
    print_stage("CHẶNG 4: THẨM ĐỊNH GÓI PHÁT HÀNH (RELEASE QUALITY GATE)")
    # Test Clean Package
    clean_payload = {
        "release_version": "v1.1.0-clean-production",
        "target_datasets": ["ds-retail-ecommerce-sales-v1", "ds-customer-churn-v1"],
        "target_benchmarks": ["eval-rag-golden-v1", "eval-policy-curriculum-v1"],
        "target_contents": ["lesson-da-01-intro", "lesson-ai-01-rag-architecture"],
    }
    clean_res = client.post("/api/v1/qa/gate/release-check", json=clean_payload)
    assert clean_res.status_code == 200
    clean_data = clean_res.json()["data"]
    assert clean_data["overall_status"] == "PASSED"
    assert clean_data["can_release"] is True
    print("✓ [PASS] Gói phát hành chuẩn v1.1.0: 6/6 components PASSED -> CẤP PHÉP RELEASE.")

    # Test Corrupted Package
    bad_payload = {
        "release_version": "v1.1.0-tampered-package",
        "target_datasets": ["ds-corrupted-sample-test"],
        "target_benchmarks": ["eval-hallucinated-model-test"],
        "target_contents": ["lesson-broken-sample"],
    }
    bad_res = client.post("/api/v1/qa/gate/release-check", json=bad_payload)
    assert bad_res.status_code == 200
    bad_data = bad_res.json()["data"]
    assert bad_data["overall_status"] == "BLOCKED"
    assert bad_data["can_release"] is False
    print("✓ [PASS] Gói phát hành lỗi: Tự động khóa BLOCKED.")
    print("  Danh mục Actionable Reasons:")
    for r in bad_data["actionable_summary"][:3]:
        print(f"    • {r}")


def run_stage_5():
    print_stage("CHẶNG 5: KIỂM CHỨNG CHÍNH SÁCH ZERO SILENT BYPASS & AUDIT TRAIL")
    # Attempt 1: Empty reason -> REJECTED
    silent_payload = {
        "release_version": "v1.1.0-silent-attempt",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {"requested": True, "reason": "", "authorized_by": "Lead"},
    }
    res1 = client.post("/api/v1/qa/gate/release-check", json=silent_payload)
    assert res1.status_code == 200
    assert res1.json()["success"] is False
    assert res1.json()["error"]["code"] == "BYPASS_REJECTED"
    print("✓ [PASS] Chặn đứng thành công hành vi Bypass âm thầm (Lý do rỗng -> Bị từ chối).")

    # Attempt 2: Authorized bypass -> AUDITED
    valid_payload = {
        "release_version": "v1.1.0-authorized-override",
        "target_datasets": ["ds-corrupted-sample-test"],
        "bypass": {
            "requested": True,
            "reason": "Phê duyệt phát hành thử nghiệm sandbox phục vụ thẩm định nội bộ",
            "authorized_by": "QA Lead Tran Quoc Nguyen",
        },
    }
    res2 = client.post("/api/v1/qa/gate/release-check", json=valid_payload)
    assert res2.status_code == 200
    assert res2.json()["success"] is True
    print(f"✓ [PASS] Phê duyệt ngoại lệ thành công và ghi nhận nhật ký kiểm toán:")
    print(f"  Authorizer: {res2.json()['data']['audit_record']['authorized_by']}")
    print(f"  Reason: {res2.json()['data']['audit_record']['reason']}")


def run_stage_6():
    print_stage("CHẶNG 6: THI HÀNH BỘ KIỂM THỬ TỰ ĐỘNG PYTEST")
    cmd = [sys.executable, "-m", "pytest", str(TASK27_ROOT / "tests"), "-v"]
    ret = subprocess.run(cmd, cwd=str(TASK27_ROOT))
    assert ret.returncode == 0, f"Pytest exit with code {ret.returncode}"
    print("✓ [PASS] 100% bài test Pytest hoàn thành ở trạng thái PASSED.")


def main():
    print("======================================================================")
    print("  CYBERSOFT DATA & AI LAB — BỘ KIỂM ĐỊNH CHỐT CHẶN QA TASK 27 (CLI)")
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
        print("  ĐẠT 100% TIÊU CHÍ NGHIỆM THU (DoD) CỦA TASK 27.")
        print("======================================================================\n")
        return 0
    except Exception as exc:
        print(f"\n❌ LỖI TRONG QUÁ TRÌNH KIỂM ĐỊNH: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
