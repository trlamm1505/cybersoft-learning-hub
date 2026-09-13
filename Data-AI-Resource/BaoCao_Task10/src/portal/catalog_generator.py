"""CyberSoft Dataset Registry - Catalog Generator.

Compiles registered and published datasets into multi-channel output formats:
1. CATALOG.md - High-readability GitHub Flavored Markdown catalog
2. catalog.json - Machine-readable JSON API manifest for Learning Platform integration
3. index.html - Interactive, responsive Web Portal UI
"""

from __future__ import annotations

from datetime import datetime
import json
from pathlib import Path
from typing import Optional

from ..core.registry_manager import RegistryManager
from ..core.models import DatasetState


class CatalogGenerator:
    """Renders public documentation and integration endpoints from the registry."""

    def __init__(
        self,
        manager: Optional[RegistryManager] = None,
        output_dir: Optional[Path] = None,
    ):
        self.manager = manager or RegistryManager()
        self.base_dir = Path(__file__).resolve().parent.parent.parent
        self.output_dir = output_dir or (self.base_dir / "catalog")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def build_all(self) -> dict[str, Path]:
        """Generates CATALOG.md, catalog.json, and index.html."""
        md_path = self.build_markdown()
        json_path = self.build_json()
        html_path = self.build_html()
        return {"markdown": md_path, "json": json_path, "html": html_path}

    def build_markdown(self) -> Path:
        """Generates CATALOG.md documenting published dataset assets."""
        datasets = self.manager.list_all()
        published_count = sum(
            1 for d in datasets if d.latest_published_version is not None
        )

        md = []
        md.append("# 🏛️ CyberSoft Dataset Registry & Resource Catalog")
        md.append("")
        md.append(
            "> **Hệ thống Quản lý và Xuất bản Tài nguyên Dữ liệu Thực hành AI-Native**  "
        )
        md.append(
            f"> *Phiên bản Registry: 1.0.0 | Cập nhật lần cuối: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%SZ')}*"
        )
        md.append("")
        md.append("---")
        md.append("")
        md.append("## 📊 Tổng quan Tài nguyên (Registry Metrics)")
        md.append("")
        md.append(f"- **Tổng số Bộ dữ liệu đã đăng ký:** `{len(datasets)}`")
        md.append(f"- **Bộ dữ liệu ĐÃ XUẤT BẢN (Published):** `{published_count}`")
        md.append(
            "- **Quy tắc Kiểm soát Chất lượng (Quality Gate):** $\\ge 95.0\\%$ điểm kiểm thử & $0$ lỗi chặn."
        )
        md.append("")
        md.append("---")
        md.append("")
        md.append("## 📋 Bảng Danh mục Tài nguyên Đã Xuất Bản")
        md.append("")
        md.append(
            "| Dataset ID | Tên Bộ Dữ Liệu | Version | Lĩnh vực (Domain) | Cấp độ | Quality Score | Đối tượng / Kỹ năng |"
        )
        md.append("| :--- | :--- | :---: | :---: | :---: | :---: | :--- |")

        for d in datasets:
            latest_v = d.latest_published_version
            if not latest_v or latest_v not in d.versions:
                continue
            ventry = d.versions[latest_v]
            q_score = (
                f"{ventry.quality_gate.score:.1f}%" if ventry.quality_gate else "N/A"
            )
            skills_badge = ", ".join(d.skills[:3]) if d.skills else "Analytics"
            md.append(
                f"| **`{d.id}`** | **{d.name}** | `v{latest_v}` | `{d.domain}` | `{d.difficulty_level}` | **{q_score}** | {skills_badge} |"
            )

        md.append("")
        md.append("---")
        md.append("")
        md.append("## 🔍 Chi tiết Từng Bộ Dữ Liệu")
        md.append("")

        for d in datasets:
            latest_v = d.latest_published_version
            if not latest_v or latest_v not in d.versions:
                continue
            ventry = d.versions[latest_v]
            q_res = ventry.quality_gate

            md.append(f"### 📦 `{d.id}` — {d.name}")
            md.append(f"- **Mô tả:** {d.description}")
            md.append(
                f"- **Phiên bản mới nhất:** `v{latest_v}` (Xuất bản: `{ventry.published_at}`)"
            )
            md.append(
                f"- **Domain:** `{d.domain}` | **Độ khó:** `{d.difficulty_level}` | **Giấy phép:** `{d.license}`"
            )
            md.append(
                f"- **Tuân thủ PII:** `{'An toàn (Đã ẩn danh)' if d.pii_safe else 'Có chứa PII giả lập có kiểm soát'}`"
            )
            md.append(
                f"- **Điểm Quality Gate:** **{q_res.score:.1f}%** ({q_res.passed_checks}/{q_res.total_checks} tiêu chí pass)"
            )
            md.append(f"- **Kỹ năng đào tạo:** {', '.join(d.skills)}")
            md.append(f"- **Vai trò đích:** {', '.join(d.target_roles)}")
            md.append(f"- **File Manifest:** `{ventry.manifest_path}`")
            if ventry.data_paths:
                md.append("- **Tài nguyên đính kèm:**")
                for dp in ventry.data_paths:
                    md.append(f"  - `{dp}`")
            md.append("")
            md.append("---")
            md.append("")

        out_path = self.output_dir / "CATALOG.md"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write("\n".join(md))
        return out_path

    def build_json(self) -> Path:
        """Generates catalog.json for Learning Platform and CI consumption."""
        datasets = self.manager.list_all()
        catalog_data = {
            "catalog_version": "1.0.0",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "total_datasets": len(datasets),
            "published_datasets": [
                {
                    "id": d.id,
                    "name": d.name,
                    "description": d.description,
                    "domain": d.domain,
                    "difficulty_level": d.difficulty_level,
                    "target_roles": d.target_roles,
                    "skills": d.skills,
                    "license": d.license,
                    "pii_safe": d.pii_safe,
                    "latest_published_version": d.latest_published_version,
                    "versions": {
                        v_num: v_data.model_dump()
                        for v_num, v_data in d.versions.items()
                        if v_data.state == DatasetState.PUBLISHED
                    },
                }
                for d in datasets
                if d.latest_published_version is not None
            ],
        }

        out_path = self.output_dir / "catalog.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(catalog_data, f, indent=2, ensure_ascii=False)
        return out_path

    def build_html(self) -> Path:
        """Generates an interactive HTML portal."""
        datasets = self.manager.list_all()
        published = [d for d in datasets if d.latest_published_version is not None]

        cards_html = []
        for d in published:
            v_entry = d.versions[d.latest_published_version]
            q_score = (
                f"{v_entry.quality_gate.score:.1f}%" if v_entry.quality_gate else "N/A"
            )
            skills_pills = "".join(
                f'<span class="badge skill-badge">{s}</span>' for s in d.skills[:5]
            )
            cards_html.append(f"""
            <div class="dataset-card" data-domain="{d.domain}" data-level="{d.difficulty_level}">
                <div class="card-header">
                    <div>
                        <span class="badge domain-badge">{d.domain.upper()}</span>
                        <span class="badge level-badge">{d.difficulty_level.upper()}</span>
                        <span class="badge quality-badge">✓ Quality {q_score}</span>
                    </div>
                    <span class="version-tag">v{d.latest_published_version}</span>
                </div>
                <h3>{d.name}</h3>
                <p class="dataset-id">ID: <code>{d.id}</code></p>
                <p class="description">{d.description}</p>
                <div class="skills-wrap">
                    {skills_pills}
                </div>
                <div class="card-footer">
                    <span class="license">License: {d.license}</span>
                    <button class="btn-detail" onclick="alert('Dataset ID: {d.id}\\nManifest: {v_entry.manifest_path}')">Xem Chi Tiết</button>
                </div>
            </div>
            """)

        html_content = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CyberSoft Dataset Registry & Publishing Portal</title>
    <style>
        :root {{
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --bg: #0f172a;
            --card-bg: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-green: #10b981;
            --border: #334155;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text-main); line-height: 1.6; padding: 32px 16px; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        header {{ text-align: center; margin-bottom: 40px; }}
        header h1 {{ font-size: 2.4rem; color: #60a5fa; margin-bottom: 12px; }}
        header p {{ color: var(--text-muted); font-size: 1.1rem; }}
        .search-bar-wrap {{ margin: 24px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }}
        .search-input {{ width: 100%; max-width: 500px; padding: 12px 18px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: white; font-size: 1rem; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 24px; }}
        .dataset-card {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s; }}
        .dataset-card:hover {{ transform: translateY(-4px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4); border-color: #3b82f6; }}
        .card-header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 6px; }}
        .domain-badge {{ background: #0284c7; color: white; }}
        .level-badge {{ background: #475569; color: white; }}
        .quality-badge {{ background: var(--accent-green); color: white; }}
        .skill-badge {{ background: #334155; color: #cbd5e1; margin: 3px; font-size: 0.72rem; }}
        .version-tag {{ font-size: 0.85rem; color: #38bdf8; font-family: monospace; }}
        .dataset-card h3 {{ font-size: 1.3rem; margin-bottom: 8px; color: #f1f5f9; }}
        .dataset-id {{ font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }}
        .dataset-id code {{ color: #a5b4fc; }}
        .description {{ color: #cbd5e1; font-size: 0.95rem; margin-bottom: 16px; flex-grow: 1; }}
        .skills-wrap {{ margin-bottom: 20px; }}
        .card-footer {{ display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 16px; font-size: 0.85rem; color: var(--text-muted); }}
        .btn-detail {{ background: var(--primary); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; transition: background 0.2s; }}
        .btn-detail:hover {{ background: var(--primary-dark); }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏛️ CyberSoft Dataset Registry & Portal</h1>
            <p>Cổng Xuất Bản & Tra Cứu Tài Nguyên Dữ Liệu Thực Hành AI & Phân Tích Dữ Liệu</p>
            <div class="search-bar-wrap">
                <input type="text" id="searchInput" class="search-input" placeholder="🔍 Tìm kiếm dataset theo tên, kỹ năng, domain..." onkeyup="filterCards()">
            </div>
        </header>

        <main class="grid" id="datasetGrid">
            {''.join(cards_html)}
        </main>
    </div>

    <script>
        function filterCards() {{
            const query = document.getElementById('searchInput').value.toLowerCase();
            const cards = document.querySelectorAll('.dataset-card');
            cards.forEach(card => {{
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(query) ? 'flex' : 'none';
            }});
        }}
    </script>
</body>
</html>
"""
        out_path = self.output_dir / "index.html"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return out_path
