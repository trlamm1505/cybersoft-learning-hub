"""Data Quality Harness for AI-Controlled Synthetic Data Pipeline.

Provides automated multi-tiered validation:
- GR-01-SCHEMA: JSON Schema validation against CS-SCHEMA-SYNTHETIC-LEARN-V1
- GR-02-RUBRIC-SUM: Verification that sum of criteria weight_percent == 100
- GR-03-SCORE-STATUS: Correlation check between execution_status and score range
- GR-04-ANTI-LEAK: Detection of placeholder tokens or leaked debug markers
- GR-05-MIN-LENGTH: Minimum length requirements for problem and feedback
- GR-06-TRACK-ENUM: Permitted track validation
- GR-07-CHECKSUM: SHA-256 payload integrity check
"""

from __future__ import annotations

import hashlib
import json
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

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

import jsonschema


@dataclass
class Violation:
    rule_id: str
    severity: str  # "CRITICAL" | "WARNING"
    field: str
    message: str


@dataclass
class HarnessResult:
    record_id: str
    passed: bool
    error_count: int
    warning_count: int
    violations: List[Violation] = field(default_factory=list)
    corrective_guidance: str = ""

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        return data


class DataQualityHarness:
    """Automated evaluation harness with structured error feedback generation."""

    PROHIBITED_SUBSTRINGS = [
        "[TODO",
        "[LEAK",
        "Lorem ipsum",
        "undefined",
        "NaN",
        "null_marker",
        "PLACEHOLDER",
    ]

    ALLOWED_TRACKS = {
        "Fullstack Web",
        "Data & AI Resource Engineer",
        "DevOps Cloud",
        "Cybersecurity SOC",
        "Mobile React Native",
    }

    SCORE_RANGES = {
        "PASSED": (70, 100),
        "FAILED_TESTS": (30, 69),
        "SYNTAX_ERROR": (0, 29),
        "TIMEOUT": (0, 29),
    }

    def __init__(self, schema_path: Optional[str] = None):
        if schema_path is None:
            base_dir = Path(__file__).resolve().parent.parent
            schema_path = str(base_dir / "data_dictionary" / "record_schema.json")

        self.schema_path = Path(schema_path)
        if not self.schema_path.exists():
            raise FileNotFoundError(f"Schema not found at {self.schema_path}")

        with open(self.schema_path, "r", encoding="utf-8") as f:
            self.schema = json.load(f)

        self.validator = jsonschema.Draft202012Validator(self.schema)

    @staticmethod
    def calculate_checksum(record_payload: Dict[str, Any]) -> str:
        """Compute SHA-256 hash of canonicalized record excluding checksum field."""
        cloned = json.loads(json.dumps(record_payload))
        if (
            "generation_metadata" in cloned
            and "checksum_sha256" in cloned["generation_metadata"]
        ):
            del cloned["generation_metadata"]["checksum_sha256"]
        canonical_str = json.dumps(cloned, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

    def inspect_record(
        self, record: Dict[str, Any], verify_checksum: bool = True
    ) -> HarnessResult:
        """Perform comprehensive inspection on candidate synthetic record."""
        record_id = record.get("record_id", "UNKNOWN-REC")
        violations: List[Violation] = []

        # 1. GR-01-SCHEMA: JSON Schema validation
        schema_errors = sorted(self.validator.iter_errors(record), key=lambda e: e.path)
        for err in schema_errors:
            field_path = ".".join(str(p) for p in err.path) or "root"
            violations.append(
                Violation(
                    rule_id="GR-01-SCHEMA",
                    severity="CRITICAL",
                    field=field_path,
                    message=f"Schema violation: {err.message}",
                )
            )

        # If schema errors are critical structure errors, return early with structured feedback
        if any(v.field == "root" for v in violations):
            guidance = "Fix root object structure to include all mandatory sections."
            return HarnessResult(
                record_id=record_id,
                passed=False,
                error_count=len(violations),
                warning_count=0,
                violations=violations,
                corrective_guidance=guidance,
            )

        # 2. GR-02-RUBRIC-SUM: Rubric weights sum check
        assessment = record.get("learning_assessment", {})
        rubric_criteria = assessment.get("rubric_criteria", [])
        if isinstance(rubric_criteria, list) and len(rubric_criteria) > 0:
            total_weight = sum(
                c.get("weight_percent", 0)
                for c in rubric_criteria
                if isinstance(c, dict)
            )
            if total_weight != 100:
                violations.append(
                    Violation(
                        rule_id="GR-02-RUBRIC-SUM",
                        severity="CRITICAL",
                        field="learning_assessment.rubric_criteria",
                        message=f"Rubric criteria weights sum to {total_weight}%, but must equal exactly 100%.",
                    )
                )

        # 3. GR-03-SCORE-STATUS: Correlation between status and score
        submission = record.get("student_submission", {})
        status = submission.get("execution_status")
        score = submission.get("score")
        if status in self.SCORE_RANGES and isinstance(score, (int, float)):
            min_score, max_score = self.SCORE_RANGES[status]
            if not (min_score <= score <= max_score):
                violations.append(
                    Violation(
                        rule_id="GR-03-SCORE-STATUS",
                        severity="CRITICAL",
                        field="student_submission.score",
                        message=f"Score {score} is invalid for execution_status '{status}'. Permitted range: [{min_score}, {max_score}].",
                    )
                )

        # 4. GR-04-ANTI-LEAK: Prohibited tokens & placeholders
        record_dump_str = json.dumps(record, ensure_ascii=False)
        for prohibited in self.PROHIBITED_SUBSTRINGS:
            if prohibited.lower() in record_dump_str.lower():
                violations.append(
                    Violation(
                        rule_id="GR-04-ANTI-LEAK",
                        severity="CRITICAL",
                        field="record_payload",
                        message=f"Detected prohibited placeholder or marker '{prohibited}'.",
                    )
                )

        # 5. GR-05-MIN-LENGTH: Minimum length requirements
        problem_stmt = assessment.get("problem_statement", "")
        if isinstance(problem_stmt, str) and len(problem_stmt.strip()) < 50:
            violations.append(
                Violation(
                    rule_id="GR-05-MIN-LENGTH",
                    severity="WARNING",
                    field="learning_assessment.problem_statement",
                    message=f"Problem statement length is {len(problem_stmt.strip())} chars; recommended minimum is 50 chars.",
                )
            )

        feedback = submission.get("mentor_feedback", "")
        if isinstance(feedback, str) and len(feedback.strip()) < 40:
            violations.append(
                Violation(
                    rule_id="GR-05-MIN-LENGTH",
                    severity="WARNING",
                    field="student_submission.mentor_feedback",
                    message=f"Mentor feedback length is {len(feedback.strip())} chars; recommended minimum is 40 chars.",
                )
            )

        # 6. GR-06-TRACK-ENUM: Domain track validation
        profile = record.get("student_profile", {})
        track = profile.get("track")
        if track and track not in self.ALLOWED_TRACKS:
            violations.append(
                Violation(
                    rule_id="GR-06-TRACK-ENUM",
                    severity="CRITICAL",
                    field="student_profile.track",
                    message=f"Track '{track}' is not permitted. Must be one of: {sorted(self.ALLOWED_TRACKS)}.",
                )
            )

        # 7. GR-07-CHECKSUM: Payload integrity check
        if verify_checksum:
            meta = record.get("generation_metadata", {})
            provided_checksum = meta.get("checksum_sha256")
            if provided_checksum:
                expected_checksum = self.calculate_checksum(record)
                if provided_checksum != expected_checksum:
                    violations.append(
                        Violation(
                            rule_id="GR-07-CHECKSUM",
                            severity="CRITICAL",
                            field="generation_metadata.checksum_sha256",
                            message=f"Checksum mismatch: record states '{provided_checksum}', but calculated payload is '{expected_checksum}'.",
                        )
                    )

        critical_errors = [v for v in violations if v.severity == "CRITICAL"]
        warnings = [v for v in violations if v.severity == "WARNING"]
        passed = len(critical_errors) == 0

        # Construct actionable corrective guidance for generator loop
        if not passed:
            guidance_points = []
            for v in critical_errors:
                if v.rule_id == "GR-02-RUBRIC-SUM":
                    guidance_points.append(
                        "Rebalance rubric criteria so that weight_percent values sum exactly to 100."
                    )
                elif v.rule_id == "GR-03-SCORE-STATUS":
                    guidance_points.append(
                        f"Align score with status '{status}' to be within [{self.SCORE_RANGES.get(status, (0, 100))}]."
                    )
                elif v.rule_id == "GR-04-ANTI-LEAK":
                    guidance_points.append(
                        "Remove all placeholders and replace with real domain code/text."
                    )
                else:
                    guidance_points.append(f"Correct {v.field}: {v.message}")
            corrective_guidance = "; ".join(guidance_points)
        else:
            corrective_guidance = "Record satisfies all quality guardrails."

        return HarnessResult(
            record_id=record_id,
            passed=passed,
            error_count=len(critical_errors),
            warning_count=len(warnings),
            violations=violations,
            corrective_guidance=corrective_guidance,
        )


def main():
    if len(sys.argv) < 2:
        print("Usage: python quality_harness.py <record_or_dataset.json>")
        sys.exit(2)

    target_path = Path(sys.argv[1])
    if not target_path.exists():
        print(f"Error: Target file '{target_path}' not found.")
        sys.exit(2)

    with open(target_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    harness = DataQualityHarness()
    records = data if isinstance(data, list) else [data]

    total_records = len(records)
    passed_records = 0
    total_violations = 0

    print(f"Inspecting {total_records} record(s) with DataQualityHarness...")
    for idx, rec in enumerate(records):
        result = harness.inspect_record(rec)
        if result.passed:
            passed_records += 1
        else:
            total_violations += result.error_count
            print(
                f"  [FAIL] Record #{idx+1} ({result.record_id}): {result.corrective_guidance}"
            )

    print("-" * 60)
    print(
        f"Inspection summary: {passed_records}/{total_records} passed, {total_violations} critical violation(s)."
    )
    if passed_records == total_records:
        print("[SUCCESS] All records passed Data Quality Harness inspection.")
        sys.exit(0)
    else:
        print("[VIOLATION] Quality Harness detected critical defects.")
        sys.exit(1)


if __name__ == "__main__":
    main()
