"""Unit tests for eval_rag CLI tool."""

import json
import subprocess
import sys


def test_eval_rag_cli_execution(task20_dir):
    cli_path = task20_dir / "scripts" / "eval_rag.py"
    eval_set = task20_dir / "data" / "golden_rag_eval_v1.json"
    baseline = task20_dir / "data" / "baseline_metrics.json"
    temp_out = task20_dir / "reports" / "test_cli_output.json"
    temp_md = task20_dir / "reports" / "test_cli_report.md"

    cmd = [
        sys.executable,
        str(cli_path),
        "--eval-set",
        str(eval_set),
        "--baseline",
        str(baseline),
        "--output",
        str(temp_out),
        "--export-md",
        str(temp_md),
        "--ci-gate",
    ]

    res = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    assert res.returncode == 0
    assert temp_out.exists()
    assert temp_md.exists()

    with open(temp_out, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["total_queries"] == 30

    # Cleanup temporary files
    if temp_out.exists():
        temp_out.unlink()
    if temp_md.exists():
        temp_md.unlink()
