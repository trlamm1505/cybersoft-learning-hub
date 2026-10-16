"""Test cases for system SLA benchmarks and compliance."""

def test_hybrid_search_sla_limit(manifest_data):
    sla = manifest_data["system_sla_benchmarks"]
    assert sla["hybrid_search_p95_ms"] <= sla["hybrid_search_sla_limit_ms"]
    assert sla["hybrid_search_p95_ms"] <= 25.0


def test_ai_tutor_sla_limit(manifest_data):
    sla = manifest_data["system_sla_benchmarks"]
    assert sla["ai_tutor_p95_ms"] <= sla["ai_tutor_sla_limit_ms"]
    assert sla["ai_tutor_p95_ms"] <= 1500.0


def test_throughput_benchmark(manifest_data):
    sla = manifest_data["system_sla_benchmarks"]
    assert sla["throughput_rps"] >= 300.0


def test_cache_hit_rate_benchmark(manifest_data):
    sla = manifest_data["system_sla_benchmarks"]
    assert sla["cache_hit_rate_pct"] >= 80.0


def test_usability_sus_and_task_success(manifest_data):
    sla = manifest_data["system_sla_benchmarks"]
    assert sla["system_usability_scale_sus"] >= 85.0
    assert sla["task_completion_rate_pct"] == 100.0
    assert sla["time_to_find_reduction_pct"] >= 50.0


def test_api_get_sla_benchmarks(client):
    res = client.get("/api/v1/handover/sla-benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert "hybrid_search_p95_ms" in data
    assert data["disaster_recovery_checksum_match_pct"] == 100.0
