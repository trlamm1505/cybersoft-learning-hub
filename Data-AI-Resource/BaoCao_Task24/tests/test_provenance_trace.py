"""Tests for Lineage DAG construction and Provenance Backtrace."""

from src.schemas.artifact import ArtifactType
from src.services.lineage_engine import LineageEngine


def test_trace_exercise_back_to_root_datasets(engine: LineageEngine):
    target_id = "exercise_approved_exercise_bank_20_v1.0.0"
    result = engine.trace_to_source(target_id)

    assert result.target_id == target_id
    assert result.target_type == ArtifactType.EXERCISE
    assert len(result.direct_parents) >= 5

    # Check root datasets identified
    assert "dataset_retail_sales_dataset_v1.0.0" in result.ancestors_by_type.datasets
    assert "dataset_hr_attendance_dataset_v1.0.0" in result.ancestors_by_type.datasets
    assert "dataset_customer_churn_dataset_v1.0.0" in result.ancestors_by_type.datasets
    assert "model_gemini_3.8_flash_checkpoint_v1.0.0" in result.ancestors_by_type.models
    assert len(result.root_sources) >= 4
    assert result.max_lineage_depth >= 2


def test_trace_evaluation_back_to_components(engine: LineageEngine):
    target_id = "evaluation_rag_benchmark_100_evaluation_v1.0.0"
    result = engine.trace_to_source(target_id)

    assert result.target_id == target_id
    assert (
        "dataset_ai_knowledge_chunks_corpus_v1.0.0" in result.ancestors_by_type.datasets
    )
    assert "model_bge_small_english_embedder_v1.0.0" in result.ancestors_by_type.models
    assert (
        "prompt_rag_tutor_grounding_prompt_v1.0.0" in result.ancestors_by_type.prompts
    )


def test_root_and_leaf_node_detection(engine: LineageEngine):
    dag = engine.build_dag()
    assert dag.total_nodes >= 16
    assert dag.total_edges >= 20

    # Root nodes should have 0 upstreams
    for root_id in dag.root_node_ids:
        assert len(dag.nodes[root_id].upstream_ids) == 0

    # Leaf nodes should have 0 downstreams
    for leaf_id in dag.leaf_node_ids:
        assert len(dag.nodes[leaf_id].downstream_ids) == 0


def test_all_paths_to_root(engine: LineageEngine):
    target_id = "exercise_approved_exercise_bank_20_v1.0.0"
    result = engine.trace_to_source(target_id)

    assert len(result.paths_to_roots) > 0
    # Every path should start with a root and end with target_id
    for path in result.paths_to_roots:
        assert path[-1] == target_id
        assert path[0] in result.root_sources
