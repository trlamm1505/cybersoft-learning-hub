"""
Trình điều phối RAG Pipeline hoàn chỉnh (Capstone AI-01)
Hỗ trợ cả hai chế độ: Baseline và Advanced.
"""

import argparse
import json
import os
import sys
import time

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from baseline_rag import BaselineRAGPipeline
from advanced_rag import AdvancedRAGPipeline


def main():
    parser = argparse.ArgumentParser(description="CyberSoft RAG Solution Pipeline")
    parser.add_argument(
        "--mode",
        choices=["baseline", "advanced"],
        default="advanced",
        help="Chế độ RAG",
    )
    parser.add_argument(
        "--corpus", type=str, default="../data/corpus", help="Thư mục corpus"
    )
    parser.add_argument("--query", type=str, help="Câu hỏi đơn lẻ")
    parser.add_argument("--eval", type=str, help="Tệp test queries để đánh giá")
    parser.add_argument(
        "--out", type=str, default="submission_report.json", help="Tệp kết quả đầu ra"
    )
    args = parser.parse_args()

    corpus_path = os.path.abspath(args.corpus)
    print(
        f"[*] Khởi động RAG Pipeline chế độ: {args.mode.upper()} trên corpus: {corpus_path}"
    )

    if args.mode == "baseline":
        pipeline = BaselineRAGPipeline(corpus_path)
    else:
        pipeline = AdvancedRAGPipeline(corpus_path)

    if args.query:
        res = pipeline.process_query(args.query)
        print("\n=== KẾT QUẢ XỬ LÝ TRUY VẤN ===")
        print(f"Query: {res['query']}")
        print(f"Answer: {res['answer']}")
        print(f"Citations: {res['citations']}")
        print(f"Abstained: {res['abstained']}")
        print(f"Latency: {res['latency_ms']} ms")
    elif args.eval:
        eval_path = os.path.abspath(args.eval)
        with open(eval_path, "r", encoding="utf-8") as f:
            queries = json.load(f)

        print(f"[*] Bắt đầu xử lý đánh giá {len(queries)} câu hỏi...")
        results = []
        start_all = time.time()
        for idx, q in enumerate(queries):
            r = pipeline.process_query(q["query"])
            r["question_id"] = q["question_id"]
            r["category"] = q.get("category", "")
            r["type"] = q.get("type", "")
            results.append(r)
            if (idx + 1) % 25 == 0:
                print(f"    - Tiến độ: {idx + 1}/{len(queries)} câu hoàn tất...")

        total_time = time.time() - start_all
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        print(
            f"[SUCCESS] Hoàn thành đánh giá {len(results)} câu trong {total_time:.2f} giây."
        )
        print(f"[+] Kết quả lưu tại: {os.path.abspath(args.out)}")
    else:
        print("[!] Vui lòng truyền --query hoặc --eval. Xem --help.")


if __name__ == "__main__":
    main()
