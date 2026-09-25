"""Hybrid Retriever Engine (Retriever v0.2) for CyberSoft RAG.

Tuần 4 - RAG và AI Tutor (Task 18)
Combines Okapi BM25 lexical search and Dense L2 vector cosine search via
Reciprocal Rank Fusion (RRF) and Weighted Score Fusion, augmented with
second-stage Cross-Context Reranking and complete Citation Metadata Lineage.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable, Dict, List, Literal, Optional, Union


from .bm25 import BM25Engine
from .embeddings import EmbeddingEngine
from .reranker import CrossContextReranker
from .vector_index import VectorIndex


SearchMode = Literal[
    "dense_only", "bm25_only", "hybrid_rrf", "hybrid_weighted", "reranked"
]


class HybridRetriever:
    """Retriever v0.2 combining Lexical BM25, Dense Vector, and Cross-Context Reranking."""

    def __init__(
        self,
        embedding_engine: EmbeddingEngine,
        vector_index: VectorIndex,
        bm25_engine: BM25Engine,
        reranker: Optional[CrossContextReranker] = None,
        rrf_k: int = 60,
        weight_dense: float = 0.5,
        weight_bm25: float = 0.5,
    ):
        self.embedding_engine = embedding_engine
        self.vector_index = vector_index
        self.bm25_engine = bm25_engine
        self.reranker = reranker or CrossContextReranker()
        self.rrf_k = rrf_k
        self.weight_dense = weight_dense
        self.weight_bm25 = weight_bm25

    def _build_filter_fn(
        self,
        category: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> Optional[Callable[[Dict[str, Any]], bool]]:
        """Construct metadata filter predicate."""
        if not category and not document_id:
            return None

        def filter_fn(meta: Dict[str, Any]) -> bool:
            inner = meta.get("metadata", {})
            if category:
                meta_cat = str(
                    meta.get("category") or inner.get("category", "")
                ).lower()
                target_cat = category.strip().lower()
                if target_cat not in meta_cat and meta_cat not in target_cat:
                    return False
            if document_id:
                meta_doc = str(
                    meta.get("document_id") or inner.get("document_id", "")
                ).lower()
                target_doc = document_id.strip().lower()
                if meta_doc != target_doc:
                    return False
            return True

        return filter_fn

    def search(
        self,
        query: str,
        top_k: int = 5,
        mode: SearchMode = "reranked",
        category: Optional[str] = None,
        document_id: Optional[str] = None,
        min_score: Optional[float] = None,
        candidate_pool_size: int = 15,
    ) -> List[Dict[str, Any]]:
        """Perform search using specified mode, optional metadata filter, and citation lineage."""
        filter_fn = self._build_filter_fn(category=category, document_id=document_id)

        # 1. Dense Vector Search
        q_vec = self.embedding_engine.encode(query)
        dense_results = self.vector_index.search(
            query_vector=q_vec,
            top_k=max(top_k, candidate_pool_size),
            filter_fn=filter_fn,
        )

        dense_rank_map: Dict[str, int] = {}
        dense_score_map: Dict[str, float] = {}
        dense_meta_map: Dict[str, Dict[str, Any]] = {}
        for rank, (score, meta) in enumerate(dense_results, 1):
            c_id = meta.get("chunk_id", f"idx_{rank}")
            dense_rank_map[c_id] = rank
            dense_score_map[c_id] = float(score)
            dense_meta_map[c_id] = meta

        # 2. Lexical BM25 Search
        valid_indices = None
        if filter_fn is not None:
            valid_indices = [
                i
                for i, meta in enumerate(self.vector_index.metadata_list)
                if filter_fn(meta)
            ]

        bm25_raw_results = self.bm25_engine.search(
            query=query,
            top_k=max(top_k, candidate_pool_size),
            filter_indices=valid_indices,
        )

        bm25_rank_map: Dict[str, int] = {}
        bm25_score_map: Dict[str, float] = {}
        bm25_meta_map: Dict[str, Dict[str, Any]] = {}
        for rank, (doc_idx, score) in enumerate(bm25_raw_results, 1):
            meta = self.vector_index.metadata_list[doc_idx]
            c_id = meta.get("chunk_id", f"idx_{rank}")
            bm25_rank_map[c_id] = rank
            bm25_score_map[c_id] = float(score)
            bm25_meta_map[c_id] = meta

        # Mode: dense_only
        if mode == "dense_only":
            return self._format_results(
                ordered_chunk_ids=list(dense_rank_map.keys())[:top_k],
                dense_rank_map=dense_rank_map,
                dense_score_map=dense_score_map,
                bm25_rank_map=bm25_rank_map,
                bm25_score_map=bm25_score_map,
                meta_sources=[dense_meta_map, bm25_meta_map],
                score_key="dense_score",
                min_score=min_score,
            )

        # Mode: bm25_only
        if mode == "bm25_only":
            return self._format_results(
                ordered_chunk_ids=list(bm25_rank_map.keys())[:top_k],
                dense_rank_map=dense_rank_map,
                dense_score_map=dense_score_map,
                bm25_rank_map=bm25_rank_map,
                bm25_score_map=bm25_score_map,
                meta_sources=[bm25_meta_map, dense_meta_map],
                score_key="bm25_score",
                min_score=min_score,
            )

        # Mode: hybrid_weighted (Linear Min-Max Normalization)
        if mode == "hybrid_weighted":
            all_cids = set(dense_score_map.keys()).union(set(bm25_score_map.keys()))
            max_d = max(dense_score_map.values()) if dense_score_map else 1.0
            max_b = max(bm25_score_map.values()) if bm25_score_map else 1.0
            weighted_scores: Dict[str, float] = {}

            for c_id in all_cids:
                norm_d = (dense_score_map.get(c_id, 0.0) / max_d) if max_d > 0 else 0.0
                norm_b = (bm25_score_map.get(c_id, 0.0) / max_b) if max_b > 0 else 0.0
                weighted_scores[c_id] = (
                    self.weight_dense * norm_d + self.weight_bm25 * norm_b
                )

            sorted_cids = sorted(
                all_cids, key=lambda c: weighted_scores.get(c, 0.0), reverse=True
            )
            return self._format_results(
                ordered_chunk_ids=sorted_cids[:top_k],
                dense_rank_map=dense_rank_map,
                dense_score_map=dense_score_map,
                bm25_rank_map=bm25_rank_map,
                bm25_score_map=bm25_score_map,
                meta_sources=[dense_meta_map, bm25_meta_map],
                custom_score_map=weighted_scores,
                score_key="weighted_score",
                min_score=min_score,
            )

        # Modes: hybrid_rrf or reranked
        # 3. Reciprocal Rank Fusion (RRF)
        all_candidates = set(dense_rank_map.keys()).union(set(bm25_rank_map.keys()))
        rrf_scores: Dict[str, float] = {}

        for c_id in all_candidates:
            score = 0.0
            if c_id in dense_rank_map:
                score += self.weight_dense / (self.rrf_k + dense_rank_map[c_id])
            if c_id in bm25_rank_map:
                score += self.weight_bm25 / (self.rrf_k + bm25_rank_map[c_id])
            rrf_scores[c_id] = score

        sorted_by_rrf = sorted(
            all_candidates, key=lambda c: rrf_scores.get(c, 0.0), reverse=True
        )

        if mode == "hybrid_rrf":
            return self._format_results(
                ordered_chunk_ids=sorted_by_rrf[:top_k],
                dense_rank_map=dense_rank_map,
                dense_score_map=dense_score_map,
                bm25_rank_map=bm25_rank_map,
                bm25_score_map=bm25_score_map,
                meta_sources=[dense_meta_map, bm25_meta_map],
                custom_score_map=rrf_scores,
                score_key="rrf_score",
                min_score=min_score,
            )

        # Mode: reranked (Hybrid RRF Top Candidates -> CrossContextReranker)
        pool_cids = sorted_by_rrf[:candidate_pool_size]
        candidate_dicts = []
        for c_id in pool_cids:
            meta = dense_meta_map.get(c_id) or bm25_meta_map.get(c_id)
            if not meta:
                meta_idx = self.vector_index.chunk_id_to_idx.get(c_id)
                if meta_idx is not None:
                    meta = self.vector_index.metadata_list[meta_idx]
            if not meta:
                continue

            candidate_dicts.append(
                {
                    "chunk_id": c_id,
                    "metadata": meta,
                    "dense_score": dense_score_map.get(c_id, 0.0),
                    "dense_rank": dense_rank_map.get(c_id, 999),
                    "bm25_score": bm25_score_map.get(c_id, 0.0),
                    "bm25_rank": bm25_rank_map.get(c_id, 999),
                    "rrf_score": rrf_scores.get(c_id, 0.0),
                }
            )

        reranked_pool = self.reranker.rerank(
            query=query, candidates=candidate_dicts, top_k=top_k
        )

        results = []
        for item in reranked_pool:
            if min_score is not None and item.get("final_score", 0.0) < min_score:
                continue

            meta = item["metadata"]
            citation = self._create_citation(meta)
            results.append(
                {
                    "chunk_id": item["chunk_id"],
                    "rank": item["rerank_rank"],
                    "score": item["final_score"],
                    "rerank_score": item["final_score"],
                    "rrf_score": round(item["rrf_score"], 6),
                    "dense_score": round(item["dense_score"], 4),
                    "bm25_score": round(item["bm25_score"], 4),
                    "dense_rank": item["dense_rank"],
                    "bm25_rank": item["bm25_rank"],
                    "feature_breakdown": {
                        "coverage": item.get("feature_coverage", 0.0),
                        "title_match": item.get("feature_title_match", 0.0),
                        "proximity": item.get("feature_proximity", 0.0),
                        "semantic": item.get("feature_semantic", 0.0),
                    },
                    "citation": citation,
                }
            )

        return results

    def _create_citation(self, meta: Dict[str, Any]) -> Dict[str, Any]:
        """Construct standardized Citation Lineage object."""
        inner = meta.get("metadata", {})
        body_text = meta.get("text", "")
        snippet = body_text[:250].strip() + ("..." if len(body_text) > 250 else "")
        return {
            "document_id": meta.get("document_id")
            or inner.get("document_id", "UNKNOWN"),
            "section_id": meta.get("section_id") or inner.get("section_id", "UNKNOWN"),
            "title": meta.get("title") or inner.get("title", "Untitled Section"),
            "breadcrumbs": meta.get("breadcrumbs") or inner.get("breadcrumbs", ""),
            "category": meta.get("category") or inner.get("category", "General"),
            "file_path": meta.get("file_path") or inner.get("file_path", ""),
            "char_start": meta.get("char_start", 0),
            "char_end": meta.get("char_end", len(body_text)),
            "content_snippet": snippet,
        }

    def _format_results(
        self,
        ordered_chunk_ids: List[str],
        dense_rank_map: Dict[str, int],
        dense_score_map: Dict[str, float],
        bm25_rank_map: Dict[str, int],
        bm25_score_map: Dict[str, float],
        meta_sources: List[Dict[str, Dict[str, Any]]],
        custom_score_map: Optional[Dict[str, float]] = None,
        score_key: str = "score",
        min_score: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Format uniform search results list."""
        results = []
        rank_counter = 1

        for c_id in ordered_chunk_ids:
            score = (
                custom_score_map.get(c_id, 0.0)
                if custom_score_map is not None
                else (dense_score_map.get(c_id) or bm25_score_map.get(c_id, 0.0))
            )
            if min_score is not None and score < min_score:
                continue

            meta = None
            for src in meta_sources:
                if c_id in src:
                    meta = src[c_id]
                    break
            if not meta:
                idx = self.vector_index.chunk_id_to_idx.get(c_id)
                if idx is not None:
                    meta = self.vector_index.metadata_list[idx]
            if not meta:
                continue

            citation = self._create_citation(meta)
            res_item = {
                "chunk_id": c_id,
                "rank": rank_counter,
                "score": round(float(score), 6),
                "dense_score": round(dense_score_map.get(c_id, 0.0), 4),
                "bm25_score": round(bm25_score_map.get(c_id, 0.0), 4),
                "dense_rank": dense_rank_map.get(c_id, 999),
                "bm25_rank": bm25_rank_map.get(c_id, 999),
                "citation": citation,
            }
            results.append(res_item)
            rank_counter += 1

        return results

    @classmethod
    def from_artifacts(cls, indexes_dir: Union[str, Path]) -> HybridRetriever:
        """Load fully persistent HybridRetriever from saved artifacts directory."""
        idx_dir = Path(indexes_dir)
        vec_path = idx_dir / "vector_index.npz"
        emb_path = idx_dir / "embedding_model.pkl"
        bm25_path = idx_dir / "bm25_model.pkl"

        if not vec_path.exists():
            raise FileNotFoundError(f"Missing vector index artifact: {vec_path}")
        if not emb_path.exists():
            raise FileNotFoundError(f"Missing embedding model artifact: {emb_path}")
        if not bm25_path.exists():
            raise FileNotFoundError(f"Missing BM25 model artifact: {bm25_path}")

        vector_index = VectorIndex.load(vec_path)
        embedding_engine = EmbeddingEngine.load(emb_path)
        bm25_engine = BM25Engine.load(bm25_path)
        reranker = CrossContextReranker()

        return cls(
            embedding_engine=embedding_engine,
            vector_index=vector_index,
            bm25_engine=bm25_engine,
            reranker=reranker,
        )
