"""
Công cụ chạy đối soát và đo lường độc lập RAG Evaluator (Capstone AI-01)
Đo lường chi tiết Recall@5, MRR, Context Precision, Faithfulness, Citation F1, Abstain Accuracy.
"""

import json
import os
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOLUTIONS_DIR = os.path.join(
    BASE_DIR,
    "projects",
    "AI-01_rag_knowledge_retrieval",
    "instructor_edition",
    "solutions",
)
sys.path.append(SOLUTIONS_DIR)

from advanced_rag import AdvancedRAGPipeline  # noqa: E402

GRADING_DIR = os.path.join(
    BASE_DIR,
    "projects",
    "AI-01_rag_knowledge_retrieval",
    "instructor_edition",
    "grading",
)
sys.path.append(GRADING_DIR)
from auto_grader import RAGAutoGrader  # noqa: E402


def run_evaluation_benchmark():
    corpus_dir = os.path.join(
        BASE_DIR,
        "projects",
        "AI-01_rag_knowledge_retrieval",
        "instructor_edition",
        "data",
        "corpus",
    )
    test_queries_path = os.path.join(
        BASE_DIR,
        "projects",
        "AI-01_rag_knowledge_retrieval",
        "student_edition",
        "data",
        "eval",
        "test_queries.json",
    )

    with open(test_queries_path, "r", encoding="utf-8") as f:
        queries = json.load(f)

    print(f"[*] Khởi chạy đo lường benchmark trên {len(queries)} câu hỏi...")

    # 1. Advanced Pipeline
    adv_pipe = AdvancedRAGPipeline(corpus_dir)
    adv_results = []
    for q in queries:
        res = adv_pipe.process_query(q["query"])
        res["question_id"] = q["question_id"]
        res["category"] = q.get("category", "")
        res["type"] = q.get("type", "")
        adv_results.append(res)

    adv_out = os.path.join(BASE_DIR, "scripts", "temp_adv_submission.json")
    with open(adv_out, "w", encoding="utf-8") as f:
        json.dump(adv_results, f, ensure_ascii=False, indent=2)

    # 2. Chấm điểm qua Auto-Grader
    grader = RAGAutoGrader()
    report = grader.evaluate_submission(adv_out)
    grader.print_report(report)

    # Dọn dẹp tệp tạm
    if os.path.exists(adv_out):
        os.remove(adv_out)

    return report


if __name__ == "__main__":
    run_evaluation_benchmark()
