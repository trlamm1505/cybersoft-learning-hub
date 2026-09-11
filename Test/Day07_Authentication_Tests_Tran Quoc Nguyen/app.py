from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, status
from pydantic import BaseModel

app = FastAPI(title="Day 07 - Authentication & Authorization Mock API", version="0.1.0")

# Chỉ dùng cho mock/local training. Không phải secret production.
DEMO_SECRET = os.getenv("DAY07_DEMO_SECRET", "demo-only-secret-never-use-in-production")

USERS = {
    "stu_a": {"id": "stu_a", "role": "student", "class_id": "class_a", "name": "Student A"},
    "stu_a2": {"id": "stu_a2", "role": "student", "class_id": "class_a", "name": "Student A2"},
    "stu_b": {"id": "stu_b", "role": "student", "class_id": "class_b", "name": "Student B"},
    "teacher_a": {"id": "teacher_a", "role": "teacher", "class_id": "class_a", "name": "Teacher A"},
    "teacher_b": {"id": "teacher_b", "role": "teacher", "class_id": "class_b", "name": "Teacher B"},
    "admin": {"id": "admin", "role": "admin", "class_id": None, "name": "Admin"},
}

SUBMISSIONS = {
    "sub_a1": {"id": "sub_a1", "user_id": "stu_a", "class_id": "class_a", "exercise_id": "ex_a", "score": 8},
    "sub_a2": {"id": "sub_a2", "user_id": "stu_a2", "class_id": "class_a", "exercise_id": "ex_a", "score": 9},
    "sub_b1": {"id": "sub_b1", "user_id": "stu_b", "class_id": "class_b", "exercise_id": "ex_b", "score": 7},
}

EXERCISES = {
    "ex_a": {"id": "ex_a", "class_id": "class_a", "title": "Quiz A"},
    "ex_b": {"id": "ex_b", "class_id": "class_b", "title": "Quiz B"},
}


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(text: str) -> bytes:
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def issue_token(user_id: str, expires_in: int = 3600) -> str:
    """Tạo token HMAC đơn giản chỉ để test local. Không phải JWT production."""
    payload = {
        "sub": user_id,
        "exp": int(time.time()) + expires_in,
        "iat": int(time.time()),
    }
    payload_part = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(DEMO_SECRET.encode("utf-8"), payload_part.encode("ascii"), hashlib.sha256).digest()
    return f"{payload_part}.{_b64encode(signature)}"


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload_part, signature_part = token.split(".", 1)
        expected = hmac.new(DEMO_SECRET.encode("utf-8"), payload_part.encode("ascii"), hashlib.sha256).digest()
        actual = _b64decode(signature_part)
        if not hmac.compare_digest(expected, actual):
            raise ValueError("signature")
        payload = json.loads(_b64decode(payload_part).decode("utf-8"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_INVALID", "message": "Token is invalid."},
        ) from exc

    if int(payload.get("exp", 0)) <= int(time.time()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "TOKEN_EXPIRED", "message": "Token has expired."},
        )
    return payload


def sanitize_headers(headers: dict[str, str]) -> dict[str, str]:
    """Redact header nhạy cảm trước khi ghi log."""
    safe = dict(headers)
    for key in list(safe.keys()):
        if key.lower() in {"authorization", "cookie", "set-cookie"}:
            safe[key] = "[REDACTED]"
    return safe


def auth_error(code: str, message: str, status_code: int = 403):
    raise HTTPException(status_code=status_code, detail={"code": code, "message": message})


def get_current_user(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    if not authorization:
        auth_error("AUTH_REQUIRED", "Authorization header is required.", 401)
    if not authorization.startswith("Bearer "):
        auth_error("AUTH_SCHEME_INVALID", "Bearer token is required.", 401)

    token = authorization[7:]
    payload = decode_token(token)
    user = USERS.get(payload.get("sub"))
    if not user:
        auth_error("USER_NOT_FOUND", "Token subject does not map to an active user.", 401)
    return user


def ensure_class_access(user: dict[str, Any], class_id: str) -> None:
    if user["role"] == "admin":
        return
    if user.get("class_id") != class_id:
        auth_error("CROSS_CLASS_FORBIDDEN", "User cannot access another class.")


def require_role(user: dict[str, Any], allowed: set[str]) -> None:
    if user["role"] not in allowed:
        auth_error("ROLE_FORBIDDEN", "Role is not allowed to perform this action.")


class ExerciseCreate(BaseModel):
    title: str


@app.get("/me")
def me(user: dict[str, Any] = Depends(get_current_user)):
    return {"id": user["id"], "role": user["role"], "class_id": user.get("class_id")}


@app.get("/classes/{class_id}/students/{student_id}/profile")
def get_student_profile(class_id: str, student_id: str, user: dict[str, Any] = Depends(get_current_user)):
    ensure_class_access(user, class_id)
    student = USERS.get(student_id)
    if not student or student["role"] != "student" or student.get("class_id") != class_id:
        raise HTTPException(status_code=404, detail={"code": "STUDENT_NOT_FOUND", "message": "Student not found."})

    if user["role"] == "student" and user["id"] != student_id:
        auth_error("OWNERSHIP_FORBIDDEN", "Student may only view their own profile.")
    return {"id": student["id"], "name": student["name"], "class_id": student["class_id"]}


@app.get("/classes/{class_id}/submissions/{submission_id}")
def get_submission(class_id: str, submission_id: str, user: dict[str, Any] = Depends(get_current_user)):
    ensure_class_access(user, class_id)
    submission = SUBMISSIONS.get(submission_id)
    if not submission or submission["class_id"] != class_id:
        raise HTTPException(status_code=404, detail={"code": "SUBMISSION_NOT_FOUND", "message": "Submission not found."})

    if user["role"] == "student" and submission["user_id"] != user["id"]:
        auth_error("IDOR_BLOCKED", "Student cannot access another user's submission.")
    return submission


@app.post("/classes/{class_id}/exercises", status_code=201)
def create_exercise(class_id: str, body: ExerciseCreate, user: dict[str, Any] = Depends(get_current_user)):
    ensure_class_access(user, class_id)
    require_role(user, {"teacher", "admin"})
    return {"id": f"new_{class_id}", "class_id": class_id, "title": body.title}


@app.delete("/classes/{class_id}/exercises/{exercise_id}", status_code=204)
def delete_exercise(class_id: str, exercise_id: str, user: dict[str, Any] = Depends(get_current_user)):
    ensure_class_access(user, class_id)
    require_role(user, {"admin"})
    return None


@app.get("/admin/audit")
def admin_audit(user: dict[str, Any] = Depends(get_current_user)):
    require_role(user, {"admin"})
    return {"status": "ok", "events": 3}
