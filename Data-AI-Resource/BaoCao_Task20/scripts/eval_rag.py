"""Official CLI Tool: RAG Evaluation Harness (eval_rag).

Usage:
    python eval_rag.py --eval-set data/golden_rag_eval_v1.json --baseline data/baseline_metrics.json --output reports/current_metrics.json --ci-gate --export-md reports/regression_comparison_report.md
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

CURRENT_DIR = Path(__file__).resolve().parent
TASK20_DIR = CURRENT_DIR.parent

if str(TASK20_DIR) not in sys.path:
    sys.path.insert(0, str(TASK20_DIR))

from src.bm25 import BM25Engine  # noqa: E402
from src.embeddings import EmbeddingEngine  # noqa: E402
from src.eval_harness import RAGEvalHarness  # noqa: E402
from src.hybrid_retriever import HybridRetriever  # noqa: E402
from src.llm_judge import LLMJudge  # noqa: E402
from src.regression_checker import RegressionChecker  # noqa: E402
from src.reranker import CrossContextReranker  # noqa: E402
from src.rule_evaluator import RuleEvaluator  # noqa: E402
from src.tutor_engine import CyberSoftAITutor  # noqa: E402
from src.vector_index import VectorIndex  # noqa: E402


def initialize_rag_pipeline(task20_dir: Path):
    """Initialize HybridRetriever and CyberSoftAITutor from cached models."""
    idx_dir = task20_dir / "indexes"
    if not (idx_dir / "bm25_model.pkl").exists():
        idx_dir = task20_dir.parent / "BaoCao_Task19" / "indexes"

    if not (idx_dir / "bm25_model.pkl").exists():
        raise FileNotFoundError(f"Index directory not found at {idx_dir}")

    emb = EmbeddingEngine.load(idx_dir / "embedding_model.pkl")
    vec = VectorIndex.load(idx_dir / "vector_index.npz")
    bm25 = BM25Engine.load(idx_dir / "bm25_model.pkl")
    reranker = CrossContextReranker()

    retriever = HybridRetriever(
        embedding_engine=emb,
        vector_index=vec,
        bm25_engine=bm25,
        reranker=reranker,
    )
    tutor = CyberSoftAITutor(retriever=retriever)
    return retriever, tutor


def main():
    parser = argparse.ArgumentParser(
        description="CyberSoft Data & AI Lab — Automated RAG Evaluation Harness CLI"
    )
    parser.add_argument(
        "--eval-set",
        type=str,
        default=str(TASK20_DIR / "data" / "golden_rag_eval_v1.json"),
        help="Path to golden evaluation dataset JSON",
    )
    parser.add_argument(
        "--baseline",
        type=str,
        default=str(TASK20_DIR / "data" / "baseline_metrics.json"),
        help="Path to baseline metrics JSON for regression comparison",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(TASK20_DIR / "reports" / "current_metrics.json"),
        help="Output path for current evaluation metrics JSON",
    )
    parser.add_argument(
        "--export-md",
        type=str,
        default=str(TASK20_DIR / "reports" / "regression_comparison_report.md"),
        help="Output path for markdown regression comparison report",
    )
    parser.add_argument(
        "--ci-gate",
        action="store_true",
        help="Enforce CI Quality Gate rules and exit with non-zero exit code if regressions occur",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Top-K chunks for retrieval evaluation (default: 5)",
    )
    parser.add_argument(
        "--tag",
        type=str,
        default="v1.0-current",
        help="Version tag for this evaluation run",
    )

    args = parser.parse_args()

    eval_set_path = Path(args.eval_set)
    if not eval_set_path.exists():
        print(f"[ERROR] Evaluation dataset not found: {eval_set_path}")
        sys.exit(1)

    with open(eval_set_path, "r", encoding="utf-8") as f:
        eval_dataset = json.load(f)

    print("=" * 78)
    print("  CYBERSOFT DATA & AI LAB — RAG EVALUATION HARNESS CLI (eval_rag)")
    print(
        f"  Version: {args.tag} | Dataset: {eval_set_path.name} ({len(eval_dataset)} queries)"
    )
    print("=" * 78)

    # Initialize live pipeline
    retriever, tutor = initialize_rag_pipeline(TASK20_DIR)

    # Initialize harness
    rule_eval = RuleEvaluator()
    llm_judge = LLMJudge()
    harness = RAGEvalHarness(
        tutor_engine=tutor,
        retriever=retriever,
        rule_evaluator=rule_eval,
        llm_judge=llm_judge,
    )

    print("\n[STEP 1/3] Running batch evaluation across all queries...")
    start_time = time.perf_counter()
    current_report = harness.run_evaluation(
        eval_dataset=eval_dataset,
        top_k=args.top_k,
        version_tag=args.tag,
    )
    elapsed = time.perf_counter() - start_time
    print(
        f"-> Batch evaluation completed in {elapsed:.2f}s ({len(eval_dataset)} items)."
    )

    # Save output metrics JSON
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(current_report, f, ensure_ascii=False, indent=2)
    print(f"-> Saved current metrics to: {out_path}")

    # Baseline comparison & CI Quality Gate
    baseline_path = Path(args.baseline)
    checker = RegressionChecker()

    if baseline_path.exists():
        print("\n[STEP 2/3] Comparing Current run against Baseline...")
        with open(baseline_path, "r", encoding="utf-8") as f:
            baseline_data = json.load(f)

        summary = checker.evaluate_gate(baseline_data, current_report)
        print(f"-> Passed rules: {summary.passed_rules}/{summary.total_rules}")

        md_content = checker.render_markdown_report(
            baseline_data, current_report, summary
        )
        if args.export_md:
            md_path = Path(args.export_md)
            md_path.parent.mkdir(parents=True, exist_ok=True)
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            print(f"-> Exported Markdown report to: {md_path}")

        print("\n[STEP 3/3] CI Quality Gate Verification:")
        for r in summary.rule_results:
            status_str = "PASS" if r.passed else "FAIL"
            print(
                f"  [{status_str:4s}] {r.metric_name:<28s}: {r.baseline_val:.4f} -> {r.current_val:.4f} (Delta: {r.delta_val:+.4f})"
            )

        if args.ci_gate:
            print("=" * 78)
            if summary.all_passed:
                print(
                    "  BUILD STATUS: 🟢 SUCCESS (All Quality Gate Rules Passed - Exit Code 0)"
                )
                print("=" * 78)
                sys.exit(0)
            else:
                print(
                    "  BUILD STATUS: 🔴 FAILED (Quality Gate Regression Detected - Exit Code 1)"
                )
                print("=" * 78)
                sys.exit(1)
        else:
            print("=" * 78)
            print("  Evaluation finished successfully (CI Gate not strictly enforced).")
            print("=" * 78)
            sys.exit(0)
    else:
        print(f"\n[INFO] Baseline file {baseline_path} not found. Skipping comparison.")
        sys.exit(0)


if __name__ == "__main__":
    main()
