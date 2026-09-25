"""
Test 8: Kiểm thử vận hành máy chấm tự động RAGAutoGrader.
"""

import json
from auto_grader import RAGAutoGrader
from advanced_rag import AdvancedRAGPipeline


def test_auto_grader_execution(task14_paths, tmp_path):
    corpus_dir = task14_paths["corpus_dir"]
    pipeline = AdvancedRAGPipeline(corpus_dir)

    # Chạy trên một tập mẫu 10 câu
    with open(task14_paths["test_queries_json"], "r", encoding="utf-8") as f:
        sample_queries = json.load(f)[:10]

    sample_results = []
    for q in sample_queries:
        res = pipeline.process_query(q["query"])
        res["question_id"] = q["question_id"]
        res["category"] = q.get("category", "")
        res["type"] = q.get("type", "")
        sample_results.append(res)

    sample_file = tmp_path / "sample_submission.json"
    with open(sample_file, "w", encoding="utf-8") as f:
        json.dump(sample_results, f, ensure_ascii=False, indent=2)

    grader = RAGAutoGrader(
        rubric_path=task14_paths["rubric_json"],
        gt_path=task14_paths["ground_truth_json"],
    )
    report = grader.evaluate_submission(str(sample_file))

    assert "total_score" in report
    assert "metrics" in report
    assert "score_breakdown" in report
    assert report["total_score"] >= 0.0 and report["total_score"] <= 100.0
    print(
        f"\n[AutoGrader Test] Sample Submission Total Score: {report['total_score']} / 100.0"
    )
