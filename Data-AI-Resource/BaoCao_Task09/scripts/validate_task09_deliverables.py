"""Comprehensive CLI Validator for Task 09 Deliverables.

Performs 6 rigorous quality gate stages:
1. Directory and Essential Files Existence Check
2. Schemas and Prompt Versioning Validation
3. Synthetic Dataset Quality & Guardrails Verification (100/100 records)
4. Bit-Exact Reproducibility Check (Re-generation with identical seed)
5. Self-Correction Loop & Audit Log Verification
6. Data Parity Check between JSON and CSV exports

Complies with POSIX exit codes:
- 0: SUCCESS (All 6 stages passed 100%)
- 1: QUALITY_VIOLATION (Schema, guardrails, or parity mismatch)
- 2: SYSTEM_ERROR (Missing files, unreadable formats, or exceptions)
"""

from __future__ import annotations

import csv
import hashlib
import json
import sys
from pathlib import Path
from typing import Dict

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if sys.stderr.encoding != "utf-8":
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

try:
    from .quality_harness import DataQualityHarness
    from .generate_controlled_data import ControlledDataGenerator
except ImportError:
    from quality_harness import DataQualityHarness
    from generate_controlled_data import ControlledDataGenerator


def run_validation() -> int:
    base_dir = Path(__file__).resolve().parent.parent
    print("=" * 80)
    print(" CYBERSOFT DATA & AI RESOURCE QUALITY GATE — TASK 09 VALIDATOR")
    print(" Pipeline sinh dữ liệu có kiểm soát bằng AI & Data Quality Harness")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # STAGE 1: Directory and Essential Files Existence Check
    # -------------------------------------------------------------------------
    print("\n[STAGE 1] Checking Directory & Essential Files Existence...")
    required_files = [
        base_dir / "README.md",
        base_dir / "AI_WORKLOG.md",
        base_dir / "09_ai_controlled_synthetic_data_pipeline.md",
        base_dir / "data" / "synthetic_learning_eval_dataset.json",
        base_dir / "data" / "synthetic_learning_eval_dataset.csv",
        base_dir / "data" / "logs" / "error_correction_loop.log",
        base_dir / "data" / "logs" / "correction_summary.json",
        base_dir / "data_dictionary" / "record_schema.json",
        base_dir / "data_dictionary" / "record_schema.md",
        base_dir / "data_dictionary" / "error_feedback_schema.json",
        base_dir / "data_dictionary" / "harness_config_schema.json",
        base_dir / "prompts" / "system_instructions.md",
        base_dir / "prompts" / "v1_zero_shot.json",
        base_dir / "prompts" / "v2_few_shot_constrained.json",
        base_dir / "prompts" / "prompt_changelog.md",
        base_dir / "docs" / "loop_engineering_architecture.md",
        base_dir / "docs" / "quality_guardrails_specification.md",
        base_dir / "docs" / "reproducibility_guarantee.md",
        base_dir / "scripts" / "quality_harness.py",
        base_dir / "scripts" / "generate_controlled_data.py",
        base_dir / "scripts" / "validate_task09_deliverables.py",
        base_dir / "tests" / "test_synthetic_pipeline.py",
    ]

    missing = [f for f in required_files if not f.exists()]
    if missing:
        print(f"  [ERROR] Missing {len(missing)} essential file(s):")
        for m in missing:
            print(f"    - {m.relative_to(base_dir)}")
        return 2

    print(f"  -> All {len(required_files)} essential files exist.")

    # -------------------------------------------------------------------------
    # STAGE 2: Schemas & Prompt Versioning Validation
    # -------------------------------------------------------------------------
    print("\n[STAGE 2] Validating Schemas and Prompt Versioning Files...")
    try:
        with open(
            base_dir / "data_dictionary" / "record_schema.json", "r", encoding="utf-8"
        ) as f:
            schema_data = json.load(f)
            assert "$schema" in schema_data and "properties" in schema_data

        with open(
            base_dir / "prompts" / "v1_zero_shot.json", "r", encoding="utf-8"
        ) as f:
            p1 = json.load(f)
            assert p1.get("type") == "zero_shot"

        with open(
            base_dir / "prompts" / "v2_few_shot_constrained.json", "r", encoding="utf-8"
        ) as f:
            p2 = json.load(f)
            assert p2.get("type") == "few_shot_constrained"
            assert "invariants" in p2
        print("  -> Schemas and prompt templates validated successfully.")
    except Exception as e:
        print(f"  [FAIL] Schema / Prompt validation error: {e}")
        return 1

    # -------------------------------------------------------------------------
    # STAGE 3: Synthetic Dataset Quality & Guardrails Verification
    # -------------------------------------------------------------------------
    print("\n[STAGE 3] Validating 100 Synthetic Records with DataQualityHarness...")
    json_dataset_path = base_dir / "data" / "synthetic_learning_eval_dataset.json"
    with open(json_dataset_path, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    if not isinstance(dataset, list) or len(dataset) != 100:
        print(f"  [FAIL] Dataset must contain exactly 100 records, got {len(dataset)}.")
        return 1

    harness = DataQualityHarness(
        schema_path=str(base_dir / "data_dictionary" / "record_schema.json")
    )
    violations_found = 0
    track_distribution: Dict[str, int] = {}

    for idx, record in enumerate(dataset):
        res = harness.inspect_record(record, verify_checksum=True)
        if not res.passed:
            violations_found += res.error_count
            print(
                f"  [FAIL] Record #{idx+1} ({res.record_id}): {res.corrective_guidance}"
            )

        track = record.get("student_profile", {}).get("track", "Unknown")
        track_distribution[track] = track_distribution.get(track, 0) + 1

    if violations_found > 0:
        print(
            f"  [FAIL] Detected {violations_found} quality guardrail violation(s) in dataset."
        )
        return 1

    print("  -> All 100 records PASSED schema and guardrails inspection 100%!")
    print(f"  -> Track distribution: {track_distribution}")

    # -------------------------------------------------------------------------
    # STAGE 4: Bit-Exact Reproducibility Check
    # -------------------------------------------------------------------------
    print("\n[STAGE 4] Validating Bit-Exact Reproducibility (Seed=42)...")
    gen_check = ControlledDataGenerator(seed=42, base_dir=base_dir)
    reproduced_dataset, _ = gen_check.synthesize_dataset(count=100)

    original_canonical = json.dumps(dataset, sort_keys=True, ensure_ascii=False)
    reproduced_canonical = json.dumps(
        reproduced_dataset, sort_keys=True, ensure_ascii=False
    )

    orig_hash = hashlib.sha256(original_canonical.encode("utf-8")).hexdigest()
    repo_hash = hashlib.sha256(reproduced_canonical.encode("utf-8")).hexdigest()

    if orig_hash != repo_hash:
        print(
            f"  [FAIL] Reproducibility mismatch! Original: {orig_hash}, Re-generated: {repo_hash}"
        )
        return 1

    print(
        f"  -> Bit-Exact Reproducibility VERIFIED! Dataset SHA-256: {orig_hash[:16]}... (100% match)"
    )

    # -------------------------------------------------------------------------
    # STAGE 5: Self-Correction Loop & Audit Log Verification
    # -------------------------------------------------------------------------
    print("\n[STAGE 5] Checking Self-Correction Loop Logs & Summary...")
    log_path = base_dir / "data" / "logs" / "error_correction_loop.log"
    summary_path = base_dir / "data" / "logs" / "correction_summary.json"

    with open(summary_path, "r", encoding="utf-8") as f:
        summary = json.load(f)

    with open(log_path, "r", encoding="utf-8") as f:
        log_content = f.read()

    assert summary.get("total_requested") == 100
    assert (
        summary.get("corrected_in_loop", 0) > 0
    ), "Expected at least 1 self-corrected record in loop demonstration"
    assert "SELF-CORRECTED" in log_content

    print(
        f"  -> Initial pass rate (iter 0): {summary.get('passed_immediate_iter0')}/100"
    )
    print(f"  -> Corrected via loop:        {summary.get('corrected_in_loop')}/100")
    print(f"  -> Fallback applied:          {summary.get('fallback_applied')}/100")
    print(f"  -> Total retries logged:      {summary.get('total_retries_executed')}")

    # -------------------------------------------------------------------------
    # STAGE 6: Data Parity Check between JSON and CSV
    # -------------------------------------------------------------------------
    print("\n[STAGE 6] Validating Data Parity between JSON and CSV...")
    csv_path = base_dir / "data" / "synthetic_learning_eval_dataset.csv"
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        csv_rows = list(reader)

    if len(csv_rows) != len(dataset):
        print(
            f"  [FAIL] CSV row count ({len(csv_rows)}) does not match JSON count ({len(dataset)})."
        )
        return 1

    for i in range(len(dataset)):
        assert csv_rows[i]["record_id"] == dataset[i]["record_id"]
        assert csv_rows[i]["student_id"] == dataset[i]["student_profile"]["student_id"]
        assert int(csv_rows[i]["score"]) == dataset[i]["student_submission"]["score"]

    print("  -> CSV and JSON 100% aligned across all 100 records.")

    # -------------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print(" TASK 09 VALIDATION SUMMARY REPORT")
    print("=" * 80)
    print("  - Total Synthetic Records:     100 (DoD requirement: 100)")
    print("  - Schema & Guardrail Quality:  100% PASSED (0 critical violations)")
    print("  - Reproducibility (Seed=42):   100% BIT-EXACT MATCH")
    print(
        f"  - Self-Correction Loop Events: {summary.get('corrected_in_loop')} records successfully recovered"
    )
    print("  - JSON & CSV Data Parity:      100% ALIGNED")
    print("  - Exit Code:                   0 (SUCCESS)")
    print("\n[PASS] ALL ACCEPTANCE CRITERIA SATISFIED 100%! READY FOR PRODUCTION.")
    return 0


def main():
    exit_code = run_validation()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
