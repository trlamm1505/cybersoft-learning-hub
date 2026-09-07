"""Check 3: Duplicate Records and Unique Keys Validation."""

from __future__ import annotations

from typing import List
import pandas as pd

from ..models import CheckResult, Issue, Severity
from .base import BaseCheck


class DuplicateCheck(BaseCheck):
    """Validates row uniqueness, primary keys, and composite unique keys."""

    rule_type: str = "duplicate"

    def validate(self, df: pd.DataFrame) -> CheckResult:
        primary_key: List[str] = self.rule_config.get("primary_key", [])
        allow_duplicate_records: bool = self.rule_config.get(
            "allow_duplicate_records", False
        )
        composite_keys: List[List[str]] = self.rule_config.get(
            "composite_unique_keys", []
        )
        severity_str = self.rule_config.get("severity", "CRITICAL").upper()
        severity = Severity.CRITICAL if severity_str == "CRITICAL" else Severity.WARNING

        issues: List[Issue] = []
        total_checks = 0
        failed_count = 0

        # 1. Full row duplication check
        if not allow_duplicate_records:
            total_checks += len(df)
            duplicated_mask = df.duplicated(keep="first")
            dup_indices = df[duplicated_mask].index.tolist()
            failed_count += len(dup_indices)

            for idx in dup_indices:
                row_num = idx + 2
                issues.append(
                    Issue(
                        check_name=self.check_name,
                        rule_type=self.rule_type,
                        severity=severity,
                        message=f"Bản ghi trùng lặp hoàn toàn tại dòng {row_num}",
                        row_index=row_num,
                    )
                )

        # 2. Primary key check
        if primary_key and all(col in df.columns for col in primary_key):
            total_checks += len(df)
            pk_dup_mask = df.duplicated(subset=primary_key, keep="first")
            pk_dup_indices = df[pk_dup_mask].index.tolist()
            failed_count += len(pk_dup_indices)

            for idx in pk_dup_indices:
                row_num = idx + 2
                val = df.loc[idx, primary_key].to_dict()
                issues.append(
                    Issue(
                        check_name=self.check_name,
                        rule_type=self.rule_type,
                        severity=severity,
                        message=f"Trùng lặp khóa chính {primary_key} tại dòng {row_num}: {val}",
                        row_index=row_num,
                        column=",".join(primary_key),
                        invalid_value=val,
                    )
                )

        # 3. Composite unique keys check
        for comp_key in composite_keys:
            if all(col in df.columns for col in comp_key) and comp_key != primary_key:
                total_checks += len(df)
                comp_dup_mask = df.duplicated(subset=comp_key, keep="first")
                comp_dup_indices = df[comp_dup_mask].index.tolist()
                failed_count += len(comp_dup_indices)

                for idx in comp_dup_indices:
                    row_num = idx + 2
                    val = df.loc[idx, comp_key].to_dict()
                    issues.append(
                        Issue(
                            check_name=self.check_name,
                            rule_type=self.rule_type,
                            severity=severity,
                            message=f"Trùng lặp khóa kết hợp {comp_key} tại dòng {row_num}: {val}",
                            row_index=row_num,
                            column=",".join(comp_key),
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
