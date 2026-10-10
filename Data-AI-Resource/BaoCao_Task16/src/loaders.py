"""Multi-Format Document Loaders for CyberSoft RAG Ingestion Pipeline.

Supports:
- Markdown (.md) with YAML frontmatter parsing.
- Plain text (.txt).
- Simulated/Extracted PDF text (.pdf.txt, .pdf).
"""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, Optional
import hashlib
import re


class LoaderError(Exception):
    """Custom exception raised when document loading or parsing fails."""

    pass


@dataclass
class DocumentMetadata:
    """Standardized metadata container for ingested documents."""

    document_id: str
    title: str
    category: str = "GENERAL"
    target_audience: str = "ALL"
    version: str = "1.0"
    last_updated: str = ""
    file_type: str = "unknown"
    file_path: str = ""
    file_size_bytes: int = 0
    content_hash: str = ""
    extra_attributes: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "document_id": self.document_id,
            "title": self.title,
            "category": self.category,
            "target_audience": self.target_audience,
            "version": self.version,
            "last_updated": self.last_updated,
            "file_type": self.file_type,
            "file_path": self.file_path,
            "file_size_bytes": self.file_size_bytes,
            "content_hash": self.content_hash,
            "extra_attributes": self.extra_attributes,
        }


@dataclass
class Document:
    """Document unit containing raw text and enriched metadata."""

    text: str
    metadata: DocumentMetadata

    @property
    def document_id(self) -> str:
        return self.metadata.document_id

    @property
    def content_hash(self) -> str:
        return self.metadata.content_hash


