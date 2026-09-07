#!/usr/bin/env python3
"""CyberSoft Data & AI Lab — Metadata Validator Script.

Validates dataset metadata files against both JSON Schema (Draft 2020-12)
and Pydantic v2 domain models.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import jsonschema
from pydantic import ValidationError

# Dynamically import models from schemas directory
SCRIPT_DIR = Path(__file__).resolve().parent
SCHEMAS_DIR = SCRIPT_DIR.parent / "schemas"
sys.path.insert(0, str(SCHEMAS_DIR))

try:
    from models import DatasetMetadata
except ImportError as err:
    print(f"[ERROR] Failed to import Pydantic models from {SCHEMAS_DIR}: {err}")
    sys.exit(1)


def load_json_schema() -> Dict[str, Any]:
    schema_file = SCHEMAS_DIR / "dataset.schema.json"
    if not schema_file.exists():
        raise FileNotFoundError(f"JSON Schema not found at {schema_file}")
    with open(schema_file, "r", encoding="utf-8") as f:
        return json.load(f)


def validate_file(file_path: Path, schema: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """Validate a JSON file with both jsonschema and Pydantic v2."""
    errors: List[str] = []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        return False, [f"JSON Parse Error: {e}"]

    # 1. JSON Schema Validation
    validator = jsonschema.Draft202012Validator(schema)
    schema_errors = sorted(validator.iter_errors(data), key=lambda e: e.path)
    for err in schema_errors:
        loc = " -> ".join([str(p) for p in err.path]) or "root"
        errors.append(f"JSONSchema [{loc}]: {err.message}")

    # 2. Pydantic v2 Validation
    try:
        DatasetMetadata.model_validate(data)
    except ValidationError as val_err:
        for err in val_err.errors():
            loc = " -> ".join([str(p) for p in err["loc"]])
            errors.append(f"Pydantic [{loc}]: {err['msg']}")

    return (len(errors) == 0), errors


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate CyberSoft Dataset Metadata against Schema & Pydantic."
    )
    parser.add_argument("--file", type=str, help="Path to single metadata JSON file")
    parser.add_argument(
        "--dir", type=str, help="Directory containing metadata JSON files to validate"
    )
    parser.add_argument(
        "--test-negative",
        type=str,
        help="Directory containing invalid samples (expects failure)",
    )

    args = parser.parse_args()

    try:
        schema = load_json_schema()
    except Exception as err:
        print(f"[ERROR] {err}")
        return 1

    overall_success = True

    if args.file:
        path = Path(args.file)
        if not path.exists():
            print(f"[ERROR] File not found: {path}")
            return 1
        valid, errors = validate_file(path, schema)
        if valid:
            print(f"[PASS] {path.name} is valid!")
        else:
            print(f"[FAIL] {path.name} failed validation:")
            for e in errors:
                print(f"       - {e}")
            overall_success = False

    if args.dir:
        dir_path = Path(args.dir)
        if not dir_path.exists():
            print(f"[ERROR] Directory not found: {dir_path}")
            return 1
        files = sorted(dir_path.glob("*.json"))
        if not files:
            print(f"[WARN] No .json files found in {dir_path}")
            return 1

        print(f"\n--- Validating {len(files)} Metadata Samples in {dir_path.name} ---")
        for f in files:
            valid, errors = validate_file(f, schema)
            if valid:
                print(f"  [PASS] {f.name}")
            else:
                print(f"  [FAIL] {f.name}")
                for e in errors:
                    print(f"         - {e}")
                overall_success = False

    if args.test_negative:
        neg_dir = Path(args.test_negative)
        if not neg_dir.exists():
            print(f"[ERROR] Negative test directory not found: {neg_dir}")
            return 1
        files = sorted(neg_dir.glob("*.json"))
        print(
            f"\n--- Testing Negative Cases (Expect Validation Rejection) in {neg_dir.name} ---"
        )
        for f in files:
            valid, errors = validate_file(f, schema)
            if not valid:
                print(f"  [PASS] Successfully rejected invalid file: {f.name}")
                print(f"         Detected {len(errors)} error(s): {errors[0]}")
            else:
                print(
                    f"  [FAIL] Unexpected PASS for invalid file: {f.name} (Should have failed!)"
                )
                overall_success = False

    if not (args.file or args.dir or args.test_negative):
        # Default run: validate samples and test negative cases
        samples_dir = SCRIPT_DIR.parent / "metadata_samples"
        neg_dir = SCRIPT_DIR.parent / "test_cases"

        print("==================================================")
        print("CYBERSOFT DATASET REGISTRY SCHEMA VALIDATOR")
        print("==================================================")

        # 1. Validate sample catalog
        files = sorted(samples_dir.glob("*.json"))
        print(f"1. Validating {len(files)} Benchmark Metadata Samples:")
        for f in files:
            valid, errors = validate_file(f, schema)
            if valid:
                print(f"   [PASS] {f.name}")
            else:
                print(f"   [FAIL] {f.name}")
                for e in errors:
                    print(f"          - {e}")
                overall_success = False

        # 2. Test negative cases
        neg_files = sorted(neg_dir.glob("*.json"))
        print(
            f"\n2. Testing {len(neg_files)} Negative Test Cases (Must Catch Violations):"
        )
        for f in neg_files:
            valid, errors = validate_file(f, schema)
            if not valid:
                print(f"   [PASS] Caught violation in: {f.name}")
                print(f"          Detail: {errors[0]}")
            else:
                print(f"   [FAIL] Expected failure did NOT occur for: {f.name}")
                overall_success = False

        print("==================================================")
        if overall_success:
            print("SUCCESS: 100% of schema validation checks passed!")
            print("==================================================")
            return 0
        else:
            print("FAILURE: Some validation checks failed.")
            print("==================================================")
            return 1

    return 0 if overall_success else 1


if __name__ == "__main__":
    sys.exit(main())
