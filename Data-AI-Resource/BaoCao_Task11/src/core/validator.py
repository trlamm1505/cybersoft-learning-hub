"""Validator for CyberSoft Student Project Bank Manifests and Artifacts."""

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import jsonschema


LEAKAGE_FILE_PATTERNS = [
    r".*solution.*",
    r".*answer.*",
    r".*ground_truth.*",
    r"expected_kpis\.json",
    r"auto_grader\.py",
    r"instructor_guide\.md",
    r"solution_manual\.md",
]

LEAKAGE_CONTENT_PATTERNS = [
    r"SOLUTION_KEY",
    r"GROUND_TRUTH_REVENUE",
    r"INSTRUCTOR_ONLY",
    r"ĐÁP ÁN GIẢNG VIÊN",
    r"LỜI GIẢI CHI TIẾT CHO GIẢNG VIÊN",
    r"expected_value\s*:\s*\d+",
]

SUBJECTIVE_WORDS = [
    "đẹp",
    "tốt",
    "hợp lý",
    "hay",
    "chuẩn",
    "ổn",
    "khá",
    "đúng đắn",
    "sáng tạo",
    "bắt mắt",
]


class ProjectValidator:
    """Comprehensive validator for Project Manifests, Rubrics, and Zero-Leakage."""

    def __init__(self, schema_path: Optional[str] = None):
        if schema_path is None:
            schema_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "schemas", "project.schema.json"
            )
        self.schema_path = Path(schema_path).resolve()
        if not self.schema_path.exists():
            raise FileNotFoundError(f"Schema file not found at {self.schema_path}")
        with open(self.schema_path, "r", encoding="utf-8") as f:
            self.schema = json.load(f)

    def validate_manifest(
        self, manifest_data: Dict[str, Any]
    ) -> Tuple[bool, List[str], List[str]]:
        """Validate manifest against JSON Schema Draft 2020-12 and domain rules."""
        errors: List[str] = []
        warnings: List[str] = []

        # 1. JSON Schema validation
        try:
            validator_cls = jsonschema.validators.validator_for(self.schema)
            validator = validator_cls(self.schema)
            for err in validator.iter_errors(manifest_data):
                field = " -> ".join([str(p) for p in err.path])
                errors.append(f"Schema error at [{field}]: {err.message}")
        except Exception as e:
            errors.append(f"Schema engine failure: {str(e)}")

        if errors:
            return False, errors, warnings

        # 2. Rubric & Requirement Weight Checks
        req = manifest_data.get("requirements", {})
        total_core = req.get("total_core_points", 0)
        total_ext = req.get("total_extension_points", 0)

        sum_core_tasks = sum(t.get("points", 0) for t in req.get("core_tasks", []))
        sum_ext_tasks = sum(t.get("points", 0) for t in req.get("extension_tasks", []))

        if sum_core_tasks != total_core:
            errors.append(
                f"Core tasks points sum ({sum_core_tasks}) does not match total_core_points ({total_core})"
            )

        if sum_ext_tasks != total_ext:
            errors.append(
                f"Extension tasks points sum ({sum_ext_tasks}) does not match total_extension_points ({total_ext})"
            )

        if (total_core + total_ext) != 100:
            errors.append(
                f"Total project points must equal 100 (got core {total_core} + extension {total_ext} = {total_core + total_ext})"
            )

        rubrics = manifest_data.get("rubrics", {})
        if rubrics.get("total_points") != 100:
            errors.append(
                f"Rubrics total_points must be exactly 100, got {rubrics.get('total_points')}"
            )

        total_rubric_points = 0.0
        for cat in rubrics.get("categories", []):
            cat_sum = 0.0
            for crit in cat.get("criteria", []):
                max_pts = crit.get("max_points", 0.0)
                cat_sum += max_pts
                metric = crit.get("quantitative_metric", "").lower()

                # Check for subjective words
                found_subjective = [w for w in SUBJECTIVE_WORDS if w in metric]
                if found_subjective and not re.search(
                    r"(\d+%|\d+\s*(điểm|records|ms|chênh lệch|sai số|đúng))", metric
                ):
                    warnings.append(
                        f"Criterion '{crit.get('criterion_id')}' contains subjective wording {found_subjective} without explicit metric"
                    )

            if abs(cat_sum - cat.get("weight", 0.0)) > 0.01:
                errors.append(
                    f"Category '{cat.get('category_id')}' criteria sum ({cat_sum}) does not match category weight ({cat.get('weight')})"
                )
            total_rubric_points += cat_sum

        if abs(total_rubric_points - 100.0) > 0.01:
            errors.append(
                f"Total rubric criteria sum must be 100.0, got {total_rubric_points}"
            )

        # 3. Hint Tiers check
        hints = manifest_data.get("hints", [])
        tiers_present = {h.get("tier") for h in hints}
        if tiers_present != {1, 2, 3}:
            errors.append(
                f"Hints must cover exactly 3 tiers (1, 2, 3), found {tiers_present}"
            )

        return len(errors) == 0, errors, warnings

    def check_student_directory_leakage(
        self, student_dir: Path
    ) -> Tuple[bool, List[str]]:
        """Scan student edition directory for any accidental solution or leakage."""
        leakages: List[str] = []
        student_dir = Path(student_dir).resolve()

        if not student_dir.exists():
            return False, [f"Student directory does not exist: {student_dir}"]

        for root, _, files in os.walk(student_dir):
            for file in files:
                file_path = Path(root) / file
                rel_path = file_path.relative_to(student_dir).as_posix().lower()

                # Check filename patterns
                for pattern in LEAKAGE_FILE_PATTERNS:
                    if re.match(pattern, rel_path, re.IGNORECASE):
                        leakages.append(
                            f"Leaked solution file detected: {rel_path} (matched pattern: {pattern})"
                        )

                # Check file contents for text/code files
                if file_path.suffix in [".md", ".txt", ".json", ".py", ".sql", ".csv"]:
                    try:
                        with open(
                            file_path, "r", encoding="utf-8", errors="ignore"
                        ) as f:
                            content = f.read()
                            for c_pattern in LEAKAGE_CONTENT_PATTERNS:
                                if re.search(c_pattern, content, re.IGNORECASE):
                                    leakages.append(
                                        f"Leaked solution content in {rel_path}: matched '{c_pattern}'"
                                    )
                    except Exception as e:
                        leakages.append(f"Cannot read file {rel_path}: {e}")

        return len(leakages) == 0, leakages
