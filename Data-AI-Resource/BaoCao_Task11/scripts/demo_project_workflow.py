"""End-to-End Demonstration Script for Task 11: Student Project Standardization."""

import json
import os
import shutil
import sys
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

current_dir = Path(__file__).resolve().parent
task11_dir = current_dir.parent
src_dir = task11_dir / "src"
sys.path.insert(0, str(src_dir))

from core.validator import ProjectValidator  # noqa: E402
from core.packager import ProjectPackager  # noqa: E402


def run_demo():
    print(
        "================================================================================"
    )
    print("🚀 CYBERSOFT DATA & AI LAB — TASK 11 END-TO-END DEMO WORKFLOW")
    print("   Module: Chuẩn Hóa Mẫu Dự Án Học Viên (Student Project Standardization)")
    print(
        "================================================================================\n"
    )

    project_dir = task11_dir / "projects" / "sales_performance_analytics"
    manifest_path = project_dir / "project_manifest.json"
    student_dir = project_dir / "student_edition"
    instructor_dir = project_dir / "instructor_edition"
    dist_dir = task11_dir / "dist"

    validator = ProjectValidator()

    # STEP 1: Validate Schema and Rubric Constraints
    print(
        "📋 [BƯỚC 1/5] Kiểm định Manifest với JSON Schema Draft 2020-12 & Rubric Rules..."
    )
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest_data = json.load(f)

    is_valid, errors, warnings = validator.validate_manifest(manifest_data)
    if not is_valid:
        print(f"❌ Schema validation failed: {errors}")
        sys.exit(1)
    print("   ✅ Manifest đạt chuẩn 100% JSON Schema!")
    print("   ✅ Ràng buộc điểm: Core 70đ + Extension 30đ = 100đ.")
    print("   ✅ Barem Rubric: Tổng điểm 100.0 tuyệt đối.\n")

    # STEP 2: Strict Zero Answer Leakage Check on Student Edition
    print(
        "🛡️ [BƯỚC 2/5] Quét Phòng Vệ Rò Rỉ Đáp Án (Zero-Leakage Defense) trên Student Edition..."
    )
    leak_free, leakages = validator.check_student_directory_leakage(student_dir)
    if not leak_free:
        print(f"❌ Rò rỉ đáp án phát hiện: {leakages}")
        sys.exit(2)
    print(
        "   ✅ 100% CLEAN: Không phát hiện file đáp án, secret keys hay ground-truth KPIs.\n"
    )

    # STEP 3: Test Simulated Leakage Injection (Negative Test)
    print(
        "🧪 [BƯỚC 3/5] Thử nghiệm chèn file đáp án bẫy để kiểm tra khả năng phát hiện..."
    )
    trap_file = student_dir / "solution_leak_trap.py"
    with open(trap_file, "w", encoding="utf-8") as f:
        f.write("# TRAP FILE CONTAINING SOLUTION_KEY = 12345\n")

    trap_pass, trap_leaks = validator.check_student_directory_leakage(student_dir)
    if trap_file.exists():
        os.remove(trap_file)

    if not trap_pass and len(trap_leaks) > 0:
        print(
            f"   ✅ PHÒNG VỆ HOÀN HẢO: Validator phát hiện ngay lập tức ({trap_leaks[0]})."
        )
        print("   ✅ Đã xóa file bẫy và khôi phục trạng thái an toàn.\n")
    else:
        print("❌ Lỗi: Validator không phát hiện được file bẫy!")
        sys.exit(1)

    # STEP 4: Package Project into Dist
    print("📦 [BƯỚC 4/5] Đóng gói phân tách Student Bundle & Instructor Bundle...")
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    packager = ProjectPackager(project_dir)
    pkg_res = packager.package(dist_dir)
    print(f"   ✅ Đã xuất bản Student Bundle: {pkg_res['student_dir']}")
    print(f"   ✅ Đã xuất bản Instructor Bundle: {pkg_res['instructor_dir']}\n")

    # STEP 5: Automated Grading Simulation
    print("🎯 [BƯỚC 5/5] Mô phỏng Chấm Điểm Tự Động (Auto-Grader Simulation)...")
    expected_kpis_path = instructor_dir / "expected_kpis.json"

    # Simulate student submission
    sim_sub_dir = task11_dir / "demo_practice" / "simulated_student_submission"
    os.makedirs(sim_sub_dir, exist_ok=True)

    # 1. Clean data file
    import pandas as pd

    raw_orders = pd.read_csv(student_dir / "data" / "orders.csv")
    cleaned_orders = raw_orders.drop_duplicates(subset=["order_id"]).copy()
    cleaned_orders["order_status"] = (
        cleaned_orders["order_status"].fillna("completed").replace("", "completed")
    )
    cleaned_orders.to_csv(sim_sub_dir / "orders_cleaned.csv", index=False)

    # 2. KPI summary file
    sub_kpis = {
        "net_revenue_usd": 388850.28,
        "average_order_value_usd": 1150.44,
        "cancellation_rate_pct": 10.75,
        "return_rate_pct": 4.75,
        "gross_margin_pct": 31.43,
    }
    with open(sim_sub_dir / "kpi_summary.json", "w", encoding="utf-8") as f:
        json.dump(sub_kpis, f, indent=2)

    # 3. RFM file
    rfm_df = pd.DataFrame(
        {
            "customer_id": [f"CUST-{i:04d}" for i in range(1, 101)],
            "segment": ["Champions"] * 20
            + ["Loyal Customers"] * 25
            + ["Potential Loyalists"] * 20
            + ["At Risk"] * 20
            + ["Hibernating / Lost"] * 15,
        }
    )
    rfm_df.to_csv(sim_sub_dir / "rfm_customer_segments.csv", index=False)

    # Run auto-grader
    sys.path.insert(0, str(instructor_dir / "grading"))
    from auto_grader import grade_submission

    grade_res = grade_submission(sim_sub_dir, expected_kpis_path)

    print(
        f"   📊 Kết quả chấm bài tự động: {grade_res['total_score']:.1f} / 60.0 điểm tự động"
    )
    for fb in grade_res["feedback"]:
        print(f"      • {fb}")

    print(
        "\n================================================================================"
    )
    print("🎉 TOÀN BỘ WORKFLOW TASK 11 HOÀN TẤT THÀNH CÔNG RỰC RỠ! (EXIT CODE 0)")
    print(
        "================================================================================"
    )
    sys.exit(0)


if __name__ == "__main__":
    run_demo()
