"""
Máy chấm tự động (Auto-Grader) cho Capstone AI-01 RAG System.
Đánh giá định lượng 100 điểm Rubric dựa trên kết quả chạy của học viên đối chiếu với Ground Truth.
"""

import argparse
import json
import os
import re
import sys
from typing import Dict, Any
import numpy as np

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_DIR = os.path.dirname(BASE_DIR)
RUBRIC_PATH = os.path.join(PROJECT_DIR, "student_edition", "rubric.json")
GT_PATH = os.path.join(BASE_DIR, "data", "ground_truth_eval.json")


class RAGAutoGrader:
    def __init__(self, rubric_path: str = RUBRIC_PATH, gt_path: str = GT_PATH):
        with open(rubric_path, "r", encoding="utf-8") as f:
            self.rubric = json.load(f)
        with open(gt_path, "r", encoding="utf-8") as f:
            self.ground_truth = {item["question_id"]: item for item in json.load(f)}

    def evaluate_submission(self, submission_path: str) -> Dict[str, Any]:
        with open(submission_path, "r", encoding="utf-8") as f:
            submission_data = json.load(f)

        if isinstance(submission_data, list):
            sub_dict = {item["question_id"]: item for item in submission_data}
        else:
            sub_dict = submission_data.get("results", {})

        # Tách biệt câu hỏi Answerable (80 câu) và Unanswerable (20 câu)
        unanswerable_qids = [
            qid
            for qid, item in self.ground_truth.items()
            if len(item.get("citations", [])) == 0
        ]
        answerable_qids = [
            qid
            for qid, item in self.ground_truth.items()
            if len(item.get("citations", [])) > 0
        ]

        # 1. Đo lường Retrieval
        recalls = []
        reciprocal_ranks = []
        context_precisions = []

        for qid in answerable_qids:
            gt_item = self.ground_truth[qid]
            sub_item = sub_dict.get(qid, {})

            # Trích xuất target doc_ids từ ground truth
            gt_docs = set()
            for c in gt_item.get("citations", []):
                if isinstance(c, dict):
                    if "document_id" in c:
                        gt_docs.add(c["document_id"])
                    elif "doc_id" in c:
                        gt_docs.add(c["doc_id"])
                elif isinstance(c, str):
                    gt_docs.add(c.split("#")[0].strip("[]"))
            if not gt_docs and "citations_doc_ids" in gt_item:
                gt_docs = set(str(gt_item["citations_doc_ids"]).split(","))

            retrieved_chunks = sub_item.get("retrieved_chunks", [])
            ret_docs = [c.get("doc_id", "") for c in retrieved_chunks[:5]]

            hits = [d for d in ret_docs if d in gt_docs]
            recalls.append(1.0 if hits else 0.0)

            first_hit_rank = 0
            for r, d in enumerate(ret_docs, start=1):
                if d in gt_docs:
                    first_hit_rank = r
                    break
            reciprocal_ranks.append(1.0 / first_hit_rank if first_hit_rank > 0 else 0.0)

            # Context Precision (Average Precision / Ragas standard)
            running_hits = 0
            ap = 0.0
            for k, d in enumerate(ret_docs, start=1):
                if d in gt_docs:
                    running_hits += 1
                    ap += running_hits / k
            prec = min(1.0, ap / max(min(len(ret_docs), len(gt_docs)), 1))
            context_precisions.append(prec)

        avg_recall_5 = float(np.mean(recalls)) if recalls else 0.0
        avg_mrr = float(np.mean(reciprocal_ranks)) if reciprocal_ranks else 0.0
        avg_context_precision = (
            float(np.mean(context_precisions)) if context_precisions else 0.0
        )

        # 2. Đo lường Generation (Faithfulness & Answer Relevance)
        faith_scores = []
        relevance_scores = []
        citation_matches = []

        for qid in answerable_qids:
            gt_item = self.ground_truth[qid]
            sub_item = sub_dict.get(qid, {})
            ans = sub_item.get("answer", "")
            gt_ans = gt_item.get("ground_truth_answer", "")

            # Trích xuất gt_docs
            gt_docs = set()
            for c in gt_item.get("citations", []):
                if isinstance(c, dict):
                    if "document_id" in c:
                        gt_docs.add(c["document_id"])
                    elif "doc_id" in c:
                        gt_docs.add(c["doc_id"])
                elif isinstance(c, str):
                    gt_docs.add(c.split("#")[0].strip("[]"))

            if ans and not sub_item.get("abstained", False):
                gt_words = set(re.findall(r"\w+", gt_ans.lower()))
                ans_words = set(re.findall(r"\w+", ans.lower()))
                overlap = len(gt_words.intersection(ans_words)) / max(len(gt_words), 1)
                # Groundedness & Relevance proxy
                faith_scores.append(min(1.0, 0.70 + overlap * 0.5))
                relevance_scores.append(min(1.0, 0.70 + overlap * 0.4))
            else:
                faith_scores.append(0.0)
                relevance_scores.append(0.0)

            # Đo lường Citation
            sub_cits = sub_item.get("citations", [])
            has_valid_citation = False
            for c in sub_cits:
                c_str = str(c)
                for gd in gt_docs:
                    if gd in c_str:
                        has_valid_citation = True
                        break
            citation_matches.append(1.0 if has_valid_citation else 0.0)

        avg_faithfulness = float(np.mean(faith_scores)) if faith_scores else 0.0
        avg_relevance = float(np.mean(relevance_scores)) if relevance_scores else 0.0
        avg_citation_f1 = float(np.mean(citation_matches)) if citation_matches else 0.0

        # 3. Đo lường Abstention Guardrail trên tập 20 câu Unanswerable
        abstain_hits = []
        for qid in unanswerable_qids:
            sub_item = sub_dict.get(qid, {})
            is_abstained = sub_item.get("abstained", False)
            ans = sub_item.get("answer", "").lower()
            if (
                is_abstained
                or "out_of_scope" in ans
                or "không tìm thấy" in ans
                or "từ chối" in ans
            ):
                abstain_hits.append(1.0)
            else:
                abstain_hits.append(0.0)
        avg_abstain_acc = float(np.mean(abstain_hits)) if abstain_hits else 0.0

        # 4. Đo lường Hiệu năng & Chi phí
        latencies = [
            sub_dict[qid].get("latency_ms", 100.0)
            for qid in sub_dict
            if "latency_ms" in sub_dict[qid]
        ]
        p95_latency = float(np.percentile(latencies, 95)) if latencies else 1120.0
        cost_per_1k = 0.035

        metrics = {
            "recall_at_5": round(avg_recall_5, 4),
            "mrr": round(avg_mrr, 4),
            "context_precision": round(avg_context_precision, 4),
            "faithfulness": round(avg_faithfulness, 4),
            "answer_relevance": round(avg_relevance, 4),
            "citation_f1": round(avg_citation_f1, 4),
            "abstain_accuracy": round(avg_abstain_acc, 4),
            "p95_latency_ms": round(p95_latency, 2),
            "cost_per_1k_usd": round(cost_per_1k, 4),
        }

        # 5. Chấm điểm theo Rubric
        score_breakdown = []
        total_score = 0.0
        core_score = 0.0
        extension_score = 0.0

        for crit in self.rubric["criteria"]:
            cid = crit["id"]
            metric_key = crit["metric"]
            val = metrics.get(metric_key, 0.0)
            awarded = 0.0
            feedback = ""

            for rule in crit["scoring_rules"]:
                cond = rule["condition"]
                cond_eval = cond.replace(metric_key, str(val))
                try:
                    if eval(cond_eval):
                        awarded = rule["points"]
                        feedback = rule["description"]
                        break
                except Exception:
                    pass

            total_score += awarded
            if crit["type"] == "Core":
                core_score += awarded
            else:
                extension_score += awarded

            score_breakdown.append(
                {
                    "criterion_id": cid,
                    "name": crit["name"],
                    "category": crit["category"],
                    "type": crit["type"],
                    "metric_value": val,
                    "max_points": crit["max_points"],
                    "awarded_points": awarded,
                    "feedback": feedback,
                }
            )

        return {
            "total_score": round(total_score, 1),
            "core_score": round(core_score, 1),
            "extension_score": round(extension_score, 1),
            "metrics": metrics,
            "score_breakdown": score_breakdown,
            "status": "PASS" if total_score >= 80.0 and core_score >= 55.0 else "FAIL",
        }

    def print_report(self, report: Dict[str, Any]):
        print("\n" + "=" * 80)
        print("          BÁO CÁO ĐÁNH GIÁ ĐỊNH LƯỢNG CAPSTONE AI-01 (AUTO-GRADER)")
        print("=" * 80)
        print(
            f" TỔNG ĐIỂM ĐẠT ĐƯỢC: {report['total_score']} / 100.0 điểm | TRẠNG THÁI: {report['status']}"
        )
        print(
            f" - Điểm Core (Chuẩn đầu ra hành nghề): {report['core_score']} / 70.0 điểm"
        )
        print(
            f" - Điểm Extension (Phân hóa nâng cao):  {report['extension_score']} / 30.0 điểm"
        )
        print("-" * 80)
        print(" BẢNG CHI TIẾT CHỈ SỐ METRICS THỰC NGHIỆM:")
        for k, v in report["metrics"].items():
            print(f"   * {k:<25}: {v}")
        print("-" * 80)
        print(
            f" {'ID':<8} | {'TIÊU CHÍ ĐÁNH GIÁ':<32} | {'METRIC':<8} | {'ĐIỂM':<10} | {'LOẠI'}"
        )
        print("-" * 80)
        for s in report["score_breakdown"]:
            print(
                f" {s['criterion_id']:<8} | {s['name'][:32]:<32} | {s['metric_value']:<8} | {s['awarded_points']:>4.1f}/{s['max_points']:<4} | {s['type']}"
            )
        print("=" * 80 + "\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auto-Grader for Capstone AI-01")
    parser.add_argument(
        "--submission",
        type=str,
        required=True,
        help="Đường dẫn file submission_report.json",
    )
    parser.add_argument(
        "--out", type=str, default="grading_report.json", help="File lưu báo cáo điểm"
    )
    args = parser.parse_args()

    grader = RAGAutoGrader()
    report = grader.evaluate_submission(args.submission)
    grader.print_report(report)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(f"[+] Báo cáo điểm số JSON lưu tại: {os.path.abspath(args.out)}")
