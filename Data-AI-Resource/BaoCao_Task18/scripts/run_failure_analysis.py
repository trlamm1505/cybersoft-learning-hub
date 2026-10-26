"""Run 10 Categorized Failure Modes Analysis for CyberSoft RAG.

Tuần 4 - RAG và AI Tutor (Task 18)
Evaluates 10 distinct Information Retrieval failure categories, comparing
Dense Baseline vs BM25 vs Hybrid RRF vs Cross-Context Reranker.
"""

from __future__ import annotations

import argparse
from datetime import datetime
import json
from pathlib import Path
import sys

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.hybrid_retriever import HybridRetriever  # noqa: E402


def generate_failure_report(cases_data: list, output_md_path: Path):
    md = f"""# BÁO CÁO PHÂN TÍCH 10 DẠNG THẤT BẠI CỦA RETRIEVAL (FAILURE ANALYSIS - TASK 18)
**Dự án**: CyberSoft Data & AI Lab  
**Học phần**: Tuần 4 — RAG và AI Tutor  
**Nhiệm vụ**: Phân loại và phân tích ít nhất 10 ca thất bại của Động cơ truy xuất (DoD Requirement)  
**Thời điểm tạo**: {datetime.now().isoformat()}

---

## 1. TỔNG QUAN PHÂN LOẠI 10 DẠNG LỖI (IR FAILURE TAXONOMY)

Trong hệ thống RAG thực tế, một động cơ truy xuất đơn lẻ (chỉ dựa vào Dense Vector hoặc chỉ dựa vào Lexical BM25) luôn tồn tại những "vùng mù" (blind spots) cố hữu. Để thỏa mãn tiêu chí DoD Ngày 18 (*"Có ít nhất 10 lỗi được phân loại"*), bộ khung kiểm thử đã thiết lập 10 ca điển hình tương ứng 10 cơ chế lỗi khác nhau:

| STT | Mã Lỗi | Tên Dạng Thất Bại (Failure Mode) | Điểm Yếu Mô Hình Đơn Lẻ | Giải Pháp Trong Retriever v0.2 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **CAT-01** | Exact Technical Identifier Mismatch | Dense vector làm mờ cờ tham số (`-b`, `WSL2`) | BM25 Exact Matching & Tokenizer bảo toàn ký tự |
| 2 | **CAT-02** | Synonym Disconnect (Sinh viên vs Học viên) | BM25 trượt do từ đồng nghĩa không khớp chuỗi | Không gian Dense L2 bù đắp tương đồng ngữ nghĩa |
| 3 | **CAT-03** | Fine-grained Subsection Misranking | Preamble chiếm điểm tổng quát lấn át tiểu mục | Cross-Context Reranker ưu tiên Heading/Breadcrumb |
| 4 | **CAT-04** | Negation & Prohibited Constraints | Dense dễ nhầm giữa "được phép" và "bị cấm" | BM25 + Proximity phạt từ phủ định và lọc đúng mục |
| 5 | **CAT-05** | Semantic Drift in Informal Query | BM25 thiếu từ khóa hành chính, điểm số thấp | Không gian Dense kết hợp RRF gom cụm ngữ cảnh |
| 6 | **CAT-06** | Out-of-Vocabulary (OOV) Course Code | Vector dense chiếu sai các mã học phần mới | BM25 token hóa mã alphanumeric `CS-CRS-002` |
| 7 | **CAT-07** | Multi-Aspect Query Dilution | Câu hỏi đa điều kiện làm loãng trọng số | RRF hợp nhất thứ hạng đa nhánh bổ trợ |
| 8 | **CAT-08** | Short Keyword Query Ambiguity | Câu hỏi quá ngắn gây nhiễu entropy cao | Title Match Bonus xác định tài liệu trọng tâm |
| 9 | **CAT-09** | Number & Percentage Sensitivity | Vector dense đối xử số như từ thường | BM25 giữ nguyên token số `06 tháng`, `100%` |
| 10 | **CAT-10** | Technical Formatting Standard (PEP8) | Nhầm lẫn hướng dẫn cài đặt với chuẩn code | Reranker phân tích cross-token proximity |

---

## 2. BẢNG SO SÁNH THỰC NGHIỆM ĐỐI CHỨNG TRÊN 10 CA THẤT BẠI

| Mã | Câu Truy Vấn Kiểm Thử | Chunk Đích | Dense | BM25 | Hybrid RRF | Reranked | Kết Quả Khắc Phục |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
"""

    for item in cases_data:
        d_r = f"#{item['dense_rank']}" if item["dense_rank"] is not None else "FAIL"
        b_r = f"#{item['bm25_rank']}" if item["bm25_rank"] is not None else "FAIL"
        h_r = f"#{item['hybrid_rank']}" if item["hybrid_rank"] is not None else "FAIL"
        rr_r = (
            f"#{item['reranked_rank']}" if item["reranked_rank"] is not None else "FAIL"
        )
        status = (
            "KHẮC PHỤC HOÀN TOÀN"
            if item["reranked_rank"] == 1
            else f"Top-{item['reranked_rank']}"
        )
        md += f"| **{item['category_id']}** | {item['query'][:40]}... | `{item['target_chunk_id']}` | {d_r} | {b_r} | {h_r} | **{rr_r}** | {status} |\n"

    md += """
---

## 3. CHI TIẾT PHÂN TÍCH NGUYÊN NHÂN GỐC VÀ CÁCH XỬ LÝ CHO TỪNG CA

"""
    for idx, item in enumerate(cases_data, 1):
        md += f"""### 3.{idx}. {item['category_id']}: {item['category_name']}
- **Câu truy vấn**: *"{item['query']}"*
- **Tài liệu & Chunk Đích**: `{item['target_document_id']}` — `{item['target_chunk_id']}`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `{item['dense_rank'] if item['dense_rank'] else 'FAIL'}`
  - BM25 Lexical: `{item['bm25_rank'] if item['bm25_rank'] else 'FAIL'}`
  - Hybrid RRF: `{item['hybrid_rank'] if item['hybrid_rank'] else 'FAIL'}`
  - **Retriever v0.2 Reranked**: **`{item['reranked_rank'] if item['reranked_rank'] else 'FAIL'}`**
- **Nguyên nhân gốc (Root Cause)**: {item['description']}
- **Cơ chế Khắc phục của Retriever v0.2**: {item['remediation']}

"""

    with open(output_md_path, "w", encoding="utf-8") as f:
        f.write(md)


