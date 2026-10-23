"""BM25 Okapi Lexical Search Engine for CyberSoft RAG.

Tuần 4 - RAG và AI Tutor (Task 18)
Provides exact-match lexical retrieval with sub-millisecond latency,
preserving alphanumeric identifiers (e.g. CS-POL-003, WSL2, Docker).
"""

from __future__ import annotations

import math
import pickle
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union


def tokenize_vietnamese_technical(text: str) -> List[str]:
    """Tokenize text preserving technical identifiers, hyphenated codes, and acronyms.

    Examples preserved as atomic tokens: 'CS-POL-003', 'SEC-CRS-001-02', 'CI/CD', 'WSL2'.
    """
    if not text:
        return []
    cleaned = text.lower()
    # Normalize slashes in technical acronyms like CI/CD -> ci_cd
    cleaned = re.sub(r"(\b\w+)/(\w+\b)", r"\1_\2", cleaned)
    # Extract word tokens with hyphens and underscores
    tokens = re.findall(
        r"[a-z0-9àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ\-_]+",
        cleaned,
    )
    # Strip leading/trailing punctuation characters from tokens
    clean_tokens = []
    for t in tokens:
        t_stripped = t.strip("-_")
        if len(t_stripped) >= 1:
            clean_tokens.append(t_stripped)
    return clean_tokens


class BM25Engine:
    """Okapi BM25 Lexical Retrieval Engine.

    Parameters:
        k1: Term frequency saturation parameter (default: 1.5).
        b: Document length normalization parameter (default: 0.75).
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.corpus_size: int = 0
        self.avg_doc_len: float = 0.0
        self.doc_lengths: List[int] = []
        self.doc_tokens: List[List[str]] = []
        self.doc_term_freqs: List[Dict[str, int]] = []
        self.df: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}
        self.is_fitted: bool = False

    def fit(self, documents: List[str]) -> BM25Engine:
        """Fit vocabulary, document lengths, and IDF weights on corpus."""
        if not documents:
            raise ValueError("Document list cannot be empty for BM25 fitting.")

        self.corpus_size = len(documents)
        self.doc_tokens = []
        self.doc_lengths = []
        self.doc_term_freqs = []
        self.df = {}

        total_length = 0
        for doc in documents:
            tokens = tokenize_vietnamese_technical(doc)
            self.doc_tokens.append(tokens)
            doc_len = len(tokens)
            self.doc_lengths.append(doc_len)
            total_length += doc_len

            tf: Dict[str, int] = {}
            for t in tokens:
                tf[t] = tf.get(t, 0) + 1
            self.doc_term_freqs.append(tf)

            for t in tf.keys():
                self.df[t] = self.df.get(t, 0) + 1

        self.avg_doc_len = (
            total_length / self.corpus_size if self.corpus_size > 0 else 1.0
        )

        # Calculate standard Okapi BM25 IDF: ln((N - n + 0.5)/(n + 0.5) + 1)
        self.idf = {}
        for term, freq in self.df.items():
            numerator = self.corpus_size - freq + 0.5
            denominator = freq + 0.5
            self.idf[term] = math.log((numerator / denominator) + 1.0)

        self.is_fitted = True
        return self

    def score(self, query: str, doc_idx: int) -> float:
        """Calculate BM25 score for a specific document index given a query."""
        if not self.is_fitted:
            raise RuntimeError("BM25Engine must be fitted before scoring.")
        if doc_idx < 0 or doc_idx >= self.corpus_size:
            raise IndexError(
                f"Doc index {doc_idx} out of range [0, {self.corpus_size})"
            )

        query_tokens = tokenize_vietnamese_technical(query)
        if not query_tokens:
            return 0.0

        score = 0.0
        doc_tf = self.doc_term_freqs[doc_idx]
        doc_len = self.doc_lengths[doc_idx]
        len_norm = 1.0 - self.b + self.b * (doc_len / self.avg_doc_len)

        for term in query_tokens:
            if term not in doc_tf:
                continue
            tf = doc_tf[term]
            idf = self.idf.get(term, 0.0)
            term_score = idf * (tf * (self.k1 + 1.0)) / (tf + self.k1 * len_norm)
            score += term_score

        return score

    def search(
        self,
        query: str,
        top_k: int = 5,
        filter_indices: Optional[List[int]] = None,
    ) -> List[Tuple[int, float]]:
        """Search top_k documents by BM25 score.

        Returns:
            List of (doc_index, raw_score) sorted by score descending.
        """
        if not self.is_fitted:
            raise RuntimeError("BM25Engine must be fitted before search.")

        query_tokens = tokenize_vietnamese_technical(query)
        if not query_tokens:
            return []

        candidate_indices = (
            filter_indices if filter_indices is not None else range(self.corpus_size)
        )
        scores: List[Tuple[int, float]] = []

        for idx in candidate_indices:
            s = self.score(query, idx)
            if s > 0.0:
                scores.append((idx, s))

        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_k]

    def save(self, filepath: Union[str, Path]) -> None:
        """Persist fitted BM25 model to disk."""
        target_path = Path(filepath)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        data = {
            "k1": self.k1,
            "b": self.b,
            "corpus_size": self.corpus_size,
            "avg_doc_len": self.avg_doc_len,
            "doc_lengths": self.doc_lengths,
            "doc_term_freqs": self.doc_term_freqs,
            "df": self.df,
            "idf": self.idf,
            "is_fitted": self.is_fitted,
        }
        with open(target_path, "wb") as f:
            pickle.dump(data, f, protocol=pickle.HIGHEST_PROTOCOL)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> BM25Engine:
        """Load fitted BM25 model from disk."""
        target_path = Path(filepath)
        if not target_path.exists():
            raise FileNotFoundError(f"BM25 artifact not found at {target_path}")

        with open(target_path, "rb") as f:
            data = pickle.load(f)

        engine = cls(k1=data["k1"], b=data["b"])
        engine.corpus_size = data["corpus_size"]
        engine.avg_doc_len = data["avg_doc_len"]
        engine.doc_lengths = data["doc_lengths"]
        engine.doc_term_freqs = data["doc_term_freqs"]
        engine.df = data["df"]
        engine.idf = data["idf"]
        engine.is_fitted = data["is_fitted"]
        return engine
