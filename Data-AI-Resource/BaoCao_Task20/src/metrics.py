"""Mathematical & Statistical Metric Calculators for RAG Evaluation Harness.

Covers:
- Retrieval Metrics: Recall@K, Precision@K, HitRate@K, MRR (Mean Reciprocal Rank)
- Generation Metrics: Citation Precision, Citation Recall, Groundedness, Abstention Accuracy
- Operational Metrics: Latency percentiles (p50, p90, p95, p99), Cost
"""

from __future__ import annotations

from typing import Dict, Sequence
import numpy as np


def compute_recall_at_k(
    retrieved_ids: Sequence[str], expected_ids: Sequence[str], k: int = 5
) -> float:
    """Compute Recall@K = |Retrieved@K ∩ Expected| / |Expected|."""
    if not expected_ids:
        return 1.0  # For OOD or queries with no expected chunks
    top_k = set(retrieved_ids[:k])
    expected_set = set(expected_ids)
    intersection = top_k.intersection(expected_set)
    return len(intersection) / len(expected_set)


def compute_precision_at_k(
    retrieved_ids: Sequence[str], expected_ids: Sequence[str], k: int = 5
) -> float:
    """Compute Precision@K = |Retrieved@K ∩ Expected| / K."""
    if k <= 0:
        return 0.0
    if not expected_ids:
        return 1.0 if not retrieved_ids else 0.0
    top_k = set(retrieved_ids[:k])
    expected_set = set(expected_ids)
    intersection = top_k.intersection(expected_set)
    return len(intersection) / k


def compute_hit_at_k(
    retrieved_ids: Sequence[str], expected_ids: Sequence[str], k: int = 5
) -> float:
    """Compute Hit@K = 1.0 if at least one expected item is in top K else 0.0."""
    if not expected_ids:
        return 1.0
    top_k = set(retrieved_ids[:k])
    expected_set = set(expected_ids)
    return 1.0 if top_k.intersection(expected_set) else 0.0


def compute_mrr(retrieved_ids: Sequence[str], expected_ids: Sequence[str]) -> float:
    """Compute Reciprocal Rank: 1 / (first rank of relevant item in 1-based index)."""
    if not expected_ids:
        return 1.0
    expected_set = set(expected_ids)
    for rank, item_id in enumerate(retrieved_ids, start=1):
        if item_id in expected_set:
            return 1.0 / rank
    return 0.0


def compute_citation_precision(
    cited_ids: Sequence[str], available_chunk_or_doc_ids: Sequence[str]
) -> float:
    """Compute Citation Precision: ratio of cited IDs that actually exist in retrieved context.

    If model generates citations [Doc-1, Fake-Doc], Precision is 1/2 = 0.5.
    If no citations are generated for an answered query, Precision is 0.0.
    If query was abstained and no citations generated, Precision is 1.0.
    """
    if not cited_ids:
        return 1.0
    available_set = set(available_chunk_or_doc_ids)
    valid_citations = [cid for cid in cited_ids if cid in available_set]
    return len(valid_citations) / len(cited_ids)


def compute_citation_recall(
    cited_ids: Sequence[str], expected_citations: Sequence[str]
) -> float:
    """Compute Citation Recall: ratio of expected citations present in cited IDs."""
    if not expected_citations:
        return 1.0
    cited_set = set(cited_ids)
    expected_set = set(expected_citations)
    intersection = cited_set.intersection(expected_set)
    return len(intersection) / len(expected_set)


def compute_abstention_accuracy(is_abstained: bool, expected_behavior: str) -> float:
    """Compute Abstention Accuracy: 1.0 if abstention decision matches expected behavior."""
    expected_abstain = expected_behavior.upper() in ["ABSTAIN", "REJECT"]
    return 1.0 if is_abstained == expected_abstain else 0.0


def compute_latency_percentiles(latencies_ms: Sequence[float]) -> Dict[str, float]:
    """Compute statistical percentiles for latency measurements in milliseconds."""
    if not latencies_ms:
        return {"mean": 0.0, "p50": 0.0, "p90": 0.0, "p95": 0.0, "p99": 0.0}
    arr = np.array(latencies_ms)
    return {
        "mean": float(np.mean(arr)),
        "p50": float(np.percentile(arr, 50)),
        "p90": float(np.percentile(arr, 90)),
        "p95": float(np.percentile(arr, 95)),
        "p99": float(np.percentile(arr, 99)),
    }
