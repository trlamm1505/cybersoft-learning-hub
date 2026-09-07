"""Check 4: Data Type and Format Validation."""

from __future__ import annotations

import re
from typing import Any, Dict, List
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


class TypeCheck(BaseCheck):
    """Validates that values in each column adhere to configured data types (integer, float, email, string, boolean)."""

    rule_type: str = "type"

    def _is_valid_type(self, val: Any, expected_type: str) -> bool:
        if pd.isna(val) or val is None or str(val).strip() == "":
            # Nulls are handled by NullCheck
            return True

        val_str = str(val).strip()
        expected = expected_type.lower()

        if expected in ["int", "integer"]:
            try:
                # Check if it parses as integer (reject float with decimals like 3.5)
                f = float(val_str)
                return f.is_integer()
            except ValueError:
                return False

        elif expected in ["float", "numeric", "number"]:
            try:
                float(val_str)
                return True
            except ValueError:
                return False

        elif expected in ["bool", "boolean"]:
            return val_str.lower() in ["true", "false", "1", "0", "yes", "no"]

        elif expected in ["email"]:
            return bool(EMAIL_REGEX.match(val_str))

        elif expected in ["string", "text", "str"]:
            return True

        elif expected in ["date"]:
            # Basic sanity check for date string
            try:
                pd.to_datetime(val_str)
                return True
            except Exception:
                return False

        return True

    def validate(self, df: pd.DataFrame) -> CheckResult:
        column_types: Dict[str, str] = self.rule_config.get("column_types", {})
        severity_str = self.rule_config.get("severity", "CRITICAL").upper()
        severity = Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING

        issues: List[Issue] = []
        total_checks = 0
        failed_count = 0

        for col, expected_type in column_types.items():
            if col not in df.columns:
                continue

            for idx, val in df[col].items():
                total_checks += 1
                if not self._is_valid_type(val, expected_type):
                    failed_count += 1
                    row_num = int(idx) + 2
                    issues.append(
                        Issue(
                            check_name=self.check_name,
                            rule_type=self.rule_type,
                            severity=severity,
                            message=(
                                f"Sai kiểu dữ liệu tại dòng {row_num}, cột '{col}': "
                                f"giá trị '{val}' không khớp kiểu '{expected_type}'"
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
