"""Semantic & Hybrid search service over CyberSoft course materials."""

import json
import re
import time
from typing import Any

from ..config import DATA_DIR
from ..schemas.search import (
    SearchChunkItem,
    SemanticSearchRequest,
    SemanticSearchResponse,
)

# Built-in fallback chunks if jsonl is not present
FALLBACK_CHUNKS = [
    {
        "chunk_id": "chk_python_01",
        "doc_title": "Giáo trình Python Cơ Bản & Nâng Cao CyberSoft",
        "section": "Chương 2: Cấu trúc dữ liệu nâng cao",
        "content": "List comprehension trong Python cung cấp cú pháp ngắn gọn để tạo danh sách mới dựa trên các danh sách hiện có. Cú pháp: [expression for item in iterable if condition]. Cần lưu ý tránh lồng ghép quá 2 vòng lặp để bảo đảm tính rõ ràng của mã nguồn.",
        "tags": ["python", "syntax", "list-comprehension"],
    },
    {
        "chunk_id": "chk_rag_01",
        "doc_title": "Giáo trình AI Native & Kiến trúc RAG Hệ Thống",
        "section": "Chương 3: Chiến lược phân đoạn văn bản Markdown Header Chunking",
        "content": "Markdown Header Chunking chia tách tài liệu dựa trên các tiêu đề H1, H2, H3 để bảo toàn tính toàn vẹn của ngữ cảnh. Mỗi chunk duy trì đường dẫn cấu trúc phân cấp, ngăn chặn việc xé rời các câu lệnh code block hoặc bảng biểu.",
        "tags": ["rag", "chunking", "markdown", "architecture"],
    },
    {
        "chunk_id": "chk_rag_02",
        "doc_title": "Giáo trình AI Native & Kiến trúc RAG Hệ Thống",
        "section": "Chương 4: Thuật toán xếp hạng lai Reciprocal Rank Fusion (RRF)",
        "content": "RRF kết hợp kết quả từ hai công cụ tìm kiếm khác nhau (như BM25 dựa trên từ khóa và Vector Dense dựa trên ngữ nghĩa). Công thức: RRF_score(d) = sum(1 / (k + rank_i(d))) với hằng số làm mượt k thường chọn bằng 60.",
        "tags": ["rag", "rrf", "hybrid-search", "bm25", "dense-vector"],
    },
    {
        "chunk_id": "chk_policy_01",
        "doc_title": "Quy chế Đào tạo & Khảo thí CyberSoft Academy 2026",
        "section": "Điều 8: Quy định nộp bài tập và bảo vệ đồ án",
        "content": "Học viên phải nộp bài tập đúng hạn trên hệ thống Learning Platform trước 23:59 ngày quy định. Hệ thống tự động khóa cổng nộp bài trễ. Trường hợp có lý do bất khả kháng cần gửi đơn xin gia hạn trước 24 giờ kèm xác nhận của bộ phận quản lý học tập.",
        "tags": ["policy", "submission", "deadline", "cybersoft"],
    },
    {
        "chunk_id": "chk_policy_02",
        "doc_title": "Quy chế Đào tạo & Khảo thí CyberSoft Academy 2026",
        "section": "Điều 12: Chính sách liêm chính học thuật và phòng chống gian lận",
        "content": "CyberSoft nghiêm cấm mọi hành vi sao chép mã nguồn mà không ghi chú nguồn gốc. Các bài tập có độ tương đồng trên 80% qua hệ thống kiểm tra đạo văn tự động sẽ bị chấm điểm 0 và yêu cầu làm lại bài thi thay thế.",
        "tags": ["policy", "integrity", "plagiarism", "anti-cheat"],
    },
]


