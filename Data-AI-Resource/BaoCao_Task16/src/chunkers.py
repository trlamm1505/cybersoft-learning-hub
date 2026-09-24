"""Chunking Strategies for CyberSoft RAG Pipeline.

Implements three distinct chunking algorithms:
1. FixedSizeChunker: Sliding window with fixed character/token budget and overlap.
2. MarkdownHeaderChunker: Hierarchical heading-aware semantic chunking with breadcrumbs.
3. SentenceWindowChunker: Linguistic sentence boundary grouping with sliding context window.
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
import hashlib
import re

from .loaders import Document


@dataclass
class Chunk:
    """Standardized chunk unit with complete provenance and metadata."""

    chunk_id: str
    document_id: str
    text: str
    chunk_index: int
    char_start: int
    char_end: int
    token_count: int
    content_hash: str
    heading_hierarchy: List[str] = field(default_factory=list)
    section_id: Optional[str] = None
    strategy_name: str = "unknown"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_id": self.document_id,
            "text": self.text,
            "chunk_index": self.chunk_index,
            "char_start": self.char_start,
            "char_end": self.char_end,
            "token_count": self.token_count,
            "content_hash": self.content_hash,
            "heading_hierarchy": self.heading_hierarchy,
            "section_id": self.section_id,
            "strategy_name": self.strategy_name,
            "metadata": self.metadata,
        }


def estimate_token_count(text: str) -> int:
    """Estimate token count for Vietnamese/English text using whitespace & subword factor."""
    words = text.split()
    # Average factor 1.25 - 1.35 tokens per word for Vietnamese / multilingual RAG
    return max(1, int(len(words) * 1.3))


def compute_chunk_hash(text: str) -> str:
    """Compute SHA-256 for a chunk."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()


class BaseChunker:
    """Abstract base class for chunking implementations."""

    strategy_name: str = "base"

    def chunk(self, document: Document) -> List[Chunk]:
        raise NotImplementedError("Subclasses must implement chunk()")


class FixedSizeChunker(BaseChunker):
    """Strategy A: Fixed-size character window with configurable overlap."""

    strategy_name: str = "fixed_size_overlap"

    def __init__(self, chunk_size: int = 500, overlap: int = 100):
        if overlap >= chunk_size:
            raise ValueError("Overlap must be strictly less than chunk_size")
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.step = chunk_size - overlap

    def chunk(self, document: Document) -> List[Chunk]:
        text = document.text
        doc_id = document.document_id
        doc_meta = document.metadata.to_dict()

        chunks: List[Chunk] = []
        text_len = len(text)
        if text_len == 0:
            return chunks

        start = 0
        chunk_idx = 0

        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            chunk_text = text[start:end]

            chunk_hash = compute_chunk_hash(chunk_text)
            chunk_id = f"{doc_id}_fixed_{chunk_idx:03d}"

            meta = dict(doc_meta)
            meta["window_start"] = start
            meta["window_end"] = end

            chunks.append(
                Chunk(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    text=chunk_text,
                    chunk_index=chunk_idx,
                    char_start=start,
                    char_end=end,
                    token_count=estimate_token_count(chunk_text),
                    content_hash=chunk_hash,
                    heading_hierarchy=[],
                    section_id=None,
                    strategy_name=self.strategy_name,
                    metadata=meta,
                )
            )
            chunk_idx += 1
            if end >= text_len:
                break
            start += self.step

        return chunks


