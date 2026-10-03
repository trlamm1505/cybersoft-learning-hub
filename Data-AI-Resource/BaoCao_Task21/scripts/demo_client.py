"""Demonstration script showcasing how TTS 02 (Learning Hub) and TTS 03 (QA) integrate with API v1."""

import json
import sys
from pathlib import Path

# Configure utf-8 stdout for Windows consoles
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient  # noqa: E402
from src.main import app  # noqa: E402

# Create mock test client adapter
client = TestClient(app)


def print_step(title: str):
    print("\n" + "=" * 80)
    print(f"🔹 {title}")
    print("=" * 80)


def demo_workflow():
    print("🚀 BẮT ĐẦU KỊCH BẢN KIỂM CHỨNG TÍCH HỢP LIÊN PHÂN HỆ — NGÀY 21")
    print(
        "Đại diện: CyberSoft Data & AI Lab (TTS 01) phối hợp với Learning Hub (TTS 02) và QA (TTS 03)\n"
    )

    # 1. Health check
    print_step(
        "BƯỚC 1: KIỂM TRA SỨC KHỎE DỊCH VỤ & THÔNG TIN HỢP ĐỒNG (/health & /info)"
    )
    resp_health = client.get("/api/v1/health")
    assert resp_health.status_code == 200, f"Health check failed: {resp_health.text}"
    health_data = resp_health.json()["data"]
    print(
        f"✅ Trạng thái tổng thể: {health_data['status'].upper()} (Uptime: {health_data['uptime_seconds']}s, Version: {health_data['version']})"
    )
    for svc, info in health_data["services"].items():
        print(
            f"   - Phân hệ [{svc}]: {info['status']} ({info['latency_ms']} ms) — {info['message']}"
        )

    resp_info = client.get("/api/v1/info")
    info_data = resp_info.json()["data"]
    print(f"\n📋 OpenAPI Contract URL: {info_data['openapi_spec_url']}")
    print(f"🎯 Cam kết SLA: {json.dumps(info_data['sla_target'], ensure_ascii=False)}")

    # 2. TTS 02 Scenario - Query Datasets for Learning Platform
    print_step(
        "BƯỚC 2: KỊCH BẢN TTS 02 (LEARNING HUB) — LẤY DANH MỤC DATASET & CAPSTONE PROJECT"
    )
    headers_student = {"X-API-Key": "cybersoft-student-public-key-101"}
    resp_datasets = client.get(
        "/api/v1/registry/datasets?domain=Retail", headers=headers_student
    )
    assert resp_datasets.status_code == 200
    datasets = resp_datasets.json()["data"]["items"]
    print(f"✅ TTS 02 truy vấn thành công {len(datasets)} dataset ngành Retail:")
    for ds in datasets:
        print(
            f"   - ID: {ds['id']} | Tên: {ds['name']} | Độ khó: {ds['difficulty_level']} | Bản ghi: {ds['records_count']}"
        )

    # Get Detail
    resp_detail = client.get(
        f"/api/v1/registry/datasets/{datasets[0]['id']}", headers=headers_student
    )
    detail = resp_detail.json()["data"]
    print(f"   -> Checksum SHA-256 đối soát toàn vẹn: {detail['checksum_sha256']}")
    print(
        f"   -> Schema cột: {[c['name'] + ' (' + c['type'] + ')' for c in detail['schema_definition']]}"
    )

    # 3. TTS 02 Scenario - Student searching curriculum & asking AI Tutor
    print_step(
        "BƯỚC 3: KỊCH BẢN TTS 02 (HỌC VIÊN) — TÌM KIẾM HỌC LIỆU & HỎI ĐÁP AI TUTOR CÓ TRÍCH NGUỒN"
    )
    search_payload = {
        "query": "cơ chế RRF kết hợp xếp hạng BM25 và Vector",
        "top_k": 3,
        "similarity_threshold": 0.1,
    }
    resp_search = client.post(
        "/api/v1/search/semantic", json=search_payload, headers=headers_student
    )
    assert resp_search.status_code == 200
    search_res = resp_search.json()["data"]
    print(
        f"✅ Tìm thấy {search_res['total_found']} đoạn trích trong {search_res['execution_time_ms']} ms:"
    )
    for idx, item in enumerate(search_res["results"], 1):
        print(
            f"   [{idx}] Score: {item['relevance_score']} | Nguồn: {item['source_citation']}"
        )

    # Ask Tutor
    tutor_payload = {
        "question": "Quy chế đào tạo CyberSoft quy định thế nào về việc nộp bài tập và gia hạn đồ án?",
        "top_k": 2,
        "strict_abstention": True,
    }
    resp_tutor = client.post(
        "/api/v1/tutor/chat", json=tutor_payload, headers=headers_student
    )
    assert resp_tutor.status_code == 200
    tutor_res = resp_tutor.json()["data"]
    print(
        f"\n✅ Trợ giảng AI phản hồi (Status: {tutor_res['status']} | Groundedness: {tutor_res['groundedness_score']}):"
    )
    print(
        f"   Trích dẫn: {[c['title'] + ' - ' + c['section'] for c in tutor_res['citations']]}"
    )
    print(f"   Nội dung: {tutor_res['answer'][:180]}...")

    # Safe Abstention Test
    tutor_abstain = {
        "question": "Hướng dẫn cách nấu phở bò Hà Nội truyền thống",
        "strict_abstention": True,
    }
    resp_abstain = client.post(
        "/api/v1/tutor/chat", json=tutor_abstain, headers=headers_student
    )
    abstain_res = resp_abstain.json()["data"]
    print("\n🛡️ Cơ chế từ chối an toàn (Safe Abstention):")
    print(
        f"   Status: {abstain_res['status']} | Phản hồi: {abstain_res['answer'][:120]}..."
    )

    # 4. TTS 03 Scenario - QA Platform collecting Quality & RAG metrics
    print_step(
        "BƯỚC 4: KỊCH BẢN TTS 03 (QA PLATFORM) — LẤY CHỈ SỐ CHO QUALITY DASHBOARD HỢP NHẤT"
    )
    headers_qa = {"X-API-Key": "cybersoft-qa-eval-key-333"}
    resp_metrics = client.get("/api/v1/quality/metrics", headers=headers_qa)
    assert resp_metrics.status_code == 200
    metrics_res = resp_metrics.json()["data"]
    rag_kpis = metrics_res["rag_benchmarks"]
    print("✅ TTS 03 thu thập thành công số liệu đo lường chất lượng:")
    print(f"   - Recall@5: {rag_kpis['recall_at_5']}% | MRR: {rag_kpis['mrr']}")
    print(
        f"   - Citation Precision: {rag_kpis['citation_precision']}% | Phantom Citations: {rag_kpis['phantom_citations']}"
    )
    print(
        f"   - Groundedness Score: {rag_kpis['groundedness_score']}% | Abstention Accuracy: {rag_kpis['abstention_accuracy']}%"
    )
    print(
        f"   - Tail Latency p95: {rag_kpis['tail_latency_p95_ms']} ms | Total Cost: ${rag_kpis['total_cost_usd']}"
    )
    print(f"   - CI Quality Gate Status: {metrics_res['ci_gate_status']}")

    # 5. Error Envelope Verification (DoD Requirement)
    print_step(
        "BƯỚC 5: XÁC THỰC CƠ CHẾ ĐÓNG GÓI LỖI CHUẨN HÓA (UNIFORM ERROR ENVELOPE)"
    )
    # Test 401 Unauthorized
    resp_401 = client.get("/api/v1/registry/datasets")
    assert resp_401.status_code == 401
    err_401 = resp_401.json()
    print(
        f"✅ Mã lỗi 401 (Auth Required): success={err_401['success']}, code={err_401['error']['code']}"
    )

    # Test 403 Forbidden
    resp_403 = client.post(
        "/api/v1/quality/validate-dataset",
        json={"dataset_id": "test"},
        headers=headers_student,
    )
    assert resp_403.status_code == 403
    err_403 = resp_403.json()
    print(
        f"✅ Mã lỗi 403 (Forbidden RBAC): success={err_403['success']}, code={err_403['error']['code']}"
    )

    # Test 404 Not Found
    resp_404 = client.get(
        "/api/v1/registry/datasets/non_existent_dataset_999", headers=headers_student
    )
    assert resp_404.status_code == 404
    err_404 = resp_404.json()
    print(
        f"✅ Mã lỗi 404 (Not Found): success={err_404['success']}, code={err_404['error']['code']}"
    )

    # Test 422 Validation Error
    resp_422 = client.post(
        "/api/v1/search/semantic", json={"query": "a"}, headers=headers_student
    )
    assert resp_422.status_code == 422
    err_422 = resp_422.json()
    print(
        f"✅ Mã lỗi 422 (Pydantic Validation): success={err_422['success']}, code={err_422['error']['code']}"
    )

    print("\n" + "=" * 80)
    print(
        "🎉 HOÀN THÀNH TOÀN BỘ KỊCH BẢN KIỂM CHỨNG TÍCH HỢP NGÀY 21 — ĐẠT CHUẨN DoD 100%!"
    )
    print("=" * 80)


if __name__ == "__main__":
    demo_workflow()
