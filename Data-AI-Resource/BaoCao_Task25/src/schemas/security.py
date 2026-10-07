"""Pydantic schema definitions for CyberSoft Security & Privacy Guard."""

from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class PIIEntity(BaseModel):
    """Detailed detected PII entity."""

    entity_type: str = Field(
        ...,
        description="Loại thông tin riêng tư (email, phone_vn, cccd_vn, api_key...)",
    )
    raw_value: str = Field(..., description="Giá trị nguyên bản phát hiện")
    start_pos: int = Field(..., description="Vị trí bắt đầu trong văn bản")
    end_pos: int = Field(..., description="Vị trí kết thúc trong văn bản")
    masked_value: str = Field(
        ..., description="Giá trị đã được che giấu / mã hóa một phần"
    )
    risk_level: str = Field(
        ..., description="Mức độ rủi ro (CRITICAL, HIGH, MEDIUM, LOW)"
    )


class PIIScanRequest(BaseModel):
    """Request payload to scan text or dataset rows for PII."""

    text: str = Field(..., description="Văn bản hoặc chuỗi dữ liệu cần quét")
    mask_mode: str = Field(
        "mask",
        description="Chế độ xử lý: 'mask' (che 1 phần) hoặc 'redact' (thay nhãn)",
    )
    source_name: Optional[str] = Field(
        "unknown_source", description="Tên nguồn dữ liệu (dataset, prompt, chunk...)"
    )


class PIIScanResponse(BaseModel):
    """Response payload containing detected PII and sanitized text."""

    source_name: str
    total_entities_found: int
    has_critical_pii: bool
    risk_score: int = Field(..., description="Điểm rủi ro tổng hợp (0 - 100)")
    entities: List[PIIEntity]
    sanitized_text: str
    is_safe_for_demo: bool


class InjectionCheckRequest(BaseModel):
    """Request to inspect prompt or retrieved context for adversarial injections."""

    prompt: str = Field(..., description="Chuỗi câu hỏi hoặc prompt của người dùng")
    context: Optional[str] = Field(
        None, description="Ngữ cảnh tài liệu hoặc đoạn chunk truy xuất từ RAG"
    )


class InjectionIndicator(BaseModel):
    """Specific matched injection indicator."""

    category: str
    severity: str
    matched_snippet: str
    description: str


class InjectionCheckResponse(BaseModel):
    """Response of prompt injection inspection."""

    is_injection_detected: bool
    risk_level: str
    attack_categories: List[str]
    indicators: List[InjectionIndicator]
    action_taken: str = Field(
        ..., description="Hành động phòng vệ: 'ALLOW', 'FLAG', 'BLOCK'"
    )
    sanitized_prompt: str


class FileUploadCheckRequest(BaseModel):
    """Request metadata for file upload verification."""

    filename: str
    content_base64: Optional[str] = None
    declared_mime: Optional[str] = None


class FileSecurityCheckResponse(BaseModel):
    """Response of file security verification."""

    filename: str
    sanitized_filename: str
    is_safe: bool
    size_bytes: int
    detected_mime: str
    violation_codes: List[str]
    action: str = Field(..., description="'ACCEPTED' hoặc 'REJECTED'")


class ThreatItem(BaseModel):
    """STRIDE Threat Model item."""

    threat_id: str
    stride_category: str
    title: str
    description: str
    component: str
    severity: str
    status: str = Field(..., description="'PATCHED', 'MITIGATED', 'OPEN'")
    mitigation_strategy: str


class ThreatModelResponse(BaseModel):
    """Full STRIDE Threat Model summary."""

    system_name: str
    total_threats: int
    stride_breakdown: Dict[str, int]
    severity_breakdown: Dict[str, int]
    quality_gate_passed: bool
    unresolved_critical_high: int
    threats: List[ThreatItem]


class QualityGateResponse(BaseModel):
    """Security Quality Gate evaluation result."""

    gate_passed: bool
    status: str
    open_critical_count: int
    open_high_count: int
    blocked_reasons: List[str]
    release_allowed: bool
