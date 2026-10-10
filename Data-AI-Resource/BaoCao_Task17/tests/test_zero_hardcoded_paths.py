"""Audit test to enforce Zero Hardcoded Personal Paths across Task 17 codebase."""

from pathlib import Path
import re


def test_zero_hardcoded_personal_paths():
    """Verify that no personal machine workstation paths are hardcoded in source code."""
    task17_root = Path(__file__).resolve().parent.parent

    # Forbidden workstation path patterns
    forbidden_pattern = re.compile(
        r"(?:[c-zC-Z]:[\\/](?:users|Users)[\\/][a-zA-Z0-9_-]+[\\/])",
        re.IGNORECASE,
    )

    violations = []
    scanned_extensions = [".py", ".sh", ".json", ".yaml", ".yml", ".md"]

    for sub_dir in ["src", "scripts", "tests", "data"]:
        dir_path = task17_root / sub_dir
        if not dir_path.exists():
            continue
        for file_path in dir_path.rglob("*"):
            if file_path.is_file() and file_path.suffix in scanned_extensions:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                matches = forbidden_pattern.findall(content)
                if matches:
                    violations.append(
                        f"{file_path.relative_to(task17_root)}: {matches}"
                    )

    assert not violations, f"Detected hardcoded personal paths in Task 17: {violations}"
