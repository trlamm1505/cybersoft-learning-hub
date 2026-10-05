"""File Security, Path Traversal Defense & Upload Sanitizer Service.

Guarantees sandboxing against Directory Traversal (../, null bytes, double url encoding),
validates file upload extensions, inspects binary Magic Bytes to block executable disguises,
and protects against Zip Slip attacks.
"""

from pathlib import Path
import re
import zipfile
import io
from typing import List, Optional
from src.config import (
    ALLOWED_EXTENSIONS,
    DANGEROUS_EXTENSIONS,
    MAX_UPLOAD_SIZE_BYTES,
    SECURE_SANDBOX_DIR,
)
from src.schemas.security import FileSecurityCheckResponse


class PathTraversalError(Exception):
    """Raised when an illegal directory traversal attempt is detected."""

    pass


class FileSecurityService:
    """Sanitizer and security validator for paths and file uploads."""

    def __init__(self, sandbox_dir: Optional[Path] = None):
        self.sandbox_dir = (sandbox_dir or SECURE_SANDBOX_DIR).resolve()
        self.sandbox_dir.mkdir(parents=True, exist_ok=True)

    def validate_safe_path(self, requested_path: str) -> Path:
        """Validates that requested relative path strictly stays within the sandbox directory.

        Blocks '../', '..\\', null bytes, URL encoded traversal '%2e%2e', and absolute roots.
        """
        # 1. Null byte check
        if (
            "\x00" in requested_path
            or "%00" in requested_path
            or "\\u0000" in requested_path
            or "\\0" in requested_path
        ):
            raise PathTraversalError(
                "NULL_BYTE_INJECTION_DETECTED: Chuỗi đường dẫn chứa ký tự null cấm."
            )

        # 2. URL-encoded traversal check
        decoded_path = (
            requested_path.replace("%2e", ".")
            .replace("%2E", ".")
            .replace("%2f", "/")
            .replace("%2F", "/")
            .replace("%5c", "\\")
            .replace("%5C", "\\")
        )
        if ".." in decoded_path:
            raise PathTraversalError(
                "PATH_TRAVERSAL_DETECTED: Phát hiện chuỗi vượt thư mục ('..')."
            )

        # 3. Block absolute paths pointing to system roots
        if Path(requested_path).is_absolute():
            # Check if it equals or is inside sandbox_dir
            try:
                resolved = Path(requested_path).resolve()
                if not str(resolved).startswith(str(self.sandbox_dir)):
                    raise PathTraversalError(
                        f"ABSOLUTE_PATH_ESCAPED: Đường dẫn tuyệt đối nằm ngoài sandbox an toàn: {requested_path}"
                    )
            except Exception as e:
                raise PathTraversalError(f"PATH_RESOLUTION_FAILED: {str(e)}")

        # 4. Resolve relative to sandbox
        try:
            # Strip leading slashes to prevent root re-anchoring
            cleaned = requested_path.lstrip("/\\")
            full_path = (self.sandbox_dir / cleaned).resolve()

            # Check if resolved path is within sandbox
            if not str(full_path).startswith(str(self.sandbox_dir)):
                raise PathTraversalError(
                    f"SANDBOX_ESCAPED: Đường dẫn phân giải vượt ra ngoài sandbox an toàn: {full_path}"
                )
            return full_path
        except ValueError as ve:
            raise PathTraversalError(f"CROSS_DRIVE_OR_INVALID_PATH: {str(ve)}")

    def sanitize_filename(self, filename: str) -> str:
        """Strips path separators and hazardous characters from upload filename."""
        clean = Path(filename).name
        clean = clean.replace("\x00", "")
        # Remove non-whitelisted special characters
        clean = re.sub(r"[^A-Za-z0-9._-]", "_", clean)
        return clean or "unnamed_upload.dat"

    def inspect_file(
        self, filename: str, content_bytes: bytes, declared_mime: Optional[str] = None
    ) -> FileSecurityCheckResponse:
        """Comprehensive verification of uploaded file contents, size, and magic bytes."""
        violations: List[str] = []
        clean_name = self.sanitize_filename(filename)
        size = len(content_bytes)

        # 1. File Size Check (DoS Prevention)
        if size > MAX_UPLOAD_SIZE_BYTES:
            violations.append(
                "FILE_SIZE_EXCEEDED: Kích thước tệp vượt quá ngưỡng cho phép 10MB."
            )

        # 2. Dangerous Extension Check
        ext = Path(clean_name).suffix.lower()
        if ext in DANGEROUS_EXTENSIONS:
            violations.append(
                f"DANGEROUS_EXTENSION_BLOCKED: Phần mở rộng nguy hiểm ({ext}) bị cấm tải lên."
            )

        # 3. Double Extension Detection (e.g. test.csv.exe or data.json.sh)
        parts = clean_name.split(".")
        if len(parts) > 2:
            second_last = f".{parts[-2].lower()}"
            last = f".{parts[-1].lower()}"
            if last in DANGEROUS_EXTENSIONS or (
                second_last in ALLOWED_EXTENSIONS and last in DANGEROUS_EXTENSIONS
            ):
                violations.append(
                    "DOUBLE_EXTENSION_ATTACK: Phát hiện phần mở rộng kép giả mạo tệp an toàn."
                )

        # 4. Extension Whitelist Check
        if ext not in ALLOWED_EXTENSIONS and ext != ".zip":
            violations.append(
                f"UNAUTHORIZED_EXTENSION: Phần mở rộng ({ext}) không nằm trong whitelist được duyệt."
            )

        # 5. Magic Bytes / Binary Content Sniffing
        detected_mime = "application/octet-stream"

        if content_bytes.startswith(b"MZ"):
            detected_mime = "application/x-dosexec"
            violations.append(
                "EXECUTABLE_PE_MAGIC_BYTE: Tệp chứa mã thực thi Windows PE (MZ Header) giả mạo."
            )

        elif content_bytes.startswith(b"\x7fELF"):
            detected_mime = "application/x-executable"
            violations.append(
                "EXECUTABLE_ELF_MAGIC_BYTE: Tệp chứa mã thực thi Linux ELF Header giả mạo."
            )

        elif content_bytes.startswith(b"#!"):
            detected_mime = "text/x-shellscript"
            violations.append(
                "SHELL_SCRIPT_MAGIC_BYTE: Tệp chứa chuỗi shebang thực thi script máy chủ."
            )

        elif content_bytes.startswith(b"PK\x03\x04"):
            detected_mime = "application/zip"
            # Inspect Zip entries for Zip Slip attacks
            try:
                with zipfile.ZipFile(io.BytesIO(content_bytes)) as zf:
                    for entry in zf.namelist():
                        if (
                            ".." in entry
                            or entry.startswith("/")
                            or entry.startswith("\\")
                        ):
                            violations.append(
                                f"ZIP_SLIP_ATTACK_DETECTED: Tệp nén chứa entry vượt thư mục '{entry}'."
                            )
                            break
            except Exception:
                violations.append(
                    "CORRUPTED_ZIP_ARCHIVE: Tệp zip bị lỗi hoặc định dạng không hợp lệ."
                )

        elif ext == ".json":
            detected_mime = "application/json"
            stripped = content_bytes.strip()
            if not (stripped.startswith(b"{") or stripped.startswith(b"[")):
                violations.append(
                    "INVALID_JSON_STRUCTURE: Tệp có đuôi .json nhưng không bắt đầu bằng { hoặc [."
                )

        elif ext in (".csv", ".txt", ".md"):
            detected_mime = "text/plain" if ext != ".csv" else "text/csv"
            # Check for binary null bytes inside text files
            if b"\x00" in content_bytes:
                violations.append(
                    "BINARY_DATA_IN_TEXT_FILE: Tệp văn bản chứa ký tự nhị phân null nguy hiểm."
                )

        is_safe = len(violations) == 0

        return FileSecurityCheckResponse(
            filename=filename,
            sanitized_filename=clean_name,
            is_safe=is_safe,
            size_bytes=size,
            detected_mime=detected_mime,
            violation_codes=violations,
            action="ACCEPTED" if is_safe else "REJECTED",
        )


file_security = FileSecurityService()
