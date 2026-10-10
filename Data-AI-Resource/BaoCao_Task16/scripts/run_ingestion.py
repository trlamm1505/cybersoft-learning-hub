"""CLI Launcher for CyberSoft RAG Ingestion Pipeline.

Usage:
    python run_ingestion.py [--strategy header|fixed|sentence] [--force] [--input-dir DIR] [--output-dir DIR]
"""

import argparse
from pathlib import Path
import sys

# Ensure src package is importable
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.chunkers import FixedSizeChunker, MarkdownHeaderChunker, SentenceWindowChunker  # noqa: E402
from src.pipeline import IngestionPipeline  # noqa: E402


def main():
    parser = argparse.ArgumentParser(
        description="CyberSoft RAG Document Ingestion & Chunking Pipeline"
    )
    parser.add_argument(
        "--strategy",
        choices=["header", "fixed", "sentence"],
        default="header",
        help="Chunking strategy to apply",
    )
    parser.add_argument(
        "--force", action="store_true", help="Force re-ingestion of unchanged documents"
    )
    parser.add_argument(
        "--input-dir",
        type=str,
        default=str(BASE_DIR / "data" / "corpus"),
        help="Input corpus directory",
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=str(BASE_DIR / "output"),
        help="Output directory for chunks and state",
    )
    args = parser.parse_args()

    strat_map = {
        "header": MarkdownHeaderChunker(max_section_chars=1200),
        "fixed": FixedSizeChunker(chunk_size=500, overlap=100),
        "sentence": SentenceWindowChunker(window_size=3, step_size=2),
    }
    strategy = strat_map[args.strategy]

    input_path = Path(args.input_dir)
    output_path = Path(args.output_dir)

    print("[*] Initializing Ingestion Pipeline...")
    print(f"    - Input: {input_path}")
    print(f"    - Output: {output_path}")
    print(f"    - Strategy: {strategy.strategy_name}")
    print(f"    - Force Re-ingest: {args.force}")

    pipeline = IngestionPipeline(
        input_dir=input_path,
        output_dir=output_path,
        strategy=strategy,
        state_store_path=output_path / "state_store.json",
        log_dir=BASE_DIR / "logs",
    )

    result = pipeline.run(incremental=not args.force, force=args.force)

    print("\n[+] Ingestion Run Completed Successfully!")
    print(f"    - Run ID: {result.run_id}")
    print(f"    - Scanned: {result.total_files_scanned} files")
    print(f"    - Ingested: {result.files_ingested} files")
    print(f"    - Skipped (Unchanged): {result.files_skipped} files")
    print(f"    - Errored: {result.files_errored} files")
    print(f"    - Chunks Produced: {result.total_chunks} chunks")
    print(
        f"    - Tokens Produced: {result.total_tokens} tokens (~{round(result.total_tokens / max(1, result.total_chunks), 1)} tok/chunk)"
    )
    print(f"    - Manifest: {result.manifest_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
