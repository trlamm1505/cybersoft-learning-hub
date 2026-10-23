"""Unit tests for VectorIndex and Cosine similarity."""

from pathlib import Path
import tempfile
import numpy as np

from src.vector_index import VectorIndex


def test_vector_index_add_and_search():
    vidx = VectorIndex(dimension=4)
    vectors = np.array(
        [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
        ],
        dtype=np.float32,
    )
    metas = [
        {"chunk_id": "c1", "category": "A"},
        {"chunk_id": "c2", "category": "B"},
        {"chunk_id": "c3", "category": "A"},
    ]
    vidx.add(vectors, metas)
    assert len(vidx) == 3

    # Query identical to c1
    query = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float32)
    results = vidx.search(query, top_k=2)
    assert len(results) == 2
    top_score, top_meta = results[0]
    assert top_meta["chunk_id"] == "c1"
    assert np.isclose(top_score, 1.0, atol=1e-5)


def test_vector_index_metadata_filtering():
    vidx = VectorIndex(dimension=2)
    vectors = np.array([[1.0, 0.0], [0.8, 0.6]], dtype=np.float32)
    metas = [
        {"chunk_id": "c1", "category": "Policy"},
        {"chunk_id": "c2", "category": "Curriculum"},
    ]
    vidx.add(vectors, metas)

    query = np.array([1.0, 0.0], dtype=np.float32)
    results = vidx.search(
        query,
        top_k=2,
        filter_fn=lambda m: m.get("category") == "Curriculum",
    )
    assert len(results) == 1
    assert results[0][1]["chunk_id"] == "c2"


def test_vector_index_save_load():
    vidx = VectorIndex(dimension=2)
    vectors = np.array([[1.0, 0.0]], dtype=np.float32)
    metas = [{"chunk_id": "test_1"}]
    vidx.add(vectors, metas)

    with tempfile.TemporaryDirectory() as tmp_dir:
        art_path = Path(tmp_dir) / "vec_test.npz"
        vidx.save(art_path)
        assert art_path.exists()

        loaded = VectorIndex.load(art_path)
        assert len(loaded) == 1
        assert loaded.dimension == 2
        assert loaded.metadata_list[0]["chunk_id"] == "test_1"
