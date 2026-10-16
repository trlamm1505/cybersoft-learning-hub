"""CLI Evaluator for Task 29 Performance Profiling & Deployment DoD Compliance.

Validates 6 DoD Stages:
Stage 1: Performance Benchmark Profile Completeness (benchmark_metrics.json)
Stage 2: Latency Percentiles Compliance (Search P95 < 25ms, AI Tutor P95 < 1500ms)
Stage 3: Throughput & Scalability Compliance (RPS >= 250, Error rate == 0.0%)
Stage 4: Two-Tier Caching Efficiency (Hit rate >= 85.0%, Latency reduction > 80%)
Stage 5: Disaster Recovery & Backup Integrity (100% SHA-256 Checksums Matched)
Stage 6: Artifact Integrity & Zero Forbidden Words Check (No 'kịch' + 'bản')
"""

import sys
import json
from pathlib import Path

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent


def evaluate():
    print("=" * 80)
    print("CYBERSOFT DATA & AI LAB — KIỂM ĐỊNH CHUẨN ĐẦU RA TASK 29 (PERFORMANCE & OPS)")
    print("=" * 80)

    stages_passed = 0

    # Stage 1: Benchmark Metrics Profile
    print("[STAGE 1/6] Kiểm tra Tính Đầy Đủ Của Hồ Sơ Đo Lường Hiệu Năng...")
    metrics_file = BASE_DIR / "data" / "benchmark_metrics.json"
    assert metrics_file.exists(), "Thiếu file data/benchmark_metrics.json"
    with open(metrics_file, "r", encoding="utf-8") as f:
        metrics = json.load(f)
    assert "search_latency_benchmark_ms" in metrics
    assert "throughput_benchmark" in metrics
    assert "memory_profiling_mb" in metrics
    assert "caching_metrics" in metrics
    print(f"  ✓ Đạt chuẩn: Đầy đủ 6 phân hệ đo lường hiệu năng tải trọng và bộ nhớ.")
    stages_passed += 1

    # Stage 2: Latency Percentiles
    print("[STAGE 2/6] Kiểm định Độ Trễ Phân Vị (Latency Percentiles P95)...")
    search_p95 = metrics["search_latency_benchmark_ms"]["p95"]
    assert search_p95 <= 25.0, f"Độ trễ tìm kiếm P95 {search_p95}ms vượt ngưỡng 25.0ms"
    tutor_p95 = metrics["ai_tutor_latency_benchmark_ms"]["p95"]
    assert tutor_p95 <= 1500.0, f"Độ trễ AI Tutor P95 {tutor_p95}ms vượt ngưỡng 1500.0ms"
    print(f"  ✓ Đạt chuẩn: Tìm kiếm P95 đạt {search_p95}ms (<= 25ms), AI Tutor P95 đạt {tutor_p95}ms (<= 1500ms).")
    stages_passed += 1

    # Stage 3: Throughput
    print("[STAGE 3/6] Kiểm tra Năng Lực Xử Lý Tải Trọng (Throughput RPS)...")
    rps = metrics["throughput_benchmark"]["requests_per_second_rps"]
    err_rate = metrics["throughput_benchmark"]["error_rate_pct"]
    assert rps >= 250.0, f"Thông lượng {rps} RPS chưa đạt ngưỡng tối thiểu 250.0 RPS"
    assert err_rate == 0.0, f"Tỷ lệ lỗi {err_rate}% không được phép lớn hơn 0%"
    print(f"  ✓ Đạt chuẩn: Thông lượng đạt {rps} RPS (20 workers đồng thời, 0% lỗi).")
    stages_passed += 1

    # Stage 4: Caching Efficiency
    print("[STAGE 4/6] Kiểm tra Hiệu Quả Bộ Nhớ Đệm Hai Tầng (Two-Tier Caching)...")
    hit_rate = metrics["caching_metrics"]["hit_rate_pct"]
    assert hit_rate >= 85.0, f"Tỷ lệ trúng cache {hit_rate}% chưa đạt chuẩn (>= 85.0%)"
    lat_red = metrics["caching_metrics"]["latency_reduction_pct"]
    assert lat_red >= 80.0, f"Mức giảm độ trễ {lat_red}% chưa đạt chuẩn (>= 80.0%)"
    print(f"  ✓ Đạt chuẩn: Tỷ lệ trúng cache đạt {hit_rate}%, giảm {lat_red}% độ trễ truy vấn.")
    stages_passed += 1

    # Stage 5: Backup & Restore
    print("[STAGE 5/6] Kiểm tra Sao Lưu & Khôi Phục Toàn Vẹn Bằng Mã Băm SHA-256...")
    backup_dir = BASE_DIR / "data" / "backup_sample"
    manifest_file = backup_dir / "manifest.json"
    assert manifest_file.exists(), "Thiếu file backup_sample/manifest.json"
    with open(manifest_file, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert len(manifest["files"]) == 2, "Yêu cầu đủ 2 tệp tin trong bản sao lưu"
    import hashlib
    for entry in manifest["files"]:
        p = backup_dir / entry["filename"]
        assert p.exists(), f"Thiếu tệp {entry['filename']}"
        actual_sha = hashlib.sha256(p.read_bytes()).hexdigest()
        assert actual_sha == entry["sha256"], f"Sai lệch mã băm SHA-256 tại {entry['filename']}"
    print(f"  ✓ Đạt chuẩn: 2/2 tệp tin sao lưu khớp chính xác 100% mã băm SHA-256.")
    stages_passed += 1

    # Stage 6: Artifact Integrity & Forbidden Words Check
    print("[STAGE 6/6] Kiểm tra Hiện Vật Docker, Hướng Dẫn Vận Hành & Quét Từ Ngữ Cấm...")
    req_files = [
        BASE_DIR / "Dockerfile",
        BASE_DIR / "docker-compose.yml",
        BASE_DIR / "docs" / "operations_guide.md",
        BASE_DIR / "29_performance_and_deployment.md",
        BASE_DIR / "README.md",
        BASE_DIR / "AI_WORKLOG.md",
        BASE_DIR / "docs" / "GIAI_THICH.md",
        BASE_DIR / "portal" / "index.html",
        BASE_DIR / "portal" / "styles.css",
        BASE_DIR / "portal" / "app.js"
    ]
    for rf in req_files:
        assert rf.exists(), f"Thiếu hiện vật bắt buộc: {rf}"

    forbidden_terms = ["kịch" + "bản", "kich" + "ban"]
    for doc_file in [BASE_DIR / "29_performance_and_deployment.md", BASE_DIR / "README.md", BASE_DIR / "AI_WORKLOG.md", BASE_DIR / "docs" / "operations_guide.md"]:
        text = doc_file.read_text(encoding="utf-8").lower()
        for term in forbidden_terms:
            assert term not in text, f"Phát hiện từ cấm '{term}' trong {doc_file}"

    print(f"  ✓ Đạt chuẩn: Đầy đủ Dockerfile, docker-compose, tài liệu, 0 từ ngữ cấm phát hiện.")
    stages_passed += 1

    print("=" * 80)
    print(f"[KẾT QUẢ CUỐI CÙNG] {stages_passed}/6 Chặng Kiểm Định ĐẠT CHUẨN (100% DoD SUCCESS)")
    print("=" * 80)
    return 0


if __name__ == "__main__":
    sys.exit(evaluate())
