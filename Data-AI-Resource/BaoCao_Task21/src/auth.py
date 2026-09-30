"""Mock Authentication and Role-Based Access Control (RBAC) Module."""

from fastapi import Header, HTTPException, status

from .config import API_KEYS_STORE


def authenticate_credentials(
    x_api_key: str | None = None,
    authorization: str | None = None,
) -> dict[str, str]:
    """Validate API key or Bearer token against mock credential store."""
    token = None
    if x_api_key:
        token = x_api_key.strip()
    elif authorization:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        elif len(parts) == 1:
            token = parts[0]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTH_REQUIRED",
                "message": "Yêu cầu cung cấp thông tin xác thực qua header X-API-Key hoặc Authorization: Bearer <token>",
                "details": [
                    {
                        "field": "header",
                        "issue": "Missing X-API-Key or Authorization header",
                    }
                ],
            },
        )

    # Check in store
    if token in API_KEYS_STORE:
        user_info = API_KEYS_STORE[token].copy()
        user_info["token"] = token
        return user_info

    # Invalid credential
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_CREDENTIALS",
            "message": "Mã xác thực API Key hoặc Bearer Token không hợp lệ hoặc đã hết hạn",
            "details": [
                {
                    "field": "token",
                    "issue": f"Token '{token[:6]}...' is not recognized in system",
                }
            ],
        },
    )


def get_current_user(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict[str, str]:
    """Dependency injection to get verified active user."""
    return authenticate_credentials(x_api_key, authorization)


def get_optional_user(
    x_api_key: str | None = Header(None, alias="X-API-Key"),
    authorization: str | None = Header(None, alias="Authorization"),
) -> dict[str, str] | None:
    """Dependency injection for endpoints that accept anonymous requests but personalize when token given."""
    if not x_api_key and not authorization:
        return None
    try:
        return authenticate_credentials(x_api_key, authorization)
    except HTTPException:
        return None


def require_roles(allowed_roles: list[str]):
    """Factory dependency to enforce Role-Based Access Control."""

    def role_checker(
        x_api_key: str | None = Header(None, alias="X-API-Key"),
        authorization: str | None = Header(None, alias="Authorization"),
    ) -> dict[str, str]:
        user = authenticate_credentials(x_api_key, authorization)
        user_role = user.get("role", "guest")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN_INSUFFICIENT_PERMISSIONS",
                    "message": f"Vai trò '{user_role}' không đủ quyền truy cập tài nguyên này. Yêu cầu: {', '.join(allowed_roles)}",
                    "details": [
                        {
                            "field": "role",
                            "issue": f"Current role '{user_role}' lacks required permissions",
                        }
                    ],
                },
            )
        return user

    return role_checker
