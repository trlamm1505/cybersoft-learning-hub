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

        details_map = {}
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
                    <button class="btn-detail" onclick="openDetailModal('{d.id}')">Xem Chi Tiết</button>
                </div>
            </div>
            """)

            # Load full manifest for interactive modal
            manifest_obj = {}
            try:
                resolved_manifest = self.manager.resolve_path(v_entry.manifest_path)
                if resolved_manifest.exists():
                    with open(resolved_manifest, "r", encoding="utf-8") as mf:
                        manifest_obj = json.load(mf)
            except Exception:
                pass

            details_map[d.id] = {
                "id": d.id,
                "name": d.name,
                "version": d.latest_published_version,
                "domain": d.domain,
                "difficulty_level": d.difficulty_level,
                "description": d.description,
                "license": d.license,
                "skills": d.skills,
                "quality_score": q_score,
                "manifest_path": v_entry.manifest_path,
                "manifest": manifest_obj,
            }

        registry_data_json = json.dumps(details_map, ensure_ascii=False)

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
            --card-hover: #24344d;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-green: #10b981;
            --border: #334155;
            --accent-cyan: #06b6d4;
            --accent-amber: #f59e0b;
        }}
        * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        body {{ background-color: var(--bg); color: var(--text-main); line-height: 1.6; padding: 32px 16px; min-height: 100vh; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        header {{ text-align: center; margin-bottom: 40px; }}
        header h1 {{ font-size: 2.4rem; color: #60a5fa; margin-bottom: 12px; }}
        header p {{ color: var(--text-muted); font-size: 1.1rem; }}
        .search-bar-wrap {{ margin: 24px 0; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }}
        .search-input {{ width: 100%; max-width: 550px; padding: 12px 20px; border-radius: 8px; border: 1px solid var(--border); background: var(--card-bg); color: white; font-size: 1rem; outline: none; transition: border-color 0.2s; }}
        .search-input:focus {{ border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,0.2); }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }}
        .dataset-card {{ background: var(--card-bg); border: 1px solid var(--border); border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; }}
        .dataset-card:hover {{ transform: translateY(-4px); box-shadow: 0 12px 30px -5px rgba(0,0,0,0.45); border-color: #3b82f6; background: var(--card-hover); }}
        .card-header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; margin-right: 6px; }}
        .domain-badge {{ background: #0284c7; color: white; }}
        .level-badge {{ background: #475569; color: white; }}
        .quality-badge {{ background: var(--accent-green); color: white; }}
        .skill-badge {{ background: #334155; color: #cbd5e1; margin: 3px; font-size: 0.72rem; }}
        .version-tag {{ font-size: 0.85rem; color: #38bdf8; font-family: monospace; font-weight: 600; }}
        .dataset-card h3 {{ font-size: 1.3rem; margin-bottom: 8px; color: #f1f5f9; }}
        .dataset-id {{ font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px; }}
        .dataset-id code {{ color: #a5b4fc; background: rgba(99,102,241,0.15); padding: 2px 6px; border-radius: 4px; }}
        .description {{ color: #cbd5e1; font-size: 0.95rem; margin-bottom: 16px; flex-grow: 1; }}
        .skills-wrap {{ margin-bottom: 20px; }}
        .card-footer {{ display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 16px; font-size: 0.85rem; color: var(--text-muted); }}
        .btn-detail {{ background: var(--primary); color: white; border: none; padding: 9px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.2s, transform 0.1s; }}
        .btn-detail:hover {{ background: var(--primary-dark); transform: scale(1.02); }}

        /* Modal Styles */
        .modal-overlay {{ position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.82); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }}
        .modal-overlay.active {{ display: flex; }}
        .modal-container {{ background: #1e293b; border: 1px solid #334155; border-radius: 14px; width: 100%; max-width: 960px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6); overflow: hidden; animation: modalFadeIn 0.25s ease-out; }}
        @keyframes modalFadeIn {{ from {{ opacity: 0; transform: translateY(12px) scale(0.98); }} to {{ opacity: 1; transform: translateY(0) scale(1); }} }}
        .modal-header {{ padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start; background: #162032; }}
        .modal-header h2 {{ font-size: 1.4rem; color: #f8fafc; margin-bottom: 6px; }}
        .modal-header-badges {{ display: flex; gap: 8px; flex-wrap: wrap; margin-top: 6px; }}
        .modal-close {{ background: transparent; border: none; font-size: 1.8rem; color: var(--text-muted); cursor: pointer; line-height: 1; padding: 0 4px; transition: color 0.2s; }}
        .modal-close:hover {{ color: #f8fafc; }}
        .modal-tabs {{ display: flex; background: #0f172a; border-bottom: 1px solid var(--border); overflow-x: auto; }}
        .tab-btn {{ background: transparent; border: none; color: var(--text-muted); padding: 12px 18px; cursor: pointer; font-size: 0.9rem; font-weight: 600; white-space: nowrap; border-bottom: 2px solid transparent; transition: all 0.2s; }}
        .tab-btn:hover {{ color: #f8fafc; background: rgba(255,255,255,0.03); }}
        .tab-btn.active {{ color: #60a5fa; border-bottom-color: #60a5fa; background: #1e293b; }}
        .modal-body {{ padding: 24px; overflow-y: auto; flex-grow: 1; }}
        .tab-pane {{ display: none; }}
        .tab-pane.active {{ display: block; }}

        /* Detail Elements */
        .info-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px; }}
        .info-card {{ background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; }}
        .info-card-label {{ font-size: 0.78rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }}
        .info-card-value {{ font-size: 0.95rem; color: #f1f5f9; font-weight: 500; word-break: break-all; }}
        .section-title {{ font-size: 1.1rem; color: #93c5fd; margin: 20px 0 10px 0; border-bottom: 1px solid #334155; padding-bottom: 6px; }}
        .schema-table-wrap {{ margin-top: 14px; overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }}
        .schema-table {{ width: 100%; border-collapse: collapse; font-size: 0.88rem; text-align: left; }}
        .schema-table th {{ background: #0f172a; color: #94a3b8; padding: 10px 14px; font-weight: 600; border-bottom: 1px solid var(--border); }}
        .schema-table td {{ padding: 10px 14px; border-bottom: 1px solid #283548; color: #cbd5e1; }}
        .schema-table tr:last-child td {{ border-bottom: none; }}
        .schema-table tr:hover td {{ background: rgba(255,255,255,0.02); }}
        .pill-pk {{ background: #854d0e; color: #fef08a; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; margin-left: 6px; }}
        .pill-pii {{ background: #991b1b; color: #fecaca; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 600; }}
        .code-box {{ background: #0b1120; border: 1px solid var(--border); border-radius: 8px; padding: 16px; font-family: "SFMono-Regular", Consolas, Menlo, monospace; font-size: 0.85rem; color: #cbd5e1; overflow-x: auto; white-space: pre-wrap; word-break: break-word; max-height: 400px; }}
        .copy-btn {{ background: #334155; color: white; border: none; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; margin-bottom: 10px; transition: background 0.2s; }}
        .copy-btn:hover {{ background: #475569; }}
        ul.styled-list {{ padding-left: 20px; color: #cbd5e1; margin-top: 8px; }}
        ul.styled-list li {{ margin-bottom: 6px; }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🏛️ CyberSoft Dataset Registry & Portal</h1>
            <p>Cổng Xuất Bản & Tra Cứu Tài Nguyên Dữ Liệu Thực Hành AI & Phân Tích Dữ Liệu</p>
            <div class="search-bar-wrap">
                <input type="text" id="searchInput" class="search-input" placeholder="🔍 Tìm kiếm dataset theo tên, kỹ năng, domain, id..." onkeyup="filterCards()">
            </div>
        </header>

        <main class="grid" id="datasetGrid">
            {''.join(cards_html)}
        </main>
    </div>

    <!-- Interactive Detail Modal -->
    <div id="detailModal" class="modal-overlay" onclick="handleOverlayClick(event)">
        <div class="modal-container">
            <div class="modal-header">
                <div>
                    <h2 id="modalTitle">Dataset Name</h2>
                    <div id="modalBadges" class="modal-header-badges"></div>
                </div>
                <button class="modal-close" onclick="closeDetailModal()">&times;</button>
            </div>
            <div class="modal-tabs">
                <button class="tab-btn active" onclick="switchModalTab('tab-overview', this)">📋 Tổng quan</button>
                <button class="tab-btn" onclick="switchModalTab('tab-schema', this)">🗄️ Cấu trúc Bảng & Cột</button>
                <button class="tab-btn" onclick="switchModalTab('tab-governance', this)">🛡️ Quản trị & PII</button>
                <button class="tab-btn" onclick="switchModalTab('tab-pedagogy', this)">🎯 Mục tiêu Đào tạo</button>
                <button class="tab-btn" onclick="switchModalTab('tab-raw', this)">⚙️ Manifest JSON</button>
            </div>
            <div class="modal-body">
                <div id="tab-overview" class="tab-pane active"></div>
                <div id="tab-schema" class="tab-pane"></div>
                <div id="tab-governance" class="tab-pane"></div>
                <div id="tab-pedagogy" class="tab-pane"></div>
                <div id="tab-raw" class="tab-pane"></div>
            </div>
        </div>
    </div>

    <script id="registryData" type="application/json">
{registry_data_json}
    </script>

    <script>
        const registryData = JSON.parse(document.getElementById('registryData').textContent);

        function filterCards() {{
            const query = document.getElementById('searchInput').value.toLowerCase();
            const cards = document.querySelectorAll('.dataset-card');
            cards.forEach(card => {{
                const text = card.innerText.toLowerCase();
                card.style.display = text.includes(query) ? 'flex' : 'none';
            }});
        }}

        function openDetailModal(datasetId) {{
            const item = registryData[datasetId];
            if (!item) return;

            const m = item.manifest || {{}};

            // Header Title & Badges
            document.getElementById('modalTitle').innerText = item.name;
            document.getElementById('modalBadges').innerHTML = `
                <span class="badge domain-badge">${{(item.domain || '').toUpperCase()}}</span>
                <span class="badge level-badge">${{(item.difficulty_level || '').toUpperCase()}}</span>
                <span class="badge quality-badge">✓ Quality ${{item.quality_score}}</span>
                <span class="version-tag">Version ${{item.version}}</span>
            `;

            // Tab 1: Overview
            document.getElementById('tab-overview').innerHTML = `
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-card-label">Dataset ID</div>
                        <div class="info-card-value"><code>${{item.id}}</code></div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Bản quyền (License)</div>
                        <div class="info-card-value">${{item.license || m.license || 'N/A'}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Tác giả (Author)</div>
                        <div class="info-card-value">${{m.author || 'CyberSoft Data & AI'}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Maintainer</div>
                        <div class="info-card-value">${{m.maintainer || 'AI Resource Team'}}</div>
                    </div>
                </div>
                <div class="section-title">Mô tả tổng quát</div>
                <p style="color: #cbd5e1; line-height: 1.7; margin-bottom: 16px;">${{item.description}}</p>
                <div class="section-title">Kỹ năng áp dụng</div>
                <div style="margin-top: 8px;">
                    ${{(item.skills || []).map(s => `<span class="badge skill-badge" style="padding: 6px 12px; font-size: 0.8rem;">${{s}}</span>`).join('')}}
                </div>
                <div class="section-title">Đường dẫn Manifest</div>
                <div class="code-box" style="padding: 10px 14px;">${{item.manifest_path}}</div>
            `;

            // Tab 2: Schema & Tables
            const tables = m.tables || [];
            let tablesHtml = '';
            if (tables.length === 0) {{
                tablesHtml = '<p style="color: var(--text-muted);">Không có thông tin chi tiết bảng trong manifest.</p>';
            }} else {{
                tables.forEach(tbl => {{
                    const pkCols = tbl.primary_key || [];
                    const cols = tbl.columns || [];
                    tablesHtml += `
                        <div style="margin-bottom: 28px; background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 18px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
                                <h3 style="color: #38bdf8; font-size: 1.15rem;">📊 Bảng: <code>${{tbl.table_name}}</code></h3>
                                <span style="font-size: 0.8rem; color: var(--text-muted);">${{tbl.row_count || 0}} dòng • ${{tbl.column_count || cols.length}} cột • Định dạng: <b>${{tbl.format}}</b></span>
                            </div>
                            <p style="color: #94a3b8; font-size: 0.9rem; margin-bottom: 12px;">${{tbl.description || ''}}</p>
                            <p style="color: #64748b; font-size: 0.82rem; margin-bottom: 12px;">File: <code>${{tbl.file_path}}</code></p>
                            <div class="schema-table-wrap">
                                <table class="schema-table">
                                    <thead>
                                        <tr>
                                            <th>Tên Cột</th>
                                            <th>Kiểu Dữ Liệu</th>
                                            <th>Nullable</th>
                                            <th>PII</th>
                                            <th>Mô tả</th>
                                            <th>Ví dụ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${{cols.map(c => `
                                            <tr>
                                                <td>
                                                    <b>${{c.name}}</b>
                                                    ${{pkCols.includes(c.name) ? '<span class="pill-pk">PK</span>' : ''}}
                                                </td>
                                                <td><code style="color: #a5b4fc;">${{c.data_type}}</code></td>
                                                <td>${{c.nullable ? '<span style="color:#f59e0b;">Có</span>' : '<span style="color:#10b981;">Không</span>'}}</td>
                                                <td>${{c.is_pii ? '<span class="pill-pii">PII</span>' : '<span style="color: #64748b;">Không</span>'}}</td>
                                                <td>${{c.description || ''}}</td>
                                                <td style="color: #94a3b8; font-family: monospace;">${{c.example !== null && c.example !== undefined ? c.example : '-'}}</td>
                                            </tr>
                                        `).join('')}}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }});
            }}
            document.getElementById('tab-schema').innerHTML = tablesHtml;

            // Tab 3: Governance & PII
            const pii = m.pii || {{}};
            const integrity = m.integrity || {{}};
            const lineage = m.lineage || {{}};
            document.getElementById('tab-governance').innerHTML = `
                <div class="section-title" style="margin-top: 0;">Chính sách Bảo vệ Dữ liệu & PII</div>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-card-label">Mức độ nhạy cảm PII</div>
                        <div class="info-card-value"><b style="color: ${{pii.level === 'none' ? '#10b981' : '#f59e0b'}};">${{(pii.level || 'none').toUpperCase()}}</b></div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Có chứa PII thực tế</div>
                        <div class="info-card-value">${{pii.has_pii ? '<span class="pill-pii">CÓ</span>' : '<span style="color:#10b981;">KHÔNG</span>'}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Tiêu chuẩn tuân thủ</div>
                        <div class="info-card-value">${{(pii.compliance_tags || []).join(', ') || 'INTERNAL_CYBERSOFT'}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Phương pháp ẩn danh</div>
                        <div class="info-card-value">${{(pii.anonymization_applied || []).join(', ') || 'synthetic'}}</div>
                    </div>
                </div>
                <div style="background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 14px; margin-bottom: 20px;">
                    <div class="info-card-label">Hướng dẫn xử lý an toàn:</div>
                    <p style="color: #cbd5e1; font-size: 0.9rem; margin-top: 4px;">${{pii.handling_instructions || 'Tuân thủ quy định sử dụng dữ liệu thực hành nội bộ của CyberSoft.'}}</p>
                </div>

                <div class="section-title">Tính Toàn Vẹn Dữ Liệu (Integrity)</div>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-card-label">Thuật toán Checksum</div>
                        <div class="info-card-value">${{integrity.algorithm || 'SHA-256'}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Dung lượng Package</div>
                        <div class="info-card-value">${{integrity.file_size_bytes ? integrity.file_size_bytes + ' bytes' : 'N/A'}}</div>
                    </div>
                </div>
                <div style="background: #0f172a; border: 1px solid var(--border); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
                    <div class="info-card-label">Mã băm SHA-256 Checksum:</div>
                    <div style="color: #38bdf8; font-family: monospace; font-size: 0.85rem; word-break: break-all; margin-top: 4px;">${{integrity.checksum || 'N/A'}}</div>
                </div>

                <div class="section-title">Nguồn Gốc & Quy Trình Xử Lý (Lineage)</div>
                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-card-label">Hệ thống nguồn</div>
                        <div class="info-card-value">${{lineage.source_system || 'CyberSoft Lab'}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-card-label">Phương pháp thu thập</div>
                        <div class="info-card-value">${{lineage.ingestion_method || 'synthetic'}}</div>
                    </div>
                </div>
                <div class="info-card-label" style="margin-top: 12px;">Các bước Transformation Pipeline:</div>
                <ul class="styled-list">
                    ${{(lineage.transformation_pipeline || []).map(step => `<li>${{step}}</li>`).join('')}}
                </ul>
            `;

            // Tab 4: Pedagogy & Learning Outcomes
            const lo = m.learning_outcomes || {{}};
            document.getElementById('tab-pedagogy').innerHTML = `
                <div class="section-title" style="margin-top: 0;">Định Hướng Nghề Nghiệp (Target Roles)</div>
                <div style="margin-bottom: 16px;">
                    ${{(lo.target_roles || []).map(r => `<span class="badge domain-badge" style="padding: 6px 14px; font-size: 0.85rem;">${{r.replace('_', ' ').toUpperCase()}}</span>`).join('')}}
                </div>
                <div class="section-title">Năng Lực Cốt Lõi (Core Competencies)</div>
                <ul class="styled-list" style="margin-bottom: 18px;">
                    ${{(lo.core_competencies || []).map(c => `<li><b>${{c}}</b></li>`).join('')}}
                </ul>
                <div class="section-title">Câu Hỏi Nghiệp Vụ Mẫu (Sample Business Questions)</div>
                <ul class="styled-list" style="margin-bottom: 18px;">
                    ${{(lo.sample_business_questions || []).map(q => `<li>${{q}}</li>`).join('')}}
                </ul>
                <div class="section-title">Bài Tập & Lab Thực Hành Gợi Ý</div>
                <ul class="styled-list">
                    ${{(lo.recommended_exercises || []).map(e => `<li>${{e}}</li>`).join('')}}
                </ul>
            `;

            // Tab 5: Raw Manifest JSON
            const rawJsonStr = JSON.stringify(m, null, 2);
            document.getElementById('tab-raw').innerHTML = `
                <button class="copy-btn" id="copyJsonBtn" onclick="copyManifestJson()">📋 Sao chép toàn bộ JSON Manifest</button>
                <div class="code-box" id="rawJsonBox">${{rawJsonStr}}</div>
            `;

            // Reset to first tab
            const firstTabBtn = document.querySelector('.modal-tabs .tab-btn');
            switchModalTab('tab-overview', firstTabBtn);

            // Show Modal
            document.getElementById('detailModal').classList.add('active');
        }}

        function closeDetailModal() {{
            document.getElementById('detailModal').classList.remove('active');
        }}

        function handleOverlayClick(e) {{
            if (e.target.id === 'detailModal') {{
                closeDetailModal();
            }}
        }}

        function switchModalTab(tabId, btn) {{
            document.querySelectorAll('.modal-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.modal-body .tab-pane').forEach(p => p.classList.remove('active'));
            if (btn) btn.classList.add('active');
            const targetPane = document.getElementById(tabId);
            if (targetPane) targetPane.classList.add('active');
        }}

        function copyManifestJson() {{
            const code = document.getElementById('rawJsonBox').innerText;
            navigator.clipboard.writeText(code).then(() => {{
                const btn = document.getElementById('copyJsonBtn');
                btn.innerText = '✓ Đã sao chép vào Clipboard!';
                btn.style.background = '#10b981';
                setTimeout(() => {{
                    btn.innerText = '📋 Sao chép toàn bộ JSON Manifest';
                    btn.style.background = '#334155';
                }}, 2000);
            }});
        }}

        // Listen for ESC key
        document.addEventListener('keydown', (e) => {{
            if (e.key === 'Escape') closeDetailModal();
        }});
    </script>
</body>
</html>
"""
        out_path = self.output_dir / "index.html"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        return out_path
