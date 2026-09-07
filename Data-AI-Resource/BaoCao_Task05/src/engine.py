"""CyberSoft Data Quality Harness — Core Execution Engine."""

from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import pandas as pd

from .checks import (
    CategoryCheck,
    DateCheck,
    DuplicateCheck,
    NullCheck,
    RangeCheck,
    SchemaCheck,
    TypeCheck,
)
from .models import CheckResult, Severity, ValidationReport
from .reporters import HTMLReporter, JSONReporter, MarkdownReporter


class DataQualityEngine:
    """Orchestrates loading datasets, executing validation checks, aggregating metrics, and exporting reports."""

    CHECK_MAPPING = {
        "schema": SchemaCheck,
        "null": NullCheck,
        "duplicate": DuplicateCheck,
        "type": TypeCheck,
        "range": RangeCheck,
        "category": CategoryCheck,
        "date": DateCheck,
    }

    def __init__(self, rules_config: Dict[str, Any], strict_mode: bool = False):
        self.rules_config = rules_config
        self.strict_mode = strict_mode
        self.dataset_name = rules_config.get("dataset_name", "Unknown Dataset")
        self.rules = rules_config.get("rules", {})

    @classmethod
    def from_rules_file(
        cls, rules_path: Union[str, Path], strict_mode: bool = False
    ) -> DataQualityEngine:
        with open(rules_path, "r", encoding="utf-8") as f:
            cfg = json.load(f)
        return cls(cfg, strict_mode=strict_mode)

    def validate_csv(
        self,
        csv_path: Union[str, Path],
        rules_path_str: str = "",
    ) -> ValidationReport:
        csv_file = Path(csv_path)
        if not csv_file.exists():
            raise FileNotFoundError(f"Không tìm thấy file dữ liệu CSV: {csv_path}")

        # Read CSV with string dtypes first to preserve raw inputs (avoid auto-casting edge cases)
        df = pd.read_csv(csv_file, dtype=str, keep_default_na=False)

        check_results: List[CheckResult] = []

        # Execute the 7 checks in fixed logical order
        ordered_rule_keys = [
            "schema",
            "null",
            "duplicate",
            "type",
            "range",
            "category",
            "date",
        ]

        for rule_key in ordered_rule_keys:
            check_cls = self.CHECK_MAPPING.get(rule_key)
            if not check_cls:
                continue

            rule_cfg = self.rules.get(rule_key, {})
            # Initialize and run check
            check_inst = check_cls(rule_cfg)
            res = check_inst.run(df)
            check_results.append(res)

        # Aggregate metrics
        total_eval = sum(r.total_evaluated for r in check_results)
        total_pass = sum(r.passed_count for r in check_results)
        total_fail = sum(r.failed_count for r in check_results)

        critical_issues = sum(
            1
            for r in check_results
            for i in r.issues
            if i.severity == Severity.CRITICAL
        )
        warning_issues = sum(
            1 for r in check_results for i in r.issues if i.severity == Severity.WARNING
        )

        overall_passed = critical_issues == 0 and (
            not self.strict_mode or warning_issues == 0
        )

        # Exit code determination
        if overall_passed:
            exit_code = 0
        else:
            exit_code = 1

        summary = {
            "total_checks_configured": len(ordered_rule_keys),
            "checks_passed": sum(1 for r in check_results if r.passed),
            "checks_failed": sum(1 for r in check_results if not r.passed),
            "total_evaluations": total_eval,
            "passed_evaluations": total_pass,
            "failed_evaluations": total_fail,
            "pass_rate_pct": round(
                (total_pass / total_eval * 100.0) if total_eval > 0 else 100.0, 2
            ),
            "critical_errors": critical_issues,
            "warnings": warning_issues,
            "strict_mode": self.strict_mode,
        }

        report = ValidationReport(
            dataset_name=self.dataset_name,
            input_file=str(csv_file.resolve()),
            rules_file=rules_path_str or "In-memory Config",
            timestamp=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            total_records=len(df),
            total_columns=len(df.columns),
            overall_passed=overall_passed,
            exit_code=exit_code,
            summary=summary,
            check_results=check_results,
        )

        return report

    def export_reports(
        self,
        report: ValidationReport,
        output_dir: Union[str, Path],
        formats: Optional[List[str]] = None,
        base_name: str = "quality_report",
    ) -> Dict[str, Path]:
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        requested_formats = [
            f.lower() for f in (formats or ["json", "markdown", "html"])
        ]

        generated: Dict[str, Path] = {}

        if "json" in requested_formats:
            json_file = out_dir / f"{base_name}.json"
            JSONReporter.generate(report, json_file)
            generated["json"] = json_file

        if "markdown" in requested_formats or "md" in requested_formats:
            md_file = out_dir / f"{base_name}.md"
            MarkdownReporter.generate(report, md_file)
            generated["markdown"] = md_file

        if "html" in requested_formats:
            html_file = out_dir / f"{base_name}.html"
            HTMLReporter.generate(report, html_file)
            generated["html"] = html_file

        return generated
