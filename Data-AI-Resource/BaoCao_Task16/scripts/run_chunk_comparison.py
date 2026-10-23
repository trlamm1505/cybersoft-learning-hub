"""Run Empirical Chunking Comparison and Generate Benchmark Reports.

Evaluates:
- Strategy A: Fixed-Size Sliding Window with Overlap.
- Strategy B: Markdown Header-Aware Semantic Chunking.
- Strategy C: Sentence-Window Boundary Chunking.

Outputs:
- reports/chunk_comparison_report.md
- reports/chunk_metrics.json
"""

from pathlib import Path
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.comparator import ChunkComparator  # noqa: E402


def main():
    corpus_dir = BASE_DIR / "data" / "corpus"
    reports_dir = BASE_DIR / "reports"

    print("[*] Starting Empirical Chunking Comparison Benchmark...")
    print(f"    - Corpus Path: {corpus_dir}")
    print(f"    - Output Reports: {reports_dir}")

    comparator = ChunkComparator(corpus_dir=corpus_dir)
    print(f"    - Loaded {len(comparator.documents)} valid documents from corpus.")

    results = comparator.run_full_comparison(output_dir=reports_dir)

    print("\n[+] Benchmark Completed Successfully!")
    print(f"    - Metrics JSON: {reports_dir / 'chunk_metrics.json'}")
    print(f"    - Markdown Report: {reports_dir / 'chunk_comparison_report.md'}")

    # Summary table
    print("\n" + "=" * 80)
    print(
        f"{'Strategy':<32} | {'Chunks':<8} | {'Avg Tok':<10} | {'Header %':<10} | {'Boundary %':<10}"
    )
    print("-" * 80)
    for strat_name, metrics in results["strategies"].items():
        print(
            f"{strat_name:<32} | "
            f"{metrics['total_chunks']:<8} | "
            f"{metrics['avg_tokens']:<10} | "
            f"{metrics['header_preservation_rate']:<9}% | "
            f"{metrics['boundary_integrity_score']:<9}%"
        )
    print("=" * 80)
    return 0


if __name__ == "__main__":
    sys.exit(main())
