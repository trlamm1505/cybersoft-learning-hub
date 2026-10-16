"""Additional test cases to reach comprehensive 25-test suite."""

from src.eval_harness import RAGEvalHarness
from src.llm_judge import LLMJudge
from src.metrics import compute_precision_at_k, compute_recall_at_k
from src.regression_checker import RegressionChecker
from src.rule_evaluator import RuleEvaluator


def test_metrics_zero_division_guard():
    assert compute_recall_at_k([], [], k=0) == 1.0
    assert compute_precision_at_k([], [], k=0) == 0.0


def test_rule_evaluator_unanswerable_match(sample_ood_item):
    evaluator = RuleEvaluator()
    res = evaluator.evaluate_sample(
        query_id=sample_ood_item["id"],
        generated_answer="Rất tiếc câu hỏi ẩm thực này nằm ngoài phạm vi học liệu CyberSoft.",
        expected_behavior="ABSTAIN",
        retrieved_doc_or_chunk_ids=[],
        expected_doc_or_chunk_ids=[],
        ground_truth_keywords=["ngoài phạm vi"],
        tutor_status="ABSTAIN",
    )
    assert res.passed is True
    assert res.is_abstained is True
    assert res.abstention_correct is True


def test_llm_judge_score_ranges():
    judge = LLMJudge()
    res = judge.evaluate(
        query_id="TEST-RANGE",
        question="Học phí khóa học?",
        generated_answer="Học phí được quy định tại CS-FAQ-001.",
        context_texts=["Thông tin học phí tại CS-FAQ-001."],
        is_abstained=False,
        expected_behavior="ANSWER",
    )
    assert 1.0 <= res.faithfulness_score <= 5.0
    assert 1.0 <= res.answer_relevance_score <= 5.0
    assert 1.0 <= res.context_relevance_score <= 5.0
    assert 0.0 <= res.normalized_score <= 1.0


def test_regression_checker_rendering():
    checker = RegressionChecker()
    baseline = {
        "version": "v1",
        "metrics": {"retrieval": {}, "generation": {}, "operational": {}},
    }
    current = {
        "version": "v2",
        "metrics": {"retrieval": {}, "generation": {}, "operational": {}},
    }
    summary = checker.evaluate_gate(baseline, current)
    md = checker.render_markdown_report(baseline, current, summary)
    assert "Báo Cáo Đối Chứng Hồi Quy" in md
    assert "| Tiêu chí Kiểm định |" in md


def test_regression_checker_custom_thresholds():
    checker = RegressionChecker(max_recall_regression=0.10, min_citation_precision=0.80)
    assert checker.max_recall_regression == 0.10
    assert checker.min_citation_precision == 0.80


def test_eval_harness_multi_query(sample_eval_item, sample_ood_item):
    class MockEngine:
        def ask(self, q):
            class Resp:
                status = "ABSTAIN" if "phở" in q else "ANSWERED"
                answer = "Từ chối" if "phở" in q else "Quy định 80% theo CS-POL-003."
                citations = [] if "phở" in q else [{"document_code": "CS-POL-003"}]

            return Resp()

    harness = RAGEvalHarness(tutor_engine=MockEngine())
    report = harness.run_evaluation([sample_eval_item, sample_ood_item])
    assert report["total_queries"] == 2
    assert report["metrics"]["generation"]["abstention_accuracy"] == 1.0
