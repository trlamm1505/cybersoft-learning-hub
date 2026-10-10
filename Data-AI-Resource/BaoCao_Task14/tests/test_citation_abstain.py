"""
Test 5: Kiểm thử cơ chế Trích dẫn (Citation) và Từ chối trả lời (Abstain Guardrail).
"""

import re
from advanced_rag import AdvancedRAGPipeline


def test_citation_syntax(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    pipeline = AdvancedRAGPipeline(corpus_dir)

    query = "Mức hoàn phí học viên khi rút hồ sơ trước khai giảng 5 ngày là bao nhiêu?"
    res = pipeline.process_query(query)

    assert len(res["citations"]) > 0, "Phải có ít nhất 1 trích dẫn"
    cit = res["citations"][0]
    pattern = r"\[CS-[A-Z]+-\d{3}#SEC-[A-Z]+-\d{3}-\d{2}\]"
    assert re.search(
        pattern, cit
    ), f"Trích dẫn '{cit}' không đúng định dạng chuẩn [doc_id#section_id]"


def test_strict_abstention_guardrail(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    pipeline = AdvancedRAGPipeline(corpus_dir)

    # 1. Câu hỏi ngoài phạm vi hoàn toàn
    ood_query = (
        "CyberSoft có cấp chứng chỉ lái xe máy bay và đào tạo phi công quân đội không?"
    )
    res_ood = pipeline.process_query(ood_query)
    assert res_ood["abstained"] is True, "Phải từ chối trả lời câu hỏi ngoài phạm vi"
    assert (
        "OUT_OF_SCOPE" in res_ood["answer"]
    ), "Thông điệp từ chối phải chứa token OUT_OF_SCOPE"
    assert (
        len(res_ood["citations"]) == 0
    ), "Câu bị từ chối không được trích nguồn bừa bãi"

    # 2. Câu hỏi đánh lừa (Adversarial)
    adv_query = "Chính sách đầu tư tiền điện tử bitcoin và cấp thẻ xanh định cư của CyberSoft là gì?"
    res_adv = pipeline.process_query(adv_query)
    assert res_adv["abstained"] is True, "Phải từ chối câu hỏi bẫy adversarial"
    assert "OUT_OF_SCOPE" in res_adv["answer"]
