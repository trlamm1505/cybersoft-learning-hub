"""Check 2: Null / Missing Values Validation."""

from __future__ import annotations

from typing import List
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck


class NullCheck(BaseCheck):
    """Validates that designated columns do not contain null, NaN, or whitespace-only values."""

    rule_type: str = "null"

    def validate(self, df: pd.DataFrame) -> CheckResult:
        not_null_cols: List[str] = self.rule_config.get("not_null_columns", [])
        severity_str = self.rule_config.get("severity", "CRITICAL").upper()
        severity = Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING

        issues: List[Issue] = []
        total_checks = 0
        failed_count = 0

        for col in not_null_cols:
            if col not in df.columns:
                continue

            series = df[col]
            # Detect nulls: NaN, None, or empty/whitespace strings
            is_null = series.isna()
            if series.dtype == object:
                is_empty_str = (
                    series.astype(str)
                    .str.strip()
                    .isin(["", "nan", "None", "NULL", "null"])
                )
                is_null = is_null | is_empty_str

            null_indices = df[is_null].index.tolist()
            total_checks += len(df)
            failed_count += len(null_indices)

            for idx in null_indices:
                # 1-indexed row number (excluding header: row 2 is index 0 in CSV)
                row_num = idx + 2
                issues.append(
                    Issue(
                        check_name=self.check_name,
                        rule_type=self.rule_type,
                        severity=severity,
                        message=f"Giá trị bị rỗng/khuyết thiếu tại dòng {row_num}, cột '{col}'",
                        row_index=row_num,
                        column=col,
                        invalid_value=None,
                    )
                )

        passed = len(issues) == 0
        passed_count = total_checks - failed_count

        return CheckResult(
            check_name=self.check_name,
            rule_type=self.rule_type,
            passed=passed,
            total_evaluated=total_checks,
            passed_count=passed_count,
            failed_count=failed_count,
            issues=issues,
        )
