# BÁO CÁO TỔNG QUAN BÀN GIAO: NGÀY 15 — DASHBOARD THEO DÕI CHẤT LƯỢNG TÀI NGUYÊN
## CyberSoft Data & AI Lab — Resource Quality & Observability Dashboard v0.1

**Dự án**: CyberSoft Data & AI Lab  
**Học viên / Kỹ sư phụ trách**: Đào Trung Kiên — Data & AI Resource Engineer  
**Giai đoạn**: Tuần 3 — Project Bank và Phân Tích  
**Phiên bản bàn giao**: `v0.1.0`  
**Ngày hoàn thiện**: 2026-09-19  

---

## 1. TỔNG QUAN SẢN PHẨM BÀN GIAO

Task 15 là dấu mốc hoàn thành toàn diện **Tuần 3: Project Bank và Phân tích**, cung cấp giải pháp quan sát toàn diện (Observability) và giám sát chất lượng học liệu số trong hệ thống đào tạo CyberSoft Academy.

Hệ thống hợp nhất toàn bộ siêu dữ liệu từ **Dataset Registry (Task 10)** và **Project Bank (Tasks 11-14)**, tính toán chỉ số chất lượng tổng hợp **RQI (Resource Quality Index)** theo khung đo lường **CRQOF v0.1**, cung cấp giao diện tương tác Streamlit và bộ công cụ bóc tách nguyên nhân gốc của các vi phạm chất lượng.

---

## 2. CẤU TRÚC THƯ MỤC BÀN GIAO (`BaoCao_Task15/`)

```
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/
├── 15_resource_quality_dashboard.md       # Bản đặc tả kỹ thuật chi tiết toàn diện (>20KB)
├── README.md                              # Báo cáo tổng quan bàn giao, hướng dẫn CLI và bảng DoD
├── AI_WORKLOG.md                          # Nhật ký phối hợp AI minh bạch, thẩm định 6 bẫy AI & kịch bản 3 phút
├── Picture_15_Detail.png                  # Sơ đồ kiến trúc Dashboard, Metric Engine & Layout giao diện
├── Picture_15-Detail.png                  # Bản sao sơ đồ đồng bộ liên kết tài liệu
├── requirements.txt                       # Danh mục thư viện phụ thuộc (Streamlit, Pandas, Pytest...)
├── catalog/
│   ├── metric_definitions.json            # Từ điển 10 chỉ số chất lượng tài nguyên chuẩn hóa
│   ├── metric_definitions.md              # Văn bản đặc tả công thức toán học và ngưỡng phân cấp chất lượng
│   ├── aggregated_resource_snapshot.json  # Dữ liệu JSON snapshot tổng hợp 8 tài nguyên (14,854 bản ghi)
│   └── dashboard_preview.html             # Bản xem trước HTML tĩnh cho phép đánh giá không cần web server
├── src/
│   ├── __init__.py                        # Khởi tạo package Python
│   ├── collector.py                       # Động cơ quét & nạp siêu dữ liệu (Zero Hardcoded Paths)
│   ├── metrics_engine.py                  # Động cơ tính toán chỉ số thành phần & Composite RQI
│   ├── filter_engine.py                   # Động cơ lọc đa chiều (Track, Domain, Level, Tier, Search)
│   └── app.py                             # Ứng dụng Streamlit Dashboard v0.1 (KPIs, Slicing, Drill-Down)
├── scripts/
│   ├── generate_task15_diagram.py         # Script sinh sơ đồ đồ họa Picture_15_Detail.png (300 DPI)
│   ├── run_dashboard.py                   # CLI khởi chạy Streamlit Dashboard (hỗ trợ --headless)
│   ├── export_static_snapshot.py          # Script xuất báo cáo JSON và HTML snapshot độc lập
│   └── demo_dashboard_workflow.py         # Kịch bản kiểm chứng toàn diện 4 giai đoạn đạt Exit Code 0
└── tests/
    ├── __init__.py
    ├── test_dashboard_integrity.py        # Kiểm tra tính toàn vẹn tệp và bảo đảm ZERO hardcoded personal paths
    ├── test_registry_sync.py              # Kiểm tra số liệu dashboard khớp 100% với Registry Task 10 & 11-14
    ├── test_filter_engine.py              # Kiểm tra bộ lọc đa chiều (Chuyên ngành, Lĩnh vực, Cấp độ, Tier)
    ├── test_drilldown_engine.py           # Kiểm tra bóc tách metadata và lỗi vi phạm của tài nguyên bị cách ly
    └── test_metrics_calculation.py        # Kiểm tra tính toán số học RQI và 5 thẻ chỉ số KPI
```

