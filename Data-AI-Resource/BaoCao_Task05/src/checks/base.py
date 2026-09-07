"""CyberSoft Data Quality Harness — Base Check Definition."""

from __future__ import annotations

import abc
import time
from typing import Any, Dict
import pandas as pd

from ..models import CheckResult


class BaseCheck(abc.ABC):
    """Abstract base class for all data quality checks."""

    rule_type: str = "base"

    def __init__(self, rule_config: Dict[str, Any]):
        self.rule_config = rule_config or {}

    @property
    def check_name(self) -> str:
        return self.__class__.__name__

    def run(self, df: pd.DataFrame) -> CheckResult:
        """Executes the check and returns a CheckResult with execution metrics."""
        start_time = time.perf_counter()
        result = self.validate(df)
        end_time = time.perf_counter()
        result.execution_time_ms = (end_time - start_time) * 1000.0
        return result

    @abc.abstractmethod
    def validate(self, df: pd.DataFrame) -> CheckResult:
        """Core validation logic to be implemented by child classes."""
        raise NotImplementedError
