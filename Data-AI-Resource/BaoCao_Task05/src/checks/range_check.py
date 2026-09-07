"""Check 5: Numerical Range and Bounds Validation."""

from __future__ import annotations

from typing import Any, Dict, List
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck


class RangeCheck(BaseCheck):
    """Validates that numeric values fall within expected minimum and maximum bounds."""

    rule_type: str = "range"

    def validate(self, df: pd.DataFrame) -> CheckResult:
        columns_config: Dict[str, Dict[str, Any]] = self.rule_config.get("columns", {})
        issues: List[Issue] = []
        total_checks = 0
        failed_count = 0

        for col, bounds in columns_config.items():
            if col not in df.columns:
                continue

            min_val = bounds.get("min")
            max_val = bounds.get("max")
            severity_str = bounds.get("severity", "CRITICAL").upper()
            severity = (
                Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING
            )

            for idx, val in df[col].items():
                if pd.isna(val) or val is None or str(val).strip() == "":
                    continue

                total_checks += 1
                try:
                    num_val = float(val)
                except ValueError:
                    # Non-numeric is captured by TypeCheck, skip here to avoid double counting
                    continue

                violation_reasons = []
                if min_val is not None and num_val < min_val:
                    violation_reasons.append(
                        f"nhỏ hơn ngưỡng tối thiểu ({num_val} < {min_val})"
                    )
                if max_val is not None and num_val > max_val:
                    violation_reasons.append(
                        f"vượt quá ngưỡng tối đa ({num_val} > {max_val})"
                    )

                if violation_reasons:
                    failed_count += 1
                    row_num = int(idx) + 2
                    reason_msg = " và ".join(violation_reasons)
                    issues.append(
                        Issue(
                            check_name=self.check_name,
                            rule_type=self.rule_type,
                            severity=severity,
                            message=f"Giá trị ngoài khoảng cho phép tại dòng {row_num}, cột '{col}': {reason_msg}",
                            row_index=row_num,
                            column=col,
                            invalid_value=val,
                        )
                    )

        passed = len(issues) == 0
        passed_count = max(0, total_checks - failed_count)

        return CheckResult(
            check_name=self.check_name,
            rule_type=self.rule_type,
            passed=passed,
            total_evaluated=total_checks,
            passed_count=passed_count,
            failed_count=failed_count,
            issues=issues,
        )
