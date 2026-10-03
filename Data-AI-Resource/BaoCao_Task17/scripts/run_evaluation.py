"""Run Retrieval Baseline Evaluation and Benchmark.

Usage:
    python run_evaluation.py [--queries-file PATH] [--split all|test|train] [--top-k INT]
"""

from __future__ import annotations

import argparse
import json
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

from src.embeddings import EmbeddingEngine  # noqa: E402
from src.evaluator import RetrievalEvaluator  # noqa: E402
from src.retriever import BaselineRetriever  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


def main():
    parser = argparse.ArgumentParser(
        description="Run Information Retrieval Evaluation for CyberSoft RAG Baseline"
    )
    parser.add_argument(
        "--queries-file",
        type=str,
        default=str(BASE_DIR / "data" / "eval" / "retrieval_eval_queries.json"),
        help="Path to evaluation queries JSON file",
    )
    parser.add_argument(
        "--indexes-dir",
        type=str,
        default=str(BASE_DIR / "indexes"),
        help="Directory containing vector index artifacts",
    )
    parser.add_argument(
        "--reports-dir",
        type=str,
        default=str(BASE_DIR / "reports"),
        help="Directory to output reports",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="test",
        choices=["all", "test", "train"],
        help="Evaluation split to benchmark",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Top-K candidates to evaluate",
    )
    args = parser.parse_args()

    indexes_dir = Path(args.indexes_dir)
    reports_dir = Path(args.reports_dir)
    queries_file = Path(args.queries_file)
    reports_dir.mkdir(parents=True, exist_ok=True)

    print("===========================================================================")
    print("  CYBERSOFT RETRIEVAL BASELINE EVALUATOR — TASK 17 BENCHMARK")
    print("===========================================================================")
    print(f"[*] Indexes directory: {indexes_dir}")
    print(f"[*] Evaluation split:  {args.split} (Top-K={args.top_k})")

    model_path = indexes_dir / "embedding_model.pkl"
    index_path = indexes_dir / "vector_index.npz"

    if not model_path.exists() or not index_path.exists():
        print("[!] Error: Index artifacts missing. Run build_index.py first.")
        return 1

    # Load model and index
    print("[*] Loading embedding model and vector index...")
    engine = EmbeddingEngine.load(model_path)
    index = VectorIndex.load(index_path)
    retriever = BaselineRetriever(embedding_engine=engine, vector_index=index)
    evaluator = RetrievalEvaluator(retriever=retriever)
    print(f"[+] Loaded index with {len(index)} vectors, dimension={index.dimension}.")

    # Load evaluation queries
    with open(queries_file, "r", encoding="utf-8") as f:
        all_queries = json.load(f)

    split_filter = None if args.split == "all" else args.split
    print(f"[*] Running IR evaluation on '{args.split}' set...")
    metrics = evaluator.evaluate_queries(
        queries=all_queries,
        top_k=args.top_k,
        split_filter=split_filter,
    )

    # Save reports
    json_path = reports_dir / "retrieval_baseline_metrics.json"
    md_path = reports_dir / "retrieval_baseline_report.md"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

    evaluator.generate_markdown_report(metrics=metrics, output_file=md_path)

    m = metrics["metrics"]
    lat = metrics["latency_ms"]

    print("\n[+] Benchmark Evaluation Completed Successfully!")
    print(f"    - Total Queries:   {metrics['total_queries']}")
    print(f"    - Recall@1:        {m['recall_at_1'] * 100:.2f}%")
    print(f"    - Recall@3:        {m['recall_at_3'] * 100:.2f}%")
    print(
        f"    - Recall@5:        {m['recall_at_5'] * 100:.2f}%  <-- Core Acceptance DoD"
    )
    print(f"    - Doc-Recall@5:    {m['doc_recall_at_5'] * 100:.2f}%")
    print(f"    - MRR:             {m['mrr']:.4f}")
    print(f"    - Latency (p50):   {lat['p50']} ms")
    print(f"    - Latency (p95):   {lat['p95']} ms")
    print(f"    - Failures:        {metrics['failures_count']} queries")
    print(f"    - Metrics JSON:    {json_path}")
    print(f"    - Markdown Report: {md_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
