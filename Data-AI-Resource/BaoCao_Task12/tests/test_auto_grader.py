import os
import json
from auto_grader import DA01AutoGrader
from solution_da01_pipeline import DA01SolutionPipeline


def test_auto_grader_perfect_submission(task12_paths, tmp_path):
    data_dir = task12_paths["data"]
    pipe = DA01SolutionPipeline(data_dir)
    pipe.load_data().clean_data()
    kpis = pipe.compute_financial_kpis()
    rfm = pipe.compute_rfm()

    orders_file = str(tmp_path / "clean_orders.csv")
    kpi_file = str(tmp_path / "kpis.json")

    pipe.cleaned_orders.to_csv(orders_file, index=False)
    kpis["rfm_segment_distribution"] = rfm["segment"].value_counts().to_dict()
    with open(kpi_file, "w", encoding="utf-8") as f:
        json.dump(kpis, f, indent=2)

    grader = DA01AutoGrader(orders_file, kpi_file, task12_paths["expected_kpis"])
    eval_res = grader.evaluate()

    assert (
        eval_res["total_auto_score"] == 60.0
    ), f"Expected 60.0, got {eval_res['total_auto_score']}"
    assert eval_res["pct_auto_score"] == 100.0


def test_auto_grader_catches_flawed_submission(task12_paths, tmp_path):
    """Kiểm tra khi học viên nộp file sai (còn duplicate, tính cả đơn hủy vào doanh thu)."""
    orders_file = str(tmp_path / "flawed_orders.csv")
    kpi_file = str(tmp_path / "flawed_kpis.json")

    # File orders còn nguyên 402 dòng (chưa khử trùng lặp)
    raw_orders = os.path.join(task12_paths["data"], "orders.csv")
    with open(raw_orders, "r", encoding="utf-8") as f:
        raw_text = f.read()
    with open(orders_file, "w", encoding="utf-8") as f:
        f.write(raw_text)

    # File KPIs tính sai doanh thu ($462,310.50 do tính cả đơn hủy)
    flawed_kpis = {
        "net_revenue_usd": 462310.50,
        "average_order_value_usd": 1150.44,
        "gross_margin_pct": 31.43,
        "cancellation_rate_pct": 10.75,
        "return_rate_pct": 4.75,
        "rfm_segment_distribution": {},
    }
    with open(kpi_file, "w", encoding="utf-8") as f:
        json.dump(flawed_kpis, f, indent=2)

    grader = DA01AutoGrader(orders_file, kpi_file, task12_paths["expected_kpis"])
    eval_res = grader.evaluate()

    # Bị trừ điểm nặng do duplicate và sai lệch doanh thu lớn
    assert eval_res["total_auto_score"] < 45.0
    assert eval_res["breakdown"]["CRIT-01 (Cleaning)"]["score"] == 0.0
    assert "sai lệch lớn" in eval_res["breakdown"]["CRIT-02 (Financial KPIs)"]["notes"]
