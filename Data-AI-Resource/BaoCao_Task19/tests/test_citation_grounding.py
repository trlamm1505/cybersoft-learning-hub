"""Tests verifying zero hallucination citations and grounded generation."""

from src.llm_client import ExtractiveGroundedSynthesizer
from src.tutor_engine import CyberSoftAITutor


def test_extractive_synthesizer_generates_valid_citations():
    synth = ExtractiveGroundedSynthesizer()
    chunks = [
        {
            "chunk_id": "CS-POL-001_hdr_001",
            "document_id": "CS-POL-001",
            "title": "Chính sách chuyên cần",
            "text": "Sinh viên vắng mặt tối đa 3 buổi có phép. Nếu vắng quá số buổi quy định sẽ bị cấm thi.",
        }
    ]
    query = "Sinh viên được vắng tối đa bao nhiêu buổi?"
    dto = synth.synthesize(query, chunks, confidence_score=0.92)

    assert dto.status == "ANSWERED"
    assert len(dto.citations) == 1
    assert dto.citations[0]["chunk_id"] == "CS-POL-001_hdr_001"
    assert "CS-POL-001_hdr_001" in dto.answer
    assert dto.confidence_score > 0.8


def test_ai_tutor_answers_grounded_query_with_valid_citations(
    ai_tutor: CyberSoftAITutor,
):
    query = "Quy định bảo lưu khóa học tại CyberSoft như thế nào?"
    dto = ai_tutor.ask(query, top_k=3)

    assert dto.status == "ANSWERED"
    assert len(dto.citations) > 0

    # Ensure every citation chunk_id is legitimate and matches CyberSoft documents
    for cite in dto.citations:
        assert cite["chunk_id"].startswith("CS-") or cite["chunk_id"].startswith("chk_")
        assert len(cite["exact_quote"]) > 0
