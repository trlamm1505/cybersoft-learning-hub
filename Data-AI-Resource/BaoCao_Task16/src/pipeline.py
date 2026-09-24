"""Main Orchestration Pipeline for Document Ingestion, Chunking, and State Tracking.

Features:
- Multi-format ingestion (.md, .txt, .pdf.txt).
- Pluggable chunking strategy.
- Automated error capture and logging to logs/ingestion_errors.log.
- Idempotency & incremental change detection.
- Manifest generation (ingestion_manifest.json).
"""

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
import json
import logging
import traceback
import uuid

from .chunkers import BaseChunker, Chunk, MarkdownHeaderChunker
from .hashing import FileChangeStatus, StateStore
from .loaders import DocumentLoaderFactory


@dataclass
class IngestionResult:
    """Summary metrics of an ingestion pipeline run."""

    run_id: str
    strategy: str
    total_files_scanned: int = 0
    files_ingested: int = 0
    files_skipped: int = 0
    files_errored: int = 0
    total_chunks: int = 0
    total_tokens: int = 0
    chunks: List[Chunk] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    manifest_path: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "run_id": self.run_id,
            "strategy": self.strategy,
            "total_files_scanned": self.total_files_scanned,
            "files_ingested": self.files_ingested,
            "files_skipped": self.files_skipped,
            "files_errored": self.files_errored,
            "total_chunks": self.total_chunks,
            "total_tokens": self.total_tokens,
            "avg_tokens_per_chunk": round(
                self.total_tokens / max(1, self.total_chunks), 2
            ),
            "manifest_path": self.manifest_path,
            "error_count": len(self.errors),
        }


