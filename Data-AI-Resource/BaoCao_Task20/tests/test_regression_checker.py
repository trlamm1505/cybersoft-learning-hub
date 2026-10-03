"""Unit tests for RegressionChecker and CI Quality Gate."""

import pytest
from src.regression_checker import RegressionChecker


@pytest.fixture
def sample_baseline_metrics():
    return {
        "version": "v0.1-baseline",
        "timestamp": "2026-09-20T10:00:00Z",
        "total_queries": 30,
        "metrics": {
            "retrieval": {
                "recall_at_5": 0.80,
                "precision_at_5": 0.60,
                "hit_rate_at_5": 0.85,
                "mrr": 0.70,
            },
            "generation": {
                "citation_precision": 0.85,
                "citation_recall": 0.75,
                "groundedness_score": 0.80,
                "abstention_accuracy": 0.80,
                "hallucinated_citations_count": 5,
            },
            "operational": {
                "latency_mean_ms": 30.0,
                "latency_p50_ms": 25.0,
                "latency_p95_ms": 80.0,
                "cost_usd": 0.01,
            },
        },
    }


def test_quality_gate_passes_when_improved(sample_baseline_metrics):
    current = {
        "version": "v1.0-current",
        "timestamp": "2026-09-28T10:00:00Z",
        "total_queries": 30,
        "metrics": {
            "retrieval": {
                "recall_at_5": 0.95,
                "precision_at_5": 0.80,
                "hit_rate_at_5": 1.0,
                "mrr": 0.90,
            },
            "generation": {
                "citation_precision": 1.0,
                "citation_recall": 0.90,
                "groundedness_score": 0.92,
                "abstention_accuracy": 1.0,
                "hallucinated_citations_count": 0,
            },
            "operational": {
                "latency_mean_ms": 20.0,
                "latency_p50_ms": 18.0,
                "latency_p95_ms": 50.0,
                "cost_usd": 0.0,
            },
        },
    }
    checker = RegressionChecker()
    summary = checker.evaluate_gate(sample_baseline_metrics, current)
    assert summary.all_passed is True
    assert summary.exit_code == 0
    assert summary.failed_rules == 0


def test_quality_gate_fails_on_regression(sample_baseline_metrics):
    regressed = {
        "version": "v1.0-regressed",
        "timestamp": "2026-09-28T10:00:00Z",
        "total_queries": 30,
        "metrics": {
            "retrieval": {
                "recall_at_5": 0.50,  # Big drop
                "precision_at_5": 0.40,
                "hit_rate_at_5": 0.60,
                "mrr": 0.40,
            },
            "generation": {
                "citation_precision": 0.70,  # Below threshold
                "citation_recall": 0.50,
                "groundedness_score": 0.60,
                "abstention_accuracy": 0.60,
                "hallucinated_citations_count": 8,  # Hallucinations
            },
            "operational": {
                "latency_mean_ms": 120.0,
                "latency_p50_ms": 100.0,
                "latency_p95_ms": 250.0,  # Exceeds SLA
                "cost_usd": 0.05,
            },
        },
    }
    checker = RegressionChecker()
    summary = checker.evaluate_gate(sample_baseline_metrics, regressed)
    assert summary.all_passed is False
    assert summary.exit_code == 1
    assert summary.failed_rules > 0
