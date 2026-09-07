"""Integration tests for validate_data CLI and exit codes."""

from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import unittest

TEST_DIR = Path(__file__).resolve().parent
TASK05_DIR = TEST_DIR.parent
CLI_SCRIPT = TASK05_DIR / "scripts" / "validate_data.py"
CLEAN_CSV = TASK05_DIR / "data_samples" / "clean_students.csv"
DIRTY_CSV = TASK05_DIR / "data_samples" / "dirty_students.csv"
RULES_JSON = TASK05_DIR / "config" / "course_students_rules.json"


class TestCLIIntegration(unittest.TestCase):
    def test_cli_clean_dataset_exit_code_zero(self):
        cmd = [
            sys.executable,
            str(CLI_SCRIPT),
            "-i",
            str(CLEAN_CSV),
            "-r",
            str(RULES_JSON),
            "-f",
            "all",
        ]
        res = subprocess.run(
            cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        self.assertEqual(
            res.returncode,
            0,
            f"Expected exit code 0, got {res.returncode}. Output: {res.stdout}",
        )
        self.assertIn("DATASET PASSED QUALITY AUDIT", res.stdout)

    def test_cli_dirty_dataset_exit_code_one(self):
        cmd = [
            sys.executable,
            str(CLI_SCRIPT),
            "-i",
            str(DIRTY_CSV),
            "-r",
            str(RULES_JSON),
            "-f",
            "all",
        ]
        res = subprocess.run(
            cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        self.assertEqual(
            res.returncode,
            1,
            f"Expected exit code 1, got {res.returncode}. Output: {res.stdout}",
        )
        self.assertIn("DATASET FAILED QUALITY AUDIT", res.stdout)

    def test_cli_missing_file_exit_code_two(self):
        cmd = [
            sys.executable,
            str(CLI_SCRIPT),
            "-i",
            "non_existent_file.csv",
            "-r",
            str(RULES_JSON),
        ]
        res = subprocess.run(
            cmd, capture_output=True, text=True, encoding="utf-8", errors="replace"
        )
        self.assertEqual(
            res.returncode, 2, f"Expected exit code 2, got {res.returncode}"
        )


if __name__ == "__main__":
    unittest.main()
