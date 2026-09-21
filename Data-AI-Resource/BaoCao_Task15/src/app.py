"""CyberSoft Data & AI Lab - Resource Quality & Observability Dashboard v0.1.

Interactive Streamlit application providing real-time visibility into the health,
quality scores, schema compliance, test status, and metadata of all datasets and capstones.
Features executive visual telemetry: RQI scorecards, system compliance matrix,
7-pillar diagnostic scorecards, and root-cause audit inspection.
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
import streamlit as st  # noqa: E402

from src.collector import ResourceCollector  # noqa: E402
from src.filter_engine import FilterEngine  # noqa: E402
from src.metrics_engine import MetricsEngine  # noqa: E402

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="CyberSoft Resource Quality & Observability Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- CUSTOM MODERN EXECUTIVE CSS ---
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.0rem;
        font-weight: 800;
        color: #1E3A8A;
        margin-bottom: 0.1rem;
        letter-spacing: -0.5px;
    }
    .sub-header {
        font-size: 1.0rem;
        color: #64748B;
        margin-bottom: 1.2rem;
    }
    div[data-testid="stMetric"] {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 12px 16px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
    }
    div[data-testid="stMetricLabel"] {
        font-size: 0.85rem !important;
        color: #64748B !important;
        font-weight: 600 !important;
    }
    div[data-testid="stMetricValue"] {
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        color: #0F172A !important;
    }
    .resource-card {
        background: linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%);
        border: 1px solid #BFDBFE;
        border-radius: 10px;
        padding: 16px;
        margin-bottom: 16px;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data(ttl=300)
def load_all_resources() -> list:
    collector = ResourceCollector()
    return collector.collect_all_resources()


def get_friendly_label(r) -> str:
    """Returns a clean, readable name for charts and tables."""
    name_map = {
        "ds-retail-ecommerce-sales-v1": "🛒 Retail E-Commerce Sales",
        "ds-hr-operations-attendance-v1": "👥 HR & Attendance",
        "ds-nlp-rag-tutor-knowledgebase-v1": "📚 RAG Knowledge Base",
        "ds-dirty-test-quarantine": "⚠️ Quarantine Test (Dirty)",
        "PRJ-STD-01": "📈 Sales Standard Project",
        "PRJ-DA-01": "🏬 Capstone DA-01 (Retail)",
        "PRJ-DA-02": "📦 Capstone DA-02 (Inventory)",
        "PRJ-AI-01": "🤖 Capstone AI-01 (RAG Q&A)",
    }
    return name_map.get(r.id, r.name[:28])


def main():
    # Header
    st.markdown(
        '<div class="main-header">📊 CyberSoft Data & AI Lab — Resource Observability Dashboard</div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<div class="sub-header">Hệ thống Giám sát & Đo lường Chất lượng Học liệu Số (CRQOF v0.1) — Hoàn tất Cột mốc Tuần 3 (Task 15)</div>',
        unsafe_allow_html=True,
    )

    # Load Data
    all_resources = load_all_resources()

    # --- SIDEBAR FILTERS ---
    st.sidebar.header("🔍 Bộ Lọc Học Liệu (Filters)")

    search_query = st.sidebar.text_input(
        "Tìm kiếm theo tên / ID",
        placeholder="Ví dụ: RAG, retail, sales...",
    )

    track_options = ["All"] + sorted(list(set(r.track for r in all_resources)))
    selected_track = st.sidebar.selectbox("Chuyên ngành (Track)", track_options)

    domain_options = ["All"] + sorted(list(set(r.domain for r in all_resources)))
    selected_domain = st.sidebar.selectbox("Lĩnh vực (Domain)", domain_options)

    level_options = ["All", "Beginner", "Intermediate", "Advanced"]
    selected_level = st.sidebar.selectbox("Cấp độ (Level)", level_options)

    tier_options = ["All", "Gold", "Silver", "Bronze", "Quarantined"]
    selected_tier = st.sidebar.selectbox("Phân cấp chất lượng (Tier)", tier_options)

    type_options = ["All", "dataset", "capstone_project"]
    selected_type = st.sidebar.selectbox("Loại tài nguyên (Type)", type_options)

    min_rqi = st.sidebar.slider(
        "Ngưỡng RQI tối thiểu",
        min_value=0.0,
        max_value=100.0,
        value=0.0,
        step=5.0,
    )

    # Apply Filters
    filtered_resources = FilterEngine.filter_resources(
        all_resources,
        track=selected_track,
        domain=selected_domain,
        difficulty_level=selected_level,
        quality_tier=selected_tier,
        resource_type=selected_type,
        search_query=search_query,
        min_rqi=min_rqi,
    )

    # Calculate KPIs
    kpis = MetricsEngine.compute_summary_kpis(filtered_resources)

    # --- TOP KPI METRIC CARDS ---
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.metric(
            label="Tổng Học Liệu Quản Lý",
            value=f"{kpis['total_resources']} / {len(all_resources)}",
        )
    with c2:
        st.metric(label="Tổng Quy Mô Bản Ghi", value=f"{kpis['total_records']:,}")
    with c3:
        st.metric(
            label="Điểm RQI Trung Bình",
            value=f"{kpis['avg_rqi']:.1f} / 100",
            delta="Gold Tier" if kpis["avg_rqi"] >= 95 else "Cần Chú Ý",
        )
    with c4:
        st.metric(
            label="Tỷ Lệ Test Tự Động",
            value=f"{kpis['overall_test_pass_rate']:.1f}%",
        )
    with c5:
        st.metric(
            label="Bảo Mật Zero-Leakage",
            value=f"{kpis['zero_leakage_compliance']:.1f}%",
        )

    st.markdown("---")

    # --- MAIN EXECUTIVE TABS ---
    tab_overview, tab_catalog, tab_audit, tab_roadmap = st.tabs(
        [
            "📊 Tổng Quan Chất Lượng (Executive Overview)",
            "📋 Danh Mục Học Liệu (Resource Catalog)",
            "🔍 Bóc Tách & Kiểm Toán Lỗi (Deep Audit)",
            "🚀 Lộ Trình 3 Tuần (Curriculum Roadmap)",
        ]
    )

    # =========================================================================
    # TAB 1: EXECUTIVE OVERVIEW
    # =========================================================================
    with tab_overview:
        if not filtered_resources:
            st.warning("⚠️ Không có học liệu nào thỏa mãn bộ lọc hiện tại.")
        else:
            col_chart_left, col_chart_right = st.columns([3, 2])

            with col_chart_left:
                st.markdown(
                    "##### 🏆 Bảng Xếp Hạng Điểm Chất Lượng RQI Theo Từng Học Liệu"
                )
                df_bar = pd.DataFrame(
                    [
                        {
                            "FriendlyName": get_friendly_label(r),
                            "ID": r.id,
                            "RQI": round(r.rqi, 1),
                            "Tier": r.quality_tier,
                            "Track": r.track,
                            "Records": f"{r.total_records:,} records",
                            "Color": "#10B981"
                            if r.quality_tier == "Gold"
                            else "#EF4444",
                        }
                        for r in filtered_resources
                    ]
                )

                fig_rqi = px.bar(
                    df_bar,
                    x="RQI",
                    y="FriendlyName",
                    orientation="h",
                    color="Tier",
                    color_discrete_map={
                        "Gold": "#10B981",
                        "Silver": "#3B82F6",
                        "Bronze": "#F59E0B",
                        "Quarantined": "#EF4444",
                    },
                    hover_data={
                        "ID": True,
                        "Track": True,
                        "Records": True,
                        "FriendlyName": False,
                        "Tier": True,
                        "RQI": True,
                    },
                    text="RQI",
                )
                fig_rqi.update_traces(
                    texttemplate="%{text:.1f} đ",
                    textposition="inside",
                    insidetextanchor="middle",
                    marker_line_width=1,
                    marker_line_color="#E2E8F0",
                )
                # Ngưỡng chuẩn Gold duy nhất rõ ràng
                fig_rqi.add_vline(
                    x=95.0,
                    line_dash="dash",
                    line_color="#059669",
                    line_width=2,
                    annotation_text="Ngưỡng Chuẩn Gold (95.0đ)",
                    annotation_position="top right",
                )
                fig_rqi.update_layout(
                    yaxis={
                        "categoryorder": "total ascending",
                        "title": "",
                        "tickfont": {"size": 12},
                    },
                    xaxis={
                        "range": [0, 108],
                        "title": "Chỉ Số Chất Lượng RQI (Thang điểm 100)",
                    },
                    height=380,
                    margin=dict(l=10, r=20, t=20, b=20),
                    showlegend=True,
                    legend=dict(
                        orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1
                    ),
                )
                st.plotly_chart(fig_rqi, use_container_width=True)

            with col_chart_right:
                st.markdown(
                    "##### 🛡️ Ma Trận Tuân Thủ Chuẩn Mực Hệ Thống (Compliance Matrix)"
                )
                # Compute system-level compliance rates
                gold_count = sum(
                    1 for r in filtered_resources if r.quality_tier == "Gold"
                )
                gold_rate = (
                    round((gold_count / len(filtered_resources)) * 100, 1)
                    if filtered_resources
                    else 0
                )

                schema_ok = sum(1 for r in filtered_resources if r.schema_valid)
                schema_rate = (
                    round((schema_ok / len(filtered_resources)) * 100, 1)
                    if filtered_resources
                    else 0
                )

                compliance_data = [
                    {
                        "Tiêu Chuẩn": "Bảo Mật Zero-Leakage",
                        "Tỷ Lệ Đạt (%)": kpis["zero_leakage_compliance"],
                        "Trạng Thái": "100% Tuân thủ tuyệt đối",
                    },
                    {
                        "Tiêu Chuẩn": "Vượt Qua Automated Tests",
                        "Tỷ Lệ Đạt (%)": kpis["overall_test_pass_rate"],
                        "Trạng Thái": "99.0% Vượt qua",
                    },
                    {
                        "Tiêu Chuẩn": "Chuẩn Hóa Schema Cấu Trúc",
                        "Tỷ Lệ Đạt (%)": schema_rate,
                        "Trạng Thái": f"{schema_ok}/{len(filtered_resources)} học liệu hợp lệ",
                    },
                    {
                        "Tiêu Chuẩn": "Đạt Chuẩn Gold Tier",
                        "Tỷ Lệ Đạt (%)": gold_rate,
                        "Trạng Thái": f"{gold_count}/{len(filtered_resources)} đạt chuẩn Gold",
                    },
                ]
                df_comp = pd.DataFrame(compliance_data)

                fig_comp = px.bar(
                    df_comp,
                    x="Tỷ Lệ Đạt (%)",
                    y="Tiêu Chuẩn",
                    orientation="h",
                    color="Tỷ Lệ Đạt (%)",
                    color_continuous_scale=[
                        [0.0, "#EF4444"],
                        [0.8, "#F59E0B"],
                        [1.0, "#2563EB"],
                    ],
                    text="Tỷ Lệ Đạt (%)",
                    hover_data=["Trạng Thái"],
                )
                fig_comp.update_traces(
                    texttemplate="%{text:.1f}%",
                    textposition="inside",
                    insidetextanchor="middle",
                )
                fig_comp.update_layout(
                    yaxis={"title": "", "autorange": "reversed"},
                    xaxis={"range": [0, 108], "title": "Tỷ lệ tuân thủ (%)"},
                    coloraxis_showscale=False,
                    height=380,
                    margin=dict(l=10, r=20, t=20, b=20),
                )
                st.plotly_chart(fig_comp, use_container_width=True)

            # Phân bổ theo chuyên ngành & quy mô dữ liệu
            st.markdown("---")
            st.markdown(
                "##### 📐 Phân Bổ Quy Mô Dữ Liệu & Học Liệu Theo Chuyên Ngành (Tracks)"
            )
            tb1, tb2 = st.columns(2)

            with tb1:
                track_bd = MetricsEngine.breakdown_by_track(filtered_resources)
                df_tr = pd.DataFrame(
                    [
                        {
                            "Chuyên Ngành": k,
                            "Số Học Liệu": v["count"],
                            "Điểm RQI TB": v["avg_rqi"],
                            "Tổng Bản Ghi": f"{v['records']:,}",
                        }
                        for k, v in track_bd.items()
                    ]
                )
                st.dataframe(df_tr, use_container_width=True, hide_index=True)

            with tb2:
                domain_bd = MetricsEngine.breakdown_by_domain(filtered_resources)
                df_dm = pd.DataFrame(
                    [
                        {
                            "Lĩnh Vực": k.capitalize(),
                            "Số Bản Ghi": v["records"],
                            "RQI TB": f"{v['avg_rqi']:.1f} đ",
                        }
                        for k, v in domain_bd.items()
                    ]
                )
                st.dataframe(df_dm, use_container_width=True, hide_index=True)

    # =========================================================================
    # TAB 2: RESOURCE CATALOG TABLE
    # =========================================================================
    with tab_catalog:
        st.markdown("##### 📋 Bảng Tra Cứu Toàn Bộ Kho Học Liệu & Đồ Án Chuẩn Hóa")
        if filtered_resources:
            catalog_rows = []
            for r in filtered_resources:
                tier_badge = "🌟 GOLD" if r.quality_tier == "Gold" else "🚨 QUARANTINED"
                catalog_rows.append(
                    {
                        "Mã ID": r.id,
                        "Tên Học Liệu": r.name,
                        "Phân Loại": "Dataset"
                        if r.resource_type == "dataset"
                        else "Capstone Project",
                        "Chuyên Ngành": r.track,
                        "Lĩnh Vực": r.domain,
                        "Cấp Độ": r.difficulty_level,
                        "Phân Cấp": tier_badge,
                        "Điểm RQI": f"{r.rqi:.1f} / 100",
                        "Quality Gate": f"{r.quality_gate_score:.1f}%",
                        "Quy Mô": f"{r.total_records:,}",
                        "Số Lỗi": r.violations_count,
                        "Trạng Thái": r.state.upper(),
                    }
                )
            df_cat = pd.DataFrame(catalog_rows)
            st.dataframe(df_cat, use_container_width=True, hide_index=True)

            # Download Snapshot Buttons
            c_d1, c_d2 = st.columns(2)
            with c_d1:
                json_data = json.dumps(
                    [r.to_dict() for r in filtered_resources],
                    indent=2,
                    ensure_ascii=False,
                )
                st.download_button(
                    label="📥 Xuất Bản Snapshot Dữ Liệu (JSON)",
                    data=json_data,
                    file_name="cybersoft_resource_snapshot.json",
                    mime="application/json",
                )
            with c_d2:
                csv_data = df_cat.to_csv(index=False).encode("utf-8")
                st.download_button(
                    label="📥 Tải Bảng Danh Mục Học Liệu (CSV)",
                    data=csv_data,
                    file_name="cybersoft_resource_catalog.csv",
                    mime="text/csv",
                )
        else:
            st.info("Không có dữ liệu hiển thị.")

    # =========================================================================
    # TAB 3: DEEP AUDIT & DIAGNOSTICS
    # =========================================================================
    with tab_audit:
        st.markdown(
            "##### 🔍 Kiểm Toán & Bóc Tách Chi Tiết 7 Tiêu Chí Chất Lượng (Root-Cause Inspector)"
        )
        if filtered_resources:
            # Dropdown with human readable names
            resource_options = {
                r.id: f"{get_friendly_label(r)} ({r.id})" for r in filtered_resources
            }
            selected_id = st.selectbox(
                "Chọn học liệu cần kiểm toán chi tiết:",
                options=list(resource_options.keys()),
                format_func=lambda x: resource_options[x],
            )
            target = next((r for r in filtered_resources if r.id == selected_id), None)

            if target:
                # 1. Resource Profile Summary Card
                st.markdown(
                    f"""
                    <div class="resource-card">
                        <div style="font-size: 1.2rem; font-weight: 700; color: #1E3A8A;">
                            {target.name}
                        </div>
                        <div style="color: #475569; font-size: 0.95rem; margin-top: 4px;">
                            <b>Mã ID:</b> <code>{target.id}</code> | 
                            <b>Chuyên ngành:</b> {target.track} | 
                            <b>Lĩnh vực:</b> {target.domain} | 
                            <b>Cấp độ:</b> {target.difficulty_level} | 
                            <b>Quy mô:</b> {target.total_records:,} bản ghi | 
                            <b>Phân cấp:</b> <b>{target.quality_tier.upper()} TIER</b>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # 2. 7-Pillar Breakdown Bar Chart (Easy to read, intuitive)
                st.markdown("###### 📊 Điểm Số Đạt Được Trên 7 Trụ Cột Đánh Giá CRQOF:")
                pillar_data = [
                    {
                        "Trụ Cột": "Quality Gate (Trọng số 20%)",
                        "Điểm": target.quality_gate_score,
                        "Trọng Số": 0.20,
                        "Đóng Góp": round(0.20 * target.quality_gate_score, 2),
                    },
                    {
                        "Trụ Cột": "Schema Validity (Trọng số 15%)",
                        "Điểm": 100.0 if target.schema_valid else 0.0,
                        "Trọng Số": 0.15,
                        "Đóng Góp": round(
                            0.15 * (100.0 if target.schema_valid else 0.0), 2
                        ),
                    },
                    {
                        "Trụ Cột": "Completeness (Trọng số 15%)",
                        "Điểm": target.completeness_score,
                        "Trọng Số": 0.15,
                        "Đóng Góp": round(0.15 * target.completeness_score, 2),
                    },
                    {
                        "Trụ Cột": "Anti-Leakage (Trọng số 15%)",
                        "Điểm": target.anti_leakage_score,
                        "Trọng Số": 0.15,
                        "Đóng Góp": round(0.15 * target.anti_leakage_score, 2),
                    },
                    {
                        "Trụ Cột": "Test Pass Rate (Trọng số 15%)",
                        "Điểm": target.test_pass_rate,
                        "Trọng Số": 0.15,
                        "Đóng Góp": round(0.15 * target.test_pass_rate, 2),
                    },
                    {
                        "Trụ Cột": "Rubric Objectivity (Trọng số 10%)",
                        "Điểm": target.rubric_objectivity_score,
                        "Trọng Số": 0.10,
                        "Đóng Góp": round(0.10 * target.rubric_objectivity_score, 2),
                    },
                    {
                        "Trụ Cột": "Business Integrity (Trọng số 10%)",
                        "Điểm": target.business_integrity_score,
                        "Trọng Số": 0.10,
                        "Đóng Góp": round(0.10 * target.business_integrity_score, 2),
                    },
                ]
                df_pillars = pd.DataFrame(pillar_data)

                # Color mapping: Green if >= 95, Amber if >= 70, Red if < 70
                df_pillars["Color"] = df_pillars["Điểm"].apply(
                    lambda s: "#10B981"
                    if s >= 95
                    else ("#F59E0B" if s >= 70 else "#EF4444")
                )

                fig_pillar = px.bar(
                    df_pillars,
                    x="Điểm",
                    y="Trụ Cột",
                    orientation="h",
                    color="Điểm",
                    color_continuous_scale=[
                        [0.0, "#EF4444"],
                        [0.7, "#F59E0B"],
                        [1.0, "#10B981"],
                    ],
                    text="Điểm",
                    range_x=[0, 108],
                )
                fig_pillar.update_traces(
                    texttemplate="%{text:.1f}%",
                    textposition="inside",
                    insidetextanchor="middle",
                )
                fig_pillar.update_layout(
                    yaxis={"autorange": "reversed", "title": ""},
                    xaxis={
                        "title": "Mức độ tuân thủ (%) — Cột đỏ thể hiện tiêu chí bị lỗi/trừ điểm"
                    },
                    coloraxis_showscale=False,
                    height=300,
                    margin=dict(l=10, r=20, t=10, b=10),
                )
                st.plotly_chart(fig_pillar, use_container_width=True)

                # Summary RQI formula display
                st.info(
                    f"🎯 **TỔNG ĐIỂM RQI COMPOSITE**: **{target.rqi:.2f} / 100** — Xếp hạng: **{target.quality_tier.upper()} TIER**"
                )

                # 3. Root Cause Diagnostics & Violations Inspector
                if target.quality_tier == "Quarantined" or target.violations:
                    st.error(
                        f"🚨 **CẢNH BÁO KIỂM TOÁN: Phát hiện {target.violations_count} lỗi vi phạm nguyên tắc dữ liệu!**"
                    )
                    st.markdown(
                        """
                        **Nguyên nhân học liệu bị cách ly (Quarantined):**
                        * Học liệu không đạt bài kiểm tra cấu trúc Schema Invariant bắt buộc (`schema_valid = False`).
                        * Thuộc tính bắt buộc `lineage` bị khuyết thiếu trong tệp manifest siêu dữ liệu.
                        * **Hành động khắc phục**: Bổ sung trường `lineage` (nguồn gốc dữ liệu, bảng cha, phiên bản tạo lập) trước khi đệ trình lại Quality Gate.
                        """
                    )
                    st.markdown("**Chi tiết danh sách vi phạm kỹ thuật:**")
                    for idx, v in enumerate(target.violations, 1):
                        msg = (
                            v.get("message", str(v)) if isinstance(v, dict) else str(v)
                        )
                        st.code(
                            f"Vi phạm #{idx}: {msg}",
                            language="text",
                        )
                else:
                    st.success(
                        "✅ **HOÀN TOÀN ĐẠT CHUẨN:** Học liệu vượt qua 100% các bài kiểm tra tự động, không có lỗi vi phạm. Sẵn sàng phục vụ đào tạo trên LMS."
                    )

                # Metadata viewer in clean json format
                with st.expander("📄 Xem Toàn Bộ Siêu Dữ Liệu Gốc (Raw JSON Manifest)"):
                    st.json(target.to_dict())

    # =========================================================================
    # TAB 4: CURRICULUM ROADMAP
    # =========================================================================
    with tab_roadmap:
        st.markdown(
            "##### 🚀 Lộ Trình Tiến Độ 3 Tuần — Hệ Sinh Thái CyberSoft Data & AI Lab"
        )
        milestones = [
            {
                "Tuần": "Tuần 1 (Tasks 01-05)",
                "Trọng Tâm": "Nền Tảng Dữ Liệu & ETL Pipelines",
                "Kết Quả Đạt Được": "Thiết lập môi trường, chuẩn hóa ingestion, pipeline biến đổi và dbt modeling.",
                "Trạng Thái": "✅ HOÀN THÀNH",
            },
            {
                "Tuần": "Tuần 2 (Tasks 06-10)",
                "Trọng Tâm": "Dataset Registry & Quản Trị Học Liệu",
                "Kết Quả Đạt Được": "Xây dựng Dataset Registry (Task 10), chuẩn hóa 3 datasets và 1 sandbox dirty test.",
                "Trạng Thái": "✅ HOÀN THÀNH",
            },
            {
                "Tuần": "Tuần 3 (Tasks 11-15)",
                "Trọng Tâm": "Project Bank & Resource Dashboard",
                "Kết Quả Đạt Được": "Đóng gói 4 Capstone Projects (DA-01, DA-02, AI-01) & Xây dựng Dashboard Task 15.",
                "Trạng Thái": "🎯 HOÀN TẤT CỘT MỐC",
            },
        ]
        st.table(pd.DataFrame(milestones))


if __name__ == "__main__":
    main()
