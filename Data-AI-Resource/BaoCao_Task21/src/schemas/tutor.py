"""Schemas for AI Tutor RAG Chat endpoints."""

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """A single turn in conversational history."""

    role: str = Field(..., description="Vai trò phát ngôn: user | assistant | system")
    content: str = Field(..., description="Nội dung thông điệp")


class TutorChatRequest(BaseModel):
    """Payload for submitting a question to CyberSoft AI Tutor."""

    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        description="Câu hỏi hoặc yêu cầu cần trợ giảng giải đáp",
    )
    conversation_history: list[ChatMessage] | None = Field(
        default_factory=list, description="Lịch sử các lượt đối thoại trước"
    )
    top_k: int = Field(
        3,
        ge=1,
        le=10,
        description="Số lượng đoạn trích giáo trình tham chiếu làm bằng chứng",
    )
    strict_abstention: bool = Field(
        True,
        description="Kích hoạt cơ chế từ chối nghiêm ngặt nếu câu hỏi ngoài phạm vi học liệu",
    )


class CitationItem(BaseModel):
    """Structured citation reference for verifiable factual answer."""

    source_id: str = Field(..., description="Mã định danh của tài liệu trích dẫn")
    title: str = Field(..., description="Tên giáo trình hoặc quy chế đào tạo")
    section: str = Field(..., description="Tên mục hoặc chương cụ thể")
    excerpt: str = Field(
        ..., description="Đoạn văn bản trích dẫn làm chứng cứ xác thực"
    )


class TutorChatResponse(BaseModel):
    """Grounded answer from CyberSoft AI Tutor with citations and safety verification."""

    answer: str = Field(..., description="Nội dung giải đáp sư phạm của trợ giảng")
    citations: list[CitationItem] = Field(
        default_factory=list,
        description="Danh sách các trích dẫn đối chứng trong giáo trình",
    )
    status: str = Field(
        ...,
        description="Trạng thái phản hồi: ANSWERED (được trả lời) | ABSTAINED (từ chối do ngoài phạm vi) | GUARD_BLOCKED (chặn do bẫy bảo mật)",
    )
    groundedness_score: float = Field(
        ..., description="Điểm số trung thực có căn cứ của câu trả lời (0.0 đến 1.0)"
    )
    latency_ms: float = Field(
        ..., description="Thời gian xử lý từ lúc nhận đến hoàn thành phản hồi"
    )
