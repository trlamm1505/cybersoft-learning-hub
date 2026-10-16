# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 24
## THEO DÕI NGUỒN GỐC DỮ LIỆU & QUẢN LÝ PHIÊN BẢN (LINEAGE & WORM STORE v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 24 — Theo dõi lineage và phiên bản (`cybersoft-lineage-tracker`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-02  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task24/` chứa toàn bộ giải pháp quản lý nguồn gốc dữ liệu (Data Lineage DAG), Cửa hàng lưu trữ bất biến (WORM Storage), Bản đồ phát hành (Release Manifests v1.0.0 & v1.1.0), Nhật ký thay đổi tự động (Changelog Differ), Máy trạng thái vòng đời (Deprecation) và Hướng dẫn hoàn tác an toàn (Rollback Note):

```text
BaoCao_Task24/
├── 24_lineage_and_versioning.md           # Bản đặc tả kỹ thuật chi tiết toàn diện Task 24 (9 mục lớn)
├── README.md                             # Sổ tay hướng dẫn bàn giao, Swagger UI, Web Portal & đối soát DoD
├── AI_WORKLOG.md                         # Nhật ký phối hợp & thẩm định AI 6 phần theo chuẩn CyberSoft
├── Picture_24_Detail.png                 # Sơ đồ Kiến trúc 4 Cột Dọc & Đồ thị Lineage DAG (300 DPI Dark Theme)
├── requirements.txt                      # Danh mục thư viện phụ thuộc (FastAPI, Pydantic v2, Pytest, Pillow...)
├── portal/                               # Giao diện Web Lineage Explorer (Single Page Application)
│   ├── index.html                        # Giao diện chính: DAG Visualizer, Release Manifest Inspector, Changelog
│   ├── styles.css                        # CSS Cyber-Dark, huy hiệu trạng thái WORM và bảng thành phần
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
│       └── rollback_planner.py           # Sinh kế hoạch hoàn tác và Rollback Note an toàn (0 từ cấm)
├── data/                                 # Kho lưu trữ phân vùng bất biến (WORM Storage Layout)
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
│   │   ├── rollback_note_v1.1.0_to_v1.0.0.md # Hướng dẫn hoàn tác chính thức (0 từ cấm)
│   │   └── rollback_note_v1.1.0.json     # Kế hoạch hoàn tác dạng JSON
│   ├── lineage_graph.json                # Đồ thị phụ thuộc DAG hợp nhất toàn hệ thống (16 nút, 25 cạnh)
│   └── changelog.json                    # Nhật ký thay đổi máy đọc
├── scripts/                              # Công cụ và module tự động hóa
│   ├── run_server.py                     # Khởi chạy máy chủ FastAPI Uvicorn tại cổng 8000
│   ├── run_lineage_eval.py               # Đánh giá độc lập 5 tiêu chí DoD (Exit code 0)
│   ├── seed_lineage_store.py             # Nạp dữ liệu bất biến, tính mã băm SHA-256 và lập DAG
│   └── render_diagram.py                 # Script tạo sơ đồ kiến trúc
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

## 3. HƯỚNG DẪN TEST TỪNG ENDPOINT TRÊN SWAGGER UI

Mở trình duyệt truy cập tài liệu tương tác Swagger UI tại:  
👉 **[http://localhost:8000/docs](http://localhost:8000/docs)** (Swagger UI)  
👉 **[http://localhost:8000/redoc](http://localhost:8000/redoc)** (ReDoc Specification)

### 1. `GET /health` (Kiểm tra trạng thái hệ thống)
- **Mục đích**: Xác thực dịch vụ Lineage & Versioning đang hoạt động bình thường.
- **Kết quả kỳ vọng**: HTTP `200 OK`, `{"status": "healthy", "service": "CyberSoft Lineage & Versioning System v0.1"}`.

### 2. `GET /api/v1/lineage/dag` (Lấy toàn bộ Đồ thị Lineage DAG)
- **Mục đích**: Trả về danh sách 16 nút tài nguyên và 25 cạnh quan hệ nhân quả.
- **Kết quả kỳ vọng**: HTTP `200 OK`, cấu trúc JSON gồm `nodes`, `edges`, `root_node_ids`, `leaf_node_ids`.

### 3. `GET /api/v1/lineage/trace/{artifact_id}` (Truy vết nguồn gốc ngược)
- **Mục đích**: Thực hiện thuật toán backtrace từ nút đích về tất cả các tài nguyên gốc.
- **Thử nghiệm**: Gọi với ID `exercise_approved_exercise_bank_20_v1.0.0`.
- **Kết quả kỳ vọng**: HTTP `200 OK`, xác định 4 Datasets gốc, 1 Model, 1 Prompt và 11 đường dẫn nhân quả.

### 4. `GET /api/v1/releases/manifests` (Lấy danh sách Release Manifests)
- **Mục đích**: Xem 2 bản phát hành chính thức `v1.0.0` (13 thành phần) và `v1.1.0` (16 thành phần) kèm mã băm toàn vẹn.
- **Kết quả kỳ vọng**: HTTP `200 OK`, trả về mảng các Release Manifests đã đóng gói.

### 5. `GET /api/v1/releases/diff` (So sánh sai khác giữa 2 bản phát hành)
- **Mục đích**: Tham số `from_version=v1.0.0&to_version=v1.1.0`, tự động tính toán khác biệt.
- **Kết quả kỳ vọng**: HTTP `200 OK`, phát hiện 3 tài nguyên thêm mới, 2 tài nguyên deprecate.

### 6. `GET /api/v1/releases/changelog` (Nhật ký thay đổi tự động)
- **Mục đích**: Lấy nội dung changelog phân loại (Added, Changed, Deprecated, Removed).
- **Kết quả kỳ vọng**: HTTP `200 OK`, cấu trúc JSON chứa đầy đủ lịch sử nâng cấp và cảnh báo chuyển đổi.

### 7. `POST /api/v1/artifacts/{artifact_id}/deprecate` (Chuyển trạng thái Deprecated)
- **Mục đích**: Thực thi máy trạng thái vòng đời an toàn trên kho WORM.
- **Kết quả kỳ vọng**: HTTP `200 OK`, cập nhật trạng thái kèm phân tích ảnh hưởng hạ nguồn (downstream impact).

### 8. `POST /api/v1/releases/rollback-plan` (Lập kế hoạch hoàn tác an toàn)
- **Mục đích**: Tạo quy trình 4 bước khôi phục từ `v1.1.0` về `v1.0.0` (0 từ cấm).
- **Kết quả kỳ vọng**: HTTP `200 OK`, trả về checklist an toàn và Rollback Note.

---

## 4. LỆNH KIỂM THỬ ĐỘC LẬP & ĐỐI SOÁT TIÊU CHÍ DoD

### 4.1. Chạy Bộ Đánh Giá Độc Lập DoD
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task24/scripts/run_lineage_eval.py
```
**Kết quả thực tế**:
- **5/5 bước kiểm thử đạt chuẩn 100%**.
- BƯỚC 1: Truy vết thành công 100% về tận gốc dữ liệu, model và prompt.
- BƯỚC 2: Chính sách WORM hoạt động hoàn hảo, chặn tuyệt đối việc ghi đè (HTTP 409).
- BƯỚC 3: Quy trình deprecation đầy đủ lý do, ngày hết hạn và cảnh báo hạ nguồn.
- BƯỚC 4: Release Manifests v1.0.0 & v1.1.0 chuẩn xác, băm toàn vẹn hoàn chỉnh.
- BƯỚC 5: Hướng dẫn hoàn tác đầy đủ, rõ ràng, không chứa từ cấm.
- **Exit Code**: `0`

