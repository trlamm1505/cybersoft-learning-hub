# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 24
## THEO DÕI LINEAGE VÀ PHIÊN BẢN (LINEAGE & VERSIONING SYSTEM v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 24 — Theo dõi lineage và phiên bản (`cybersoft-lineage-tracker`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-02  
**Nhánh Git**: `feature/data-ai-day24`  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task24/` chứa toàn bộ giải pháp quản lý nguồn gốc dữ liệu (Data Lineage DAG), Cửa hàng lưu trữ bất biến (WORM Storage), Bản đồ phát hành (Release Manifests v1.0.0 & v1.1.0), Nhật ký thay đổi tự động (Changelog), Máy trạng thái vòng đời (Deprecation) và Hướng dẫn hoàn tác (Rollback Note):

```text
BaoCao_Task24/
├── 24_lineage_and_versioning.md           # Bản đặc tả kỹ thuật chi tiết toàn diện Task 24 (9 mục lớn)
├── README.md                             # Sổ tay hướng dẫn bàn giao, Quick Start & đối soát tiêu chí DoD
├── AI_WORKLOG.md                         # Nhật ký phối hợp & thẩm định AI 8 phần theo chuẩn CyberSoft
├── Picture_24_Detail.png                 # Sơ đồ Kiến trúc Lineage DAG & WORM Store 3400x1600 (300 DPI)
├── Picture_24_Architecture.drawio        # Sơ đồ Kiến trúc 4 cột & luồng hoàn tác (Draw.io XML)
├── DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_24.docx # Báo cáo Word chuẩn CyberSoft
├── requirements.txt                      # Danh mục thư viện phụ thuộc (FastAPI, Pydantic v2, Pytest, Pillow...)
├── portal/                               # Giao diện Web Lineage Explorer (Single Page Application)
│   ├── index.html                        # Giao diện chính: DAG Visualizer, Release Manifest Inspector, Changelog
│   ├── styles.css                        # CSS Cyber-Dark, huy hiệu trạng thái và bảng thành phần
│   └── app.js                            # Logic client-side: Gọi API, lọc tức thì, truy vết nguồn gốc, deprecate
├── src/                                  # Mã nguồn backend FastAPI v1.0
│   ├── __init__.py
│   ├── main.py                           # Khởi tạo App FastAPI, mount /portal, CORS, timing, Error Handlers
│   ├── config.py                         # Cấu hình lưu trữ WORM, cổng 8000, danh mục phân loại hỗ trợ
│   ├── schemas/                          # Pydantic Schemas v2 chuẩn hóa
│   │   ├── __init__.py
│   │   ├── common.py                     # ErrorEnvelope, SuccessEnvelope, HealthResponse
│   │   ├── artifact.py                   # ArtifactMetadata, ArtifactType, VersionInfo, LifecycleState
│   │   ├── lineage.py                    # LineageNode, LineageEdge, LineageDAG, BacktraceResult
│   │   ├── manifest.py                   # ReleaseManifest, ReleaseComponent, ReleaseDiff, Changelog
│   │   └── lifecycle.py                  # DeprecateRequest, DeprecateResponse, RollbackPlan
│   ├── routes/                           # Các router RESTful v1.0
│   │   ├── __init__.py
│   │   ├── health.py                     # GET /health
│   │   ├── lineage.py                    # GET /lineage/dag, GET /lineage/trace/{id}, GET /lineage/artifacts
│   │   ├── releases.py                   # GET /releases/manifests, POST /releases/manifests, GET /releases/diff
│   │   ├── changelog.py                  # GET /releases/changelog
│   │   └── lifecycle.py                  # POST /artifacts/{id}/deprecate, POST /releases/rollback-plan
│   └── services/                         # Tầng nghiệp vụ xử lý logic và kiểm định
│       ├── __init__.py
│       ├── immutable_store.py            # WORM Storage: Kiểm soát SHA-256, chặn ghi đè (409 Conflict)
│       ├── lineage_engine.py             # Xây dựng DAG, thuật toán BFS/DFS truy vết nguồn gốc ngược
│       ├── manifest_builder.py           # Đóng gói Release Manifests, tính toán holistic checksum
│       ├── changelog_differ.py           # So sánh release diff và tự động sinh changelog
│       ├── deprecation_manager.py        # Máy trạng thái vòng đời, xử lý sunset date và cảnh báo hạ nguồn
│       └── rollback_planner.py           # Sinh kế hoạch hoàn tác và Rollback Note an toàn
├── data/                                 # Kho lưu trữ phân vùng bất biến (WORM Storage)
│   ├── artifacts/                        # 16 tài nguyên phân vùng theo {type}/{name}/{version}/
│   │   ├── datasets/                     # retail_sales (v1), hr_attendance (v1), churn (v1), chunks (v1, v1.1)
│   │   ├── prompts/                      # exercise_prompt (v1, v1.1), rag_tutor_prompt (v1)
│   │   ├── models/                       # bge_embedder (v1), gemini_flash (v1)
│   │   ├── indices/                      # faiss_retail (v1), bm25_chunks (v1), hybrid_rrf (v1.1)
│   │   ├── evaluations/                  # rag_eval_100 (v1), generator_eval (v1)
│   │   └── exercises/                    # approved_bank_20 (v1 - từ Ngày 23)
│   ├── releases/                         # Các bản phát hành chính thức
│   │   ├── release_manifest_v1.0.0.json  # Bản phát hành nền tảng (Baseline: 13 tài nguyên)
│   │   ├── release_manifest_v1.1.0.json  # Bản phát hành cải tiến (Current: 16 tài nguyên)
│   │   ├── rollback_note_v1.1.0_to_v1.0.0.md # Hướng dẫn hoàn tác chính thức
│   │   └── rollback_note_v1.1.0.json     # Kế hoạch hoàn tác dạng JSON
│   ├── lineage_graph.json                # Đồ thị phụ thuộc DAG hợp nhất toàn hệ thống
│   └── changelog.json                    # Nhật ký thay đổi máy đọc
├── scripts/                              # Công cụ và module tự động hóa
│   ├── run_server.py                     # Khởi chạy máy chủ FastAPI Uvicorn tại cổng 8000
│   ├── run_lineage_eval.py               # Đánh giá độc lập 5 tiêu chí DoD (Exit code 0)
│   ├── seed_lineage_store.py             # Nạp dữ liệu bất biến, tính mã băm SHA-256 và lập DAG
│   └── render_diagram.py                 # Kết xuất sơ đồ kiến trúc Picture_24_Detail.png (3400x1600, 300 DPI)
└── tests/                                # Bộ kiểm thử tích hợp Pytest (24/24 Tests PASS 100%)
    ├── __init__.py
    ├── conftest.py                       # TestClient fixture, fixtures dịch vụ
    ├── test_immutable_store.py           # Kiểm thử chính sách WORM: chặn ghi đè 409 Conflict (4 tests)
    ├── test_provenance_trace.py          # Kiểm thử thuật toán truy vết ngược về nguồn gốc (4 tests)
    ├── test_manifest_builder.py          # Kiểm thử tạo manifest, checksum và cấu trúc thành phần (4 tests)
    ├── test_changelog_differ.py          # Kiểm thử so sánh release diff và sinh changelog (3 tests)
    ├── test_deprecation_lifecycle.py     # Kiểm thử máy trạng thái vòng đời và deprecation (4 tests)
    ├── test_rollback_planner.py          # Kiểm thử tạo Rollback Note và checklist an toàn (2 tests)
    └── test_lineage_api.py               # Kiểm thử tích hợp toàn diện RESTful API endpoints (3 tests)
