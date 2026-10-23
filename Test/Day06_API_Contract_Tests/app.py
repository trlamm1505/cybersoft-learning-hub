from __future__ import annotations

from typing import Any
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(
    title="CyberSoft Mock Learning API",
    version="0.1.0",
    description="Mock fallback dùng cho Ngày 06 - API contract tests",
)

# -----------------------------
# Common error contract
# -----------------------------

def error_body(code: str, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or {}}}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content=error_body(
            "VALIDATION_ERROR",
            "Request data is invalid",
            {"errors": exc.errors()},
        ),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        body = exc.detail
    else:
        body = error_body("HTTP_ERROR", str(exc.detail))
    return JSONResponse(status_code=exc.status_code, content=body)


# -----------------------------
# Schemas
# -----------------------------
class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=6, max_length=64)


class LoginResponse(BaseModel):
    token: str
    token_type: str
    user_id: str
    role: str


class ResourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    type: str = Field(pattern=r"^(lesson|video|document)$")


class ResourceResponse(BaseModel):
    id: str
    name: str
    type: str
    version: int


class ExerciseCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    exercise_type: str = Field(pattern=r"^(quiz|coding)$")
    max_score: int = Field(ge=0, le=100)


class ExerciseResponse(BaseModel):
    id: str
    title: str
    exercise_type: str
    max_score: int
    published: bool


class SubmissionCreate(BaseModel):
    user_id: str = Field(min_length=1, max_length=80)
    exercise_id: str = Field(min_length=1, max_length=80)
    answer: str = Field(min_length=1, max_length=5000)


class SubmissionResponse(BaseModel):
    id: str
    user_id: str
    exercise_id: str
    status: str
    score: int | None


# -----------------------------
# Deterministic mock data
# -----------------------------
USERS = {
    "student@example.test": {
        "password": "123456",
        "user_id": "usr_seed20260908_w0_001",
        "role": "student",
    },
    "teacher@example.test": {
        "password": "123456",
        "user_id": "usr_seed20260908_w0_002",
        "role": "teacher",
    },
}

RESOURCES = {
    "res_001": {"id": "res_001", "name": "API Testing Basics", "type": "lesson", "version": 1},
}

EXERCISES = {
    "ex_001": {
        "id": "ex_001",
        "title": "Quiz API Contract",
        "exercise_type": "quiz",
        "max_score": 10,
        "published": True,
    }
}


# -----------------------------
# Auth
# -----------------------------
@app.post(
    "/auth/login",
    response_model=LoginResponse,
    responses={401: {"description": "Invalid credentials"}, 422: {"description": "Validation error"}},
)
def login(body: LoginRequest):
    user = USERS.get(body.email)
    if not user or user["password"] != body.password:
        raise HTTPException(
            401,
            detail=error_body("INVALID_CREDENTIALS", "Email or password is incorrect"),
        )
    return {
        "token": f"mock-token-{user['user_id']}",
        "token_type": "bearer",
        "user_id": user["user_id"],
        "role": user["role"],
    }


# -----------------------------
# Resource
# -----------------------------
@app.get(
    "/resources/{resource_id}",
    response_model=ResourceResponse,
    responses={404: {"description": "Resource not found"}},
)
def get_resource(resource_id: str):
    resource = RESOURCES.get(resource_id)
    if not resource:
        raise HTTPException(404, detail=error_body("RESOURCE_NOT_FOUND", "Resource not found"))
    return resource


@app.post("/resources", status_code=201, response_model=ResourceResponse)
def create_resource(body: ResourceCreate):
    return {
        "id": "res_new_001",
        "name": body.name,
        "type": body.type,
        "version": 1,
    }


# -----------------------------
# Exercise
# -----------------------------
@app.get(
    "/exercises/{exercise_id}",
    response_model=ExerciseResponse,
    responses={404: {"description": "Exercise not found"}},
)
def get_exercise(exercise_id: str):
    exercise = EXERCISES.get(exercise_id)
    if not exercise:
        raise HTTPException(404, detail=error_body("EXERCISE_NOT_FOUND", "Exercise not found"))
    return exercise


@app.post("/exercises", status_code=201, response_model=ExerciseResponse)
def create_exercise(body: ExerciseCreate):
    return {
        "id": "ex_new_001",
        "title": body.title,
        "exercise_type": body.exercise_type,
        "max_score": body.max_score,
        "published": False,
    }


# -----------------------------
# Submission
# -----------------------------
@app.post(
    "/submissions",
    status_code=201,
    response_model=SubmissionResponse,
    responses={404: {"description": "User or exercise not found"}},
)
def create_submission(body: SubmissionCreate):
    known_user_ids = {u["user_id"] for u in USERS.values()}
    if body.user_id not in known_user_ids:
        raise HTTPException(404, detail=error_body("USER_NOT_FOUND", "User not found"))
    if body.exercise_id not in EXERCISES:
        raise HTTPException(404, detail=error_body("EXERCISE_NOT_FOUND", "Exercise not found"))
    return {
        "id": "sub_new_001",
        "user_id": body.user_id,
        "exercise_id": body.exercise_id,
        "status": "submitted",
        "score": None,
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "mock-learning-api", "version": "0.1.0"}
