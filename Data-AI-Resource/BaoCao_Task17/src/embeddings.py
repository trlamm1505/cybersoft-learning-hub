"""Embedding Engine for CyberSoft RAG Baseline.

Tuần 4 - RAG và AI Tutor (Task 17)
Provides semantic vector representation with L2 normalization for deterministic,
low-latency, and reproducible cosine similarity search.
"""

from __future__ import annotations

import pickle
from pathlib import Path
from typing import List, Union

import numpy as np
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize


class EmbeddingEngine:
    """Semantic Embedding Engine using TF-IDF and SVD with L2 normalization.

    Ensures 100% offline, reproducible, deterministic vector embeddings with
    sub-millisecond encoding latency.
    """

    def __init__(self, dimension: int = 64, random_state: int = 42):
        self.dimension = dimension
        self.random_state = random_state
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=1,
            strip_accents=None,
            lowercase=True,
        )
        self.svd = TruncatedSVD(
            n_components=self.dimension,
            random_state=self.random_state,
            algorithm="randomized",
            n_iter=7,
        )
        self.is_fitted = False

    def fit(self, texts: List[str]) -> EmbeddingEngine:
        """Fit vocabulary and semantic projection basis on corpus texts."""
        if not texts:
            raise ValueError(
                "Corpus texts cannot be empty for fitting embedding engine."
            )

        tfidf_matrix = self.vectorizer.fit_transform(texts)
        actual_components = min(
            self.dimension, tfidf_matrix.shape[1] - 1, tfidf_matrix.shape[0] - 1
        )
        if actual_components < 2:
            actual_components = min(2, tfidf_matrix.shape[1])

        if actual_components != self.dimension:
            self.dimension = actual_components
            self.svd = TruncatedSVD(
                n_components=self.dimension,
                random_state=self.random_state,
                algorithm="randomized",
                n_iter=7,
            )

        self.svd.fit(tfidf_matrix)
        self.is_fitted = True
        return self

    def encode(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Encode input text or list of texts into L2-normalized float32 vectors.

        Returns:
            np.ndarray of shape (N, dimension) where each vector has unit L2 norm.
        """
        if not self.is_fitted:
            raise RuntimeError("EmbeddingEngine must be fitted before encoding.")

        is_single = isinstance(texts, str)
        if is_single:
            texts = [texts]

        cleaned_texts = [t.strip() if t.strip() else "empty_text" for t in texts]
        tfidf_vecs = self.vectorizer.transform(cleaned_texts)
        dense_vecs = self.svd.transform(tfidf_vecs)

        # L2 Normalization: ensures ||v||_2 = 1 so cosine_similarity = dot_product
        normalized_vecs = normalize(dense_vecs, norm="l2", axis=1)
        result = normalized_vecs.astype(np.float32)

        return result

    def save(self, filepath: Union[str, Path]) -> None:
        """Persist fitted model artifacts to disk."""
        target_path = Path(filepath)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        artifact = {
            "dimension": self.dimension,
            "random_state": self.random_state,
            "vectorizer": self.vectorizer,
            "svd": self.svd,
            "is_fitted": self.is_fitted,
        }
        with open(target_path, "wb") as f:
            pickle.dump(artifact, f, protocol=pickle.HIGHEST_PROTOCOL)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> EmbeddingEngine:
        """Load fitted model artifact from disk."""
        target_path = Path(filepath)
        if not target_path.exists():
            raise FileNotFoundError(f"Model artifact not found at {target_path}")

        with open(target_path, "rb") as f:
            artifact = pickle.load(f)

        engine = cls(
            dimension=artifact["dimension"],
            random_state=artifact["random_state"],
        )
        engine.vectorizer = artifact["vectorizer"]
        engine.svd = artifact["svd"]
        engine.is_fitted = artifact["is_fitted"]
        return engine
