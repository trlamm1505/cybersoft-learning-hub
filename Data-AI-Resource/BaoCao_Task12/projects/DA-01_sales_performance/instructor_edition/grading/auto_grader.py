"""CyberSoft Mart - Capstone DA-01 Official Auto-Grading Engine.

Chấm điểm tự động các chỉ số định lượng (Tối đa 60/100 điểm theo chuẩn Rubric Engineering).
40 điểm còn lại do Giảng viên Mentor chấm dựa trên chất lượng Dashboard và Báo cáo điều hành.
"""

import os
import sys
import json
import pandas as pd


class DA01AutoGrader:
    def __init__(
        self,
        student_cleaned_orders_path: str,
        student_kpi_json_path: str,
        expected_kpis_path: str,
    ):
        self.student_orders_path = student_cleaned_orders_path
        self.student_kpi_path = student_kpi_json_path
        self.expected_kpis_path = expected_kpis_path

        with open(expected_kpis_path, "r", encoding="utf-8") as f:
            self.expected = json.load(f)

        self.breakdown = {}
        self.total_score = 0.0

    def grade_data_cleaning(self) -> float:
        """CRIT-01: Kiểm toán làm sạch (Tối đa 15 điểm)."""
        score = 0.0
        details = []

        if not os.path.exists(self.student_orders_path):
            self.breakdown["CRIT-01 (Cleaning)"] = {
                "score": 0.0,
                "max": 15.0,
                "notes": "Không tìm thấy file orders đã làm sạch.",
            }
            return 0.0

        try:
            df = pd.read_csv(self.student_orders_path)
            clean_count = len(df)
            dup_count = df.duplicated(subset=["order_id"]).sum()
            null_count = (
                df["order_status"].isna().sum() + (df["order_status"] == "").sum()
            )

            # 1. Khử trùng lặp (7.5 điểm)
            if dup_count == 0:
                score += 7.5
                details.append("Khử 100% duplicate thành công (+7.5đ)")
            else:
                details.append(f"Còn {dup_count} dòng duplicate (-7.5đ)")

            # 2. Quy chuẩn null status & tổng số dòng sạch (7.5 điểm)
            if clean_count == 400 and null_count == 0:
                score += 7.5
                details.append(
                    "Đủ 400 dòng sạch và quy chuẩn 5 null thành công (+7.5đ)"
                )
            elif clean_count == 395:
                score += 4.0
                details.append(
                    "Đã khử duplicate nhưng xóa bỏ 5 dòng null thay vì quy chuẩn (+4.0đ)"
                )
            else:
                details.append(f"Số lượng dòng {clean_count} không đạt chuẩn 400 dòng")

        except Exception as e:
            details.append(f"Lỗi khi đọc file: {e}")

        self.breakdown["CRIT-01 (Cleaning)"] = {
            "score": round(score, 1),
            "max": 15.0,
            "notes": "; ".join(details),
        }
        return score

    def grade_financial_kpis(self) -> float:
        """CRIT-02: Độ chính xác KPIs tài chính (Tối đa 25 điểm)."""
        score = 0.0
        details = []

        if not os.path.exists(self.student_kpi_path):
            self.breakdown["CRIT-02 (Financial KPIs)"] = {
                "score": 0.0,
                "max": 25.0,
                "notes": "Không tìm thấy file kết quả KPIs.",
            }
            return 0.0

        try:
            with open(self.student_kpi_path, "r", encoding="utf-8") as f:
                submitted = json.load(f)

            gt = self.expected["ground_truth_metrics"]
            tol = self.expected["tolerances"]

            # 1. Net Revenue (10 điểm)
            sub_rev = float(submitted.get("net_revenue_usd", 0.0))
            exp_rev = float(gt["net_revenue_usd"])
            rev_err_pct = abs(sub_rev - exp_rev) * 100.0 / exp_rev
            if rev_err_pct <= tol["net_revenue_usd"]:
                score += 10.0
                details.append(
                    f"Net Revenue ${sub_rev} khớp chuẩn (sai số {rev_err_pct:.3f}% <= {tol['net_revenue_usd']}%) (+10đ)"
                )
            elif rev_err_pct <= 0.50:
                score += 7.0
                details.append(
                    f"Net Revenue ${sub_rev} sai số nhẹ {rev_err_pct:.2f}% (+7đ)"
                )
            else:
                details.append(
                    f"Net Revenue ${sub_rev} sai lệch lớn {rev_err_pct:.2f}%"
                )

            # 2. AOV (5 điểm)
            sub_aov = float(submitted.get("average_order_value_usd", 0.0))
            exp_aov = float(gt["average_order_value_usd"])
            aov_err_pct = abs(sub_aov - exp_aov) * 100.0 / exp_aov
            if aov_err_pct <= tol["average_order_value_usd"]:
                score += 5.0
                details.append(f"AOV ${sub_aov} khớp chuẩn (+5đ)")
            elif aov_err_pct <= 0.50:
                score += 3.5
                details.append(f"AOV ${sub_aov} sai số nhẹ (+3.5đ)")
            else:
                details.append(f"AOV ${sub_aov} sai lệch lớn")

            # 3. Gross Margin % (10 điểm)
            sub_margin = float(submitted.get("gross_margin_pct", 0.0))
            exp_margin = float(gt["gross_margin_pct"])
            margin_diff = abs(sub_margin - exp_margin)
            if margin_diff <= tol["gross_margin_pct"]:
                score += 10.0
                details.append(f"Gross Margin {sub_margin}% khớp chuẩn (+10đ)")
            elif margin_diff <= 1.50:
                score += 6.0
                details.append(f"Gross Margin {sub_margin}% sai số nhỏ (+6đ)")
            else:
                details.append(f"Gross Margin {sub_margin}% sai lệch lớn")

        except Exception as e:
            details.append(f"Lỗi phân tích KPIs: {e}")

        self.breakdown["CRIT-02 (Financial KPIs)"] = {
            "score": round(score, 1),
            "max": 25.0,
            "notes": "; ".join(details),
        }
        return score

    def grade_operational_metrics(self) -> float:
        """CRIT-03: Tỷ lệ hủy hoàn và vận hành (Tối đa 10 điểm)."""
        score = 0.0
        details = []

        try:
            with open(self.student_kpi_path, "r", encoding="utf-8") as f:
                submitted = json.load(f)

            gt = self.expected["ground_truth_metrics"]
            # Cancellation Rate (5đ)
            sub_cancel = float(submitted.get("cancellation_rate_pct", 0.0))
            if abs(sub_cancel - gt["cancellation_rate_pct"]) <= 0.20:
                score += 5.0
                details.append(f"Tỷ lệ hủy {sub_cancel}% khớp chuẩn (+5đ)")
            else:
                details.append(f"Tỷ lệ hủy {sub_cancel}% chưa chính xác")

            # Return Rate (5đ)
            sub_return = float(submitted.get("return_rate_pct", 0.0))
            if abs(sub_return - gt["return_rate_pct"]) <= 0.20:
                score += 5.0
                details.append(f"Tỷ lệ hoàn {sub_return}% khớp chuẩn (+5đ)")
            else:
                details.append(f"Tỷ lệ hoàn {sub_return}% chưa chính xác")

        except Exception as e:
            details.append(f"Lỗi: {e}")

        self.breakdown["CRIT-03 (Operational Metrics)"] = {
            "score": round(score, 1),
            "max": 10.0,
            "notes": "; ".join(details),
        }
        return score

    def grade_rfm_segmentation(self) -> float:
        """CRIT-05: Phân khúc RFM (Tối đa 10 điểm)."""
        score = 0.0
        details = []

        try:
            with open(self.student_kpi_path, "r", encoding="utf-8") as f:
                submitted = json.load(f)

            sub_rfm = submitted.get("rfm_segment_distribution", {})
            gt_rfm = self.expected["rfm_segment_distribution"]

            matched = 0
            for seg, count in gt_rfm.items():
                sub_count = sub_rfm.get(seg, 0)
                if abs(sub_count - count) <= 2:
                    matched += 1

            if matched == 5:
                score = 10.0
                details.append("Phân loại chuẩn cả 5 nhóm phân khúc RFM (+10đ)")
            elif matched >= 3:
                score = 6.0
                details.append(f"Phân loại chuẩn {matched}/5 nhóm phân khúc RFM (+6đ)")
            else:
                score = 2.0
                details.append("Phân loại RFM có sai lệch lớn")

        except Exception as e:
            details.append(f"Lỗi: {e}")

        self.breakdown["CRIT-05 (RFM Extension)"] = {
            "score": round(score, 1),
            "max": 10.0,
            "notes": "; ".join(details),
        }
        return score

    def evaluate(self) -> dict:
        s1 = self.grade_data_cleaning()
        s2 = self.grade_financial_kpis()
        s3 = self.grade_operational_metrics()
        s4 = self.grade_rfm_segmentation()
        self.total_score = round(s1 + s2 + s3 + s4, 1)

        return {
            "total_auto_score": self.total_score,
            "max_auto_score": 60.0,
            "pct_auto_score": round((self.total_score / 60.0) * 100, 1),
            "breakdown": self.breakdown,
        }


def main():
    if len(sys.argv) < 3:
        print(
            "Usage: python auto_grader.py <student_cleaned_orders_csv> <student_kpi_json> [expected_kpis_json]"
        )
        sys.exit(1)

    student_orders = sys.argv[1]
    student_kpi = sys.argv[2]
    expected_path = (
        sys.argv[3]
        if len(sys.argv) > 3
        else os.path.join(os.path.dirname(__file__), "..", "expected_kpis.json")
    )

    grader = DA01AutoGrader(student_orders, student_kpi, expected_path)
    res = grader.evaluate()
    print(json.dumps(res, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
