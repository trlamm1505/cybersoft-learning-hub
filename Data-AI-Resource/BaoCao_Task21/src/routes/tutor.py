"""Endpoints for AI Tutor RAG Chat."""

from fastapi import APIRouter, Depends, status

from ..auth import require_roles
from ..schemas.common import SuccessEnvelope
from ..schemas.tutor import (
    TutorChatRequest,
    TutorChatResponse,
)
from ..services.tutor_service import TutorService

router = APIRouter(prefix="/tutor", tags=["AI Tutor & RAG Engine"])


@router.post(
    "/chat",
    response_model=SuccessEnvelope[TutorChatResponse],
    status_code=status.HTTP_200_OK,
    summary="Hỏi đáp thông minh với Trợ giảng AI Tutor có trích nguồn",
    description="Truy xuất kiến thức từ học liệu CyberSoft, sinh câu trả lời có trích dẫn minh chứng, tự động kích hoạt Guardrails và cơ chế từ chối khi câu hỏi ngoài phạm vi đào tạo.",
)
def chat_with_tutor(
    payload: TutorChatRequest,
    current_user: dict = Depends(
        require_roles(["student", "instructor", "qa_engineer", "admin"])
    ),
) -> SuccessEnvelope[TutorChatResponse]:
    data = TutorService.answer_question(payload)
    return SuccessEnvelope(data=data)
