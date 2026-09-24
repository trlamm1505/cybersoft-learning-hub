"""Test mathematical correctness of CRQOF metric definitions and RQI index."""

import pytest
from src.collector import ResourceCollector
from src.metrics_engine import MetricsEngine


@pytest.fixture
def resources():
    collector = ResourceCollector()
    return collector.collect_all_resources()


def test_rqi_formula_weights(resources):
    """Verify that RQI is computed with exact weights:
    RQI = 0.20*QG + 0.15*SV + 0.15*CP + 0.15*AL + 0.15*TPR + 0.10*RO + 0.10*BI
    """
    for r in resources:
        expected_rqi = (
            0.20 * r.quality_gate_score
            + 0.15 * (100.0 if r.schema_valid else 0.0)
            + 0.15 * r.completeness_score
            + 0.15 * r.anti_leakage_score
            + 0.15 * r.test_pass_rate
            + 0.10 * r.rubric_objectivity_score
            + 0.10 * r.business_integrity_score
        )
        assert abs(r.rqi - round(expected_rqi, 2)) < 0.05, f"RQI mismatch for {r.id}"


def test_summary_kpi_cards(resources):
    kpis = MetricsEngine.compute_summary_kpis(resources)
    assert kpis["total_resources"] == len(resources)
    assert kpis["total_records"] == sum(r.total_records for r in resources)
    assert 90.0 <= kpis["avg_rqi"] <= 100.0
    assert kpis["zero_leakage_compliance"] == 100.0
    assert kpis["gold_tier_count"] + kpis["quarantined_count"] == len(resources)


def test_track_and_domain_breakdown(resources):
    track_bd = MetricsEngine.breakdown_by_track(resources)
    assert "Data Analyst" in track_bd
    assert "AI Engineer" in track_bd
    assert "Shared / Foundation" in track_bd

    domain_bd = MetricsEngine.breakdown_by_domain(resources)
    assert len(domain_bd) >= 4
