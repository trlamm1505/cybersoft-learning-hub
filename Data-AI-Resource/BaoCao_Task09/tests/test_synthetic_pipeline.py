"""Unit and Integration Test Suite for Task 09 Controlled Synthetic Data Pipeline.

Tests:
1. Valid record schema compliance
2. Rubric sum guardrail violation detection
3. Score vs execution status consistency violation
4. Anti-leakage / placeholder token rejection
5. Bit-exact reproducibility with identical seed
6. Deterministic variance with different seeds
7. Self-correction loop automated recovery
8. Fallback mechanism activation when max retries exceeded
9. Dataset size (100) and track distribution coverage
10. CLI validator execution with exit code 0
"""

from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

# Ensure scripts folder is on sys.path for direct imports
BASE_DIR = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = BASE_DIR / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from generate_controlled_data import ControlledDataGenerator  # noqa: E402
from quality_harness import DataQualityHarness  # noqa: E402


@pytest.fixture(scope="module")
def harness() -> DataQualityHarness:
    schema_path = BASE_DIR / "data_dictionary" / "record_schema.json"
    return DataQualityHarness(schema_path=str(schema_path))


@pytest.fixture(scope="module")
def sample_valid_record(harness: DataQualityHarness) -> dict:
    generator = ControlledDataGenerator(seed=42, base_dir=BASE_DIR)
    record = generator._build_candidate_record(record_idx=0, attempt=0)
    return record


def test_schema_valid_record(harness: DataQualityHarness, sample_valid_record: dict):
    """Ensure a properly constructed record passes all harness guardrails."""
    result = harness.inspect_record(sample_valid_record)
    assert result.passed is True, f"Expected record to pass, got: {result.violations}"
    assert result.error_count == 0


def test_rubric_sum_guardrail_violation(
    harness: DataQualityHarness, sample_valid_record: dict
):
    """Guardrail GR-02-RUBRIC-SUM must catch criteria weights not summing to 100."""
    mutated = copy.deepcopy(sample_valid_record)
    # Alter weights so sum is 120
    criteria = mutated["learning_assessment"]["rubric_criteria"]
    criteria[0]["weight_percent"] = 60
    criteria[1]["weight_percent"] = 60
    mutated["generation_metadata"]["checksum_sha256"] = harness.calculate_checksum(
        mutated
    )

    result = harness.inspect_record(mutated)
    assert result.passed is False
    rule_ids = [v.rule_id for v in result.violations]
    assert "GR-02-RUBRIC-SUM" in rule_ids
    assert "120%" in result.corrective_guidance or "100" in result.corrective_guidance


def test_score_status_consistency_guardrail(
    harness: DataQualityHarness, sample_valid_record: dict
):
    """Guardrail GR-03-SCORE-STATUS must catch incompatible score and execution_status."""
    mutated = copy.deepcopy(sample_valid_record)
    mutated["student_submission"]["execution_status"] = "FAILED_TESTS"
    mutated["student_submission"]["score"] = 95  # Invalid: FAILED_TESTS requires 30-69
    mutated["generation_metadata"]["checksum_sha256"] = harness.calculate_checksum(
        mutated
    )

    result = harness.inspect_record(mutated)
    assert result.passed is False
    rule_ids = [v.rule_id for v in result.violations]
    assert "GR-03-SCORE-STATUS" in rule_ids


def test_anti_leak_prohibited_tokens(
    harness: DataQualityHarness, sample_valid_record: dict
):
    """Guardrail GR-04-ANTI-LEAK must reject records containing placeholder markers."""
    mutated = copy.deepcopy(sample_valid_record)
    mutated["learning_assessment"]["problem_statement"] += " [TODO: Cần kiểm tra lại]"
    mutated["generation_metadata"]["checksum_sha256"] = harness.calculate_checksum(
        mutated
    )

    result = harness.inspect_record(mutated)
    assert result.passed is False
    rule_ids = [v.rule_id for v in result.violations]
    assert "GR-04-ANTI-LEAK" in rule_ids


def test_checksum_tampering_detection(
    harness: DataQualityHarness, sample_valid_record: dict
):
    """Guardrail GR-07-CHECKSUM must detect payload alteration without hash update."""
    mutated = copy.deepcopy(sample_valid_record)
    mutated["student_submission"]["score"] = (
        72  # changed without recalculating checksum
    )

    result = harness.inspect_record(mutated, verify_checksum=True)
    assert result.passed is False
    rule_ids = [v.rule_id for v in result.violations]
    assert "GR-07-CHECKSUM" in rule_ids


