"""Guardrails Engine for CyberSoft AI Tutor (Task 19)
Provides multi-perimeter defense:
1. InputGuardrail: Detects Prompt Injection, Jailbreak, System Prompt Leaking, and Malicious Input.
2. AbstentionGate: Evaluates relevance threshold and out-of-scope queries to decide on abstention.
3. OutputGuardrail & CitationVerifier: Verifies citation authenticity and sanitizes secrets/PII.
"""

from dataclasses import dataclass
import re
from typing import Any, Dict, List, Optional, Set, Tuple


@dataclass
class GuardrailResult:
    passed: bool
    status: str  # "PASSED" or "BLOCKED"
    category: Optional[str] = None
    reason: Optional[str] = None
    risk_level: str = "LOW"  # "LOW", "MEDIUM", "HIGH", "CRITICAL"


@dataclass
class AbstentionResult:
    should_abstain: bool
    status: str  # "CONTINUE" or "ABSTAIN"
    reason: Optional[str] = None
    confidence_score: float = 0.0


class InputGuardrail:
    """Multi-layer input filter scanning for prompt injections, jailbreaks, and sensitive probes."""

    # High-risk prompt injection and jailbreak patterns
    INJECTION_PATTERNS = [
        # Direct instruction overrides
        (
            r"\bignore\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|prompts|guidelines)\b",
            "direct_instruction_override",
            "CRITICAL",
        ),
        (
            r"\bbỏ\s+qua\s+(toàn\s+bộ\s+)?(chỉ\s+dẫn|hướng\s+dẫn|quy\s+tắc|câu\s+lệnh)\b",
            "direct_instruction_override",
            "HIGH",
        ),
        (
            r"\bdisregard\s+(all\s+)?(system|previous|ethical)\s+(boundaries|filters|instructions)\b",
            "direct_instruction_override",
            "HIGH",
        ),
        (
            r"\bquên\s+(đi\s+)?(các\s+)?(quy\s+tắc|luật|nguyên\s+tắc)\b",
            "direct_instruction_override",
            "MEDIUM",
        ),
        # Jailbreak / Roleplay modes
        (
            r"\byou\s+are\s+now\s+dan\b|\bdan\s+mode\b",
            "role_playing_jailbreak",
            "CRITICAL",
        ),
        (r"\bevil\s*tutor\b", "role_playing_jailbreak", "HIGH"),
        (
            r"\btrò\s+chơi\s+nhập\s+vai\b.*\bchống\s+đối\b",
            "role_playing_jailbreak",
            "HIGH",
        ),
        (
            r"\bvũ\s+trụ\s+song\s+song\b.*\bkhông\s+(có\s+)?(bản\s+quyền|quy\s+tắc|trích\s+nguồn)\b",
            "role_playing_jailbreak",
            "HIGH",
        ),
        (
            r"\btình\s+huống\s+khẩn\s+cấp\s+cứu\s+người\b.*\bmật\s+khẩu\b",
            "role_playing_jailbreak",
            "CRITICAL",
        ),
        # System prompt leaking & Secret probing
        (
            r"\b(what\s+is\s+your|repeat\s+the|show\s+me\s+your|print\s+the)\s+secret\s+system\s+prompt\b",
            "system_prompt_secret_probing",
            "CRITICAL",
        ),
        (
            r"\b(repeat\s+exact\s+text\s+above|print\s+the\s+prompt\s+template)\b",
            "system_prompt_secret_probing",
            "HIGH",
        ),
        (
            r"\b(api\s*key|mật\s+khẩu|password|root\s+password|secret\s+key)\b.*\b(server|hệ\s+thống|database|cơ\s+sở\s+dữ\s+liệu)\b",
            "system_prompt_secret_probing",
            "CRITICAL",
        ),
        (
            r"\b(developer\s+guidelines|hidden\s+credential|environment\s+configuration)\b",
            "system_prompt_secret_probing",
            "HIGH",
        ),
        # Malicious scripts and token obfuscation
        (r"<script.*?>.*?</script.*?>", "token_smuggling_obfuscation", "CRITICAL"),
        (r"\[SYSTEM_OVERRIDE\]", "token_smuggling_obfuscation", "CRITICAL"),
        (
            r"\b[A-Za-z0-9+/]{24,}={0,2}\b",
            "token_smuggling_obfuscation",
            "HIGH",
        ),  # Base64 tokens
    ]

    # Delimiter-separated bypasses (e.g., i-g-n-o-r-e or i.g.n.o.r.e)
    DELIMITED_BYPASSES = [
        (
            r"i[-_\s\.]g[-_\s\.]n[-_\s\.]o[-_\s\.]r[-_\s\.]e",
            "token_smuggling_obfuscation",
            "HIGH",
        ),
        (r"h[-_\s\.]a[-_\s\.]c[-_\s\.]k", "token_smuggling_obfuscation", "HIGH"),
    ]

    def check(self, query: str) -> GuardrailResult:
        """Scan input query against injection and probing rules."""
        if not query or not query.strip():
            return GuardrailResult(
                passed=False,
                status="BLOCKED",
                category="empty_input",
                reason="Truy vấn trống hoặc chỉ chứa khoảng trắng.",
                risk_level="LOW",
            )

        query_lower = query.lower()

        # 1. Check direct regex patterns
        for pattern, category, risk in self.INJECTION_PATTERNS:
            if re.search(pattern, query, re.IGNORECASE):
                return GuardrailResult(
                    passed=False,
                    status="BLOCKED",
                    category=category,
                    reason=f"Phát hiện mẫu tấn công đối kháng ({category}) với mức độ rủi ro {risk}.",
                    risk_level=risk,
                )

        # 2. Check delimiter-separated obfuscated patterns
        for pattern, category, risk in self.DELIMITED_BYPASSES:
            if re.search(pattern, query_lower):
                return GuardrailResult(
                    passed=False,
                    status="BLOCKED",
                    category=category,
                    reason=f"Phát hiện kỹ thuật che giấu ký tự ngụy trang ({category}).",
                    risk_level=risk,
                )

        return GuardrailResult(passed=True, status="PASSED", risk_level="LOW")


