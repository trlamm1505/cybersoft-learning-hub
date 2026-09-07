"""Check 1: Schema / Structure Validation."""

from __future__ import annotations

from typing import List
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck


class SchemaCheck(BaseCheck):
    """Validates presence of required columns and absence of unauthorized unexpected columns."""

    rule_type: str = "schema"

    def validate(self, df: pd.DataFrame) -> CheckResult:
        required_cols: List[str] = self.rule_config.get("required_columns", [])
        allow_unexpected: bool = self.rule_config.get("allow_unexpected_columns", False)
        severity_str = self.rule_config.get("severity", "CRITICAL").upper()
        severity = Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING

        actual_cols = list(df.columns)
        missing_cols = [col for col in required_cols if col not in actual_cols]
        unexpected_cols = [col for col in actual_cols if col not in required_cols]

        issues: List[Issue] = []

        for col in missing_cols:
            issues.append(
                Issue(
                    check_name=self.check_name,
                    rule_type=self.rule_type,
                    severity=severity,
                    message=f"Cột bắt buộc bị thiếu trong schema: '{col}'",
                    column=col,
                )
            )

        if not allow_unexpected and unexpected_cols:
            for col in unexpected_cols:
                issues.append(
                    Issue(
                        check_name=self.check_name,
                        rule_type=self.rule_type,
                        severity=Severity.WARNING,
                        message=f"Phát hiện cột không được phép trong cấu trúc: '{col}'",
                        column=col,
                    )
                )

        total_rules = len(required_cols) + (1 if not allow_unexpected else 0)
        passed = len(missing_cols) == 0 and (
            allow_unexpected or len(unexpected_cols) == 0
        )
        failed_count = len(missing_cols) + (
            len(unexpected_cols) if not allow_unexpected else 0
        )

        return CheckResult(
            check_name=self.check_name,
            rule_type=self.rule_type,
            passed=passed,
            total_evaluated=total_rules,
            passed_count=max(0, total_rules - failed_count),
            failed_count=failed_count,
            issues=issues,
        )
