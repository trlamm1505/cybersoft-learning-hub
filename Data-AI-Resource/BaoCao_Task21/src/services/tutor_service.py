"""AI Tutor RAG service with grounded generation, guardrails, and safe abstention."""

import re
import time

from ..schemas.search import SemanticSearchRequest
from ..schemas.tutor import (
    CitationItem,
    TutorChatRequest,
    TutorChatResponse,
)
from .search_service import SearchService

# Patterns for Prompt Injection and Jailbreak Guardrails
INJECTION_PATTERNS = [
    r"ignore (all )?previous instructions",
    r"disregard (all )?prior prompts",
    r"system prompt",
    r"jailbreak",
    r"\bdan mode\b",
    r"bỏ qua (toàn bộ )?hướng dẫn trước",
    r"tiết lộ prompt hệ thống",
    r"act as an unfiltered",
]

# Out-of-domain keywords for safe abstention
OUT_OF_DOMAIN_PATTERNS = [
    r"thời tiết",
    r"nấu (phở|cơm|bún|lẩu)",
    r"công thức nấu",
    r"giá vàng",
    r"tỷ giá ngoại tệ",
    r"mua bitcoin",
    r"kết quả bóng đá",
    r"xổ số",
    r"chiêm tinh",
    r"tử vi",
]


class TutorService:
    """Service answering questions grounded in CyberSoft knowledge base."""

    @classmethod
    def _check_guardrails(cls, question: str) -> bool:
        """Return True if prompt injection or jailbreak detected."""
        q_lower = question.lower()
        for pat in INJECTION_PATTERNS:
            if re.search(pat, q_lower):
                return True
        return False

    @classmethod
    def _is_out_of_domain(cls, question: str) -> bool:
        """Return True if question explicitly falls outside academic syllabus."""
        q_lower = question.lower()
        for pat in OUT_OF_DOMAIN_PATTERNS:
            if re.search(pat, q_lower):
                return True
        return False

    @classmethod
    def answer_question(cls, req: TutorChatRequest) -> TutorChatResponse:
        start_time = time.perf_counter()

        # 1. Guardrail check
        if cls._check_guardrails(req.question):
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return TutorChatResponse(
                answer=(
                    "Yêu cầu của bạn đã bị từ chối bởi hệ thống CyberSoft Guardrails "
                    "do phát hiện mẫu tấn công chỉ thị (Prompt Injection / Adversarial Jailbreak). "
                    "Vui lòng chỉ đặt các câu hỏi liên quan đến nội dung học tập."
                ),
                citations=[],
                status="GUARD_BLOCKED",
                groundedness_score=0.0,
                latency_ms=round(elapsed_ms, 2),
            )

        # 2. Strict abstention check for out-of-domain
        if req.strict_abstention and cls._is_out_of_domain(req.question):
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return TutorChatResponse(
                answer=(
                    "Xin lỗi bạn, câu hỏi này nằm ngoài phạm vi học liệu và quy chế đào tạo tại CyberSoft. "
                    "Trợ giảng AI được thiết kế chỉ hỗ trợ giải đáp các chủ đề liên quan đến chương trình đào tạo "
                    "Lập trình, Data/AI và quy chế khảo thí của học viện."
                ),
                citations=[],
                status="ABSTAINED",
                groundedness_score=1.0,
                latency_ms=round(elapsed_ms, 2),
            )

        # 3. Retrieve relevant chunks
        search_req = SemanticSearchRequest(
            query=req.question,
            top_k=req.top_k,
            similarity_threshold=0.1,
        )
        search_resp = SearchService.hybrid_search(search_req)

        # 4. If nothing relevant found -> Abstain safely
        if not search_resp.results or search_resp.results[0].relevance_score < 0.15:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return TutorChatResponse(
                answer=(
                    "Học liệu hiện tại của CyberSoft không có đủ dữ kiện để trả lời chính xác câu hỏi này. "
                    "Để bảo đảm tính trung thực học thuật, trợ giảng xin phép không suy diễn thông tin. "
                    "Bạn vui lòng kiểm tra lại câu hỏi hoặc liên hệ trực tiếp giảng viên bộ môn để được hỗ trợ chi tiết."
                ),
                citations=[],
                status="ABSTAINED",
                groundedness_score=1.0,
                latency_ms=round(elapsed_ms, 2),
            )

        # 5. Synthesize grounded answer
        top_chunks = search_resp.results
        citations: list[CitationItem] = []
        snippets: list[str] = []

        for chk in top_chunks:
            citations.append(
                CitationItem(
                    source_id=chk.chunk_id,
                    title=chk.document_title,
                    section=chk.section_header,
                    excerpt=chk.content[:160] + "...",
                )
            )
            snippets.append(
                f"- Theo tài liệu [{chk.document_title}, {chk.section_header}]: {chk.content}"
            )

        primary_doc = top_chunks[0].document_title
        primary_section = top_chunks[0].section_header
        primary_content = top_chunks[0].content

        answer_text = (
            f"Dựa trên học liệu chuẩn của CyberSoft ({primary_doc} - {primary_section}):\n\n"
            f"{primary_content}\n\n"
            f"Trích dẫn kiểm chứng: [{primary_doc}, Mục: {primary_section}]."
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        return TutorChatResponse(
            answer=answer_text,
            citations=citations,
            status="ANSWERED",
            groundedness_score=0.92,
            latency_ms=round(elapsed_ms, 2),
        )