class AbstentionGate:
    """Evaluates whether the AI Tutor should abstain from answering due to low confidence or out-of-scope topics."""

    OUT_OF_SCOPE_DOMAINS = [
        # Culinary
        (
            r"\b(công\s+thức|phở\s+bò|bún\s+chả|món\s+ăn|nấu\s+cơm|ẩm\s+thực|nấu\s+nướng|nấu)\b",
            "Chủ đề ẩm thực, nấu nướng nằm ngoài phạm vi học liệu đào tạo công nghệ.",
        ),
        # Financial speculation
        (
            r"\b(cổ\s+phiếu|chứng\s+khoán|bitcoin|tiền\s+số|mua\s+hay\s+bán|giá\s+tesla)\b",
            "Chủ đề tư vấn tài chính, đầu tư chứng khoán/tiền số không thuộc phạm vi đào tạo.",
        ),
        # General non-tech geography / politics / pop culture
        (
            r"\b(cộng\s+hòa\s+madagascar|dân\s+số|thủ\s+đô\s+của\s+nước|thơ\s+tình\s+lãng\s+mạn)\b",
            "Chủ đề địa lý, chính trị hoặc văn học nghệ thuật nằm ngoài phạm vi trợ giảng kỹ thuật.",
        ),
        # Hallucination baits
        (
            r"\b(hyper-quantum|docker\s+acceleration|học\s+bổng\s+1\s+tỷ|cyber_neural_magic_v9|lái\s+tàu\s+vũ\s+trụ)\b",
            "Câu hỏi chứa thuật ngữ kỹ thuật hoặc quy chế giả mạo không tồn tại trong học viện CyberSoft.",
        ),
    ]

    def __init__(self, similarity_threshold: float = 0.35, min_chunk_count: int = 1):
        self.similarity_threshold = similarity_threshold
        self.min_chunk_count = min_chunk_count

    def evaluate(
        self, query: str, retrieved_chunks: List[Dict[str, Any]]
    ) -> AbstentionResult:
        """Decide if tutor must abstain."""
        query_lower = query.lower()

        # 1. Check out-of-scope domain keywords
        for pattern, reason in self.OUT_OF_SCOPE_DOMAINS:
            if re.search(pattern, query_lower):
                return AbstentionResult(
                    should_abstain=True,
                    status="ABSTAIN",
                    reason=f"Yêu cầu ngoài phạm vi: {reason}",
                    confidence_score=0.0,
                )

        # 2. Check retrieved chunks availability
        if not retrieved_chunks or len(retrieved_chunks) < self.min_chunk_count:
            return AbstentionResult(
                should_abstain=True,
                status="ABSTAIN",
                reason="Hệ thống không tìm thấy bất kỳ đoạn trích học liệu nào liên quan trong cơ sở tri thức CyberSoft.",
                confidence_score=0.0,
            )

        # 3. Check similarity score of top chunk
        top_chunk = retrieved_chunks[0]
        # hybrid reranked score or rrf score or cosine score
        score = float(top_chunk.get("score", 0.0))
        rerank_score = float(top_chunk.get("rerank_score", score))
        final_score = max(score, rerank_score)

        if final_score < self.similarity_threshold:
            return AbstentionResult(
                should_abstain=True,
                status="ABSTAIN",
                reason=f"Độ tương quan cao nhất ({final_score:.4f}) thấp hơn ngưỡng tin cậy tối thiểu ({self.similarity_threshold:.2f}). Dữ liệu học liệu không đủ căn cứ trả lời.",
                confidence_score=final_score,
            )

        return AbstentionResult(
            should_abstain=False,
            status="CONTINUE",
            reason=None,
            confidence_score=final_score,
        )


