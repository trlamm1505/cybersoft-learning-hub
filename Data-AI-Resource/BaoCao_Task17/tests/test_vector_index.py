"""Tests for VectorIndex."""

import numpy as np
import pytest
from src.vector_index import VectorIndex


@pytest.fixture
def sample_index():
    dim = 4
    idx = VectorIndex(dimension=dim)
    # 3 vectors normalized
    v = np.array(
        [
            [1.0, 0.0, 0.0, 0.0],
            [0.0, 1.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0],
        ],
        dtype=np.float32,
    )
    meta = [
        {"chunk_id": "c1", "document_id": "D1", "metadata": {"category": "POL"}},
        {"chunk_id": "c2", "document_id": "D2", "metadata": {"category": "TEC"}},
        {"chunk_id": "c3", "document_id": "D3", "metadata": {"category": "POL"}},
    ]
    idx.add(v, meta)
    return idx


def test_vector_index_add_and_len(sample_index):
    assert len(sample_index) == 3
    assert sample_index.dimension == 4


def test_vector_index_cosine_search_ordering(sample_index):
    query_v = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float32)
    results = sample_index.search(query_v, top_k=2)

    assert len(results) == 2
    assert results[0][1]["chunk_id"] == "c1"
    assert pytest.approx(results[0][0], abs=1e-5) == 1.0
    assert pytest.approx(results[1][0], abs=1e-5) == 0.0


def test_vector_index_metadata_filtering(sample_index):
    query_v = np.array([1.0, 0.0, 0.0, 0.0], dtype=np.float32)

    def filter_fn(m):
        return m.get("metadata", {}).get("category") == "TEC"

    results = sample_index.search(query_v, top_k=5, filter_fn=filter_fn)

    assert len(results) == 1
    assert results[0][1]["chunk_id"] == "c2"


def test_vector_index_save_load_npz(tmp_path, sample_index):
    art_path = tmp_path / "index.npz"
    man_path = tmp_path / "manifest.json"

    manifest = sample_index.save(art_path, manifest_path=man_path)
    assert art_path.exists()
    assert man_path.exists()
    assert manifest["total_vectors"] == 3
    assert len(manifest["sha256_checksum"]) == 64

    loaded_index = VectorIndex.load(art_path)
    assert len(loaded_index) == 3
    assert loaded_index.dimension == 4

    query_v = np.array([0.0, 1.0, 0.0, 0.0], dtype=np.float32)
    res = loaded_index.search(query_v, top_k=1)
    assert res[0][1]["chunk_id"] == "c2"
