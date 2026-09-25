"""Unit tests for IREvaluator and controlled experiment."""

from src.evaluator import IREvaluator


def test_evaluator_metrics_computation(test_retriever):
    queries = [
        {
            "query_id": "Q1",
            "query": "Bảo lưu khóa học tối đa bao nhiêu tháng?",
            "target_chunk_id": "TEST_001",
            "target_document_id": "CS-POL-TEST",
            "split": "test",
        },
        {
            "query_id": "Q2",
            "query": "Cấu hình WSL2 và Ubuntu?",
            "target_chunk_id": "TEST_002",
            "target_document_id": "CS-TEC-TEST",
            "split": "test",
        },
    ]

    evaluator = IREvaluator(test_retriever)
    eval_res = evaluator.evaluate_queries(queries, mode="reranked", split_filter="test")

    metrics = eval_res["metrics"]
    assert "recall_at_1" in metrics
    assert "recall_at_5" in metrics
    assert "mrr" in metrics
    assert "ndcg_at_5" in metrics
    assert metrics["recall_at_5"] == 1.0

    assert "latency_ms" in eval_res
    assert "p50" in eval_res["latency_ms"]
    assert eval_res["cost"]["cloud_api_cost_usd"] == 0.00


def test_controlled_experiment_modes(test_retriever):
    queries = [
        {
            "query_id": "Q1",
            "query": "Cấu hình WSL2 và Ubuntu?",
            "target_chunk_id": "TEST_002",
            "target_document_id": "CS-TEC-TEST",
            "split": "test",
        }
    ]
    evaluator = IREvaluator(test_retriever)
    exp = evaluator.run_controlled_experiment(queries, split_filter="test")

    assert "experiments" in exp
    assert "dense_only" in exp["experiments"]
    assert "bm25_only" in exp["experiments"]
    assert "hybrid_rrf" in exp["experiments"]
    assert "reranked" in exp["experiments"]
