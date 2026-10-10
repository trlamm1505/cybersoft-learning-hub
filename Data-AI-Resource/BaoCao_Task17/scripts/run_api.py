"""CLI Launcher for CyberSoft RAG Search REST API.

Usage:
    python run_api.py [--host 127.0.0.1] [--port 8000] [--reload]
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure parent directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import uvicorn  # noqa: E402
from src.api import create_app  # noqa: E402
from src.embeddings import EmbeddingEngine  # noqa: E402
from src.retriever import BaselineRetriever  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


def build_configured_app():
    indexes_dir = BASE_DIR / "indexes"
    model_path = indexes_dir / "embedding_model.pkl"
    index_path = indexes_dir / "vector_index.npz"

    if not model_path.exists() or not index_path.exists():
        raise FileNotFoundError(
            f"Index artifacts missing in {indexes_dir}. Run build_index.py first."
        )

    engine = EmbeddingEngine.load(model_path)
    index = VectorIndex.load(index_path)
    retriever = BaselineRetriever(embedding_engine=engine, vector_index=index)
    return create_app(retriever=retriever)


def main():
    parser = argparse.ArgumentParser(description="Launch CyberSoft RAG Search API")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    args = parser.parse_args()

    print("===========================================================================")
    print("  CYBERSOFT RAG SEARCH REST API — TASK 17")
    print("===========================================================================")
    print(f"[*] Starting API Server on http://{args.host}:{args.port}")
    print("    - Docs: http://127.0.0.1:8000/docs")
    print("    - Search: POST /api/v1/search")
    print("    - Health: GET  /api/v1/health")
    print("    - Stats:  GET  /api/v1/stats")

    app = build_configured_app()
    uvicorn.run(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    sys.exit(main())
