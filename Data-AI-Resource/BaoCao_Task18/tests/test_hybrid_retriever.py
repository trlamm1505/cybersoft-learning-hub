"""Unit tests for HybridRetriever v0.2."""


def test_hybrid_search_modes(test_retriever):
    modes = ["dense_only", "bm25_only", "hybrid_rrf", "hybrid_weighted", "reranked"]
    query = "Hướng dẫn cấu hình WSL2"

    for mode in modes:
        results = test_retriever.search(query=query, top_k=2, mode=mode)
        assert len(results) > 0, f"Mode {mode} returned empty results."
        assert "chunk_id" in results[0]
        assert "rank" in results[0]
        assert "score" in results[0]
        assert "citation" in results[0]


def test_citation_metadata_completeness(test_retriever):
    results = test_retriever.search(query="Khóa học React", top_k=1, mode="reranked")
    assert len(results) == 1
    cit = results[0]["citation"]

    assert cit["document_id"] == "CS-CRS-TEST"
    assert cit["section_id"] == "SEC-TEST-03"
    assert "Frontend React" in cit["breadcrumbs"] or "React" in cit["title"]
    assert cit["file_path"] == "docs/CS-CRS-TEST.md"
    assert isinstance(cit["char_start"], int)
    assert isinstance(cit["char_end"], int)
    assert len(cit["content_snippet"]) > 0


def test_metadata_filtering(test_retriever):
    # Filter by category
    results = test_retriever.search(
        query="Học lập trình",
        top_k=5,
        category="Technical Guide",
    )
    for r in results:
        assert r["citation"]["category"] == "Technical Guide"

    # Filter by document_id
    results_doc = test_retriever.search(
        query="Bảo lưu",
        top_k=5,
        document_id="CS-POL-TEST",
    )
    for r in results_doc:
        assert r["citation"]["document_id"] == "CS-POL-TEST"
