"""
Test 3: Kiểm thử độc lập tầng Retrieval (Recall@5 và MRR).
"""

import json
import numpy as np
from advanced_rag import AdvancedRAGPipeline


def test_advanced_retrieval_performance(task14_paths):
    corpus_dir = task14_paths["corpus_dir"]
    pipeline = AdvancedRAGPipeline(corpus_dir)

    with open(task14_paths["ground_truth_json"], "r", encoding="utf-8") as f:
        ground_truth = json.load(f)

    # Lọc các câu answerable
    answerable = [q for q in ground_truth if "Answerable" in q.get("type", "")][
        :20
    ]  # sample 20 câu để test nhanh

    recalls = []
    reciprocal_ranks = []

    for q in answerable:
        gt_docs = set()
        if "citations" in q and isinstance(q["citations"], list):
            for c in q["citations"]:
                if isinstance(c, dict):
                    doc_name = c.get("document_id") or c.get("doc_id", "")
                    if doc_name:
                        gt_docs.add(doc_name)
                elif isinstance(c, str):
                    gt_docs.add(c.split("#")[0].strip("[]"))
        elif "citations_doc_ids" in q:
            gt_docs = set(str(q["citations_doc_ids"]).split(","))

        retrieved = pipeline.retrieve(q["query"], top_k=5)
        ret_docs = [c["doc_id"] for c in retrieved]

        # Kiểm tra hit
        hits = [d for d in ret_docs if d in gt_docs]
        recalls.append(1.0 if hits else 0.0)

        first_rank = 0
        for r, d in enumerate(ret_docs, start=1):
            if d in gt_docs:
                first_rank = r
                break
        reciprocal_ranks.append(1.0 / first_rank if first_rank > 0 else 0.0)

    avg_recall = float(np.mean(recalls))
    avg_mrr = float(np.mean(reciprocal_ranks))

    print(f"\n[Retrieval Test] Sample Recall@5: {avg_recall:.3f}, MRR: {avg_mrr:.3f}")
    assert avg_recall >= 0.80, f"Recall@5 ({avg_recall:.3f}) phải đạt tối thiểu 0.80"
    assert avg_mrr >= 0.75, f"MRR ({avg_mrr:.3f}) phải đạt tối thiểu 0.75"
