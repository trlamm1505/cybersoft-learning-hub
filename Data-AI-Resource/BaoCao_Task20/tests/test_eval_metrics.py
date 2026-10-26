"""Unit tests for mathematical and statistical evaluation metrics."""

from src.metrics import (
    compute_abstention_accuracy,
    compute_citation_precision,
    compute_citation_recall,
    compute_hit_at_k,
    compute_latency_percentiles,
    compute_mrr,
    compute_precision_at_k,
    compute_recall_at_k,
)


def test_recall_at_k():
    retrieved = ["doc_a", "doc_b", "doc_c", "doc_d", "doc_e"]
    expected = ["doc_b", "doc_d"]
    assert compute_recall_at_k(retrieved, expected, k=5) == 1.0
    assert compute_recall_at_k(retrieved, expected, k=3) == 0.5
    assert compute_recall_at_k(retrieved, [], k=5) == 1.0


def test_precision_at_k():
    retrieved = ["doc_a", "doc_b", "doc_c", "doc_d", "doc_e"]
    expected = ["doc_b", "doc_d"]
    # 2 hits out of 5
    assert compute_precision_at_k(retrieved, expected, k=5) == 0.4
    # 1 hit out of 2
    assert compute_precision_at_k(retrieved, expected, k=2) == 0.5


def test_hit_at_k():
    retrieved = ["doc_a", "doc_b", "doc_c"]
    assert compute_hit_at_k(retrieved, ["doc_b"], k=3) == 1.0
    assert compute_hit_at_k(retrieved, ["doc_z"], k=3) == 0.0
    assert compute_hit_at_k(retrieved, ["doc_b"], k=1) == 0.0


def test_mrr():
    retrieved = ["doc_a", "doc_b", "doc_c"]
    # First hit is doc_b at rank 2 -> MRR = 0.5
    assert compute_mrr(retrieved, ["doc_b", "doc_c"]) == 0.5
    # First hit at rank 1 -> MRR = 1.0
    assert compute_mrr(retrieved, ["doc_a"]) == 1.0
    # No hit -> MRR = 0.0
    assert compute_mrr(retrieved, ["doc_z"]) == 0.0


def test_citation_precision_and_recall():
    available = ["doc_1", "doc_2", "doc_3"]
    # Model cites doc_1 and doc_2 (both valid)
    assert compute_citation_precision(["doc_1", "doc_2"], available) == 1.0
    # Model cites doc_1 and fake_doc (1 valid, 1 fake)
    assert compute_citation_precision(["doc_1", "fake_doc"], available) == 0.5

    # Recall: expected doc_1, doc_2, model cited doc_1
    assert compute_citation_recall(["doc_1"], ["doc_1", "doc_2"]) == 0.5
    assert compute_citation_recall(["doc_1", "doc_2"], ["doc_1", "doc_2"]) == 1.0


def test_abstention_accuracy():
    assert compute_abstention_accuracy(True, "ABSTAIN") == 1.0
    assert compute_abstention_accuracy(False, "ANSWER") == 1.0
    assert compute_abstention_accuracy(True, "ANSWER") == 0.0
    assert compute_abstention_accuracy(False, "ABSTAIN") == 0.0


def test_latency_percentiles():
    latencies = [10.0, 20.0, 30.0, 40.0, 50.0]
    stats = compute_latency_percentiles(latencies)
    assert stats["mean"] == 30.0
    assert stats["p50"] == 30.0
    assert stats["p95"] > 40.0
