"""End-to-End 4-Phase Verification Workflow for CyberSoft Task 17.

Tuần 4 - RAG và AI Tutor: NGÀY 17 — Retriever Baseline
Demonstrates full verification lifecycle:
  - Phase 1: Vector Index Building & Artifact Serialization (SHA-256 Manifest)
  - Phase 2: Top-5 Semantic Search & Citation Metadata Lineage
  - Phase 3: IR Evaluation & DoD Verification (Recall@5 >= 70%, MRR, Latency)
  - Phase 4: REST API Endpoints Verification via FastAPI TestClient
"""

from __future__ import annotations

import json
from pathlib import Path
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure parent directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient  # noqa: E402
from src.api import create_app  # noqa: E402
from src.embeddings import EmbeddingEngine  # noqa: E402
from src.evaluator import RetrievalEvaluator  # noqa: E402
from src.retriever import BaselineRetriever  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


def run_demo():
    print("===========================================================================")
    print("  CYBERSOFT RAG RETRIEVER BASELINE — 4-PHASE VERIFICATION WORKFLOW")
    print("===========================================================================")
    print(f"[*] Base directory: {BASE_DIR}")

    # =========================================================================
    # PHASE 1: VECTOR INDEX BUILDING & ARTIFACT SERIALIZATION
    # =========================================================================
    print(
        "\n==========================================================================="
    )
    print("  PHASE 1: VECTOR INDEX BUILDING & ARTIFACT SERIALIZATION")
    print("===========================================================================")

    chunks_file = BASE_DIR / "data" / "chunks_markdown_header_semantic.jsonl"
    if not chunks_file.exists() or chunks_file.stat().st_size == 0:
        chunks_file = (
            BASE_DIR.parent
            / "BaoCao_Task16"
            / "output"
            / "chunks_markdown_header_semantic.jsonl"
        )
    if not chunks_file.exists():
        print(f"[!] Phase 1 FAILED: Chunks file not found at {chunks_file}")
        return 1

    chunks = []
    with open(chunks_file, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                chunks.append(json.loads(line))

    print(f"[*] Loaded {len(chunks)} chunks from Task 16 output.")
    texts = [
        f"{c.get('metadata', {}).get('title', '')} {c.get('metadata', {}).get('breadcrumbs', '')} {c['text']}"
        for c in chunks
    ]

    engine = EmbeddingEngine(dimension=64)
    engine.fit(texts)
    vectors = engine.encode(texts)

    index = VectorIndex(dimension=engine.dimension)
    index.add(vectors=vectors, metadatas=chunks)

    indexes_dir = BASE_DIR / "indexes"
    model_path = indexes_dir / "embedding_model.pkl"
    index_path = indexes_dir / "vector_index.npz"
    manifest_path = indexes_dir / "index_manifest.json"

    engine.save(model_path)
    manifest = index.save(
        artifact_path=index_path,
        manifest_path=manifest_path,
        model_name="TFIDF-SVD-L2",
    )

    assert model_path.exists(), "Model artifact must exist"
    assert index_path.exists(), "Index artifact must exist"
    assert manifest_path.exists(), "Manifest must exist"
    assert (
        manifest["total_vectors"] == 91
    ), f"Expected 91 vectors, got {manifest['total_vectors']}"
    assert len(manifest["sha256_checksum"]) == 64, "Checksum must be 64-char SHA-256"

    print(
        f"[Phase 1 Result] Indexed {manifest['total_vectors']} vectors (dim={manifest['dimension']})."
    )
    print(f"[Phase 1 Result] SHA-256 Checksum: {manifest['sha256_checksum']}")
    print(
        "[PASS] Phase 1: Vector Index & Artifact Serialization completed successfully!"
    )

    # =========================================================================
    # PHASE 2: TOP-5 SEMANTIC SEARCH & CITATION LINEAGE
    # =========================================================================
    print(
        "\n==========================================================================="
    )
    print("  PHASE 2: TOP-5 SEMANTIC SEARCH & CITATION LINEAGE")
    print("===========================================================================")

    retriever = BaselineRetriever(embedding_engine=engine, vector_index=index)
    test_query = "Điều kiện để được xét công nhận tốt nghiệp chính thức tại CyberSoft?"

    print(f"[*] Query: '{test_query}'")
    search_results = retriever.search(query=test_query, top_k=5)
    assert len(search_results) > 0, "Search results must not be empty"

    top1 = search_results[0]
    print(f"[*] Top-1 Chunk: {top1.chunk_id} (Score: {top1.score:.4f})")
    print(f"[*] Document ID: {top1.document_id}")
    print(f"[*] Citation Title: {top1.citation.title}")
    print(f"[*] Citation Breadcrumbs: {top1.citation.breadcrumbs}")
    print(f"[*] Citation Section: {top1.citation.section_id}")
    print(f"[*] Text snippet: {top1.text[:100]}...")

    # Verify citation completeness
    assert (
        top1.citation.document_id != "UNKNOWN"
    ), "Citation document_id must be present"
    assert top1.citation.breadcrumbs != "", "Citation breadcrumbs must be present"
    assert top1.citation.section_id != "", "Citation section_id must be present"

    # Test category filtering
    filtered_results = retriever.search(
        query="lộ trình học tập",
        top_k=5,
        category="Curriculum",
    )
    for r in filtered_results:
        assert r.metadata.get("category") == "Curriculum", "Filter condition violated"
    print(
        f"[*] Filtered Search: {len(filtered_results)} chunks matching category='Curriculum'"
    )
    print("[PASS] Phase 2: Semantic Top-K Search and Citation Lineage verified 100%!")

    # =========================================================================
    # PHASE 3: IR BASELINE EVALUATION & DOD VERIFICATION
    # =========================================================================
    print(
        "\n==========================================================================="
    )
    print("  PHASE 3: IR BASELINE EVALUATION & DOD VERIFICATION")
    print("===========================================================================")

    eval_file = BASE_DIR / "data" / "eval" / "retrieval_eval_queries.json"
    with open(eval_file, "r", encoding="utf-8") as f:
        eval_queries = json.load(f)

    evaluator = RetrievalEvaluator(retriever=retriever)
    test_metrics = evaluator.evaluate_queries(
        queries=eval_queries,
        top_k=5,
        split_filter="test",
    )

    m = test_metrics["metrics"]
    lat = test_metrics["latency_ms"]

    print(
        f"[*] Evaluated on {test_metrics['total_queries']} test queries (Zero Data Leakage)."
    )
    print(f"[*] Recall@1:     {m['recall_at_1'] * 100:.2f}%")
    print(f"[*] Recall@3:     {m['recall_at_3'] * 100:.2f}%")
    print(f"[*] Recall@5:     {m['recall_at_5'] * 100:.2f}%  (DoD Threshold: >= 70.0%)")
    print(f"[*] Doc-Recall@5: {m['doc_recall_at_5'] * 100:.2f}%")
    print(f"[*] MRR:          {m['mrr']:.4f}")
    print(f"[*] Median (p50): {lat['p50']} ms (SLA: < 20.0 ms)")

    # Assert DoD Criteria
    assert (
        m["recall_at_5"] >= 0.70
    ), f"Recall@5 ({m['recall_at_5']}) does not meet DoD threshold (>= 0.70)"
    assert m["mrr"] >= 0.50, f"MRR ({m['mrr']}) below expected threshold"
    assert lat["p50"] < 20.0, f"Latency p50 ({lat['p50']}ms) violates SLA"

    # Export reports
    rep_dir = BASE_DIR / "reports"
    rep_dir.mkdir(parents=True, exist_ok=True)
    with open(rep_dir / "retrieval_baseline_metrics.json", "w", encoding="utf-8") as f:
        json.dump(test_metrics, f, indent=2, ensure_ascii=False)
    evaluator.generate_markdown_report(
        metrics=test_metrics,
        output_file=rep_dir / "retrieval_baseline_report.md",
    )

    print("[PASS] Phase 3: IR Evaluation and DoD criteria successfully verified!")

    # =========================================================================
    # PHASE 4: REST API ENDPOINTS VERIFICATION (FASTAPI TESTCLIENT)
    # =========================================================================
    print(
        "\n==========================================================================="
    )
    print("  PHASE 4: REST API ENDPOINTS VERIFICATION (FASTAPI TESTCLIENT)")
    print("===========================================================================")

    app = create_app(retriever=retriever)
    client = TestClient(app)

    # 1. Health endpoint
    h_resp = client.get("/api/v1/health")
    assert h_resp.status_code == 200, f"Health check failed: {h_resp.text}"
    h_data = h_resp.json()
    assert h_data["status"] == "healthy"
    assert h_data["vectors_count"] == 91
    print(
        f"[*] /api/v1/health -> Status: {h_data['status']}, Vectors: {h_data['vectors_count']}"
    )

    # 2. Stats endpoint
    s_resp = client.get("/api/v1/stats")
    assert s_resp.status_code == 200, f"Stats failed: {s_resp.text}"
    s_data = s_resp.json()
    assert s_data["total_chunks_indexed"] == 91
    assert s_data["unique_documents"] == 23
    print(
        f"[*] /api/v1/stats -> Total Chunks: {s_data['total_chunks_indexed']}, Unique Docs: {s_data['unique_documents']}"
    )

    # 3. Search endpoint
    search_payload = {
        "query": "Quy chế bảo lưu khóa học tại CyberSoft",
        "top_k": 3,
        "min_score": 0.0,
    }
    post_resp = client.post("/api/v1/search", json=search_payload)
    assert post_resp.status_code == 200, f"Search API failed: {post_resp.text}"
    post_data = post_resp.json()
    assert post_data["total_results"] > 0
    first_hit = post_data["results"][0]
    assert "citation" in first_hit
    assert "breadcrumbs" in first_hit["citation"]
    print(
        f"[*] POST /api/v1/search -> Returned {post_data['total_results']} chunks in {post_data['latency_ms']} ms"
    )
    print(
        f"    - First Hit: {first_hit['chunk_id']} ({first_hit['citation']['title']})"
    )

    # 4. Validation error test
    invalid_resp = client.post("/api/v1/search", json={"query": "", "top_k": 3})
    assert invalid_resp.status_code == 422, "Empty query must fail validation with 422"
    print(
        "[*] POST /api/v1/search (Empty Query) -> 422 Unprocessable Entity (Validation working)"
    )

    print("[PASS] Phase 4: All REST API endpoints validated successfully!")

    print(
        "\n==========================================================================="
    )
    print("  ALL 4 PHASES COMPLETED WITH 100% SUCCESS — EXIT CODE 0")
    print("===========================================================================")
    return 0


if __name__ == "__main__":
    sys.exit(run_demo())
