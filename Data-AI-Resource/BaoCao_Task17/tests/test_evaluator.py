"""Tests for RetrievalEvaluator."""

import pytest
from src.embeddings import EmbeddingEngine
from src.evaluator import RetrievalEvaluator
from src.retriever import BaselineRetriever
from src.vector_index import VectorIndex


@pytest.fixture
def eval_setup():
    corpus = [
        "Quy chế bảo lưu khóa học đào tạo CyberSoft",
        "Chính sách hoàn trả học phí rút hồ sơ nhập học",
    ]
    meta = [
        {"chunk_id": "c1", "document_id": "D1", "text": corpus[0], "metadata": {}},
        {"chunk_id": "c2", "document_id": "D2", "text": corpus[1], "metadata": {}},
    ]
    engine = EmbeddingEngine(dimension=2)
    engine.fit(corpus)
    vecs = engine.encode(corpus)
    idx = VectorIndex(dimension=engine.dimension)
    idx.add(vecs, meta)
    retriever = BaselineRetriever(embedding_engine=engine, vector_index=idx)
    return RetrievalEvaluator(retriever=retriever)


def test_evaluator_metrics_calculation(eval_setup):
    queries = [
        {
            "query_id": "q1",
            "query": "Quy chế bảo lưu",
            "target_document_id": "D1",
            "target_chunk_id": "c1",
            "split": "test",
        },
        {
            "query_id": "q2",
            "query": "Chính sách hoàn phí",
            "target_document_id": "D2",
            "target_chunk_id": "c2",
            "split": "test",
        },
    ]

    metrics = eval_setup.evaluate_queries(queries=queries, top_k=2)

    assert metrics["total_queries"] == 2
    m = metrics["metrics"]
    assert m["recall_at_1"] == 1.0
    assert m["recall_at_5"] == 1.0
    assert m["mrr"] == 1.0
    assert metrics["latency_ms"]["mean"] >= 0.0


def test_evaluator_split_filtering(eval_setup):
    queries = [
        {
            "query_id": "q1",
            "query": "bảo lưu",
            "target_chunk_id": "c1",
            "split": "train",
        },
        {
            "query_id": "q2",
            "query": "hoàn phí",
            "target_chunk_id": "c2",
            "split": "test",
        },
    ]

    metrics_test = eval_setup.evaluate_queries(queries=queries, split_filter="test")
    assert metrics_test["total_queries"] == 1
    assert metrics_test["split"] == "test"


def test_evaluator_markdown_report_generation(eval_setup):
    queries = [
        {
            "query_id": "q1",
            "query": "bảo lưu",
            "target_chunk_id": "c1",
            "split": "test",
        },
    ]
    metrics = eval_setup.evaluate_queries(queries=queries)
    report_md = eval_setup.generate_markdown_report(metrics=metrics)

    assert "RETRIEVAL BASELINE REPORT" in report_md
    assert "Recall@5" in report_md
    assert "MRR" in report_md
