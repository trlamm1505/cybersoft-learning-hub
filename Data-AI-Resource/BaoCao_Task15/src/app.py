"""CyberSoft Data & AI Lab - Resource Quality & Observability Dashboard v0.1.

Interactive Streamlit application providing real-time visibility into the health,
quality scores, schema compliance, test status, and metadata of all datasets and capstones.
Features rich visual telemetry: Architecture diagram, RQI comparison charts,
7-pillar radar charts, tier distributions, and root-cause drill-downs.
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
from src.filter_engine import FilterEngine  # noqa: E402
from src.metrics_engine import MetricsEngine  # noqa: E402

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="CyberSoft Resource Quality & Observability Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# --- CUSTOM CSS ---
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        color: #1E3A8A;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #4B5563;
        margin-bottom: 1.2rem;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 14px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .badge-gold {
        background-color: #FEF3C7;
        color: #92400E;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
    }
    .badge-quarantine {
        background-color: #FEE2E2;
        color: #991B1B;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data(ttl=300)
def load_all_resources() -> list:
    collector = ResourceCollector()
    return collector.collect_all_resources()


def main():
    # Header
    st.markdown(
        '<div class="main-header">📊 CyberSoft Data & AI Lab — Resource Observability Dashboard</div>',
        unsafe_allow_html=True,
    )
    st.markdown(
        '<div class="sub-header">Bảng Điều Khiển Giám Sát & Trực Quan Hóa Chất Lượng Toàn Diện Học Liệu Số (CRQOF v0.1) — Cột Mốc Tuần 3 (Task 15)</div>',
        unsafe_allow_html=True,
    )

    # Load Data
    all_resources = load_all_resources()

    # --- SIDEBAR FILTERS ---
    st.sidebar.header("🔍 Bộ Lọc Đa Chiều (Slicing)")

    search_query = st.sidebar.text_input(
        "Tìm kiếm tài nguyên (ID, tên, kỹ năng)",
        placeholder="Ví dụ: RAG, inventory, retail...",
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
            label="Tổng Tài Nguyên",
            value=f"{kpis['total_resources']} / {len(all_resources)}",
        )
    with c2:
        st.metric(label="Tổng Bản Ghi / Đề Mục", value=f"{kpis['total_records']:,}")
    with c3:
        st.metric(
            label="Điểm RQI Trung Bình",
            value=f"{kpis['avg_rqi']:.1f} / 100",
            delta="Gold Tier" if kpis["avg_rqi"] >= 95 else "Cần chú ý",
        )
    with c4:
        st.metric(
            label="Tỷ Lệ Test Passed", value=f"{kpis['overall_test_pass_rate']:.1f}%"
        )
    with c5:
        st.metric(
            label="Zero-Leakage Đạt Chuẩn",
            value=f"{kpis['zero_leakage_compliance']:.1f}%",
        )

    # --- ARCHITECTURE DIAGRAM VIEWER ---
    diagram_path = current_dir.parent / "Picture_15_Detail.png"
    if diagram_path.exists():
        with st.expander(
            "🗺️ Xem Sơ Đồ Kiến Trúc Hệ Sinh Thái Giám Sát & Luồng Dữ Liệu Observability (Click để phóng to)",
            expanded=False,
        ):
            st.image(
                str(diagram_path),
                caption="CyberSoft Data & AI Lab — Kiến Trúc Hệ Thống Giám Sát & Đo Lường Chất Lượng CRQOF v0.1 (Độ Phân Giải 300 DPI)",
                use_column_width=True,
            )

    st.markdown("---")

    # --- SECTION 1: INTERACTIVE VISUAL ANALYTICS ---
    st.subheader(
        "📈 Bản Đồ Trực Quan Hóa & Phân Tích Chất Lượng Đa Chiều (Visual Telemetry)"
    )

    if filtered_resources:
        v_col1, v_col2 = st.columns([3, 2])

        with v_col1:
            # 1. Bar Chart: RQI Score Comparison by Resource
            df_chart = pd.DataFrame(
                [
                    {
                        "ID": r.id,
                        "Name": r.name[:35] + ("..." if len(r.name) > 35 else ""),
                        "RQI": r.rqi,
                        "Quality Gate": r.quality_gate_score,
                        "Tier": r.quality_tier,
                        "Track": r.track,
                    }
                    for r in filtered_resources
                ]
            )

            fig_bar = px.bar(
                df_chart,
                x="RQI",
                y="ID",
                orientation="h",
                color="Tier",
                color_discrete_map={
                    "Gold": "#10B981",
                    "Silver": "#3B82F6",
                    "Bronze": "#F59E0B",
                    "Quarantined": "#EF4444",
                },
                hover_data=["Name", "Track", "Quality Gate"],
                title="<b>Xếp Hạng Điểm Chất Lượng RQI Theo Từng Tài Nguyên</b>",
                text="RQI",
            )
            fig_bar.update_layout(
                yaxis={"categoryorder": "total ascending"},
                xaxis_range=[0, 105],
                height=360,
                margin=dict(l=10, r=20, t=40, b=20),
            )
            # Add Gold threshold line
            fig_bar.add_vline(
                x=95.0,
                line_dash="dash",
                line_color="#10B981",
                annotation_text="Ngưỡng Gold (95.0đ)",
            )
            fig_bar.add_vline(
                x=70.0,
                line_dash="dot",
                line_color="#EF4444",
                annotation_text="Ngưỡng Cách Ly (<70đ)",
            )
            st.plotly_chart(fig_bar, use_container_width=True)

        with v_col2:
            # 2. Donut Chart: Quality Tier Distribution
            tier_counts = MetricsEngine.breakdown_by_tier(filtered_resources)
            tier_df = pd.DataFrame(
                [{"Tier": k, "Số lượng": v} for k, v in tier_counts.items() if v > 0]
            )
            fig_donut = px.pie(
                tier_df,
                names="Tier",
                values="Số lượng",
                hole=0.55,
                color="Tier",
                color_discrete_map={
                    "Gold": "#10B981",
                    "Silver": "#3B82F6",
                    "Bronze": "#F59E0B",
                    "Quarantined": "#EF4444",
                },
                title="<b>Tỷ Lệ Phân Cấp Chất Lượng (Quality Tiers)</b>",
            )
            fig_donut.update_traces(
                textinfo="percent+label",
                pull=[0.1 if t == "Quarantined" else 0 for t in tier_df["Tier"]],
            )
            fig_donut.update_layout(
                height=360, margin=dict(l=10, r=10, t=40, b=20), showlegend=False
            )
            st.plotly_chart(fig_donut, use_container_width=True)

        # 3. Stacked / Grouped breakdown by Track & Domain
        g_col1, g_col2 = st.columns(2)
        with g_col1:
            track_bd = MetricsEngine.breakdown_by_track(filtered_resources)
            df_track_chart = pd.DataFrame(
                [
                    {
                        "Track": k,
                        "Số Tài Nguyên": v["count"],
                        "RQI TB": v["avg_rqi"],
                        "Tổng Bản Ghi": v["records"],
                    }
                    for k, v in track_bd.items()
                ]
            )
            fig_track = px.bar(
                df_track_chart,
                x="Track",
                y="Số Tài Nguyên",
                color="Track",
                title="<b>Phân Bổ Số Lượng Tài Nguyên Theo Chuyên Ngành (Track)</b>",
                text="Số Tài Nguyên",
            )
            fig_track.update_layout(
                height=280, margin=dict(l=10, r=10, t=40, b=20), showlegend=False
            )
            st.plotly_chart(fig_track, use_container_width=True)

        with g_col2:
            domain_bd = MetricsEngine.breakdown_by_domain(filtered_resources)
            df_dom_chart = pd.DataFrame(
                [
                    {"Domain": k, "Số Bản Ghi": v["records"], "RQI TB": v["avg_rqi"]}
                    for k, v in domain_bd.items()
                ]
            )
            fig_domain = px.bar(
                df_dom_chart,
                x="Domain",
                y="Số Bản Ghi",
                color="RQI TB",
                color_continuous_scale="Viridis",
                title="<b>Quy Mô Dữ Liệu & Điểm Chất Lượng Theo Lĩnh Vực (Domain)</b>",
                text="Số Bản Ghi",
            )
            fig_domain.update_layout(height=280, margin=dict(l=10, r=10, t=40, b=20))
            st.plotly_chart(fig_domain, use_container_width=True)

    else:
        st.warning("⚠️ Không có tài nguyên nào thỏa mãn bộ lọc hiện tại.")

    st.markdown("---")

    # --- SECTION 2: MAIN RESOURCE CATALOG TABLE ---
    st.subheader("📋 Bảng Danh Mục Học Liệu Số (Resource Catalog)")
    if filtered_resources:
        table_rows = []
        for r in filtered_resources:
            table_rows.append(
                {
                    "Mã ID": r.id,
                    "Tên Tài Nguyên": r.name,
                    "Loại": "Dataset" if r.resource_type == "dataset" else "Capstone",
                    "Chuyên ngành": r.track,
                    "Lĩnh vực": r.domain,
                    "Cấp độ": r.difficulty_level,
                    "Xếp hạng": r.quality_tier,
                    "Điểm RQI": f"{r.rqi:.1f}",
                    "Quality Gate": f"{r.quality_gate_score:.1f}%",
                    "Số bản ghi": r.total_records,
                    "Lỗi vi phạm": r.violations_count,
                    "Trạng thái": r.state.upper(),
                }
            )
        df_display = pd.DataFrame(table_rows)
        st.dataframe(df_display, use_container_width=True, hide_index=True)

    st.markdown("---")

    # --- SECTION 3: DEEP DRILL-DOWN INSPECTOR ---
    st.subheader("🔍 Bảng Điều Khiển Drill-Down & Bóc Tách Trực Quan (Deep Inspector)")

    if filtered_resources:
        resource_ids = [r.id for r in filtered_resources]
        selected_id = st.selectbox(
            "Chọn tài nguyên cần soi chiếu và phân tích chuyên sâu:", resource_ids
        )
        target = next((r for r in filtered_resources if r.id == selected_id), None)

        if target:
            tab_radar, tab_meta, tab_audit, tab_evolution, tab_skills = st.tabs(
                [
                    "🕸️ Biểu Đồ Radar 7 Trụ Cột",
                    "📌 Siêu Dữ Liệu (Metadata)",
                    "⚠️ Kiểm Toán Lỗi & Vi Phạm",
                    "🚀 Lộ Trình Tiến Độ 3 Tuần",
                    "🎯 Kỹ Năng & Hướng Dẫn Kỹ Thuật",
                ]
            )

            # TAB 1: RADAR CHART (SPIDER CHART) & WATERFALL
            with tab_radar:
                st.markdown(
                    f"### Phân Tích 7 Trụ Cột Đo Lường CRQOF Cho: `{target.name}`"
                )
                r_col1, r_col2 = st.columns([3, 2])

                with r_col1:
                    categories = [
                        "Quality Gate<br>(20%)",
                        "Schema Validity<br>(15%)",
                        "Completeness<br>(15%)",
                        "Anti-Leakage<br>(15%)",
                        "Test Pass Rate<br>(15%)",
                        "Rubric Objectivity<br>(10%)",
                        "Business Integrity<br>(10%)",
                    ]
                    values = [
                        target.quality_gate_score,
                        100.0 if target.schema_valid else 0.0,
                        target.completeness_score,
                        target.anti_leakage_score,
                        target.test_pass_rate,
                        target.rubric_objectivity_score,
                        target.business_integrity_score,
                    ]
                    # Close the loop
                    categories_closed = categories + [categories[0]]
                    values_closed = values + [values[0]]
                    benchmark_closed = [100.0] * 8

                    fig_radar = go.Figure()
                    fig_radar.add_trace(
                        go.Scatterpolar(
                            r=benchmark_closed,
                            theta=categories_closed,
                            name="Chuẩn Benchmark Lý Tưởng (100%)",
                            line=dict(color="#CBD5E1", dash="dash"),
                            fill="none",
                        )
                    )
                    fig_radar.add_trace(
                        go.Scatterpolar(
                            r=values_closed,
                            theta=categories_closed,
                            name=f"{target.id} (RQI: {target.rqi:.1f})",
                            fill="toself",
                            line=dict(
                                color="#10B981"
                                if target.quality_tier == "Gold"
                                else "#EF4444",
                                width=2.5,
                            ),
                            fillcolor="rgba(16, 185, 129, 0.25)"
                            if target.quality_tier == "Gold"
                            else "rgba(239, 68, 68, 0.25)",
                        )
                    )
                    fig_radar.update_layout(
                        polar=dict(
                            radialaxis=dict(visible=True, range=[0, 105]),
                        ),
                        showlegend=True,
                        height=420,
                        margin=dict(l=30, r=30, t=30, b=30),
                    )
                    st.plotly_chart(fig_radar, use_container_width=True)

                with r_col2:
                    st.markdown("#### Đóng Góp Điểm Trọng Số Vào RQI:")
                    weighted_breakdown = [
                        {
                            "Trụ cột": "Quality Gate (20%)",
                            "Điểm gốc": f"{target.quality_gate_score:.1f}%",
                            "Đóng góp": round(0.20 * target.quality_gate_score, 2),
                        },
                        {
                            "Trụ cột": "Schema Validity (15%)",
                            "Điểm gốc": f"{100 if target.schema_valid else 0}%",
                            "Đóng góp": round(
                                0.15 * (100.0 if target.schema_valid else 0.0), 2
                            ),
                        },
                        {
                            "Trụ cột": "Completeness (15%)",
                            "Điểm gốc": f"{target.completeness_score:.1f}%",
                            "Đóng góp": round(0.15 * target.completeness_score, 2),
                        },
                        {
                            "Trụ cột": "Anti-Leakage (15%)",
                            "Điểm gốc": f"{target.anti_leakage_score:.1f}%",
                            "Đóng góp": round(0.15 * target.anti_leakage_score, 2),
                        },
                        {
                            "Trụ cột": "Test Pass Rate (15%)",
                            "Điểm gốc": f"{target.test_pass_rate:.1f}%",
                            "Đóng góp": round(0.15 * target.test_pass_rate, 2),
                        },
                        {
                            "Trụ cột": "Rubric Objectivity (10%)",
                            "Điểm gốc": f"{target.rubric_objectivity_score:.1f}%",
                            "Đóng góp": round(
                                0.10 * target.rubric_objectivity_score, 2
                            ),
                        },
                        {
                            "Trụ cột": "Business Integrity (10%)",
                            "Điểm gốc": f"{target.business_integrity_score:.1f}%",
                            "Đóng góp": round(
                                0.10 * target.business_integrity_score, 2
                            ),
                        },
                    ]
                    df_weight = pd.DataFrame(weighted_breakdown)
                    st.dataframe(df_weight, use_container_width=True, hide_index=True)

                    st.markdown(
                        f"**TỔNG ĐIỂM RQI COMPOSITE**: `{target.rqi:.2f} / 100`"
                    )
                    if target.quality_tier == "Gold":
                        st.success(
                            "🌟 ĐẠT TIÊU CHUẨN GOLD TIER: Tài nguyên hoàn hảo, sẵn sàng phục vụ giảng dạy trên LMS."
                        )
                    else:
                        st.error(
                            "🚨 QUARANTINED: Tài nguyên bị khuyết điểm, không được phép đưa vào học phần chính thức."
                        )

            # TAB 2: METADATA
            with tab_meta:
                col_meta1, col_meta2 = st.columns(2)
                with col_meta1:
                    st.markdown(f"**Tên định danh (ID)**: `{target.id}`")
                    st.markdown(f"**Tên đầy đủ**: {target.name}")
                    st.markdown(f"**Loại tài nguyên**: {target.resource_type.upper()}")
                    st.markdown(f"**Chuyên ngành**: {target.track}")
                    st.markdown(f"**Lĩnh vực**: {target.domain}")
                    st.markdown(f"**Độ khó**: {target.difficulty_level}")
                with col_meta2:
                    st.markdown(f"**Phiên bản**: `{target.version}`")
                    st.markdown(f"**Tác giả**: {target.author}")
                    st.markdown(f"**Thư mục nguồn**: `{target.relative_source_dir}`")
                    st.markdown(
                        f"**Trạng thái**: `{target.state}` (Tier: **{target.quality_tier}**)"
                    )
                    st.markdown(
                        f"**Tổng số file đính kèm**: {target.data_files_count} files"
                    )

                st.markdown("**Mô tả chi tiết:**")
                st.info(target.description)

            # TAB 3: AUDIT & VIOLATIONS
            with tab_audit:
                st.markdown("### Kết Quả Kiểm Toán Quality Gate & Lỗi Phát Sinh")
                if target.violations_count > 0 or target.state == "quarantined":
                    st.error(
                        f"Phát hiện {target.violations_count} lỗi vi phạm ràng buộc chất lượng nghiêm trọng:"
                    )
                    for idx, v in enumerate(target.violations, 1):
                        st.markdown(f"- ❌ **Lỗi {idx}**: `{v}`")
                    st.warning(
                        "⚠️ Tài nguyên này đang ở chế độ **CÁCH LY (QUARANTINE ZONE)** theo tài liệu hướng dẫn `docs/quality_audit_and_quarantine_guide.md`."
                    )
                else:
                    st.success(
                        "✅ Tài nguyên đã vượt qua 100% các bài kiểm toán ràng buộc chất lượng. Zero violations!"
                    )

                if target.warnings:
                    st.markdown("**Cảnh báo cần lưu ý:**")
                    for w in target.warnings:
                        st.warning(f"- ⚠️ {w}")

                st.markdown(
                    f"**Tổng số phép kiểm tra**: {target.total_checks} | **Passed**: {target.passed_checks} | **Failed**: {target.failed_checks}"
                )

            # TAB 4: EVOLUTION ROADMAP (15 DAYS)
            with tab_evolution:
                st.markdown(
                    "### 🗓️ Lộ Trình Tích Lũy Tài Nguyên & Cột Mốc Tuần 3 (Task 01 - 15)"
                )
                timeline_data = [
                    {
                        "Giai đoạn": "Tuần 1: Khảo sát & Nền móng",
                        "Đầu việc": "Tasks 01-05: Architecture, Repo, Schema & Quality Harness v0",
                        "Trạng thái": "Hoàn tất (100%)",
                        "Số tài nguyên": "Foundation",
                    },
                    {
                        "Giai đoạn": "Tuần 2: Dataset Engineering",
                        "Đầu việc": "Tasks 06-10: Retail Sales, HR Ops, RAG 100 benchmark, Synthetic Pipeline, Registry Portal",
                        "Trạng thái": "Hoàn tất (100%)",
                        "Số tài nguyên": "4 Datasets",
                    },
                    {
                        "Giai đoạn": "Tuần 3: Project Bank & Phân tích",
                        "Đầu việc": "Tasks 11-14: Standard Project, Capstone DA-01 (Churn), DA-02 (Logistics), AI-01 (RAG Q&A)",
                        "Trạng thái": "Hoàn tất (100%)",
                        "Số tài nguyên": "4 Capstones",
                    },
                    {
                        "Giai đoạn": "Cột mốc Task 15: Observability",
                        "Đầu việc": "Task 15: Dashboard CRQOF v0.1 Giám sát toàn diện 8 tài nguyên, 14.8k bản ghi",
                        "Trạng thái": "Bàn giao xuất sắc",
                        "Số tài nguyên": "8 Assets (RQI: 97.7)",
                    },
                    {
                        "Giai đoạn": "Tuần 4: RAG & Trợ lý thông minh",
                        "Đầu việc": "Tasks 16-20: Ingest & Chunking Pipeline, Retriever Baseline, Hybrid Rerank, Evaluator",
                        "Trạng thái": "Sẵn sàng khởi động",
                        "Số tài nguyên": "Next Sprint",
                    },
                ]
                st.table(pd.DataFrame(timeline_data))

            # TAB 5: SKILLS & TECHNICAL DETAILS
            with tab_skills:
                st.markdown("### Chuẩn Đầu Ra Năng Lực & Kỹ Năng Đào Tạo")
                if target.skills:
                    for s in target.skills:
                        st.markdown(f"- 🎯 **{s}**")
                else:
                    st.write("Chưa có danh mục kỹ năng chi tiết.")

                st.markdown("### Chi Tiết Cấu Hình & Metadata Bổ Sung:")
                st.json(target.metadata_details)

    # --- FOOTER & EXPORT ---
    st.markdown("---")
    col_f1, col_f2 = st.columns([3, 1])
    with col_f1:
        st.caption(
            "CyberSoft Data & AI Resource Engineer — Báo Cáo Kỹ Thuật Ngày 15 (Tuần 3: Project Bank & Phân Tích) | CRQOF Framework v0.1"
        )
    with col_f2:
        if filtered_resources:
            export_data = [r.to_dict() for r in filtered_resources]
            st.download_button(
                label="📥 Tải Dữ Liệu JSON Snapshot",
                data=json.dumps(export_data, indent=2, ensure_ascii=False),
                file_name="cybersoft_resource_quality_snapshot.json",
                mime="application/json",
            )


if __name__ == "__main__":
    main()