---

## 3. SỐ LIỆU ĐỊNH LƯỢNG NỔI BẬT

* **Tổng số tài nguyên giám sát**: `8` tài nguyên (4 Datasets từ Task 10 + 4 Projects/Capstones từ Tasks 11-14).
* **Tổng số bản ghi & đề mục quản lý**: `14,854` bản ghi (Sales, HR, RAG benchmark, Inventory movements).
* **Điểm chất lượng RQI bình quân**: `97.69 / 100` điểm (7 tài nguyên đạt chuẩn **GOLD TIER**, 1 tài nguyên cách ly **QUARANTINED**).
* **Tỷ lệ kiểm thử tự động thành công**: `99.0%` (Tất cả tài nguyên giáo trình chính thức đạt 100% PASS).
* **Mức độ tuân thủ Zero-Leakage**: `100.0%` (100% đồ án học viên sạch hoàn toàn đáp án mẫu).
* **Số lượng bài test tự động Pytest**: **16/16 test cases PASS 100%** trong 0.80 giây.
* **Mức độ tuân thủ chuẩn mã thoát POSIX**: 100% tuân thủ mã 0 (hợp lệ) và mã 1 (lỗi).

---

## 4. BẢNG CHECKLIST TIÊU CHÍ ĐIỀU KIỆN NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí DoD theo Kế hoạch 30 ngày | Trạng thái | Bằng chứng kiểm chứng độc lập |
| :-: | :--- | :---: | :--- |
| 1 | **Số liệu dashboard khớp registry 100%** | **PASSED** | Khớp chính xác 4 datasets trong `registry_db.json` (Task 10) và 4 capstones (Tasks 11-14). Được bảo chứng qua `test_registry_sync.py`. |
| 2 | **Bộ lọc hoạt động mượt mà, đa chiều** | **PASSED** | Lọc linh hoạt theo Chuyên ngành (Track), Lĩnh vực (Domain), Cấp độ (Level), Xếp hạng (Tier), Loại (Type) và Tìm kiếm từ khóa. Được bảo chứng qua `test_filter_engine.py`. |
| 3 | **Tuyệt đối không hard-code đường dẫn cá nhân** | **PASSED** | Sử dụng hoàn toàn `Path(__file__).resolve()` tương đối với repository root. Bộ quét tự động `test_zero_hardcoded_personal_paths()` xác nhận 0 vi phạm. |
| 4 | **Có tính năng Drill-Down tới metadata & lỗi** | **PASSED** | Xem toàn bộ siêu dữ liệu và bóc tách chính xác lỗi vi phạm schema (`lineage` required) của tài nguyên bị cách ly `ds-dirty-test-quarantine`. |
| 5 | **Đầy đủ định nghĩa bộ chỉ số (Metric definitions)** | **PASSED** | Soạn thảo đầy đủ `metric_definitions.json` và `metric_definitions.md` quy chuẩn 10 chỉ số đo lường và công thức tổng hợp RQI. |
| 6 | **Có ảnh/sơ đồ demo và báo cáo Word chuẩn** | **PASSED** | Sinh ảnh chất lượng cao `Picture_15_Detail.png` (300 DPI) và xây dựng báo cáo Word chính thức `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_15.docx`. |
| 7 | **Bộ kiểm thử tự động Pytest đạt 100% PASS** | **PASSED** | **16/16 unit & integration tests PASS 100%** trong 0.80 giây. Kịch bản `demo_dashboard_workflow.py` đạt chuẩn POSIX Exit Code 0. |

---

## 5. HƯỚNG DẪN THỰC THI (QUICK START)

```powershell
# 1. Chạy kịch bản kiểm chứng tự động toàn diện 4 giai đoạn
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/demo_dashboard_workflow.py

# 2. Chạy bộ kiểm thử tự động Pytest
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/tests/ -v

# 3. Khởi chạy Dashboard Streamlit trên trình duyệt
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/run_dashboard.py --port 8501

# 4. Kiểm tra chế độ Headless (không mở trình duyệt)
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/run_dashboard.py --headless

# 5. Xuất bản snapshot JSON và HTML tĩnh
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/export_static_snapshot.py
```
