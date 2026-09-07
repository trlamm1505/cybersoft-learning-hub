"""Check 6: Categorical and Allowed Values Validation."""

from __future__ import annotations

from typing import Any, Dict, List, Set
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck


class CategoryCheck(BaseCheck):
    """Validates that categorical values belong to the predefined set of allowed values."""

    rule_type: str = "category"

    def validate(self, df: pd.DataFrame) -> CheckResult:
        columns_config: Dict[str, Dict[str, Any]] = self.rule_config.get("columns", {})
        issues: List[Issue] = []
        total_checks = 0
        failed_count = 0

        for col, cfg in columns_config.items():
            if col not in df.columns:
                continue

            allowed_values: List[str] = cfg.get("allowed_values", [])
            case_sensitive: bool = cfg.get("case_sensitive", True)
            severity_str = cfg.get("severity", "CRITICAL").upper()
            severity = (
                Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING
            )

            if not case_sensitive:
                allowed_lookup: Set[str] = {
                    str(v).lower().strip() for v in allowed_values
                }
            else:
                allowed_lookup = {str(v).strip() for v in allowed_values}

            for idx, val in df[col].items():
                if pd.isna(val) or val is None or str(val).strip() == "":
                    continue

                total_checks += 1
                val_str = str(val).strip()
                val_to_check = val_str if case_sensitive else val_str.lower()

                if val_to_check not in allowed_lookup:
                    failed_count += 1
                    row_num = int(idx) + 2
                    issues.append(
                        Issue(
                            check_name=self.check_name,
                            rule_type=self.rule_type,
                            severity=severity,
                            message=(
                                f"Giá trị danh mục không hợp lệ tại dòng {row_num}, cột '{col}': "
                                f"'{val}' không nằm trong danh mục cho phép {allowed_values}"
                            ),
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
