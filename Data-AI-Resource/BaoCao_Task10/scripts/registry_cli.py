"""CyberSoft Dataset Registry & Publishing Portal - Command Line Interface (CLI).

Provides operational CLI commands to:
- register: Register dataset metadata and data files
- validate: Run automated Quality Gate audit
- publish: Transition dataset from Under Review to Published (with Gate enforcement)
- search / list: Query and filter datasets in the registry
- build-catalog: Generate CATALOG.md, catalog.json, and index.html
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

# Ensure BaoCao_Task10 package is on sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
TASK10_DIR = SCRIPT_DIR.parent
sys.path.insert(0, str(TASK10_DIR))

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.core.registry_manager import RegistryManager  # noqa: E402
from src.core.state_machine import QualityGateFailedError  # noqa: E402
from src.portal.catalog_generator import CatalogGenerator  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="registry_cli",
        description="CyberSoft Dataset Registry & Publishing Portal CLI v0.1",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: register
    reg_parser = subparsers.add_parser(
        "register", help="Register a dataset or new version"
    )
    reg_parser.add_argument(
        "-m", "--manifest", required=True, help="Path to manifest JSON"
    )
    reg_parser.add_argument(
        "-d", "--data-file", action="append", default=[], help="Data file paths"
    )
    reg_parser.add_argument(
        "-c", "--changelog", default="Initial registration", help="Changelog text"
    )

    # Command: validate
    val_parser = subparsers.add_parser(
        "validate", help="Run automated quality gate checks"
    )
    val_parser.add_argument("--id", required=True, help="Dataset ID")
    val_parser.add_argument(
        "--version", default=None, help="Version string (defaults to latest)"
    )

    # Command: publish
    pub_parser = subparsers.add_parser(
        "publish", help="Publish a validated dataset version"
    )
    pub_parser.add_argument("--id", required=True, help="Dataset ID")
    pub_parser.add_argument(
        "--version", default=None, help="Version string (defaults to latest)"
    )

    # Command: list
    list_parser = subparsers.add_parser("list", help="List all datasets in registry")
    list_parser.add_argument(
        "--all", action="store_true", help="Show all versions including drafts"
    )

    # Command: search
    search_parser = subparsers.add_parser(
        "search", help="Search datasets by attributes"
    )
    search_parser.add_argument("-q", "--query", help="Keywords in name/description")
    search_parser.add_argument("--domain", help="Filter by domain")
    search_parser.add_argument(
        "--level", help="Filter by level (beginner, intermediate, advanced)"
    )
    search_parser.add_argument("--role", help="Filter by target role")
    search_parser.add_argument("--skill", help="Filter by skill")

    # Command: build-catalog
    subparsers.add_parser(
        "build-catalog", help="Build CATALOG.md, catalog.json and index.html"
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 0

    manager = RegistryManager()

    if args.command == "register":
        try:
            manifest_p = Path(args.manifest)
            data_ps = [Path(f) for f in args.data_file]
            record = manager.register_dataset(manifest_p, data_ps, args.changelog)
            print(f"✓ Registered dataset '{record.id}' successfully.")
            return 0
        except Exception as e:
            print(f"✗ Registration failed: {e}", file=sys.stderr)
            return 1

    elif args.command == "validate":
        try:
            rec = manager.get_dataset(args.id)
            if not rec:
                print(f"✗ Dataset '{args.id}' not found.", file=sys.stderr)
                return 1
            version = args.version or list(rec.versions.keys())[-1]
            res = manager.validate_dataset(args.id, version)

            print(f"\n--- QUALITY GATE AUDIT REPORT: {args.id} (v{version}) ---")
            print(f"Status:        {'PASSED ✓' if res.passed else 'FAILED ✗'}")
            print(f"Quality Score: {res.score:.1f}%")
            print(f"Schema Valid:  {res.schema_valid}")
            print(f"Checks Passed: {res.passed_checks}/{res.total_checks}")

            if res.violations:
                print("\n[BLOCKING VIOLATIONS]:")
                for v in res.violations:
                    print(f"  • {v}")

            if res.warnings:
                print("\n[WARNINGS]:")
                for w in res.warnings:
                    print(f"  ! {w}")

            return 0 if res.passed else 2
        except Exception as e:
            print(f"✗ Validation error: {e}", file=sys.stderr)
            return 1

    elif args.command == "publish":
        try:
            rec = manager.get_dataset(args.id)
            if not rec:
                print(f"✗ Dataset '{args.id}' not found.", file=sys.stderr)
                return 1
            version = args.version or list(rec.versions.keys())[-1]
            manager.publish_dataset(args.id, version)
            print(
                f"✓ Successfully PUBLISHED dataset '{args.id}' v{version} to catalog!"
            )
            return 0
        except QualityGateFailedError as qe:
            print(f"\n✗ PUBLISH REJECTED: {qe}", file=sys.stderr)
            return 2
        except Exception as e:
            print(f"✗ Publish failed: {e}", file=sys.stderr)
            return 1

    elif args.command == "list":
        datasets = manager.list_all()
        print(f"\nCYBERSOFT DATASET REGISTRY ({len(datasets)} items)\n" + "=" * 60)
        for d in datasets:
            pub_v = d.latest_published_version or "None"
            print(f"• [{d.id}] {d.name}")
            print(
                f"  Domain: {d.domain} | Level: {d.difficulty_level} | Latest Published: {pub_v}"
            )
            if args.all:
                for v_num, ventry in d.versions.items():
                    score = (
                        f"{ventry.quality_gate.score:.1f}%"
                        if ventry.quality_gate
                        else "N/A"
                    )
                    print(
                        f"    - v{v_num}: state={ventry.state.value.upper()}, quality={score}"
                    )
        return 0

    elif args.command == "search":
        results = manager.search_datasets(
            query=args.query,
            domain=args.domain,
            difficulty=args.level,
            role=args.role,
            skill=args.skill,
        )
        print(
            f"\nSearch results: Found {len(results)} matching dataset(s)\n" + "=" * 60
        )
        for d in results:
            print(f"• [{d.id}] {d.name}")
            print(f"  Skills: {', '.join(d.skills)} | Domain: {d.domain}")
        return 0

    elif args.command == "build-catalog":
        try:
            gen = CatalogGenerator(manager)
            res = gen.build_all()
            print("✓ Catalog built successfully:")
            print(f"  • Markdown: {res['markdown']}")
            print(f"  • JSON API: {res['json']}")
            print(f"  • HTML Web: {res['html']}")
            return 0
        except Exception as e:
            print(f"✗ Build catalog failed: {e}", file=sys.stderr)
            return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
