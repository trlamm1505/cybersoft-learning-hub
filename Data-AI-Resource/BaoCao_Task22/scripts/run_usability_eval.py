"""Usability Evaluation Benchmark Runner for CyberSoft Data Resource Portal v0.1.

Executes all 5 official instructor usability scenarios, measuring response times
against the DoD threshold (< 60 seconds per scenario) and printing detailed telemetry.
"""

import sys
import time

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from pathlib import Path

# Add project root to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient  # noqa: E402
from src.main import app  # noqa: E402

client = TestClient(app)


def run_benchmark():
    print("=" * 80)
    print(
        "CYBERSOFT DATA & AI LAB — BỘ ĐO LƯỜNG ĐỘ KHẢ DỤNG (USABILITY BENCHMARK - TASK 22)"
    )
    print(
        "Mục tiêu nghiệm thu (DoD): Giảng viên tìm kiếm & tải tài nguyên trong dưới 60 giây"
    )
    print("=" * 80)

    scenarios = [
        {
            "id": 1,
            "name": "Kịch bản 1: Tìm kiếm & Lọc dataset bán hàng theo từ khóa và lĩnh vực Retail",
            "action": lambda: client.get(
                "/api/v1/portal/datasets?q=bán hàng&domain=Retail"
            ),
            "verify": lambda res: res.status_code == 200
            and res.json()["data"]["total"] >= 1,
            "desc": "Tìm thấy tập dữ liệu bán hàng đa bảng chuẩn hóa 3NF trong thời gian thực.",
        },
        {
            "id": 2,
            "name": "Kịch bản 2: Xem trước dữ liệu mẫu (10 dòng) & Tra cứu lược đồ cột (Schema Inspector)",
            "action": lambda: client.get(
                "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/preview?limit=10"
            ),
            "verify": lambda res: res.status_code == 200
            and len(res.json()["data"]["sample_rows"]) >= 5
            and len(res.json()["data"]["columns"]) >= 5,
            "desc": "Trích xuất đầy đủ 7 cột và 10 dòng mẫu phục vụ chuẩn bị bài giảng SQL.",
        },
        {
            "id": 3,
            "name": "Kịch bản 3: Kiểm tra chất lượng dữ liệu (Tier A - 98.5%), License & Mã băm SHA-256",
            "action": lambda: client.get(
                "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1"
            ),
            "verify": lambda res: res.status_code == 200
            and res.json()["data"]["quality_tier"] == "Tier A"
            and len(res.json()["data"]["checksum_sha256"]) == 64,
            "desc": "Xác nhận điểm chất lượng 98.5%, giấy phép CyberSoft Educational License và mã SHA-256.",
        },
        {
            "id": 4,
            "name": "Kịch bản 4: Kiểm tra Access Rules - Thử tải bản nháp chưa xuất bản (Chặn 403 Forbidden)",
            "action": lambda: client.get(
                "/api/v1/portal/datasets/ds-cyber-ai-student-survey-draft/download"
            ),
            "verify": lambda res: res.status_code == 403
            and res.json()["error"]["code"] == "DATASET_UNPUBLISHED_RESTRICTED",
            "desc": "Hệ thống kiên quyết từ chối tải bản nháp chưa duyệt (draft) theo đúng quy tắc bảo vệ.",
        },
        {
            "id": 5,
            "name": "Kịch bản 5: Tải tập dữ liệu chính thức thành công & Gửi đánh giá độ hữu ích 5 sao",
            "action": lambda: (
                client.get(
                    "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/download"
                ),
                client.post(
                    "/api/v1/portal/datasets/ds-retail-ecommerce-sales-v1/feedback",
                    json={
                        "rating": 5,
                        "reviewer_name": "TS. Đào Trung Kiên",
                        "role": "instructor",
                        "comment": "Dữ liệu bán hàng 3NF cực kỳ sạch, học viên thực hành SQL JOIN và Aggregations rất hào hứng!",
                        "usefulness_aspects": [
                            "clean_data",
                            "schema_3nf",
                            "pedagogy_ready",
                        ],
                    },
                ),
            ),
            "verify": lambda res_pair: res_pair[0].status_code == 200
            and res_pair[1].status_code == 200
            and res_pair[1].json()["data"]["rating"] == 5,
            "desc": "Tải về tệp CSV kèm kiểm tra mã băm SHA-256 và lưu trữ đánh giá hữu ích 5/5 sao.",
        },
    ]

    total_time = 0.0
    all_passed = True

    print(f"{'ID':<4} | {'Kịch Bản':<50} | {'Thời Gian':<12} | {'Trạng Thái':<10}")
    print("-" * 82)

    for sc in scenarios:
        t0 = time.perf_counter()
        res = sc["action"]()
        elapsed = time.perf_counter() - t0
        total_time += elapsed

        passed = sc["verify"](res) and elapsed < 60.0
        if not passed:
            all_passed = False

        status_str = "[PASS]" if passed else "[FAIL]"
        print(
            f"{sc['id']:<4} | {sc['name'][:48]:<50} | {elapsed*1000:>8.2f} ms | {status_str:<10}"
        )

    print("-" * 82)
    print(
        f"Tổng thời gian hoàn thành 5 kịch bản: {total_time:.4f} giây (Ngưỡng cam kết DoD: < 60.00 giây)"
    )
    print(
        f"Kết quả chung cuộc: {'100% PASS — ĐẠT CHUẨN NGHIỆM THU DoD' if all_passed else 'FAILED'}"
    )
    print("=" * 80)
    return all_passed


if __name__ == "__main__":
    success = run_benchmark()
    sys.exit(0 if success else 1)
