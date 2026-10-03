"""Cross-Context Semantic Reranker for CyberSoft RAG.

Tuần 4 - RAG và AI Tutor (Task 18)
Performs second-stage candidate re-ranking using query-document cross features:
token coverage, title/breadcrumb alignment, sequential phrase proximity,
and dense semantic alignment.
"""

from __future__ import annotations

from typing import Any, Dict, List

from .bm25 import tokenize_vietnamese_technical


class CrossContextReranker:
    """Second-stage Cross-Context Reranker for candidate documents.

    Reranks Top-M candidates from first-stage hybrid retrieval with deep
    cross-feature interaction to optimize NDCG@5, MRR, and Recall@1.
    """

    def __init__(
        self,
        weight_coverage: float = 0.30,
        weight_title_match: float = 0.25,
        weight_phrase_proximity: float = 0.20,
        weight_semantic_sim: float = 0.25,
    ):
        self.w_cov = weight_coverage
        self.w_title = weight_title_match
        self.w_prox = weight_phrase_proximity
        self.w_sem = weight_semantic_sim

    def _compute_coverage(self, query_tokens: List[str], doc_tokens_set: set) -> float:
        """Fraction of unique query tokens found in document."""
        if not query_tokens:
            return 0.0
        unique_q = set(query_tokens)
        matched = unique_q.intersection(doc_tokens_set)
        return len(matched) / len(unique_q)

    def _compute_title_match(
        self, query_tokens: List[str], metadata: Dict[str, Any]
    ) -> float:
        """Score based on query token matches within title and breadcrumbs."""
        if not query_tokens:
            return 0.0

        inner = metadata.get("metadata", {})
        title = metadata.get("title") or inner.get("title", "")
        breadcrumbs = metadata.get("breadcrumbs") or inner.get("breadcrumbs", "")
        heading = metadata.get("heading_hierarchy") or ""
        if isinstance(heading, list):
            heading = " > ".join(heading)

        title_text = f"{title} {breadcrumbs} {heading}".lower()
        title_tokens = set(tokenize_vietnamese_technical(title_text))
        if not title_tokens:
            return 0.0

        unique_q = set(query_tokens)
        matched = unique_q.intersection(title_tokens)
        return len(matched) / len(unique_q)

    def _compute_phrase_proximity(
        self, query_tokens: List[str], doc_text: str
    ) -> float:
        """Score bonus for multi-token phrase co-occurrence and bigram preservation."""
        if len(query_tokens) < 2:
            return 0.0

        doc_lower = doc_text.lower()
        total_bigrams = len(query_tokens) - 1
        matched_bigrams = 0

        for i in range(total_bigrams):
            phrase = f"{query_tokens[i]} {query_tokens[i+1]}"
            if phrase in doc_lower:
                matched_bigrams += 1

        return matched_bigrams / total_bigrams if total_bigrams > 0 else 0.0

    def score_candidate(
        self,
        query: str,
        metadata: Dict[str, Any],
        initial_dense_score: float = 0.0,
    ) -> Dict[str, Any]:
        """Compute full cross-feature score for a single candidate."""
        q_tokens = tokenize_vietnamese_technical(query)
        doc_text = metadata.get("text", "")
        doc_tokens = set(tokenize_vietnamese_technical(doc_text))

        coverage_score = self._compute_coverage(q_tokens, doc_tokens)
        title_score = self._compute_title_match(q_tokens, metadata)
        proximity_score = self._compute_phrase_proximity(q_tokens, doc_text)
        semantic_score = max(0.0, min(1.0, float(initial_dense_score)))

        final_score = (
            self.w_cov * coverage_score
            + self.w_title * title_score
            + self.w_prox * proximity_score
            + self.w_sem * semantic_score
        )

        return {
            "rerank_score": round(float(final_score), 4),
            "feature_coverage": round(float(coverage_score), 4),
            "feature_title_match": round(float(title_score), 4),
            "feature_proximity": round(float(proximity_score), 4),
            "feature_semantic": round(float(semantic_score), 4),
        }

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Rerank a list of candidates returned by first-stage retrieval."""
        if not candidates:
            return []

        scored_candidates = []
        for cand in candidates:
            meta = cand.get("metadata", cand)
            initial_score = cand.get("dense_score", cand.get("score", 0.0))
            features = self.score_candidate(query, meta, initial_score)

            merged = dict(cand)
            merged.update(features)
            merged["final_score"] = features["rerank_score"]
            scored_candidates.append(merged)

        # Sort descending by final rerank score
        scored_candidates.sort(key=lambda x: x["final_score"], reverse=True)

        for rank, item in enumerate(scored_candidates[:top_k], 1):
            item["rerank_rank"] = rank

        return scored_candidates[:top_k]
