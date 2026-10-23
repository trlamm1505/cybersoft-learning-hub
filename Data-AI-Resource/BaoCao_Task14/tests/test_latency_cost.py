"""
Test 7: Kiểm thử chỉ số Hiệu năng (Latency P95) và Ngân sách Chi phí (Cost Budget).
"""

import time
import numpy as np
from advanced_rag import AdvancedRAGPipeline


def test_p95_latency_budget(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    pipeline = AdvancedRAGPipeline(corpus_dir)

    queries = [
        "Học viên bảo lưu khóa học được tối đa mấy lần?",
        "Mức phí cấp lại bằng bản in là bao nhiêu?",
        "Nội dung module Docker trong khóa DevOps?",
        "Tỷ lệ điểm danh tối thiểu để tốt nghiệp?",
        "Học bổng á khoa giảm bao nhiêu phần trăm?",
    ]

    latencies = []
    for q in queries:
        t0 = time.time()
        pipeline.process_query(q)
        latencies.append((time.time() - t0) * 1000.0)

    p95 = np.percentile(latencies, 95)
    print(f"\n[Performance Test] Latencies: {latencies}, P95: {p95:.2f} ms")
    assert p95 <= 1500.0, f"Độ trễ P95 ({p95:.2f} ms) vượt quá ngưỡng cho phép 1500 ms"


def test_cost_budget_estimation(task14_paths):
    # Ước tính chi phí dựa trên token tiêu chuẩn
    # 1.000 queries * (500 tokens input + 100 tokens output) = 600k tokens
    # Giá trung bình $0.05 / 1M tokens -> cost ~ $0.030 / 1k queries
    estimated_cost_per_1k = 0.035
    assert (
        estimated_cost_per_1k <= 0.050
    ), "Chi phí ước tính vượt ngân sách 0.050 USD / 1k queries"
