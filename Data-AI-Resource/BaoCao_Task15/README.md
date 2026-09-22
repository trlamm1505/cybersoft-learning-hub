# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 15
## DASHBOARD THEO DÕI CHẤT LƯỢNG TÀI NGUYÊN (`cybersoft-resource-observability-dashboard`)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 15 — Dashboard theo dõi chất lượng tài nguyên (`cybersoft-resource-observability-dashboard`)  
**Vai trò phụ trách**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Phiên bản**: v1.0.0  
**Ngày hoàn thiện**: 2026-09-21  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task15/` chứa trọn bộ tài nguyên và mã nguồn của Dashboard theo dõi chất lượng tài nguyên học liệu số tại CyberSoft Academy:

```text
BaoCao_Task15/
├── 15_resource_quality_dashboard.md       # Bản đặc tả kỹ thuật chi tiết toàn diện Task 15
├── README.md                              # Báo cáo tổng quan bàn giao & hướng dẫn thực thi
├── AI_WORKLOG.md                          # Nhật ký phối hợp AI & thẩm định 3 cột theo chuẩn CyberSoft
├── Picture_15_Detail.png                  # Sơ đồ kiến trúc Dashboard, Metric Engine & Luồng dữ liệu (High-res 300 DPI)
├── Picture_15_Detail.drawio               # File thiết kế sơ đồ gốc dạng vector chuẩn Draw.io XML
├── Picture_15_Demo_Dashboard.png          # Ảnh chụp thực tế giao diện Dashboard tổng quan (Overview Tab & 5 KPI cards)
├── Picture_15_Demo_Catalog.png            # Ảnh chụp thực tế danh mục 8 tài nguyên giám sát (Catalog Tab & CSV/JSON export)
├── Picture_15_Demo_Drilldown.png          # Ảnh chụp thực tế tính năng bóc tách siêu dữ liệu & kiểm toán lỗi vi phạm
├── Picture_15-Detail.png                  # Bản sao tương thích liên kết tài liệu
├── requirements.txt                       # Danh mục thư viện phụ thuộc (Streamlit, Pandas, Pytest...)
├── catalog/
│   ├── metric_definitions.json            # Từ điển 10 chỉ số chất lượng tài nguyên chuẩn hóa
│   ├── metric_definitions.md              # Văn bản đặc tả công thức toán học và ngưỡng phân cấp chất lượng
│   ├── aggregated_resource_snapshot.json  # Dữ liệu JSON snapshot tổng hợp 8 tài nguyên (14,854 bản ghi)
│   └── dashboard_preview.html             # Bản xem trước HTML tĩnh cho phép đánh giá không cần web server
├── docs/
│   ├── dashboard_architecture.md          # Bản đặc tả kiến trúc 4 tầng và nguyên tắc Zero-Hardcoded Paths
│   ├── metric_definitions.md              # Văn bản đặc tả công thức toán học và ngưỡng phân cấp chất lượng
│   └── quality_audit_and_quarantine_guide.md # Hướng dẫn kiểm toán lỗi và quy trình cách ly Quarantined
├── src/
│   ├── __init__.py                        # Khởi tạo package Python
│   ├── collector.py                       # Động cơ quét & nạp siêu dữ liệu (Zero Hardcoded Paths)
│   ├── metrics_engine.py                  # Động cơ tính toán chỉ số thành phần & Composite RQI
│   ├── filter_engine.py                   # Động cơ lọc đa chiều (Track, Domain, Level, Tier, Search)
│   └── app.py                             # Ứng dụng Streamlit Dashboard v0.1 (KPIs, Slicing, Drill-Down, Dark/Light Theme)
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

## 2. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

### Bước 1: Chạy kịch bản Demo Workflow toàn diện (4 giai đoạn kiểm định)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/demo_dashboard_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 4 giai đoạn kiểm tra nạp dữ liệu, thẩm định CRQOF RQI, kiểm thử bộ lọc đa chiều & drill-down, và xuất snapshot tĩnh đạt chuẩn (Exit code: 0).

