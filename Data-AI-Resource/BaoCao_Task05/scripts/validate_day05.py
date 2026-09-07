#!/usr/bin/env python3
"""CyberSoft Data & AI Lab — Day 05 DoD Validation Harness.

Independent automated verification of all Definition of Done (DoD)
requirements for Day 05 (Data Quality Harness v0).
"""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys

# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Paths
SCRIPT_DIR = Path(__file__).resolve().parent
DAY05_DIR = SCRIPT_DIR.parent
CONFIG_DIR = DAY05_DIR / "config"
DATA_SAMPLES_DIR = DAY05_DIR / "data_samples"
SRC_DIR = DAY05_DIR / "src"
CHECKS_DIR = SRC_DIR / "checks"
REPORTERS_DIR = SRC_DIR / "reporters"
TESTS_DIR = DAY05_DIR / "tests"
REPORTS_DIR = DAY05_DIR / "reports"
ROOT_DIR = DAY05_DIR.parent.parent.parent  # d:/Cybersoft/Kien

sys.path.insert(0, str(DAY05_DIR))


def check_1_directory_structure() -> bool:
    required_dirs = [
        CONFIG_DIR,
        DATA_SAMPLES_DIR,
        SRC_DIR,
        CHECKS_DIR,
        REPORTERS_DIR,
        SCRIPT_DIR,
        TESTS_DIR,
    ]
    for d in required_dirs:
        if not d.is_dir():
            print(f"  [FAIL] Missing required directory: {d.name}")
            return False
    return True


def check_2_seven_checks_implemented() -> bool:
    try:
        from src.checks import ALL_CHECKS

        required_check_types = {
            "schema",
            "null",
            "duplicate",
            "type",
            "range",
            "category",
            "date",
        }
        implemented_types = {check_cls.rule_type for check_cls in ALL_CHECKS}

        missing = required_check_types - implemented_types
        if missing:
            print(f"  [FAIL] Missing check types: {missing}")
            return False
        return len(ALL_CHECKS) >= 7
    except Exception as e:
        print(f"  [FAIL] Could not import checks: {e}")
        return False


