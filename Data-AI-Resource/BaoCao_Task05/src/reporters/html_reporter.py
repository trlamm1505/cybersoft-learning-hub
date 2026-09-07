"""CyberSoft Data Quality Harness — HTML Dashboard Reporter."""

from __future__ import annotations

import html
from pathlib import Path
from typing import Union

from ..models import ValidationReport


class HTMLReporter:
    """Exports validation report to an interactive, modern HTML dashboard."""

    @staticmethod
    def generate(report: ValidationReport, output_path: Union[str, Path]) -> Path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)

        is_passed = report.overall_passed
        status_text = "PASSED" if is_passed else "FAILED"
        status_class = "status-pass" if is_passed else "status-fail"
        status_icon = "✓" if is_passed else "✕"

        # Tally metrics
        total_eval = sum(r.total_evaluated for r in report.check_results)
        total_pass_cnt = sum(r.passed_count for r in report.check_results)
        overall_accuracy = (
            (total_pass_cnt / total_eval * 100.0) if total_eval > 0 else 100.0
        )

        critical_count = sum(
            1
            for r in report.check_results
            for i in r.issues
            if i.severity.value == "CRITICAL"
        )
        warning_count = sum(
            1
            for r in report.check_results
            for i in r.issues
            if i.severity.value == "WARNING"
        )

        checks_rows = []
        for i, res in enumerate(report.check_results, start=1):
            row_status = "PASSED" if res.passed else "FAILED"
            badge_class = "badge-pass" if res.passed else "badge-fail"
            rate = (
                (res.passed_count / res.total_evaluated * 100.0)
                if res.total_evaluated > 0
                else 100.0
            )
            checks_rows.append(f"""
            <tr>
                <td style="text-align: center;">{i}</td>
                <td><strong>{html.escape(res.check_name)}</strong></td>
                <td><span class="badge-type">{html.escape(res.rule_type)}</span></td>
                <td><span class="{badge_class}">{row_status}</span></td>
                <td style="text-align: right;">{res.total_evaluated:,}</td>
                <td style="text-align: right; color: #10b981;">{res.passed_count:,}</td>
                <td style="text-align: right; color: #ef4444;">{res.failed_count:,}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: {rate:.1f}%;"></div>
                        <span class="progress-text">{rate:.1f}%</span>
                    </div>
                </td>
                <td style="text-align: right;">{res.execution_time_ms:.2f} ms</td>
            </tr>
            """)

        issues_rows = []
        for res in report.check_results:
            for iss in res.issues:
                row_str = str(iss.row_index) if iss.row_index is not None else "N/A"
                col_str = html.escape(iss.column) if iss.column else "<em>Schema</em>"
                sev_badge = (
                    '<span class="badge-critical">CRITICAL</span>'
                    if iss.severity.value == "CRITICAL"
                    else '<span class="badge-warning">WARNING</span>'
                )
                val_display = (
                    html.escape(str(iss.invalid_value)[:50])
                    if iss.invalid_value is not None
                    else "<em>None</em>"
                )
                msg_display = html.escape(iss.message)
                issues_rows.append(f"""
                <tr>
                    <td style="text-align: center;"><strong>{row_str}</strong></td>
                    <td><code>{col_str}</code></td>
                    <td><span class="badge-type">{html.escape(iss.rule_type)}</span></td>
                    <td>{sev_badge}</td>
                    <td><code class="val-pill">{val_display}</code></td>
                    <td>{msg_display}</td>
                </tr>
                """)

        issues_section = (
            f"""
            <div class="card" style="margin-top: 24px;">
                <h2>🔍 Chi Tiết Lỗi Phát Hiện ({len(issues_rows)} vi phạm)</h2>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th style="width: 70px; text-align: center;">Dòng</th>
                                <th style="width: 150px;">Cột</th>
                                <th style="width: 120px;">Loại Check</th>
                                <th style="width: 110px;">Mức độ</th>
                                <th style="width: 180px;">Giá trị vi phạm</th>
                                <th>Chi tiết vi phạm</th>
                            </tr>
                        </thead>
                        <tbody>
                            {''.join(issues_rows)}
                        </tbody>
                    </table>
                </div>
            </div>
            """
            if issues_rows
            else """
            <div class="card" style="margin-top: 24px; text-align: center; padding: 40px;">
                <div style="font-size: 48px; color: #10b981; margin-bottom: 12px;">🎉</div>
                <h2 style="color: #10b981; margin: 0;">Tuyệt Vời! Dữ Liệu Hoàn Toàn Hợp Lệ</h2>
                <p style="color: #6b7280; margin-top: 8px;">Không phát hiện bất kỳ lỗi nghiêm trọng hay cảnh báo nào trong tập dữ liệu.</p>
            </div>
            """
        )

        html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CyberSoft Data Quality Audit Report — {html.escape(report.dataset_name)}</title>
    <style>
        :root {{
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text: #1e293b;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --danger: #ef4444;
            --warning: #f59e0b;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text);
            line-height: 1.5;
            padding: 32px 24px;
        }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--card-bg);
            padding: 24px 32px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            margin-bottom: 24px;
            border: 1px solid var(--border);
        }}
        .header-title h1 {{ font-size: 24px; color: var(--text); margin-bottom: 6px; }}
        .header-title p {{ color: var(--text-muted); font-size: 14px; }}
        .status-badge {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 20px;
            border-radius: 9999px;
            font-weight: 700;
            font-size: 16px;
            letter-spacing: 0.5px;
        }}
        .status-pass {{ background-color: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }}
        .status-fail {{ background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }}

        .grid-stats {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }}
        .stat-card {{
            background: var(--card-bg);
            padding: 20px;
            border-radius: 12px;
            border: 1px solid var(--border);
            box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }}
        .stat-label {{ font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; }}
        .stat-value {{ font-size: 28px; font-weight: 800; margin-top: 6px; color: var(--text); }}

        .card {{
            background: var(--card-bg);
            border-radius: 12px;
            border: 1px solid var(--border);
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            padding: 24px;
            margin-bottom: 24px;
        }}
        .card h2 {{ font-size: 18px; margin-bottom: 16px; color: var(--text); }}

        .table-responsive {{ overflow-x: auto; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }}
        th {{
            background: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 12px 14px;
            font-weight: 600;
            border-bottom: 2px solid var(--border);
        }}
        td {{
            padding: 12px 14px;
            border-bottom: 1px solid var(--border);
            vertical-align: middle;
        }}
        tr:hover td {{ background-color: #f8fafc; }}

        .badge-pass {{ background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }}
        .badge-fail {{ background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; }}
        .badge-type {{ background: #e0e7ff; color: #3730a3; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; font-family: monospace; }}
        .badge-critical {{ background: #ef4444; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }}
        .badge-warning {{ background: #f59e0b; color: #ffffff; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }}
        .val-pill {{ background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 12px; color: #b91c1c; font-family: monospace; }}

        .progress-container {{
            position: relative;
            background: #e2e8f0;
            border-radius: 9999px;
            height: 18px;
            width: 100px;
            overflow: hidden;
            display: inline-block;
            vertical-align: middle;
        }}
        .progress-bar {{
            background: #10b981;
            height: 100%;
            border-radius: 9999px;
        }}
        .progress-text {{
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            font-size: 10px;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            justify-content: center;
        }}
        footer {{
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
            margin-top: 32px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="header-title">
                <h1>🛡️ CyberSoft Data Quality Audit Dashboard</h1>
                <p>Tập dữ liệu: <strong>{html.escape(report.dataset_name)}</strong> • Thời gian: {html.escape(report.timestamp)}</p>
            </div>
            <div>
                <span class="status-badge {status_class}">
                    <span>{status_icon}</span> {status_text}
                </span>
            </div>
        </header>

        <div class="grid-stats">
            <div class="stat-card">
                <div class="stat-label">Tổng số dòng dữ liệu</div>
                <div class="stat-value">{report.total_records:,}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tổng số cột thẩm định</div>
                <div class="stat-value">{report.total_columns}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Lỗi nghiêm trọng (Critical)</div>
                <div class="stat-value" style="color: #ef4444;">{critical_count}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Cảnh báo (Warning)</div>
                <div class="stat-value" style="color: #f59e0b;">{warning_count}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tỷ lệ đạt chuẩn</div>
                <div class="stat-value" style="color: {'#10b981' if overall_accuracy >= 90 else '#ef4444'};">{overall_accuracy:.1f}%</div>
            </div>
        </div>

        <div class="card">
            <h2>📋 Bảng Đối Soát 7 Nhóm Kiểm Tra Chất Lượng</h2>
            <div class="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th style="width: 50px; text-align: center;">STT</th>
                            <th>Tên Check</th>
                            <th>Phân loại</th>
                            <th>Trạng thái</th>
                            <th style="text-align: right;">Đã duyệt</th>
                            <th style="text-align: right;">Hợp lệ</th>
                            <th style="text-align: right;">Vi phạm</th>
                            <th style="width: 120px;">Tỷ lệ đạt</th>
                            <th style="text-align: right;">Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {''.join(checks_rows)}
                    </tbody>
                </table>
            </div>
        </div>

        {issues_section}

        <footer>
            <p>© 2026 CyberSoft Data & AI Lab — Data Quality Harness v0. Kỹ sư thực hiện: Đào Trung Kiên.</p>
        </footer>
    </div>
</body>
</html>
"""
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        return out_file
