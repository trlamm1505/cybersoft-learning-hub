"""
Kịch bản demo kiểm định toàn diện 4 giai đoạn cho Capstone AI-01 (Exit Code 0).
Giai đoạn 1: Kiểm tra tính toàn vẹn cấu trúc tệp và tài nguyên bàn giao.
Giai đoạn 2: Quét phòng vệ rò rỉ đáp án Zero Answer Leakage trên miền student_edition.
Giai đoạn 3: Khởi chạy Advanced RAG Pipeline trên toàn bộ 100 câu test queries.
Giai đoạn 4: Vận hành máy chấm tự động Auto-Grader đối chiếu Ground Truth và kiểm chứng điểm số.
"""

import json
import os
import sys
import time

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.join(BASE_DIR, "projects", "AI-01_rag_knowledge_retrieval")
SOLUTIONS_DIR = os.path.join(PROJECT_DIR, "instructor_edition", "solutions")
GRADING_DIR = os.path.join(PROJECT_DIR, "instructor_edition", "grading")

sys.path.append(SOLUTIONS_DIR)
sys.path.append(GRADING_DIR)

from advanced_rag import AdvancedRAGPipeline  # noqa: E402
from auto_grader import RAGAutoGrader  # noqa: E402


def run_demo():
    print("\n" + "=" * 80)
    print("   CYBERSOFT DATA & AI LAB — DEMO QUY TRÌNH KIỂM ĐỊNH CAPSTONE AI-01")
    print("   (HỆ THỐNG HỎI ĐÁP QUY CHẾ VÀ TRI THỨC NỘI BỘ BẰNG ADVANCED HYBRID RAG)")
    print("=" * 80)

    # -------------------------------------------------------------
    # GIAI ĐOẠN 1: KIỂM TRA TOÀN VẸN CẤU TRÚC TỆP
    # -------------------------------------------------------------
    print("\n[GIAI ĐOẠN 1] Kiểm tra tính toàn vẹn kiến trúc & tệp tin dự án...")
    required_files = [
        os.path.join(PROJECT_DIR, "student_edition", "PROJECT_BRIEF.md"),
        os.path.join(PROJECT_DIR, "student_edition", "rubric.json"),
        os.path.join(PROJECT_DIR, "student_edition", "HINTS.md"),
        os.path.join(PROJECT_DIR, "student_edition", "starter_kit", "rag_starter.py"),
        os.path.join(PROJECT_DIR, "student_edition", "starter_kit", "config.yaml"),
        os.path.join(PROJECT_DIR, "student_edition", "starter_kit", "requirements.txt"),
        os.path.join(
            PROJECT_DIR, "student_edition", "starter_kit", "submission_checklist.md"
        ),
        os.path.join(
            PROJECT_DIR, "student_edition", "starter_kit", "evaluation_guide.md"
        ),
        os.path.join(
            PROJECT_DIR, "student_edition", "data", "eval", "test_queries.json"
        ),
        os.path.join(PROJECT_DIR, "instructor_edition", "SOLUTION_MANUAL.md"),
        os.path.join(PROJECT_DIR, "instructor_edition", "common_pitfalls.md"),
        os.path.join(PROJECT_DIR, "instructor_edition", "expected_benchmarks.json"),
        os.path.join(
            PROJECT_DIR, "instructor_edition", "data", "ground_truth_eval.json"
        ),
        os.path.join(SOLUTIONS_DIR, "baseline_rag.py"),
        os.path.join(SOLUTIONS_DIR, "advanced_rag.py"),
        os.path.join(SOLUTIONS_DIR, "rag_pipeline.py"),
        os.path.join(GRADING_DIR, "auto_grader.py"),
        os.path.join(BASE_DIR, "Picture_14_Detail.png"),
    ]
    missing = [f for f in required_files if not os.path.exists(f)]
    if missing:
        print(f"[FAIL] Thiếu {len(missing)} tệp bắt buộc: {missing}")
        sys.exit(1)
    print(
        f" -> [PASS] Đầy đủ 100% tệp tin kiến trúc ({len(required_files)}/18 tệp trọng yếu)."
    )

    # -------------------------------------------------------------
    # GIAI ĐOẠN 2: QUÉT ZERO ANSWER LEAKAGE
    # -------------------------------------------------------------
    print("\n[GIAI ĐOẠN 2] Quét bảo mật phòng vệ rò rỉ đáp án Zero-Leakage...")
    student_eval_file = os.path.join(
        PROJECT_DIR, "student_edition", "data", "eval", "test_queries.json"
    )
    with open(student_eval_file, "r", encoding="utf-8") as f:
        student_queries = json.load(f)

    forbidden = {
        "ground_truth_answer",
        "citations",
        "citations_doc_ids",
        "reasoning",
        "expected_behavior",
    }
    leaks = 0
    for q in student_queries:
        if set(q.keys()).intersection(forbidden):
            leaks += 1
    if leaks > 0:
        print(
            f"[FAIL] Phát hiện rò rỉ đáp án tại {leaks} câu hỏi trong student_edition!"
        )
        sys.exit(1)
    print(" -> [PASS] Miền student_edition hoàn toàn sạch (100% Zero-Leakage).")

    # -------------------------------------------------------------
    # GIAI ĐOẠN 3: KHỞI CHẠY ADVANCED RAG PIPELINE TRÊN 100 CÂU TEST
    # -------------------------------------------------------------
    print(
        "\n[GIAI ĐOẠN 3] Khởi chạy Advanced Hybrid RAG Pipeline trên 100 câu test queries..."
    )
    corpus_dir = os.path.join(PROJECT_DIR, "instructor_edition", "data", "corpus")
    pipeline = AdvancedRAGPipeline(corpus_dir)
    print(f" -> Đã chỉ mục thành công {len(pipeline.sections)} sections quy chế.")

    results = []
    t_start = time.time()
    for idx, q in enumerate(student_queries):
        res = pipeline.process_query(q["query"])
        res["question_id"] = q["question_id"]
        res["category"] = q.get("category", "")
        res["type"] = q.get("type", "")
        results.append(res)
    total_eval_time = time.time() - t_start
    print(
        f" -> [PASS] Hoàn thành 100 câu hỏi trong {total_eval_time:.2f} giây (Trung bình: {total_eval_time*10:.1f} ms/câu)."
    )

    submission_file = os.path.join(BASE_DIR, "scripts", "demo_submission_report.json")
    with open(submission_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # -------------------------------------------------------------
    # GIAI ĐOẠN 4: VẬN HÀNH MÁY CHẤM TỰ ĐỘNG (AUTO-GRADER)
    # -------------------------------------------------------------
    print("\n[GIAI ĐOẠN 4] Chạy máy chấm tự động Auto-Grader đối chiếu Ground Truth...")
    grader = RAGAutoGrader()
    report = grader.evaluate_submission(submission_file)
    grader.print_report(report)

    # Dọn dẹp tệp tạm
    if os.path.exists(submission_file):
        os.remove(submission_file)

    if report["total_score"] >= 80.0 and report["core_score"] >= 55.0:
        print(
            "\n[TỔNG KẾT] Toàn bộ 4 giai đoạn kiểm định ĐẠT CHUẨN 100% (EXIT CODE: 0)."
        )
        return 0
    else:
        print(f"\n[FAIL] Điểm số {report['total_score']} chưa đạt chuẩn tốt nghiệp.")
        sys.exit(1)


if __name__ == "__main__":
    sys.exit(run_demo())
