"""
Generate High-Resolution Architecture Diagram for Capstone DA-02:
Picture_13-Detail.png
"""

import os
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
    output_path = os.path.join(base_dir, "Picture_13-Detail.png")

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
        "CYBERSOFT DATA & AI LAB — CAPSTONE DA-02 ARCHITECTURE",
        ha="center",
        va="center",
        color="#38BDF8",
        fontsize=18,
        fontweight="bold",
        family="sans-serif",
    )
    ax.text(
        0.50,
        0.915,
        "Multi-Warehouse Inventory Operations, 8 Business Edge Cases, 3-Way Triangulation & Auto-Grader",
        ha="center",
        va="center",
        color="#94A3B8",
        fontsize=11,
        family="sans-serif",
    )

    # 1. Multi-Warehouse Data Layer (Left Column)
    box1 = patches.FancyBboxPatch(
        (0.04, 0.44),
        0.28,
        0.43,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#818CF8",
        linewidth=1.5,
    )
    ax.add_patch(box1)
    ax.text(
        0.18,
        0.84,
        "1. MULTI-DC NETWORK & DATA INGESTION",
        ha="center",
        va="center",
        color="#818CF8",
        fontsize=12,
        fontweight="bold",
    )

    text_data = (
        "• Network Infrastructure (3 DCs):\n"
        "  - WH-HN01: North DC (5,000 sqm)\n"
        "  - WH-DN01: Central DC (2,500 sqm)\n"
        "  - WH-HCM01: South DC (8,000 sqm)\n\n"
        "• Product Portfolio (50 SKUs):\n"
        "  - Electronics, Office, Hardware Kits,\n"
        "    Peripherals, Audio Devices\n\n"
        "• Enterprise Data Tables (6 Datasets):\n"
        "  - inventory_movements (2,035 rows)\n"
        "  - products (50 SKUs with ROP & LeadTime)\n"
        "  - warehouses (3 Distribution Centers)\n"
        "  - purchase_orders (90 Supplier POs)\n"
        "  - sales_dispatches (500 Dispatches)\n"
        "  - inventory_audits (4 Quarters Audits)"
    )
    ax.text(
        0.06,
        0.63,
        text_data,
        ha="left",
        va="center",
        color="#E2E8F0",
        fontsize=9.5,
        family="sans-serif",
    )

    # 2. 8 Business Edge Cases Engine (Center-Top Box)
    box2 = patches.FancyBboxPatch(
        (0.35, 0.50),
        0.31,
        0.37,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#F59E0B",
        linewidth=1.5,
    )
    ax.add_patch(box2)
    ax.text(
        0.505,
        0.84,
        "2. 8 BUSINESS EDGE CASES ENGINE",
        ha="center",
        va="center",
        color="#F59E0B",
        fontsize=12,
        fontweight="bold",
    )

    text_edge = (
        "1. Negative Stock Anomaly (Data Entry Latency)\n"
        "2. In-Transit Transfer Lag (Overnight TRF)\n"
        "3. Scrap / Quarantine Stock Exclusion\n"
        "4. Uninspected Returns (Pending QA Review)\n"
        "5. Physical Audit Shrinkage Adjustment\n"
        "6. Barcode Double-Scan Deduplication\n"
        "7. Supplier Delivery Lead Time Spikes\n"
        "8. Null / Zero Unit Cost Imputation\n\n"
        "--> Dual Repository Partitioning:\n"
        "   - student_edition/ (Zero Answer Leakage)\n"
        "   - instructor_edition/ (Ground Truth KPIs)"
    )
    ax.text(
        0.365,
        0.67,
        text_edge,
        ha="left",
        va="center",
        color="#E2E8F0",
        fontsize=9.0,
        family="sans-serif",
    )

    # 3. 3-Way Triangulation Reconciliation Engine (Center-Bottom Box)
    box3 = patches.FancyBboxPatch(
        (0.35, 0.05),
        0.31,
        0.42,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#10B981",
        linewidth=1.5,
    )
    ax.add_patch(box3)
    ax.text(
        0.505,
        0.44,
        "3. 3-WAY RECONCILIATION ENGINE",
        ha="center",
        va="center",
        color="#10B981",
        fontsize=12,
        fontweight="bold",
    )

    text_recon = (
        "• Method 1: SQLite Transactional Aggregation\n"
        "  SUM(CASE WHEN direction='IN' THEN qty...)\n\n"
        "• Method 2: Pandas Vectorized Movement Matrix\n"
        "  Running cumulative stock & weighted cost\n\n"
        "• Method 3: Warehouse Balance Equation\n"
        "  End = Init + Inbound - Outbound + NetAudit\n\n"
        "Reconciliation Metrics (Delta = 0.00):\n"
        "  Ending Stock: 9,272 units (Match 100%)\n"
        "  Valuation: USD 867,636.11 (Match 100%)\n"
        "  Total COGS: USD 814,742.22 (Match 100%)\n"
        "  Inventory Turnover: 1.22x (DOH 300.4d)"
    )
    ax.text(
        0.365,
        0.235,
        text_recon,
        ha="left",
        va="center",
        color="#E2E8F0",
        fontsize=9.0,
        family="sans-serif",
    )

    # 4. Auto-Grader & Assessment Harness (Right-Top Box)
    box4 = patches.FancyBboxPatch(
        (0.69, 0.50),
        0.27,
        0.37,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#EC4899",
        linewidth=1.5,
    )
    ax.add_patch(box4)
    ax.text(
        0.825,
        0.84,
        "4. ASSESSMENT & AUTO-GRADER",
        ha="center",
        va="center",
        color="#EC4899",
        fontsize=12,
        fontweight="bold",
    )

    text_grader = (
        "• 100-Point Quantitative Rubric:\n"
        "  - 70 pts: Core (Data, Stock, COGS, Turnover)\n"
        "  - 30 pts: Extension (BI Model, Memo, Safety)\n\n"
        "• Auto-Grader 60/100 Points:\n"
        "  - Ending Units (10 pts, Tol: 0)\n"
        "  - Ending Valuation (10 pts, Tol: USD 0.05)\n"
        "  - Total COGS (10 pts, Tol: USD 0.05)\n"
        "  - Turnover Ratio (10 pts, Tol: 0.02)\n"
        "  - Warehouse Distribution (10 pts)\n"
        "  - ROP Alerts & Stockouts (10 pts)\n\n"
        "• Pytest Suite: 100% PASS in 1.8s"
    )
    ax.text(
        0.705,
        0.67,
        text_grader,
        ha="left",
        va="center",
        color="#E2E8F0",
        fontsize=9.0,
        family="sans-serif",
    )

    # 5. C-Level Executive Dashboard & Impact (Right-Bottom Box)
    box5 = patches.FancyBboxPatch(
        (0.69, 0.05),
        0.27,
        0.42,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#06B6D4",
        linewidth=1.5,
    )
    ax.add_patch(box5)
    ax.text(
        0.825,
        0.44,
        "5. C-LEVEL STAKEHOLDER MEMO",
        ha="center",
        va="center",
        color="#06B6D4",
        fontsize=12,
        fontweight="bold",
    )

    text_exec = (
        "• Answers to 10 C-Level Questions:\n"
        "  - COO: Network balance & fulfillment\n"
        "  - CFO: USD 867k capital tie-up, DOH 300d\n"
        "  - Warehouse: WH-DN01 density bottleneck\n"
        "  - Procurement: 10 Urgent ROP alerts\n"
        "  - Sales: 1 Critical Stockout (Audio ANC)\n"
        "  - Auditor: USD 3,076 Shrinkage loss\n"
        "  - QA/Ops: USD 3,712 Scrap damaged loss\n\n"
        "• 90-Day Strategic Roadmap:\n"
        "  - M1: Freeze slow DOH, recover USD 250k\n"
        "  - M2: Transfer 800 units DN01 to HCM01\n"
        "  - M3: RFID / WMS cycle counting"
    )
    ax.text(
        0.705,
        0.235,
        text_exec,
        ha="left",
        va="center",
        color="#E2E8F0",
        fontsize=9.0,
        family="sans-serif",
    )

    # 6. Bottom Banner (Technical Stack & Integrity)
    box6 = patches.FancyBboxPatch(
        (0.04, 0.05),
        0.28,
        0.36,
        boxstyle="round,pad=0.015",
        facecolor="#1E293B",
        edgecolor="#A855F7",
        linewidth=1.5,
    )
    ax.add_patch(box6)
    ax.text(
        0.18,
        0.38,
        "TECHNICAL VERIFICATION & DoD",
        ha="center",
        va="center",
        color="#A855F7",
        fontsize=12,
        fontweight="bold",
    )

    text_verif = (
        "• CLI Verification Commands:\n"
        "  - python cross_verification_engine.py\n"
        "  - python demo_capstone_workflow.py\n"
        "  - pytest BaoCao_Task13/tests/ -v\n\n"
        "• Zero-Leakage Defense Guarantee:\n"
        "  100% regex scan clean in student_edition\n\n"
        "• 10/10 Definition of Done Criteria:\n"
        "  All deliverables approved (Exit Code 0)"
    )
    ax.text(
        0.06,
        0.20,
        text_verif,
        ha="left",
        va="center",
        color="#E2E8F0",
        fontsize=9.2,
        family="sans-serif",
    )

    # Draw Connector Arrows
    arrow_props = dict(
        facecolor="#38BDF8", edgecolor="#38BDF8", width=1.5, headwidth=6, headlength=7
    )
    # 1 -> 2
    ax.annotate("", xy=(0.345, 0.68), xytext=(0.325, 0.68), arrowprops=arrow_props)
    # 2 -> 3
    ax.annotate("", xy=(0.505, 0.48), xytext=(0.505, 0.50), arrowprops=arrow_props)
    # 2 -> 4
    ax.annotate("", xy=(0.685, 0.68), xytext=(0.665, 0.68), arrowprops=arrow_props)
    # 3 -> 5
    ax.annotate("", xy=(0.685, 0.26), xytext=(0.665, 0.26), arrowprops=arrow_props)

    plt.tight_layout()
    plt.savefig(output_path, facecolor=fig.get_facecolor(), edgecolor="none")
    plt.close()
    print(
        f"Successfully generated high-resolution diagram: {output_path} ({os.path.getsize(output_path)} bytes)"
    )


if __name__ == "__main__":
    generate_diagram()
