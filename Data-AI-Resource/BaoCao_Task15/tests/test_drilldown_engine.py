"""Test drill-down capabilities: metadata, quality gate checks, and violations."""

import pytest
from src.collector import ResourceCollector


@pytest.fixture
def resources():
    collector = ResourceCollector()
    return collector.collect_all_resources()


def test_quarantined_drilldown_has_violations(resources):
    quarantined = [r for r in resources if r.quality_tier == "Quarantined"]
    assert len(quarantined) == 1
    item = quarantined[0]
    assert item.violations_count >= 1
    assert len(item.violations) >= 1
    assert (
        "lineage" in item.violations[0].lower()
        or "required" in item.violations[0].lower()
    )
    assert item.schema_valid is False
    assert item.state == "quarantined"


def test_gold_tier_drilldown_has_zero_violations(resources):
    gold_items = [r for r in resources if r.quality_tier == "Gold"]
    for g in gold_items:
        assert g.violations_count == 0
        assert len(g.violations) == 0
        assert g.schema_valid is True
        assert g.quality_gate_score >= 95.0


def test_metadata_completeness(resources):
    for r in resources:
        assert r.id != ""
        assert r.name != ""
        assert r.author != ""
        assert r.version != ""
        assert r.description != ""
        assert r.relative_source_dir != ""
        assert isinstance(r.metadata_details, dict)
