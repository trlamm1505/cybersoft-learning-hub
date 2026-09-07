"""CyberSoft Data Quality Harness — Markdown Reporter."""

from __future__ import annotations

from pathlib import Path
from typing import Union

from ..models import ValidationReport


class MarkdownReporter:
    """Exports validation report to GitHub Flavored Markdown."""

    @staticmethod
    def generate(report: ValidationReport, output_path: Union[str, Path]) -> Path:
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)

        badge_status = "PASSED" if report.overall_passed else "FAILED"
        badge_color = "brightgreen" if report.overall_passed else "red"
        status_icon = "✅" if report.overall_passed else "❌"

        lines = [
            f"# {status_icon} CyberSoft Data Quality Audit Report",
            "",
            f"![Quality Status](https://img.shields.io/badge/Quality_Status-{badge_status}-{badge_color}?style=for-the-badge)",
            "",
            "## 📌 1. Thông Tin Tổng Quan (Metadata)",
            "",
            f"- **Tên tập dữ liệu**: `{report.dataset_name}`",
            f"- **Tệp dữ liệu kiểm tra**: `{report.input_file}`",
            f"- **Bộ quy tắc thẩm định**: `{report.rules_file}`",
            f"- **Thời gian kiểm thử**: `{report.timestamp}`",
            f"- **Tổng số bản ghi**: **{report.total_records:,}** dòng",
            f"- **Tổng số cột**: **{report.total_columns}** cột",
            f"- **Kết quả chung**: **{badge_status}** (Exit Code: `{report.exit_code}`)",
            "",
            "---",
            "",
            "## 📊 2. Thống Kê Kết Quả 7 Nhóm Kiểm Tra (Checks Summary)",
            "",
            "| STT | Tên Check | Phân loại | Trạng thái | Tổng kiểm tra | Hợp lệ | Vi phạm | Tỷ lệ đạt (%) | Thời gian (ms) |",
            "| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |",
        ]

        total_issues = 0
        critical_count = 0
        warning_count = 0

        for i, res in enumerate(report.check_results, start=1):
            status = "✅ PASS" if res.passed else "❌ FAIL"
            rate = (
                (res.passed_count / res.total_evaluated * 100.0)
                if res.total_evaluated > 0
                else 100.0
            )
            lines.append(
                f"| {i} | `{res.check_name}` | `{res.rule_type}` | {status} | "
                f"{res.total_evaluated:,} | {res.passed_count:,} | {res.failed_count:,} | "
                f"{rate:.1f}% | {res.execution_time_ms:.2f} |"
            )
            for iss in res.issues:
                total_issues += 1
                if iss.severity.value == "CRITICAL":
                    critical_count += 1
                else:
                    warning_count += 1

        lines.extend(
            [
                "",
                "### Tổng hợp mức độ vi phạm:",
                f"- **Tổng số vi phạm phát hiện**: **{total_issues}**",
                f"- **Lỗi nghiêm trọng (CRITICAL)**: **{critical_count}**",
                f"- **Cảnh báo (WARNING)**: **{warning_count}**",
                "",
                "---",
                "",
                "## 🔍 3. Danh Sách Lỗi Chi Tiết (Detailed Issues Log)",
                "",
            ]
        )

        if total_issues == 0:
            lines.append(
                "> 🟢 **Chúc mừng!** Không phát hiện bất kỳ lỗi nào. Tập dữ liệu đạt chuẩn 100% tiêu chí chất lượng."
            )
        else:
            lines.extend(
                [
                    "| Dòng | Cột | Nhóm Check | Mức độ | Giá trị vi phạm | Mô tả chi tiết |",
                    "| :---: | :--- | :--- | :---: | :--- | :--- |",
                ]
            )
            for res in report.check_results:
                for iss in res.issues:
                    row_str = str(iss.row_index) if iss.row_index is not None else "N/A"
                    col_str = f"`{iss.column}`" if iss.column else "Schema"
                    sev_badge = (
                        "🔴 CRITICAL"
                        if iss.severity.value == "CRITICAL"
                        else "🟡 WARNING"
                    )
                    val_str = (
                        f"`{str(iss.invalid_value)[:40]}`"
                        if iss.invalid_value is not None
                        else "`None/Empty`"
                    )
                    lines.append(
                        f"| {row_str} | {col_str} | `{iss.rule_type}` | {sev_badge} | {val_str} | {iss.message} |"
                    )

        lines.extend(
            [
                "",
                "---",
                "*Báo cáo được khởi tạo tự động bởi CyberSoft Data Quality Harness v0.*",
            ]
        )

        with open(out_file, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))

        return out_file
