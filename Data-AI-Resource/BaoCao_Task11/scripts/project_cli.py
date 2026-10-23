"""CLI tool for CyberSoft Student Project Bank."""

import argparse
import json
import sys
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add src to python path
current_dir = Path(__file__).resolve().parent
src_dir = current_dir.parent / "src"
sys.path.insert(0, str(src_dir))

from core.validator import ProjectValidator  # noqa: E402
from core.packager import ProjectPackager  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description="CyberSoft Student Project Bank CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # 1. validate command
    val_parser = subparsers.add_parser(
        "validate", help="Validate a project manifest against schema and domain rules"
    )
    val_parser.add_argument(
        "manifest_path", type=str, help="Path to project_manifest.json"
    )
    val_parser.add_argument(
        "--schema", type=str, default=None, help="Custom path to project.schema.json"
    )

    # 2. check-leakage command
    leak_parser = subparsers.add_parser(
        "check-leakage", help="Scan student edition directory for answer leakage"
    )
    leak_parser.add_argument(
        "student_dir", type=str, help="Path to student edition directory"
    )

    # 3. package command
    pkg_parser = subparsers.add_parser(
        "package", help="Package a project into student and instructor bundles"
    )
    pkg_parser.add_argument(
        "project_dir", type=str, help="Path to project root directory"
    )
    pkg_parser.add_argument(
        "--output", type=str, default="dist", help="Output directory"
    )

    # 4. summary command
    sum_parser = subparsers.add_parser(
        "summary", help="Print executive summary of a project manifest"
    )
    sum_parser.add_argument(
        "manifest_path", type=str, help="Path to project_manifest.json"
    )

    args = parser.parse_args()

    if args.command == "validate":
        validator = ProjectValidator(schema_path=args.schema)
        with open(args.manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)

        is_valid, errors, warnings = validator.validate_manifest(manifest)
        if is_valid:
            print(
                f"[SUCCESS] Manifest '{args.manifest_path}' is VALID (100% Schema & Rubric constraints passed)."
            )
            if warnings:
                print("[WARNINGS]:")
                for w in warnings:
                    print(f"  - {w}")
            sys.exit(0)
        else:
            print(f"[ERROR] Manifest validation failed with {len(errors)} error(s):")
            for e in errors:
                print(f"  - {e}")
            sys.exit(1)

    elif args.command == "check-leakage":
        validator = ProjectValidator()
        passed, leakages = validator.check_student_directory_leakage(
            Path(args.student_dir)
        )
        if passed:
            print(
                f"[SUCCESS] Zero Answer Leakage in '{args.student_dir}'. Student edition is 100% CLEAN."
            )
            sys.exit(0)
        else:
            print(f"[CRITICAL LEAKAGE DETECTED] Found {len(leakages)} leakage issues:")
            for lk in leakages:
                print(f"  - {lk}")
            sys.exit(2)

    elif args.command == "package":
        packager = ProjectPackager(Path(args.project_dir))
        res = packager.package(Path(args.output))
        print("[SUCCESS] Packaged project to:")
        print(f"  - Student: {res['student_dir']}")
        print(f"  - Instructor: {res['instructor_dir']}")
        sys.exit(0)

    elif args.command == "summary":
        with open(args.manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        meta = data.get("metadata", {})
        req = data.get("requirements", {})
        rub = data.get("rubrics", {})
        print("==================================================")
        print(f"PROJECT: {meta.get('title')} (v{meta.get('version')})")
        print(
            f"Domain: {meta.get('domain')} | Level: {meta.get('level')} | Role: {meta.get('target_role')}"
        )
        print(
            f"Estimated Hours: {meta.get('estimated_hours')}h | Author: {meta.get('author')}"
        )
        print("--------------------------------------------------")
        print(
            f"Core Points: {req.get('total_core_points')} ({len(req.get('core_tasks', []))} tasks)"
        )
        print(
            f"Extension Points: {req.get('total_extension_points')} ({len(req.get('extension_tasks', []))} tasks)"
        )
        print(
            f"Rubrics Total: {rub.get('total_points')} points across {len(rub.get('categories', []))} categories"
        )
        print("==================================================")
        sys.exit(0)


if __name__ == "__main__":
    main()
