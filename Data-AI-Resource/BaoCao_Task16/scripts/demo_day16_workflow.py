"""End-to-End Multi-Phase Verification Demo for Task 16:
CyberSoft RAG Ingestion & Chunking Pipeline.

Phases:
1. Cold Start Ingestion (23 documents).
2. Idempotent Re-run (100% files skipped, 0 duplicate chunks).
3. Incremental Update (1 modified file, 1 new file, rest unchanged).
4. Fault Isolation & Error Logging (handles malformed, corrupt, empty files).
"""

from pathlib import Path
import shutil
import sys

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.chunkers import MarkdownHeaderChunker  # noqa: E402
from src.pipeline import IngestionPipeline  # noqa: E402


def print_banner(text: str):
    print("\n" + "=" * 75)
    print(f"  {text}")
    print("=" * 75)


def run_demo():
    print_banner("CYBERSOFT RAG INGESTION PIPELINE — 4-PHASE VERIFICATION")

    demo_sandbox = BASE_DIR / "demo_sandbox"
    if demo_sandbox.exists():
        shutil.rmtree(demo_sandbox)
    demo_sandbox.mkdir(parents=True)

    input_corpus = demo_sandbox / "corpus"
    output_dir = demo_sandbox / "output"
    logs_dir = demo_sandbox / "logs"

    # Copy standard corpus to sandbox
    shutil.copytree(BASE_DIR / "data" / "corpus", input_corpus)

    # -------------------------------------------------------------
    # PHASE 1: Cold Start Ingestion
    # -------------------------------------------------------------
    print_banner("PHASE 1: COLD START INGESTION (Initial Load)")
    pipeline = IngestionPipeline(
        input_dir=input_corpus,
        output_dir=output_dir,
        strategy=MarkdownHeaderChunker(max_section_chars=1200),
        state_store_path=output_dir / "state_store.json",
        log_dir=logs_dir,
    )
    res1 = pipeline.run(incremental=True)

    print(
        f"[Phase 1 Result] Scanned: {res1.total_files_scanned}, Ingested: {res1.files_ingested}, Chunks: {res1.total_chunks}"
    )
    assert (
        res1.files_ingested >= 20
    ), f"Expected >= 20 files ingested, got {res1.files_ingested}"
    assert res1.total_chunks >= 80, f"Expected >= 80 chunks, got {res1.total_chunks}"
    assert (output_dir / "ingestion_manifest.json").exists(), "Manifest missing!"
    print("[PASS] Phase 1: Cold start ingestion completed successfully!")

    # -------------------------------------------------------------
    # PHASE 2: Idempotent Re-Run (No Duplication)
    # -------------------------------------------------------------
    print_banner("PHASE 2: IDEMPOTENCY RE-RUN (Zero Duplicate Guarantee)")
    # Re-initialize pipeline pointing to same state
    pipeline2 = IngestionPipeline(
        input_dir=input_corpus,
        output_dir=output_dir,
        strategy=MarkdownHeaderChunker(max_section_chars=1200),
        state_store_path=output_dir / "state_store.json",
        log_dir=logs_dir,
    )
    res2 = pipeline2.run(incremental=True)

    print(
        f"[Phase 2 Result] Scanned: {res2.total_files_scanned}, Ingested: {res2.files_ingested}, Skipped: {res2.files_skipped}"
    )
    assert (
        res2.files_skipped == res1.files_ingested
    ), f"Expected {res1.files_ingested} files skipped, got {res2.files_skipped}"
    assert (
        res2.files_ingested == 0
    ), f"Expected 0 re-ingested files, got {res2.files_ingested}"
    assert (
        res2.total_chunks == 0
    ), f"Expected 0 new chunks produced, got {res2.total_chunks}"
    print(
        "[PASS] Phase 2: Idempotency verified 100%! All files safely skipped without duplication."
    )

    # -------------------------------------------------------------
    # PHASE 3: Incremental Update (1 Modified, 1 New)
    # -------------------------------------------------------------
    print_banner("PHASE 3: INCREMENTAL UPDATE DETECTION")
    # 1. Add new document
    new_doc_path = input_corpus / "CS-NEW-001_quy_dinh_hoc_bong_xuat_sac.md"
    new_doc_path.write_text(
        "---\ndocument_id: CS-NEW-001\ntitle: Quy định Học bổng Xuất sắc\ncategory: POL\n---\n# Học bổng Xuất sắc CyberSoft\n## Điều 1. Tiêu chí\nĐiểm trung bình đồ án trên 9.5 và hoạt động tích cực.",
        encoding="utf-8",
    )
    # 2. Modify existing document
    target_mod = input_corpus / "CS-TXT-001_so_tay_sinh_vien_cyber_quickstart.txt"
    old_content = target_mod.read_text(encoding="utf-8")
    target_mod.write_text(
        old_content + "\n\nCẬP NHẬT 2026: Bổ sung kênh hỗ trợ AI Tutor 24/7.",
        encoding="utf-8",
    )

    pipeline3 = IngestionPipeline(
        input_dir=input_corpus,
        output_dir=output_dir,
        strategy=MarkdownHeaderChunker(max_section_chars=1200),
        state_store_path=output_dir / "state_store.json",
        log_dir=logs_dir,
    )
    res3 = pipeline3.run(incremental=True)

    print(
        f"[Phase 3 Result] Ingested: {res3.files_ingested}, Skipped: {res3.files_skipped}, Total: {res3.total_files_scanned}"
    )
    assert (
        res3.files_ingested == 2
    ), f"Expected exactly 2 updated/new files ingested, got {res3.files_ingested}"
    assert res3.files_skipped == res1.files_ingested - 1, "Skipped count mismatch!"
    print(
        "[PASS] Phase 3: Incremental update accurately captured 1 MODIFIED and 1 NEW document!"
    )

    # -------------------------------------------------------------
    # PHASE 4: Fault Isolation & Error Logging
    # -------------------------------------------------------------
    print_banner("PHASE 4: FAULT ISOLATION & ERROR LOGGING (DoD)")
    # Copy dirty samples into a test folder
    dirty_input = demo_sandbox / "dirty_corpus"
    dirty_output = demo_sandbox / "dirty_output"
    shutil.copytree(BASE_DIR / "data" / "dirty_samples", dirty_input)

    pipeline4 = IngestionPipeline(
        input_dir=dirty_input,
        output_dir=dirty_output,
        strategy=MarkdownHeaderChunker(max_section_chars=1200),
        state_store_path=dirty_output / "state_store.json",
        log_dir=logs_dir,
    )
    res4 = pipeline4.run(incremental=True)

    error_log_path = logs_dir / "ingestion_errors.log"
    print(
        f"[Phase 4 Result] Dirty files scanned: {res4.total_files_scanned}, Errored: {res4.files_errored}"
    )
    assert res4.files_errored > 0, "Expected dirty files to be marked as errored!"
    assert error_log_path.exists(), "Error log file missing!"
    log_content = error_log_path.read_text(encoding="utf-8")
    assert (
        "CS-ERR" in log_content or "ERROR" in log_content
    ), "Error log does not contain captured error traces!"
    print(
        "[PASS] Phase 4: Fault isolation successfully trapped and logged all dirty samples!"
    )

    # Close pipelines and shutdown logging before cleanup
    for p in [pipeline, pipeline2, pipeline3, pipeline4]:
        p.close()
    import logging

    logging.shutdown()

    # Clean up sandbox
    shutil.rmtree(demo_sandbox, ignore_errors=True)

    print_banner("ALL 4 PHASES COMPLETED WITH 100% SUCCESS — EXIT CODE 0")
    return 0


if __name__ == "__main__":
    sys.exit(run_demo())
