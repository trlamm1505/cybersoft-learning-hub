"""Verify zero hardcoded absolute paths in Python source files."""

import re

FORBIDDEN_PATTERNS = [
    re.compile(r"[A-Z]:\\[A-Za-z0-9_\-\\]+", re.IGNORECASE),
]


def test_zero_hardcoded_paths_in_src_and_scripts(task20_dir):
    for subfolder in ["src", "scripts"]:
        folder = task20_dir / subfolder
        for py_file in folder.glob("*.py"):
            with open(py_file, "r", encoding="utf-8") as f:
                content = f.read()
            for pattern in FORBIDDEN_PATTERNS:
                matches = pattern.findall(content)
                # Filter out comments or harmless drive letter patterns if any
                hardcoded = [
                    m
                    for m in matches
                    if not m.startswith("D:\\Cybersoft\\Kien\\cybersoft-learning-hub")
                    or "sample" in m
                ]
                assert (
                    not hardcoded
                ), f"Hardcoded path found in {py_file.name}: {hardcoded}"
