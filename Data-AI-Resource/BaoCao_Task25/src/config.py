"""Configuration module for CyberSoft Security & Privacy Guard (Task 25).

Defines security policies, PII detection regular expressions, allowed MIME types,
file upload size limits, safe directory paths, and prompt injection signatures.
"""

from pathlib import Path
import re

# Base directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
PAYLOADS_DIR = DATA_DIR / "test_payloads"
PORTAL_DIR = BASE_DIR / "portal"
SECURE_SANDBOX_DIR = DATA_DIR / "sandbox"

# Server configuration
DEFAULT_HOST = "127.0.0.1"
DEFAULT_PORT = 8000

# File upload limits
MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit to prevent DoS
ALLOWED_EXTENSIONS = {".json", ".csv", ".md", ".txt", ".parquet"}
DANGEROUS_EXTENSIONS = {
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".php",
    ".py",
    ".js",
    ".vbs",
    ".dll",
    ".so",
    ".bin",
    ".scr",
    ".msi",
    ".ps1",
    ".jar",
}

ALLOWED_MIME_TYPES = {
    "application/json",
    "text/csv",
    "text/plain",
    "text/markdown",
    "application/x-parquet",
    "application/octet-stream",  # For parquet/binaries if verified
}

# Vietnamese & International PII Regular Expressions
PII_PATTERNS = {
    "phone_vn": {
        "pattern": re.compile(
            r"(?<!\d)(?:\+84[\s.-]?|0)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])(?:[\s.-]?[0-9]){7}(?!\d)"
        ),
        "description": "Số điện thoại di động Việt Nam (10 chữ số, hỗ trợ khoảng trắng, dấu chấm, gạch nối)",
        "risk": "MEDIUM",
        "redact_label": "[REDACTED_PHONE_VN]",
    },
    "email": {
        "pattern": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
        "description": "Địa chỉ thư điện tử cá nhân",
        "risk": "MEDIUM",
        "redact_label": "[REDACTED_EMAIL]",
    },
    "cccd_vn": {
        "pattern": re.compile(r"(?<!\d)0[0-9]{2}[0-3][0-9]{2}[0-9]{6}(?!\d)"),
        "description": "Căn cước công dân gắn chip Việt Nam (12 chữ số)",
        "risk": "CRITICAL",
        "redact_label": "[REDACTED_CCCD_VN]",
    },
    "cmnd_vn": {
        "pattern": re.compile(
            r"(?i)\b(?:cmnd|cmt|chứng\s*minh(?:\s*nhân\s*dân)?|số\s*cmnd|id\s*card)[\s:#-]{1,6}([0-3][0-9]{8})(?!\d)"
        ),
        "description": "Chứng minh nhân dân cũ (9 chữ số, yêu cầu từ khóa nhận diện để tránh bắt nhầm số tiền)",
        "risk": "HIGH",
        "redact_label": "[REDACTED_CMND_VN]",
    },
    "openai_api_key": {
        "pattern": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b"),
        "description": "OpenAI API Secret Key",
        "risk": "CRITICAL",
        "redact_label": "[REDACTED_OPENAI_KEY]",
    },
    "gemini_api_key": {
        "pattern": re.compile(r"\bAIza[0-9A-Za-z-_]{35}\b"),
        "description": "Google Gemini API Key",
        "risk": "CRITICAL",
        "redact_label": "[REDACTED_GEMINI_KEY]",
    },
    "jwt_token": {
        "pattern": re.compile(
            r"\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"
        ),
        "description": "JSON Web Token (JWT Bearer Token)",
        "risk": "HIGH",
        "redact_label": "[REDACTED_JWT_TOKEN]",
    },
}

# Prompt Injection & Jailbreak Signatures (Đa ngôn ngữ Anh - Việt)
PROMPT_INJECTION_INDICATORS = [
    {
        "category": "DIRECT_OVERRIDE",
        "pattern": re.compile(
            r"(?i)(?:\b(?:ignore|disregard|forget|bypass)\s+(?:all\s+)?(?:previous|prior|above|system)\s+(?:instructions|prompts|rules|directives)\b|\b(?:bỏ\s*qua|quên|phớt\s*lờ|vượt\s*qua)\s+(?:tất\s*cả\s+|toàn\s*bộ\s+)?(?:các\s+)?(?:hướng\s*dẫn|chỉ\s*thị|quy\s*tắc|lệnh)\s+(?:trước|cũ|hệ\s*thống)\b)"
        ),
        "severity": "CRITICAL",
        "description": "Chỉ thị ghi đè trực tiếp chỉ dẫn hệ thống (Song ngữ Anh - Việt)",
    },
    {
        "category": "ROLEPLAY_JAILBREAK",
        "pattern": re.compile(
            r"(?i)(?:\b(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:[a-z0-9_\s]{0,15}\s+)?(?:dan|developer\s+mode|unrestricted|evil\s+bot|an\s+ai\s+without\s+rules|aim)\b|\b(?:hãy\s*đóng\s*vai|bạn\s*bây\s*giờ\s*là|hãy\s*trở\s*thành)\s+(?:(?:một\s+|như\s+)?(?:ai|mô\s*hình|bot|trợ\s*lý)\s+)?(?:dan|tự\s*do|không\s*(?:bị\s*)?giới\s*hạn|không\s*quy\s*tắc|vô\s*hạn)\b)"
        ),
        "severity": "CRITICAL",
        "description": "Nỗ lực kích hoạt chế độ vượt rào (DAN / Developer Mode / AI không giới hạn)",
    },
    {
        "category": "SYSTEM_PROMPT_LEAK",
        "pattern": re.compile(
            r"(?i)(?:\b(?:reveal|show|print|output|display|repeat|tell\s+me)\s+(?:your\s+)?(?:system\s+prompt|initial\s+instructions|secret\s+instructions|confidential\s+rules)\b|\b(?:tiết\s*lộ|cho\s*tôi\s*xem|in\s*ra|hiển\s*thị|xuất)\s+(?:toàn\s*bộ\s+)?(?:prompt\s*hệ\s*thống|system\s*prompt|chỉ\s*dẫn\s*ban\s*đầu|lệnh\s*hệ\s*thống)\b)"
        ),
        "severity": "HIGH",
        "description": "Nỗ lực trích xuất và rò rỉ chỉ dẫn hệ thống ẩn (Song ngữ Anh - Việt)",
    },
    {
        "category": "DELIMITER_HIJACK",
        "pattern": re.compile(
            r"(?i)(?:<\|im_start\|>|<\|im_end\|>|\[SYSTEM\s+INSTRUCTION\]|```system|<system_directive>)"
        ),
        "severity": "HIGH",
        "description": "Tiêm nhiễm ký tự phân tách đặc biệt của mô hình (Delimiter Hijacking)",
    },
    {
        "category": "INDIRECT_DATA_EXFIL",
        "pattern": re.compile(
            r"(?i)\!\[(?:img|eval|ping)\]\(https?://[^\s)]+(?:\?|&)(?:exfil|leak|token|secret)"
        ),
        "severity": "HIGH",
        "description": "Tiêm mã Markdown đánh cắp dữ liệu bí mật qua kênh ngoài (Data Exfiltration)",
    },
]