```

---

## 2. HƯỚNG DẪN THỰC THI & TRẢI NGHIỆM TRÊN TRÌNH DUYỆT WEB

### Bước 1: Khởi động máy chủ Lineage & Versioning System
Chạy lệnh từ PowerShell:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task24/scripts/run_server.py
```
Máy chủ khởi chạy thành công tại địa chỉ: **`http://localhost:8000`**

### Bước 2: Trải nghiệm Giao diện Web Lineage Explorer (SPA)
Mở trình duyệt Web (Chrome, Edge) và truy cập:
👉 **[http://localhost:8000/portal/](http://localhost:8000/portal/)** (hoặc trang chủ [http://localhost:8000/](http://localhost:8000/))

Tại giao diện Web Explorer, bạn có thể thực hiện đầy đủ 6 tác vụ:
1. **Khám phá Đồ Thị Nguồn Gốc (Lineage DAG)**: Duyệt các thẻ tài nguyên, lọc theo 6 nhóm (Dataset, Prompt, Model, Index, Evaluation, Exercise) hoặc theo trạng thái vòng đời (Active, Deprecated, Retired).
2. **Truy Vết Nguồn Gốc Bài Tập (Provenance Backtrace)**: Bấm nút **`🎯 Truy Vết Nguồn Gốc Bài Tập (DoD)`** trên thanh công cụ để mở hộp thoại phân tích chi tiết: Hệ thống hiển thị 4 Dataset nguồn, 1 Model LLM, 1 Prompt template và 11 tuyến đường dẫn nhân quả ngược về nguồn.
3. **Kiểm Tra Bản Đồ Phát Hành (Release Manifests)**: Chuyển sang Tab *Bản Đồ Phát Hành*, đối chiếu giữa `v1.0.0` (13 components) và `v1.1.0` (16 components) kèm mã kiểm tra toàn vẹn (holistic checksum).
4. **Theo Dõi Nhật Ký Thay Đổi (Changelog Timeline)**: Chuyển sang Tab *Nhật Ký Thay Đổi* để xem dòng thời gian các hạng mục Thêm Mới, Nâng Cấp và Deprecate kèm cảnh báo chuyển đổi.
5. **Thực Nghiệm Chuyển Đổi Vòng Đời & Deprecation**: Chuyển sang Tab *Quản Lý Vòng Đời*, chọn một tài nguyên đang Active, nhập lý do, chỉ định phiên bản thay thế và ngày hết hạn -> Bấm Deprecate để hệ thống hiển thị phân tích rủi ro và các nút con hạ nguồn bị ảnh hưởng.
6. **Xem Hướng Dẫn Hoàn Tác (Rollback Note)**: Chuyển sang Tab *Hướng Dẫn Hoàn Tác* để xem quy trình khôi phục an toàn từ `v1.1.0` về `v1.0.0` (tuân thủ nguyên tắc: 0 từ cấm).

---

## 3. LỆNH KIỂM THỬ ĐỘC LẬP & ĐỐI SOÁT TIÊU CHÍ DoD

### 3.1. Chạy Bộ Đánh Giá Độc Lập DoD
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task24/scripts/run_lineage_eval.py
```
**Kết quả thực tế**:
- 5/5 bước kiểm thử đạt chuẩn 100%.
- BƯỚC 1: Truy vết 100% thành công về tận gốc dữ liệu, model và prompt.
- BƯỚC 2: Chính sách WORM hoạt động hoàn hảo, chặn tuyệt đối việc ghi đè (HTTP 409).
- BƯỚC 3: Quy trình deprecation đầy đủ lý do, ngày hết hạn và cảnh báo hạ nguồn.
- BƯỚC 4: Release Manifests v1.0.0 & v1.1.0 chuẩn xác, băm toàn vẹn hoàn chỉnh.
- BƯỚC 5: Hướng dẫn hoàn tác đầy đủ, rõ ràng, không chứa từ cấm.
- **Exit Code**: `0`

### 3.2. Chạy Bộ Kiểm Thử Tự Động Pytest
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task24/tests/ -v
```
**Kết quả thực tế**:
- **24/24 tests PASS 100%** trong **0.96 giây**.
- 0 lỗi, 0 cảnh báo.

---

## 4. BẢNG ĐỐI SOÁT TIÊU CHÍ NGHIỆM THU (DoD COMPLIANCE MATRIX)

| Tiêu Chí Nghiệm Thu (DoD) | Yêu Cầu Kế Hoạch | Kết Quả Thực Tế Đạt Được | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **Truy vết ngược được tới nguồn** | Một kết quả truy vết ngược được tới nguồn gốc sinh ra nó | Truy vết thành công bài tập `approved_bank_20` về 4 Datasets, Model LLM, Prompt template qua 11 đường dẫn | **ĐẠT (100%)** |
| **Không ghi đè artifact cũ** | Bất biến (WORM), cấm tuyệt đối ghi đè | WORM Storage chặn 100% việc ghi đè tệp cũ với mã lỗi HTTP 409 `IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED` | **ĐẠT (100%)** |
| **Có quy trình deprecate** | Máy trạng thái vòng đời có deprecate | Thiết lập máy trạng thái `DRAFT` $\rightarrow$ `ACTIVE` $\rightarrow$ `DEPRECATED` $\rightarrow$ `RETIRED` kèm sunset date | **ĐẠT (100%)** |
| **Bàn giao Release manifest** | Bản đồ phát hành hoàn chỉnh | Bàn giao `release_manifest_v1.0.0.json` (13 comps) và `release_manifest_v1.1.0.json` (16 comps) | **ĐẠT (100%)** |
| **Bàn giao Lineage view** | Giao diện hiển thị nguồn gốc | Bàn giao Web Lineage Explorer SPA tương tác + RESTful API DAG traversal | **ĐẠT (100%)** |
| **Bàn giao Rollback note** | Hướng dẫn hoàn tác an toàn | Bàn giao `rollback_note_v1.1.0_to_v1.0.0.md` & `.json` (4 bước thực thi, 0 từ cấm) | **ĐẠT (100%)** |
| **Kiểm thử tự động** | Kiểm thử độc lập & Pytest | 24/24 Pytest tests PASS 100%, CLI evaluation đạt Exit Code 0 | **ĐẠT (100%)** |
