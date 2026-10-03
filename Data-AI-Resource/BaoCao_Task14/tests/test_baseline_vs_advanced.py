"""
Test 9: Kiểm thử so sánh định lượng trực tiếp Baseline vs Advanced RAG.
"""

from advanced_rag import AdvancedRAGPipeline
from baseline_rag import BaselineRAGPipeline


def test_baseline_vs_advanced_comparison(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    base_pipe = BaselineRAGPipeline(corpus_dir)
    adv_pipe = AdvancedRAGPipeline(corpus_dir)

    # 1. Câu hỏi đòi hỏi chính xác mã điều khoản
    query_code = "SEC-POL-001-01 quy định điều kiện bảo lưu như thế nào?"
    base_chunks = base_pipe.retrieve(query_code, top_k=5)
    adv_chunks = adv_pipe.retrieve(query_code, top_k=5)

    assert len(base_chunks) > 0
    assert len(adv_chunks) > 0
    # Advanced tìm ra đúng mã điều khoản trong section_id hoặc heading
    adv_has_code = any(
        "SEC-POL-001-01" in (c.get("section_id", "") + c.get("content", ""))
        for c in adv_chunks
    )
    assert (
        adv_has_code
    ), "Advanced RAG phải truy xuất chính xác mã điều khoản SEC-POL-001-01"

    # 2. Câu hỏi bẫy (Adversarial): Baseline trả lời liều, Advanced phải từ chối (Abstain)
    query_trap = "Thủ tục xin cấp visa định cư Mỹ và chứng chỉ phi công tại CyberSoft?"
    base_res = base_pipe.process_query(query_trap)
    adv_res = adv_pipe.process_query(query_trap)

    assert (
        adv_res["abstained"] is True
    ), "Advanced RAG bắt buộc phải kích hoạt từ chối (Abstain)"
    assert base_res["abstained"] is False, "Baseline Naive RAG mắc bẫy không từ chối"
