"""Dịch vụ tích hợp danh mục và phân giải phiên bản bài tập (Task 26).

File này làm gì:
- Tra cứu, tìm kiếm và phân loại danh mục tài nguyên Data & AI.
- Thẩm định hợp đồng dữ liệu (Data Contract) chống thiếu trường hoặc sai kiểu dữ liệu.
- Phân giải phiên bản bài tập thành snapshot hash bất biến để chống trôi phiên bản khi giảng viên giao bài.

Nhận vào:
- Tiêu chí lọc danh mục (role, type, domain, status, search).
- Mã tài nguyên và phiên bản bài tập yêu cầu (requested_version).

Trả ra:
- Danh sách CatalogItem chuẩn hóa cho Learning Hub.
- Snapshot hash SHA-256 kèm thông báo cảnh báo nếu phiên bản đã bị deprecated.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from ..config import CATALOG_PATH, VERSION_REGISTRY_PATH
from ..schemas.integration import (
    AssignmentResolveRequest,
    AssignmentResolveResponse,
    AssignmentValidateRequest,
    AssignmentValidateResponse,
    CatalogItem,
)

# Tái sử dụng: Tham chiếu kho dữ liệu mẫu chuẩn từ Task 21
try:
    from BaoCao_Task21.src.services.registry_service import (
        DATASETS_STORE as T21_DATASETS,
    )
except ImportError:
    T21_DATASETS = {}


class VersionResolutionError(Exception):
    """Lỗi khi không tìm thấy tài nguyên hoặc phiên bản bài tập."""

    def __init__(
        self, code: str, message: str, details: Dict[str, Any], suggested_action: str
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details
        self.suggested_action = suggested_action


class IntegrationService:
    def __init__(self) -> None:
        self.catalog: Dict[str, CatalogItem] = {}
        self.version_registry: Dict[str, Dict[str, Any]] = {}
        self._load_catalog()

    def _load_catalog(self) -> None:
        # Tải danh mục chuẩn hóa từ catalog.json
        if CATALOG_PATH.exists():
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                raw_items = json.load(f)
                self.catalog = {
                    it["resource_id"]: CatalogItem(**it) for it in raw_items
                }

        # Tải sổ đăng ký phiên bản
        if VERSION_REGISTRY_PATH.exists():
            with open(VERSION_REGISTRY_PATH, "r", encoding="utf-8") as f:
                self.version_registry = json.load(f)

    def list_catalog(
        self,
        role: Optional[str] = None,
        resource_type: Optional[str] = None,
        domain: Optional[str] = None,
        status: Optional[str] = "ACTIVE",
        search: Optional[str] = None,
    ) -> List[CatalogItem]:
        # Lọc danh mục theo tiêu chí để Learning Platform hiển thị đúng đối tượng
        items = list(self.catalog.values())
        if status:
            items = [i for i in items if i.status.upper() == status.upper()]
        if role:
            items = [
                i for i in items if role.upper() in [r.upper() for r in i.target_roles]
            ]
        if resource_type:
            items = [i for i in items if i.type.lower() == resource_type.lower()]
        if domain:
            items = [i for i in items if i.domain.lower() == domain.lower()]
        if search:
            q = search.lower()
            items = [
                i
                for i in items
                if q in i.name.lower()
                or q in i.description.lower()
                or q in i.resource_id.lower()
                or any(q in t.lower() for t in i.tags)
            ]
        return items

    def get_resource(self, resource_id: str) -> Optional[CatalogItem]:
        return self.catalog.get(resource_id)

    def get_versions(self, resource_id: str) -> Optional[Dict[str, Any]]:
        return self.version_registry.get(resource_id)

    def validate_dataset_contract(self, item: CatalogItem) -> Tuple[bool, List[str]]:
        # Kiểm tra tính toàn vẹn của hợp đồng dữ liệu trước khi công bố
        errors: List[str] = []
        if not item.resource_id:
            errors.append("Thiếu resource_id.")
        if not item.name:
            errors.append("Thiếu name.")
        if not item.current_version:
            errors.append("Thiếu current_version.")

        if item.type == "dataset":
            if not item.data_dictionary:
                errors.append("Dataset phải có ít nhất 1 bảng trong data_dictionary.")
            else:
                for table in item.data_dictionary:
                    if not table.columns:
                        errors.append(f"Bảng '{table.table_name}' không có cột nào.")
        elif item.type == "evaluation_set":
            if not item.total_questions or item.total_questions <= 0:
                errors.append("evaluation_set phải có total_questions > 0.")
        elif item.type == "project_template":
            if not item.starter_repo_url:
                errors.append("project_template phải có starter_repo_url.")

        return len(errors) == 0, errors

    def resolve_assignment(
        self, req: AssignmentResolveRequest
    ) -> AssignmentResolveResponse:
        # Khóa phiên bản bài tập bằng snapshot hash để bài thi không bị biến động
        resource = self.get_resource(req.resource_id)
        if not resource:
            raise VersionResolutionError(
                code="RESOURCE_NOT_FOUND",
                message=f"Tài nguyên '{req.resource_id}' không tồn tại trong Registry.",
                details={"resource_id": req.resource_id},
                suggested_action="Kiểm tra lại mã định danh qua GET /api/v1/integration/catalog.",
            )

        target_ver = (
            resource.current_version
            if req.requested_version == "latest"
            else req.requested_version
        )
        versions_map = self.get_versions(req.resource_id) or {}

        if target_ver not in versions_map:
            raise VersionResolutionError(
                code="VERSION_NOT_FOUND",
                message=f"Phiên bản '{target_ver}' không tồn tại cho '{req.resource_id}'.",
                details={
                    "requested_version": target_ver,
                    "available_versions": resource.published_versions,
                    "current_version": resource.current_version,
                },
                suggested_action=f"Sử dụng phiên bản khả dụng: {', '.join(resource.published_versions)}.",
            )

        ver_meta = versions_map[target_ver]
        status_flag = ver_meta.get("status", "ACTIVE")

        # Cảnh báo hành động được nếu dùng phiên bản cũ đã bị deprecate
        if status_flag == "DEPRECATED":
            suggested = ver_meta.get("suggested_version", resource.current_version)
            reason = ver_meta.get("deprecated_reason", "Phiên bản đã cũ.")
            raise VersionResolutionError(
                code="VERSION_DEPRECATED",
                message=f"Phiên bản '{target_ver}' đã ngưng hỗ trợ (DEPRECATED): {reason}",
                details={
                    "requested_version": target_ver,
                    "deprecated_reason": reason,
                    "suggested_version": suggested,
                },
                suggested_action=f"Nâng cấp lên phiên bản '{suggested}' trước khi giao bài.",
            )

        return AssignmentResolveResponse(
            resource_id=resource.resource_id,
            resource_name=resource.name,
            resolved_version=target_ver,
            status=status_flag,
            snapshot_hash=ver_meta.get("snapshot_hash", ""),
            data_dictionary=resource.data_dictionary,
            sandbox_metadata={
                "db_schema": resource.sandbox_schema or "public",
                "total_rows": ver_meta.get("total_rows", 0),
                "read_only_access": True,
                "is_read_only": True,
            },
            assigned_at=datetime.now(timezone.utc).isoformat(),
            is_immutable_locked=True,
            compatibility_guarantee="Bài tập được khóa snapshot bất biến chống trôi phiên bản.",
        )

    def validate_assignment(
        self, req: AssignmentValidateRequest
    ) -> AssignmentValidateResponse:
        # Xác thực snapshot hash của bài tập đã giao có khớp với registry không
        resource = self.get_resource(req.resource_id)
        if not resource:
            return AssignmentValidateResponse(
                valid=False,
                resource_id=req.resource_id,
                assigned_version=req.assigned_version,
                current_registry_version="UNKNOWN",
                is_hash_matching=False,
                version_drift_detected=True,
                message=f"Tài nguyên '{req.resource_id}' không còn tồn tại.",
            )

        versions_map = self.get_versions(req.resource_id) or {}
        assigned_meta = versions_map.get(req.assigned_version)
        if not assigned_meta:
            return AssignmentValidateResponse(
                valid=False,
                resource_id=req.resource_id,
                assigned_version=req.assigned_version,
                current_registry_version=resource.current_version,
                is_hash_matching=False,
                version_drift_detected=True,
                message=f"Phiên bản '{req.assigned_version}' không tìm thấy trong lịch sử phiên bản.",
            )

        expected_hash = assigned_meta.get("snapshot_hash", "")
        hash_matches = expected_hash == req.snapshot_hash
        version_drift = resource.current_version != req.assigned_version

        msg = (
            "Khớp dữ liệu hoàn hảo."
            if hash_matches and not version_drift
            else (
                f"Lưu ý: Registry đã nâng cấp lên {resource.current_version}. Học viên vẫn chạy an toàn trên snapshot đã khóa {req.assigned_version}."
                if hash_matches
                else "Lệch snapshot hash: bài tập có nguy cơ đã bị sửa đổi trái phép."
            )
        )

        return AssignmentValidateResponse(
            valid=hash_matches,
            resource_id=req.resource_id,
            assigned_version=req.assigned_version,
            current_registry_version=resource.current_version,
            is_hash_matching=hash_matches,
            version_drift_detected=version_drift,
            message=msg,
        )


# Singleton instance dùng chung
integration_service = IntegrationService()
catalog_service = integration_service
version_resolver = integration_service
contract_validator = integration_service
