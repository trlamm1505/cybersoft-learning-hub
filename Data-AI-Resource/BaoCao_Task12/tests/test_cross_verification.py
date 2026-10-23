from cross_verification_engine import CrossVerificationEngine


def test_cross_verification_delta_zero(task12_paths):
    engine = CrossVerificationEngine(task12_paths["data"])
    res = engine.verify_all()

    assert (
        res["is_perfect_reconciliation"] is True
    ), "3 phương pháp đối soát không khớp tuyệt đối!"
    assert res["delta_metrics"]["revenue_delta_usd"] == 0.0
    assert res["delta_metrics"]["profit_delta_usd"] == 0.0
    assert res["delta_metrics"]["margin_delta_pct"] == 0.0


def test_cross_verification_matches_ground_truth(task12_paths):
    engine = CrossVerificationEngine(task12_paths["data"])
    res = engine.verify_all()

    m = res["comparisons"][0]
    assert m["total_clean_orders"] == 400
    assert m["completed_orders"] == 338
    assert m["net_revenue_usd"] == 388850.28
    assert m["aov_usd"] == 1150.44
    assert m["gross_profit_usd"] == 121652.51
    assert m["gross_margin_pct"] == 31.43
