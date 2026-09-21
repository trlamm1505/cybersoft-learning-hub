"""Generate High-Resolution Architecture & Layout Diagram for Task 15:
Picture_15_Detail.png & Picture_15-Detail.png
"""

import os
import shutil
import sys
import matplotlib.pyplot as plt
import matplotlib.patches as patches

if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def generate_diagram():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_path = os.path.join(base_dir, "Picture_15_Detail.png")
    output_path_dash = os.path.join(base_dir, "Picture_15-Detail.png")

    fig, ax = plt.subplots(figsize=(18, 11), dpi=300)
    ax.set_facecolor("#0F172A")  # Slate 900 dark theme
    fig.patch.set_facecolor("#0F172A")
    ax.axis("off")

    # Title Banner
    title_box = patches.FancyBboxPatch(
        (0.04, 0.90),
        0.92,
        0.08,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#38BDF8",
        linewidth=2,
    )
    ax.add_patch(title_box)
    ax.text(
        0.50,
        0.945,
        "CYBERSOFT DATA & AI LAB — RESOURCE QUALITY & OBSERVABILITY DASHBOARD v0.1",
        ha="center",
        va="center",
        color="#38BDF8",
        fontsize=17,
        fontweight="bold",
        family="sans-serif",
    )
    ax.text(
        0.50,
        0.915,
        "Unified Telemetry, 10 Metric Definitions (RQI), Multi-Dimensional Slicing & Quality Gate Drill-Down",
        ha="center",
        va="center",
        color="#94A3B8",
        fontsize=11,
        family="sans-serif",
    )

    # Box 1: Ingestion & Resource Discovery Layer (Top-Left)
    box1 = patches.FancyBboxPatch(
        (0.04, 0.48),
        0.44,
        0.39,
        boxstyle="round,pad=0.01",
        facecolor="#1E293B",
        edgecolor="#818CF8",
        linewidth=1.5,
    )
    ax.add_patch(box1)
    ax.text(
        0.06,
        0.84,
        "1. RESOURCE INGESTION & DISCOVERY LAYER",
        color="#818CF8",
        fontsize=12,
        fontweight="bold",
    )

    ingest_items = [
        (
            "Task 10 Dataset Registry",
            "registry_db.json: 4 datasets (Retail, HR, RAG, Quarantine)",
        ),
        (
            "Tasks 11-14 Project Bank",
            "Capstones DA-01, DA-02, AI-01 & Standard Template",
        ),
        (
            "Quality Gate Telemetry",
            "Schema compliance, null checks, foreign keys & linter logs",
        ),
        ("Pedagogical Artifacts", "Briefs, Tiered Hints, 100đ Rubrics & Pytest suites"),
        (
            "Zero-Leakage Inspector",
            "Automated regex scan for ground-truth in student edition",
        ),
    ]
    y_pos = 0.79
    for title, desc in ingest_items:
        ax.text(
            0.06, y_pos, f"• {title}:", color="#F8FAFC", fontsize=10, fontweight="bold"
        )
        ax.text(0.08, y_pos - 0.028, desc, color="#94A3B8", fontsize=9)
        y_pos -= 0.065

    # Box 2: CRQOF Metric Computation Engine (Top-Right)
    box2 = patches.FancyBboxPatch(
        (0.52, 0.48),
        0.44,
        0.39,
        boxstyle="round,pad=0.01",
        facecolor="#1E293B",
        edgecolor="#34D399",
        linewidth=1.5,
    )
    ax.add_patch(box2)
    ax.text(
        0.54,
        0.84,
        "2. METRIC ENGINE: COMPOSITE RQI FORMULA",
        color="#34D399",
        fontsize=12,
        fontweight="bold",
    )

    metric_items = [
        (
            "QG (20%) - Quality Gate",
            "Constraint tests pass rate: (passed / total) * 100",
        ),
        ("SV (15%) - Schema Validity", "JSON Schema Draft 2020-12 contract compliance"),
        (
            "CP (15%) - Completeness",
            "5 required blocks: Data, Brief, Starter, Solutions, Tests",
        ),
        ("AL (15%) - Anti-Leakage", "100% Zero-Leakage verified in student edition"),
        (
            "TPR (15%) - Test Pass Rate",
            "Automated Pytest regression suite pass percentage",
        ),
        (
            "RO (10%) - Rubric Objectivity",
            "100% quantitative tolerances, zero subjective grading",
        ),
        (
            "BI (10%) - Business Integrity",
            "3-way triangulation (Delta = 0), Ground Truth Precision",
        ),
    ]
    y_pos = 0.80
    for code_name, desc in metric_items:
        ax.text(
            0.54,
            y_pos,
            f"• {code_name}:",
            color="#F8FAFC",
            fontsize=9.5,
            fontweight="bold",
        )
        ax.text(0.56, y_pos - 0.022, desc, color="#94A3B8", fontsize=8.5)
        y_pos -= 0.045

    # Box 3: Multi-Dimensional Slicing & Filter Engine (Bottom-Left)
    box3 = patches.FancyBboxPatch(
        (0.04, 0.06),
        0.44,
        0.39,
        boxstyle="round,pad=0.01",
        facecolor="#1E293B",
        edgecolor="#F59E0B",
        linewidth=1.5,
    )
    ax.add_patch(box3)
    ax.text(
        0.06,
        0.42,
        "3. MULTI-DIMENSIONAL SLICING & FILTERING",
        color="#F59E0B",
        fontsize=12,
        fontweight="bold",
    )

    filter_items = [
        ("Track Slicing", "Data Analyst (DA) | AI Engineer (AIE) | Shared/Foundation"),
        ("Domain Slicing", "Retail E-Commerce | HR Operations | Logistics | NLP & RAG"),
        (
            "Difficulty Slicing",
            "Beginner (Cơ bản) | Intermediate (Vận dụng) | Advanced (Chuyên sâu)",
        ),
        (
            "Quality Tier Slicing",
            "Gold (RQI >= 95) | Silver (85-94) | Bronze (70-84) | Quarantined",
        ),
        (
            "Full-Text Search",
            "Interactive search across ID, Name, Description, and Core Skills",
        ),
    ]
    y_pos = 0.37
    for title, desc in filter_items:
        ax.text(
            0.06, y_pos, f"• {title}:", color="#F8FAFC", fontsize=10, fontweight="bold"
        )
        ax.text(0.08, y_pos - 0.028, desc, color="#94A3B8", fontsize=9)
        y_pos -= 0.065

    # Box 4: Streamlit UI & Drill-Down Observability (Bottom-Right)
    box4 = patches.FancyBboxPatch(
        (0.52, 0.06),
        0.44,
        0.39,
        boxstyle="round,pad=0.01",
        facecolor="#1E293B",
        edgecolor="#38BDF8",
        linewidth=1.5,
    )
    ax.add_patch(box4)
    ax.text(
        0.54,
        0.42,
        "4. STREAMLIT OBSERVABILITY & DRILL-DOWN",
        color="#38BDF8",
        fontsize=12,
        fontweight="bold",
    )

    ui_items = [
        (
            "KPI Summary Cards",
            "Total Assets (8) | Records (11.6k+) | Avg RQI (97.7) | Test Pass (100%)",
        ),
        (
            "Observability Analytics",
            "Track/Domain Breakdown Table & Quality Tier Distribution",
        ),
        (
            "Interactive Catalog",
            "Real-time filtered table with dynamic RQI badges & status",
        ),
        (
            "Metadata Drill-Down",
            "Version, License, Author, Data Files, Duration & Dependencies",
        ),
        (
            "Audit & Violation Inspector",
            "Root-cause diagnostics for quarantined assets (e.g. dirty lineage)",
        ),
        (
            "Export Snapshot Engine",
            "Download filtered view as JSON snapshot & static HTML report",
        ),
    ]
    y_pos = 0.37
    for title, desc in ui_items:
        ax.text(
            0.54, y_pos, f"• {title}:", color="#F8FAFC", fontsize=9.5, fontweight="bold"
        )
        ax.text(0.56, y_pos - 0.022, desc, color="#94A3B8", fontsize=8.5)
        y_pos -= 0.052

    # Inter-box connector arrows
    arrow_props = dict(
        facecolor="#64748B", edgecolor="#64748B", width=1.5, headwidth=6, shrink=0.05
    )
    ax.annotate("", xy=(0.52, 0.67), xytext=(0.48, 0.67), arrowprops=arrow_props)
    ax.annotate("", xy=(0.26, 0.45), xytext=(0.26, 0.48), arrowprops=arrow_props)
    ax.annotate("", xy=(0.74, 0.45), xytext=(0.74, 0.48), arrowprops=arrow_props)
    ax.annotate("", xy=(0.52, 0.25), xytext=(0.48, 0.25), arrowprops=arrow_props)

    plt.tight_layout()
    plt.savefig(
        output_path,
        bbox_inches="tight",
        facecolor=fig.get_facecolor(),
        edgecolor="none",
    )
    shutil.copy2(output_path, output_path_dash)
    plt.close()

    print(
        f"[SUCCESS] Generated Task 15 diagrams:\n - {output_path}\n - {output_path_dash}"
    )


if __name__ == "__main__":
    generate_diagram()
