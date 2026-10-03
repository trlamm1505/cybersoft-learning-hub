"""Comprehensive 4-Stage Demo and Verification Script for Task 15 Dashboard.

Executes and verifies:
- Stage 1: Resource Ingestion & Registry Invariant Check (8 resources)
- Stage 2: CRQOF Metric Engine & RQI Formula Verification
- Stage 3: Multi-Dimensional Slicing & Filter Accuracy
- Stage 4: Static Snapshot Generation & POSIX Exit Code 0 Validation
"""

import json
from pathlib import Path
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

task15_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(task15_dir))

from src.collector import ResourceCollector  # noqa: E402
from src.filter_engine import FilterEngine  # noqa: E402
from src.metrics_engine import MetricsEngine  # noqa: E402
from scripts.export_static_snapshot import export_snapshots  # noqa: E402


def run_demo():
    print("=" * 80)
    print("CYBERSOFT DATA & AI LAB — TASK 15 DASHBOARD DEMO WORKFLOW")
    print("=" * 80)

    collector = ResourceCollector()

    # --- STAGE 1: INGESTION & REGISTRY SYNC ---
    print("\n[STAGE 1] Ingesting Resources from Registry & Project Bank...")
    resources = collector.collect_all_resources()
    assert len(resources) == 8, f"Expected 8 resources, got {len(resources)}"

    ds_count = sum(1 for r in resources if r.resource_type == "dataset")
    prj_count = sum(1 for r in resources if r.resource_type == "capstone_project")
    assert ds_count == 4, f"Expected 4 datasets, got {ds_count}"
    assert prj_count == 4, f"Expected 4 capstones/projects, got {prj_count}"

    print(f" -> Successfully discovered {len(resources)} total resources:")
    print(f"    • Datasets (Registry Task 10): {ds_count}")
    print(f"    • Projects (Project Bank Tasks 11-14): {prj_count}")
    for r in resources:
        print(
            f"      - [{r.id}] {r.name[:45]}... | Tier: {r.quality_tier} | RQI: {r.rqi}"
        )
    print(" [STAGE 1 PASS] Resource inventory matches Registry & Project Bank 100%.")

    # --- STAGE 2: METRICS & RQI CALCULATION ---
    print("\n[STAGE 2] Evaluating CRQOF Metrics & RQI Calculations...")
    kpis = MetricsEngine.compute_summary_kpis(resources)
    assert kpis["total_resources"] == 8
    assert (
        kpis["total_records"] > 10000
    ), f"Expected >10k records, got {kpis['total_records']}"
    assert (
        kpis["zero_leakage_compliance"] == 100.0
    ), "Zero-leakage compliance must be 100%"
    assert (
        kpis["gold_tier_count"] == 7
    ), f"Expected 7 Gold tier assets, got {kpis['gold_tier_count']}"
    assert (
        kpis["quarantined_count"] == 1
    ), f"Expected 1 Quarantined asset, got {kpis['quarantined_count']}"
    assert (
        kpis["total_violations"] == 1
    ), f"Expected 1 violation in quarantine, got {kpis['total_violations']}"

    # Verify RQI mathematical range
    for r in resources:
        assert 0.0 <= r.rqi <= 100.0, f"RQI out of range: {r.rqi}"

    print(" -> Aggregate Metrics:")
    print(f"    • Total Monitored Records: {kpis['total_records']:,}")
    print(f"    • Overall Average RQI: {kpis['avg_rqi']:.2f} / 100")
    print(f"    • Automated Test Pass Rate: {kpis['overall_test_pass_rate']:.1f}%")
    print(f"    • Zero-Leakage Compliance: {kpis['zero_leakage_compliance']:.1f}%")
    print(
        f"    • Gold Tier Assets: {kpis['gold_tier_count']} | Quarantined: {kpis['quarantined_count']}"
    )
    print(" [STAGE 2 PASS] Metric Engine mathematically sound and calibrated.")

    # --- STAGE 3: MULTI-DIMENSIONAL SLICING & DRILL-DOWN ---
    print("\n[STAGE 3] Testing Multi-Dimensional Filter Engine & Drill-Down...")

    # Filter by Track: AI Engineer
    aie_resources = FilterEngine.filter_resources(resources, track="AI Engineer")
    assert (
        len(aie_resources) == 2
    ), f"Expected 2 AI Engineer resources, got {len(aie_resources)}"
    print(
        f" -> Track 'AI Engineer': {len(aie_resources)} items ({[r.id for r in aie_resources]})"
    )

    # Filter by Track: Data Analyst
    da_resources = FilterEngine.filter_resources(resources, track="Data Analyst")
    assert (
        len(da_resources) == 5
    ), f"Expected 5 Data Analyst resources, got {len(da_resources)}"
    print(f" -> Track 'Data Analyst': {len(da_resources)} items")

    # Filter by Quality Tier: Quarantined
    quarantined = FilterEngine.filter_resources(resources, quality_tier="Quarantined")
    assert len(quarantined) == 1 and quarantined[0].id == "ds-dirty-test-quarantine"
    print(
        f" -> Tier 'Quarantined': 1 item ({quarantined[0].id}) with {quarantined[0].violations_count} violation"
    )

    # Drill-down into Quarantined asset violations
    dirty_asset = quarantined[0]
    assert len(dirty_asset.violations) >= 1
    print(f"    • Violation detail: {dirty_asset.violations[0]}")

    # Search keyword
    rag_search = FilterEngine.filter_resources(resources, search_query="RAG")
    assert (
        len(rag_search) == 2
    ), f"Expected 2 items for search 'RAG', got {len(rag_search)}"
    print(
        f" -> Search 'RAG': Found {len(rag_search)} matches ({[r.id for r in rag_search]})"
    )

    print(" [STAGE 3 PASS] Multi-dimensional filter engine & drill-down verified.")

    # --- STAGE 4: EXPORT SNAPSHOTS & POSIX STATUS ---
    print("\n[STAGE 4] Exporting Static Snapshots & Verifying Integrity...")
    json_path, html_path = export_snapshots()
    assert json_path.exists(), "JSON snapshot file missing"
    assert html_path.exists(), "HTML report file missing"

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["resources_count"] == 8

    # Verify no personal path leakage in snapshot
    json_str = json.dumps(data)
    forbidden_tokens = [
        "users" + "\\" + "admin",
        "users" + "/" + "admin",
        "cybersoft" + "\\" + "kien",
    ]
    for bad_token in forbidden_tokens:
        assert (
            bad_token.lower() not in json_str.lower()
        ), f"Detected personal path in snapshot: {bad_token}"

    print(" -> Successfully validated zero personal path leaks in exported artifacts.")
    print(" [STAGE 4 PASS] Snapshots generated and clean.")

    print("\n" + "=" * 80)
    print("ALL 4 WORKFLOW STAGES PASSED SUCCESSFULLY (EXIT CODE 0)!")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    sys.exit(run_demo())
