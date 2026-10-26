"""Router API cho hệ thống Quality Gate & QA Harness (Task 27).

File này làm gì:
- Tiếp nhận các yêu cầu kiểm định chất lượng tài nguyên (/evaluate/dataset, /evaluate/rag, /evaluate/content).
- Cung cấp điểm kiểm tra sức khỏe (/health) và kiểm định phát hành tổng thể (/gate/release-check).

Nhận vào:
- Mã định danh tài nguyên cần kiểm tra hoặc ReleaseGateRequest.

Trả ra:
- Phản hồi dạng RegistryEnvelope chứa kết quả chi tiết từng gate và audit trail.
"""

from typing import List, Optional
from fastapi import APIRouter, Query

from ..config import SERVICE_NAME, VERSION
from ..schemas.qa_gate import (
    ErrorDetail,
    RegistryEnvelope,
    ReleaseGateRequest,
)
from ..services.qa_gate_service import (
    BypassRejectedError,
    qa_gate_service,
)

router = APIRouter(tags=["QA Quality Gate Engine"])


@router.get("/health", response_model=RegistryEnvelope)
def health_check():
    """Kiểm tra trạng thái hoạt động của cổng QA Gate."""
    return RegistryEnvelope(
        success=True,
        data={
            "status": "UP",
            "service": SERVICE_NAME,
            "version": VERSION,
            "qa_harness_connected": True,
        },
        meta={"timestamp": "2026-10-06T00:00:00Z"},
    )


@router.get("/api/v1/qa/rules", response_model=RegistryEnvelope)
def get_qa_rules():
    """Lấy danh sách bộ quy tắc chất lượng được thống nhất với QA."""
    return RegistryEnvelope(
        success=True,
        data={
            "rules_count": len(qa_gate_service.rules),
            "rules": qa_gate_service.rules,
        },
    )


@router.get("/api/v1/qa/fixtures-summary", response_model=RegistryEnvelope)
def get_fixtures_summary():
    """Tổng hợp danh mục tài nguyên sẵn sàng kiểm định."""
    return RegistryEnvelope(
        success=True,
        data={
            "datasets_available": list(qa_gate_service.datasets.keys()),
            "benchmarks_available": list(qa_gate_service.benchmarks.keys()),
            "contents_available": list(qa_gate_service.contents.keys()),
        },
    )


@router.post("/api/v1/qa/evaluate/dataset", response_model=RegistryEnvelope)
def evaluate_dataset(dataset_id: str = Query(..., description="ID của dataset cần kiểm định")):
    """Kiểm định chất lượng dataset: Schema, bản ghi mồ côi và rò rỉ PII/Secret."""
    res = qa_gate_service.evaluate_dataset_gate(dataset_id)
    return RegistryEnvelope(success=True, data=res.model_dump())


@router.post("/api/v1/qa/evaluate/rag", response_model=RegistryEnvelope)
def evaluate_rag(benchmark_id: str = Query(..., description="ID của RAG benchmark cần kiểm định")):
    """Kiểm định chất lượng RAG: Điểm trung thực (faithfulness), độ phủ (context recall) và độ trễ."""
    res = qa_gate_service.evaluate_rag_gate(benchmark_id)
    return RegistryEnvelope(success=True, data=res.model_dump())


@router.post("/api/v1/qa/evaluate/content", response_model=RegistryEnvelope)
def evaluate_content(content_id: str = Query(..., description="ID của bài giảng cần kiểm tra")):
    """Kiểm định sư phạm: Tiêu đề, mô tả và liên kết trong bài giảng."""
    res = qa_gate_service.evaluate_content_gate(content_id)
    return RegistryEnvelope(success=True, data=res.model_dump())


@router.post("/api/v1/qa/gate/release-check", response_model=RegistryEnvelope)
def evaluate_release_gate(req: ReleaseGateRequest):
    """Đánh giá chốt chặn phát hành tổng thể thực thi Zero Silent Bypass."""
    try:
        response = qa_gate_service.evaluate_release(req)
        return RegistryEnvelope(success=True, data=response.model_dump())
    except BypassRejectedError as bre:
        return RegistryEnvelope(
            success=False,
            error=ErrorDetail(
                code="BYPASS_REJECTED",
                message=bre.message,
                suggested_action=bre.actionable_fix,
            ),
        )


@router.get("/api/v1/qa/audit-trail", response_model=RegistryEnvelope)
def get_audit_trail():
    """Truy xuất nhật ký kiểm toán bypass phục vụ minh bạch và hậu kiểm."""
    logs = qa_gate_service.get_audit_trail()
    return RegistryEnvelope(
        success=True,
        data={
            "total_records": len(logs),
            "records": [l.model_dump() for l in logs],
        },
    )
