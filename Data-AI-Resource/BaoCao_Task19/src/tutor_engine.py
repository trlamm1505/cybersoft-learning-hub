"""CyberSoft AI Tutor Core Engine (Task 19)
Orchestrates the 6-stage Grounded Generation & Abstention pipeline:
1. Input Guardrail: Block prompt injections, jailbreaks, secret probing.
2. Retrieval: Fetch relevant chunks via Retriever v0.2 (BM25 + Dense + RRF + Reranker).
3. Abstention Gate: Evaluate confidence & out-of-scope conditions.
4. Grounded Synthesis: Extractive pedagogical generation with strict citations.
5. Output Guardrail & Citation Verifier: Audit chunk_ids and sanitize secrets/PII.
6. Response Packaging: Deliver standardized TutorResponseDTO.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from .guardrails import AbstentionGate, InputGuardrail, OutputGuardrail
from .hybrid_retriever import HybridRetriever
from .llm_client import LLMClientAdapter, TutorResponseDTO

logger = logging.getLogger("cybersoft.ai_tutor")


class CyberSoftAITutor:
    """The production-ready AI Tutor Engine for CyberSoft Academy."""

    def __init__(
        self,
        retriever: Optional[HybridRetriever] = None,
        indexes_dir: Optional[Path] = None,
        similarity_threshold: float = 0.35,
    ):
        if retriever is not None:
            self.retriever = retriever
        elif indexes_dir is not None and Path(indexes_dir).exists():
            self.retriever = HybridRetriever.from_artifacts(Path(indexes_dir))
        else:
            default_indexes = Path(__file__).resolve().parent.parent / "indexes"
            if default_indexes.exists():
                self.retriever = HybridRetriever.from_artifacts(default_indexes)
            else:
                self.retriever = None

        self.input_guardrail = InputGuardrail()
        self.abstention_gate = AbstentionGate(similarity_threshold=similarity_threshold)
        self.output_guardrail = OutputGuardrail()
        self.llm_adapter = LLMClientAdapter()
        self.similarity_threshold = similarity_threshold

    def ask(
        self,
        query: str,
        top_k: int = 3,
        category: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> TutorResponseDTO:
        """Process a learner query through the 6-stage grounded pipeline."""
        # Sanitize query for logging (prevent secret leakage in logs)
        safe_query_log = OutputGuardrail.sanitize_text(query)
        logger.info(f"Received query: {safe_query_log[:100]}...")

        # ----------------------------------------------------
        # STAGE 1: INPUT GUARDRAIL
        # ----------------------------------------------------
        guard_res = self.input_guardrail.check(query)
        if not guard_res.passed:
            return TutorResponseDTO(
                status="GUARD_BLOCKED",
                answer=(
                    f"CẢNH BÁO AN TOÀN HỆ THỐNG: Yêu cầu của bạn đã bị chặn bởi lớp bảo vệ CyberSoft AI Guardrails. "
                    f"Lý do: {guard_res.reason}"
                ),
                citations=[],
                confidence_score=0.0,
                abstain_reason=guard_res.reason,
                guardrail_status={
                    "passed": False,
                    "triggered_rules": [guard_res.category or "unknown_threat"],
                    "risk_level": guard_res.risk_level,
                },
            )

        # ----------------------------------------------------
        # STAGE 2: HYBRID RETRIEVAL (Retriever v0.2)
        # ----------------------------------------------------
        retrieved_chunks: List[Dict[str, Any]] = []
        if self.retriever is not None:
            raw_results = self.retriever.search(
                query=query,
                top_k=top_k,
                mode="reranked",
                category=category,
                document_id=document_id,
            )
            # Transform results to dictionary representation
            for res in raw_results:
                if isinstance(res, dict):
                    citation = res.get("citation", {})
                    if isinstance(citation, dict):
                        doc_id = citation.get("document_id", "CS-DOC")
                        title = citation.get("title", "")
                        breadcrumbs = citation.get("breadcrumbs", "")
                        category_val = citation.get("category", "")
                        snippet = citation.get("content_snippet", "")
                    else:
                        doc_id = getattr(citation, "document_id", "CS-DOC")
                        title = getattr(citation, "title", "")
                        breadcrumbs = getattr(citation, "breadcrumbs", "")
                        category_val = getattr(citation, "category", "")
                        snippet = getattr(citation, "content_snippet", "")

                    chunk_data = {
                        "chunk_id": res.get("chunk_id", ""),
                        "score": res.get("score", 0.0),
                        "rerank_score": res.get("rerank_score", res.get("score", 0.0)),
                        "document_id": doc_id,
                        "title": title,
                        "breadcrumbs": breadcrumbs,
                        "category": category_val,
                        "text": snippet,
                    }
                else:
                    chunk_data = {
                        "chunk_id": res.chunk_id,
                        "score": res.score,
                        "rerank_score": getattr(res, "rerank_score", res.score),
                        "document_id": res.citation.document_id,
                        "title": res.citation.title,
                        "breadcrumbs": res.citation.breadcrumbs,
                        "category": res.citation.category,
                        "text": res.citation.content_snippet,
                    }
                retrieved_chunks.append(chunk_data)

        # ----------------------------------------------------
        # STAGE 3: ABSTENTION GATE
        # ----------------------------------------------------
        abs_res = self.abstention_gate.evaluate(query, retrieved_chunks)
        if abs_res.should_abstain:
            return TutorResponseDTO(
                status="ABSTAIN",
                answer=(
                    "Kính gửi học viên, CyberSoft AI Tutor rất tiếc hiện chưa tìm thấy thông tin phù hợp "
                    "trong kho tài liệu học liệu chính thức để giải đáp chính xác câu hỏi này. "
                    "Để đảm bảo tính chính xác và tránh nhầm lẫn, hệ thống xin phép từ chối trả lời. "
                    "Bạn vui lòng kiểm tra lại câu hỏi hoặc trao đổi trực tiếp với Giảng viên/Mentor phụ trách lớp học nhé."
                ),
                citations=[],
                confidence_score=abs_res.confidence_score,
                abstain_reason=abs_res.reason,
                guardrail_status={
                    "passed": True,
                    "triggered_rules": ["abstention_triggered"],
                },
            )

        # ----------------------------------------------------
        # STAGE 4: GROUNDED SYNTHESIS (Zero-hallucination Extractive)
        # ----------------------------------------------------
        response_dto = self.llm_adapter.generate(
            query=query,
            retrieved_chunks=retrieved_chunks,
            confidence_score=abs_res.confidence_score,
        )

        # ----------------------------------------------------
        # STAGE 5: OUTPUT GUARDRAIL & CITATION VERIFICATION
        # ----------------------------------------------------
        valid_citations, all_valid, errors = OutputGuardrail.verify_citations(
            response_dto.citations, retrieved_chunks
        )
        response_dto.citations = valid_citations

        # Sanitize any accidental secrets/PII in the answer
        response_dto.answer = OutputGuardrail.sanitize_text(response_dto.answer)

        # If any citation was hallucinated, downgrade confidence and note it
        if not all_valid:
            response_dto.guardrail_status["citation_validation_errors"] = errors
            response_dto.confidence_score = max(
                0.1, response_dto.confidence_score - 0.2
            )

        return response_dto

    def evaluate_adversarial(self, test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run batch evaluation against adversarial testset and measure resistance rate."""
        total = len(test_cases)
        passed_defense = 0
        details = []

        for tc in test_cases:
            tid = tc.get("id", "UNK")
            query = tc.get("query", "")
            cat = tc.get("category", "")
            expected_action = tc.get("expected_action", "GUARD_BLOCKED")

            resp = self.ask(query)

            # Defense is successful if system either blocked or abstained safely
            is_safe = False
            if expected_action == "GUARD_BLOCKED" and resp.status == "GUARD_BLOCKED":
                is_safe = True
            elif expected_action == "ABSTAIN" and resp.status == "ABSTAIN":
                is_safe = True
            elif resp.status in ["GUARD_BLOCKED", "ABSTAIN"]:
                # Safely prevented unauthorized output
                is_safe = True

            if is_safe:
                passed_defense += 1

            details.append(
                {
                    "id": tid,
                    "category": cat,
                    "query": query,
                    "expected_action": expected_action,
                    "actual_status": resp.status,
                    "defense_passed": is_safe,
                    "reason": resp.abstain_reason or "Blocked by guardrail",
                }
            )

        defense_rate = (passed_defense / total) * 100.0 if total > 0 else 0.0
        return {
            "total_tests": total,
            "passed_defense": passed_defense,
            "failed_defense": total - passed_defense,
            "defense_rate_percent": round(defense_rate, 2),
            "test_details": details,
        }
