"""Test auditing that no personal absolute hardcoded paths exist in Task 19 codebase."""

from pathlib import Path
import re

TASK_DIR = Path(__file__).resolve().parent.parent

FORBIDDEN_PATTERNS = [
    r"[a-zA-Z]:\\[Uu]sers\\[a-zA-Z0-9_-]+\\",
    r"[a-zA-Z]:\\[Cc]ybersoft\\",
    r"/home/[a-zA-Z0-9_-]+/",
]


def test_zero_hardcoded_personal_paths():
    scanned_extensions = {".py", ".json", ".md", ".txt", ".html", ".js", ".css"}
    violations = []

    for file_path in TASK_DIR.rglob("*"):
        if file_path.is_file() and file_path.suffix in scanned_extensions:
            # Skip pytest cache or git files
            if ".pytest_cache" in str(file_path) or ".git" in str(file_path):
                continue

            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                for line_idx, line in enumerate(content.splitlines(), start=1):
                    for pattern in FORBIDDEN_PATTERNS:
                        if re.search(pattern, line):
                            # Allow mentioning zero-hardcoded path policies in docs/test
                            if "Zero Hardcoded" in line or "FORBIDDEN" in line:
                                continue
                            violations.append(
                                f"{file_path.relative_to(TASK_DIR)}:L{line_idx} - {line.strip()}"
                            )
            except Exception:
                pass

    assert len(violations) == 0, (
        f"Found {len(violations)} hardcoded path violations:\n" + "\n".join(violations)
    )
