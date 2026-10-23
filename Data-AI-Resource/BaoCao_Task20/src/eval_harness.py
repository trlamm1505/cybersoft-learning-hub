"""Batch Evaluation Harness Orchestrator for RAG Pipeline.

Integrates:
- HybridRetriever (BM25 + Dense + Reranking)
- CyberSoftAITutor (Grounded Extractive Synthesizer + Abstention Gate)
- RuleEvaluator (Citation validity, hallucination detection, abstention checks)
- LLMJudge (5-point rubric: Faithfulness, Answer Relevance, Context Relevance)
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import time
from typing import Any, Dict, List, Optional, Sequence

from .llm_judge import LLMJudge
from .metrics import (
    compute_hit_at_k,
    compute_latency_percentiles,
    compute_mrr,
    compute_precision_at_k,
    compute_recall_at_k,
)
from .rule_evaluator import RuleEvaluator


@dataclass
class SingleQueryEvalRecord:
    query_id: str
    category: str
    question: str
    expected_behavior: str
    expected_doc_ids: List[str]
    expected_chunk_ids: List[str]
    retrieved_chunk_ids: List[str]
    retrieved_doc_ids: List[str]
    generated_answer: str
    tutor_status: str
    latency_total_ms: float
    rule_results: Dict[str, Any]
    judge_results: Dict[str, Any]
    overall_passed: bool

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RAGEvalHarness:
    """End-to-end evaluation harness running datasets through the RAG pipeline."""

    def __init__(
        self,
        tutor_engine: Any = None,
        retriever: Any = None,
        rule_evaluator: Optional[RuleEvaluator] = None,
        llm_judge: Optional[LLMJudge] = None,
    ):
        self.tutor_engine = tutor_engine
        self.retriever = retriever or (
            getattr(tutor_engine, "retriever", None) if tutor_engine else None
        )
        self.rule_evaluator = rule_evaluator or RuleEvaluator()
        self.llm_judge = llm_judge or LLMJudge()

    def run_evaluation(
        self,
        eval_dataset: Sequence[Dict[str, Any]],
        top_k: int = 5,
        version_tag: str = "v1.0-current",
    ) -> Dict[str, Any]:
        """Execute full evaluation run over all items in the eval dataset."""
        records: List[SingleQueryEvalRecord] = []
        latencies: List[float] = []

        recalls: List[float] = []
        precisions: List[float] = []
        hit_rates: List[float] = []
        mrrs: List[float] = []

        citation_precisions: List[float] = []
        citation_recalls: List[float] = []
        abstention_accuracies: List[float] = []
        total_hallucinated_citations = 0

        faithfulness_scores: List[float] = []
        relevance_scores: List[float] = []
        context_relevance_scores: List[float] = []
        judge_passes: List[float] = []
        rule_passes: List[float] = []

        for item in eval_dataset:
            qid = item["id"]
            cat = item.get("category", "general")
            query = item["query"]
            expected_behavior = item.get("expected_behavior", "ANSWER")
            expected_doc_ids = item.get("expected_doc_ids", [])
            expected_chunk_ids = item.get("expected_chunk_ids", [])
            gt_keywords = item.get("ground_truth_keywords", [])
            gt_answer = item.get("ground_truth_answer", "")

            start_t = time.perf_counter()

            # Execute RAG retrieval and generation
            retrieved_chunks = []
            if self.retriever:
                if hasattr(self.retriever, "retrieve"):
                    retrieved_chunks = self.retriever.retrieve(query, top_k=top_k)
                elif hasattr(self.retriever, "search"):
                    retrieved_chunks = self.retriever.search(query, top_k=top_k)

            provided_cites = []
            if self.tutor_engine:
                response = self.tutor_engine.ask(query)
                if hasattr(response, "answer"):
                    answer = response.answer
                    tutor_status = response.status
                    for c in getattr(response, "citations", []):
                        code = c.get("document_code") or c.get("chunk_id")
                        if code:
                            provided_cites.append(code)
                elif isinstance(response, dict):
                    answer = response.get("answer", "")
                    tutor_status = response.get("status", "ANSWERED")
                    for c in response.get("citations", []):
                        code = (
                            c.get("document_code") or c.get("chunk_id")
                            if isinstance(c, dict)
                            else str(c)
                        )
                        if code:
                            provided_cites.append(code)
                else:
                    answer = str(response)
                    tutor_status = "ANSWERED"
            else:
                answer = "Mock fallback response"
                tutor_status = "ANSWERED"

            latency_ms = (time.perf_counter() - start_t) * 1000.0
            latencies.append(latency_ms)

            # Extract retrieved chunk and doc IDs
            ret_chunk_ids = []
            ret_doc_ids = []
            context_texts = []
            for rc in retrieved_chunks:
                cid = (
                    rc.get("chunk_id")
                    if isinstance(rc, dict)
                    else getattr(rc, "chunk_id", "")
                )
                meta = (
                    rc.get("metadata", {})
                    if isinstance(rc, dict)
                    else getattr(rc, "metadata", {})
                )
                cite = (
                    rc.get("citation", {})
                    if isinstance(rc, dict)
                    else getattr(rc, "citation", {})
                )
                did = (
                    cite.get("document_id")
                    or meta.get("document_id")
                    or (rc.get("document_id") if isinstance(rc, dict) else "")
                )
                text = (
                    cite.get("content_snippet")
                    or rc.get("text")
                    or (getattr(rc, "text", "") if not isinstance(rc, dict) else "")
                )
                if cid:
                    ret_chunk_ids.append(cid)
                if did and did not in ret_doc_ids:
                    ret_doc_ids.append(did)
                if text:
                    context_texts.append(text)

            # Calculate Retrieval Metrics
            if expected_doc_ids:
                recall = compute_recall_at_k(ret_doc_ids, expected_doc_ids, k=top_k)
                precision = compute_precision_at_k(
                    ret_doc_ids, expected_doc_ids, k=top_k
                )
                hit = compute_hit_at_k(ret_doc_ids, expected_doc_ids, k=top_k)
                mrr_score = compute_mrr(ret_doc_ids, expected_doc_ids)
            elif expected_chunk_ids:
                recall = compute_recall_at_k(ret_chunk_ids, expected_chunk_ids, k=top_k)
                precision = compute_precision_at_k(
                    ret_chunk_ids, expected_chunk_ids, k=top_k
                )
                hit = compute_hit_at_k(ret_chunk_ids, expected_chunk_ids, k=top_k)
                mrr_score = compute_mrr(ret_chunk_ids, expected_chunk_ids)
            else:
                # OOD queries
                recall = 1.0
                precision = 1.0 if not ret_chunk_ids else 0.5
                hit = 1.0
                mrr_score = 1.0

            recalls.append(recall)
            precisions.append(precision)
            hit_rates.append(hit)
            mrrs.append(mrr_score)

            # Available IDs for citation check includes both doc IDs and chunk IDs
            available_ids = list(set(ret_chunk_ids + ret_doc_ids))

            # Rule-based evaluation
            rule_res = self.rule_evaluator.evaluate_sample(
                query_id=qid,
                generated_answer=answer,
                expected_behavior=expected_behavior,
                retrieved_doc_or_chunk_ids=available_ids,
                expected_doc_or_chunk_ids=expected_doc_ids or expected_chunk_ids,
                ground_truth_keywords=gt_keywords,
                ground_truth_answer=gt_answer,
                tutor_status=tutor_status,
                provided_citations=provided_cites,
            )

            citation_precisions.append(rule_res.citation_precision)
            citation_recalls.append(rule_res.citation_recall)
            abstention_accuracies.append(1.0 if rule_res.abstention_correct else 0.0)
            total_hallucinated_citations += len(rule_res.hallucinated_citations)
            rule_passes.append(1.0 if rule_res.passed else 0.0)

            # LLM Judge evaluation
            judge_res = self.llm_judge.evaluate(
                query_id=qid,
                question=query,
                generated_answer=answer,
                context_texts=context_texts,
                is_abstained=rule_res.is_abstained,
                expected_behavior=expected_behavior,
            )

            faithfulness_scores.append(judge_res.faithfulness_score)
            relevance_scores.append(judge_res.answer_relevance_score)
            context_relevance_scores.append(judge_res.context_relevance_score)
            judge_passes.append(1.0 if judge_res.pass_fail else 0.0)

            overall_pass = rule_res.passed and judge_res.pass_fail

            records.append(
                SingleQueryEvalRecord(
                    query_id=qid,
                    category=cat,
                    question=query,
                    expected_behavior=expected_behavior,
                    expected_doc_ids=expected_doc_ids,
                    expected_chunk_ids=expected_chunk_ids,
                    retrieved_chunk_ids=ret_chunk_ids,
                    retrieved_doc_ids=ret_doc_ids,
                    generated_answer=answer,
                    tutor_status=tutor_status,
                    latency_total_ms=latency_ms,
                    rule_results=rule_res.to_dict(),
                    judge_results=judge_res.to_dict(),
                    overall_passed=overall_pass,
                )
            )

        latency_stats = compute_latency_percentiles(latencies)

        report = {
            "version": version_tag,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total_queries": len(eval_dataset),
            "metrics": {
                "retrieval": {
                    "recall_at_5": round(float(sum(recalls) / len(recalls)), 4),
                    "precision_at_5": round(
                        float(sum(precisions) / len(precisions)), 4
                    ),
                    "hit_rate_at_5": round(float(sum(hit_rates) / len(hit_rates)), 4),
                    "mrr": round(float(sum(mrrs) / len(mrrs)), 4),
                },
                "generation": {
                    "citation_precision": round(
                        float(sum(citation_precisions) / len(citation_precisions)), 4
                    ),
                    "citation_recall": round(
                        float(sum(citation_recalls) / len(citation_recalls)), 4
                    ),
                    "groundedness_score": round(
                        float(
                            sum(faithfulness_scores) / (5.0 * len(faithfulness_scores))
                        ),
                        4,
                    ),
                    "answer_relevance_score": round(
                        float(sum(relevance_scores) / (5.0 * len(relevance_scores))), 4
                    ),
                    "context_relevance_score": round(
                        float(
                            sum(context_relevance_scores)
                            / (5.0 * len(context_relevance_scores))
                        ),
                        4,
                    ),
                    "abstention_accuracy": round(
                        float(sum(abstention_accuracies) / len(abstention_accuracies)),
                        4,
                    ),
                    "hallucinated_citations_count": total_hallucinated_citations,
                    "rule_pass_rate": round(
                        float(sum(rule_passes) / len(rule_passes)), 4
                    ),
                    "judge_pass_rate": round(
                        float(sum(judge_passes) / len(judge_passes)), 4
                    ),
                },
                "operational": {
                    "latency_mean_ms": round(latency_stats["mean"], 2),
                    "latency_p50_ms": round(latency_stats["p50"], 2),
                    "latency_p90_ms": round(latency_stats["p90"], 2),
                    "latency_p95_ms": round(latency_stats["p95"], 2),
                    "latency_p99_ms": round(latency_stats["p99"], 2),
                    "cost_usd": 0.0000,
                },
            },
            "records": [r.to_dict() for r in records],
        }

        return report
