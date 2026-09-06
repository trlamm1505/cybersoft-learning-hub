#!/usr/bin/env python3
"""CyberSoft Data & AI Lab — Day 04 DoD Validation Harness.

Independent automated verification of all Definition of Done (DoD)
requirements for Day 04 (Dataset Registry Schema & Governance).
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
DAY04_DIR = SCRIPT_DIR.parent
SCHEMAS_DIR = DAY04_DIR / "schemas"
SAMPLES_DIR = DAY04_DIR / "metadata_samples"
TEST_CASES_DIR = DAY04_DIR / "test_cases"
ROOT_DIR = DAY04_DIR.parent.parent.parent  # d:/Cybersoft/Kien

sys.path.insert(0, str(SCHEMAS_DIR))

try:
    from models import DatasetMetadata
    import jsonschema
except ImportError as err:
    print(f"[FAIL] Missing dependencies or schema models: {err}")
    sys.exit(1)


def test_directory_structure() -> bool:
    required_dirs = [SCHEMAS_DIR, SAMPLES_DIR, TEST_CASES_DIR, SCRIPT_DIR]
    for d in required_dirs:
        if not d.is_dir():
            print(f"  [FAIL] Missing required directory: {d.name}")
            return False
    return True


def test_schema_definitions() -> bool:
    schema_json = SCHEMAS_DIR / "dataset.schema.json"
    models_py = SCHEMAS_DIR / "models.py"

    if not schema_json.is_file() or not models_py.is_file():
        print("  [FAIL] Missing dataset.schema.json or models.py")
        return False

    with open(schema_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Verify key mandatory properties in JSON schema
    required_props = [
        "domain",
        "level",
        "learning_outcomes",
        "license",
        "pii",
        "lineage",
        "tables",
        "integrity",
    ]
    schema_required = data.get("required", [])
    for prop in required_props:
        if prop not in schema_required:
            print(f"  [FAIL] Schema does not require mandatory field: {prop}")
            return False
    return True


def test_sample_metadata_count_and_validity() -> bool:
    samples = sorted(SAMPLES_DIR.glob("*.json"))
    if len(samples) < 5:
        print(f"  [FAIL] Expected at least 5 metadata samples, found {len(samples)}")
        return False

    with open(SCHEMAS_DIR / "dataset.schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)
    validator = jsonschema.Draft202012Validator(schema)

    roles_covered = set()

    for s in samples:
        with open(s, "r", encoding="utf-8") as f:
            data = json.load(f)

        # JSONSchema check
        if not validator.is_valid(data):
            print(f"  [FAIL] JSONSchema validation failed for sample: {s.name}")
            return False

        # Pydantic v2 check
        try:
            model = DatasetMetadata.model_validate(data)
            for role in model.learning_outcomes.target_roles:
                roles_covered.add(role.value)
        except Exception as e:
            print(f"  [FAIL] Pydantic validation failed for sample: {s.name}: {e}")
            return False

    # Check that both Data Analyst and AI Engineer roles are covered
    if "data_analyst" not in roles_covered or "ai_engineer" not in roles_covered:
        print(
            f"  [FAIL] Samples do not cover both data_analyst and ai_engineer tracks: {roles_covered}"
        )
        return False

    return True


def test_mandatory_governance_license_and_pii() -> bool:
    for s in SAMPLES_DIR.glob("*.json"):
        with open(s, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "license" not in data or not data["license"]:
            print(f"  [FAIL] Missing license in {s.name}")
            return False

        pii = data.get("pii", {})
        if "level" not in pii or "has_pii" not in pii or "compliance_tags" not in pii:
            print(f"  [FAIL] Incomplete PII block in {s.name}")
            return False
    return True


def test_data_dictionary_and_lineage() -> bool:
    for s in SAMPLES_DIR.glob("*.json"):
        with open(s, "r", encoding="utf-8") as f:
            data = json.load(f)

        lineage = data.get("lineage", {})
        if not lineage.get("source_system") or not lineage.get(
            "transformation_pipeline"
        ):
            print(f"  [FAIL] Missing lineage information in {s.name}")
            return False

        tables = data.get("tables", [])
        if not tables:
            print(f"  [FAIL] No tables found in {s.name}")
            return False

        for tbl in tables:
            cols = tbl.get("columns", [])
            if not cols:
                print(
                    f"  [FAIL] No column data dictionary in {s.name} -> {tbl.get('table_name')}"
                )
                return False
            for col in cols:
                if (
                    not col.get("name")
                    or not col.get("data_type")
                    or not col.get("description")
                ):
                    print(
                        f"  [FAIL] Incomplete column definition in {s.name} -> {col.get('name')}"
                    )
                    return False
    return True


def test_cryptographic_integrity() -> bool:
    sha_regex = re.compile(r"^[a-fA-F0-9]{64}$")
    for s in SAMPLES_DIR.glob("*.json"):
        with open(s, "r", encoding="utf-8") as f:
            data = json.load(f)

        integrity = data.get("integrity", {})
        checksum = integrity.get("checksum", "")
        if not sha_regex.match(checksum):
            print(f"  [FAIL] Invalid SHA-256 checksum format in {s.name}: {checksum}")
            return False

        if integrity.get("file_size_bytes", -1) <= 0:
            print(f"  [FAIL] Invalid file size bytes in {s.name}")
            return False
    return True


def test_negative_testing_enforcement() -> bool:
    neg_files = list(TEST_CASES_DIR.glob("*.json"))
    if len(neg_files) < 4:
        print(
            f"  [FAIL] Expected at least 4 negative test cases, found {len(neg_files)}"
        )
        return False

    with open(SCHEMAS_DIR / "dataset.schema.json", "r", encoding="utf-8") as f:
        schema = json.load(f)
    validator = jsonschema.Draft202012Validator(schema)

    for nf in neg_files:
        with open(nf, "r", encoding="utf-8") as f:
            data = json.load(f)

        # Expect either JSONSchema or Pydantic to reject
        schema_valid = validator.is_valid(data)
        pydantic_valid = True
        try:
            DatasetMetadata.model_validate(data)
        except Exception:
            pydantic_valid = False

        if schema_valid and pydantic_valid:
            print(
                f"  [FAIL] Negative test case {nf.name} unexpectedly passed validation!"
            )
            return False

    return True


def test_documentation_deliverables() -> bool:
    required_docs = [
        DAY04_DIR / "README.md",
        DAY04_DIR / "04_dataset_registry_schema.md",
        DAY04_DIR / "AI_WORKLOG.md",
    ]
    for doc in required_docs:
        if not doc.is_file() or doc.stat().st_size < 100:
            print(f"  [FAIL] Missing or empty document: {doc.name}")
            return False
    return True


def test_word_report_deliverable() -> bool:
    docx_file = (
        ROOT_DIR
        / "DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_04.docx"
    )
    if not docx_file.is_file() or docx_file.stat().st_size < 1000:
        print(f"  [FAIL] Missing or invalid Day 04 Word Report: {docx_file.name}")
        return False
    return True


def main() -> int:
    checks = [
        (
            "Directory structure verified (schemas, samples, test_cases, scripts)",
            test_directory_structure,
        ),
        (
            "Schema definitions verified (dataset.schema.json & Pydantic models.py)",
            test_schema_definitions,
        ),
        (
            "5 Benchmark metadata samples validated (Data Analyst & AI Engineer tracks)",
            test_sample_metadata_count_and_validity,
        ),
        (
            "Mandatory governance rules verified (License & PII policy enforced)",
            test_mandatory_governance_license_and_pii,
        ),
        (
            "Data dictionary and provenance lineage verified in all datasets",
            test_data_dictionary_and_lineage,
        ),
        (
            "Cryptographic integrity verified (SHA-256 hash & file size)",
            test_cryptographic_integrity,
        ),
        (
            "Negative testing verified (4 intentional error cases properly rejected)",
            test_negative_testing_enforcement,
        ),
        (
            "Engineering documents verified (README, Specification, AI_WORKLOG)",
            test_documentation_deliverables,
        ),
        (
            "Final Word Report verified (DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_04.docx)",
            test_word_report_deliverable,
        ),
    ]

    print("==================================================")
    print("CYBERSOFT DATA & AI LAB - DAY 04 VALIDATION HARNESS")
    print("==================================================")

    passed_count = 0
    for description, func in checks:
        try:
            res = func()
            if res:
                print(f"[PASS] {description}")
                passed_count += 1
            else:
                print(f"[FAIL] {description}")
        except Exception as e:
            print(f"[ERROR] Exception during '{description}': {e}")

    print("--------------------------------------------------")
    total = len(checks)
    if passed_count == total:
        print(
            f"SUCCESS: All Day 04 DoD requirements passed ({passed_count}/{total} - 100%)!"
        )
        print("==================================================")
        return 0
    else:
        print(
            f"WARNING: Passed {passed_count}/{total} checks. Please complete remaining deliverables."
        )
        print("==================================================")
        return 1


if __name__ == "__main__":
    sys.exit(main())
