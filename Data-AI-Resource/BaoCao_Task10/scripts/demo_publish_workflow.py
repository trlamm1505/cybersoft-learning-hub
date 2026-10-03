"""CyberSoft Dataset Registry - End-to-End Demonstration Script.

Demonstrates:
1. Happy Path: Registering 3 canonical benchmark datasets (Sales, HR Ops, RAG QA).
2. Quality Gate Enforcement: Rejecting dirty / corrupt datasets with zero tolerance.
3. Multi-channel Catalog Generation: Markdown, JSON API, and Web Portal.
4. Flexible Querying: Semantic search and multi-tag filtering.
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

SCRIPT_DIR = Path(__file__).resolve().parent
TASK10_DIR = SCRIPT_DIR.parent
TASK_ROOT = TASK10_DIR.parent
sys.path.insert(0, str(TASK10_DIR))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.core.registry_manager import RegistryManager  # noqa: E402
from src.core.state_machine import QualityGateFailedError  # noqa: E402
from src.portal.catalog_generator import CatalogGenerator  # noqa: E402


def run_demo(reset: bool = True) -> bool:
    print("=" * 70)
    print("🚀 CYBERSOFT DATASET REGISTRY v0.1 — END-TO-END VERIFICATION DEMO")
    print("=" * 70)

    db_path = TASK10_DIR / "registry_store" / "registry_db.json"
    if reset and db_path.exists():
        db_path.unlink()

    manager = RegistryManager()
    samples_dir = TASK_ROOT / "BaoCao_Task04" / "metadata_samples"

    # -------------------------------------------------------------
    # STEP 1: Register 3 Canonical Benchmark Datasets (Happy Path)
    # -------------------------------------------------------------
    print("\n[PHASE 1] ĐĂNG KÝ VÀ KIỂM ĐỊNH 3 DATASET BENCHMARK CHÍNH...")

    benchmarks = [
        {
            "id": "ds-retail-ecommerce-sales-v1",
            "manifest": samples_dir / "01_da_ecommerce_sales.json",
            "data_files": [
                TASK_ROOT / "BaoCao_Task06" / "data" / "clean" / "customers.csv",
                TASK_ROOT / "BaoCao_Task06" / "data" / "clean" / "products.csv",
                TASK_ROOT / "BaoCao_Task06" / "data" / "clean" / "orders.csv",
            ],
            "changelog": "Release 1.0.0 - Clean star schema relational sales data",
        },
        {
            "id": "ds-enterprise-hr-operations-v1",
            "manifest": samples_dir / "02_da_hr_operations.json",
            "data_files": [
                TASK_ROOT / "BaoCao_Task07" / "data" / "clean" / "employees.csv",
                TASK_ROOT / "BaoCao_Task07" / "data" / "clean" / "attendance.csv",
                TASK_ROOT / "BaoCao_Task07" / "data" / "clean" / "kpi_evaluations.csv",
            ],
            "changelog": "Release 1.1.0 - 5 relational tables >5,000 records for HR analytics",
        },
        {
            "id": "ds-ai-engineer-rag-eval-v1",
            "manifest": samples_dir / "04_aie_rag_qa_knowledge.json",
            "data_files": [
                TASK_ROOT
                / "BaoCao_Task08"
                / "data"
                / "eval_qa"
                / "rag_eval_questions.json",
            ],
            "changelog": "Release 1.0.0 - 24 corpus documents and 60 QA eval pairs",
        },
    ]

    for b in benchmarks:
        with open(b["manifest"], "r", encoding="utf-8") as mf:
            m_data = json.load(mf)
        b_id = m_data["id"]
        b_ver = m_data.get("version", "1.0.0")

        print(f"\n▶ Xử lý: [{b_id}] (v{b_ver})")
        _ = manager.register_dataset(
            manifest_path=b["manifest"],
            data_files=b["data_files"],
            changelog=b["changelog"],
        )
        print("  1. Đã đăng ký trạng thái: DRAFT")

        # Validate
        res = manager.validate_dataset(b_id, b_ver)
        print(
            f"  2. Chạy Quality Gate: Score = {res.score:.1f}% | Passed = {res.passed}"
        )

        # Publish
        manager.publish_dataset(b_id, b_ver)
        print(f"  3. Xuất bản thành công: PUBLISHED ✓ (Latest: v{b_ver})")

    # -------------------------------------------------------------
    # STEP 2: Negative Test - Quality Gate Enforcement (Dirty Data)
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("[PHASE 2] KIỂM THỬ AN TOÀN: THỬ XUẤT BẢN DỮ LIỆU BẨN (NEGATIVE TEST)")
    print("=" * 70)

    dirty_manifest_path = (
        TASK10_DIR / "registry_store" / "manifests" / "dirty_test_manifest.json"
    )
    dirty_manifest = {
        "id": "ds-dirty-test-quarantine",
        "title": "Quarantine Dirty Sales Test Dataset",
        "description": "Intentionally flawed dataset containing orphaned keys, duplicates, and missing columns.",
        "version": "1.0.0",
        "domain": "retail_ecommerce",
        "level": "beginner",
        "difficulty": "hard",
        "license": "CC-BY-4.0",
        "pii": {
            "level": "low",
            "has_pii": True,
            "anonymization_applied": ["synthetic_generation"],
            "compliance_tags": ["INTERNAL_CYBERSOFT"],
            "handling_instructions": "Internal test only",
        },
        "learning_outcomes": {
            "target_roles": ["qa_engineer"],
            "core_competencies": ["Data Cleaning"],
        },
        "tables": [
            {
                "table_name": "dirty_orders",
                "record_count": 50,
                "column_count": 4,
                "primary_key": ["order_id"],
                "columns": [
                    {
                        "name": "order_id",
                        "data_type": "string",
                        "nullable": False,
                        "description": "Order identifier",
                    },
                    {
                        "name": "customer_id",
                        "data_type": "string",
                        "nullable": True,
                        "description": "Customer",
                    },
                    {
                        "name": "amount",
                        "data_type": "float",
                        "nullable": False,
                        "description": "Amount",
                    },
                    {
                        "name": "status",
                        "data_type": "string",
                        "nullable": False,
                        "description": "Status",
                    },
                ],
            }
        ],
    }

    with open(dirty_manifest_path, "w", encoding="utf-8") as f:
        json.dump(dirty_manifest, f, indent=2)

    dirty_files = [TASK_ROOT / "BaoCao_Task06" / "data" / "dirty" / "orders.csv"]

    manager.register_dataset(
        manifest_path=dirty_manifest_path,
        data_files=dirty_files,
        changelog="Intentional dirty test",
    )
    print("▶ Đã đăng ký dataset bẩn 'ds-dirty-test-quarantine' (DRAFT)")

    try:
        print("▶ Thử ép lệnh PUBLISH mà không khắc phục lỗi...")
        manager.publish_dataset("ds-dirty-test-quarantine", "1.0.0")
        print("❌ LỖI NGHIÊM TRỌNG: Quality Gate đã để lọt dữ liệu bẩn!")
        return False
    except QualityGateFailedError as err:
        print("✅ CHẶN THÀNH CÔNG! Quality Gate từ chối xuất bản đúng theo tiêu chuẩn:")
        print(f"   -> Lý do: {str(err).splitlines()[0]}")

    # Verify state remains REJECTED/DRAFT
    dirty_rec = manager.get_dataset("ds-dirty-test-quarantine")
    assert dirty_rec.latest_published_version is None
    print(
        "   -> Xác nhận: Dataset bẩn KHÔNG có phiên bản nào được xuất bản ra Catalog."
    )

    # -------------------------------------------------------------
    # STEP 3: Generate Multi-channel Catalog
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("[PHASE 3] BIÊN TẬP VÀ XUẤT BẢN MULTI-CHANNEL CATALOG...")
    print("=" * 70)

    gen = CatalogGenerator(manager)
    cat_files = gen.build_all()
    print(f"✓ Đã tạo GitHub Markdown Catalog: {cat_files['markdown'].name}")
    print(f"✓ Đã tạo JSON API Manifest:       {cat_files['json'].name}")
    print(f"✓ Đã tạo Interactive HTML Portal:  {cat_files['html'].name}")

    # -------------------------------------------------------------
    # STEP 4: Query & Semantic Search Verification
    # -------------------------------------------------------------
    print("\n" + "=" * 70)
    print("[PHASE 4] THỬ NGHIỆM TRA CỨU & BỘ LỌC TÌM KIẾM (SEARCH & FILTER)")
    print("=" * 70)

    # Filter 1: Domain HR
    hr_matches = manager.search_datasets(domain="hr_operations")
    print(
        f"• Tìm kiếm domain='hr_operations': Tìm thấy {len(hr_matches)} dataset -> {[d.id for d in hr_matches]}"
    )

    # Filter 2: Role AI Engineer
    ai_matches = manager.search_datasets(role="ai_engineer")
    print(
        f"• Tìm kiếm role='ai_engineer': Tìm thấy {len(ai_matches)} dataset -> {[d.id for d in ai_matches]}"
    )

    # Filter 3: Skill SQL
    sql_matches = manager.search_datasets(skill="SQL")
    print(
        f"• Tìm kiếm skill='SQL': Tìm thấy {len(sql_matches)} dataset -> {[d.id for d in sql_matches]}"
    )

    print("\n" + "=" * 70)
    print("🎉 TOÀN BỘ KỊCH BẢN NGHIỆM THU TASK 10 ĐÃ HOÀN THÀNH XUẤT SẮC!")
    print("=" * 70)
    return True


if __name__ == "__main__":
    success = run_demo()
    sys.exit(0 if success else 1)
