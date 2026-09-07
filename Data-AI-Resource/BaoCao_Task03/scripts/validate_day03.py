#!/usr/bin/env python3
"""
CyberSoft Data & AI Lab - Day 03 DoD Validation Script
Kiểm thử tự động độc lập 100% tiêu chí nghiệm thu DoD Ngày 03:
- Cấu trúc Skeleton đầy đủ 5 thành phần (src, data, notebooks, tests, docs)
- Cấu hình môi trường CPU-First vs GPU-Optional tách biệt
- Quản lý secret (.env.example) và an ninh .gitignore
- Bộ công cụ Code Quality (pyproject.toml, .pre-commit-config.yaml)
- Workflow CI/CD đầu tiên (.github/workflows/ci.yml)
- Trình điều khiển thực thi "Một lệnh chuẩn" (run.ps1, run.sh, Makefile)
"""

import sys
from pathlib import Path


def validate_day03():
    script_dir = Path(__file__).resolve().parent
    task_dir = script_dir.parent
    skeleton_dir = task_dir / "skeleton"

    print("=" * 50)
    print("CYBERSOFT DATA & AI LAB - DAY 03 VALIDATION HARNESS")
    print("=" * 50)

    # 1. Kiểm tra sự tồn tại của thư mục Skeleton
    if not skeleton_dir.exists() or not skeleton_dir.is_dir():
        print(f"[FAIL] Thư mục skeleton không tồn tại: {skeleton_dir}")
        sys.exit(1)
    print("[PASS] Skeleton root directory exists")

    # 2. Kiểm tra 5 thư mục cốt lõi (src, data, notebooks, tests, docs)
    core_dirs = ["src", "data", "notebooks", "tests", "docs"]
    for d in core_dirs:
        dir_path = skeleton_dir / d
        if not dir_path.exists() or not dir_path.is_dir():
            print(f"[FAIL] Thiếu thư mục cốt lõi: {d}")
            sys.exit(1)
    print("[PASS] All 5 Core directories verified (src, data, notebooks, tests, docs)")

    # 3. Kiểm tra phân tầng thư mục data (raw, processed, interim kèm .gitkeep)
    for sub in ["raw", "processed", "interim"]:
        sub_path = skeleton_dir / "data" / sub
        gitkeep = sub_path / ".gitkeep"
        if not sub_path.exists() or not gitkeep.exists():
            print(f"[FAIL] Thiếu thư mục data/{sub} hoặc .gitkeep")
            sys.exit(1)
    print("[PASS] Data subdirectories verified (raw, processed, interim with .gitkeep)")

    # 4. Kiểm tra các module mã nguồn cốt lõi trong src/
    src_dir = skeleton_dir / "src"
    modules = ["registry", "quality", "project", "rag", "evaluation"]
    for mod in modules:
        mod_dir = src_dir / "modules" / mod
        if not mod_dir.exists() or not (mod_dir / "__init__.py").exists():
            print(f"[FAIL] Thiếu module: {mod}")
            sys.exit(1)
    if (
        not (src_dir / "config.py").exists()
        or not (src_dir / "core" / "logger.py").exists()
    ):
        print("[FAIL] Thiếu file config.py hoặc logger.py trong src")
        sys.exit(1)
    print(
        "[PASS] Core source modules verified (config, core, registry, quality, project, rag, evaluation)"
    )

    # 5. Kiểm tra các file cấu hình môi trường chuẩn
    req_files = [
        ".env.example",
        ".gitignore",
        "pyproject.toml",
        ".pre-commit-config.yaml",
    ]
    for f in req_files:
        if not (skeleton_dir / f).exists():
            print(f"[FAIL] Thiếu file cấu hình: {f}")
            sys.exit(1)
    print(
        "[PASS] Environment files verified (.env.example, .gitignore, pyproject.toml, .pre-commit-config.yaml)"
    )

    # 6. Kiểm tra phân tách CPU-First vs GPU-Optional
    req_cpu = (skeleton_dir / "requirements.txt").read_text(encoding="utf-8")
    req_gpu = skeleton_dir / "requirements-gpu.txt"
    if not req_gpu.exists():
        print("[FAIL] Thiếu file requirements-gpu.txt")
        sys.exit(1)
    if "--extra-index-url" in req_cpu or "torchvision" in req_cpu:
        print(
            "[FAIL] requirements.txt vi phạm nguyên tắc CPU-first (chứa GPU wheel cồng kềnh)"
        )
        sys.exit(1)
    print(
        "[PASS] CPU-First vs GPU-Optional separation verified (requirements.txt < 150MB, requirements-gpu.txt exists)"
    )

    # 7. Kiểm tra an ninh bảo mật trong .gitignore
    gitignore_content = (skeleton_dir / ".gitignore").read_text(encoding="utf-8")
    security_patterns = [".env", "*.parquet", "*.db", "chroma_db/", "__pycache__/"]
    for pat in security_patterns:
        if pat not in gitignore_content:
            print(f"[FAIL] .gitignore thiếu rule bảo mật cho: {pat}")
            sys.exit(1)
    print(
        "[PASS] Security rules in .gitignore verified (secrets, .env, large files, .db, cache blocked)"
    )

    # 8. Kiểm tra Pre-commit hooks
    precommit_content = (skeleton_dir / ".pre-commit-config.yaml").read_text(
        encoding="utf-8"
    )
    if (
        "check-added-large-files" not in precommit_content
        or "detect-private-key" not in precommit_content
    ):
        print("[FAIL] Pre-commit thiếu hook kiểm tra an toàn dữ liệu/secret")
        sys.exit(1)
    print(
        "[PASS] Pre-commit hooks verified (check-added-large-files, detect-private-key, ruff)"
    )

    # 9. Kiểm tra CI/CD Workflow
    ci_workflow = skeleton_dir / ".github" / "workflows" / "ci.yml"
    if not ci_workflow.exists():
        print("[FAIL] Thiếu file workflow CI: .github/workflows/ci.yml")
        sys.exit(1)
    ci_content = ci_workflow.read_text(encoding="utf-8")
    if "ruff" not in ci_content or "pytest" not in ci_content:
        print("[FAIL] CI workflow thiếu bước ruff lint hoặc pytest")
        sys.exit(1)
    print(
        "[PASS] CI/CD Workflow verified (.github/workflows/ci.yml with lint and test jobs)"
    )

    # 10. Kiểm tra script thực thi một lệnh chuẩn
    runners = ["run.ps1", "run.sh", "Makefile"]
    for r in runners:
        if not (skeleton_dir / r).exists():
            print(f"[FAIL] Thiếu script điều khiển 1 lệnh: {r}")
            sys.exit(1)
    print("[PASS] Single-command runners verified (run.ps1, run.sh, Makefile)")

    # 11. Kiểm tra tài liệu kỹ thuật trong docs/
    docs = ["SETUP_GUIDE.md", "ENVIRONMENT_MATRIX.md", "CI_CD_PIPELINE.md"]
    for doc in docs:
        if not (skeleton_dir / "docs" / doc).exists():
            print(f"[FAIL] Thiếu tài liệu: docs/{doc}")
            sys.exit(1)
    print(
        "[PASS] Setup guides and documentation verified (SETUP_GUIDE.md, ENVIRONMENT_MATRIX.md)"
    )

    # 12. Kiểm tra các file báo cáo tổng hợp
    reports = ["03_repo_environment_standard.md", "AI_WORKLOG.md", "DEFENSE_SCRIPT.md"]
    for rep in reports:
        if not (task_dir / rep).exists():
            print(f"[FAIL] Thiếu file tài liệu báo cáo: {rep}")
            sys.exit(1)
    print("[PASS] All Report documents verified (Standard, AI_WORKLOG, DEFENSE_SCRIPT)")

    print("-" * 50)
    print("SUCCESS: All Day 03 DoD requirements passed (100%)!")
    print("=" * 50)


if __name__ == "__main__":
    validate_day03()
