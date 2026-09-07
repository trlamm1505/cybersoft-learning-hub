"""CyberSoft Data Quality Harness — Data Models.
Defines Issue, CheckResult, and ValidationReport schemas.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


@dataclass
class Issue:
    check_name: str
    rule_type: str
    severity: Severity
    message: str
    row_index: Optional[int] = None
    column: Optional[str] = None
    invalid_value: Optional[Any] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["severity"] = self.severity.value
        return d


@dataclass
class CheckResult:
    check_name: str
    rule_type: str
    passed: bool
    total_evaluated: int
    passed_count: int
    failed_count: int
    issues: List[Issue] = field(default_factory=list)
    execution_time_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "check_name": self.check_name,
            "rule_type": self.rule_type,
            "passed": self.passed,
            "total_evaluated": self.total_evaluated,
            "passed_count": self.passed_count,
            "failed_count": self.failed_count,
            "execution_time_ms": round(self.execution_time_ms, 2),
            "issues": [issue.to_dict() for issue in self.issues],
        }


@dataclass
class ValidationReport:
    dataset_name: str
    input_file: str
    rules_file: str
    timestamp: str
    total_records: int
    total_columns: int
    overall_passed: bool
    exit_code: int
    summary: Dict[str, Any]
    check_results: List[CheckResult] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dataset_name": self.dataset_name,
            "input_file": self.input_file,
            "rules_file": self.rules_file,
            "timestamp": self.timestamp,
            "total_records": self.total_records,
            "total_columns": self.total_columns,
            "overall_passed": self.overall_passed,
            "exit_code": self.exit_code,
            "summary": self.summary,
            "check_results": [res.to_dict() for res in self.check_results],
        }
