"""Test synchronization between Dashboard Collector and Dataset Registry (Task 10) & Project Bank."""

from pathlib import Path
import json

from src.collector import ResourceCollector

TASK15_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = TASK15_DIR.parent.parent


def test_collector_matches_registry_db_exactly():
    task10_db_path = (
        TASK15_DIR.parent / "BaoCao_Task10" / "registry_store" / "registry_db.json"
    )
    assert task10_db_path.exists(), "Registry DB not found"

    with open(task10_db_path, "r", encoding="utf-8") as f:
        registry_data = json.load(f)

    expected_datasets = registry_data.get("datasets", {})
    collector = ResourceCollector()
    resources = collector.collect_all_resources()

    dataset_items = [r for r in resources if r.resource_type == "dataset"]
    assert len(dataset_items) == len(expected_datasets)

    for ds_id in expected_datasets:
        matched = [r for r in dataset_items if r.id == ds_id]
        assert (
            len(matched) == 1
        ), f"Dataset {ds_id} not found or duplicated in collector"
        item = matched[0]
        assert item.name == expected_datasets[ds_id]["name"]


def test_collector_contains_all_capstones():
    collector = ResourceCollector()
    resources = collector.collect_all_resources()
    project_items = [r for r in resources if r.resource_type == "capstone_project"]

    expected_project_ids = {"PRJ-STD-01", "PRJ-DA-01", "PRJ-DA-02", "PRJ-AI-01"}
    actual_project_ids = {p.id for p in project_items}
    assert expected_project_ids.issubset(actual_project_ids)


def test_zero_leakage_is_maintained_across_all_capstones():
    collector = ResourceCollector()
    resources = collector.collect_all_resources()
    for r in resources:
        if r.resource_type == "capstone_project":
            assert (
                r.anti_leakage_score == 100.0
            ), f"Capstone {r.id} violated zero leakage"
            assert (
                r.rubric_objectivity_score == 100.0
            ), f"Capstone {r.id} has subjective rubric"