def check_3_rules_configuration() -> bool:
    rules_file = CONFIG_DIR / "course_students_rules.json"
    if not rules_file.is_file():
        print("  [FAIL] Missing course_students_rules.json")
        return False

    with open(rules_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    rules = data.get("rules", {})
    required_keys = ["schema", "null", "duplicate", "type", "range", "category", "date"]
    for key in required_keys:
        if key not in rules:
            print(f"  [FAIL] Rules config missing key: {key}")
            return False
    return True


def check_4_clean_dataset_passes() -> bool:
    from src.engine import DataQualityEngine

    rules_file = CONFIG_DIR / "course_students_rules.json"
    clean_csv = DATA_SAMPLES_DIR / "clean_students.csv"

    if not clean_csv.is_file():
        print("  [FAIL] Missing clean_students.csv")
        return False

    engine = DataQualityEngine.from_rules_file(rules_file)
    report = engine.validate_csv(clean_csv)

    if not report.overall_passed or report.exit_code != 0:
        print(f"  [FAIL] Clean dataset failed validation: exit_code={report.exit_code}")
        return False

    if report.summary["critical_errors"] > 0:
        print("  [FAIL] Clean dataset has critical errors")
        return False

    return True


def check_5_dirty_dataset_catches_all_errors() -> bool:
    from src.engine import DataQualityEngine

    rules_file = CONFIG_DIR / "course_students_rules.json"
    dirty_csv = DATA_SAMPLES_DIR / "dirty_students.csv"

    if not dirty_csv.is_file():
        print("  [FAIL] Missing dirty_students.csv")
        return False

    engine = DataQualityEngine.from_rules_file(rules_file)
    report = engine.validate_csv(dirty_csv)

    if report.overall_passed or report.exit_code == 0:
        print("  [FAIL] Dirty dataset should have failed validation")
        return False

    # Check that each rule type caught issues
    failed_rule_types = {
        res.rule_type for res in report.check_results if not res.passed
    }
    expected_failed_types = {"null", "duplicate", "type", "range", "category", "date"}

    missing_catches = expected_failed_types - failed_rule_types
    if missing_catches:
        print(f"  [FAIL] Dirty dataset failed to catch errors in: {missing_catches}")
        return False

    return True


def check_6_cli_interface() -> bool:
    cli_file = SCRIPT_DIR / "validate_data.py"
    if not cli_file.is_file():
        print("  [FAIL] Missing validate_data.py CLI script")
        return False

    # Run CLI help command
    cmd = [sys.executable, str(cli_file), "--help"]
    res = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if (
        res.returncode != 0
        or "--input" not in res.stdout
        or "--rules" not in res.stdout
    ):
        print(f"  [FAIL] CLI --help failed or missing args: {res.stderr}")
        return False

    return True


def check_7_exit_code_posix_standard() -> bool:
    cli_file = SCRIPT_DIR / "validate_data.py"
    rules_file = CONFIG_DIR / "course_students_rules.json"
    clean_csv = DATA_SAMPLES_DIR / "clean_students.csv"
    dirty_csv = DATA_SAMPLES_DIR / "dirty_students.csv"

    # Test clean: must be 0
    res_clean = subprocess.run(
        [sys.executable, str(cli_file), "-i", str(clean_csv), "-r", str(rules_file)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if res_clean.returncode != 0:
        print(
            f"  [FAIL] Clean file returned exit code {res_clean.returncode}, expected 0"
        )
        return False

    # Test dirty: must be 1
    res_dirty = subprocess.run(
        [sys.executable, str(cli_file), "-i", str(dirty_csv), "-r", str(rules_file)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
    )
    if res_dirty.returncode != 1:
        print(
            f"  [FAIL] Dirty file returned exit code {res_dirty.returncode}, expected 1"
        )
        return False

    return True


def check_8_multi_format_reports() -> bool:
    from src.engine import DataQualityEngine

    rules_file = CONFIG_DIR / "course_students_rules.json"
    clean_csv = DATA_SAMPLES_DIR / "clean_students.csv"

    engine = DataQualityEngine.from_rules_file(rules_file)
    report = engine.validate_csv(clean_csv)

    generated = engine.export_reports(
        report,
        output_dir=REPORTS_DIR,
        formats=["json", "markdown", "html"],
        base_name="test_audit",
    )

    for fmt in ["json", "markdown", "html"]:
        p = generated.get(fmt)
        if not p or not p.is_file() or p.stat().st_size == 0:
            print(f"  [FAIL] Generated {fmt} report is missing or empty")
            return False

    return True


def check_9_unit_tests_pass() -> bool:
    cmd = [sys.executable, "-m", "unittest", "discover", "-s", str(TESTS_DIR)]
    res = subprocess.run(
        cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
    )
    if res.returncode != 0:
        print(f"  [FAIL] Unit test discovery failed:\n{res.stderr}")
        return False
    return True


def check_10_documentation_and_reports() -> bool:
    spec_md = DAY05_DIR / "05_data_quality_harness.md"
    readme_md = DAY05_DIR / "README.md"
    ai_worklog_md = DAY05_DIR / "AI_WORKLOG.md"
    docx_report = (
        ROOT_DIR
        / "DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_05.docx"
    )

    files_to_check = [
        ("05_data_quality_harness.md", spec_md),
        ("README.md", readme_md),
        ("AI_WORKLOG.md", ai_worklog_md),
        ("Word Report Docx", docx_report),
    ]

    for label, path in files_to_check:
        if not path.is_file() or path.stat().st_size == 0:
            print(
                f"  [FAIL] Missing or empty required documentation: {label} ({path.name})"
            )
            return False
    return True


def main() -> int:
    print("=" * 70)
    print("  CYBERSOFT DATA & AI LAB -- DAY 05 DoD INDEPENDENT HARNESS")
    print("=" * 70)

    tests = [
        ("Cấu trúc thư mục bàn giao chuẩn hóa", check_1_directory_structure),
        (
            "Triển khai tối thiểu 7 loại checks độc lập",
            check_2_seven_checks_implemented,
        ),
        ("Bộ quy tắc JSON cấu hình 7 nhóm ràng buộc", check_3_rules_configuration),
        ("Dataset sạch đối chứng đạt 100% hợp lệ", check_4_clean_dataset_passes),
        (
            "Dataset lỗi bắt chính xác 100% các vi phạm",
            check_5_dirty_dataset_catches_all_errors,
        ),
        ("CLI validate_data đầy đủ tham số và trợ giúp", check_6_cli_interface),
        (
            "Exit code chuẩn POSIX (0 khi Pass, 1 khi Fail)",
            check_7_exit_code_posix_standard,
        ),
        (
            "Xuất báo cáo đa định dạng (JSON, Markdown, HTML)",
            check_8_multi_format_reports,
        ),
        ("Bộ Unit Tests tự động đạt 100% PASS", check_9_unit_tests_pass),
        (
            "Tài liệu đặc tả, AI Worklog và Báo cáo Word",
            check_10_documentation_and_reports,
        ),
    ]

    passed_count = 0
    for idx, (desc, func) in enumerate(tests, start=1):
        try:
            ok = func()
        except Exception as ex:
            print(f"  [ERROR] Exception in test {idx}: {ex}")
            ok = False

        status = "[PASS]" if ok else "[FAIL]"
        print(f"  {idx:<2}. {desc:<50} {status}")
        if ok:
            passed_count += 1

    print("-" * 70)
    print(
        f"[*] Kết quả nghiệm thu DoD: {passed_count}/{len(tests)} tiêu chí đạt ({passed_count/len(tests)*100:.1f}%)"
    )
    print("=" * 70)

    if passed_count == len(tests):
        print(
            ">>> CHÚC MỪNG: HOÀN THÀNH 100% ĐIỀU KIỆN NGHIỆM THU NGÀY 05 (DoD PASS) <<<"
        )
        return 0
    else:
        print(">>> CẢNH BÁO: CHƯA HOÀN TẤT TOÀN BỘ TIÊU CHÍ NGHIỆM THU DoD <<<")
        return 1


if __name__ == "__main__":
    sys.exit(main())
