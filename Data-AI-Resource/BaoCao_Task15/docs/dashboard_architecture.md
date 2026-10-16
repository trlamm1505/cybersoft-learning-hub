# KIẾN TRÚC HỆ THỐNG GIÁM SÁT CHẤT LƯỢNG TÀI NGUYÊN (CRQOF OBSERVABILITY ARCHITECTURE)

**Dự án**: CyberSoft Data & AI Lab  
**Mã tài liệu**: `CRQOF-ARCH-SPEC-V01`  
**Phiên bản**: `v0.1.0`  
**Tác giả**: Đào Trung Kiên — Data & AI Resource Engineer  

---

## 1. TỔNG QUAN KIẾN TRÚC 4 TẦNG (4-LAYER OBSERVABILITY ARCHITECTURE)

Hệ thống giám sát và đo lường chất lượng tài nguyên (CRQOF v0.1) được thiết kế theo nguyên lý tách biệt trách nhiệm (Separation of Concerns):

1. **Tầng Thu Thập Siêu Dữ Liệu (Ingestion & Discovery Layer - `src/collector.py`)**:
   - Tự động quét và nạp dữ liệu từ Dataset Registry (`BaoCao_Task10/registry_store/registry_db.json`) và Project Bank (`BaoCao_Task11` đến `BaoCao_Task14`).
   - Chuẩn hóa toàn bộ đường dẫn thành đường dẫn tương đối (Repo-relative paths) thông qua `pathlib.Path(__file__).resolve()`.
   - Xử lý các trường hợp đặc biệt (ví dụ: `latest_published_version` có giá trị `None` trên các dataset cách ly).

2. **Tầng Đo Lường & Tính Toán Chỉ Số (Metric Computation Layer - `src/metrics_engine.py`)**:
   - Triển khai công thức toán học tính Chỉ số Chất lượng Tài nguyên Tổng hợp (Resource Quality Index - RQI) 7 trụ cột có trọng số:
     $$\text{RQI} = 0.20 \times \text{QG} + 0.15 \times \text{SV} + 0.15 \times \text{CP} + 0.15 \times \text{AL} + 0.15 \times \text{TPR} + 0.10 \times \text{RO} + 0.10 \times \text{BI}$$
   - Phân cấp huy hiệu chất lượng tự động: **Gold Tier** ($\ge 95$), **Silver Tier** ($85 - 94$), **Bronze Tier** ($70 - 84$), và **Quarantined Tier** ($< 70$ hoặc thất bại Quality Gate).

3. **Tầng Cắt Lát & Lọc Đa Chiều (Multi-Dimensional Slicing Layer - `src/filter_engine.py`)**:
   - Cung cấp giao diện lọc dữ liệu không phụ thuộc vào UI: lọc theo Chuyên ngành (Track), Lĩnh vực (Domain), Cấp độ (Difficulty Level), Xếp hạng (Quality Tier), Loại tài nguyên (Resource Type) và Tìm kiếm từ khóa (Full-Text Search).

4. **Tầng Trình Diễn & Bóc Tách Lỗi (Presentation & Drill-Down Layer - `src/app.py`)**:
   - Ứng dụng Streamlit Dashboard tương tác chuyên nghiệp.
   - Hỗ trợ xuất dữ liệu ngoại tuyến (Snapshot JSON & HTML static preview qua `scripts/export_static_snapshot.py`).

---

## 2. NGUYÊN TẮC ZERO HARDCODED PERSONAL PATHS
* Tuyệt đối không đưa đường dẫn tuyệt đối của máy cá nhân (`C:\Users\...`, `D:\Cybersoft\...`) vào mã nguồn.
* Mọi liên kết tài nguyên giữa các Task đều dựa trên đường dẫn tương đối tính từ gốc repository.
* Được bảo chứng tự động qua ca kiểm thử `test_zero_hardcoded_personal_paths()` trong Pytest suite.
