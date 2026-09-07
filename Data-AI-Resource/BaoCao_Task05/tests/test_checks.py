"""Unit Tests for 7 Core Data Quality Checks."""

from __future__ import annotations

from pathlib import Path
import sys
import unittest
import pandas as pd

# Setup imports
TEST_DIR = Path(__file__).resolve().parent
TASK05_DIR = TEST_DIR.parent
sys.path.insert(0, str(TASK05_DIR))

from src.checks import (  # noqa: E402
    CategoryCheck,
    DateCheck,
    DuplicateCheck,
    NullCheck,
    RangeCheck,
    SchemaCheck,
    TypeCheck,
)


class TestDataQualityChecks(unittest.TestCase):
    def setUp(self):
        self.sample_clean_df = pd.DataFrame(
            {
                "student_id": ["1001", "1002"],
                "full_name": ["Nguyen Van An", "Tran Thi Bich"],
                "email": ["an@cybersoft.edu.vn", "bich@cybersoft.edu.vn"],
                "age": ["22", "25"],
                "track": ["Data Science", "AI Engineer"],
                "course_id": ["DS-101", "AIE-201"],
                "course_name": ["Python", "Deep Learning"],
                "gpa": ["3.65", "3.85"],
                "tuition_fee": ["12000000.0", "18500000.0"],
                "status": ["graduated", "enrolled"],
                "enrollment_date": ["2023-01-01", "2023-05-01"],
                "graduation_date": ["2023-07-01", "2023-11-01"],
            }
        )

    # 1. Schema Check Tests
    def test_schema_check_pass(self):
        config = {
            "required_columns": ["student_id", "full_name", "email"],
            "allow_unexpected_columns": True,
        }
        res = SchemaCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_schema_check_missing_column(self):
        config = {
            "required_columns": ["student_id", "missing_col_xyz"],
            "allow_unexpected_columns": True,
        }
        res = SchemaCheck(config).run(self.sample_clean_df)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.issues), 1)
        self.assertEqual(res.issues[0].column, "missing_col_xyz")

    def test_schema_check_unexpected_column(self):
        config = {
            "required_columns": ["student_id"],
            "allow_unexpected_columns": False,
        }
        res = SchemaCheck(config).run(self.sample_clean_df)
        self.assertFalse(res.passed)
        self.assertGreater(len(res.issues), 0)

    # 2. Null Check Tests
    def test_null_check_pass(self):
        config = {"not_null_columns": ["student_id", "email"]}
        res = NullCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_null_check_detects_empty_and_nan(self):
        dirty_df = self.sample_clean_df.copy()
        dirty_df.loc[0, "email"] = ""
        dirty_df.loc[1, "student_id"] = "   "
        config = {"not_null_columns": ["student_id", "email"]}
        res = NullCheck(config).run(dirty_df)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.issues), 2)

    # 3. Duplicate Check Tests
    def test_duplicate_check_pass(self):
        config = {
            "primary_key": ["student_id"],
            "allow_duplicate_records": False,
        }
        res = DuplicateCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_duplicate_check_detects_primary_key_collision(self):
        dirty_df = pd.concat(
            [self.sample_clean_df, self.sample_clean_df.iloc[[0]]], ignore_index=True
        )
        config = {
            "primary_key": ["student_id"],
            "allow_duplicate_records": False,
        }
        res = DuplicateCheck(config).run(dirty_df)
        self.assertFalse(res.passed)
        self.assertGreater(len(res.issues), 0)

    # 4. Type Check Tests
    def test_type_check_pass(self):
        config = {
            "column_types": {
                "student_id": "integer",
                "email": "email",
                "gpa": "float",
            }
        }
        res = TypeCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_type_check_detects_invalid_types(self):
        dirty_df = self.sample_clean_df.copy()
        dirty_df.loc[0, "student_id"] = "ABC_INVALID"
        dirty_df.loc[1, "email"] = "not-an-email"
        config = {
            "column_types": {
                "student_id": "integer",
                "email": "email",
            }
        }
        res = TypeCheck(config).run(dirty_df)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.issues), 2)

    # 5. Range Check Tests
    def test_range_check_pass(self):
        config = {
            "columns": {
                "age": {"min": 18, "max": 65},
                "gpa": {"min": 0.0, "max": 4.0},
            }
        }
        res = RangeCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_range_check_detects_out_of_bounds(self):
        dirty_df = self.sample_clean_df.copy()
        dirty_df.loc[0, "age"] = "15"  # < 18
        dirty_df.loc[1, "gpa"] = "4.5"  # > 4.0
        config = {
            "columns": {
                "age": {"min": 18, "max": 65},
                "gpa": {"min": 0.0, "max": 4.0},
            }
        }
        res = RangeCheck(config).run(dirty_df)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.issues), 2)

    # 6. Category Check Tests
    def test_category_check_pass(self):
        config = {
            "columns": {
                "track": {
                    "allowed_values": ["Data Science", "AI Engineer"],
                    "case_sensitive": True,
                },
                "status": {
                    "allowed_values": ["graduated", "enrolled"],
                    "case_sensitive": False,
                },
            }
        }
        res = CategoryCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_category_check_detects_disallowed_category(self):
        dirty_df = self.sample_clean_df.copy()
        dirty_df.loc[0, "track"] = "Hacking Pro"
        config = {
            "columns": {
                "track": {
                    "allowed_values": ["Data Science", "AI Engineer"],
                    "case_sensitive": True,
                }
            }
        }
        res = CategoryCheck(config).run(dirty_df)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.issues), 1)

    # 7. Date Check Tests
    def test_date_check_pass(self):
        config = {
            "columns": {
                "enrollment_date": {"format": "%Y-%m-%d", "allow_future": False},
            },
            "chronological_order": [
                {"start_column": "enrollment_date", "end_column": "graduation_date"}
            ],
        }
        res = DateCheck(config).run(self.sample_clean_df)
        self.assertTrue(res.passed)
        self.assertEqual(len(res.issues), 0)

    def test_date_check_detects_chronological_violation(self):
        dirty_df = self.sample_clean_df.copy()
        dirty_df.loc[0, "enrollment_date"] = "2024-01-01"
        dirty_df.loc[0, "graduation_date"] = "2023-01-01"  # enrolled after graduated
        config = {
            "columns": {
                "enrollment_date": {"format": "%Y-%m-%d", "allow_future": True},
                "graduation_date": {"format": "%Y-%m-%d", "allow_future": True},
            },
            "chronological_order": [
                {"start_column": "enrollment_date", "end_column": "graduation_date"}
            ],
        }
        res = DateCheck(config).run(dirty_df)
        self.assertFalse(res.passed)
        self.assertEqual(len(res.issues), 1)


if __name__ == "__main__":
    unittest.main()
