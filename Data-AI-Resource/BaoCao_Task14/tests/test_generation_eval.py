"""
Test 4: Kiểm thử độc lập tầng Generation (Faithfulness & Groundedness).
"""

from advanced_rag import AdvancedRAGPipeline


def test_generation_groundedness(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    pipeline = AdvancedRAGPipeline(corpus_dir)

    # Test trên 1 câu hỏi cụ thể về bảo lưu
    sample_query = "Điều kiện về thời lượng hoàn thành để học viên được quyền nộp đơn xin bảo lưu khóa học tại CyberSoft là gì?"
    result = pipeline.process_query(sample_query)

    assert result["abstained"] is False, "Câu hỏi chính quy không được từ chối trả lời"
    assert len(result["citations"]) > 0, "Câu trả lời bắt buộc phải có trích dẫn nguồn"
    assert (
        "CS-POL-001" in result["citations"][0]
    ), "Nguồn trích dẫn phải chứa CS-POL-001"
    assert len(result["answer"]) > 20, "Câu trả lời phải có nội dung đầy đủ"
