"""Router API cho dịch vụ Usability Testing & Issue Tracking (Task 28).

File này làm gì:
- Cung cấp điểm kiểm tra sức khỏe (/health).
- Trả về bảng tổng hợp chỉ số trải nghiệm (/summary), backlog vấn đề (/backlog) và 5 bản vá ưu tiên (/fixes).
- Cung cấp công cụ tiện ích (/tools/localize-error, /tools/citation-copy).

Nhận vào:
- Query parameters lọc độ nghiêm trọng, raw validation errors hoặc chuỗi trích dẫn.

Trả ra:
- Dữ liệu JSON chuẩn hóa theo Pydantic schemas.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Query

from ..config import DATA_DIR
from ..schemas.usability import IssueItem, LocalizedError, ResolvedFix, UsabilitySummary
from ..services.usability_service import UsabilityService

router = APIRouter(tags=["Usability & Issue Tracking"])
service = UsabilityService(DATA_DIR)


@router.get("/health")
@router.get("/api/v1/health")
def get_health():
    """Kiểm tra trạng thái hoạt động của dịch vụ Usability Testing."""
    return {
        "status": "UP",
        "service": "CyberSoft Data & AI Lab — Usability Service (Task 28)",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
    }


@router.get("/api/v1/usability/summary", response_model=UsabilitySummary)
def get_usability_summary():
    """Tổng hợp chỉ số SUS, mức giảm time-to-find và tỉ lệ hoàn thành nhiệm vụ."""
    return service.get_summary()


@router.get("/api/v1/usability/backlog", response_model=List[IssueItem])
def get_issue_backlog(severity: str = Query(None, description="Lọc theo độ nghiêm trọng")):
    """Danh sách backlog các vấn đề phát hiện qua 5 phiên thử nghiệm."""
    issues = service.get_backlog()
    if severity:
        issues = [i for i in issues if i.severity.upper() == severity.upper()]
    return issues


@router.get("/api/v1/usability/fixes", response_model=List[ResolvedFix])
def get_resolved_fixes():
    """Danh sách 5 bản vá ưu tiên cao nhất đã hoàn thành và kiểm chứng."""
    return service.get_resolved_fixes()


@router.post("/api/v1/usability/tools/localize-error", response_model=List[LocalizedError])
def localize_error(raw_errors: List[Dict[str, Any]]):
    """Tiện ích bản vá 4: Chuyển đổi lỗi kỹ thuật Pydantic sang tiếng Việt."""
    return service.localize_pydantic_error(raw_errors)


@router.get("/api/v1/usability/tools/citation-copy")
def get_citation_copy(doc: str = Query(...), section: str = Query(...), quote: str = Query(...)):
    """Tiện ích bản vá 3: Tạo thẻ trích dẫn chuẩn 1-click."""
    formatted = service.format_citation_copy_tag(doc, section, quote)
    return {"formatted_citation": formatted, "length": len(formatted)}