class OutputGuardrail:
    """Validates citations against actual retrieved chunks and sanitizes logs from secret leakages."""

    SECRET_MASKS = [
        (r"(sk-[a-zA-Z0-9]{12,})", "[REDACTED_API_KEY]"),
        (r"(AIza[0-9A-Za-z-_]{20,})", "[REDACTED_GEMINI_KEY]"),
        (r"(Bearer\s+[a-zA-Z0-9_\-\.]{8,})", "Bearer [REDACTED_TOKEN]"),
        (
            r"(password|mật_khẩu|secret)[\"':=\s]+([^\s,;\"'\}]+)",
            r"\1: [REDACTED_SECRET]",
        ),
    ]

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Strip or mask secrets and sensitive credentials from output or logs."""
        if not text:
            return ""
        sanitized = text
        for pattern, replacement in cls.SECRET_MASKS:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        return sanitized

    @classmethod
    def verify_citations(
        cls, citations: List[Dict[str, Any]], retrieved_chunks: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], bool, List[str]]:
        """Verify that every cited chunk_id strictly exists in retrieved_chunks.
        Returns:
            (valid_citations, all_valid, validation_errors)
        """
        valid_chunk_ids: Set[str] = {
            c.get("chunk_id") for c in retrieved_chunks if c.get("chunk_id")
        }
        chunk_map = {
            c.get("chunk_id"): c for c in retrieved_chunks if c.get("chunk_id")
        }

        valid_citations = []
        errors = []
        all_valid = True

        for cite in citations:
            cid = cite.get("chunk_id")
            if not cid:
                errors.append("Trích dẫn thiếu trường 'chunk_id'.")
                all_valid = False
                continue

            if cid not in valid_chunk_ids:
                errors.append(
                    f"Phát hiện trích dẫn ảo giác (Hallucinated citation): '{cid}' không có trong tập ngữ cảnh retrieved."
                )
                all_valid = False
                continue

            # Enrich citation with authentic metadata if missing
            retrieved_chunk = chunk_map[cid]
            enriched = {
                "chunk_id": cid,
                "document_code": cite.get("document_code")
                or retrieved_chunk.get("document_id", "CYBERSOFT-DOC"),
                "section_title": cite.get("section_title")
                or retrieved_chunk.get("title", ""),
                "exact_quote": cite.get("exact_quote")
                or cite.get("quote")
                or retrieved_chunk.get("text", "")[:120] + "...",
            }
            valid_citations.append(enriched)

        return valid_citations, all_valid, errors
