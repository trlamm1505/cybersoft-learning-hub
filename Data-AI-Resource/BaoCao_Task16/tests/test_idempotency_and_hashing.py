"""Unit tests for Hashing and Idempotency State Store in CyberSoft RAG Pipeline."""

from pathlib import Path

from src.hashing import FileChangeStatus, StateStore, hash_content


def test_hash_consistency():
    t1 = "Nội dung chuẩn hóa CyberSoft."
    t2 = "Nội dung chuẩn hóa CyberSoft."
    t3 = "Nội dung khác biệt CyberSoft."

    h1 = hash_content(t1)
    h2 = hash_content(t2)
    h3 = hash_content(t3)

    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 64  # SHA-256 length


def test_state_store_determination(tmp_path: Path):
    state_file = tmp_path / "state_store.json"
    store = StateStore(state_file)

    doc_id = "DOC-001"
    initial_hash = hash_content("Version 1")

    # Initial status should be NEW
    assert store.determine_status(doc_id, initial_hash) == FileChangeStatus.NEW

    # Record document
    store.record_document(
        document_id=doc_id,
        relative_path="data/doc1.md",
        content_hash=initial_hash,
        chunk_count=3,
        strategy="markdown_header_semantic",
        chunk_hashes=["h1", "h2", "h3"],
    )
    store.save()

    # Re-check status with same hash -> UNCHANGED
    assert store.determine_status(doc_id, initial_hash) == FileChangeStatus.UNCHANGED

    # Re-check status with modified content -> MODIFIED
    new_hash = hash_content("Version 2 with updates")
    assert store.determine_status(doc_id, new_hash) == FileChangeStatus.MODIFIED


def test_state_store_persistence(tmp_path: Path):
    state_file = tmp_path / "state_store.json"
    store1 = StateStore(state_file)

    store1.record_document("D1", "path1.md", "hash1", 2, "strat", ["c1", "c2"])
    store1.save()

    # Reload in a new instance
    store2 = StateStore(state_file)
    assert "D1" in store2.records
    assert store2.records["D1"].content_hash == "hash1"
    assert store2.records["D1"].chunk_count == 2
    assert "c1" in store2.get_existing_chunk_hashes()


def test_incremental_modification_detection(tmp_path: Path):
    state_file = tmp_path / "state_store.json"
    store = StateStore(state_file)

    doc_id = "DOC-MOD"
    h1 = hash_content("Paragraph 1")
    store.record_document(doc_id, "doc.md", h1, 1, "strat", ["c1"])
    assert store.determine_status(doc_id, h1) == FileChangeStatus.UNCHANGED

    h2 = hash_content("Paragraph 1 modified")
    assert store.determine_status(doc_id, h2) == FileChangeStatus.MODIFIED
