#!/usr/bin/env python3
"""
CyberSoft Data & AI Lab - Day 01 DoD Validation Script
Validates 01_problem_map.md structure, user personas, backlog count, impact/effort matrix, and metrics.
"""

import os
import sys
import re

def validate_day01():
    # Target file in current directory or relative path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    target_file = os.path.join(os.path.dirname(script_dir), "01_problem_map.md")

    print("=" * 50)
    print("CYBERSOFT DATA & AI LAB - DAY 01 VALIDATION HARNESS")
    print("=" * 50)

    if not os.path.exists(target_file):
        print(f"[FAIL] Target file does not exist: {target_file}")
        sys.exit(1)
    print(f"[PASS] Target file exists: {target_file}")

    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Check Problem Statement
    if "## 1. Problem Statement" not in content and "## 1. Tuyên bố bài toán" not in content:
        print("[FAIL] Problem Statement section missing")
        sys.exit(1)
    print("[PASS] Problem Statement section detected")

    # 2. Check User Personas (>= 3 groups in table)
    personas_rows = re.findall(r"\|\s*\*\*USR-\d+\*\*\s*\|", content)
    if len(personas_rows) < 3:
        print(f"[FAIL] Expected at least 3 user personas, found {len(personas_rows)}")
        sys.exit(1)
    print(f"[PASS] User Personas section detected (Count: {len(personas_rows)} >= 3)")

    # 3. Check Backlog items in Section 4 (must be 15 rows)
    backlog_match = re.search(r"## 4\. Danh mục 15 Nhu cầu tài nguyên.*?\n(.*?)\n---", content, re.DOTALL)
    if not backlog_match:
        print("[FAIL] Resource Backlog section missing or malformed")
        sys.exit(1)
    req_rows = re.findall(r"\|\s*\*\*REQ-\d+\*\*\s*\|", backlog_match.group(1))
    if len(req_rows) != 15:
        print(f"[FAIL] Expected 15 backlog items in Section 4, but found {len(req_rows)}")
        sys.exit(1)
    print(f"[PASS] Backlog Table detected with 15 valid rows (Required: 15)")

    # 4. Check Impact / Effort Matrix in Section 5 (15 items)
    matrix_match = re.search(r"## 5\. Ma trận Đánh giá Impact / Effort.*?\n(.*?)\n---", content, re.DOTALL)
    if not matrix_match:
        print("[FAIL] Impact / Effort Matrix section missing or malformed")
        sys.exit(1)
    impact_items = re.findall(r"\|\s*\*\*REQ-\d+\*\*\s*\|\s*.*?\|\s*\*\*\d\*\*\s*\|\s*\*\*\d\*\*\s*\|", matrix_match.group(1))
    if len(impact_items) != 15:
        print(f"[FAIL] Expected 15 Impact/Effort ratings in Section 5, found {len(impact_items)}")
        sys.exit(1)
    print(f"[PASS] Impact/Effort Matrix section detected with 15 items")

    # 5. Check MVP Scope
    if "## 6. Đề xuất Phạm vi MVP 30 Ngày" not in content:
        print("[FAIL] MVP Scope section missing")
        sys.exit(1)
    print("[PASS] MVP Scope section detected (3-tier priority)")

    # 6. Check Success Metrics
    if "## 7. Chỉ số Đo lường Thành công" not in content:
        print("[FAIL] Success Metrics section missing")
        sys.exit(1)
    print("[PASS] Success Metrics section detected")

    print("-" * 50)
    print("SUCCESS: All Day 01 DoD requirements passed!")
    print("=" * 50)

if __name__ == "__main__":
    validate_day01()
