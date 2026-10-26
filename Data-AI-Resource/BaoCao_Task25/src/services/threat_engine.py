"""Threat Modeling (STRIDE / DREAD) & Security Quality Gate Service.

Provides structured threat analysis across 6 STRIDE pillars, evaluates system components,
and enforces a hard Security Quality Gate blocking software releases if any
CRITICAL or HIGH severity security vulnerability remains unpatched.
"""

from typing import List
from src.schemas.security import (
    ThreatItem,
    ThreatModelResponse,
    QualityGateResponse,
)


DEFAULT_THREATS = [
    ThreatItem(
        threat_id="THR-01",
        stride_category="SPOOFING",
        title="Giả mạo danh tính học viên qua token bất hợp lệ",
        description="Kẻ tấn công giả mạo Bearer Token hoặc Header xác thực để truy cập kho tài nguyên độc quyền.",
        component="Auth Gateway & REST API",
        severity="HIGH",
        status="MITIGATED",
        mitigation_strategy="Xác thực chữ ký JWT đa lớp, kiểm tra thời hạn hết hạn (exp claim) và áp dụng CORS nghiêm ngặt.",
    ),
    ThreatItem(
        threat_id="THR-02",
        stride_category="TAMPERING",
        title="Đầu độc dữ liệu tri thức RAG hoặc tiêm nhiễm Prompt Injection",
        description="Chèn các câu lệnh độc hại vào file tài liệu tri thức hoặc câu hỏi học viên để chiếm quyền điều khiển LLM.",
        component="Prompt Engine & RAG Tutor",
        severity="CRITICAL",
        status="PATCHED",
        mitigation_strategy="Áp dụng InjectionGuardService: Quét và chặn đứng các mẫu chỉ thị ghi đè, DAN mode, delimiter hijacking.",
    ),
    ThreatItem(
        threat_id="THR-03",
        stride_category="TAMPERING",
        title="Can thiệp sửa đổi trái phép tài nguyên bất biến (WORM Storage)",
        description="Ghi đè tệp dữ liệu đã phát hành phá hủy tính tái lập lịch sử của các bài tập và chỉ mục.",
        component="WORM Storage & Manifests",
        severity="HIGH",
        status="PATCHED",
        mitigation_strategy="Chính sách WORM: Chặn 100% yêu cầu ghi đè với mã HTTP 409 Conflict, đối soát mã băm SHA-256 toàn vẹn.",
    ),
    ThreatItem(
        threat_id="THR-04",
        stride_category="REPUDIATION",
        title="Chỉnh sửa tài nguyên mà không lưu vết nhật ký kiểm toán",
        description="Người dùng hoặc giảng viên sửa bài tập hoặc prompt mà không thể quy trách nhiệm.",
        component="Lineage & Changelog Differ",
        severity="MEDIUM",
        status="PATCHED",
        mitigation_strategy="Theo dõi nguồn gốc Lineage DAG, Release Manifests kèm timestamp và lịch sử thay đổi tự động.",
    ),
    ThreatItem(
        threat_id="THR-05",
        stride_category="INFORMATION_DISCLOSURE",
        title="Rò rỉ thông tin cá nhân PII (SĐT, Email, CCCD) trong Dataset học tập",
        description="Các bộ dữ liệu mẫu vô tình chứa thông tin định danh cá nhân thật của học viên hoặc nhân sự.",
        component="Dataset Registry & Exercises",
        severity="CRITICAL",
        status="PATCHED",
        mitigation_strategy="Tích hợp PIIScannerService: Tự động quét và che giấu (Masking/Redacting) toàn bộ dữ liệu nhạy cảm.",
    ),
    ThreatItem(
        threat_id="THR-06",
        stride_category="INFORMATION_DISCLOSURE",
        title="Rò rỉ System Prompt ẩn và API Key bí mật qua các câu lệnh gợi ý",
        description="Học viên gửi câu lệnh thăm dò buộc mô hình in ra toàn bộ system instructions hoặc token nội bộ.",
        component="LLM Integration & Prompts",
        severity="HIGH",
        status="PATCHED",
        mitigation_strategy="Bộ lọc SYSTEM_PROMPT_LEAK chặn đứng các chuỗi trích xuất chỉ thị ẩn và che giấu API keys.",
    ),
    ThreatItem(
        threat_id="THR-07",
        stride_category="DENIAL_OF_SERVICE",
        title="Tấn công từ chối dịch vụ qua tải lên tệp dung lượng khổng lồ",
        description="Gửi các tệp tin hàng trăm megabyte làm tràn bộ nhớ và treo máy chủ FastAPI.",
        component="File Upload Gateway",
        severity="HIGH",
        status="PATCHED",
        mitigation_strategy="Giới hạn kích thước tệp cứng ở mức 10MB (MAX_UPLOAD_SIZE_BYTES) và kiểm tra Content-Length trước khi đọc.",
    ),
    ThreatItem(
        threat_id="THR-08",
        stride_category="DENIAL_OF_SERVICE",
        title="Tấn công ReDoS trên các biểu thức chính quy quét PII",
        description="Các chuỗi đầu vào độc hại gây thắt cổ chai tính toán suy biến (catastrophic backtracking).",
        component="PII Scanner Regex Engine",
        severity="MEDIUM",
        status="PATCHED",
        mitigation_strategy="Thiết kế biểu thức chính quy nguyên tử không chứa nhóm lặp lồng nhau và giới hạn độ dài chuỗi quét.",
    ),
    ThreatItem(
        threat_id="THR-09",
        stride_category="ELEVATION_OF_PRIVILEGE",
        title="Tấn công vượt thư mục (Path Traversal) đọc tệp nhạy cảm hệ điều hành",
        description="Truyền tham số '../', '\\..\\', '%2e%2e' để đọc tệp /etc/passwd hoặc C:\\Windows\\System32.",
        component="Resource Download API",
        severity="CRITICAL",
        status="PATCHED",
        mitigation_strategy="Hàm validate_safe_path() thực hiện đối soát phân giải đường dẫn nghiêm ngặt trong thư mục sandbox.",
    ),
    ThreatItem(
        threat_id="THR-10",
        stride_category="ELEVATION_OF_PRIVILEGE",
        title="Tấn công Zip Slip ghi đè tệp nhị phân ngoài sandbox qua tệp nén",
        description="Tải lên tệp zip chứa các mục có đường dẫn tương đối vượt ra ngoài thư mục đích.",
        component="Archive Extractor",
        severity="CRITICAL",
        status="PATCHED",
        mitigation_strategy="Quét kiểm tra toàn bộ namelist của ZipFile trước khi giải nén, chặn ngay lập tức nếu chứa '..'.",
    ),
]


