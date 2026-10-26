"""Unit tests for Chunking Strategies in CyberSoft RAG Pipeline."""

from src.chunkers import (
    FixedSizeChunker,
    MarkdownHeaderChunker,
    SentenceWindowChunker,
    estimate_token_count,
)
from src.loaders import Document, DocumentMetadata


def create_sample_document() -> Document:
    meta = DocumentMetadata(
        document_id="CS-SAMPLE-001",
        title="Quy chế Đào tạo",
        category="POL",
        version="1.0",
        file_path="data/corpus/sample.md",
    )
    text = """# Quy chế Đào tạo Lập trình Thực chiến

## Phần 1. Quy định Điểm danh
Học viên phải tham gia tối thiểu 80% số buổi học trực tiếp trên lớp.
Nếu vắng quá 3 buổi không có lý do chính đáng, học viên sẽ không được nộp đồ án tốt nghiệp.

## Phần 2. Quy định Đồ án Tốt nghiệp
Học viên phải hoàn thành đồ án cá nhân và bảo vệ trước hội đồng chuyên môn.
Điểm đồ án phải đạt từ 7.0 trở lên mới đủ điều kiện cấp chứng chỉ tốt nghiệp CyberSoft.
"""
    return Document(text=text.strip(), metadata=meta)


def test_fixed_size_chunker():
    doc = create_sample_document()
    chunker = FixedSizeChunker(chunk_size=150, overlap=50)
    chunks = chunker.chunk(doc)

    assert len(chunks) > 1
    for c in chunks:
        assert c.document_id == doc.document_id
        assert c.token_count > 0
        assert c.content_hash != ""
        assert len(c.text) <= 150


def test_markdown_header_chunker_breadcrumbs():
    doc = create_sample_document()
    chunker = MarkdownHeaderChunker()
    chunks = chunker.chunk(doc)

    assert len(chunks) == 2
    # Verify breadcrumbs
    chk1 = chunks[0]
    assert chk1.heading_hierarchy == [
        "# Quy chế Đào tạo Lập trình Thực chiến",
        "## Phần 1. Quy định Điểm danh",
    ]
    assert "Học viên phải tham gia tối thiểu 80%" in chk1.text
    assert chk1.section_id is not None

    chk2 = chunks[1]
    assert "## Phần 2. Quy định Đồ án Tốt nghiệp" in chk2.heading_hierarchy
    assert "Điểm đồ án phải đạt từ 7.0" in chk2.text


def test_sentence_window_chunker():
    doc = create_sample_document()
    chunker = SentenceWindowChunker(window_size=2, step_size=1)
    chunks = chunker.chunk(doc)

    assert len(chunks) >= 2
    for c in chunks:
        assert c.strategy_name == "sentence_window_boundary"
        assert c.metadata.get("sentence_count", 0) <= 2


def test_token_estimation():
    text = "Học viện CyberSoft đào tạo lập trình thực chiến chuẩn doanh nghiệp."
    tok_count = estimate_token_count(text)
    assert tok_count >= 8


def test_chunk_provenance_and_metadata_completeness():
    doc = create_sample_document()
    chunker = MarkdownHeaderChunker()
    chunks = chunker.chunk(doc)

    for c in chunks:
        assert c.chunk_id.startswith("CS-SAMPLE-001")
        assert c.document_id == "CS-SAMPLE-001"
        assert c.char_start >= 0
        assert c.char_end > c.char_start
        assert c.token_count > 0
        assert len(c.content_hash) == 64
        assert c.strategy_name == "markdown_header_semantic"
        assert c.metadata.get("version") == "1.0"
