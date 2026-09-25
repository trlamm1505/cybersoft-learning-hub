"""
Script to build and package Capstone AI-01 RAG System datasets.
Copies corpus from Day 08, prepares clean student evaluation queries (Zero Leakage),
and structures instructor ground-truth benchmarks.
"""

import csv
import json
import os
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TASK08_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "BaoCao_Task08"))

STUDENT_CORPUS_DIR = os.path.join(
    BASE_DIR,
    "projects",
    "AI-01_rag_knowledge_retrieval",
    "student_edition",
    "data",
    "corpus",
)
STUDENT_EVAL_DIR = os.path.join(
    BASE_DIR,
    "projects",
    "AI-01_rag_knowledge_retrieval",
    "student_edition",
    "data",
    "eval",
)

INSTRUCTOR_DATA_DIR = os.path.join(
    BASE_DIR, "projects", "AI-01_rag_knowledge_retrieval", "instructor_edition", "data"
)
INSTRUCTOR_CORPUS_DIR = os.path.join(INSTRUCTOR_DATA_DIR, "corpus")
INSTRUCTOR_DIR = os.path.join(
    BASE_DIR, "projects", "AI-01_rag_knowledge_retrieval", "instructor_edition"
)


def package_corpus():
    source_corpus = os.path.join(TASK08_DIR, "data", "corpus")
    os.makedirs(STUDENT_CORPUS_DIR, exist_ok=True)
    os.makedirs(INSTRUCTOR_CORPUS_DIR, exist_ok=True)

    files = [
        f for f in os.listdir(source_corpus) if f.endswith(".md") or f.endswith(".json")
    ]
    for f in files:
        src = os.path.join(source_corpus, f)
        shutil.copy2(src, os.path.join(STUDENT_CORPUS_DIR, f))
        shutil.copy2(src, os.path.join(INSTRUCTOR_CORPUS_DIR, f))
    print(f"[+] Packaged {len(files)} corpus files to student and instructor editions.")


def package_eval_sets():
    source_json = os.path.join(TASK08_DIR, "data", "eval_qa", "rag_eval_questions.json")
    with open(source_json, "r", encoding="utf-8") as f:
        full_qa = json.load(f)

    # 1. Student Edition: ZERO ANSWER LEAKAGE
    # Only expose question_id, category, type, query
    student_qa = []
    for item in full_qa:
        student_qa.append(
            {
                "question_id": item["question_id"],
                "category": item["category"],
                "type": item["type"],
                "query": item["query"],
            }
        )

    os.makedirs(STUDENT_EVAL_DIR, exist_ok=True)
    student_json_path = os.path.join(STUDENT_EVAL_DIR, "test_queries.json")
    with open(student_json_path, "w", encoding="utf-8") as f:
        json.dump(student_qa, f, ensure_ascii=False, indent=2)

    student_csv_path = os.path.join(STUDENT_EVAL_DIR, "test_queries.csv")
    with open(student_csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(
            f, fieldnames=["question_id", "category", "type", "query"]
        )
        writer.writeheader()
        writer.writerows(student_qa)

    # 2. Instructor Edition: FULL GROUND TRUTH
    instructor_json_path = os.path.join(INSTRUCTOR_DATA_DIR, "ground_truth_eval.json")
    with open(instructor_json_path, "w", encoding="utf-8") as f:
        json.dump(full_qa, f, ensure_ascii=False, indent=2)

    shutil.copy2(
        os.path.join(TASK08_DIR, "data", "eval_qa", "rag_eval_questions.csv"),
        os.path.join(INSTRUCTOR_DATA_DIR, "ground_truth_eval.csv"),
    )
    print(
        f"[+] Packaged {len(full_qa)} evaluation questions. Student edition cleaned (Zero Leakage)."
    )


def generate_expected_benchmarks():
    benchmarks = {
        "project_metadata": {
            "capstone_id": "AI-01",
            "title": "CyberSoft Internal Knowledge & HR Policy Q&A RAG System",
            "domain": "Enterprise Internal Knowledge Base & Operational Policies",
            "total_documents": 20,
            "total_eval_queries": 100,
            "query_distribution": {
                "single_hop_answerable": 40,
                "multi_hop_answerable": 20,
                "unanswerable_out_of_domain": 20,
                "adversarial_distractor": 20,
            },
        },
        "evaluation_metrics": {
            "retrieval": {
                "recall_at_5": {
                    "baseline": 0.68,
                    "advanced": 0.94,
                    "rubric_threshold": 0.80,
                    "weight": 15,
                },
                "mrr": {
                    "baseline": 0.61,
                    "advanced": 0.88,
                    "rubric_threshold": 0.75,
                    "weight": 15,
                },
                "context_precision": {
                    "baseline": 0.58,
                    "advanced": 0.89,
                    "rubric_threshold": 0.75,
                    "weight": 10,
                },
            },
            "generation": {
                "faithfulness": {
                    "baseline": 0.72,
                    "advanced": 0.93,
                    "rubric_threshold": 0.85,
                    "weight": 15,
                },
                "answer_relevance": {
                    "baseline": 0.74,
                    "advanced": 0.91,
                    "rubric_threshold": 0.80,
                    "weight": 15,
                },
            },
            "citation_and_abstention": {
                "citation_f1": {
                    "baseline": 0.65,
                    "advanced": 0.92,
                    "rubric_threshold": 0.80,
                    "weight": 8,
                },
                "abstain_accuracy": {
                    "baseline": 0.62,
                    "advanced": 0.95,
                    "rubric_threshold": 0.85,
                    "weight": 7,
                },
            },
            "efficiency_and_cost": {
                "p95_latency_ms": {
                    "baseline": 950,
                    "advanced": 1120,
                    "max_allowed_ms": 1500,
                    "weight": 8,
                },
                "cost_per_1k_queries_usd": {
                    "baseline": 0.024,
                    "advanced": 0.038,
                    "max_allowed_usd": 0.050,
                    "weight": 7,
                },
            },
        },
        "rubric_breakdown": {
            "total_points": 100,
            "core_points": 70,
            "extension_points": 30,
            "sections": [
                {"name": "Retrieval Performance", "points": 40, "auto_graded": True},
                {"name": "Generation Quality", "points": 30, "auto_graded": True},
                {
                    "name": "Citation & Abstention Guardrails",
                    "points": 15,
                    "auto_graded": True,
                },
                {
                    "name": "Latency & Cost Efficiency",
                    "points": 15,
                    "auto_graded": True,
                },
            ],
        },
    }

    out_path = os.path.join(INSTRUCTOR_DIR, "expected_benchmarks.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(benchmarks, f, ensure_ascii=False, indent=2)
    print(f"[+] Generated expected benchmarks at: {out_path}")


if __name__ == "__main__":
    package_corpus()
    package_eval_sets()
    generate_expected_benchmarks()
    print("[SUCCESS] Capstone AI-01 package built successfully.")
