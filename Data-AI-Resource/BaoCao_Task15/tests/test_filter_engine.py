"""Test multi-dimensional filtering engine."""

import pytest
from src.collector import ResourceCollector
from src.filter_engine import FilterEngine


@pytest.fixture
def resources():
    collector = ResourceCollector()
    return collector.collect_all_resources()


def test_filter_by_track(resources):
    da_items = FilterEngine.filter_resources(resources, track="Data Analyst")
    assert len(da_items) == 5
    for r in da_items:
        assert r.track == "Data Analyst"

    aie_items = FilterEngine.filter_resources(resources, track="AI Engineer")
    assert len(aie_items) == 2
    for r in aie_items:
        assert r.track == "AI Engineer"

    shared_items = FilterEngine.filter_resources(resources, track="Shared / Foundation")
    assert len(shared_items) == 1
    assert shared_items[0].id == "PRJ-STD-01"


def test_filter_by_domain(resources):
    retail_items = FilterEngine.filter_resources(resources, domain="Retail E-Commerce")
    assert (
        len(retail_items) == 4
    )  # ds-retail, ds-dirty-test-quarantine, PRJ-STD-01, PRJ-DA-01
    for r in retail_items:
        assert r.domain == "Retail E-Commerce"

    nlp_items = FilterEngine.filter_resources(
        resources, domain="NLP & Knowledge Systems"
    )
    assert len(nlp_items) == 2  # ds-nlp, PRJ-AI-01


def test_filter_by_tier(resources):
    gold_items = FilterEngine.filter_resources(resources, quality_tier="Gold")
    assert len(gold_items) == 7

    quarantined_items = FilterEngine.filter_resources(
        resources, quality_tier="Quarantined"
    )
    assert len(quarantined_items) == 1
    assert quarantined_items[0].id == "ds-dirty-test-quarantine"


def test_filter_by_resource_type(resources):
    datasets = FilterEngine.filter_resources(resources, resource_type="dataset")
    assert len(datasets) == 4

    capstones = FilterEngine.filter_resources(
        resources, resource_type="capstone_project"
    )
    assert len(capstones) == 4


def test_text_search(resources):
    rag_items = FilterEngine.filter_resources(resources, search_query="RAG")
    assert len(rag_items) == 2
    ids = {r.id for r in rag_items}
    assert "ds-nlp-rag-tutor-knowledgebase-v1" in ids
    assert "PRJ-AI-01" in ids

    inventory_items = FilterEngine.filter_resources(resources, search_query="Inventory")
    assert len(inventory_items) == 1
    assert inventory_items[0].id == "PRJ-DA-02"
