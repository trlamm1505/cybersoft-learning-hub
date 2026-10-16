"""Pydantic schemas for Task 29 Benchmarking and Deployment."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LatencyPercentiles(BaseModel):
    p50: float
    p75: float
    p90: float
    p95: float
    p99: float
    target_p95_threshold_ms: float
    status: str


class ThroughputMetrics(BaseModel):
    concurrency_workers: int
    total_simulated_requests: int
    total_duration_seconds: float
    requests_per_second_rps: float
    failed_requests: int
    error_rate_pct: float


class MemoryProfile(BaseModel):
    cold_start_rss_mb: float
    warm_up_rss_mb: float
    peak_load_rss_mb: float
    memory_limit_mb: float
    status: str


class CacheStatistics(BaseModel):
    cache_type: str
    max_cache_size: int
    total_requests: int
    cache_hits: int
    cache_misses: int
    hit_rate_pct: float
    avg_uncached_latency_ms: float
    avg_cached_latency_ms: float
    latency_reduction_pct: float


class BenchmarkSummary(BaseModel):
    system_profile: Dict[str, Any]
    ingestion_benchmark: Dict[str, Any]
    search_latency_benchmark_ms: LatencyPercentiles
    ai_tutor_latency_benchmark_ms: Dict[str, Any]
    throughput_benchmark: ThroughputMetrics
    memory_profiling_mb: MemoryProfile
    caching_metrics: CacheStatistics


class BackupFileEntry(BaseModel):
    filename: str
    size_bytes: int
    sha256: str


class BackupManifest(BaseModel):
    backup_id: str
    created_at: str
    total_files: int
    files: List[BackupFileEntry]


class RestoreResult(BaseModel):
    backup_id: str
    status: str  # SUCCESS, FAILED
    verified_files: int
    matched_checksums: int
    restored_at: str
    details: str
