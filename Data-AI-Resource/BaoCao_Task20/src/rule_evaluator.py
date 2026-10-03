"""Rule-based Deterministic Evaluator for RAG Responses.

Performs:
1. Citation syntax extraction and verification against retrieved documents
2. Hallucination detection (citations generated that do not exist in retrieved context)
3. Abstention logic and phrase validation
4. Ground-truth keyword presence and Lexical/Jaccard overlap
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
import re
from typing import Any, Dict, List, Optional, Sequence


@dataclass
class RuleEvaluationResult:
    query_id: str
    is_abstained: bool
    expected_behavior: str
    abstention_correct: bool
    cited_ids: List[str] = field(default_factory=list)
    valid_citations: List[str] = field(default_factory=list)
    hallucinated_citations: List[str] = field(default_factory=list)
    citation_precision: float = 1.0
    citation_recall: float = 1.0
    keyword_coverage: float = 1.0
    jaccard_similarity: float = 0.0
    passed: bool = True
    failure_reasons: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class RuleEvaluator:
    """Deterministic rule evaluator enforcing zero-hallucination and abstention policies."""

    CITATION_REGEX = re.compile(r"\[([A-Z0-9\-_]+)\]", re.IGNORECASE)
    ABSTAIN_SIGNALS = [
        "từ chối",
        "ngoài phạm vi",
        "không đủ dữ kiện",
        "không tìm thấy thông tin",
        "chưa tìm thấy thông tin",
        "vi phạm quy chuẩn",
        "chưa đủ thông tin",
        "rất tiếc",
        "abstain",
    ]

    def __init__(self, abstain_keywords: Optional[List[str]] = None):
        self.abstain_keywords = abstain_keywords or self.ABSTAIN_SIGNALS

    def extract_citations(self, text: str) -> List[str]:
        """Extract all bracketed citations like [CS-POL-001] or [CS-CRS-001_hdr_000]."""
        raw_matches = self.CITATION_REGEX.findall(text)
        filtered = []
        for m in raw_matches:
            upper = m.upper()
            if upper not in [
                "REDACTED",
                "ERROR",
                "NOTE",
                "WARNING",
                "TIP",
                "IMPORTANT",
            ]:
                filtered.append(m)
        seen = set()
        unique = []
        for f in filtered:
            if f not in seen:
                seen.add(f)
                unique.append(f)
        return unique

    def check_abstention(self, text: str, status: Optional[str] = None) -> bool:
        """Check if response represents an abstention."""
        if status and status.upper() in [
            "ABSTAIN",
            "REJECT",
            "REFUSE",
            "GUARD_BLOCKED",
            "BLOCKED",
        ]:
            return True
        if status and status.upper() == "ANSWERED":
            return False
        text_lower = text.lower()
        return any(kw in text_lower for kw in self.abstain_keywords)

    def compute_jaccard_overlap(self, text_a: str, text_b: str) -> float:
        """Compute token-level Jaccard similarity."""
        tokens_a = set(re.findall(r"\w+", text_a.lower()))
        tokens_b = set(re.findall(r"\w+", text_b.lower()))
        if not tokens_a or not tokens_b:
            return 0.0
        intersection = tokens_a.intersection(tokens_b)
        union = tokens_a.union(tokens_b)
        return len(intersection) / len(union)

    def evaluate_sample(
        self,
        query_id: str,
        generated_answer: str,
        expected_behavior: str,
        retrieved_doc_or_chunk_ids: Sequence[str],
        expected_doc_or_chunk_ids: Sequence[str],
        ground_truth_keywords: Optional[Sequence[str]] = None,
        ground_truth_answer: Optional[str] = None,
        tutor_status: Optional[str] = None,
        provided_citations: Optional[Sequence[str]] = None,
    ) -> RuleEvaluationResult:
        """Perform comprehensive deterministic rule checks on a single generated response."""
        is_abstained = self.check_abstention(generated_answer, tutor_status)
        expected_abstain = expected_behavior.upper() in ["ABSTAIN", "REJECT"]
        abstention_correct = is_abstained == expected_abstain

        failure_reasons: List[str] = []
        if not abstention_correct:
            if expected_abstain:
                failure_reasons.append(
                    "Failed to abstain on an out-of-domain/adversarial query."
                )
            else:
                failure_reasons.append(
                    "Unexpected abstention on an answerable educational query."
                )

        # Extract citations
        extracted_citations = (
            list(provided_citations)
            if provided_citations
            else self.extract_citations(generated_answer)
        )
        retrieved_set = set(retrieved_doc_or_chunk_ids)

        valid_citations = []
        hallucinated_citations = []

        for cite in extracted_citations:
            is_valid = False
            if cite in retrieved_set:
                is_valid = True
            else:
                for r in retrieved_set:
                    if r.startswith(cite) or cite.startswith(r):
                        is_valid = True
                        break
            if is_valid:
                valid_citations.append(cite)
            else:
                hallucinated_citations.append(cite)

        if hallucinated_citations:
            failure_reasons.append(
                f"Detected hallucinated citations: {hallucinated_citations}"
            )

        # Citation precision
        if extracted_citations:
            citation_precision = len(valid_citations) / len(extracted_citations)
        else:
            citation_precision = 1.0 if is_abstained else 0.0
            if not is_abstained and expected_behavior.upper() == "ANSWER":
                failure_reasons.append(
                    "Answerable query produced no citations in response."
                )

        # Citation recall
        expected_set = set(expected_doc_or_chunk_ids)
        if expected_set and not is_abstained:
            matched_expected = 0
            for exp in expected_set:
                matched = False
                for vc in valid_citations:
                    if vc == exp or vc.startswith(exp) or exp.startswith(vc):
                        matched = True
                        break
                if matched:
                    matched_expected += 1
            citation_recall = matched_expected / len(expected_set)
        else:
            citation_recall = 1.0

        # Keywords coverage
        keyword_coverage = 1.0
        if ground_truth_keywords and not is_abstained:
            answer_lower = generated_answer.lower()
            covered = sum(
                1 for kw in ground_truth_keywords if kw.lower() in answer_lower
            )
            keyword_coverage = covered / len(ground_truth_keywords)
            if keyword_coverage < 0.5:
                failure_reasons.append(f"Low keyword coverage: {keyword_coverage:.2f}")

        # Jaccard overlap
        jaccard_sim = 0.0
        if ground_truth_answer and not is_abstained:
            jaccard_sim = self.compute_jaccard_overlap(
                generated_answer, ground_truth_answer
            )

        passed = len(failure_reasons) == 0

        return RuleEvaluationResult(
            query_id=query_id,
            is_abstained=is_abstained,
            expected_behavior=expected_behavior,
            abstention_correct=abstention_correct,
            cited_ids=extracted_citations,
            valid_citations=valid_citations,
            hallucinated_citations=hallucinated_citations,
            citation_precision=citation_precision,
            citation_recall=citation_recall,
            keyword_coverage=keyword_coverage,
            jaccard_similarity=jaccard_sim,
            passed=passed,
            failure_reasons=failure_reasons,
        )
