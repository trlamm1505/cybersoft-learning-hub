"""Unit tests for RuleEvaluator."""

from src.rule_evaluator import RuleEvaluator


def test_extract_citations():
    evaluator = RuleEvaluator()
    text = "Theo quy định tại [CS-POL-001] và đồ án [CS-POL-003], lưu ý không được [REDACTED]."
    cites = evaluator.extract_citations(text)
    assert cites == ["CS-POL-001", "CS-POL-003"]
    assert "REDACTED" not in cites


def test_check_abstention():
    evaluator = RuleEvaluator()
    assert evaluator.check_abstention("Tôi từ chối trả lời câu hỏi này.") is True
    assert evaluator.check_abstention("Câu hỏi ngoài phạm vi học liệu.") is True
    assert (
        evaluator.check_abstention("Quy định chuyên cần là 80%.", status="ANSWERED")
        is False
    )
    assert evaluator.check_abstention("Bất kỳ nội dung nào", status="ABSTAIN") is True
    assert (
        evaluator.check_abstention("Bất kỳ nội dung nào", status="GUARD_BLOCKED")
        is True
    )


def test_evaluate_sample_valid_answer():
    evaluator = RuleEvaluator()
    res = evaluator.evaluate_sample(
        query_id="Q1",
        generated_answer="Học viên phải tham gia chuyên cần tối thiểu 80% theo tài liệu CS-POL-003.",
        expected_behavior="ANSWER",
        retrieved_doc_or_chunk_ids=["CS-POL-003"],
        expected_doc_or_chunk_ids=["CS-POL-003"],
        ground_truth_keywords=["chuyên cần", "80%"],
        tutor_status="ANSWERED",
        provided_citations=["CS-POL-003"],
    )
    assert res.passed is True
    assert res.abstention_correct is True
    assert res.citation_precision == 1.0
    assert len(res.hallucinated_citations) == 0


def test_evaluate_sample_hallucination_detected():
    evaluator = RuleEvaluator()
    res = evaluator.evaluate_sample(
        query_id="Q2",
        generated_answer="Theo tài liệu [CS-FAKE-999], học viên được miễn thi.",
        expected_behavior="ANSWER",
        retrieved_doc_or_chunk_ids=["CS-POL-001"],
        expected_doc_or_chunk_ids=["CS-POL-001"],
        tutor_status="ANSWERED",
    )
    assert res.passed is False
    assert len(res.hallucinated_citations) == 1
    assert "CS-FAKE-999" in res.hallucinated_citations