class IngestionPipeline:
    """End-to-End Ingestion Pipeline."""

    SUPPORTED_EXTENSIONS = [".md", ".txt", ".pdf.txt"]

    def __init__(
        self,
        input_dir: Path,
        output_dir: Path,
        strategy: Optional[BaseChunker] = None,
        state_store_path: Optional[Path] = None,
        log_dir: Optional[Path] = None,
    ):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.strategy = strategy or MarkdownHeaderChunker()

        # Paths
        self.log_dir = Path(log_dir) if log_dir else self.output_dir / "logs"
        self.state_file = (
            Path(state_store_path)
            if state_store_path
            else self.output_dir / "state_store.json"
        )

        # Setup directories
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.log_dir.mkdir(parents=True, exist_ok=True)

        self.state_store = StateStore(self.state_file)
        self._setup_logging()

    def _setup_logging(self) -> None:
        self.logger = logging.getLogger(f"ingestion_pipeline_{id(self)}")
        self.logger.setLevel(logging.INFO)
        self.logger.handlers.clear()

        # General log
        info_handler = logging.FileHandler(
            self.log_dir / "ingestion.log", encoding="utf-8"
        )
        info_handler.setLevel(logging.INFO)
        fmt = logging.Formatter("[%(asctime)s] [%(levelname)s] %(message)s")
        info_handler.setFormatter(fmt)
        self.logger.addHandler(info_handler)

        # Dedicated error log for DoD compliance
        self.error_logger = logging.getLogger(f"ingestion_errors_{id(self)}")
        self.error_logger.setLevel(logging.ERROR)
        self.error_logger.handlers.clear()
        error_handler = logging.FileHandler(
            self.log_dir / "ingestion_errors.log", encoding="utf-8"
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(fmt)
        self.error_logger.addHandler(error_handler)

    def close(self) -> None:
        """Close logger file handlers to release file locks on Windows."""
        for handler in list(self.logger.handlers):
            handler.close()
            self.logger.removeHandler(handler)
        for handler in list(self.error_logger.handlers):
            handler.close()
            self.error_logger.removeHandler(handler)

    def scan_files(self) -> List[Path]:
        """Discover all supported candidate files in input directory."""
        if not self.input_dir.exists():
            return []
        all_files: List[Path] = []
        for file_path in sorted(self.input_dir.rglob("*")):
            if file_path.is_file():
                name_lower = file_path.name.lower()
                if (
                    any(name_lower.endswith(ext) for ext in self.SUPPORTED_EXTENSIONS)
                    or file_path.suffix == ".bin"
                ):
                    all_files.append(file_path)
        return all_files

    def run(self, incremental: bool = True, force: bool = False) -> IngestionResult:
        """Execute ingestion pipeline run."""
        run_id = (
            f"INGEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
        )
        self.logger.info(
            f"Starting Ingestion Run {run_id} | Strategy: {self.strategy.strategy_name} | Incremental={incremental}"
        )

        candidate_files = self.scan_files()
        result = IngestionResult(run_id=run_id, strategy=self.strategy.strategy_name)
        result.total_files_scanned = len(candidate_files)

        all_produced_chunks: List[Chunk] = []

        for file_path in candidate_files:
            rel_path = str(file_path.relative_to(self.input_dir).as_posix())

            # 1. Load document with error isolation
            try:
                loader = DocumentLoaderFactory.get_loader(file_path)
                doc = loader.load(file_path)
            except Exception as exc:
                err_record = {
                    "timestamp": datetime.now().isoformat(),
                    "file_path": rel_path,
                    "error_type": type(exc).__name__,
                    "error_message": str(exc),
                    "traceback": traceback.format_exc(),
                }
                result.errors.append(err_record)
                result.files_errored += 1
                self.error_logger.error(
                    f"Failed to load {rel_path} [{type(exc).__name__}]: {exc}"
                )
                continue

            # 2. Check status for incremental processing & idempotency
            file_status = self.state_store.determine_status(
                doc.document_id, doc.content_hash
            )

            if file_status == FileChangeStatus.UNCHANGED and incremental and not force:
                result.files_skipped += 1
                self.logger.info(
                    f"Skipping UNCHANGED document: {doc.document_id} ({rel_path})"
                )
                continue

            # 3. Apply chunking strategy
            try:
                chunks = self.strategy.chunk(doc)
            except Exception as exc:
                err_record = {
                    "timestamp": datetime.now().isoformat(),
                    "file_path": rel_path,
                    "error_type": f"ChunkingError_{type(exc).__name__}",
                    "error_message": str(exc),
                    "traceback": traceback.format_exc(),
                }
                result.errors.append(err_record)
                result.files_errored += 1
                self.error_logger.error(f"Failed to chunk {rel_path}: {exc}")
                continue

            # 4. Record document and chunks in state store
            chunk_hashes = [c.content_hash for c in chunks]
            self.state_store.record_document(
                document_id=doc.document_id,
                relative_path=rel_path,
                content_hash=doc.content_hash,
                chunk_count=len(chunks),
                strategy=self.strategy.strategy_name,
                chunk_hashes=chunk_hashes,
            )

            all_produced_chunks.extend(chunks)
            result.files_ingested += 1
            result.total_chunks += len(chunks)
            result.total_tokens += sum(c.token_count for c in chunks)
            self.logger.info(
                f"Ingested {doc.document_id}: {len(chunks)} chunks produced ({file_status})"
            )

        # 5. Persist state and output files
        self.state_store.save()
        result.chunks = all_produced_chunks

        # Export chunks JSONL
        chunks_file = self.output_dir / f"chunks_{self.strategy.strategy_name}.jsonl"
        with open(chunks_file, "w", encoding="utf-8") as f:
            for chk in all_produced_chunks:
                f.write(json.dumps(chk.to_dict(), ensure_ascii=False) + "\n")

        # Export Manifest
        manifest_path = self.output_dir / "ingestion_manifest.json"
        manifest_data = {
            "ingestion_run_id": run_id,
            "generated_at": datetime.now().isoformat(),
            "strategy": self.strategy.strategy_name,
            "metrics": result.to_dict(),
            "output_chunks_file": str(chunks_file.name),
            "state_store_file": str(self.state_file.name),
            "log_files": {
                "general_log": "logs/ingestion.log",
                "error_log": "logs/ingestion_errors.log",
            },
            "sample_chunks": [c.to_dict() for c in all_produced_chunks[:3]],
        }
        manifest_path.write_text(
            json.dumps(manifest_data, indent=2, ensure_ascii=False), encoding="utf-8"
        )
        result.manifest_path = str(manifest_path.as_posix())

        self.logger.info(
            f"Completed run {run_id}: Ingested={result.files_ingested}, Skipped={result.files_skipped}, Errored={result.files_errored}, Chunks={result.total_chunks}"
        )
        return result
