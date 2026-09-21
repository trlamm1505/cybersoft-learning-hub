"""CyberSoft Data & AI Lab - Resource Quality & Observability Dashboard v0.1.

Interactive Streamlit application providing real-time visibility into the health,
quality scores, schema compliance, test status, and metadata of all datasets and capstones.
"""

import json
from pathlib import Path
import sys

# Ensure local imports work regardless of working directory
current_dir = Path(__file__).resolve().parent
if str(current_dir.parent) not in sys.path:
    sys.path.insert(0, str(current_dir.parent))

import pandas as pd  # noqa: E402
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
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        padding: 16px;
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
        '<div class="sub-header">Bảng Điều Khiển Giám Sát Chất Lượng Tài Nguyên Giáo Dục (Dataset Registry & Project Bank) — Version 0.1.0</div>',
        unsafe_allow_html=True,
    )

    # Load Data
    all_resources = load_all_resources()

    # --- SIDEBAR FILTERS ---
    st.sidebar.header("🔍 Bộ Lọc Đa Chiều")

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
        "Ngưỡng RQI tối thiểu", min_value=0.0, max_value=100.0, value=0.0, step=5.0
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
            delta="Gold Tier" if kpis["avg_rqi"] >= 95 else "Attention",
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

    st.markdown("---")

    # --- VISUAL OBSERVABILITY ROW ---
    col_chart1, col_chart2 = st.columns(2)

    with col_chart1:
        st.subheader("📈 Phân Bổ Chất Lượng (RQI) Theo Chuyên Ngành")
        track_breakdown = MetricsEngine.breakdown_by_track(filtered_resources)
        if track_breakdown:
            track_df = pd.DataFrame(
                [
                    {
                        "Track": k,
                        "Tài nguyên": v["count"],
                        "RQI Trung bình": v["avg_rqi"],
                        "Bản ghi": v["records"],
                    }
                    for k, v in track_breakdown.items()
                ]
            )
            st.dataframe(track_df, use_container_width=True, hide_index=True)
        else:
            st.info("Không có dữ liệu phù hợp bộ lọc.")

    with col_chart2:
        st.subheader("🏷️ Phân Cấp Chất Lượng & Mức Độ Khó")
        tier_breakdown = MetricsEngine.breakdown_by_tier(filtered_resources)
        lvl_breakdown = MetricsEngine.breakdown_by_level(filtered_resources)
        summary_rows = [
            {"Tiêu chí": f"Tier: {k}", "Số lượng": v}
            for k, v in tier_breakdown.items()
            if v > 0
        ] + [
            {"Tiêu chí": f"Level: {k}", "Số lượng": v}
            for k, v in lvl_breakdown.items()
            if v > 0
        ]
        tier_df = pd.DataFrame(summary_rows)
        st.dataframe(tier_df, use_container_width=True, hide_index=True)

    st.markdown("---")

    # --- MAIN DATA TABLE ---
    st.subheader("📋 Danh Mục Tài Nguyên Giám Sát (Resource Catalog)")
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
                    "Xếp hạng Tier": r.quality_tier,
                    "Điểm RQI": f"{r.rqi:.1f}",
                    "Quality Gate": f"{r.quality_gate_score:.1f}%",
                    "Số bản ghi": r.total_records,
                    "Vi phạm": r.violations_count,
                    "Trạng thái": r.state.upper(),
                }
            )
        df_display = pd.DataFrame(table_rows)
        st.dataframe(df_display, use_container_width=True, hide_index=True)
    else:
        st.warning(
            "⚠️ Không tìm thấy tài nguyên nào thỏa mãn toàn bộ các tiêu chí bộ lọc."
        )

    st.markdown("---")

    # --- DRILL-DOWN SECTION ---
    st.subheader("🔍 Chi Tiết Kỹ Thuật & Kiểm Toán Lỗi (Drill-Down Inspector)")

    if filtered_resources:
        resource_ids = [r.id for r in filtered_resources]
        selected_id = st.selectbox(
            "Chọn tài nguyên để drill-down chi tiết:", resource_ids
        )
        target = next((r for r in filtered_resources if r.id == selected_id), None)

        if target:
            tab1, tab2, tab3, tab4 = st.tabs(
                [
                    "📌 Siêu Dữ Liệu (Metadata)",
                    "📊 Bảng Điểm 7 Trụ Cột",
                    "⚠️ Kiểm Toán Lỗi & Vi Phạm",
                    "🚀 Kỹ Năng & Hướng Dẫn",
                ]
            )

            with tab1:
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

            with tab2:
                st.markdown("### Điểm Số 7 Trụ Cột Đo Lường CRQOF")
                m_col1, m_col2, m_col3, m_col4 = st.columns(4)
                with m_col1:
                    st.metric("Quality Gate (20%)", f"{target.quality_gate_score:.1f}%")
                    st.metric(
                        "Schema Validity (15%)", "100%" if target.schema_valid else "0%"
                    )
                with m_col2:
                    st.metric("Completeness (15%)", f"{target.completeness_score:.1f}%")
                    st.metric("Anti-Leakage (15%)", f"{target.anti_leakage_score:.1f}%")
                with m_col3:
                    st.metric("Test Pass Rate (15%)", f"{target.test_pass_rate:.1f}%")
                    st.metric(
                        "Rubric Objectivity (10%)",
                        f"{target.rubric_objectivity_score:.1f}%",
                    )
                with m_col4:
                    st.metric(
                        "Business Integrity (10%)",
                        f"{target.business_integrity_score:.1f}%",
                    )
                    st.metric("TỔNG HỢP RQI", f"{target.rqi:.2f} / 100")

            with tab3:
                st.markdown("### Kết Quả Kiểm Toán Quality Gate & Lỗi Phát Sinh")
                if target.violations_count > 0 or target.state == "quarantined":
                    st.error(
                        f"Phát hiện {target.violations_count} lỗi vi phạm ràng buộc chất lượng nghiêm trọng:"
                    )
                    for idx, v in enumerate(target.violations, 1):
                        st.markdown(f"- **Lỗi {idx}**: `{v}`")
                    st.warning(
                        "⚠️ Tài nguyên này đang ở chế độ **CÁCH LY (QUARANTINED)**. Không được phép đưa vào giáo trình học viên."
                    )
                else:
                    st.success(
                        "✅ Tài nguyên đã vượt qua 100% các bài kiểm toán ràng buộc chất lượng. Zero violations!"
                    )

                if target.warnings:
                    st.markdown("**Cảnh báo cần lưu ý:**")
                    for w in target.warnings:
                        st.warning(f"- {w}")

                st.markdown(
                    f"**Tổng số phép kiểm tra**: {target.total_checks} | **Passed**: {target.passed_checks} | **Failed**: {target.failed_checks}"
                )

            with tab4:
                st.markdown("### Chuẩn Đầu Ra Năng Lực & Kỹ Năng Đào Tạo")
                if target.skills:
                    for s in target.skills:
                        st.markdown(f"- 🎯 {s}")
                else:
                    st.write("Chưa có danh mục kỹ năng chi tiết.")

                st.markdown("### Chi Tiết Kỹ Thuật Đính Kèm:")
                st.json(target.metadata_details)

    # --- FOOTER & EXPORT ---
    st.markdown("---")
    col_f1, col_f2 = st.columns([3, 1])
    with col_f1:
        st.caption(
            "CyberSoft Data & AI Resource Engineer — Báo Cáo Kỹ Thuật Ngày 15 (Tuần 3: Project Bank & Phân Tích)"
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
