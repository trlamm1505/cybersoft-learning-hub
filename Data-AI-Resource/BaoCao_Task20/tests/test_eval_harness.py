"""Unit tests for RAGEvalHarness."""

from src.eval_harness import RAGEvalHarness
from src.llm_judge import LLMJudge
from src.rule_evaluator import RuleEvaluator


class DummyTutor:
    def ask(self, query: str):
        class DummyResp:
            status = "ANSWERED"
            answer = "Quy định chuyên cần là 80% theo CS-POL-003."
            citations = [
                {"document_code": "CS-POL-003", "chunk_id": "CS-POL-003_hdr_000"}
            ]

        return DummyResp()


class DummyRetriever:
    def retrieve(self, query: str, top_k: int = 5):
        return [
            {
                "chunk_id": "CS-POL-003_hdr_000",
                "citation": {
                    "document_id": "CS-POL-003",
                    "content_snippet": "Quy định chuyên cần là 80%.",
                },
            }
        ]


def test_eval_harness_run(sample_eval_item):
    tutor = DummyTutor()
    retriever = DummyRetriever()
    harness = RAGEvalHarness(
        tutor_engine=tutor,
        retriever=retriever,
        rule_evaluator=RuleEvaluator(),
        llm_judge=LLMJudge(),
    )

    report = harness.run_evaluation([sample_eval_item], top_k=5)
    assert report["total_queries"] == 1
    metrics = report["metrics"]
    assert metrics["retrieval"]["recall_at_5"] == 1.0
    assert metrics["generation"]["citation_precision"] == 1.0
    assert metrics["generation"]["hallucinated_citations_count"] == 0
    assert len(report["records"]) == 1
