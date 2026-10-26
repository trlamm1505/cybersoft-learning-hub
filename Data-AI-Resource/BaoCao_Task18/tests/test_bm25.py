"""Unit tests for BM25 Okapi lexical engine."""

import tempfile
from pathlib import Path

from src.bm25 import BM25Engine, tokenize_vietnamese_technical


def test_tokenize_preserves_technical_identifiers():
    text = "Cấu hình WSL2, CS-POL-003, CI/CD và Docker trong dự án!"
    tokens = tokenize_vietnamese_technical(text)
    assert "wsl2" in tokens
    assert "cs-pol-003" in tokens
    assert "ci_cd" in tokens
    assert "docker" in tokens


def test_bm25_fit_and_score():
    docs = [
        "Chính sách bảo lưu khóa học tại CyberSoft Academy 06 tháng.",
        "Hướng dẫn cấu hình WSL2 và Ubuntu cho AI trên Windows.",
        "Lộ trình học ReactJS và NodeJS Fullstack.",
    ]
    engine = BM25Engine(k1=1.5, b=0.75).fit(docs)
    assert engine.is_fitted
    assert engine.corpus_size == 3
    assert engine.avg_doc_len > 0

    score_match = engine.score("bảo lưu khóa học", 0)
    score_nomatch = engine.score("bảo lưu khóa học", 1)
    assert score_match > score_nomatch
    assert score_match > 0.0


def test_bm25_search_ranking():
    docs = [
        "Quy định điểm danh chuyên cần CyberSoft.",
        "Học phí hoàn trả và rút hồ sơ nhập học.",
        "Hướng dẫn cài đặt Visual Studio Code Python.",
    ]
    engine = BM25Engine().fit(docs)
    results = engine.search("hoàn trả học phí", top_k=2)
    assert len(results) > 0
    top_doc_idx, top_score = results[0]
    assert top_doc_idx == 1  # 2nd doc has "hoàn trả học phí"
    assert top_score > 0.0


def test_bm25_save_and_load():
    docs = ["Học viện CyberSoft", "Lập trình AI Native"]
    engine = BM25Engine().fit(docs)

    with tempfile.TemporaryDirectory() as tmp_dir:
        art_path = Path(tmp_dir) / "bm25_test.pkl"
        engine.save(art_path)
        assert art_path.exists()

        loaded = BM25Engine.load(art_path)
        assert loaded.is_fitted
        assert loaded.corpus_size == engine.corpus_size
        assert loaded.score("CyberSoft", 0) == engine.score("CyberSoft", 0)
