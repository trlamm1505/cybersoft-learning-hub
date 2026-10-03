"""
Khung mã nguồn khởi động (Starter Kit) cho Học viên - Capstone AI-01
Hệ thống Hỏi Đáp Tri Thức Nội Bộ CyberSoft bằng RAG
"""

import argparse
import json
import sys
import time
from typing import Dict, List, Any

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


class CyberSoftRAGPipeline:
    def __init__(self, config_path: str = "config.yaml", mode: str = "advanced"):
        self.mode = mode
        self.corpus_chunks = []
        self.vectorizer = None
        self.tfidf_matrix = None
        print(f"[*] Khởi tạo CyberSoft RAG Pipeline ở chế độ: {self.mode.upper()}")

    def ingest_and_chunk(self, corpus_dir: str):
        """
        Nhiệm vụ 1: Đọc và phân đoạn tài liệu từ corpus.
        Học viên cần triển khai:
        - Mode 'baseline': Phân đoạn cố định (fixed-size chunks: 500 chars, overlap 50).
        - Mode 'advanced': Phân đoạn theo cấu trúc ngữ nghĩa Markdown (Header/Section-aware).
        """
        print(f"[*] Đang nạp dữ liệu từ thư mục: {corpus_dir}")
        chunks = []
        # TODO: Học viên triển khai logic ingest & chunking tại đây
        self.corpus_chunks = chunks
        print(f"[+] Đã bóc tách thành công {len(self.corpus_chunks)} đoạn văn bản.")

    def build_index(self):
        """
        Nhiệm vụ 2: Xây dựng chỉ mục tìm kiếm (Dense Vector / Lexical BM25 / TF-IDF).
        """
        # TODO: Học viên triển khai index xây dựng ma trận đặc trưng
        pass

    def retrieve(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Nhiệm vụ 3: Truy xuất top_k đoạn văn bản liên quan nhất.
        Học viên cần triển khai:
        - Baseline: Top-k đơn lẻ theo vector similarity.
        - Advanced: Hybrid Retrieval (BM25 + Dense) kết hợp Reciprocal Rank Fusion (RRF).
        """
        # TODO: Học viên triển khai thuật toán truy xuất
        return []

    def generate_answer(
        self, query: str, retrieved_chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Nhiệm vụ 4 & 5: Tổng hợp câu trả lời, trích dẫn nguồn và kích hoạt cơ chế từ chối (Abstain).
        Yêu cầu:
        - Nếu câu hỏi ngoài phạm vi hoặc không đủ bằng chứng: Trả về thông báo OUT_OF_SCOPE.
        - Nếu câu hỏi hợp lệ: Trả lời kèm trích dẫn dạng Nguồn: [doc_id#section_id].
        """
        # TODO: Học viên triển khai logic prompt và trích xuất nguồn
        return {"answer": "TODO", "citations": [], "abstained": False}

    def process_query(self, query: str) -> Dict[str, Any]:
        """Quy trình hỏi đáp trọn vẹn (End-to-End)."""
        start_time = time.time()
        retrieved = self.retrieve(query, top_k=5)
        response = self.generate_answer(query, retrieved)
        latency_ms = (time.time() - start_time) * 1000.0

        return {
            "query": query,
            "answer": response["answer"],
            "citations": response["citations"],
            "abstained": response["abstained"],
            "latency_ms": round(latency_ms, 2),
            "retrieved_chunks": retrieved,
        }

    def evaluate_batch(self, test_file: str, output_file: str):
        """Chạy kiểm thử trên toàn bộ tập test queries và lưu kết quả."""
        with open(test_file, "r", encoding="utf-8") as f:
            queries = json.load(f)

        results = []
        for item in queries:
            out = self.process_query(item["query"])
            out["question_id"] = item["question_id"]
            out["category"] = item.get("category", "")
            out["type"] = item.get("type", "")
            results.append(out)

        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(
            f"[+] Đã hoàn thành đánh giá {len(results)} câu truy vấn. Kết quả lưu tại: {output_file}"
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CyberSoft RAG Starter Pipeline")
    parser.add_argument(
        "--mode",
        choices=["baseline", "advanced"],
        default="advanced",
        help="Chế độ chạy pipeline",
    )
    parser.add_argument("--query", type=str, help="Câu hỏi đơn lẻ cần kiểm thử")
    parser.add_argument(
        "--eval", type=str, help="Đường dẫn file test queries để chạy batch evaluation"
    )
    parser.add_argument(
        "--out",
        type=str,
        default="submission_report.json",
        help="File đầu ra lưu kết quả",
    )
    args = parser.parse_args()

    pipeline = CyberSoftRAGPipeline(mode=args.mode)
    pipeline.ingest_and_chunk("../data/corpus")
    pipeline.build_index()

    if args.query:
        res = pipeline.process_query(args.query)
        print("\n=== KẾT QUẢ TRẢ LỜI ===")
        print(f"Câu hỏi: {res['query']}")
        print(f"Câu trả lời: {res['answer']}")
        print(f"Trích dẫn: {res['citations']}")
        print(f"Từ chối trả lời (Abstained): {res['abstained']}")
        print(f"Độ trễ: {res['latency_ms']} ms")
    elif args.eval:
        pipeline.evaluate_batch(args.eval, args.out)
    else:
        print(
            "Vui lòng chỉ định tham số --query hoặc --eval. Xem --help để biết chi tiết."
        )
