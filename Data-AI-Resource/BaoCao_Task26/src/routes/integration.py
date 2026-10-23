"""Router API tích hợp Learning Platform (Task 26).

File này làm gì:
- Tiếp nhận các yêu cầu HTTP từ Learning Platform (TTS 02).
- Cung cấp điểm kiểm tra sức khỏe (/health), tra cứu danh mục, thẩm định hợp đồng và phân giải bài tập.

Nhận vào:
- HTTP GET query params (role, type, domain, status, search) hoặc payload POST JSON (AssignmentResolve/Validate).

Trả ra:
- Phản hồi dạng RegistryEnvelope chuẩn hóa chứa data hoặc error detail.
"""

from typing import Optional
from fastapi import APIRouter, Query

from ..config import SERVICE_NAME, VERSION
from ..schemas.integration import (
    AssignmentResolveRequest,
    AssignmentValidateRequest,
    ErrorDetail,
    RegistryEnvelope,
)
from ..services.integration_service import (
    VersionResolutionError,
    integration_service,
)

# Router chính gồm cả health check và các endpoint tích hợp
router = APIRouter(tags=["Learning Platform Integration"])


@router.get("/health", response_model=RegistryEnvelope)
def health_check():
    """Kiểm tra trạng thái hoạt động của gateway tích hợp."""
    return RegistryEnvelope(
        success=True,
        data={
            "status": "UP",
            "service": SERVICE_NAME,
            "version": VERSION,
            "cross_product_ready": True,
        },
        meta={"timestamp": "2026-10-06T00:00:00Z"},
    )


@router.get("/api/v1/integration/catalog", response_model=RegistryEnvelope)
def get_catalog(
    role: Optional[str] = Query(None, description="Lọc theo đối tượng đào tạo"),
    type: Optional[str] = Query(None, description="Lọc theo loại tài nguyên"),
    domain: Optional[str] = Query(None, description="Lọc theo lĩnh vực"),
    status_filter: Optional[str] = Query(
        "ACTIVE", alias="status", description="Trạng thái tài nguyên"
    ),
    search: Optional[str] = Query(None, description="Từ khóa tìm kiếm"),
):
    """Tra cứu danh mục tài nguyên Data & AI với các bộ lọc linh hoạt."""
    items = integration_service.list_catalog(
        role=role,
        resource_type=type,
        domain=domain,
        status=status_filter,
        search=search,
    )
    return RegistryEnvelope(
        success=True,
        data={
            "total_count": len(items),
            "items": [item.model_dump() for item in items],
        },
        meta={
            "filter": {
                "role": role,
                "type": type,
                "status": status_filter,
                "search": search,
            }
        },
    )


@router.get(
    "/api/v1/integration/resources/{resource_id}", response_model=RegistryEnvelope
)
def get_resource_detail(resource_id: str):
    """Lấy chi tiết schema và thẩm định hợp đồng dữ liệu của tài nguyên."""
    res = integration_service.get_resource(resource_id)
    if not res:
        return RegistryEnvelope(
            success=False,
            error=ErrorDetail(
                code="RESOURCE_NOT_FOUND",
                message=f"Tài nguyên '{resource_id}' không tồn tại trong registry.",
                suggested_action="Xem danh mục tài nguyên khả dụng tại GET /api/v1/integration/catalog",
            ),
        )

    is_valid, errs = integration_service.validate_dataset_contract(res)
    return RegistryEnvelope(
        success=True,
        data=res.model_dump(),
        meta={"contract_valid": is_valid, "contract_issues": errs},
    )


@router.get(
    "/api/v1/integration/resources/{resource_id}/versions",
    response_model=RegistryEnvelope,
)
def get_resource_versions(resource_id: str):
    """Lấy danh sách các phiên bản đã phát hành của tài nguyên."""
    versions = integration_service.get_versions(resource_id)
    if not versions:
        return RegistryEnvelope(
            success=False,
            error=ErrorDetail(
                code="RESOURCE_NOT_FOUND",
                message=f"Không tìm thấy lịch sử phiên bản cho tài nguyên '{resource_id}'.",
            ),
        )
    return RegistryEnvelope(
        success=True,
        data={"resource_id": resource_id, "versions": versions},
    )


@router.post("/api/v1/integration/assignments/resolve", response_model=RegistryEnvelope)
def resolve_assignment(req: AssignmentResolveRequest):
    """Phân giải và khóa bài tập theo snapshot hash để bài thi độc lập với thay đổi tương lai."""
    try:
        resolved = integration_service.resolve_assignment(req)
        return RegistryEnvelope(
            success=True,
            data=resolved.model_dump(),
            meta={
                "assignment_lock": True,
                "client": "Learning-Hub",
                "class_id": req.class_id,
            },
        )
    except VersionResolutionError as ve:
        return RegistryEnvelope(
            success=False,
            error=ErrorDetail(
                code=ve.code,
                message=ve.message,
                details=ve.details,
                suggested_action=ve.suggested_action,
            ),
        )


@router.post(
    "/api/v1/integration/assignments/validate", response_model=RegistryEnvelope
)
def validate_assignment(req: AssignmentValidateRequest):
    """Xác thực tính toàn vẹn snapshot của bài tập đang được học viên làm."""
    val_res = integration_service.validate_assignment(req)
    return RegistryEnvelope(
        success=True,
        data=val_res.model_dump(),
    )


@router.get("/api/v1/integration/contract-summary", response_model=RegistryEnvelope)
def get_contract_summary():
    """Tổng hợp tình trạng tuân thủ Data Contract của toàn bộ tài nguyên."""
    items = integration_service.list_catalog(status=None)
    summary = []
    for it in items:
        valid, issues = integration_service.validate_dataset_contract(it)
        summary.append(
            {
                "resource_id": it.resource_id,
                "type": it.type,
                "current_version": it.current_version,
                "published_versions": it.published_versions,
                "contract_valid": valid,
                "contract_issues": issues,
            }
        )
    return RegistryEnvelope(
        success=True,
        data={"total_resources": len(summary), "contracts": summary},
    )
