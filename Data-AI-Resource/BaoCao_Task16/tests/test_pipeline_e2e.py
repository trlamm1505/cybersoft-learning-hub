"""End-to-End Pipeline tests and Zero-Hardcoded-Paths Audit for Task 16."""

from pathlib import Path
import re

from src.chunkers import MarkdownHeaderChunker
from src.pipeline import IngestionPipeline


def test_pipeline_e2e_run(tmp_path: Path):
    input_dir = tmp_path / "corpus"
    output_dir = tmp_path / "output"
    logs_dir = tmp_path / "logs"
    input_dir.mkdir()

    # Create 2 valid docs and 1 invalid doc
    (input_dir / "doc1.md").write_text("# Doc 1\n## S1\nContent 1", encoding="utf-8")
    (input_dir / "doc2.txt").write_text(
        "Plain text content for doc 2.", encoding="utf-8"
    )
    (input_dir / "corrupt.bin").write_bytes(b"\xff\xfe\x00\x00\x80\x90")

    pipeline = IngestionPipeline(
        input_dir=input_dir,
        output_dir=output_dir,
        strategy=MarkdownHeaderChunker(),
        state_store_path=output_dir / "state_store.json",
        log_dir=logs_dir,
    )

    result = pipeline.run(incremental=True)

    assert result.total_files_scanned == 3
    assert result.files_ingested == 2
    assert result.files_errored == 1
    assert result.total_chunks >= 2
    assert Path(result.manifest_path).exists()
    assert (logs_dir / "ingestion_errors.log").exists()

    # Test Idempotent second run
    pipeline_rerun = IngestionPipeline(
        input_dir=input_dir,
        output_dir=output_dir,
        strategy=MarkdownHeaderChunker(),
        state_store_path=output_dir / "state_store.json",
        log_dir=logs_dir,
    )
    result2 = pipeline_rerun.run(incremental=True)
    assert result2.files_skipped == 2
    assert result2.files_ingested == 0
    assert result2.total_chunks == 0


def test_zero_hardcoded_personal_paths():
    """Verify that no personal machine workstation paths are hardcoded in source code."""
    task16_root = Path(__file__).resolve().parent.parent

    # Forbidden path patterns
    forbidden_pattern = re.compile(
        r"(?:[c-zC-Z]:[\\/](?:users|Users)[\\/][a-zA-Z0-9_-]+[\\/])",
        re.IGNORECASE,
    )

    violations = []
    scanned_extensions = [".py", ".sh", ".json", ".yaml", ".yml"]

    for sub_dir in ["src", "scripts", "tests"]:
        dir_path = task16_root / sub_dir
        if not dir_path.exists():
            continue
        for file_path in dir_path.rglob("*"):
            if file_path.is_file() and file_path.suffix in scanned_extensions:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                matches = forbidden_pattern.findall(content)
                if matches:
                    violations.append(
                        f"{file_path.relative_to(task16_root)}: {matches}"
                    )

    assert not violations, f"Detected hardcoded personal paths in Task 16: {violations}"