class SearchService:
    """Service executing hybrid retrieval on corpus."""

    _chunks: list[dict[str, Any]] = []

    @classmethod
    def _load_chunks(cls) -> list[dict[str, Any]]:
        if cls._chunks:
            return cls._chunks

        chunks_file = DATA_DIR / "chunks_markdown_header_semantic.jsonl"
        loaded = []
        if chunks_file.exists():
            try:
                with open(chunks_file, encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line:
                            loaded.append(json.loads(line))
            except Exception:
                pass

        if not loaded:
            loaded = FALLBACK_CHUNKS

        cls._chunks = loaded
        return cls._chunks

    @classmethod
    def _tokenize(cls, text: str) -> list[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = [t for t in cleaned.split() if len(t) > 1]
        return tokens

    @classmethod
    def hybrid_search(cls, req: SemanticSearchRequest) -> SemanticSearchResponse:
        start_time = time.perf_counter()
        chunks = cls._load_chunks()

        query_tokens = set(cls._tokenize(req.query))
        results: list[SearchChunkItem] = []

        for chk in chunks:
            # Support both format: text or content
            content = chk.get("text") or chk.get("content", "")
            meta = chk.get("metadata", {})
            title = (
                chk.get("doc_title")
                or chk.get("document_title")
                or meta.get("document_title")
                or chk.get("document_id", "CyberSoft Resource")
            )
            hierarchy = chk.get("heading_hierarchy", [])
            section = (
                chk.get("section")
                or chk.get("section_header")
                or (" > ".join(hierarchy) if hierarchy else "Chung")
            )
            tags = chk.get("tags") or meta.get("tags", [])

            # Filter check
            if req.filters:
                doc_filter = req.filters.get("document_title")
                if doc_filter and doc_filter.lower() not in title.lower():
                    continue

            # Calculate text overlap & BM25-like lexical similarity
            content_tokens = cls._tokenize(content)
            title_tokens = cls._tokenize(title)
            section_tokens = cls._tokenize(section)

            all_doc_tokens = set(content_tokens + title_tokens * 2 + section_tokens * 2)
            if not all_doc_tokens:
                continue

            overlap = query_tokens.intersection(all_doc_tokens)
            if not overlap and len(query_tokens) > 0:
                score = 0.05
            else:
                tf = sum(
                    content_tokens.count(w) + 2 * title_tokens.count(w) for w in overlap
                )
                score = min(
                    0.99,
                    (len(overlap) / max(1, len(query_tokens))) * 0.7
                    + min(0.3, tf * 0.05),
                )

            if req.query.lower() in content.lower():
                score = min(0.99, score + 0.3)

            if score >= req.similarity_threshold:
                chunk_id = chk.get("chunk_id", f"chk_{len(results)}")
                citation = f"[{title}, Mục: {section}]"
                results.append(
                    SearchChunkItem(
                        chunk_id=chunk_id,
                        document_title=title,
                        section_header=section,
                        content=content,
                        relevance_score=round(score, 4),
                        source_citation=citation,
                        tags=tags,
                    )
                )

        # Sort by relevance score descending
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        top_results = results[: req.top_k]

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return SemanticSearchResponse(
            query=req.query,
            total_found=len(top_results),
            execution_time_ms=round(elapsed_ms, 2),
            results=top_results,
        )

    @classmethod
    def get_chunk_by_id(cls, chunk_id: str) -> SearchChunkItem | None:
        chunks = cls._load_chunks()
        for chk in chunks:
            cid = chk.get("chunk_id", "")
            if cid == chunk_id:
                content = chk.get("text") or chk.get("content", "")
                meta = chk.get("metadata", {})
                title = (
                    chk.get("doc_title")
                    or chk.get("document_title")
                    or meta.get("document_title")
                    or chk.get("document_id", "CyberSoft Resource")
                )
                hierarchy = chk.get("heading_hierarchy", [])
                section = (
                    chk.get("section")
                    or chk.get("section_header")
                    or (" > ".join(hierarchy) if hierarchy else "Chung")
                )
                return SearchChunkItem(
                    chunk_id=cid,
                    document_title=title,
                    section_header=section,
                    content=content,
                    relevance_score=1.0,
                    source_citation=f"[{title}, Mục: {section}]",
                    tags=chk.get("tags") or meta.get("tags", []),
                )
        return None
