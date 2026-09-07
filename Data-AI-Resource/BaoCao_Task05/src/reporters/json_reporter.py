"""CyberSoft Data Quality Harness — JSON Reporter."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Union

from ..models import ValidationReport


class JSONReporter:
    """Exports validation report to standard JSON format for machine readability and CI/CD pipelines."""

    @staticmethod
    def generate(report: ValidationReport, output_path: Union[str, Path]) -> Path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)

        data = report.to_dict()
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return out_file
