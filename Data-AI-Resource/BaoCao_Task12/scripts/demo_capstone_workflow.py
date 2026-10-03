"""CyberSoft Mart - Capstone DA-01 End-to-End Demo Workflow.

Kịch bản tự động hóa mô phỏng toàn bộ quy trình:
1. Kiểm tra tính toàn vẹn cấu trúc dự án (Directory & Files Audit).
2. Quét chống rò rỉ đáp án Zero-Leakage trong thư mục student_edition.
3. Chạy kiểm toán đối soát chéo 3 chiều (3-Way Cross-Verification: SQL vs Python vs Matrix Math).
4. Khởi chạy máy chấm tự động Auto-Grader trên bài nộp mẫu đạt 60.0/60.0 điểm định lượng.
5. Tổng hợp báo cáo kiểm định và trả về mã thoát chuẩn POSIX (Exit Code 0).
"""

import os
import sys
import json
import re

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Import module nội bộ
from cross_verification_engine import CrossVerificationEngine


def step_1_audit_structure(base_dir: str):
    print("\n📋 [BƯỚC 1/4] Kiểm tra Cấu Trúc Dự Án Capstone DA-01...")
    required_student_files = [
        "PROJECT_BRIEF.md",
        "rubric.json",
        "HINTS.md",
        "data/orders.csv",
        "data/order_items.csv",
        "data/customers.csv",
        "data/products.csv",
        "starter_kit/data_dictionary.md",
        "starter_kit/analysis_starter.sql",
        "starter_kit/analysis_starter.py",
        "starter_kit/excel_template_guide.md",
        "starter_kit/submission_checklist.md",
    ]
    student_dir = os.path.join(
        base_dir, "projects", "DA-01_sales_performance", "student_edition"
    )
    for f in required_student_files:
        p = os.path.join(student_dir, f)
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing student file: {f}")
    print(
        f"   ✅ Toàn bộ {len(required_student_files)} tài nguyên trong student_edition đầy đủ và hợp lệ!"
    )

    required_instructor_files = [
        "SOLUTION_MANUAL.md",
        "expected_kpis.json",
        "common_pitfalls.md",
        "solutions/solution_queries.sql",
        "solutions/solution_da01_pipeline.py",
        "solutions/excel_model_specification.md",
        "grading/auto_grader.py",
    ]
    instructor_dir = os.path.join(
        base_dir, "projects", "DA-01_sales_performance", "instructor_edition"
    )
    for f in required_instructor_files:
        p = os.path.join(instructor_dir, f)
        if not os.path.exists(p):
            raise FileNotFoundError(f"Missing instructor file: {f}")
    print(
        f"   ✅ Toàn bộ {len(required_instructor_files)} tài nguyên trong instructor_edition đầy đủ và bảo mật!"
    )


def step_2_check_zero_leakage(base_dir: str):
    print("\n🛡️ [BƯỚC 2/4] Quét Phòng Vệ Chống Rò Rỉ Đáp Án (Zero-Leakage Scanner)...")
    student_dir = os.path.join(
        base_dir, "projects", "DA-01_sales_performance", "student_edition"
    )
    forbidden_patterns = [
        r".*solution.*",
        r".*expected_kpi.*",
        r".*auto_grader.*",
        r".*ground_truth.*",
    ]

    leaked = []
    for root, _, files in os.walk(student_dir):
        for file in files:
            rel = os.path.relpath(os.path.join(root, file), student_dir)
            for pat in forbidden_patterns:
                if re.match(pat, file, re.IGNORECASE):
                    leaked.append(rel)

    if leaked:
        print(f"   ❌ PHÁT HIỆN RÒ RỈ ĐÁP ÁN: {leaked}")
        sys.exit(2)
    print(
        "   ✅ Kết quả quét: 100% CLEAN — Không tồn tại bất kỳ tệp lời giải nào trong thư mục học viên!"
    )


