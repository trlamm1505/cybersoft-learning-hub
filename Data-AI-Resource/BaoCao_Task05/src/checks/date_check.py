"""Check 7: Date Format, Validity, and Chronological Logic Validation."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck


class DateCheck(BaseCheck):
    """Validates date format compliance, future date constraints, and chronological consistency."""

    rule_type: str = "date"

    def validate(self, df: pd.DataFrame) -> CheckResult:
        columns_config: Dict[str, Dict[str, Any]] = self.rule_config.get("columns", {})
        chronological_order: List[Dict[str, Any]] = self.rule_config.get(
            "chronological_order", []
        )

        issues: List[Issue] = []
        total_checks = 0
        failed_count = 0
        now = datetime.now()

        # Cache parsed dates per column for chronological comparison
        parsed_dates: Dict[str, Dict[int, datetime]] = {}

        for col, cfg in columns_config.items():
            if col not in df.columns:
                continue

            expected_format = cfg.get("format", "%Y-%m-%d")
            allow_future = cfg.get("allow_future", True)
            severity_str = cfg.get("severity", "CRITICAL").upper()
            severity = (
                Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING
            )

            parsed_dates[col] = {}

            for idx, val in df[col].items():
                if pd.isna(val) or val is None or str(val).strip() == "":
                    continue

                total_checks += 1
                val_str = str(val).strip()
                row_num = int(idx) + 2

                # 1. Parse date with strict format
                try:
                    dt = datetime.strptime(val_str, expected_format)
                    parsed_dates[col][idx] = dt
                except ValueError:
                    failed_count += 1
                    issues.append(
                        Issue(
                            check_name=self.check_name,
                            rule_type=self.rule_type,
                            severity=severity,
                            message=(
                                f"Sai định dạng hoặc ngày không tồn tại tại dòng {row_num}, cột '{col}': "
                                f"'{val_str}' không khớp chuẩn '{expected_format}'"
                            ),
                            row_index=row_num,
                            column=col,
                            invalid_value=val,
                        )
                    )
                    continue

                # 2. Check future date constraint
                if not allow_future and dt > now:
                    failed_count += 1
                    issues.append(
                        Issue(
                            check_name=self.check_name,
                            rule_type=self.rule_type,
                            severity=severity,
                            message=(
                                f"Vi phạm ràng buộc thời gian tại dòng {row_num}, cột '{col}': "
                                f"ngày '{val_str}' vượt quá ngày hiện tại (không được phép trong tương lai)"
                            ),
                            row_index=row_num,
                            column=col,
                            invalid_value=val,
                        )
                    )

        # 3. Chronological order checks (e.g. start_date <= end_date)
        for order_rule in chronological_order:
            start_col = order_rule.get("start_column")
            end_col = order_rule.get("end_column")
            custom_msg = order_rule.get(
                "message", f"Cột '{start_col}' phải trước cột '{end_col}'"
            )
            severity_str = order_rule.get("severity", "CRITICAL").upper()
            severity = (
                Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING
            )

            if start_col not in df.columns or end_col not in df.columns:
                continue

            for idx in df.index:
                dt_start = parsed_dates.get(start_col, {}).get(idx)
                dt_end = parsed_dates.get(end_col, {}).get(idx)

                if dt_start is not None and dt_end is not None:
                    total_checks += 1
                    if dt_start > dt_end:
                        failed_count += 1
                        row_num = int(idx) + 2
                        issues.append(
                            Issue(
                                check_name=self.check_name,
                                rule_type=self.rule_type,
                                severity=severity,
                                message=(
                                    f"Nghịch lý thời gian tại dòng {row_num}: {custom_msg} "
                                    f"({start_col}='{df.loc[idx, start_col]}' > {end_col}='{df.loc[idx, end_col]}')"
                                ),
                                row_index=row_num,
                                column=f"{start_col},{end_col}",
                                invalid_value={
                                    "start": str(df.loc[idx, start_col]),
                                    "end": str(df.loc[idx, end_col]),
                                },
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
