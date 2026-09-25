"""Vector Index Engine for CyberSoft RAG Hybrid Search.

Tuần 4 - RAG và AI Tutor (Task 18)
Provides vector indexing, Cosine / Inner Product similarity calculation,
metadata filtering, and persistent artifact serialization (.npz + manifest).
"""

from __future__ import annotations

from datetime import datetime
import hashlib
import json
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple, Union

import numpy as np


class VectorIndex:
    """In-memory Vector Index with serialization and metadata query filtering."""

    def __init__(self, dimension: int = 64):
        self.dimension = dimension
        self.vectors: np.ndarray = np.empty((0, dimension), dtype=np.float32)
        self.metadata_list: List[Dict[str, Any]] = []
        self.chunk_id_to_idx: Dict[str, int] = {}

    def __len__(self) -> int:
        return len(self.metadata_list)

    def add(self, vectors: np.ndarray, metadatas: List[Dict[str, Any]]) -> None:
        """Add vectors and their associated metadata records to the index."""
        if len(vectors) != len(metadatas):
            raise ValueError(
                f"Vectors count ({len(vectors)}) must match metadata count ({len(metadatas)})."
            )
        if len(vectors) == 0:
            return

        if vectors.ndim != 2 or vectors.shape[1] != self.dimension:
            raise ValueError(
                f"Vectors shape must be (N, {self.dimension}), got {vectors.shape}."
            )

        start_idx = len(self.metadata_list)
        if self.vectors.shape[0] == 0:
            self.vectors = vectors.astype(np.float32)
        else:
            self.vectors = np.vstack([self.vectors, vectors.astype(np.float32)])

        for offset, meta in enumerate(metadatas):
            idx = start_idx + offset
            self.metadata_list.append(meta)
            chunk_id = meta.get("chunk_id")
            if chunk_id:
                self.chunk_id_to_idx[chunk_id] = idx

    def compute_scores(self, query_vector: np.ndarray) -> np.ndarray:
        """Compute cosine similarity dot products for all documents in index."""
        if len(self.metadata_list) == 0:
            return np.empty((0,), dtype=np.float32)

        q_flat = query_vector.reshape(-1).astype(np.float32)
        if q_flat.shape[0] != self.dimension:
            raise ValueError(
                f"Query vector dimension ({q_flat.shape[0]}) does not match index dimension ({self.dimension})."
            )
        return np.dot(self.vectors, q_flat)

    def search(
        self,
        query_vector: np.ndarray,
        top_k: int = 5,
        filter_fn: Optional[Callable[[Dict[str, Any]], bool]] = None,
        min_score: float = -1.0,
    ) -> List[Tuple[float, Dict[str, Any]]]:
        """Perform similarity search using dot product (Cosine Similarity on L2-normalized vectors).

        Returns:
            List of (score, metadata) tuples sorted in descending order of score.
        """
        if len(self.metadata_list) == 0:
            return []

        scores = self.compute_scores(query_vector)

        if filter_fn is not None:
            valid_indices = [
                i for i, meta in enumerate(self.metadata_list) if filter_fn(meta)
            ]
            if not valid_indices:
                return []
            candidate_scores = scores[valid_indices]
            sorted_local_indices = np.argsort(-candidate_scores)
            results: List[Tuple[float, Dict[str, Any]]] = []
            for local_idx in sorted_local_indices:
                score = float(candidate_scores[local_idx])
                if score < min_score:
                    continue
                orig_idx = valid_indices[local_idx]
                results.append((score, self.metadata_list[orig_idx]))
                if len(results) >= top_k:
                    break
            return results

        sorted_indices = np.argsort(-scores)
        results = []
        for idx in sorted_indices:
            score = float(scores[idx])
            if score < min_score:
                continue
            results.append((score, self.metadata_list[idx]))
            if len(results) >= top_k:
                break

        return results

    def save(
        self,
        artifact_path: Union[str, Path],
        manifest_path: Optional[Union[str, Path]] = None,
        model_name: str = "TFIDF-SVD-L2",
    ) -> Dict[str, Any]:
        """Serialize index vectors and metadata into compressed .npz archive and manifest."""
        target_path = Path(artifact_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        meta_json_str = json.dumps(self.metadata_list, ensure_ascii=False)
        np.savez_compressed(
            target_path,
            vectors=self.vectors,
            metadata=np.array([meta_json_str], dtype=object),
            dimension=np.array([self.dimension], dtype=np.int32),
        )

        hasher = hashlib.sha256()
        with open(target_path, "rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        sha256_checksum = hasher.hexdigest()

        manifest = {
            "artifact_file": target_path.name,
            "dimension": self.dimension,
            "total_vectors": len(self.metadata_list),
            "model_name": model_name,
            "file_size_bytes": target_path.stat().st_size,
            "sha256_checksum": sha256_checksum,
            "created_at": datetime.now().isoformat(),
        }

        if manifest_path:
            m_path = Path(manifest_path)
            m_path.parent.mkdir(parents=True, exist_ok=True)
            with open(m_path, "w", encoding="utf-8") as f:
                json.dump(manifest, f, indent=2, ensure_ascii=False)

        return manifest

    @classmethod
    def load(cls, artifact_path: Union[str, Path]) -> VectorIndex:
        """Load vector index artifact from .npz compressed archive."""
        src_path = Path(artifact_path)
        if not src_path.exists():
            raise FileNotFoundError(f"Vector index artifact not found at {src_path}")

        with np.load(src_path, allow_pickle=True) as data:
            vectors = data["vectors"]
            dimension = int(data["dimension"][0])
            meta_json_str = str(data["metadata"][0])
            metadata_list = json.loads(meta_json_str)

        index = cls(dimension=dimension)
        index.vectors = vectors
        index.metadata_list = metadata_list
        index.chunk_id_to_idx = {
            meta["chunk_id"]: i
            for i, meta in enumerate(metadata_list)
            if "chunk_id" in meta
        }
        return index