def compute_sha256(content: str) -> str:
    """Compute SHA-256 hash string for text content."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class BaseLoader:
    """Abstract base loader for document parsing."""

    def load(self, file_path: Path) -> Document:
        raise NotImplementedError("Subclasses must implement load()")


class MarkdownLoader(BaseLoader):
    """Parser for Markdown documents with optional YAML frontmatter."""

    FRONTMATTER_REGEX = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)

    def load(self, file_path: Path) -> Document:
        file_path = Path(file_path)
        if not file_path.exists():
            raise LoaderError(f"File not found: {file_path}")

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            raise LoaderError(
                f"Encoding error reading {file_path.name}: {exc}"
            ) from exc

        if not raw_text.strip():
            raise LoaderError(f"Empty document: {file_path.name}")

        metadata_dict: Dict[str, Any] = {}
        body_text = raw_text

        # Parse YAML frontmatter
        match = self.FRONTMATTER_REGEX.match(raw_text)
        if match:
            frontmatter_str = match.group(1)
            body_text = raw_text[match.end() :]
            metadata_dict = self._parse_simple_yaml(frontmatter_str, file_path.name)
        else:
            # Check if there is an unclosed frontmatter
            if raw_text.startswith("---"):
                raise LoaderError(
                    f"Malformed or unclosed YAML frontmatter in {file_path.name}"
                )

        stem = file_path.stem
        doc_id = str(metadata_dict.get("document_id") or stem)
        title = str(
            metadata_dict.get("title") or self._extract_first_h1(body_text) or stem
        )

        meta = DocumentMetadata(
            document_id=doc_id,
            title=title,
            category=str(metadata_dict.get("category", "GENERAL")),
            target_audience=str(metadata_dict.get("target_audience", "ALL")),
            version=str(metadata_dict.get("version", "1.0")),
            last_updated=str(metadata_dict.get("last_updated", "")),
            file_type="markdown",
            file_path=str(file_path.as_posix()),
            file_size_bytes=len(raw_text.encode("utf-8")),
            content_hash=compute_sha256(raw_text),
            extra_attributes={
                k: v
                for k, v in metadata_dict.items()
                if k
                not in [
                    "document_id",
                    "title",
                    "category",
                    "target_audience",
                    "version",
                    "last_updated",
                ]
            },
        )
        return Document(text=body_text.strip(), metadata=meta)

    def _parse_simple_yaml(self, yml_str: str, filename: str) -> Dict[str, Any]:
        """Simple YAML key-value parser without requiring external dependencies."""
        data: Dict[str, Any] = {}
        for line_num, raw_line in enumerate(yml_str.splitlines(), start=1):
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if ":" not in line:
                raise LoaderError(
                    f"Syntax error in frontmatter at line {line_num} in {filename}: '{line}'"
                )
            key, val = line.split(":", 1)
            key = key.strip()
            val = val.strip()
            # Unquote string values
            if (val.startswith('"') and val.endswith('"')) or (
                val.startswith("'") and val.endswith("'")
            ):
                val = val[1:-1]
            elif val.startswith("[") and not val.endswith("]"):
                raise LoaderError(
                    f"Unclosed array syntax at line {line_num} in {filename}: '{line}'"
                )
            elif val.startswith("{") and not val.endswith("}"):
                raise LoaderError(
                    f"Unclosed mapping syntax at line {line_num} in {filename}: '{line}'"
                )
            data[key] = val
        return data

    def _extract_first_h1(self, text: str) -> Optional[str]:
        for line in text.splitlines():
            line_str = line.strip()
            if line_str.startswith("# "):
                return line_str[2:].strip()
        return None


class PlainTextLoader(BaseLoader):
    """Parser for plain text documents."""

    def load(self, file_path: Path) -> Document:
        file_path = Path(file_path)
        if not file_path.exists():
            raise LoaderError(f"File not found: {file_path}")

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            raise LoaderError(
                f"Encoding error reading {file_path.name}: {exc}"
            ) from exc

        if not raw_text.strip():
            raise LoaderError(f"Empty document: {file_path.name}")

        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        title = lines[0] if lines else file_path.stem

        meta = DocumentMetadata(
            document_id=file_path.stem,
            title=title,
            category="TEXT",
            target_audience="ALL",
            version="1.0",
            file_type="plain_text",
            file_path=str(file_path.as_posix()),
            file_size_bytes=len(raw_text.encode("utf-8")),
            content_hash=compute_sha256(raw_text),
        )
        return Document(text=raw_text.strip(), metadata=meta)


class PDFTextLoader(BaseLoader):
    """Parser for simulated or pre-extracted PDF text with page markers."""

    PAGE_MARKER_REGEX = re.compile(r"\[PDF_PAGE_(\d+)\]", re.IGNORECASE)

    def load(self, file_path: Path) -> Document:
        file_path = Path(file_path)
        if not file_path.exists():
            raise LoaderError(f"File not found: {file_path}")

        try:
            raw_text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError as exc:
            raise LoaderError(
                f"Encoding error reading {file_path.name}: {exc}"
            ) from exc

        if not raw_text.strip():
            raise LoaderError(f"Empty document: {file_path.name}")

        pages = self.PAGE_MARKER_REGEX.findall(raw_text)
        page_count = len(pages) if pages else 1

        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        title = file_path.stem
        for line in lines:
            if not self.PAGE_MARKER_REGEX.match(line):
                title = line
                break

        meta = DocumentMetadata(
            document_id=file_path.stem.replace(".pdf", ""),
            title=title,
            category="PDF",
            target_audience="ALL",
            version="1.0",
            file_type="pdf_text",
            file_path=str(file_path.as_posix()),
            file_size_bytes=len(raw_text.encode("utf-8")),
            content_hash=compute_sha256(raw_text),
            extra_attributes={"page_count": page_count},
        )
        return Document(text=raw_text.strip(), metadata=meta)


class DocumentLoaderFactory:
    """Factory creating appropriate loader based on file extension."""

    @staticmethod
    def get_loader(file_path: Path) -> BaseLoader:
        path_str = str(file_path).lower()
        if path_str.endswith(".pdf.txt") or path_str.endswith(".pdf"):
            return PDFTextLoader()
        if path_str.endswith(".md"):
            return MarkdownLoader()
        if path_str.endswith(".txt"):
            return PlainTextLoader()
        raise LoaderError(f"Unsupported file format: {file_path.name}")
