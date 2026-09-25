"""Content Hashing and State Management for Idempotent Ingestion.

Implements:
- SHA-256 content hashing.
- File change detection (NEW, MODIFIED, UNCHANGED, DELETED).
- State persistence in state_store.json.
- Chunk deduplication and idempotency verification.
"""

from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Set
import hashlib
import json


def hash_content(text: str) -> str:
    """Compute normalized SHA-256 hex digest for content."""
    normalized = text.strip().encode("utf-8")
    return hashlib.sha256(normalized).hexdigest()


def hash_file(file_path: Path) -> str:
    """Compute SHA-256 hex digest for a file on disk."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


class FileChangeStatus:
    NEW = "NEW"
    MODIFIED = "MODIFIED"
    UNCHANGED = "UNCHANGED"
    DELETED = "DELETED"


@dataclass
class DocumentStateRecord:
    """Historical state record for an ingested document."""

    document_id: str
    relative_path: str
    content_hash: str
    chunk_count: int
    strategy: str
    last_ingested_at: str
    chunk_hashes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "relative_path": self.relative_path,
            "content_hash": self.content_hash,
            "chunk_count": self.chunk_count,
            "strategy": self.strategy,
            "last_ingested_at": self.last_ingested_at,
            "chunk_hashes": self.chunk_hashes,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "DocumentStateRecord":
        return cls(
            document_id=data.get("document_id", ""),
            relative_path=data.get("relative_path", ""),
            content_hash=data.get("content_hash", ""),
            chunk_count=data.get("chunk_count", 0),
            strategy=data.get("strategy", ""),
            last_ingested_at=data.get("last_ingested_at", ""),
            chunk_hashes=data.get("chunk_hashes", []),
        )


class StateStore:
    """Persistent state database tracking document hashes and chunk provenance."""

    def __init__(self, state_file_path: Path):
        self.state_file_path = Path(state_file_path)
        self.records: Dict[str, DocumentStateRecord] = {}
        self._load()

    def _load(self) -> None:
        if self.state_file_path.exists():
            try:
                data = json.loads(self.state_file_path.read_text(encoding="utf-8"))
                for doc_id, item in data.get("documents", {}).items():
                    self.records[doc_id] = DocumentStateRecord.from_dict(item)
            except Exception:
                self.records = {}
        else:
            self.records = {}

    def save(self) -> None:
        self.state_file_path.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "updated_at": datetime.now().isoformat(),
            "total_documents": len(self.records),
            "documents": {k: v.to_dict() for k, v in self.records.items()},
        }
        self.state_file_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
        )

    def determine_status(self, document_id: str, current_hash: str) -> str:
        """Evaluate if file is NEW, MODIFIED, or UNCHANGED."""
        if document_id not in self.records:
            return FileChangeStatus.NEW
        stored = self.records[document_id]
        if stored.content_hash == current_hash:
            return FileChangeStatus.UNCHANGED
        return FileChangeStatus.MODIFIED

    def record_document(
        self,
        document_id: str,
        relative_path: str,
        content_hash: str,
        chunk_count: int,
        strategy: str,
        chunk_hashes: List[str],
    ) -> None:
        """Register or update ingested document in state store."""
        self.records[document_id] = DocumentStateRecord(
            document_id=document_id,
            relative_path=relative_path,
            content_hash=content_hash,
            chunk_count=chunk_count,
            strategy=strategy,
            last_ingested_at=datetime.now().isoformat(),
            chunk_hashes=chunk_hashes,
        )

    def get_existing_chunk_hashes(self) -> Set[str]:
        """Collect all chunk hashes across registered documents."""
        all_hashes: Set[str] = set()
        for rec in self.records.values():
            all_hashes.update(rec.chunk_hashes)
        return all_hashes

    def clear(self) -> None:
        self.records = {}
        if self.state_file_path.exists():
            self.state_file_path.unlink()
