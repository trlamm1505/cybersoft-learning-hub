"""Build Vector and BM25 Index Artifacts from Chunks.

Tuần 4 - RAG và AI Tutor (Task 18)
Usage:
    python scripts/build_indexes.py [--chunks-file PATH] [--output-dir DIR]
"""

from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
from pathlib import Path
import sys
import time

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.bm25 import BM25Engine  # noqa: E402
from src.embeddings import EmbeddingEngine  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def main():
    parser = argparse.ArgumentParser(
        description="Build CyberSoft Vector and BM25 Indexes"
    )
    parser.add_argument(
        "--chunks-file",
        type=str,
        default=str(BASE_DIR / "data" / "chunks_markdown_header_semantic.jsonl"),
        help="Path to JSONL chunks file",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(BASE_DIR / "indexes"),
        help="Output directory for index artifacts",
    )
    parser.add_argument(
        "--dimension",
        type=int,
        default=64,
        help="Embedding vector dimension",
    )
    args = parser.parse_args()

    chunks_path = Path(args.chunks_file)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("===========================================================================")
    print("  CYBERSOFT DUAL INDEX BUILDER — TASK 18 (VECTOR + BM25)")
    print("===========================================================================")
    print(f"[*] Loading chunks from: {chunks_path}")

    if not chunks_path.exists():
        print(f"[!] Error: Chunks file not found at {chunks_path}")
        return 1

    chunks = []
    with open(chunks_path, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                chunks.append(json.loads(line))

    print(f"[+] Successfully loaded {len(chunks)} chunks.")
    if len(chunks) == 0:
        print("[!] Error: No chunks found in input file.")
        return 1

    # Enrich texts with title + breadcrumbs + text
    enriched_texts = []
    for c in chunks:
        inner = c.get("metadata", {})
        title = c.get("title") or inner.get("title", "")
        breadcrumbs = c.get("breadcrumbs") or inner.get("breadcrumbs", "")
        heading = c.get("heading_hierarchy") or ""
        if isinstance(heading, list):
            heading = " > ".join(heading)
        text = c.get("text", "")
        enriched_texts.append(f"{title} {breadcrumbs} {heading} {text}")

    # 1. Build Dense Vector Index
    print(f"[*] Fitting Embedding Engine (dimension={args.dimension})...")
    t0 = time.perf_counter()
    embedding_engine = EmbeddingEngine(dimension=args.dimension)
    embedding_engine.fit(enriched_texts)
    fit_t = time.perf_counter() - t0
    print(
        f"[+] Embedding Engine fitted in {fit_t:.3f}s (actual dim={embedding_engine.dimension})."
    )

    print("[*] Encoding chunks into L2-normalized float32 vectors...")
    t0 = time.perf_counter()
    vectors = embedding_engine.encode(enriched_texts)
    enc_t = time.perf_counter() - t0
    print(
        f"[+] Encoded {len(vectors)} vectors in {enc_t:.3f}s (shape={vectors.shape})."
    )

    vector_index = VectorIndex(dimension=embedding_engine.dimension)
    vector_index.add(vectors=vectors, metadatas=chunks)
    print(f"[+] Vector Index populated: {len(vector_index)} records.")

    # 2. Build BM25 Index
    print("[*] Fitting BM25 Lexical Engine...")
    t0 = time.perf_counter()
    bm25_engine = BM25Engine(k1=1.5, b=0.75)
    bm25_engine.fit(enriched_texts)
    bm25_t = time.perf_counter() - t0
    print(
        f"[+] BM25 Engine fitted in {bm25_t:.3f}s (vocab={len(bm25_engine.df)} terms, avgdl={bm25_engine.avg_doc_len:.1f})."
    )

    # 3. Save All Artifacts
    print("[*] Persisting artifacts...")
    emb_model_path = output_dir / "embedding_model.pkl"
    vec_index_path = output_dir / "vector_index.npz"
    bm25_model_path = output_dir / "bm25_model.pkl"
    manifest_path = output_dir / "index_manifest.json"

    embedding_engine.save(emb_model_path)
    bm25_engine.save(bm25_model_path)
    vector_index.save(artifact_path=vec_index_path)

    # Build comprehensive manifest
    manifest = {
        "timestamp": datetime.now().isoformat(),
        "task": "Task 18 - Hybrid Search and Reranking",
        "total_chunks": len(chunks),
        "artifacts": {
            "vector_index": {
                "file": vec_index_path.name,
                "size_bytes": vec_index_path.stat().st_size,
                "sha256": compute_sha256(vec_index_path),
                "dimension": embedding_engine.dimension,
            },
            "embedding_model": {
                "file": emb_model_path.name,
                "size_bytes": emb_model_path.stat().st_size,
                "sha256": compute_sha256(emb_model_path),
            },
            "bm25_model": {
                "file": bm25_model_path.name,
                "size_bytes": bm25_model_path.stat().st_size,
                "sha256": compute_sha256(bm25_model_path),
                "k1": bm25_engine.k1,
                "b": bm25_engine.b,
                "vocab_size": len(bm25_engine.df),
            },
        },
    }

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print("\n[+] Build Completed Successfully!")
    print(
        f"    - Vector Index:   {vec_index_path} ({manifest['artifacts']['vector_index']['size_bytes']} bytes)"
    )
    print(
        f"    - Embedding Model:{emb_model_path} ({manifest['artifacts']['embedding_model']['size_bytes']} bytes)"
    )
    print(
        f"    - BM25 Model:     {bm25_model_path} ({manifest['artifacts']['bm25_model']['size_bytes']} bytes)"
    )
    print(f"    - Manifest:       {manifest_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
