"""Authentication and Role-Based Access Control (RBAC) engine for Task 22."""

import uuid
from typing import Any
from fastapi import Header, HTTPException, status

from .config import MOCK_API_KEYS
from .schemas.common import ErrorDetail, ErrorEnvelope, ErrorPayload


def parse_credentials(
    x_api_key: str | None,
    authorization: str | None,
) -> tuple[str | None, str | None]:
    """Extract token or api key from headers."""
    if x_api_key:
        return x_api_key.strip(), "api_key"
    if authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1].strip(), "bearer"
    return None, None


async def get_current_user(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict[str, Any]:
    """Dependency that validates credentials and returns authenticated user context."""
    token, _ = parse_credentials(x_api_key, authorization)
    request_id = f"req-{uuid.uuid4().hex[:8]}"

    if not token:
        payload = ErrorEnvelope(
            success=False,
            error=ErrorPayload(
                code="AUTH_REQUIRED",
                message="Yêu cầu cung cấp thông tin xác thực qua header X-API-Key hoặc Authorization: Bearer <token>",
                details=[
                    ErrorDetail(
                        field="header",
                        issue="Missing X-API-Key or Authorization header",
                    )
                ],
                request_id=request_id,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=payload.model_dump(),
        )

    user_info = MOCK_API_KEYS.get(token)
    if not user_info:
        payload = ErrorEnvelope(
            success=False,
            error=ErrorPayload(
                code="INVALID_CREDENTIALS",
                message="Khóa truy cập hoặc Bearer token không hợp lệ hoặc đã hết hạn",
                details=[
                    ErrorDetail(
                        field="credentials",
                        issue=f"Invalid token: {token[:6]}***",
                    )
                ],
                request_id=request_id,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=payload.model_dump(),
        )

    return {**user_info, "token": token, "request_id": request_id}


async def get_optional_user(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict[str, Any] | None:
    """Optional user context for public endpoints."""
    token, _ = parse_credentials(x_api_key, authorization)
    if not token:
        return None
    user_info = MOCK_API_KEYS.get(token)
    if user_info:
        return {**user_info, "token": token}
    return None


def require_roles(allowed_roles: list[str]):
    """Enforce specific role access."""

    async def role_checker(
        current_user: dict[str, Any] = None,
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in allowed_roles and user_role != "admin":
            request_id = current_user.get("request_id", f"req-{uuid.uuid4().hex[:8]}")
            payload = ErrorEnvelope(
                success=False,
                error=ErrorPayload(
                    code="FORBIDDEN_INSUFFICIENT_PERMISSIONS",
                    message=f"Vai trò '{user_role}' không có quyền truy cập chức năng này. Yêu cầu: {allowed_roles}",
                    details=[
                        ErrorDetail(
                            field="role",
                            issue=f"Current role: {user_role}; Required roles: {allowed_roles}",
                        )
                    ],
                    request_id=request_id,
                ),
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=payload.model_dump(),
            )
        return current_user

    return role_checker
