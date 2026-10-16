"""Unit tests for Two-tier LRU In-memory Caching Engine."""

import pytest
import time
from src.services.cache_manager import LRUQueryCache


def test_lru_cache_set_and_get(cache):
    cache.set("query_1", {"results": [1, 2, 3]})
    val = cache.get("query_1")
    assert val == {"results": [1, 2, 3]}


def test_lru_cache_miss_increments_counter(cache):
    cache.clear()
    val = cache.get("non_existent_key")
    assert val is None
    stats = cache.stats()
    assert stats["misses"] == 1
    assert stats["hits"] == 0


def test_lru_cache_hit_increments_counter(cache):
    cache.clear()
    cache.set("k1", "v1")
    cache.get("k1")
    cache.get("k1")
    stats = cache.stats()
    assert stats["hits"] == 2
    assert stats["misses"] == 0
    assert stats["hit_rate_pct"] == 100.0


def test_lru_cache_eviction_when_capacity_reached(cache):
    # Capacity is 5
    cache.clear()
    for i in range(5):
        cache.set(f"k_{i}", f"v_{i}")
    assert len(cache.cache) == 5

    # Add 6th key -> k_0 should be evicted (oldest)
    cache.set("k_5", "v_5")
    assert len(cache.cache) == 5
    assert cache.get("k_0") is None  # evicted
    assert cache.get("k_5") == "v_5"


def test_lru_cache_ttl_expiration():
    short_cache = LRUQueryCache(capacity=10, default_ttl_seconds=1)
    short_cache.set("quick", "data", ttl=0)  # expires immediately
    time.sleep(0.01)
    assert short_cache.get("quick") is None


def test_lru_cache_clear(cache):
    cache.set("a", 1)
    cache.set("b", 2)
    assert len(cache.cache) == 2
    cache.clear()
    assert len(cache.cache) == 0
    stats = cache.stats()
    assert stats["hits"] == 0 and stats["misses"] == 0


def test_lru_cache_hit_rate_calculation(cache):
    cache.clear()
    cache.set("item", 100)
    cache.get("item")  # hit
    cache.get("item")  # hit
    cache.get("missing")  # miss
    stats = cache.stats()
    assert stats["hits"] == 2
    assert stats["misses"] == 1
    assert stats["hit_rate_pct"] == round(2 / 3 * 100, 2)
