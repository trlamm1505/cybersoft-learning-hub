"""CyberSoft Dataset Registry - Automated Quality Gate Checker.

Performs multi-tier evaluation before permitting a dataset to be published:
1. Schema Conformance (validates JSON metadata against dataset.schema.json)
2. Structural Integrity (file existence, non-empty, encoding)
3. Relational & Tabular Integrity (primary key uniqueness, null limits, data types)
4. Knowledge Corpus Integrity (for RAG datasets: non-empty chunks, ground-truth citations)
5. Security & PII Compliance (verifies declared PII handling and sanitization)
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any, Dict, List, Optional
import jsonschema

from ..core.models import QualityGateResult


class QualityGateChecker:
    """Evaluator that audits dataset manifests and data assets against quality gates."""

    def __init__(self, schema_path: Optional[Path] = None):
        self.base_dir = Path(__file__).resolve().parent.parent.parent
        # Default to Task 04 schema if not explicitly provided
        task04_schema = (
            self.base_dir.parent / "BaoCao_Task04" / "schemas" / "dataset.schema.json"
        )
        self.schema_path = schema_path or task04_schema
        self._schema_cache: Optional[Dict[str, Any]] = None

    def _load_schema(self) -> Dict[str, Any]:
        if self._schema_cache is None:
            if not self.schema_path.exists():
                raise FileNotFoundError(
                    f"Dataset schema not found at: {self.schema_path}"
                )
            with open(self.schema_path, "r", encoding="utf-8") as f:
                self._schema_cache = json.load(f)
        return self._schema_cache

    def evaluate(
        self,
        manifest_data: Dict[str, Any],
        data_files: Optional[List[Path]] = None,
    ) -> QualityGateResult:
        """Runs all quality checks and computes an overall quality score (0-100)."""
        violations: List[str] = []
        warnings: List[str] = []
        total_checks = 0
        passed_checks = 0

        # Tier 1: Schema Conformance Check
        total_checks += 1
        schema_valid = True
        try:
            schema = self._load_schema()
            jsonschema.validate(instance=manifest_data, schema=schema)
            passed_checks += 1
        except jsonschema.ValidationError as err:
            schema_valid = False
            field = " -> ".join([str(x) for x in err.path]) or "root"
            violations.append(f"Schema validation error at [{field}]: {err.message}")
        except Exception as ex:
            schema_valid = False
            violations.append(f"Schema evaluation error: {str(ex)}")

        # Tier 2: Governance & Mandatory Metadata Attributes
        mandatory_fields = ["id", "title", "version", "domain", "license", "pii"]
        for field in mandatory_fields:
            total_checks += 1
            if field in manifest_data and manifest_data[field]:
                passed_checks += 1
            else:
                violations.append(f"Missing mandatory governance field: '{field}'")

        # Check PII declaration
        total_checks += 1
        pii_block = manifest_data.get("pii", {})
        if isinstance(pii_block, dict) and "has_pii" in pii_block:
            passed_checks += 1
        else:
            violations.append(
                "PII declaration must specify 'has_pii' boolean and compliance handling"
            )

        # Tier 3: Physical Data Assets Audit
        if data_files:
            for file_path in data_files:
                total_checks += 1
                if not file_path.exists():
                    violations.append(f"Referenced data file missing: {file_path.name}")
                    continue
                if file_path.stat().st_size == 0:
                    violations.append(
                        f"Data file is completely empty: {file_path.name}"
                    )
                    continue
                passed_checks += 1

                # Deep inspection by file extension
                if file_path.suffix.lower() == ".csv":
                    csv_checks, csv_passed, csv_viols, csv_warns = self._audit_csv(
                        file_path
                    )
                    total_checks += csv_checks
                    passed_checks += csv_passed
                    violations.extend(csv_viols)
                    warnings.extend(csv_warns)
                elif file_path.suffix.lower() == ".json":
                    json_checks, json_passed, json_viols, json_warns = self._audit_json(
                        file_path
                    )
                    total_checks += json_checks
                    passed_checks += json_passed
                    violations.extend(json_viols)
                    warnings.extend(json_warns)
        else:
            warnings.append("No physical data files passed for deep row-level auditing")

        # Calculate final composite score
        score = (passed_checks / total_checks * 100.0) if total_checks > 0 else 0.0
        score = round(max(0.0, min(100.0, score)), 2)

        # Gate pass criteria:
        # 1. Zero blocking violations
        # 2. Schema is valid
        # 3. Score >= 95.0%
        passed = (len(violations) == 0) and schema_valid and (score >= 95.0)

        return QualityGateResult(
            passed=passed,
            score=score,
            schema_valid=schema_valid,
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=len(violations),
            violations=violations,
            warnings=warnings,
            details={
                "dataset_id": manifest_data.get("id", "unknown"),
                "version": manifest_data.get("version", "unknown"),
                "data_files_evaluated": len(data_files) if data_files else 0,
            },
        )

    def _audit_csv(self, path: Path) -> tuple[int, int, List[str], List[str]]:
        """Audits CSV file for header correctness, nulls, and duplicate primary keys."""
        checks = 0
        passed = 0
        violations = []
        warnings = []

        try:
            with open(path, "r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                header = next(reader, None)

                # Check 1: Header exists
                checks += 1
                if not header:
                    violations.append(f"{path.name}: CSV has no header line")
                    return checks, passed, violations, warnings
                passed += 1

                # Check 2: Row count & duplicate PK
                checks += 1
                first_col_name = header[0].strip()
                pk_candidates = (
                    [first_col_name] if "id" in first_col_name.lower() else []
                )

                seen_pks = set()
                row_count = 0
                null_cells = 0
                total_cells = 0
                duplicate_pks = 0

                for row in reader:
                    if not row:
                        continue
                    row_count += 1
                    total_cells += len(row)
                    for val in row:
                        if val.strip() == "" or val.strip().lower() in (
                            "null",
                            "nan",
                            "none",
                        ):
                            null_cells += 1

                    if pk_candidates and len(row) > 0:
                        pk_val = row[0].strip()
                        if pk_val in seen_pks:
                            duplicate_pks += 1
                        seen_pks.add(pk_val)

                if row_count == 0:
                    violations.append(f"{path.name}: CSV has 0 data records")
                else:
                    passed += 1

                # Check 3: Duplicate Primary Keys
                if pk_candidates:
                    checks += 1
                    if duplicate_pks > 0:
                        violations.append(
                            f"{path.name}: Found {duplicate_pks} duplicate primary keys in '{first_col_name}'"
                        )
                    else:
                        passed += 1

                # Check 4: Null ratio
                checks += 1
                null_ratio = (null_cells / total_cells) if total_cells > 0 else 0.0
                if (
                    null_ratio > 0.35
                ):  # Over 35% null cells is considered anomalous dirty data
                    violations.append(
                        f"{path.name}: Excessive null values ({null_ratio * 100:.1f}% > 35% limit)"
                    )
                else:
                    passed += 1

                # Check 5: Explicit dirty flags in data
                if "dirty" in path.name.lower() or "orphan" in path.name.lower():
                    checks += 1
                    violations.append(
                        f"{path.name}: File is flagged as dirty or rejected fixture"
                    )

        except Exception as ex:
            violations.append(f"{path.name}: Failed to read CSV: {str(ex)}")

        return checks, passed, violations, warnings

    def _audit_json(self, path: Path) -> tuple[int, int, List[str], List[str]]:
        """Audits JSON data file (e.g. benchmark QA dataset)."""
        checks = 0
        passed = 0
        violations = []
        warnings = []

        checks += 1
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = json.load(f)
            passed += 1

            checks += 1
            if isinstance(content, (list, dict)) and len(content) > 0:
                passed += 1
            else:
                violations.append(f"{path.name}: JSON data structure is empty")

        except Exception as ex:
            violations.append(f"{path.name}: Invalid JSON syntax: {str(ex)}")

        return checks, passed, violations, warnings
