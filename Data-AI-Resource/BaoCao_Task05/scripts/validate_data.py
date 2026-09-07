#!/usr/bin/env python3
"""CyberSoft Data Quality Harness — CLI Entry Point.

Command-line interface to validate CSV datasets against JSON rules,
outputting status and reports in JSON, Markdown, and HTML formats.
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

# Ensure src package is importable
SCRIPT_DIR = Path(__file__).resolve().parent
TASK05_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(TASK05_DIR))

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.engine import DataQualityEngine  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="validate_data",
        description="CyberSoft Data Quality Harness v0 — Thẩm định chất lượng dữ liệu tự động 7 tầng.",
        formatter_class=argparse.RawTextHelpFormatter,
    )
    parser.add_argument(
        "-i",
        "--input",
        required=True,
        help="Đường dẫn tới file CSV cần kiểm tra chất lượng (ví dụ: data_samples/clean_students.csv).",
    )
    parser.add_argument(
        "-r",
        "--rules",
        required=False,
        default=str(TASK05_DIR / "config" / "course_students_rules.json"),
        help="Đường dẫn tới file cấu hình quy tắc JSON (mặc định: config/course_students_rules.json).",
    )
    parser.add_argument(
        "-f",
        "--format",
        choices=["json", "markdown", "html", "all"],
        default="all",
        help="Định dạng báo cáo xuất ra: json, markdown, html, hoặc all (mặc định: all).",
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        default=str(TASK05_DIR / "reports"),
        help="Thư mục xuất báo cáo kiểm tra (mặc định: reports/).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Bật chế độ nghiêm ngặt: coi mọi cảnh báo (WARNING) là lỗi vi phạm nghiêm trọng.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    input_path = Path(args.input)
    rules_path = Path(args.rules)

    if not input_path.exists():
        print(f"[ERROR] File du lieu khong ton tai: {input_path}", file=sys.stderr)
        return 2

    if not rules_path.exists():
        print(f"[ERROR] File quy tac khong ton tai: {rules_path}", file=sys.stderr)
        return 2

    print("=" * 70)
    print("  CYBERSOFT DATA & AI LAB -- DATA QUALITY HARNESS v0")
    print("=" * 70)
    print(f"[*] Tep du lieu: {input_path.name}")
    print(f"[*] Bo quy tac : {rules_path.name}")
    print(f"[*] Che do     : {'STRICT' if args.strict else 'NORMAL'}")
    print("-" * 70)

    try:
        engine = DataQualityEngine.from_rules_file(rules_path, strict_mode=args.strict)
        report = engine.validate_csv(input_path, rules_path_str=str(rules_path))
    except Exception as err:
        print(f"[SYSTEM ERROR] Validation failed: {err}", file=sys.stderr)
        return 2

    # Print summary table to CLI
    print(
        f"{'STT':<4} | {'Check Name':<18} | {'Rule Type':<12} | {'Status':<10} | {'Errors/Total':<12}"
    )
    print("-" * 70)

    for i, res in enumerate(report.check_results, start=1):
        status_str = "PASS" if res.passed else "FAIL"
        counts_str = f"{res.failed_count}/{res.total_evaluated}"
        print(
            f"{i:<4} | {res.check_name:<18} | {res.rule_type:<12} | {status_str:<10} | {counts_str:<12}"
        )

    print("-" * 70)
    print(f"[*] Total Records   : {report.total_records:,}")
    print(f"[*] Critical Errors : {report.summary['critical_errors']}")
    print(f"[*] Warnings        : {report.summary['warnings']}")
    print(f"[*] Pass Rate       : {report.summary['pass_rate_pct']}%")

    # Export reports
    formats = ["json", "markdown", "html"] if args.format == "all" else [args.format]
    base_name = f"quality_report_{input_path.stem}"
    generated_files = engine.export_reports(
        report, output_dir=args.output_dir, formats=formats, base_name=base_name
    )

    print("-" * 70)
    print("[*] Generated Reports:")
    for fmt, path in generated_files.items():
        print(f"  - [{fmt.upper()}] {path}")

    print("=" * 70)
    if report.overall_passed:
        print("[SUCCESS] DATASET PASSED QUALITY AUDIT (EXIT CODE 0)")
    else:
        print("[FAILURE] DATASET FAILED QUALITY AUDIT (EXIT CODE 1)")
    print("=" * 70)

    return report.exit_code


if __name__ == "__main__":
    sys.exit(main())
