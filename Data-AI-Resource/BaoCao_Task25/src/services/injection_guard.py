"""Prompt Injection Defense & Jailbreak Guard Service.

Detects and neutralizes adversarial prompt injections including direct override,
roleplay jailbreaks (DAN), system prompt leakage, delimiter hijacking,
and indirect markdown exfiltration payloads.
"""

from typing import List, Optional
from src.config import PROMPT_INJECTION_INDICATORS
from src.schemas.security import (
    InjectionIndicator,
    InjectionCheckResponse,
)


class InjectionGuardService:
    """Engine to inspect prompt inputs and retrieval chunks for adversarial manipulation."""

    def inspect_prompt(
        self, prompt: str, context: Optional[str] = None
    ) -> InjectionCheckResponse:
        full_text_to_scan = prompt
        if context:
            full_text_to_scan = f"{prompt}\n\n[CONTEXT]:\n{context}"

        indicators: List[InjectionIndicator] = []
        attack_categories = set()
        highest_severity = "LOW"

        for ind in PROMPT_INJECTION_INDICATORS:
            pattern = ind["pattern"]
            matches = list(pattern.finditer(full_text_to_scan))
            for m in matches:
                snippet = m.group(0)
                category = ind["category"]
                severity = ind["severity"]

                attack_categories.add(category)
                indicators.append(
                    InjectionIndicator(
                        category=category,
                        severity=severity,
                        matched_snippet=snippet,
                        description=ind["description"],
                    )
                )

                if severity == "CRITICAL":
                    highest_severity = "CRITICAL"
                elif severity == "HIGH" and highest_severity != "CRITICAL":
                    highest_severity = "HIGH"

        is_injection = len(indicators) > 0

        # Determine defense action
        if highest_severity in ("CRITICAL", "HIGH"):
            action_taken = "BLOCK"
        elif is_injection:
            action_taken = "FLAG"
        else:
            action_taken = "ALLOW"

        # Sanitize prompt by neutralizing delimiter hijacking and exfiltration links
        sanitized = prompt
        if is_injection:
            for ind in indicators:
                if ind.category == "DELIMITER_HIJACK":
                    sanitized = sanitized.replace(
                        ind.matched_snippet, "[FILTERED_DELIMITER]"
                    )
                elif ind.category == "INDIRECT_DATA_EXFIL":
                    sanitized = sanitized.replace(
                        ind.matched_snippet, "[FILTERED_EXFIL_PAYLOAD]"
                    )

        return InjectionCheckResponse(
            is_injection_detected=is_injection,
            risk_level=highest_severity if is_injection else "LOW",
            attack_categories=sorted(list(attack_categories)),
            indicators=indicators,
            action_taken=action_taken,
            sanitized_prompt=sanitized,
        )


injection_guard = InjectionGuardService()
