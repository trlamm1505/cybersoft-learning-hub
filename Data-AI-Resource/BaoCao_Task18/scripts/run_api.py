"""CLI Launcher for CyberSoft RAG Hybrid Search & Reranking REST API.

Tuần 4 - RAG và AI Tutor (Task 18)
Usage:
    python scripts/run_api.py [--host 127.0.0.1] [--port 8000]
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

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import uvicorn  # noqa: E402
from src.api import create_app  # noqa: E402
from src.hybrid_retriever import HybridRetriever  # noqa: E402


def build_configured_app():
    indexes_dir = BASE_DIR / "indexes"
    if not (indexes_dir / "vector_index.npz").exists():
        raise FileNotFoundError(
            f"Index artifacts missing in {indexes_dir}. Run build_indexes.py first."
        )

    retriever = HybridRetriever.from_artifacts(indexes_dir)
    return create_app(retriever=retriever)


def main():
    parser = argparse.ArgumentParser(
        description="Launch CyberSoft RAG Hybrid Search API"
    )
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    args = parser.parse_args()

    print("===========================================================================")
    print("  CYBERSOFT RAG HYBRID SEARCH REST API — TASK 18 (RETRIEVER v0.2)")
    print("===========================================================================")
    print(f"[*] Starting API Server on http://{args.host}:{args.port}")
    print(f"    - Swagger Docs: http://{args.host}:{args.port}/docs")
    print(f"    - Search API:   POST http://{args.host}:{args.port}/api/v1/search")
    print(f"    - Health Check: GET  http://{args.host}:{args.port}/api/v1/health")

    app = build_configured_app()
    uvicorn.run(app, host=args.host, port=args.port)
    return 0


if __name__ == "__main__":
    sys.exit(main())
