"""Metrics Engine for CyberSoft Resource Quality & Observability Framework (CRQOF).

Computes aggregate statistics, domain/track breakdowns, RQI distributions,
and compliance indicators across all datasets and projects.
"""

from typing import Dict, List, Any
from src.collector import ResourceItem


class MetricsEngine:
    """Calculates summary KPIs and distributions for the dashboard."""

    @staticmethod
    def compute_summary_kpis(resources: List[ResourceItem]) -> Dict[str, Any]:
        if not resources:
            return {
                "total_resources": 0,
                "total_records": 0,
                "avg_rqi": 0.0,
                "overall_test_pass_rate": 0.0,
                "zero_leakage_compliance": 0.0,
                "gold_tier_count": 0,
                "quarantined_count": 0,
                "total_violations": 0,
            }

        total = len(resources)
        total_records = sum(r.total_records for r in resources)
        avg_rqi = round(sum(r.rqi for r in resources) / total, 2)
        avg_test_pass = round(sum(r.test_pass_rate for r in resources) / total, 2)
        zero_leakage_pass = sum(1 for r in resources if r.anti_leakage_score >= 100.0)
        zero_leakage_rate = round((zero_leakage_pass / total) * 100.0, 1)

        gold_count = sum(1 for r in resources if r.quality_tier == "Gold")
        silver_count = sum(1 for r in resources if r.quality_tier == "Silver")
        bronze_count = sum(1 for r in resources if r.quality_tier == "Bronze")
        quarantined_count = sum(1 for r in resources if r.quality_tier == "Quarantined")
        total_violations = sum(r.violations_count for r in resources)

        return {
            "total_resources": total,
            "total_records": total_records,
            "avg_rqi": avg_rqi,
            "overall_test_pass_rate": avg_test_pass,
            "zero_leakage_compliance": zero_leakage_rate,
            "gold_tier_count": gold_count,
            "silver_tier_count": silver_count,
            "bronze_tier_count": bronze_count,
            "quarantined_count": quarantined_count,
            "total_violations": total_violations,
        }

    @staticmethod
    def breakdown_by_track(resources: List[ResourceItem]) -> Dict[str, Dict[str, Any]]:
        breakdown: Dict[str, Dict[str, Any]] = {}
        for r in resources:
            t = r.track
            if t not in breakdown:
                breakdown[t] = {
                    "count": 0,
                    "rqi_sum": 0.0,
                    "records": 0,
                    "quarantined": 0,
                }
            breakdown[t]["count"] += 1
            breakdown[t]["rqi_sum"] += r.rqi
            breakdown[t]["records"] += r.total_records
            if r.quality_tier == "Quarantined":
                breakdown[t]["quarantined"] += 1

        for t in breakdown:
            cnt = breakdown[t]["count"]
            breakdown[t]["avg_rqi"] = (
                round(breakdown[t]["rqi_sum"] / cnt, 2) if cnt > 0 else 0.0
            )
            del breakdown[t]["rqi_sum"]

        return breakdown

    @staticmethod
    def breakdown_by_domain(resources: List[ResourceItem]) -> Dict[str, Dict[str, Any]]:
        breakdown: Dict[str, Dict[str, Any]] = {}
        for r in resources:
            d = r.domain
            if d not in breakdown:
                breakdown[d] = {"count": 0, "rqi_sum": 0.0, "records": 0}
            breakdown[d]["count"] += 1
            breakdown[d]["rqi_sum"] += r.rqi
            breakdown[d]["records"] += r.total_records

        for d in breakdown:
            cnt = breakdown[d]["count"]
            breakdown[d]["avg_rqi"] = (
                round(breakdown[d]["rqi_sum"] / cnt, 2) if cnt > 0 else 0.0
            )
            del breakdown[d]["rqi_sum"]

        return breakdown

    @staticmethod
    def breakdown_by_level(resources: List[ResourceItem]) -> Dict[str, int]:
        breakdown: Dict[str, int] = {"Beginner": 0, "Intermediate": 0, "Advanced": 0}
        for r in resources:
            lvl = r.difficulty_level
            breakdown[lvl] = breakdown.get(lvl, 0) + 1
        return breakdown

    @staticmethod
    def breakdown_by_tier(resources: List[ResourceItem]) -> Dict[str, int]:
        breakdown: Dict[str, int] = {
            "Gold": 0,
            "Silver": 0,
            "Bronze": 0,
            "Quarantined": 0,
        }
        for r in resources:
            tier = r.quality_tier
            breakdown[tier] = breakdown.get(tier, 0) + 1
        return breakdown