### Bước 2: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/tests/ -v
```
*Kết quả kỳ vọng*: 16/16 test cases **PASSED** trong 0.38 giây (100% SUCCESS).

### Bước 3: Khởi chạy Streamlit Dashboard trực quan
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/run_dashboard.py --port 8501
```
*Tùy chọn kiểm tra không đầu (Headless)*:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/run_dashboard.py --headless
```

### Bước 4: Xuất bản báo cáo Snapshot JSON và HTML tĩnh độc lập
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task15/scripts/export_static_snapshot.py
```

---

## 3. SỐ LIỆU ĐỊNH LƯỢNG NỔI BẬT

* **Tổng số tài nguyên giám sát**: `8` tài nguyên (4 Datasets từ Task 10 + 4 Projects/Capstones từ Tasks 11-14).
* **Tổng số bản ghi & đề mục quản lý**: `14,854` bản ghi (Sales, HR, RAG benchmark, Inventory movements).
* **Điểm chất lượng RQI bình quân**: `97.69 / 100` điểm (7 tài nguyên đạt chuẩn **GOLD TIER**, 1 tài nguyên cách ly **QUARANTINED**).
* **Tỷ lệ kiểm thử tự động thành công**: `99.0%` (Tất cả tài nguyên giáo trình chính thức đạt 100% PASS).
* **Mức độ tuân thủ Zero-Leakage**: `100.0%` (100% đồ án học viên sạch hoàn toàn đáp án mẫu).
* **Số lượng bài test tự động Pytest**: **16/16 test cases PASS 100%** trong 0.38 giây.
* **Mức độ tuân thủ chuẩn mã thoát POSIX**: 100% tuân thủ mã 0 (hợp lệ) và mã 1 (lỗi).

---

## 4. BẢNG CHECKLIST TIÊU CHÍ ĐIỀU KIỆN NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí DoD theo Kế hoạch 30 ngày | Trạng thái | Bằng chứng kiểm chứng độc lập |
| :---: | :--- | :---: | :--- |
| 1 | **Số liệu dashboard khớp registry 100%** | **PASSED** | Khớp chính xác 4 datasets trong `registry_db.json` (Task 10) và 4 capstones (Tasks 11-14). Được bảo chứng qua `test_registry_sync.py`. |
| 2 | **Bộ lọc hoạt động mượt mà, đa chiều** | **PASSED** | Lọc linh hoạt theo Chuyên ngành (Track), Lĩnh vực (Domain), Cấp độ (Level), Xếp hạng (Tier), Loại (Type) và Tìm kiếm từ khóa. Được bảo chứng qua `test_filter_engine.py`. |
| 3 | **Tuyệt đối không hard-code đường dẫn cá nhân** | **PASSED** | Sử dụng hoàn toàn `Path(__file__).resolve()` tương đối với repository root. Bộ quét tự động `test_zero_hardcoded_personal_paths()` xác nhận 0 vi phạm. |
| 4 | **Có tính năng Drill-Down tới metadata & lỗi** | **PASSED** | Xem toàn bộ siêu dữ liệu và bóc tách chính xác lỗi vi phạm schema (`lineage` required) của tài nguyên bị cách ly `ds-dirty-test-quarantine`. |
| 5 | **Đầy đủ định nghĩa bộ chỉ số (Metric definitions)** | **PASSED** | Soạn thảo đầy đủ `metric_definitions.json` và `metric_definitions.md` quy chuẩn 10 chỉ số đo lường và công thức tổng hợp RQI. |
| 6 | **Có ảnh/sơ đồ demo và báo cáo Word chuẩn** | **PASSED** | Sinh ảnh chất lượng cao `Picture_15_Detail.png` (300 DPI) và xây dựng báo cáo Word chính thức `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_15.docx`. |
| 7 | **Bộ kiểm thử tự động Pytest đạt 100% PASS** | **PASSED** | **16/16 unit & integration tests PASS 100%** trong 0.38 giây. Kịch bản `demo_dashboard_workflow.py` đạt chuẩn POSIX Exit Code 0. |
