"""Export static JSON and HTML dashboard snapshots for Task 15.

Allows evaluators to inspect the exact state and metrics of the dashboard
without needing a running Streamlit server.
"""

import json
from pathlib import Path
import sys

# Ensure UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

task15_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(task15_dir))

from src.collector import ResourceCollector  # noqa: E402
from src.metrics_engine import MetricsEngine  # noqa: E402


def export_snapshots():
    collector = ResourceCollector()
    resources = collector.collect_all_resources()
    kpis = MetricsEngine.compute_summary_kpis(resources)
    track_breakdown = MetricsEngine.breakdown_by_track(resources)
    tier_breakdown = MetricsEngine.breakdown_by_tier(resources)

    # 1. Export JSON Snapshot
    snapshot = {
        "framework": "CyberSoft Resource Quality & Observability Framework (CRQOF)",
        "version": "v0.1.0",
        "generated_at": "2026-09-19T08:00:00Z",
        "kpis": kpis,
        "breakdown": {
            "by_track": track_breakdown,
            "by_tier": tier_breakdown,
        },
        "resources_count": len(resources),
        "resources": [r.to_dict() for r in resources],
    }

    catalog_dir = task15_dir / "catalog"
    catalog_dir.mkdir(exist_ok=True)
    json_path = catalog_dir / "aggregated_resource_snapshot.json"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)

    print(f"[OK] Exported JSON snapshot to: {json_path}")

    # 2. Export HTML Report
    html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>CyberSoft Resource Quality & Observability Dashboard v0.1</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; background: #f8fafc; color: #1e293b; }}
        .header {{ background: #1e3a8a; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }}
        .header h1 {{ margin: 0; font-size: 24px; }}
        .kpi-container {{ display: flex; gap: 16px; margin-bottom: 24px; }}
        .kpi-card {{ flex: 1; background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }}
        .kpi-val {{ font-size: 24px; font-weight: bold; color: #1e3a8a; }}
        .kpi-lbl {{ font-size: 13px; color: #64748b; margin-top: 4px; }}
        table {{ width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
        th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }}
        th {{ background: #f1f5f9; font-weight: 600; color: #334155; }}
        .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }}
        .badge-gold {{ background: #fef3c7; color: #92400e; }}
        .badge-quarantined {{ background: #fee2e2; color: #991b1b; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 CyberSoft Data & AI Lab — Resource Observability Dashboard v0.1</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.9;">Báo cáo tổng hợp chất lượng tài nguyên (Dataset Registry & Project Bank) ngày 15</p>
    </div>

    <div class="kpi-container">
        <div class="kpi-card"><div class="kpi-val">{kpis['total_resources']}</div><div class="kpi-lbl">Tổng Tài Nguyên</div></div>
        <div class="kpi-card"><div class="kpi-val">{kpis['total_records']:,}</div><div class="kpi-lbl">Tổng Bản Ghi / Đề Mục</div></div>
        <div class="kpi-card"><div class="kpi-val">{kpis['avg_rqi']:.1f} / 100</div><div class="kpi-lbl">Điểm RQI Trung Bình</div></div>
        <div class="kpi-card"><div class="kpi-val">{kpis['overall_test_pass_rate']:.1f}%</div><div class="kpi-lbl">Tỷ Lệ Test Pass</div></div>
        <div class="kpi-card"><div class="kpi-val">{kpis['zero_leakage_compliance']:.1f}%</div><div class="kpi-lbl">Zero-Leakage Compliance</div></div>
    </div>

    <h2>📋 Danh Mục Tài Nguyên Giám Sát</h2>
    <table>
        <thead>
            <tr>
                <th>Mã ID</th>
                <th>Tên Tài Nguyên</th>
                <th>Loại</th>
                <th>Chuyên Ngành</th>
                <th>Cấp Độ</th>
                <th>Xếp Hạng</th>
                <th>Điểm RQI</th>
                <th>Quality Gate</th>
                <th>Vi Phạm</th>
                <th>Trạng Thái</th>
            </tr>
        </thead>
        <tbody>
"""
    for r in resources:
        tier_badge = (
            '<span class="badge badge-gold">GOLD</span>'
            if r.quality_tier == "Gold"
            else '<span class="badge badge-quarantined">QUARANTINED</span>'
        )
        html_content += f"""            <tr>
                <td><code>{r.id}</code></td>
                <td><strong>{r.name}</strong></td>
                <td>{r.resource_type.upper()}</td>
                <td>{r.track}</td>
                <td>{r.difficulty_level}</td>
                <td>{tier_badge}</td>
                <td><strong>{r.rqi:.1f}</strong></td>
                <td>{r.quality_gate_score:.1f}%</td>
                <td>{r.violations_count}</td>
                <td>{r.state.upper()}</td>
            </tr>
"""

    html_content += """        </tbody>
    </table>
</body>
</html>
"""
    html_path = catalog_dir / "dashboard_preview.html"
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"[OK] Exported HTML dashboard snapshot to: {html_path}")
    return json_path, html_path


if __name__ == "__main__":
    export_snapshots()
