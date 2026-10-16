# ruff: noqa: E402
"""Seed script to populate initial immutable artifacts and staged release manifests."""

import json
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Setup import path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.config import config
from src.schemas.artifact import ArtifactType, LifecycleState
from src.schemas.lifecycle import RollbackRequest
from src.services.changelog_differ import changelog_differ
from src.services.immutable_store import immutable_store
from src.services.lineage_engine import lineage_engine
from src.services.manifest_builder import manifest_builder
from src.services.rollback_planner import rollback_planner


def seed():
    print("[1/5] Khởi tạo tài nguyên giai đoạn v1.0.0 (Baseline)...")

    # 1. DATASETS v1.0.0
    ds_retail_v1 = immutable_store.register_artifact(
        name="Retail Sales Dataset",
        artifact_type=ArtifactType.DATASET,
        version="v1.0.0",
        description="Bộ dữ liệu bán hàng bán lẻ đa bảng 3NF (Transactions, Customers, Stores, Products).",
        content="transaction_id,customer_id,store_id,amount,timestamp\nTX1001,CUST-001,ST-01,150.00,2026-09-01T10:00:00Z\nTX1002,CUST-002,ST-02,230.50,2026-09-01T11:15:00Z",
        filename="retail_sales.csv",
        upstream_ids=[],
        tags=["retail", "sales", "3nf", "core_dataset"],
    )

    ds_hr_v1 = immutable_store.register_artifact(
        name="HR Attendance Dataset",
        artifact_type=ArtifactType.DATASET,
        version="v1.0.0",
        description="Bộ dữ liệu chấm công và quản lý nhân sự 3NF (Employees, Shifts, Leaves, Attendance).",
        content="employee_id,name,department,status,work_hours\nEMP-01,Nguyen Van A,Engineering,present,8.0\nEMP-02,Tran Thi B,Marketing,present,7.5",
        filename="hr_attendance.csv",
        upstream_ids=[],
        tags=["hr", "operations", "3nf", "attendance"],
    )

    ds_churn_v1 = immutable_store.register_artifact(
        name="Customer Churn Dataset",
        artifact_type=ArtifactType.DATASET,
        version="v1.0.0",
        description="Bộ dữ liệu dự báo tỷ lệ khách hàng rời bỏ mạng viễn thông vi mô.",
        content="customer_id,tenure_months,contract_type,monthly_charges,churn_label\nC-101,12,One-Year,65.50,0\nC-102,3,Month-to-Month,85.20,1",
        filename="customer_churn.csv",
        upstream_ids=[],
        tags=["churn", "telecom", "classification"],
    )

    ds_chunks_v1 = immutable_store.register_artifact(
        name="AI Knowledge Chunks Corpus",
        artifact_type=ArtifactType.DATASET,
        version="v1.0.0",
        description="Tập 81 phân đoạn tri thức văn bản quy chế đào tạo và tài liệu RAG.",
        content="chunk_id,doc_id,title,text\nCHK-01,CS-POL-01,Chinh sach bao luu,Hoc vien duoc bao luu toi da 6 thang.\nCHK-02,CS-TEC-01,Huong dan Git,Moi task thuc tap sinh tao nhanh feature theo quy chuan.",
        filename="knowledge_chunks_v1.csv",
        upstream_ids=[],
        tags=["rag", "corpus", "chunks", "text"],
    )

    # 2. PROMPTS v1.0.0
    p_gen_v1 = immutable_store.register_artifact(
        name="Exercise Generator System Prompt",
        artifact_type=ArtifactType.PROMPT,
        version="v1.0.0",
        description="Prompt định hướng mô hình AI sinh bài tập theo thang Bloom có vài ví dụ mẫu (Few-shot).",
        content="SYSTEM: You are CyberSoft Curriculum Lead. Read dataset schema and generate Bloom-aligned exercises in strict JSON.",
        filename="system_prompt_v1.txt",
        upstream_ids=[],
        tags=["prompt", "bloom", "curriculum", "few_shot"],
    )

    p_tutor_v1 = immutable_store.register_artifact(
        name="RAG Tutor Grounding Prompt",
        artifact_type=ArtifactType.PROMPT,
        version="v1.0.0",
        description="Prompt trợ lý học tập AI trích xuất nguồn gốc và từ chối khi thiếu dữ kiện.",
        content="SYSTEM: Answer questions using only the provided context chunks. Include character-exact citations. If context is insufficient, reply politely with refusal.",
        filename="tutor_prompt_v1.txt",
        upstream_ids=[],
        tags=["prompt", "rag", "tutor", "citation"],
    )

    # 3. MODELS v1.0.0
    m_emb_v1 = immutable_store.register_artifact(
        name="BGE Small English Embedder",
        artifact_type=ArtifactType.MODEL,
        version="v1.0.0",
        description="Trọng số checkpoint mô hình Embedding BAAI/bge-small-en-v1.5 (384 dimensions).",
        content='{"model_name": "BAAI/bge-small-en-v1.5", "dim": 384, "max_seq_len": 512, "framework": "sentence-transformers", "license": "MIT"}',
        filename="model_card.json",
        upstream_ids=[],
        tags=["model", "embedding", "dense_retrieval"],
    )

    m_llm_v1 = immutable_store.register_artifact(
        name="Gemini 3.8 Flash Checkpoint",
        artifact_type=ArtifactType.MODEL,
        version="v1.0.0",
        description="Mô hình ngôn ngữ lớn cốt lõi phục vụ sinh học liệu và trợ lý RAG Tutor.",
        content='{"model_name": "gemini-3.8-flash", "provider": "Google DeepMind", "context_window": 1048576, "temperature": 0.2, "top_p": 0.95}',
        filename="llm_config.json",
        upstream_ids=[],
        tags=["model", "llm", "generator", "tutor"],
    )

    # 4. INDICES v1.0.0
    _ = immutable_store.register_artifact(
        name="FAISS Retail Sales Index",
        artifact_type=ArtifactType.INDEX,
        version="v1.0.0",
        description="Chỉ mục vector FAISS IndexFlatIP xây dựng trên bảng giao dịch bán lẻ.",
        content='{"index_type": "IndexFlatIP", "vectors_count": 1000, "metric": "inner_product", "source_dataset": "ds_retail_sales_v1.0.0"}',
        filename="faiss_meta.json",
        upstream_ids=[ds_retail_v1.id, m_emb_v1.id],
        tags=["index", "faiss", "vector", "retail"],
    )

    idx_bm25_v1 = immutable_store.register_artifact(
        name="BM25 Knowledge Chunks Index",
        artifact_type=ArtifactType.INDEX,
        version="v1.0.0",
        description="Chỉ mục từ khóa thưa BM25 trên tập 81 phân đoạn tri thức RAG v1.0.0.",
        content='{"index_type": "BM25Okapi", "total_docs": 81, "k1": 1.5, "b": 0.75, "source": "ds_ai_knowledge_chunks_corpus_v1.0.0"}',
        filename="bm25_meta.json",
        upstream_ids=[ds_chunks_v1.id],
        tags=["index", "bm25", "lexical", "rag"],
    )

    # 5. EVALUATIONS v1.0.0
    _ = immutable_store.register_artifact(
        name="RAG Benchmark 100 Evaluation",
        artifact_type=ArtifactType.EVALUATION,
        version="v1.0.0",
        description="Bộ đánh giá 100 câu hỏi RAG: Factual, Multi-hop, Unanswerable, Distractor.",
        content='{"benchmark_size": 100, "precision_at_3": 0.94, "mrr": 0.91, "hallucination_rate": 0.00, "status": "PASSED"}',
        filename="rag_benchmark_results.json",
        upstream_ids=[
            ds_chunks_v1.id,
            p_tutor_v1.id,
            m_emb_v1.id,
            m_llm_v1.id,
            idx_bm25_v1.id,
        ],
        tags=["eval", "rag", "benchmark", "accuracy"],
    )

    eval_gen_v1 = immutable_store.register_artifact(
        name="Exercise Generator Feasibility Evaluation",
        artifact_type=ArtifactType.EVALUATION,
        version="v1.0.0",
        description="Báo cáo đánh giá khả thi thực thi SQL và phân loại cấp độ Bloom của 20 bài tập mẫu.",
        content='{"total_drafts": 25, "round_1_pass_rate": 0.84, "round_2_pass_rate": 1.0, "feasibility_latency_avg_ms": 0.78, "status": "PASSED"}',
        filename="generator_eval_results.json",
        upstream_ids=[
            ds_retail_v1.id,
            ds_hr_v1.id,
            ds_churn_v1.id,
            p_gen_v1.id,
            m_llm_v1.id,
        ],
        tags=["eval", "generator", "bloom", "feasibility"],
    )

    # 6. EXERCISES v1.0.0 (The 20 approved exercises from Day 23)
    _ = immutable_store.register_artifact(
        name="Approved Exercise Bank 20",
        artifact_type=ArtifactType.EXERCISE,
        version="v1.0.0",
        description="Ngân hàng 20 bài tập thực hành sư phạm đã qua thẩm định và phê duyệt bởi Giảng viên.",
        content='{"total_approved": 20, "domains": ["Retail", "HR", "Churn", "RAG"], "human_review_status": "APPROVED", "gatekeeper_auto_publish": "BLOCKED"}',
        filename="approved_bank_20.json",
        upstream_ids=[
            ds_retail_v1.id,
            ds_hr_v1.id,
            ds_churn_v1.id,
            ds_chunks_v1.id,
            p_gen_v1.id,
            m_llm_v1.id,
            eval_gen_v1.id,
        ],
        tags=["exercises", "pedagogy", "approved", "bank20"],
    )
    print(
        f"-> Đã đăng ký {len(immutable_store.list_artifacts())} tài nguyên giai đoạn v1.0.0."
    )

    # [2/5] Xây dựng Release Manifest v1.0.0 (Baseline)
    print("\n[2/5] Đóng gói Release Manifest v1.0.0 (Baseline)...")
    rel_v1_0_0 = manifest_builder.build_manifest(
        version="v1.0.0",
        release_name="CyberSoft Data & AI Lab Baseline Release",
        description="Bản phát hành nền tảng v1.0.0 chuẩn hóa bộ dữ liệu cốt lõi, mô hình embedding, prompt và 20 bài tập mẫu.",
        release_notes="Phiên bản phát hành đầu tiên: Hoàn thành tích hợp Dataset Registry, Vector Indexing và Ngân hàng bài tập.",
        git_tag="v1.0.0-release",
    )
    print(
        f"-> Manifest v1.0.0: {len(rel_v1_0_0.components)} components | Checksum = {rel_v1_0_0.holistic_checksum}"
    )

    # [3/5] Đăng ký tài nguyên mới cho giai đoạn v1.1.0 & Cập nhật Deprecate
    print("\n[3/5] Đăng ký nâng cấp tài nguyên cho giai đoạn v1.1.0 (Current)...")
    ds_chunks_v2 = immutable_store.register_artifact(
        name="AI Knowledge Chunks Corpus Multi-Hop",
        artifact_type=ArtifactType.DATASET,
        version="v1.1.0",
        description="Tập phân đoạn tri thức RAG nâng cao có ngữ cảnh đa bước (Multi-Hop) và gán nhãn chống rò rỉ.",
        content="chunk_id,doc_id,title,text,multi_hop_context\nCHK-01-v2,CS-POL-01,Chinh sach bao luu,Hoc vien duoc bao luu toi da 6 thang voi dieu kien nop don truoc 7 ngay.,CS-POL-02\nCHK-02-v2,CS-TEC-01,Huong dan Git,Moi task thuc tap sinh tao nhanh feature va rebase truoc khi merge.,CS-TEC-03",
        filename="knowledge_chunks_v2.csv",
        upstream_ids=[ds_chunks_v1.id],
        tags=["rag", "corpus", "chunks", "multi_hop"],
    )

    p_gen_v2 = immutable_store.register_artifact(
        name="Exercise Generator System Prompt Enhanced",
        artifact_type=ArtifactType.PROMPT,
        version="v1.1.0",
        description="Prompt sinh bài tập nâng cao tích hợp ràng buộc tính khả thi thực thi SQL và kiểm chứng tự động.",
        content="SYSTEM: You are CyberSoft Senior Curriculum Architect. Enforce executable starter code, unambiguous unit tests, and anti-hallucination constraints.",
        filename="system_prompt_v2.txt",
        upstream_ids=[p_gen_v1.id],
        tags=["prompt", "bloom", "feasibility", "sandbox"],
    )

    _ = immutable_store.register_artifact(
        name="Hybrid RAG Search Index",
        artifact_type=ArtifactType.INDEX,
        version="v1.1.0",
        description="Chỉ mục kết hợp Hybrid (Dense FAISS + Sparse BM25) với Reciprocal Rank Fusion.",
        content='{"index_type": "Hybrid_RRF", "rrf_k": 60, "vector_dim": 384, "source": "ds_ai_knowledge_chunks_corpus_v1.1.0"}',
        filename="hybrid_meta.json",
        upstream_ids=[ds_chunks_v2.id, m_emb_v1.id, idx_bm25_v1.id],
        tags=["index", "hybrid", "rrf", "rag"],
    )

    # Đánh dấu deprecate cho các bản cũ tương ứng
    immutable_store.update_lifecycle_state(
        artifact_id=ds_chunks_v1.id,
        new_state=LifecycleState.DEPRECATED,
        deprecation_reason="Thay thế bằng phiên bản v1.1.0 có phân đoạn đa bước Multi-Hop.",
        superseded_by=ds_chunks_v2.id,
        sunset_date="2026-12-31T23:59:59Z",
    )
    immutable_store.update_lifecycle_state(
        artifact_id=p_gen_v1.id,
        new_state=LifecycleState.DEPRECATED,
        deprecation_reason="Nâng cấp lên prompt v1.1.0 có hộp cát kiểm chứng khả thi thực thi.",
        superseded_by=p_gen_v2.id,
        sunset_date="2026-11-30T23:59:59Z",
    )

    # Đóng gói Manifest v1.1.0
    rel_v1_1_0 = manifest_builder.build_manifest(
        version="v1.1.0",
        release_name="CyberSoft Data & AI Lab Enhanced Release",
        description="Bản phát hành nâng cao v1.1.0 tích hợp Hybrid Search Index, Knowledge Chunks v1.1.0 và Generator Prompt v1.1.0.",
        release_notes="Nâng cấp chỉ mục tìm kiếm Hybrid RRF, bộ dữ liệu tri thức Multi-Hop và quy trình deprecation chuẩn hóa.",
        git_tag="v1.1.0-release",
    )
    print(
        f"-> Manifest v1.1.0: {len(rel_v1_1_0.components)} components | Checksum = {rel_v1_1_0.holistic_checksum}"
    )

    # [4/5] So sánh phiên bản & Sinh Changelog
    print("\n[4/5] So sánh phiên bản v1.0.0 -> v1.1.0 và lập Changelog...")
    diff = changelog_differ.compare_releases(rel_v1_0_0, rel_v1_1_0)
    print(f"-> Tổng số thay đổi: {diff.total_changes}")
    print(f"   + Thêm mới: {len(diff.added)}")
    for a in diff.added:
        print(f"     * [{a.artifact_type.value}] {a.name} ({a.new_version})")
    print(f"   + Deprecated: {len(diff.deprecated)}")
    for d in diff.deprecated:
        print(f"     * [{d.artifact_type.value}] {d.name}")

    changelog_entry = changelog_differ.generate_changelog_entry(
        diff, rel_v1_1_0.release_name, rel_v1_1_0.release_date
    )
    changelog_path = config.data_dir / "changelog.json"
    changelog_path.write_text(
        json.dumps([changelog_entry.model_dump()], indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"-> Đã ghi changelog vào: {changelog_path}")

    # [5/5] Sinh Kế hoạch hoàn tác (Rollback Note)
    print("\n[5/5] Thiết lập Rollback Note: v1.1.0 -> v1.0.0...")
    rollback_req = RollbackRequest(
        current_release_id=rel_v1_1_0.release_id,
        target_release_id=rel_v1_0_0.release_id,
        operator="Đào Trung Kiên - Data & AI Resource Engineer",
        reason="Kế hoạch hoàn tác dự phòng khi phát hiện xung đột không tương thích trên môi trường vận hành hạ nguồn.",
    )
    rollback_plan = rollback_planner.generate_plan(rollback_req)

    note_md_path = config.releases_dir / "rollback_note_v1.1.0_to_v1.0.0.md"
    note_json_path = config.releases_dir / "rollback_note_v1.1.0.json"
    note_md_path.write_text(rollback_plan.markdown_note, encoding="utf-8")
    note_json_path.write_text(rollback_plan.model_dump_json(indent=2), encoding="utf-8")
    print(f"-> Đã ghi Rollback Note vào: {note_md_path}")

    # Lưu Lineage DAG snapshot
    dag = lineage_engine.build_dag()
    dag_path = config.data_dir / "lineage_graph.json"
    dag_path.write_text(dag.model_dump_json(indent=2), encoding="utf-8")
    print(
        f"-> Đã ghi Lineage DAG snapshot vào: {dag_path} ({dag.total_nodes} nodes, {dag.total_edges} edges)"
    )

    print("\n=== HOÀN TẤT SEEDING TASK 24 THÀNH CÔNG 100% ===")


if __name__ == "__main__":
    seed()
