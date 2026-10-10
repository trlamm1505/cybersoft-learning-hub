"""Automated Grading Engine for CyberSoft Student Projects."""

import json
import os
import sys
from pathlib import Path
import pandas as pd


def grade_submission(submission_dir: Path, expected_kpis_path: Path) -> dict:
    results = {
        "student_id": "STUDENT_SUBMISSION",
        "scores": {},
        "total_score": 0.0,
        "feedback": []
    }

    with open(expected_kpis_path, "r", encoding="utf-8") as f:
        expected = json.load(f)["ground_truth_metrics"]

    # 1. Check Data Cleaning (CRIT-01: max 20 pts)
    cleaned_file = submission_dir / "orders_cleaned.csv"
    if cleaned_file.exists():
        df_clean = pd.read_csv(cleaned_file)
        # Check duplicate order_id
        dup_count = df_clean.duplicated(subset=["order_id"]).sum()
        null_count = df_clean["order_status"].isna().sum() + (df_clean["order_status"] == "").sum()
        
        if len(df_clean) == expected["total_clean_orders"] and dup_count == 0 and null_count == 0:
            results["scores"]["CRIT-01"] = 20.0
            results["feedback"].append("CRIT-01 PASS (20/20): File dữ liệu làm sạch chính xác 100% (400 dòng, 0 duplicate, 0 null).")
        elif dup_count == 0:
            results["scores"]["CRIT-01"] = 16.0
            results["feedback"].append("CRIT-01 (16/20): Đã khử duplicate nhưng còn giá trị rỗng ở order_status.")
        else:
            results["scores"]["CRIT-01"] = 10.0
            results["feedback"].append("CRIT-01 (10/20): Chưa khử triệt để bản ghi duplicate.")
    else:
        results["scores"]["CRIT-01"] = 0.0
        results["feedback"].append("CRIT-01 FAIL (0/20): Không tìm thấy file orders_cleaned.csv.")

    # 2. Check KPI accuracy (CRIT-02: max 25 pts)
    kpi_file = submission_dir / "kpi_summary.json"
    if kpi_file.exists():
        with open(kpi_file, "r", encoding="utf-8") as f:
            sub_kpi = json.load(f)

        sub_rev = float(sub_kpi.get("net_revenue_usd", 0.0))
        sub_aov = float(sub_kpi.get("average_order_value_usd", 0.0))
        
        exp_rev = expected["net_revenue_usd"]
        exp_aov = expected["average_order_value_usd"]

        rev_err = abs(sub_rev - exp_rev) / exp_rev * 100
        aov_err = abs(sub_aov - exp_aov) / exp_aov * 100

        if rev_err <= 0.05 and aov_err <= 0.1:
            results["scores"]["CRIT-02"] = 25.0
            results["feedback"].append(f"CRIT-02 PASS (25/25): Doanh thu ${sub_rev:,.2f} và AOV ${sub_aov:,.2f} khớp Ground Truth tuyệt đối.")
        elif rev_err <= 0.5:
            results["scores"]["CRIT-02"] = 20.0
            results["feedback"].append(f"CRIT-02 (20/25): Sai số doanh thu {rev_err:.2f}% (trong mức chấp nhận được).")
        else:
            results["scores"]["CRIT-02"] = 12.0
            results["feedback"].append(f"CRIT-02 (12/25): Doanh thu sai số lớn {rev_err:.2f}%.")
    else:
        results["scores"]["CRIT-02"] = 0.0
        results["feedback"].append("CRIT-02 FAIL (0/25): Không tìm thấy file kpi_summary.json.")

    # 3. Check RFM file (CRIT-04: max 15 pts)
    rfm_file = submission_dir / "rfm_customer_segments.csv"
    if rfm_file.exists():
        df_rfm = pd.read_csv(rfm_file)
        if "segment" in df_rfm.columns and len(df_rfm["segment"].unique()) >= 4:
            results["scores"]["CRIT-04"] = 15.0
            results["feedback"].append("CRIT-04 PASS (15/15): Phân khúc RFM đầy đủ các nhóm khách hàng chiến lược.")
        else:
            results["scores"]["CRIT-04"] = 10.0
            results["feedback"].append("CRIT-04 (10/15): Có phân khúc RFM nhưng chưa đủ 4-5 nhóm.")
    else:
        results["scores"]["CRIT-04"] = 0.0
        results["feedback"].append("CRIT-04 (0/15): Chưa thực hiện bài toán mở rộng RFM.")

    # Total auto-graded score
    results["total_score"] = sum(results["scores"].values())
    return results


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python auto_grader.py <submission_dir> <expected_kpis_path>")
        sys.exit(1)
    res = grade_submission(Path(sys.argv[1]), Path(sys.argv[2]))
    print(json.dumps(res, indent=2, ensure_ascii=False))
