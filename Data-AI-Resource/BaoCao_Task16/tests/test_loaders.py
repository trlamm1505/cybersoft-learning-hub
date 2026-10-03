"""Unit tests for Document Loaders in CyberSoft RAG Ingestion Pipeline."""

from pathlib import Path
import pytest

from src.loaders import (
    DocumentLoaderFactory,
    LoaderError,
    MarkdownLoader,
    PDFTextLoader,
    PlainTextLoader,
)


def test_markdown_loader_with_frontmatter(tmp_path: Path):
    doc_path = tmp_path / "CS-TEST-001_sample.md"
    content = """---
document_id: "CS-TEST-001"
title: "Tài liệu Kiểm thử Markdown"
category: "TEC"
version: "1.2"
---

# Tiêu đề Chính H1
Nội dung đoạn văn mở đầu.

## 1. Mục lục con H2
Chi tiết quy định kỹ thuật.
"""
    doc_path.write_text(content, encoding="utf-8")

    loader = MarkdownLoader()
    doc = loader.load(doc_path)

    assert doc.document_id == "CS-TEST-001"
    assert doc.metadata.title == "Tài liệu Kiểm thử Markdown"
    assert doc.metadata.category == "TEC"
    assert doc.metadata.version == "1.2"
    assert doc.metadata.file_type == "markdown"
    assert doc.content_hash != ""
    assert "Nội dung đoạn văn mở đầu." in doc.text


def test_plain_text_loader(tmp_path: Path):
    doc_path = tmp_path / "notes.txt"
    content = "QUY ĐỊNH HỌC TẬP\n\nNội dung chi tiết ghi chú đào tạo."
    doc_path.write_text(content, encoding="utf-8")

    loader = PlainTextLoader()
    doc = loader.load(doc_path)

    assert doc.document_id == "notes"
    assert doc.metadata.title == "QUY ĐỊNH HỌC TẬP"
    assert doc.metadata.file_type == "plain_text"
    assert doc.text.startswith("QUY ĐỊNH HỌC TẬP")


def test_pdf_text_loader_page_count(tmp_path: Path):
    doc_path = tmp_path / "syllabus.pdf.txt"
    content = "[PDF_PAGE_1]\nTrang đầu tiên của tài liệu PDF.\n\n[PDF_PAGE_2]\nTrang thứ hai của tài liệu PDF."
    doc_path.write_text(content, encoding="utf-8")

    loader = PDFTextLoader()
    doc = loader.load(doc_path)

    assert doc.metadata.file_type == "pdf_text"
    assert doc.metadata.extra_attributes.get("page_count") == 2
    assert "Trang thứ hai" in doc.text


def test_loader_error_handling(tmp_path: Path):
    # Test empty document
    empty_path = tmp_path / "empty.md"
    empty_path.write_text("", encoding="utf-8")

    loader = MarkdownLoader()
    with pytest.raises(LoaderError):
        loader.load(empty_path)

    # Test malformed frontmatter
    bad_fm = tmp_path / "bad.md"
    bad_fm.write_text("---\ntitle: [unclosed\n---\n# Content", encoding="utf-8")
    with pytest.raises(LoaderError):
        loader.load(bad_fm)


def test_unsupported_file_extension(tmp_path: Path):
    unsupported_file = tmp_path / "data.docx"
    unsupported_file.write_text("dummy", encoding="utf-8")
    with pytest.raises(LoaderError):
        DocumentLoaderFactory.get_loader(unsupported_file)
