"""Build Vector Index Artifacts from Task 16 Chunks.

Usage:
    python build_index.py [--chunks-file PATH] [--output-dir DIR] [--dimension INT]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
import time

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure parent directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.embeddings import EmbeddingEngine  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


def main():
    parser = argparse.ArgumentParser(
        description="Build CyberSoft Vector Index Artifacts"
    )
    parser.add_argument(
        "--chunks-file",
        type=str,
        default=str(
            BASE_DIR.parent
            / "BaoCao_Task16"
            / "output"
            / "chunks_markdown_header_semantic.jsonl"
        ),
        help="Path to JSONL chunks file from Task 16",
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
    print("  CYBERSOFT VECTOR INDEX BUILDER — TASK 17 BASELINE")
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

    # Extract corpus texts for fitting with semantic enrichment (title + breadcrumbs + text)
    texts = [
        f"{c.get('metadata', {}).get('title', '')} {c.get('metadata', {}).get('breadcrumbs', '')} {c['text']}"
        for c in chunks
    ]

    print(
        f"[*] Initializing and fitting Embedding Engine (dimension={args.dimension})..."
    )
    start_t = time.perf_counter()
    engine = EmbeddingEngine(dimension=args.dimension)
    engine.fit(texts)
    fit_time = time.perf_counter() - start_t
    print(
        f"[+] Embedding Engine fitted in {fit_time:.3f}s (actual dim={engine.dimension})."
    )

    print("[*] Encoding all corpus chunks into L2-normalized float32 vectors...")
    start_t = time.perf_counter()
    vectors = engine.encode(texts)
    encode_time = time.perf_counter() - start_t
    print(
        f"[+] Encoded {len(vectors)} vectors in {encode_time:.3f}s (shape={vectors.shape})."
    )

    print("[*] Populating Vector Index...")
    index = VectorIndex(dimension=engine.dimension)
    index.add(vectors=vectors, metadatas=chunks)
    print(f"[+] Index populated: {len(index)} records stored.")

    # Save artifacts
    model_path = output_dir / "embedding_model.pkl"
    index_path = output_dir / "vector_index.npz"
    manifest_path = output_dir / "index_manifest.json"

    print("[*] Serializing artifacts to disk...")
    engine.save(model_path)
    manifest = index.save(
        artifact_path=index_path,
        manifest_path=manifest_path,
        model_name="TFIDF-SVD-L2",
    )

    print("\n[+] Build Completed Successfully!")
    print(f"    - Model Artifact:   {model_path}")
    print(f"    - Index Artifact:   {index_path} ({manifest['file_size_bytes']} bytes)")
    print(f"    - Index Manifest:   {manifest_path}")
    print(f"    - SHA-256 Checksum: {manifest['sha256_checksum']}")
    print(f"    - Total Vectors:    {manifest['total_vectors']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
