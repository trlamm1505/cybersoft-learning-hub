#!/usr/bin/env python3
"""
CyberSoft Data & AI Lab - Day 02 DoD Validation Script
Validates 02_architecture.md and ADR-001_tech_stack.md structure,
5 core modules, data lifecycle flow, error states, MVP boundaries, API contracts, and tech stack rationale.
"""

import os
import sys
import re

def validate_day02():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    task_dir = os.path.dirname(script_dir)
    arch_file = os.path.join(task_dir, "02_architecture.md")
    adr_file = os.path.join(task_dir, "ADR-001_tech_stack.md")

    print("=" * 50)
    print("CYBERSOFT DATA & AI LAB - DAY 02 VALIDATION HARNESS")
    print("=" * 50)

    # 1. Check file existence
    if not os.path.exists(arch_file):
        print(f"[FAIL] Architecture file does not exist: {arch_file}")
        sys.exit(1)
    print(f"[PASS] Target architecture file exists: {arch_file}")

    if not os.path.exists(adr_file):
        print(f"[FAIL] ADR-001 file does not exist: {adr_file}")
        sys.exit(1)
    print(f"[PASS] Target ADR-001 file exists: {adr_file}")

    with open(arch_file, "r", encoding="utf-8") as f:
        arch_content = f.read()

    with open(adr_file, "r", encoding="utf-8") as f:
        adr_content = f.read()

    # 2. Check 5 Core Modules
    required_modules = [
        "Dataset Registry",
        "Data Quality Harness",
        "Project Bank",
        "Semantic Search",
        "Evaluation Harness"
    ]
    missing_modules = [m for m in required_modules if m.lower() not in arch_content.lower()]
    if missing_modules:
        print(f"[FAIL] Missing required module(s) in architecture: {missing_modules}")
        sys.exit(1)
    print(f"[PASS] All 5 Core Modules verified (Registry, Quality, Project, RAG, Evaluation)")

    # 3. Check Data Lifecycle 4-step Flow
    required_steps = ["ingest", "validate", "publish", "search"]
    for step in required_steps:
        if step not in arch_content.lower():
            print(f"[FAIL] Missing lifecycle step: {step}")
            sys.exit(1)
    print(f"[PASS] Data Lifecycle 4-step flow verified (Ingest -> Validate -> Publish -> Search)")

    # 4. Check Error States & Fallback Matrix
    error_codes = re.findall(r"ERR_[A-Z0-9_]+", arch_content)
    if len(set(error_codes)) < 4:
        print(f"[FAIL] Expected at least 4 unique error codes in error matrix, found {len(set(error_codes))}: {set(error_codes)}")
        sys.exit(1)
    print(f"[PASS] Error States and Fallback Matrix verified ({len(set(error_codes))} unique error codes detected)")

    # 5. Check MVP vs Post-MVP Boundaries
    if "MVP" not in arch_content or "Post-MVP" not in arch_content:
        print("[FAIL] Architecture does not clearly distinguish MVP vs Post-MVP")
        sys.exit(1)
    print(f"[PASS] MVP vs Post-MVP boundaries clearly distinguished")

    # 6. Check API Specifications & Contracts
    api_endpoints = re.findall(r"/api/v1/[a-zA-Z0-9/_]+", arch_content)
    if len(set(api_endpoints)) < 3:
        print(f"[FAIL] Expected at least 3 API endpoints defined, found {len(set(api_endpoints))}")
        sys.exit(1)
    print(f"[PASS] API Specifications & Contracts defined ({len(set(api_endpoints))} endpoints detected)")

    # 7. Check ADR-001 Tech Stack Rationale
    tech_keywords = ["FastAPI", "SQLite", "ChromaDB", "all-MiniLM-L6-v2", "Python"]
    missing_tech = [t for t in tech_keywords if t.lower() not in adr_content.lower()]
    if missing_tech:
        print(f"[FAIL] ADR-001 missing rationale for key technology: {missing_tech}")
        sys.exit(1)
    print(f"[PASS] ADR-001 Tech Stack rationale & trade-offs verified")

    print("-" * 50)
    print("SUCCESS: All Day 02 DoD requirements passed (100%)!")
    print("=" * 50)

if __name__ == "__main__":
    validate_day02()
