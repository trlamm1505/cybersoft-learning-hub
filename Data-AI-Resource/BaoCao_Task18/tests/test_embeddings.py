"""Unit tests for EmbeddingEngine and L2 normalization."""

from pathlib import Path
import tempfile
import numpy as np

from src.embeddings import EmbeddingEngine


def test_embedding_engine_fit_and_encode():
    texts = [
        "Chính sách bảo lưu khóa học tại CyberSoft.",
        "Quy định điểm danh và chuyên cần lớp học.",
        "Lộ trình học ReactJS và NodeJS fullstack.",
    ]
    engine = EmbeddingEngine(dimension=16).fit(texts)
    assert engine.is_fitted

    vecs = engine.encode(texts)
    assert vecs.shape == (3, engine.dimension)
    assert vecs.dtype == np.float32

    # L2 normalization test: ||v||_2 must equal 1.0
    for vec in vecs:
        norm = np.linalg.norm(vec)
        assert np.isclose(norm, 1.0, atol=1e-5), f"L2 norm {norm} is not unit."


def test_embedding_engine_save_load():
    texts = ["CyberSoft Academy", "Data & AI Resource Engineer"]
    engine = EmbeddingEngine(dimension=16).fit(texts)

    with tempfile.TemporaryDirectory() as tmp_dir:
        art_path = Path(tmp_dir) / "emb_test.pkl"
        engine.save(art_path)
        assert art_path.exists()

        loaded = EmbeddingEngine.load(art_path)
        assert loaded.is_fitted
        assert loaded.dimension == engine.dimension

        v1 = engine.encode("CyberSoft")
        v2 = loaded.encode("CyberSoft")
        assert np.allclose(v1, v2)
