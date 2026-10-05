"""Security API endpoints router."""

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from src.schemas.security import (
    PIIScanRequest,
    PIIScanResponse,
    InjectionCheckRequest,
    InjectionCheckResponse,
    FileSecurityCheckResponse,
    ThreatModelResponse,
    QualityGateResponse,
)
from src.services.pii_scanner import pii_scanner
from src.services.injection_guard import injection_guard
from src.services.file_security import file_security, PathTraversalError
from src.services.threat_engine import threat_engine

router = APIRouter(prefix="/api/security", tags=["Security & Privacy"])


@router.post("/scan-pii", response_model=PIIScanResponse)
def scan_pii(request: PIIScanRequest):
    """Scans text for personal identifiable information (PII) and performs masking/redaction."""
    return pii_scanner.scan_text(
        text=request.text,
        mask_mode=request.mask_mode,
        source_name=request.source_name or "api_request",
    )


@router.post("/check-injection", response_model=InjectionCheckResponse)
def check_injection(request: InjectionCheckRequest):
    """Inspects prompt inputs and context chunks for adversarial injections and jailbreaks."""
    return injection_guard.inspect_prompt(
        prompt=request.prompt, context=request.context
    )


@router.post("/upload-check", response_model=FileSecurityCheckResponse)
async def check_file_upload(file: UploadFile = File(...)):
    """Verifies file upload security (extension whitelist, magic bytes, Zip Slip, size limits)."""
    content = await file.read()
    result = file_security.inspect_file(
        filename=file.filename or "upload.bin",
        content_bytes=content,
        declared_mime=file.content_type,
    )
    if not result.is_safe:
        raise HTTPException(
            status_code=400,
            detail={
                "error_code": "INSECURE_FILE_UPLOAD_BLOCKED",
                "message": "Tệp tin bị từ chối do vi phạm chính sách bảo mật.",
                "violations": result.violation_codes,
                "sanitized_filename": result.sanitized_filename,
            },
        )
    return result


@router.get("/download-safe")
def download_safe_resource(
    path: str = Query(..., description="Đường dẫn tương đối của tài nguyên cần đọc"),
):
    """Attempts to read a sandboxed resource, enforcing Path Traversal defense."""
    try:
        safe_path = file_security.validate_safe_path(path)
        if not safe_path.exists():
            raise HTTPException(
                status_code=404, detail=f"Không tìm thấy tài nguyên: {path}"
            )
        return {
            "status": "SUCCESS",
            "resolved_path": str(safe_path),
            "is_sandboxed": True,
        }
    except PathTraversalError as pte:
        raise HTTPException(
            status_code=403,
            detail={
                "error_code": "PATH_TRAVERSAL_BLOCKED",
                "message": str(pte),
                "attempted_path": path,
            },
        )


@router.get("/threat-model", response_model=ThreatModelResponse)
def get_threat_model():
    """Returns the full STRIDE threat model status for CyberSoft Data & AI Lab."""
    return threat_engine.get_threat_model()


@router.get("/quality-gate", response_model=QualityGateResponse)
def evaluate_quality_gate():
    """Evaluates the Security Quality Gate to determine if software release is allowed."""
    return threat_engine.evaluate_quality_gate()
