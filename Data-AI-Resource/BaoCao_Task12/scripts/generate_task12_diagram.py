"""Script to generate high-resolution architecture diagram Picture_12-Detail.png for Task 12."""

import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches


def create_diagram(output_path: str):
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_facecolor("#F8FAFC")
    fig.patch.set_facecolor("#F8FAFC")
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 11)
    ax.axis("off")

    # Header Title Banner
    header_box = patches.FancyBboxPatch(
        (0.5, 9.8),
        15.0,
        1.0,
        boxstyle="round,pad=0.1",
        facecolor="#1E293B",
        edgecolor="#0EA5E9",
        linewidth=2,
    )
    ax.add_patch(header_box)
    ax.text(
        8.0,
        10.45,
        "CYBERSOFT MART CAPSTONE DA-01 -- KIEN TRUC PHAN TICH & DOI SOAT CHEO",
        color="#FFFFFF",
        fontsize=14,
        fontweight="bold",
        ha="center",
        va="center",
    )
    ax.text(
        8.0,
        10.05,
        "Sales Performance, Customer Cohorts, 3-Way Cross-Verification Engine & Zero-Leakage Rubric Engineering",
        color="#38BDF8",
        fontsize=10,
        ha="center",
        va="center",
    )

    # Column 1: Student Edition & 12 Tasks (Left)
    col1_box = patches.FancyBboxPatch(
        (0.5, 0.8),
        4.6,
        8.7,
        boxstyle="round,pad=0.1",
        facecolor="#FFFFFF",
        edgecolor="#3B82F6",
        linewidth=1.8,
    )
    ax.add_patch(col1_box)
    ax.text(
        2.8,
        9.2,
        "STUDENT EDITION (BAN HOC VIEN)",
        color="#1D4ED8",
        fontsize=12,
        fontweight="bold",
        ha="center",
    )
    ax.text(
        2.8,
        8.85,
        "Zero Answer Leakage * 100% Clean Data Contract",
        color="#64748B",
        fontsize=8.5,
        ha="center",
    )

    student_items = [
        (
            "[1] 4 Bang Du Lieu Tho",
            "orders (402r, 2 dup, 5 null), order_items (997r),\ncustomers (100r), products (50r)",
            "#EFF6FF",
            "#1D4ED8",
        ),
        (
            "[2] PROJECT_BRIEF.md",
            "10 Stakeholder Questions (CEO, CFO, CCO, CMO)\n12 Nhiem vu ky thuat tu Audit -> Dashboard",
            "#F0FDF4",
            "#15803D",
        ),
        (
            "[3] HINTS.md (3 Tang Gian Giao)",
            "Tier 1 Khai niem * Tier 2 Cu phap SQL/Python\nTier 3 Bay loi du lieu (Tied Bins, Trung dong)",
            "#FEFCE8",
            "#A16207",
        ),
        (
            "[4] rubric.json (Draft 2020-12)",
            "70d Core (Clean, SQL, KPIs, Dashboard)\n30d Extension (RFM 5 groups, Cohort Triangle)",
            "#FDF4FF",
            "#A21CAF",
        ),
        (
            "[5] Starter Kit Hoc Vien",
            "data_dictionary.md * analysis_starter.sql\nanalysis_starter.py * excel_template_guide.md",
            "#F8FAFC",
            "#334155",
        ),
    ]
    y_pos = 8.3
    for title, desc, bg, border in student_items:
        box = patches.FancyBboxPatch(
            (0.7, y_pos - 1.1),
            4.2,
            1.15,
            boxstyle="round,pad=0.08",
            facecolor=bg,
            edgecolor=border,
            linewidth=1.2,
        )
        ax.add_patch(box)
        ax.text(
            0.9,
            y_pos - 0.25,
            title,
            color=border,
            fontsize=9.5,
            fontweight="bold",
            va="center",
        )
        ax.text(0.9, y_pos - 0.7, desc, color="#334155", fontsize=8, va="center")
        y_pos -= 1.45

    # Column 2: 3-Way Cross-Verification Engine (Middle)
    col2_box = patches.FancyBboxPatch(
        (5.4, 4.3),
        5.2,
        5.2,
        boxstyle="round,pad=0.1",
        facecolor="#FFFFFF",
        edgecolor="#10B981",
        linewidth=1.8,
    )
    ax.add_patch(col2_box)
    ax.text(
        8.0,
        9.2,
        "3-WAY CROSS-VERIFICATION ENGINE",
        color="#047857",
        fontsize=12,
        fontweight="bold",
        ha="center",
    )
    ax.text(
        8.0,
        8.85,
        "3 Phuong Phap Doi Soat Doc Lap -- Delta = 0.00 USD",
        color="#64748B",
        fontsize=8.5,
        ha="center",
    )

    verif_items = [
        (
            "1. SQL Analytical Engine (SQLite)",
            "Truy van CTE, Window Function LAG, Dedup Partition\nNet Rev: 388,850.28 USD * Margin: 31.43% * AOV: 1,150.44 USD",
            "#ECFDF5",
            "#059669",
        ),
        (
            "2. Python Pandas Pipeline",
            "Vectorized Dataframe, rank(first) quantile RFM\nNet Rev: 388,850.28 USD * Margin: 31.43% * AOV: 1,150.44 USD",
            "#EFF6FF",
            "#2563EB",
        ),
        (
            "3. Matrix & Line-Item Analytical Model",
            "Order Items Reconciliation + Shipping Fee (1,755 USD)\n387,095.28 (Items) + 1,755 = 388,850.28 USD (Delta = 0)",
            "#FFFBEB",
            "#D97706",
        ),
    ]
    y_pos = 8.3
    for title, desc, bg, border in verif_items:
        box = patches.FancyBboxPatch(
            (5.6, y_pos - 1.05),
            4.8,
            1.1,
            boxstyle="round,pad=0.08",
            facecolor=bg,
            edgecolor=border,
            linewidth=1.2,
        )
        ax.add_patch(box)
        ax.text(
            5.8,
            y_pos - 0.25,
            title,
            color=border,
            fontsize=9,
            fontweight="bold",
            va="center",
        )
        ax.text(5.8, y_pos - 0.68, desc, color="#334155", fontsize=7.8, va="center")
        y_pos -= 1.35

    # Column 2 Bottom: 12 Tasks Roadmap (Middle Bottom)
    col2_bot = patches.FancyBboxPatch(
        (5.4, 0.8),
        5.2,
        3.2,
        boxstyle="round,pad=0.1",
        facecolor="#FFFFFF",
        edgecolor="#8B5CF6",
        linewidth=1.8,
    )
    ax.add_patch(col2_bot)
    ax.text(
        8.0,
        3.7,
        "LO TRINH 12 NHIEM VU DATA ANALYST",
        color="#6D28D9",
        fontsize=11,
        fontweight="bold",
        ha="center",
    )

    ax.add_patch(
        patches.FancyBboxPatch(
            (5.6, 2.3),
            4.8,
            1.1,
            boxstyle="round,pad=0.08",
            facecolor="#F5F3FF",
            edgecolor="#7C3AED",
            linewidth=1.2,
        )
    )
    ax.text(
        5.8,
        3.1,
        "[*] Giai Doan I & II: Audit, SQL & Core KPIs",
        color="#6D28D9",
        fontsize=9,
        fontweight="bold",
    )
    ax.text(
        5.8,
        2.65,
        "Tasks 01-08: Data Profiling, Star Schema, Net Revenue,\nAOV, MoM Growth, Pareto Top 10, Ty le huy COD",
        color="#334155",
        fontsize=8,
    )

    ax.add_patch(
        patches.FancyBboxPatch(
            (5.6, 1.0),
            4.8,
            1.1,
            boxstyle="round,pad=0.08",
            facecolor="#FDF2F8",
            edgecolor="#DB2777",
            linewidth=1.2,
        )
    )
    ax.text(
        5.8,
        1.8,
        "[*] Giai Doan III: RFM, Cohort & BI Dashboard",
        color="#BE185D",
        fontsize=9,
        fontweight="bold",
    )
    ax.text(
        5.8,
        1.35,
        "Tasks 09-12: RFM 5 Phân vị, Ma trận Cohort Retention,\nExecutive Dashboard 4 Tabs & Khuyến nghị C-Level",
        color="#334155",
        fontsize=8,
    )

    # Column 3: Instructor Edition & Auto-Grader (Right)
    col3_box = patches.FancyBboxPatch(
        (10.9, 0.8),
        4.6,
        8.7,
        boxstyle="round,pad=0.1",
        facecolor="#FFFFFF",
        edgecolor="#EA580C",
        linewidth=1.8,
    )
    ax.add_patch(col3_box)
    ax.text(
        13.2,
        9.2,
        "INSTRUCTOR & AUTO-GRADER",
        color="#C2410C",
        fontsize=12,
        fontweight="bold",
        ha="center",
    )
    ax.text(
        13.2,
        8.85,
        "May Cham Tu Dong * Ground Truth * Loi Thuong Gap",
        color="#64748B",
        fontsize=8.5,
        ha="center",
    )

    inst_items = [
        (
            "[1] SOLUTION_MANUAL.md",
            "Loi giai chuan cho 10 cau hoi Stakeholder C-Level\nKe hoach hanh dong Quy 1 tang 15% doanh thu",
            "#FFF7ED",
            "#C2410C",
        ),
        (
            "[2] expected_kpis.json (Ground Truth)",
            "Orders: 400 clean (338 comp, 43 canc, 19 ret)\nNet Rev: 388,850.28 USD * Profit: 121,652.51 (31.43%)\nAOV: 1,150.44 USD * RFM: 20-26-13-15-21 customers",
            "#FEF3C7",
            "#D97706",
        ),
        (
            "[3] common_pitfalls.md (8 Bay Loi)",
            "1. Tinh ca don huy * 2. Nhan doi dong do join\n3. Xoa nham null * 4. AOV cap item * 5. Binh quan %\n6. Crash tied bins * 7. Quen discount * 8. Sai mau so",
            "#FEE2E2",
            "#DC2626",
        ),
        (
            "[4] auto_grader.py (60/100d)",
            "Cham tu dong: Clean 15d, KPIs 25d, Ops 10d, RFM 10d\n40d con lai: Dashboard tuong tac & Executive Report",
            "#F3F4F6",
            "#4B5563",
        ),
        (
            "[5] Pytest Suite (11/11 PASS)",
            "100% PASS in 2.14s: Integrity, Data, Leakage,\nCross-Verification, Rubric Schema, Auto-Grader",
            "#F0FDF4",
            "#16A34A",
        ),
    ]
    y_pos = 8.3
    for title, desc, bg, border in inst_items:
        box = patches.FancyBboxPatch(
            (11.1, y_pos - 1.1),
            4.2,
            1.15,
            boxstyle="round,pad=0.08",
            facecolor=bg,
            edgecolor=border,
            linewidth=1.2,
        )
        ax.add_patch(box)
        ax.text(
            11.3,
            y_pos - 0.25,
            title,
            color=border,
            fontsize=9.5,
            fontweight="bold",
            va="center",
        )
        ax.text(11.3, y_pos - 0.7, desc, color="#334155", fontsize=7.8, va="center")
        y_pos -= 1.45

    # Connective Arrows
    ax.annotate(
        "",
        xy=(5.4, 7.5),
        xytext=(5.1, 7.5),
        arrowprops=dict(arrowstyle="->", lw=2, color="#0284C7"),
    )
    ax.annotate(
        "",
        xy=(10.9, 7.5),
        xytext=(10.6, 7.5),
        arrowprops=dict(arrowstyle="->", lw=2, color="#059669"),
    )
    ax.annotate(
        "",
        xy=(10.9, 2.5),
        xytext=(10.6, 2.5),
        arrowprops=dict(arrowstyle="<->", lw=2, color="#7C3AED"),
    )

    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches="tight")
    plt.close()
    print(f"Generated architecture diagram: {output_path}")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(__file__), "..", "Picture_12-Detail.png")
    create_diagram(out)