def test_reproducibility_bit_exact():
    """Generating dataset with same seed must produce identical canonical JSON."""
    gen1 = ControlledDataGenerator(seed=12345, base_dir=BASE_DIR)
    data1, _ = gen1.synthesize_dataset(count=10, export_files=False)

    gen2 = ControlledDataGenerator(seed=12345, base_dir=BASE_DIR)
    data2, _ = gen2.synthesize_dataset(count=10, export_files=False)

    json1 = json.dumps(data1, sort_keys=True, ensure_ascii=False)
    json2 = json.dumps(data2, sort_keys=True, ensure_ascii=False)
    assert json1 == json2, "Datasets with same seed must be 100% bit-exact."


def test_deterministic_variance_with_different_seeds():
    """Different seeds must produce different students and challenge selections."""
    gen1 = ControlledDataGenerator(seed=101, base_dir=BASE_DIR)
    data1, _ = gen1.synthesize_dataset(count=5, export_files=False)

    gen2 = ControlledDataGenerator(seed=202, base_dir=BASE_DIR)
    data2, _ = gen2.synthesize_dataset(count=5, export_files=False)

    names1 = [r["student_profile"]["full_name"] for r in data1]
    names2 = [r["student_profile"]["full_name"] for r in data2]
    assert names1 != names2, "Different seeds should yield different names."


def test_self_correction_loop_recovery():
    """Injected defect must be caught on attempt 0 and recovered on attempt 1."""
    generator = ControlledDataGenerator(seed=42, base_dir=BASE_DIR)
    dataset, stats = generator.synthesize_dataset(
        count=20, inject_defects_indices=[7, 18], export_files=False
    )
    assert stats["corrected_in_loop"] >= 2
    assert stats["fallback_applied"] == 0

    # Verify that record REC-CYB-0008 is valid in final output
    rec_8 = dataset[7]
    assert rec_8["record_id"] == "REC-CYB-0008"
    assert rec_8["generation_metadata"]["generator_iteration"] == 1
    assert rec_8["generation_metadata"]["validation_status"] == "PASSED"


def test_fallback_mechanism_activation():
    """When retries exceed max_retries, fallback generator must guarantee a valid record."""
    generator = ControlledDataGenerator(seed=42, base_dir=BASE_DIR, max_retries=2)
    dataset, stats = generator.synthesize_dataset(
        count=5, force_fallback_indices=[2], export_files=False
    )
    assert stats["fallback_applied"] == 1

    rec_3 = dataset[2]
    assert rec_3["record_id"] == "REC-CYB-0003"
    assert rec_3["generation_metadata"]["validation_status"] == "FALLBACK_APPLIED"
    assert rec_3["generation_metadata"]["generator_iteration"] == 2

    # Even fallback record must pass schema and guardrails inspection
    harness = DataQualityHarness(
        schema_path=str(BASE_DIR / "data_dictionary" / "record_schema.json")
    )
    res = harness.inspect_record(rec_3)
    assert res.passed is True


def test_dataset_size_and_track_coverage():
    """Ensure dataset has exactly 100 records and all 5 tracks are represented."""
    dataset_file = BASE_DIR / "data" / "synthetic_learning_eval_dataset.json"
    with open(dataset_file, "r", encoding="utf-8") as f:
        dataset = json.load(f)

    assert len(dataset) == 100
    tracks = {r["student_profile"]["track"] for r in dataset}
    expected_tracks = {
        "Fullstack Web",
        "Data & AI Resource Engineer",
        "DevOps Cloud",
        "Cybersecurity SOC",
        "Mobile React Native",
    }
    assert tracks == expected_tracks


def test_cli_validator_exit_code_zero():
    """Run validate_task09_deliverables.py CLI and ensure exit code 0."""
    validator_script = SCRIPTS_DIR / "validate_task09_deliverables.py"
    result = subprocess.run(
        [sys.executable, str(validator_script)],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    assert (
        result.returncode == 0
    ), f"Validator failed with code {result.returncode}:\n{result.stdout}\n{result.stderr}"