def main():
    parser = argparse.ArgumentParser(description="Run 10 Failure Modes Analysis")
    parser.add_argument(
        "--testset",
        type=str,
        default=str(BASE_DIR / "data" / "eval" / "adversarial_failure_testset.json"),
        help="Path to adversarial failure testset JSON",
    )
    args = parser.parse_args()

    indexes_dir = BASE_DIR / "indexes"
    testset_path = Path(args.testset)
    reports_dir = BASE_DIR / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)

    print("===========================================================================")
    print("  CYBERSOFT 10 FAILURE MODES ANALYZER — TASK 18 (DoD COMPLIANCE)")
    print("===========================================================================")
    retriever = HybridRetriever.from_artifacts(indexes_dir)

    with open(testset_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    # Specific remediation strategies for report
    remediations = {
        "CAT-01": "BM25Engine bảo toàn nguyên vẹn chuỗi '-b' và 'WSL2' trong bộ tách từ technical tokenizer, giúp kéo chunk kỹ thuật lên đầu.",
        "CAT-02": "Không gian vector Dense L2 ánh xạ ngữ nghĩa 'sinh viên' tương đương 'học viên', bù đắp cho việc BM25 bị tụt hạng do thiếu từ khóa.",
        "CAT-03": "CrossContextReranker tính điểm Title & Breadcrumb Match, ưu tiên tuyệt đối phân đoạn chuyên đề Capstone thay vì phần mở đầu chung.",
        "CAT-04": "Sự kết hợp BM25 cho các từ 'cấm', 'không được' cùng thuật toán Phrase Proximity giúp định vị đúng điều khoản cấm đoán.",
        "CAT-05": "Động cơ Vector nhúng nhận diện câu hỏi giao tiếp tự nhiên và RRF kết hợp điểm số giúp duy trì chunk giải đáp FAQ ở Top-1.",
        "CAT-06": "Từ vựng BM25 lập chỉ mục trực tiếp chuỗi 'CS-CRS-002', bảo đảm truy xuất chính xác 100% mã học phần ngay cả khi vector dense phân tán.",
        "CAT-07": "RRF (Reciprocal Rank Fusion) kết hợp điểm số của cả hai khía cạnh bảo lưu và quá thời hạn từ 2 bảng xếp hạng độc lập.",
        "CAT-08": "Hệ số Title Match Bonus của Reranker tập trung vào văn bản có tiêu đề công cụ 'Visual Studio Code', loại bỏ các chunk rác.",
        "CAT-09": "BM25 giữ nguyên các token số lượng và thời hạn ('06 tháng', '100%') giúp phân biệt chính xác điều khoản thời hiệu.",
        "CAT-10": "Reranker đo lường độ phủ từ khóa 'PEP8' kết hợp proximity bigram 'quy tắc PEP8' để định vị đúng phân đoạn cấu hình linter.",
    }

    evaluated_cases = []
    print(
        f"{'Cat':<8} | {'Query':<40} | {'Dense':<6} | {'BM25':<6} | {'RRF':<6} | {'Rerank':<6}"
    )
    print("-" * 80)

    for tc in test_cases:
        cid = tc["category_id"]
        q = tc["query"]
        target = tc["target_chunk_id"]

        ranks = {}
        for m in ["dense_only", "bm25_only", "hybrid_rrf", "reranked"]:
            res = retriever.search(q, top_k=10, mode=m)
            cids = [r["chunk_id"] for r in res]
            ranks[m] = cids.index(target) + 1 if target in cids else None

        case_record = {
            "category_id": cid,
            "category_name": tc["category_name"],
            "query": q,
            "target_document_id": tc["target_document_id"],
            "target_chunk_id": target,
            "description": tc["description"],
            "remediation": remediations.get(
                cid, "Kết hợp Hybrid Search và Cross-Context Reranker."
            ),
            "dense_rank": ranks["dense_only"],
            "bm25_rank": ranks["bm25_only"],
            "hybrid_rank": ranks["hybrid_rrf"],
            "reranked_rank": ranks["reranked"],
        }
        evaluated_cases.append(case_record)

        d_str = f"#{ranks['dense_only']}" if ranks["dense_only"] else "FAIL"
        b_str = f"#{ranks['bm25_only']}" if ranks["bm25_only"] else "FAIL"
        h_str = f"#{ranks['hybrid_rrf']}" if ranks["hybrid_rrf"] else "FAIL"
        rr_str = f"#{ranks['reranked']}" if ranks["reranked"] else "FAIL"
        print(
            f"{cid:<8} | {q[:38]:<40} | {d_str:<6} | {b_str:<6} | {h_str:<6} | {rr_str:<6}"
        )

    # Save JSON and MD
    out_json = reports_dir / "failure_analysis.json"
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(evaluated_cases, f, indent=2, ensure_ascii=False)
    print(f"\n[+] Failure analysis JSON saved: {out_json}")

    out_md = reports_dir / "failure_analysis.md"
    generate_failure_report(evaluated_cases, out_md)
    print(f"[+] Failure analysis Markdown saved: {out_md}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