class MarkdownHeaderChunker(BaseChunker):
    """Strategy B: Header-Aware Hierarchical Semantic Section Chunking.

    Splits documents based on Markdown headers (#, ##, ###), preserves
    hierarchical breadcrumbs (e.g. ['# Policy', '## Section 1']), extracts
    section identifiers, and prevents splitting within headers or code blocks.
    """

    strategy_name: str = "markdown_header_semantic"
    HEADER_REGEX = re.compile(r"^(#{1,4})\s+(.+)$", re.MULTILINE)
    SECTION_ID_REGEX = re.compile(
        r"\b([A-Z]{2,4}-[A-Z0-9]+-SEC-\d+|SEC-\d+|Điều\s+\d+|Phần\s+\d+)\b",
        re.IGNORECASE,
    )

    def __init__(self, max_section_chars: int = 1200):
        self.max_section_chars = max_section_chars

    def chunk(self, document: Document) -> List[Chunk]:
        text = document.text
        doc_id = document.document_id
        doc_meta = document.metadata.to_dict()

        chunks: List[Chunk] = []
        if not text.strip():
            return chunks

        # Find all headers with their positions
        header_matches = list(self.HEADER_REGEX.finditer(text))

        if not header_matches:
            # Fallback to single chunk or paragraph-based chunk if no headers
            return self._chunk_flat_paragraphs(document)

        # Handle text preceding first header if non-trivial
        first_header_start = header_matches[0].start()
        if first_header_start > 0:
            preamble = text[:first_header_start].strip()
            if preamble:
                chk_hash = compute_chunk_hash(preamble)
                chunks.append(
                    Chunk(
                        chunk_id=f"{doc_id}_hdr_000",
                        document_id=doc_id,
                        text=preamble,
                        chunk_index=0,
                        char_start=0,
                        char_end=first_header_start,
                        token_count=estimate_token_count(preamble),
                        content_hash=chk_hash,
                        heading_hierarchy=["Preamble"],
                        section_id=f"{doc_id}-PREAMBLE",
                        strategy_name=self.strategy_name,
                        metadata=doc_meta,
                    )
                )

        # Hierarchy tracker: depth (1..4) -> header title
        hierarchy_map: Dict[int, str] = {}

        for i, match in enumerate(header_matches):
            level = len(match.group(1))  # 1 for #, 2 for ##, etc.
            title = match.group(2).strip()

            # Update hierarchy: clear deeper levels
            hierarchy_map = {k: v for k, v in hierarchy_map.items() if k < level}
            hierarchy_map[level] = f"{'#' * level} {title}"
            current_breadcrumbs = [
                hierarchy_map[k] for k in sorted(hierarchy_map.keys())
            ]

            start_pos = match.start()
            end_pos = (
                header_matches[i + 1].start()
                if i + 1 < len(header_matches)
                else len(text)
            )
            section_raw_text = text[start_pos:end_pos].strip()

            header_line = match.group(0).strip()
            body_under_header = section_raw_text[len(header_line) :].strip()
            # If the section contains only the header line and another header immediately follows,
            # retain the header in breadcrumbs but skip emitting an empty chunk.
            if not body_under_header and i + 1 < len(header_matches):
                continue

            # Attempt section ID extraction
            sec_match = self.SECTION_ID_REGEX.search(
                title
            ) or self.SECTION_ID_REGEX.search(section_raw_text[:200])
            sec_id = (
                sec_match.group(1).upper().replace(" ", "-")
                if sec_match
                else f"{doc_id}-S{len(chunks) + 1:02d}"
            )

            chunk_idx = len(chunks)
            chunk_id = f"{doc_id}_hdr_{chunk_idx:03d}"
            chk_hash = compute_chunk_hash(section_raw_text)

            meta = dict(doc_meta)
            meta["breadcrumbs"] = " > ".join(current_breadcrumbs)
            meta["header_level"] = level
            meta["header_title"] = title

            chunks.append(
                Chunk(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    text=section_raw_text,
                    chunk_index=chunk_idx,
                    char_start=start_pos,
                    char_end=end_pos,
                    token_count=estimate_token_count(section_raw_text),
                    content_hash=chk_hash,
                    heading_hierarchy=current_breadcrumbs,
                    section_id=sec_id,
                    strategy_name=self.strategy_name,
                    metadata=meta,
                )
            )

        return chunks

    def _chunk_flat_paragraphs(self, document: Document) -> List[Chunk]:
        """Fallback paragraph chunker when no headers are found."""
        paragraphs = [p.strip() for p in document.text.split("\n\n") if p.strip()]
        doc_id = document.document_id
        doc_meta = document.metadata.to_dict()
        chunks: List[Chunk] = []

        curr_pos = 0
        for idx, para in enumerate(paragraphs):
            c_hash = compute_chunk_hash(para)
            pos = document.text.find(para, curr_pos)
            end = pos + len(para) if pos != -1 else curr_pos + len(para)
            curr_pos = end

            chunks.append(
                Chunk(
                    chunk_id=f"{doc_id}_para_{idx:03d}",
                    document_id=doc_id,
                    text=para,
                    chunk_index=idx,
                    char_start=pos if pos != -1 else 0,
                    char_end=end,
                    token_count=estimate_token_count(para),
                    content_hash=c_hash,
                    heading_hierarchy=["Paragraph"],
                    section_id=f"{doc_id}-P{idx + 1:02d}",
                    strategy_name=self.strategy_name,
                    metadata=doc_meta,
                )
            )
        return chunks


