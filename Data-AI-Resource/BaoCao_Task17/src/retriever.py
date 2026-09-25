"""Retriever Engine for CyberSoft RAG Baseline.

Tuần 4 - RAG và AI Tutor (Task 17)
Provides semantic query retrieval with Top-K scoring, metadata filtering,
and complete Citation metadata extraction for RAG grounding.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional

from .embeddings import EmbeddingEngine
from .vector_index import VectorIndex


@dataclass
class Citation:
    """Provenance and lineage citation metadata for retrieved chunks."""

    document_id: str
    section_id: str
    title: str
    breadcrumbs: str
    file_path: str
    char_start: int
    char_end: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class SearchResult:
    """Individual search match with relevance score and citation."""

    chunk_id: str
    document_id: str
    score: float
    text: str
    citation: Citation
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        res = asdict(self)
        res["score"] = round(self.score, 4)
        return res


class BaselineRetriever:
    """Semantic Retriever combining Embedding Engine and Vector Index."""

    def __init__(self, embedding_engine: EmbeddingEngine, vector_index: VectorIndex):
        self.embedding_engine = embedding_engine
        self.vector_index = vector_index

    def search(
        self,
        query: str,
        top_k: int = 5,
        category: Optional[str] = None,
        document_id: Optional[str] = None,
        min_score: float = 0.0,
    ) -> List[SearchResult]:
        """Search Top-K chunks semantically matching the query.

        Args:
            query: Input user query in Vietnamese or English.
            top_k: Maximum number of chunks to return.
            category: Optional metadata category filter (e.g., 'Curriculum', 'Policy').
            document_id: Optional document ID filter (e.g., 'CS-POL-001').
            min_score: Minimum cosine similarity score threshold (0.0 to 1.0).

        Returns:
            List of SearchResult objects sorted by descending similarity score.
        """
        if not query or not query.strip():
            return []

        # Encode query to normalized float32 vector
        q_vec = self.embedding_engine.encode(query.strip())

        # Construct metadata filtering predicate if requested
        filter_fn = None
        if category or document_id:

            def filter_predicate(meta: Dict[str, Any]) -> bool:
                if category and meta.get("metadata", {}).get("category") != category:
                    return False
                if document_id and meta.get("document_id") != document_id:
                    return False
                return True

            filter_fn = filter_predicate

        # Execute search in vector index
        raw_results = self.vector_index.search(
            query_vector=q_vec,
            top_k=top_k,
            filter_fn=filter_fn,
            min_score=min_score,
        )

        formatted_results: List[SearchResult] = []
        for score, meta in raw_results:
            inner_meta = meta.get("metadata", {})
            citation = Citation(
                document_id=meta.get("document_id", "UNKNOWN"),
                section_id=meta.get("section_id", "UNKNOWN"),
                title=inner_meta.get("title", ""),
                breadcrumbs=inner_meta.get("breadcrumbs", ""),
                file_path=inner_meta.get("file_path", ""),
                char_start=meta.get("char_start", 0),
                char_end=meta.get("char_end", 0),
            )
            result = SearchResult(
                chunk_id=meta.get("chunk_id", ""),
                document_id=meta.get("document_id", ""),
                score=score,
                text=meta.get("text", ""),
                citation=citation,
                metadata=inner_meta,
            )
            formatted_results.append(result)

        return formatted_results

    def batch_search(
        self,
        queries: List[str],
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[List[SearchResult]]:
        """Perform batch similarity search for a list of queries."""
        return [self.search(q, top_k=top_k, min_score=min_score) for q in queries]