### 4.2. Chạy Bộ Kiểm Thử Tự Động Pytest
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task24/tests/ -v
```
**Kết quả thực tế**:
- **24/24 tests PASS 100%** trong **0.96 giây**.
- 0 lỗi, 0 cảnh báo.

---

## 5. BẢNG ĐỐI SOÁT TIÊU CHÍ NGHIỆM THU (DoD COMPLIANCE MATRIX)

| Tiêu Chí Nghiệm Thu (DoD) | Yêu Cầu Kế Hoạch | Kết Quả Thực Tế Đạt Được | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **Truy vết ngược được tới nguồn** | Một kết quả truy vết ngược được tới nguồn gốc sinh ra nó | Truy vết thành công bài tập `approved_bank_20` về 4 Datasets, Model LLM, Prompt template qua 11 đường dẫn | **ĐẠT (100%)** |
| **Không ghi đè artifact cũ** | Bất biến (WORM), cấm tuyệt đối ghi đè | WORM Storage chặn 100% việc ghi đè tệp cũ với mã lỗi HTTP 409 `IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED` | **ĐẠT (100%)** |
| **Có quy trình deprecate** | Máy trạng thái vòng đời có deprecate | Thiết lập máy trạng thái `DRAFT` $\rightarrow$ `ACTIVE` $\rightarrow$ `DEPRECATED` $\rightarrow$ `RETIRED` kèm sunset date | **ĐẠT (100%)** |
| **Bàn giao Release manifest** | Bản đồ phát hành hoàn chỉnh | Bàn giao `release_manifest_v1.0.0.json` (13 comps) và `release_manifest_v1.1.0.json` (16 comps) | **ĐẠT (100%)** |
| **Bàn giao Lineage view** | Giao diện hiển thị nguồn gốc | Bàn giao Web Lineage Explorer SPA tương tác + RESTful API DAG traversal | **ĐẠT (100%)** |
| **Bàn giao Rollback note** | Hướng dẫn hoàn tác an toàn | Bàn giao `rollback_note_v1.1.0_to_v1.0.0.md` & `.json` (4 bước thực thi, 0 từ cấm) | **ĐẠT (100%)** |
| **Kiểm thử tự động** | Kiểm thử độc lập & Pytest | 24/24 Pytest tests PASS 100%, CLI evaluation đạt Exit Code 0 | **ĐẠT (100%)** |

---

## 6. SỐ LIỆU ĐỊNH LƯỢNG & ĐỘ ĐO CHẤT LƯỢNG (METRICS & TEST RESULTS)

- **Tổng Số Tài Nguyên Quản Lý Bất Biến (WORM Artifacts)**: Đạt **16 tài nguyên** được phân vùng theo 6 loại: 5 Datasets, 3 Prompts, 2 Models, 3 Indices, 2 Evaluations, 1 Exercise Bank.
- **Tỷ Lệ Truy Vết Ngược Thành Công Về Gốc (Provenance Traceability)**: Đạt **100.0%** (Từ `approved_bank_20` truy ngược về đúng 4 bộ dữ liệu nguồn, mô hình LLM và prompt template qua 11 tuyến đường dẫn độc lập).
- **Tỷ Lệ Chặn Ghi Đè Artifact Trái Phép (WORM Enforcement Rate)**: Đạt **100.0%** với mã HTTP 409 Conflict và phong bì lỗi đồng nhất `IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED`.
- **Số Bản Phát Hành Chính Thức Được Đóng Gói**: Đạt **2 Release Manifests** chuẩn hóa (Baseline v1.0.0 với 13 thành phần và Enhanced v1.1.0 với 16 thành phần) kèm mã băm toàn vẹn SHA-256 xác định.
- **Độ Sâu Đồ Thị Nhân Quả Tối Đa (Max DAG Lineage Depth)**: Đạt độ sâu **2 cấp**, phản ánh đúng luồng dẫn xuất từ dữ liệu thô qua mô hình trung gian đến sản phẩm học liệu cuối cùng.
- **Tỷ Lệ Phát Hiện Khác Biệt & Cảnh Báo Deprecate Tự Động**: Đạt **100.0%** (Tự động phát hiện 3 tài nguyên thêm mới, 2 tài nguyên deprecate và cảnh báo toàn bộ các nút con bị ảnh hưởng).
- **Tỷ Lệ Bao Phủ Kiểm Thử Tự Động (Pytest Coverage)**: Đạt **24/24 bài test PASS 100%** trong **0.96 giây**.
- **Chi Phí Vận Hành & Bản Quyền**: Đạt **$0.00 USD tuyệt đối** nhờ giải pháp lưu trữ WORM và thuật toán đồ thị chạy On-premise offline hoàn toàn.

---

## 7. DIỄN GIẢI KIẾN TRÚC 4 CỘT & ĐỒ THỊ NHÂN QUẢ LINEAGE DAG

Sơ đồ kiến trúc `Picture_24_Detail.png` được tổ chức chuẩn theo **4 Cột Dọc đứng song song** với tiêu đề ghim ở đỉnh từng cột:

1. **Cột 1: Dữ Liệu Nguồn Gốc (Root Datasets)**:
   - Chứa các bộ dữ liệu gốc chuẩn hóa: Retail Sales 3NF (v1), HR Attendance 3NF (v1), Customer Churn (v1), AI Chunks Corpus (v1 Deprecated) và AI Chunks Multi-Hop (v1.1 Active).
2. **Cột 2: Chỉ Dẫn Prompt & Mô Hình AI (Prompts & Models)**:
   - Chứa BGE Small English Embedder (v1), Gemini 3.8 Flash Checkpoint (v1), Exercise Generator Prompt (v1 Deprecated, v1.1 Active) và RAG Tutor Grounding Prompt (v1).
3. **Cột 3: Chỉ Mục & Đánh Giá Chất Lượng (Indices & Evaluations)**:
   - Chứa BM25 Index (v1), FAISS Retail Index (v1), Hybrid RAG Search Index (v1.1), Generator Feasibility Eval (v1) và RAG Benchmark 100 Eval (v1).
4. **Cột 4: Học Liệu & Bản Phát Hành (Deliverables, Releases & Governance)**:
   - Trung tâm là **🎯 Approved Exercise Bank 20** (20 bài tập thực hành sư phạm đã qua Giảng viên duyệt), cùng các khối quản trị: Release Manifest v1.0.0, Release Manifest v1.1.0, Hướng Dẫn Hoàn Tác An Toàn (Rollback Note) và Máy Trạng Thái Vòng Đời WORM.

Mọi đường kết nối mũi tên trên sơ đồ đều có nhãn giải thích trực tiếp (schema dữ liệu truyền đi, vector hóa ra sao, kiểm thử sandbox thế nào và đóng gói manifest ra sao), giúp hệ thống minh bạch và giải trình được 100%.