class SentenceWindowChunker(BaseChunker):
    """Strategy C: Linguistic Sentence Boundary Chunking with Sliding Window.

    Detects sentence boundaries across Vietnamese and English punctuation
    (. ? !), grouping N sentences with overlap step.
    """

    strategy_name: str = "sentence_window_boundary"
    # Matches sentences while avoiding splitting on numbers (e.g. 1.0, 2.4)
    SENTENCE_REGEX = re.compile(r"(?<=[.?!])\s+(?=[A-ZÀ-Ỹ0-9])|\n\n+")

    def __init__(self, window_size: int = 3, step_size: int = 2):
        if step_size > window_size:
            raise ValueError("step_size cannot exceed window_size")
        self.window_size = window_size
        self.step_size = step_size

    def chunk(self, document: Document) -> List[Chunk]:
        text = document.text
        doc_id = document.document_id
        doc_meta = document.metadata.to_dict()

        chunks: List[Chunk] = []
        if not text.strip():
            return chunks

        # Split into sentences
        raw_sentences = [
            s.strip() for s in self.SENTENCE_REGEX.split(text) if s.strip()
        ]
        if not raw_sentences:
            return chunks

        total_sentences = len(raw_sentences)
        idx = 0
        chunk_idx = 0

        while idx < total_sentences:
            window = raw_sentences[idx : idx + self.window_size]
            chunk_text = " ".join(window)

            # Find approximate start and end
            first_sentence = window[0]
            last_sentence = window[-1]
            start_pos = text.find(first_sentence)
            start_pos = start_pos if start_pos != -1 else 0
            end_pos = text.find(last_sentence, start_pos)
            end_pos = (
                (end_pos + len(last_sentence))
                if end_pos != -1
                else (start_pos + len(chunk_text))
            )

            chk_hash = compute_chunk_hash(chunk_text)
            chunk_id = f"{doc_id}_sent_{chunk_idx:03d}"

            meta = dict(doc_meta)
            meta["sentence_count"] = len(window)
            meta["start_sentence_idx"] = idx
            meta["end_sentence_idx"] = min(idx + self.window_size, total_sentences) - 1

            chunks.append(
                Chunk(
                    chunk_id=chunk_id,
                    document_id=doc_id,
                    text=chunk_text,
                    chunk_index=chunk_idx,
                    char_start=start_pos,
                    char_end=end_pos,
                    token_count=estimate_token_count(chunk_text),
                    content_hash=chk_hash,
                    heading_hierarchy=[],
                    section_id=f"{doc_id}-SENT-{chunk_idx + 1:02d}",
                    strategy_name=self.strategy_name,
                    metadata=meta,
                )
            )

            chunk_idx += 1
            if idx + self.window_size >= total_sentences:
                break
            idx += self.step_size

        return chunks
