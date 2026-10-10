"""Tests verifying safe abstention on unanswerable and out-of-scope queries."""

from src.guardrails import AbstentionGate
from src.tutor_engine import CyberSoftAITutor


def test_abstention_gate_on_culinary_query():
    gate = AbstentionGate()
    res = gate.evaluate("Hướng dẫn cách nấu phở bò Hà Nội thơm ngon", [])
    assert res.should_abstain
    assert res.status == "ABSTAIN"
    assert "ẩm thực" in res.reason


def test_abstention_gate_on_financial_query():
    gate = AbstentionGate()
    res = gate.evaluate("Dự báo giá cổ phiếu Tesla và Bitcoin", [])
    assert res.should_abstain
    assert res.status == "ABSTAIN"
    assert "tài chính" in res.reason


def test_abstention_gate_on_empty_retrieval():
    gate = AbstentionGate()
    res = gate.evaluate("Một câu hỏi công nghệ chung", [])
    assert res.should_abstain
    assert res.status == "ABSTAIN"
    assert "không tìm thấy" in res.reason


def test_ai_tutor_abstains_on_out_of_scope_query(ai_tutor: CyberSoftAITutor):
    query = "Hướng dẫn cho tôi công thức làm món bún chả Hà Nội?"
    dto = ai_tutor.ask(query)

    assert dto.status == "ABSTAIN"
    assert len(dto.citations) == 0
    assert dto.abstain_reason is not None
    assert "ẩm thực" in dto.abstain_reason or "ngoài phạm vi" in dto.abstain_reason


def test_ai_tutor_abstains_on_hallucination_bait(ai_tutor: CyberSoftAITutor):
    query = "Tính năng Hyper-Quantum Docker Acceleration được dạy ở học phần nào?"
    dto = ai_tutor.ask(query)

    assert dto.status == "ABSTAIN"
    assert len(dto.citations) == 0
    assert "giả mạo" in dto.abstain_reason or "ngoài phạm vi" in dto.abstain_reason