def step_3_run_cross_verification(base_dir: str):
    print("\n🔬 [BƯỚC 3/4] Thực thi Đối Soát Số Liệu 3 Chiều Độc Lập...")
    data_dir = os.path.join(
        base_dir, "projects", "DA-01_sales_performance", "student_edition", "data"
    )
    engine = CrossVerificationEngine(data_dir)
    audit_res = engine.verify_all()

    if not audit_res["is_perfect_reconciliation"]:
        print("   ❌ Lỗi đối soát: Có sai lệch giữa 3 phương pháp!")
        sys.exit(1)

    print(
        "   ✅ 3 Phương pháp đối soát độc lập (SQL, Pandas, Matrix Line-Item) khớp tuyệt đối:"
    )
    print(
        f"      • Net Revenue:    ${audit_res['comparisons'][0]['net_revenue_usd']:,.2f}"
    )
    print(
        f"      • Gross Margin:   {audit_res['comparisons'][0]['gross_margin_pct']:.2f}%"
    )
    print(f"      • AOV:            ${audit_res['comparisons'][0]['aov_usd']:,.2f}")
    print("      • Delta chênh lệch: $0.00 (Chính xác 100%)")


def step_4_test_auto_grader(base_dir: str):
    print("\n🤖 [BƯỚC 4/4] Kiểm thử Khởi Chạy Bộ Chấm Tự Động (Auto-Grading Engine)...")
    # Tạo dữ liệu học viên mẫu chuẩn
    from solution_da01_pipeline import DA01SolutionPipeline

    data_dir = os.path.join(
        base_dir, "projects", "DA-01_sales_performance", "student_edition", "data"
    )
    pipe = DA01SolutionPipeline(data_dir)
    pipe.load_data().clean_data()
    kpis = pipe.compute_financial_kpis()
    rfm = pipe.compute_rfm()

    tmp_orders_path = os.path.join(base_dir, "scripts", "temp_student_orders.csv")
    tmp_kpis_path = os.path.join(base_dir, "scripts", "temp_student_kpis.json")

    pipe.cleaned_orders.to_csv(tmp_orders_path, index=False)
    kpis["rfm_segment_distribution"] = rfm["segment"].value_counts().to_dict()
    with open(tmp_kpis_path, "w", encoding="utf-8") as f:
        json.dump(kpis, f, indent=2)

    from auto_grader import DA01AutoGrader

    expected_path = os.path.join(
        base_dir,
        "projects",
        "DA-01_sales_performance",
        "instructor_edition",
        "expected_kpis.json",
    )
    grader = DA01AutoGrader(tmp_orders_path, tmp_kpis_path, expected_path)
    eval_res = grader.evaluate()

    # Dọn dẹp tệp tạm
    if os.path.exists(tmp_orders_path):
        os.remove(tmp_orders_path)
    if os.path.exists(tmp_kpis_path):
        os.remove(tmp_kpis_path)

    print(
        f"   ✅ Auto-Grader hoàn thành: {eval_res['total_auto_score']} / {eval_res['max_auto_score']} điểm ({eval_res['pct_auto_score']}%)"
    )
    for cat, item in eval_res["breakdown"].items():
        print(f"      • {cat}: {item['score']}/{item['max']}đ ({item['notes']})")


def main():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.insert(0, os.path.join(base_dir, "scripts"))
    sys.path.insert(
        0,
        os.path.join(
            base_dir,
            "projects",
            "DA-01_sales_performance",
            "instructor_edition",
            "solutions",
        ),
    )
    sys.path.insert(
        0,
        os.path.join(
            base_dir,
            "projects",
            "DA-01_sales_performance",
            "instructor_edition",
            "grading",
        ),
    )

    print("=" * 80)
    print("🚀 CYBERSOFT DATA & AI LAB — TASK 12 END-TO-END DEMO WORKFLOW")
    print("   Dự án: Capstone DA-01 (Sales Performance & Customer Intelligence)")
    print(
        "================================================================================"
    )

    try:
        step_1_audit_structure(base_dir)
        step_2_check_zero_leakage(base_dir)
        step_3_run_cross_verification(base_dir)
        step_4_test_auto_grader(base_dir)

        print("\n" + "=" * 80)
        print("🎉 TẤT CẢ 4 BƯỚC KIỂM ĐỊNH ĐÃ THÀNH CÔNG VƯỢT TRỘI! (EXIT CODE: 0)")
        print(
            "================================================================================"
        )
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ LỖI TRONG QUÁ TRÌNH DEMO: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
