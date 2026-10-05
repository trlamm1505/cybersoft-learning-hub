"""PII Scanner & Privacy Masking Service.

Detects sensitive personally identifiable information (PII) including
Vietnamese mobile phone numbers, emails, CCCD/CMND numbers, OpenAI and Gemini API keys,
and JWT tokens. Provides partial masking and complete redaction capabilities.
"""

from typing import List, Tuple
from src.config import PII_PATTERNS
from src.schemas.security import PIIEntity, PIIScanResponse


def mask_string(raw: str, pii_type: str) -> str:
    """Produces partially masked representation of sensitive data."""
    if pii_type == "phone_vn":
        if raw.startswith("+84") and len(raw) >= 11:
            return raw[:5] + "***" + raw[-3:]
        if len(raw) >= 10:
            return raw[:4] + "***" + raw[-3:]
        return raw[:2] + "***" + raw[-2:]

    elif pii_type == "email":
        parts = raw.split("@")
        if len(parts) == 2:
            user, domain = parts
            masked_user = user[0] + "***" if len(user) > 1 else "*"
            return f"{masked_user}@{domain}"
        return "***@***"

    elif pii_type == "cccd_vn":
        if len(raw) == 12:
            return raw[:3] + "******" + raw[-3:]
        return raw[:2] + "********" + raw[-2:]

    elif pii_type == "cmnd_vn":
        if len(raw) == 9:
            return raw[:2] + "*****" + raw[-2:]
        return "*********_MASKED"

    elif pii_type in ("openai_api_key", "gemini_api_key"):
        prefix = raw[:7] if len(raw) > 7 else "KEY"
        return f"{prefix}...[SECRET_MASKED]"

    elif pii_type == "jwt_token":
        return "eyJ...[TOKEN_MASKED]"

    return "***MASKED***"


class PIIScannerService:
    """Engine to scan, calculate risk, and sanitize PII in texts and datasets."""

    def scan_text(
        self, text: str, mask_mode: str = "mask", source_name: str = "dataset_source"
    ) -> PIIScanResponse:
        entities: List[PIIEntity] = []
        spans_to_replace: List[Tuple[int, int, str]] = []
        has_critical = False
        calculated_score = 0

        for pii_type, meta in PII_PATTERNS.items():
            pattern = meta["pattern"]
            risk = meta["risk"]
            redact_label = meta["redact_label"]

            for match in pattern.finditer(text):
                if match.lastindex is not None and match.lastindex >= 1:
                    raw = match.group(1)
                    start, end = match.span(1)
                else:
                    raw = match.group(0)
                    start, end = match.span()
                masked = mask_string(raw, pii_type)

                if risk == "CRITICAL":
                    has_critical = True
                    calculated_score += 40
                elif risk == "HIGH":
                    calculated_score += 25
                elif risk == "MEDIUM":
                    calculated_score += 10
                else:
                    calculated_score += 5

                replacement = redact_label if mask_mode == "redact" else masked
                spans_to_replace.append((start, end, replacement))

                entities.append(
                    PIIEntity(
                        entity_type=pii_type,
                        raw_value=raw,
                        start_pos=start,
                        end_pos=end,
                        masked_value=masked,
                        risk_level=risk,
                    )
                )

        # Cap score at 100
        risk_score = min(100, calculated_score)

        # Sort spans in reverse order so replacements do not offset indices
        spans_to_replace.sort(key=lambda x: x[0], reverse=True)
        sanitized_chars = list(text)

        for start, end, repl in spans_to_replace:
            sanitized_chars[start:end] = list(repl)

        sanitized_text = "".join(sanitized_chars)

        return PIIScanResponse(
            source_name=source_name,
            total_entities_found=len(entities),
            has_critical_pii=has_critical,
            risk_score=risk_score,
            entities=entities,
            sanitized_text=sanitized_text,
            is_safe_for_demo=(len(entities) == 0 or mask_mode in ("mask", "redact")),
        )


pii_scanner = PIIScannerService()
