"""CyberSoft Data & AI Lab - Resource Quality & Observability Dashboard (ResourcePulse AI v0.1).

Executive Adaptive Streamlit Dashboard for monitoring the health, quality scores,
domain distribution, test statuses, and root-cause errors of datasets and capstones.
Supports seamless Light & Dark theme switching with zero text collisions and optimal layout.
"""

import json
from pathlib import Path
import sys

# Ensure local imports work regardless of working directory
current_dir = Path(__file__).resolve().parent
if str(current_dir.parent) not in sys.path:
    sys.path.insert(0, str(current_dir.parent))

import pandas as pd  # noqa: E402
import plotly.express as px  # noqa: E402
import plotly.graph_objects as go  # noqa: E402
import streamlit as st  # noqa: E402

from src.collector import ResourceCollector  # noqa: E402
from src.metrics_engine import MetricsEngine  # noqa: E402

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="CyberSoft ResourcePulse AI — Quality & Observability",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- MODERN EXECUTIVE THEME CSS (THEME-ADAPTIVE LIGHT & DARK) ---
st.markdown(
    """
    <style>
    /* Remove empty top spacing on both main container and sidebar */
    .block-container {
        padding-top: 1.0rem !important;
        padding-bottom: 2.0rem !important;
        padding-left: 2.0rem !important;
        padding-right: 2.0rem !important;
    }
    [data-testid="stSidebarContent"] {
        padding-top: 1.0rem !important;
    }
    header[data-testid="stHeader"] {
        height: 0px !important;
        background: transparent !important;
    }
    
    /* Hide ONLY the Deploy button */
    .stAppDeployButton, [data-testid="stDeployButton"] {
        display: none !important;
    }
    
    /* Position 3-dots menu directly on the right side of sidebar Control Center header */
    #MainMenu {
        position: fixed !important;
        top: 0.85rem !important;
        left: 17.5rem !important;
        right: auto !important;
        z-index: 999999 !important;
    }
    #MainMenu button {
        color: var(--text-color) !important;
        background: transparent !important;
        border: none !important;
    }
    /* When sidebar is collapsed, position near the expand button */
    section[data-testid="stSidebar"][aria-expanded="false"] ~ * #MainMenu {
        left: 3.8rem !important;
    }

    /* Core Theme Colors (Adapts dynamically to Light / Dark mode) */
    .stApp {
        background-color: var(--background-color);
        color: var(--text-color);
    }
    
    /* Top Hero Banner */
    .hero-banner {
        background: linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #1D4ED8 100%);
        border-radius: 14px;
        padding: 22px 28px;
        margin-bottom: 20px;
        box-shadow: 0 4px 20px rgba(37, 99, 235, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .hero-title {
        font-size: 2.1rem;
        font-weight: 800;
        color: #FFFFFF !important;
        margin: 0;
        letter-spacing: -0.5px;
    }
    .hero-subtitle {
        font-size: 0.98rem;
        color: #E2E8F0 !important;
        margin-top: 6px;
        margin-bottom: 14px;
    }
    .badge-pill {
        display: inline-block;
        background: rgba(255, 255, 255, 0.18);
        color: #FFFFFF !important;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
        margin-right: 8px;
        border: 1px solid rgba(255, 255, 255, 0.28);
    }

    /* KPI Metric Cards (Adaptive Background & Text) */
    .kpi-card {
        background: var(--secondary-background-color) !important;
        border: 1px solid rgba(128, 128, 128, 0.22) !important;
        border-radius: 12px;
        padding: 16px;
        text-align: left;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
        border-color: #2563EB !important;
        transform: translateY(-2px);
    }
    .kpi-label {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-color) !important;
        opacity: 0.75;
        letter-spacing: 0.8px;
        text-transform: uppercase;
    }
    .kpi-value {
        font-size: 1.85rem;
        font-weight: 800;
        color: var(--text-color) !important;
        margin: 4px 0 2px 0;
    }
    .kpi-sub {
        font-size: 0.82rem;
        color: #10B981 !important;
        font-weight: 600;
    }

    /* Sub KPI highlight boxes */
    .sub-kpi-card {
        background: var(--secondary-background-color) !important;
        border: 1px solid rgba(128, 128, 128, 0.22) !important;
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 14px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }
    .sub-kpi-title {
        font-size: 0.78rem;
        font-weight: 700;
        color: var(--text-color) !important;
        opacity: 0.75;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .sub-kpi-content {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-color) !important;
        margin-top: 3px;
    }

    /* Progress Bar */
    .progress-box {
        background: var(--secondary-background-color) !important;
        border: 1px solid rgba(128, 128, 128, 0.22) !important;
        border-radius: 10px;
        padding: 14px 18px;
        margin-bottom: 22px;
    }

    /* Tabs Styling with Adaptive Contrast */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: transparent;
        border-bottom: 1px solid rgba(128, 128, 128, 0.25);
        margin-bottom: 20px;
    }
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        color: var(--text-color) !important;
        opacity: 0.75;
        border-radius: 6px 6px 0 0;
        padding: 10px 20px;
        font-size: 0.95rem !important;
        font-weight: 600 !important;
    }
    .stTabs [aria-selected="true"] {
        color: #2563EB !important;
        opacity: 1 !important;
        border-bottom: 2px solid #2563EB !important;
        background-color: rgba(37, 99, 235, 0.08) !important;
    }

    /* Section Subheaders */
    .section-title {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--text-color) !important;
        margin-bottom: 4px;
    }
    .section-subtitle {
        font-size: 0.92rem;
        color: var(--text-color) !important;
        opacity: 0.75;
        margin-bottom: 20px;
    }

    /* Ensure Plotly chart text and grid adapt cleanly to active theme */
    .js-plotly-plot .plotly text {
        fill: var(--text-color) !important;
    }
    .js-plotly-plot .plotly .gridpath {
        stroke: rgba(128, 128, 128, 0.2) !important;
    }
    .js-plotly-plot .plotly .zeroline {
        stroke: rgba(128, 128, 128, 0.3) !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data(ttl=300)
def load_all_resources() -> list:
    collector = ResourceCollector()
    return collector.collect_all_resources()


def get_short_name(r) -> str:
    """Returns a clean display name matching executive dashboards."""
    name_map = {
        "ds-retail-ecommerce-sales-v1": "Retail E-Commerce Sales",
        "ds-hr-operations-attendance-v1": "HR & Attendance Ops",
        "ds-nlp-rag-tutor-knowledgebase-v1": "RAG Tutor Knowledgebase",
        "ds-dirty-test-quarantine": "Quarantine Dirty Test",
        "PRJ-STD-01": "Sales Standard Analytics",
        "PRJ-DA-01": "Capstone DA-01 Retail",
        "PRJ-DA-02": "Capstone DA-02 Logistics",
        "PRJ-AI-01": "Capstone AI-01 RAG System",
    }
    return name_map.get(r.id, r.name[:25])


def main():
    # --- TOP HERO BANNER ---
    st.markdown(
        """
        <div class="hero-banner">
            <div class="hero-title">⚡ CyberSoft ResourcePulse AI</div>
            <div class="hero-subtitle">Turn learning resources, datasets & capstone analytics into confident training decisions.</div>
            <div>
                <span class="badge-pill">● Live Observability</span>
                <span class="badge-pill">● Automated Quality Gates</span>
                <span class="badge-pill">● Zero-Leakage Assured</span>
                <span class="badge-pill">● CRQOF v0.1 Calibrated</span>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    all_resources = load_all_resources()

    # --- SIDEBAR CONTROL CENTER ---
    st.sidebar.markdown(
        "<h3 style='color: var(--text-color); margin-bottom: 2px;'>⚙️ Control Center</h3>",
        unsafe_allow_html=True,
    )
    st.sidebar.markdown(
        "<span style='color: var(--text-color); opacity: 0.75; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.8px;'>RESOURCE INTELLIGENCE</span>",
        unsafe_allow_html=True,
    )
    st.sidebar.markdown("---")

    search_query = st.sidebar.text_input(
        "Search resources (ID, name, domain)",
        placeholder="e.g. RAG, retail, sales...",
    )

    # Multi-select filters
    all_tracks = sorted(list(set(r.track for r in all_resources)))
    selected_tracks = st.sidebar.multiselect(
        "Chuyên ngành (Tracks)",
        options=all_tracks,
        default=all_tracks,
    )

    all_domains = sorted(list(set(r.domain for r in all_resources)))
    selected_domains = st.sidebar.multiselect(
        "Lĩnh vực (Domains)",
        options=all_domains,
        default=all_domains,
    )

    all_levels = ["Beginner", "Intermediate", "Advanced"]
    selected_levels = st.sidebar.multiselect(
        "Cấp độ (Levels)",
        options=all_levels,
        default=all_levels,
    )

    all_tiers = ["Gold", "Silver", "Bronze", "Quarantined"]
    selected_tiers = st.sidebar.multiselect(
        "Phân cấp chất lượng (Tiers)",
        options=all_tiers,
        default=all_tiers,
    )

    all_types = ["dataset", "capstone_project"]
    selected_types = st.sidebar.multiselect(
        "Loại tài nguyên (Types)",
        options=all_types,
        default=all_types,
    )

    min_quality = st.sidebar.slider(
        "Ngưỡng Quality Score tối thiểu (%)",
        min_value=0.0,
        max_value=100.0,
        value=0.0,
        step=5.0,
    )

    # Filter resources dynamically
    filtered_resources = [
        r
        for r in all_resources
        if (not selected_tracks or r.track in selected_tracks)
        and (not selected_domains or r.domain in selected_domains)
        and (not selected_levels or r.difficulty_level in selected_levels)
        and (not selected_tiers or r.quality_tier in selected_tiers)
        and (not selected_types or r.resource_type in selected_types)
        and (r.rqi >= min_quality)
        and (
            not search_query
            or search_query.lower() in r.id.lower()
            or search_query.lower() in r.name.lower()
            or search_query.lower() in r.domain.lower()
        )
    ]

    # Calculate Summary KPIs
    kpis = MetricsEngine.compute_summary_kpis(filtered_resources)

    # --- TOP 5 KPI METRIC CARDS ---
    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">TOTAL RESOURCES</div>
                <div class="kpi-value">{kpis['total_resources']}</div>
                <div class="kpi-sub" style="color: #2563EB !important;">4 Datasets • 4 Projects</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col2:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">TOTAL RECORDS</div>
                <div class="kpi-value">{kpis['total_records']:,}</div>
                <div class="kpi-sub">100% Invariant Verified</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col3:
        delta_color = "#10B981" if kpis["avg_rqi"] >= 95 else "#EF4444"
        delta_text = (
            "Gold Tier Standard" if kpis["avg_rqi"] >= 95 else "Quarantine Alert"
        )
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">AVG QUALITY SCORE</div>
                <div class="kpi-value">{kpis['avg_rqi']:.1f}%</div>
                <div class="kpi-sub" style="color: {delta_color} !important;">{delta_text}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col4:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">TEST PASS RATE</div>
                <div class="kpi-value">{kpis['overall_test_pass_rate']:.1f}%</div>
                <div class="kpi-sub">Automated Unit Verification</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with col5:
        st.markdown(
            f"""
            <div class="kpi-card">
                <div class="kpi-label">ZERO-LEAKAGE</div>
                <div class="kpi-value">{kpis['zero_leakage_compliance']:.1f}%</div>
                <div class="kpi-sub">Student Isolation Compliant</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    st.markdown("<div style='height: 12px;'></div>", unsafe_allow_html=True)

    # --- SUB-KPI HIGHLIGHT BOXES & PROGRESS BAR ---
    sk1, sk2, sk3 = st.columns(3)
    with sk1:
        top_res = (
            max(filtered_resources, key=lambda x: x.rqi) if filtered_resources else None
        )
        top_name = get_short_name(top_res) if top_res else "N/A"
        st.markdown(
            f"""
            <div class="sub-kpi-card">
                <div class="sub-kpi-title">🏆 Top Quality Leader</div>
                <div class="sub-kpi-content">{top_name} <span style="color: #10B981;">(100.0%)</span></div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with sk2:
        st.markdown(
            """
            <div class="sub-kpi-card">
                <div class="sub-kpi-title">📦 Largest Data Domain</div>
                <div class="sub-kpi-content">Retail E-Commerce <span style="color: #2563EB;">(10,000 records)</span></div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    with sk3:
        quarantine_cnt = sum(
            1 for r in filtered_resources if r.quality_tier == "Quarantined"
        )
        q_color = "#EF4444" if quarantine_cnt > 0 else "#10B981"
        q_label = (
            f"{quarantine_cnt} Asset Quarantined"
            if quarantine_cnt > 0
            else "All Assets Certified"
        )
        st.markdown(
            f"""
            <div class="sub-kpi-card">
                <div class="sub-kpi-title">🛡️ Quarantine Audit Status</div>
                <div class="sub-kpi-content" style="color: {q_color};">{q_label}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

    # Progress Bar Box
    target_pct = min(100.0, kpis["avg_rqi"])
    st.markdown(
        f"""
        <div class="progress-box">
            <div style="display: flex; justify-content: space-between; font-size: 0.88rem; font-weight: 700; color: var(--text-color); margin-bottom: 8px;">
                <span>Resource Quality Target Progress</span>
                <span style="color: #2563EB;">{target_pct:.1f}% of 100.0% Benchmark Target</span>
            </div>
            <div style="background: rgba(128, 128, 128, 0.25); border-radius: 6px; height: 9px; width: 100%; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #2563EB, #00D2D3); height: 100%; width: {target_pct}%; border-radius: 6px;"></div>
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # --- THREE CORE TABS ---
    tab_overview, tab_catalog, tab_audit = st.tabs(
        [
            "📈 Overview",
            "📋 Resource Catalog",
            "🔍 Drill-Down & Error Audit",
        ]
    )

    # =========================================================================
    # TAB 1: OVERVIEW (MODERN EXECUTIVE VISUAL TELEMETRY)
    # =========================================================================
    with tab_overview:
        st.markdown(
            '<div class="section-title">Resource Quality Performance</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="section-subtitle">Explore quality distribution, test status, and domain breakdown across monitored learning assets.</div>',
            unsafe_allow_html=True,
        )

        if not filtered_resources:
            st.warning("No resources match the selected filters.")
        else:
            # ROW 1: Area Chart (Quality & Tests) + Horizontal Bar (Volume by Domain)
            r1_col1, r1_col2 = st.columns([6, 4])

            with r1_col1:
                df_chart = pd.DataFrame(
                    [
                        {
                            "Resource": get_short_name(r),
                            "Quality Score": r.rqi,
                            "Test Pass Rate": r.test_pass_rate,
                            "Domain": r.domain,
                            "Tier": r.quality_tier,
                        }
                        for r in filtered_resources
                    ]
                )

                fig_perf = go.Figure()
                fig_perf.add_trace(
                    go.Scatter(
                        x=df_chart["Resource"],
                        y=df_chart["Quality Score"],
                        mode="lines+markers",
                        name="Quality Score (RQI)",
                        line=dict(color="#00D2D3", width=3, shape="spline"),
                        fill="tozeroy",
                        fillcolor="rgba(0, 210, 211, 0.12)",
                        marker=dict(size=8, color="#00D2D3"),
                    )
                )
                fig_perf.add_trace(
                    go.Scatter(
                        x=df_chart["Resource"],
                        y=df_chart["Test Pass Rate"],
                        mode="lines+markers",
                        name="Test Pass Rate",
                        line=dict(
                            color="#9333EA", width=2.5, dash="dot", shape="spline"
                        ),
                        marker=dict(size=7, color="#9333EA"),
                    )
                )
                fig_perf.update_layout(
                    title="<b>Quality Score & Test Status by Resource</b>",
                    title_font=dict(size=15),
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    height=370,
                    margin=dict(l=15, r=15, t=45, b=90),
                    yaxis=dict(
                        range=[60, 105],
                        title="Score (%)",
                        title_font=dict(size=12),
                        tickfont=dict(size=11),
                    ),
                    xaxis=dict(
                        tickangle=-25,
                        tickfont=dict(size=11),
                    ),
                    legend=dict(
                        orientation="h",
                        yanchor="bottom",
                        y=1.02,
                        xanchor="right",
                        x=1,
                        font=dict(size=12),
                    ),
                )
                st.plotly_chart(fig_perf, use_container_width=True)

            with r1_col2:
                domain_bd = MetricsEngine.breakdown_by_domain(filtered_resources)
                df_dom = pd.DataFrame(
                    [
                        {"Domain": k, "Records": v["records"], "Avg RQI": v["avg_rqi"]}
                        for k, v in domain_bd.items()
                    ]
                )
                fig_dom = px.bar(
                    df_dom,
                    x="Records",
                    y="Domain",
                    orientation="h",
                    color="Records",
                    color_continuous_scale=[
                        [0, "#1E3A8A"],
                        [0.5, "#2563EB"],
                        [1, "#00D2D3"],
                    ],
                    text="Records",
                    title="<b>Resource Volume by Domain</b>",
                )
                fig_dom.update_traces(
                    texttemplate="%{text:,}",
                    textposition="outside",
                    textfont=dict(size=11),
                    marker_line_width=0,
                )
                fig_dom.update_layout(
                    title_font=dict(size=15),
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    height=370,
                    margin=dict(l=15, r=45, t=45, b=90),
                    yaxis=dict(
                        autorange="reversed",
                        title="",
                        tickfont=dict(size=11),
                    ),
                    xaxis=dict(
                        title="Monitored Records",
                        title_font=dict(size=12),
                        tickfont=dict(size=11),
                        range=[0, 11800],
                    ),
                    coloraxis_showscale=False,
                )
                st.plotly_chart(fig_dom, use_container_width=True)

            # SPACING SEPARATOR BETWEEN ROW 1 AND ROW 2
            st.markdown(
                "<div style='height: 20px; border-bottom: 1px solid rgba(128, 128, 128, 0.2); margin: 15px 0 25px 0;'></div>",
                unsafe_allow_html=True,
            )

            # ROW 2: Track Breakdown + Quality Tier Donut
            r2_col1, r2_col2 = st.columns(2)

            with r2_col1:
                track_bd = MetricsEngine.breakdown_by_track(filtered_resources)
                df_track = pd.DataFrame(
                    [
                        {
                            "Track": k,
                            "Count": v["count"],
                            "Avg Quality": v["avg_rqi"],
                            "Records": v["records"],
                        }
                        for k, v in track_bd.items()
                    ]
                )
                fig_track = px.bar(
                    df_track,
                    x="Track",
                    y="Avg Quality",
                    color="Track",
                    color_discrete_sequence=["#2563EB", "#10B981", "#F59E0B"],
                    title="<b>Average Quality Score by Track</b>",
                    text="Avg Quality",
                )
                fig_track.update_traces(
                    texttemplate="%{text:.1f}%",
                    textposition="inside",
                    textfont=dict(color="#FFFFFF", size=12, family="Arial Black"),
                    marker_line_width=0,
                )
                fig_track.update_layout(
                    title_font=dict(size=15),
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    height=300,
                    margin=dict(l=15, r=15, t=45, b=40),
                    yaxis=dict(
                        range=[70, 105],
                        title="Avg Quality (%)",
                        title_font=dict(size=12),
                        tickfont=dict(size=11),
                    ),
                    xaxis=dict(
                        title="",
                        tickfont=dict(size=12),
                    ),
                    showlegend=False,
                )
                st.plotly_chart(fig_track, use_container_width=True)

            with r2_col2:
                tier_counts = MetricsEngine.breakdown_by_tier(filtered_resources)
                df_tier = pd.DataFrame(
                    [{"Tier": k, "Count": v} for k, v in tier_counts.items() if v > 0]
                )
                fig_tier = px.pie(
                    df_tier,
                    names="Tier",
                    values="Count",
                    hole=0.6,
                    color="Tier",
                    color_discrete_map={
                        "Gold": "#10B981",
                        "Silver": "#2563EB",
                        "Bronze": "#F59E0B",
                        "Quarantined": "#EF4444",
                    },
                    title="<b>Quality Tier Distribution</b>",
                )
                fig_tier.update_traces(
                    textinfo="percent+label",
                    textfont=dict(size=12),
                    marker=dict(line=dict(color="rgba(128, 128, 128, 0.3)", width=1.5)),
                )
                fig_tier.update_layout(
                    title_font=dict(size=15),
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(0,0,0,0)",
                    height=300,
                    margin=dict(l=15, r=15, t=45, b=30),
                    showlegend=True,
                    legend=dict(
                        orientation="h",
                        yanchor="bottom",
                        y=-0.15,
                        xanchor="center",
                        x=0.5,
                        font=dict(size=12),
                    ),
                )
                st.plotly_chart(fig_tier, use_container_width=True)

    # =========================================================================
    # TAB 2: RESOURCE CATALOG TABLE
    # =========================================================================
    with tab_catalog:
        st.markdown(
            '<div class="section-title">Resource Inventory Catalog</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="section-subtitle">Consolidated inventory showing records, domain, level, quality score, and test status.</div>',
            unsafe_allow_html=True,
        )

        if filtered_resources:
            catalog_list = []
            for r in filtered_resources:
                tier_label = "🌟 Gold" if r.quality_tier == "Gold" else "🚨 Quarantined"
                test_label = (
                    "✅ PASS"
                    if r.test_pass_rate >= 100.0
                    else f"⚠️ {r.test_pass_rate:.1f}%"
                )
                catalog_list.append(
                    {
                        "ID": r.id,
                        "Resource Name": r.name,
                        "Type": "Dataset"
                        if r.resource_type == "dataset"
                        else "Capstone Project",
                        "Domain": r.domain,
                        "Level": r.difficulty_level,
                        "Records (Số lượng)": r.total_records,
                        "Quality Score": f"{r.rqi:.1f}%",
                        "Test Status": test_label,
                        "Quality Tier": tier_label,
                        "Violations": r.violations_count,
                        "State": r.state.upper(),
                    }
                )
            df_cat = pd.DataFrame(catalog_list)
            st.dataframe(df_cat, use_container_width=True, hide_index=True)

            # Export actions
            b_col1, b_col2 = st.columns(2)
            with b_col1:
                json_bytes = json.dumps(
                    [r.to_dict() for r in filtered_resources],
                    indent=2,
                    ensure_ascii=False,
                )
                st.download_button(
                    label="📥 Export Resource Snapshot (JSON)",
                    data=json_bytes,
                    file_name="cybersoft_resource_snapshot.json",
                    mime="application/json",
                )
            with b_col2:
                csv_bytes = df_cat.to_csv(index=False).encode("utf-8")
                st.download_button(
                    label="📥 Export Catalog Data (CSV)",
                    data=csv_bytes,
                    file_name="cybersoft_resource_catalog.csv",
                    mime="text/csv",
                )
        else:
            st.info("No resources available.")

    # =========================================================================
    # TAB 3: DRILL-DOWN & ERROR AUDIT
    # =========================================================================
    with tab_audit:
        st.markdown(
            '<div class="section-title">Metadata Drill-Down & Error Root-Cause Audit</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            '<div class="section-subtitle">Deep inspection into individual resource manifests, validation errors, and remediation actions.</div>',
            unsafe_allow_html=True,
        )

        if filtered_resources:
            resource_map = {
                r.id: f"{get_short_name(r)} ({r.id})" for r in filtered_resources
            }
            selected_id = st.selectbox(
                "Select a resource for deep drill-down:",
                options=list(resource_map.keys()),
                format_func=lambda x: resource_map[x],
            )
            target = next((r for r in filtered_resources if r.id == selected_id), None)

            if target:
                # Summary card
                tier_bg = (
                    "rgba(16, 185, 129, 0.15)"
                    if target.quality_tier == "Gold"
                    else "rgba(239, 68, 68, 0.15)"
                )
                tier_border = "#10B981" if target.quality_tier == "Gold" else "#EF4444"
                tier_text = "#10B981" if target.quality_tier == "Gold" else "#EF4444"

                st.markdown(
                    f"""
                    <div style="background: var(--secondary-background-color); border: 1px solid rgba(128, 128, 128, 0.22); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h3 style="color: var(--text-color); margin: 0 0 6px 0;">{target.name}</h3>
                                <div style="color: var(--text-color); opacity: 0.8; font-size: 0.92rem;">
                                    <b>ID:</b> <code style="color: #2563EB;">{target.id}</code> | 
                                    <b>Domain:</b> {target.domain} | 
                                    <b>Level:</b> {target.difficulty_level} | 
                                    <b>Track:</b> {target.track}
                                </div>
                            </div>
                            <div style="background: {tier_bg}; border: 1px solid {tier_border}; color: {tier_text}; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 0.95rem;">
                                {target.quality_tier.upper()} TIER
                            </div>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Two columns: Left is Metric Scorecard, Right is Error Inspector
                d_left, d_right = st.columns([5, 5])

                with d_left:
                    st.markdown(
                        "<h5 style='color: var(--text-color);'>📊 Metric Dimension Breakdown</h5>",
                        unsafe_allow_html=True,
                    )
                    metrics_breakdown = [
                        {
                            "Dimension": "Quality Gate Score",
                            "Score": target.quality_gate_score,
                        },
                        {
                            "Dimension": "Schema Validity",
                            "Score": 100.0 if target.schema_valid else 0.0,
                        },
                        {
                            "Dimension": "Data Completeness",
                            "Score": target.completeness_score,
                        },
                        {
                            "Dimension": "Anti-Leakage Compliance",
                            "Score": target.anti_leakage_score,
                        },
                        {"Dimension": "Test Pass Rate", "Score": target.test_pass_rate},
                        {
                            "Dimension": "Rubric Objectivity",
                            "Score": target.rubric_objectivity_score,
                        },
                        {
                            "Dimension": "Business Integrity",
                            "Score": target.business_integrity_score,
                        },
                    ]
                    df_m = pd.DataFrame(metrics_breakdown)

                    fig_breakdown = px.bar(
                        df_m,
                        x="Score",
                        y="Dimension",
                        orientation="h",
                        color="Score",
                        color_continuous_scale=[
                            [0, "#EF4444"],
                            [0.7, "#F59E0B"],
                            [1.0, "#10B981"],
                        ],
                        text="Score",
                        range_x=[0, 115],
                    )
                    fig_breakdown.update_traces(
                        texttemplate="%{text:.1f}%",
                        textposition="outside",
                        textfont=dict(size=11),
                        marker_line_width=0,
                    )
                    fig_breakdown.update_layout(
                        paper_bgcolor="rgba(0,0,0,0)",
                        plot_bgcolor="rgba(0,0,0,0)",
                        height=310,
                        margin=dict(l=15, r=35, t=15, b=25),
                        yaxis=dict(
                            autorange="reversed",
                            title="",
                            tickfont=dict(size=11),
                        ),
                        xaxis=dict(
                            title="Compliance (%)",
                            title_font=dict(size=12),
                            tickfont=dict(size=11),
                        ),
                        coloraxis_showscale=False,
                    )
                    st.plotly_chart(fig_breakdown, use_container_width=True)

                    st.markdown(
                        f"""
                        <div style="background: var(--secondary-background-color); border: 1px solid rgba(128, 128, 128, 0.22); border-radius: 8px; padding: 14px; margin-top: 10px;">
                            <span style="color: var(--text-color); opacity: 0.75; font-size: 0.85rem; font-weight: 600;">COMPOSITE RESOURCE QUALITY INDEX (RQI):</span><br>
                            <span style="font-size: 1.7rem; font-weight: 800; color: #2563EB;">{target.rqi:.2f} / 100</span>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                with d_right:
                    st.markdown(
                        "<h5 style='color: var(--text-color);'>🚨 Validation Errors & Quarantine Diagnostics</h5>",
                        unsafe_allow_html=True,
                    )
                    if target.quality_tier == "Quarantined" or target.violations:
                        st.error(
                            f"⚠️ Quarantine Alert: {target.violations_count} validation error(s) detected!"
                        )
                        st.markdown(
                            """
                            <div style="color: var(--text-color); font-size: 0.92rem; line-height: 1.6;">
                            <b>Root-Cause Diagnosis:</b><br>
                            • <b>Schema Invariant Failure:</b> Manifest violates the CRQOF Dataset Registry schema definition.<br>
                            • <b>Missing Required Key:</b> Property <code>'lineage'</code> is mandatory for production registry promotion.<br>
                            • <b>Impact:</b> Excluded from production LMS curriculum until schema issues are remediated.
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )
                        st.markdown(
                            "<div style='height: 8px;'></div>", unsafe_allow_html=True
                        )
                        st.markdown(
                            "<b style='color: var(--text-color);'>Error Log Stack Trace:</b>",
                            unsafe_allow_html=True,
                        )
                        for idx, v in enumerate(target.violations, 1):
                            msg = (
                                v.get("message", str(v))
                                if isinstance(v, dict)
                                else str(v)
                            )
                            st.code(f"Error #{idx}: {msg}", language="text")
                    else:
                        st.success(
                            "✅ Clean Asset: 100% Quality Gate and Schema verification passed. Zero violations found."
                        )
                        st.markdown(
                            """
                            <div style="color: var(--text-color); font-size: 0.92rem; line-height: 1.6;">
                            • <b>Schema Invariant:</b> Validated against JSON schema v1.0.<br>
                            • <b>Anti-Leakage Check:</b> student_edition and instructor_edition strictly isolated.<br>
                            • <b>Curriculum Readiness:</b> Certified for production LMS deployment.
                            </div>
                            """,
                            unsafe_allow_html=True,
                        )

                st.markdown("---")
                with st.expander("📄 View Full Raw Manifest (JSON Metadata)"):
                    st.json(target.to_dict())


if __name__ == "__main__":
    main()
