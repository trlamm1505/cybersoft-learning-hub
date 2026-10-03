"""
Demo Workflow for Capstone DA-02: Inventory Optimization & Logistics Analytics.
Executes 4-Step Verification Workflow:
  Step 1: Directory Integrity & Dataset Sanity Check
  Step 2: Zero Answer Leakage Regex Scan
  Step 3: 3-Way Cross-Verification Engine Execution
  Step 4: Auto-Grader Execution (Scoring 60.0/60.0 points)
"""

import os
import sys
import re

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def step1_directory_integrity(base_dir):
    print("\n[BƯỚC 1/4] KIỂM TRA CẤU TRÚC THƯ MỤC VÀ TÍNH TOÀN VẸN DỮ LIỆU...")
    required_dirs = [
        "projects/DA-02_inventory_operations/student_edition/data/clean",
        "projects/DA-02_inventory_operations/student_edition/data/dirty",
        "projects/DA-02_inventory_operations/student_edition/starter_kit",
        "projects/DA-02_inventory_operations/instructor_edition/solutions",
        "projects/DA-02_inventory_operations/instructor_edition/grading",
        "scripts",
        "tests",
    ]
    for rd in required_dirs:
        full_p = os.path.join(base_dir, rd)
        if not os.path.exists(full_p):
            print(f"  [FAIL] Missing required directory: {rd}")
            return False
    print("  [PASS] Toàn bộ 7 thư mục cốt lõi của Capstone DA-02 tồn tại đầy đủ.")
    return True


def step2_zero_leakage_scan(base_dir):
    print("\n[BƯỚC 2/4] QUÉT PHÒNG VỆ RÒ RỈ ĐÁP ÁN (ZERO ANSWER LEAKAGE SCAN)...")
    student_dir = os.path.join(
        base_dir, "projects", "DA-02_inventory_operations", "student_edition"
    )

    # Values that must NOT appear in student_edition text files
    ground_truth_patterns = [
        r"867[,.]?636",  # Valuation
        r"814[,.]?742",  # COGS
        r"300\.4\s*d",  # DOH
        r"670[,.]?536",  # Avg inventory
    ]

    violations = []
    for root, _, files in os.walk(student_dir):
        # Do not scan data CSVs, only text/markdown/code/json files
        for f in files:
            if f.endswith((".md", ".sql", ".py", ".json")):
                fp = os.path.join(root, f)
                with open(fp, "r", encoding="utf-8", errors="ignore") as file_obj:
                    content = file_obj.read()
                    for pat in ground_truth_patterns:
                        if re.search(pat, content):
                            violations.append((f, pat))

    if violations:
        print(f"  [FAIL] Phát hiện rò rỉ đáp án trong student_edition: {violations}")
        return False
    else:
        print(
            "  [PASS] Miền student_edition hoàn toàn sạch (100% CLEAN - Không rò rỉ Ground Truth)."
        )
        return True


def step3_cross_verification(base_dir):
    print("\n[BƯỚC 3/4] KHỞI CHẠY ĐỘNG CƠ ĐỐI SOÁT SỐ LIỆU 3 CHIỀU...")
    from cross_verification_engine import run_cross_verification

    success = run_cross_verification()
    if success:
        print(
            "  [PASS] Đối soát 3 chiều độc lập (SQL vs Pandas vs Matrix) thành công (Delta = 0.00)."
        )
        return True
    else:
        print("  [FAIL] Động cơ đối soát số liệu ném lỗi hoặc có độ lệch số học.")
        return False


def step4_auto_grader(base_dir):
    print("\n[BƯỚC 4/4] KHỞI CHẠY MÁY CHẤM TỰ ĐỘNG (AUTO-GRADER 60 ĐIỂM)...")
    sys.path.append(
        os.path.join(
            base_dir,
            "projects",
            "DA-02_inventory_operations",
            "instructor_edition",
            "grading",
        )
    )
    from auto_grader import grade_solution

    success = grade_solution()
    if success:
        print(
            "  [PASS] Máy chấm tự động hoàn tất và đạt điểm tuyệt đối 60.0 / 60.0 điểm."
        )
        return True
    else:
        print("  [FAIL] Máy chấm tự động không đạt điểm chuẩn.")
        return False


def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    print("=" * 80)
    print("CYBERSOFT DATA & AI LAB — DEMO WORKFLOW KIỂM ĐỊNH TOÀN DIỆN CAPSTONE DA-02")
    print("=" * 80)

    ok1 = step1_directory_integrity(base_dir)
    ok2 = step2_zero_leakage_scan(base_dir)
    ok3 = step3_cross_verification(base_dir)
    ok4 = step4_auto_grader(base_dir)

    print("\n" + "=" * 80)
    if ok1 and ok2 and ok3 and ok4:
        print(">>> TỔNG KẾT: 4/4 BƯỚC KIỂM ĐỊNH ĐẠT 100% THÀNH CÔNG (EXIT CODE: 0) <<<")
        print("=" * 80)
        return 0
    else:
        print(">>> TỔNG KẾT: CÓ LỖI XẢY RA TRONG QUY TRÌNH KIỂM ĐỊNH <<<")
        print("=" * 80)
        return 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
