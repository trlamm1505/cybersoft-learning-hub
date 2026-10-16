# -*- coding: utf-8 -*-
"""Edge case and stress boundary tests for Task 29."""

import pytest
from src.services.performance_service import (
    LRUQueryCache,
    PerformanceProfiler,
    BackupRestoreEngine,
    CachedSearchEngine,
)


def test_zero_requests_cache_stats():
    c = LRUQueryCache(capacity=10)
    stats = c.stats()
    assert stats["total_requests"] == 0
    assert stats["hit_rate_pct"] == 0.0


def test_very_large_query_latency_cap(profiler):
    lat = profiler.simulate_search_latency(query_length=500, use_cache=False)
    assert lat <= 20.0


def test_throughput_error_rate_zero(profiler):
    summary = profiler.get_summary()
    assert summary.throughput_benchmark.failed_requests == 0
    assert summary.throughput_benchmark.error_rate_pct == 0.0


def test_memory_cold_start_within_limits(profiler):
    summary = profiler.get_summary()
    assert summary.memory_profiling_mb.cold_start_rss_mb < 85.0
    assert summary.memory_profiling_mb.peak_load_rss_mb < 220.0
    assert summary.memory_profiling_mb.status == "HEALTHY"


def test_lru_cache_reordering_on_access():
    c = LRUQueryCache(capacity=2)
    c.set("k1", 1)
    c.set("k2", 2)
    c.get("k1")  # k1 accessed, k2 oldest
    c.set("k3", 3)  # k2 evicted, k1 stays
    assert c.get("k1") == 1
    assert c.get("k2") is None
    assert c.get("k3") == 3


def test_cache_overwrite_updates_value():
    c = LRUQueryCache(capacity=5)
    c.set("item", "old")
    assert c.get("item") == "old"
    c.set("item", "new")
    assert c.get("item") == "new"


def test_profiler_summary_system_profile_fields(profiler):
    summary = profiler.get_summary()
    assert "FastAPI" in summary.system_profile["framework"]
    assert summary.system_profile["cpu_cores"] >= 2


def test_restore_engine_successful_restore_details(backup_engine):
    res = backup_engine.verify_and_restore()
    assert res.status == "SUCCESS"
    assert "SHA-256" in res.details
    assert res.matched_checksums == res.verified_files


def test_cached_search_miss_then_hit_speedup():
    """Kiểm tra tìm kiếm BM25 (tái sử dụng từ Task 18) kết hợp LRU Cache."""
    docs = [
        "Chinh sach bao mat Cybersoft CS-POL-003",
        "Quy trinh trien khai Docker container va CI/CD",
        "Huong dan cau hinh WSL2 va Ubuntu cho AI tutor"
    ]
    engine = CachedSearchEngine(corpus=docs)
    query = "CS-POL-003"

    # Lần 1: Chưa có trong cache -> is_cached = False
    res1, cached1 = engine.search(query, top_k=2)
    assert cached1 is False
    assert len(res1) > 0

    # Lần 2: Đã lưu vào LRU Cache -> is_cached = True
    res2, cached2 = engine.search(query, top_k=2)
    assert cached2 is True
    assert res2 == res1


def test_cached_search_nonexistent_query():
    """Kiểm tra tìm kiếm từ khóa không có trong tài liệu."""
    docs = ["Hoc may va xu ly ngon ngu tu nhien"]
    engine = CachedSearchEngine(corpus=docs)
    res, cached = engine.search("tu_khoa_hoan_toan_la_xyz", top_k=2)
    assert cached is False
