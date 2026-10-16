"""Unit tests for Latency Percentiles and Profiling Benchmarks."""

import pytest
from src.services.profiler import PerformanceProfiler


def test_search_latency_p95_under_threshold(profiler):
    summary = profiler.get_summary()
    lat = summary.search_latency_benchmark_ms
    assert lat.p95 <= 25.0
    assert lat.status == "PASS"


def test_ai_tutor_latency_p95_under_rag_threshold(profiler):
    summary = profiler.get_summary()
    tutor_lat = summary.ai_tutor_latency_benchmark_ms
    assert tutor_lat["p95"] <= 1500.0
    assert tutor_lat["p95"] < 50.0  # Actually sub-30ms
    assert tutor_lat["status"] == "PASS"


def test_ingestion_latency_under_threshold(profiler):
    summary = profiler.get_summary()
    ingest = summary.ingestion_benchmark
    assert ingest["total_ingestion_time_ms"] <= 500.0
    assert ingest["chunks_per_second"] >= 200.0


def test_latency_percentiles_order_p50_p75_p90_p95_p99(profiler):
    summary = profiler.get_summary()
    lat = summary.search_latency_benchmark_ms
    assert lat.p50 <= lat.p75 <= lat.p90 <= lat.p95 <= lat.p99


def test_simulated_search_latency_caching_benefit(profiler):
    uncached = profiler.simulate_search_latency(query_length=20, use_cache=False)
    cached = profiler.simulate_search_latency(query_length=20, use_cache=True)
    assert cached < uncached
    assert cached <= 4.0
