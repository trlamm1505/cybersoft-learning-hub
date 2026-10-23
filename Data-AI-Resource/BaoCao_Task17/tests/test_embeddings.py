"""Tests for EmbeddingEngine."""

import numpy as np
import pytest
from src.embeddings import EmbeddingEngine


@pytest.fixture
def sample_corpus():
    return [
        "Quy chế bảo lưu khóa học tại học viện đào tạo CyberSoft",
        "Chính sách hoàn trả học phí và rút hồ sơ nhập học học viên",
        "Quy định chuyên cần và điểm danh lớp học lập trình trực tiếp",
        "Tiêu chuẩn tốt nghiệp và cấp chứng chỉ hoàn thành khóa học",
        "Hướng dẫn cấu hình môi trường lập trình Python và AI Machine Learning",
    ]


def test_embedding_fit_and_encode_shape(sample_corpus):
    engine = EmbeddingEngine(dimension=16)
    engine.fit(sample_corpus)
    vecs = engine.encode(sample_corpus)

    assert isinstance(vecs, np.ndarray)
    assert vecs.ndim == 2
    assert vecs.shape[0] == len(sample_corpus)
    assert vecs.shape[1] == engine.dimension


def test_embedding_l2_normalization(sample_corpus):
    engine = EmbeddingEngine(dimension=16)
    engine.fit(sample_corpus)
    vecs = engine.encode(sample_corpus)

    norms = np.linalg.norm(vecs, axis=1)
    for norm in norms:
        assert pytest.approx(norm, abs=1e-5) == 1.0


def test_embedding_deterministic_output(sample_corpus):
    engine = EmbeddingEngine(dimension=16)
    engine.fit(sample_corpus)

    q = "Quy định bảo lưu khóa học CyberSoft"
    vec1 = engine.encode(q)
    vec2 = engine.encode(q)

    np.testing.assert_array_almost_equal(vec1, vec2)


def test_embedding_save_and_load(tmp_path, sample_corpus):
    engine = EmbeddingEngine(dimension=16)
    engine.fit(sample_corpus)

    save_path = tmp_path / "model.pkl"
    engine.save(save_path)
    assert save_path.exists()

    loaded_engine = EmbeddingEngine.load(save_path)
    assert loaded_engine.is_fitted
    assert loaded_engine.dimension == engine.dimension

    q = "Chính sách hoàn phí"
    v_orig = engine.encode(q)
    v_loaded = loaded_engine.encode(q)
    np.testing.assert_array_almost_equal(v_orig, v_loaded)
