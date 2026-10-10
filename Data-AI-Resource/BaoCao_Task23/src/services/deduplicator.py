"""Deduplication detection service for exercise drafts (Task 23).

Uses N-gram Jaccard Similarity and Token Set Overlap to ensure newly generated
exercises do not repeat existing questions beyond the 70% threshold.
"""

import re
from typing import Any

from src.config import DEDUPLICATION_THRESHOLD


class DeduplicationService:
    """Service to measure semantic overlap and detect duplicate exercises."""

    def __init__(self, threshold: float = DEDUPLICATION_THRESHOLD):
        self.threshold = threshold

    def _tokenize(self, text: str) -> list[str]:
        """Normalize and tokenize text into lowercase word tokens."""
        text_clean = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = [t.strip() for t in text_clean.split() if len(t.strip()) > 1]
        return tokens

    def _get_ngrams(self, tokens: list[str], n: int = 2) -> set[tuple[str, ...]]:
        """Generate set of n-grams from token list."""
        if len(tokens) < n:
            return {tuple(tokens)} if tokens else set()
        return {tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}

    def calculate_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate combined Jaccard similarity across unigrams and bigrams."""
        tokens_a = self._tokenize(text_a)
        tokens_b = self._tokenize(text_b)

        if not tokens_a or not tokens_b:
            return 0.0

        # Unigram Jaccard
        set_a1 = set(tokens_a)
        set_b1 = set(tokens_b)
        jaccard_1 = len(set_a1 & set_b1) / len(set_a1 | set_b1)

        # Bigram Jaccard
        ngrams_a = self._get_ngrams(tokens_a, 2)
        ngrams_b = self._get_ngrams(tokens_b, 2)
        if ngrams_a and ngrams_b:
            jaccard_2 = len(ngrams_a & ngrams_b) / len(ngrams_a | ngrams_b)
        else:
            jaccard_2 = jaccard_1

        # Weighted combination: 40% unigram, 60% bigram (phrases capture meaning better)
        combined = 0.4 * jaccard_1 + 0.6 * jaccard_2
        return round(combined, 4)

    def check_duplication(
        self,
        candidate_exercise: dict[str, Any],
        existing_bank: list[dict[str, Any]],
    ) -> tuple[bool, float, str | None]:
        """Check candidate exercise against existing exercise bank.

        Returns:
            (is_duplicate, max_similarity, matched_exercise_id)
        """
        cand_text = f"{candidate_exercise.get('title', '')} {candidate_exercise.get('description', '')}"

        max_sim = 0.0
        most_similar_id = None

        for ex in existing_bank:
            # Skip self comparison
            if ex.get("id") == candidate_exercise.get("id"):
                continue

            ex_text = f"{ex.get('title', '')} {ex.get('description', '')}"
            sim = self.calculate_similarity(cand_text, ex_text)

            if sim > max_sim:
                max_sim = sim
                most_similar_id = ex.get("id")

        is_duplicate = max_sim >= self.threshold
        return is_duplicate, round(max_sim, 4), most_similar_id