class ThreatEngineService:
    """Service to evaluate STRIDE threats and verify Security Quality Gate."""

    def __init__(self, threats: List[ThreatItem] = None):
        self.threats = list(threats or DEFAULT_THREATS)

    def get_threat_model(self) -> ThreatModelResponse:
        stride_breakdown = {
            "SPOOFING": 0,
            "TAMPERING": 0,
            "REPUDIATION": 0,
            "INFORMATION_DISCLOSURE": 0,
            "DENIAL_OF_SERVICE": 0,
            "ELEVATION_OF_PRIVILEGE": 0,
        }
        severity_breakdown = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}

        unresolved = 0
        for t in self.threats:
            stride_breakdown[t.stride_category] = (
                stride_breakdown.get(t.stride_category, 0) + 1
            )
            severity_breakdown[t.severity] = severity_breakdown.get(t.severity, 0) + 1
            if t.severity in ("CRITICAL", "HIGH") and t.status == "OPEN":
                unresolved += 1

        return ThreatModelResponse(
            system_name="CyberSoft Data & AI Lab Ecosystem",
            total_threats=len(self.threats),
            stride_breakdown=stride_breakdown,
            severity_breakdown=severity_breakdown,
            quality_gate_passed=(unresolved == 0),
            unresolved_critical_high=unresolved,
            threats=self.threats,
        )

    def evaluate_quality_gate(self) -> QualityGateResponse:
        open_critical = [
            t for t in self.threats if t.severity == "CRITICAL" and t.status == "OPEN"
        ]
        open_high = [
            t for t in self.threats if t.severity == "HIGH" and t.status == "OPEN"
        ]

        blocked_reasons = []
        for t in open_critical:
            blocked_reasons.append(
                f"CRITICAL VULNERABILITY OPEN: [{t.threat_id}] {t.title}"
            )
        for t in open_high:
            blocked_reasons.append(
                f"HIGH VULNERABILITY OPEN: [{t.threat_id}] {t.title}"
            )

        gate_passed = len(blocked_reasons) == 0

        return QualityGateResponse(
            gate_passed=gate_passed,
            status="PASSED" if gate_passed else "BLOCKED",
            open_critical_count=len(open_critical),
            open_high_count=len(open_high),
            blocked_reasons=blocked_reasons,
            release_allowed=gate_passed,
        )


threat_engine = ThreatEngineService()
