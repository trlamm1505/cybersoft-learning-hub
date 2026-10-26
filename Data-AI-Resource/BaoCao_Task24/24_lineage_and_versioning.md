# BÁO CÁO KỸ THUẬT CHUYÊN SÂU — NGÀY 24
## THEO DÕI NGUỒN GỐC DỮ LIỆU & QUẢN LÝ PHIÊN BẢN (LINEAGE & WORM STORE v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 24 — Theo dõi lineage và phiên bản (`cybersoft-lineage-tracker`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-02  

---

## 1. BỐI CẢNH, ĐẶT VẤN ĐỀ & MỤC TIÊU SẢN PHẨM HÓA

### 1.1. Bối cảnh kỹ thuật sau Ngày 23
Trải qua 23 ngày xây dựng hệ sinh thái Data & AI Resource, CyberSoft Data & AI Lab đã kiến tạo một kho tài nguyên học liệu số lượng lớn bao gồm:
1. Các bộ dữ liệu đa bảng 3NF chuẩn hóa: Bán lẻ (`retail_sales_v1`), Nhân sự chấm công (`hr_attendance_v1`), Dự báo rời bỏ (`customer_churn_v1`), Kho tri thức phân đoạn RAG (`ai_knowledge_chunks_v1`).
2. Các mẫu chỉ dẫn hệ thống (System Prompts): Bộ gợi ý sinh bài tập theo thang đo Bloom (`exercise_generator_prompt_v1`), Chỉ dẫn gia sư AI trích nguồn (`rag_tutor_prompt_v1`).
3. Các checkpoint mô hình & cấu hình Embedder: `bge-small-en-v1.5`, `gemini-3.8-flash`.
4. Các chỉ mục tìm kiếm: FAISS FlatIP, BM25 Okapi, Hybrid Search Reciprocal Rank Fusion (RRF).
5. Các bộ bài tập và đánh giá: Ngân hàng 20 bài tập thực hành sư phạm đã qua Giảng viên phê duyệt (`approved_exercise_bank_20`), Bộ đánh giá 100 câu hỏi RAG Benchmark (`eval_rag_benchmark_100`).

### 1.2. Thách thức cốt lõi (Core Challenges)
Khi bước sang Tuần 5 (Sản phẩm hóa), sự gia tăng tài nguyên dẫn tới 3 nguy cơ nghiêm trọng nếu không có hệ thống quản lý lineage tập trung:
- **Hiện tượng Mất dấu Nguồn gốc (Provenance Loss / Orphan Artifacts)**: Một bài tập hoặc một kết quả đánh giá không thể truy ngược về việc nó được sinh ra từ bộ dữ liệu nào, sử dụng prompt nào và mô hình AI phiên bản bao nhiêu.
- **Rủi ro Ghi đè Phá hủy (Destructive Overwrite)**: Khi kỹ sư cập nhật dữ liệu hoặc chỉnh sửa prompt, việc ghi đè lên tệp cũ sẽ phá vỡ tính tái lập (Reproducibility), làm sai lệch kết quả kiểm thử hồi quy của học viên.
- **Thiếu Quy trình Ngừng Hỗ Trợ (Uncontrolled Deprecation)**: Khi phát hành phiên bản mới, các thành phần cũ bị bỏ rơi mà không có cảnh báo thời hạn hết hạn (`sunset_date`), gây đổ vỡ cho các ứng dụng hạ nguồn.

### 1.3. Mục tiêu cam kết & Tiêu chí nghiệm thu (DoD)
- **Mục tiêu 1**: Thiết lập kho lưu trữ bất biến **Write-Once-Read-Many (WORM)**, đánh mã băm nội dung SHA-256 cho 100% tài nguyên; cấm tuyệt đối hành vi ghi đè artifact cũ (`409 Conflict - IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED`).
- **Mục tiêu 2**: Xây dựng **Đồ thị Nguồn gốc (Lineage DAG Engine)** liên kết đa chiều giữa Dataset, Prompt, Model, Index, Evaluation và Exercise, cho phép truy vết ngược ($100\%$ backtrace to source).
- **Mục tiêu 3**: Đóng gói các bản phát hành chính thức thông qua **Bản đồ Phát hành (Release Manifests v1.0.0 & v1.1.0)** kèm mã băm toàn vẹn (holistic checksum).
- **Mục tiêu 4**: Tự động so sánh sai khác (Changelog Differ) và hiển thị nhật ký phát hành phân loại rõ ràng (Added, Changed, Deprecated, Removed).
- **Mục tiêu 5**: Thiết lập **Máy trạng thái vòng đời (Lifecycle State Machine)** với quy trình Deprecate minh bạch và tài liệu **Hướng dẫn Hoàn tác (Rollback Note)** bảo đảm tính an toàn khi triển khai.

---

## 2. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống được thiết kế theo mô hình 4 cột kiến trúc kết hợp cơ chế lưu trữ phân vùng bất biến (WORM Storage Layout):

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        CYBERSOFT LINEAGE & ARTIFACT VERSIONING SYSTEM v0.1                             │
├─────────────────────┬───────────────────────┬──────────────────────────┬───────────────────────────────┤
│ CỘT 1: ROOT SOURCES │ CỘT 2: DERIVED ASSETS │ CỘT 3: DELIVERABLES      │ CỘT 4: RELEASES & GOVERNANCE  │
├─────────────────────┼───────────────────────┼──────────────────────────┼───────────────────────────────┤
│ • Retail Sales CSV  │ • BGE Small Embedder  │ • Approved Bank 20       │ • Release Manifest v1.0.0     │
│   (v1.0.0 - 3NF)    │   (v1.0.0 Checkpoint) │   (20 Bài tập đã duyệt)  │   (Baseline: 13 components)   │
│ • HR Attendance CSV │ • Gemini 3.8 Flash    │ • Exercise Eval Harness  │ • Release Manifest v1.1.0     │
│   (v1.0.0 - 3NF)    │   (LLM Checkpoint)    │   (Feasibility Sandbox)  │   (Enhanced: 16 components)   │
│ • Customer Churn    │ • Generator Prompt    │ • RAG Benchmark 100      │ • Rollback Note               │
│   (v1.0.0 Telecom)  │   (v1.0.0 -> v1.1.0)  │   (100 câu hỏi P@3: 94%) │   (v1.1.0 -> v1.0.0 Safe)     │
│ • Knowledge Chunks  │ • Hybrid RRF Index    │ • FAISS FlatIP Index     │ • Lifecycle State Machine     │
│   (v1.0.0 -> v1.1.0)│   (Dense + BM25)      │   (Vector Index Retail)  │   (Draft->Active->Deprecate)  │
└─────────────────────┴───────────────────────┴──────────────────────────┴───────────────────────────────┘
```

### 2.1. Cấu trúc lưu trữ Phân vùng Bất biến (WORM Directory Layout)
Toàn bộ tệp nội dung (payload) và tệp mô tả siêu dữ liệu (`metadata.json`) được phân chia thư mục nghiêm ngặt theo công thức:
```text
data/artifacts/{artifact_type}s/{artifact_name}/{version}/
├── {payload_filename}     # Tệp dữ liệu thô (CSV, JSON, TXT)
└── metadata.json          # Tệp định danh, mã băm SHA-256 và quan hệ nhân quả upstream
```

Quy tắc WORM:
1. Khi một tệp `metadata.json` đã tồn tại tại đường dẫn trên, máy chủ từ chối mọi yêu cầu ghi đè với mã lỗi HTTP 409 Conflict.
2. Mọi sự thay đổi dữ liệu hoặc cấu trúc bắt buộc phải tăng mã phiên bản Semantic Versioning (ví dụ: `v1.0.0` $\rightarrow$ `v1.1.0`).
3. Payload được lưu trực tiếp dưới dạng byte nhị phân để ngăn chặn hiện tượng đột biến ký tự xuống dòng trên Windows (`CRLF`) làm biến đổi mã băm SHA-256.

---

## 3. THIẾT KẾ ĐỒ THỊ NHÂN QUẢ & THUẬT TOÁN TRUY VẾT NGUỒN GỐC (PROVENANCE BACKTRACE)

### 3.1. Mô hình Đồ thị Nhân quả (Lineage DAG Model)
- **Node**: Đại diện cho một tài nguyên duy nhất, được định danh theo cú pháp: `{artifact_type}_{clean_name}_{version}`.
- **Edge**: Biểu diễn luồng dẫn xuất (causal derivation) từ `source` (thượng nguồn) đến `target` (hạ nguồn) với các quan hệ ngữ nghĩa:
  - `derived_from`: Dẫn xuất dữ liệu hoặc phiên bản mới từ phiên bản cũ.
  - `trained_on`: Mô hình được huấn luyện hoặc tinh chỉnh từ dữ liệu.
  - `indexed_from`: Chỉ mục tìm kiếm được xây dựng từ tập văn bản hoặc bảng dữ liệu.
  - `generated_with`: Học liệu được sinh ra có sự phối hợp giữa Prompt và LLM.
  - `evaluated_by`: Đánh giá chất lượng thực hiện trên một tài nguyên.

### 3.2. Thuật toán Truy vết Ngược Nguồn gốc (Provenance Backtrace Algorithm)
Để trả lời câu hỏi cốt lõi của DoD: *"Biết tài nguyên nào sinh từ dữ liệu/model/prompt nào"*, thuật toán duyệt đồ thị ngược được thiết kế kết hợp Breadth-First Search (BFS) để gom nhóm tổ tiên và Depth-First Search (DFS) để tìm toàn bộ các tuyến đường dẫn nhân quả:

```python
def trace_to_source(target_artifact_id: str) -> BacktraceResult:
    # 1. Duyệt ngược BFS tìm tập hợp tất cả tổ tiên (All Ancestors)
    # 2. Phân loại tổ tiên theo 5 nhóm: Datasets, Prompts, Models, Indices, Evaluations
    # 3. Định vị các nút gốc (Root Sources - Nút không có upstream)
    # 4. Duyệt đệ quy DFS truy xuất toàn bộ đường dẫn từ các nút gốc về nút đích
    # 5. Xác định độ sâu tối đa (Max Lineage Depth)
```

Kết quả thực nghiệm trên Ngân hàng 20 bài tập (`exercise_approved_exercise_bank_20_v1.0.0`):
- Truy vết thành công về **4 bộ dữ liệu gốc**: Retail Sales, HR Attendance, Customer Churn, Knowledge Chunks.
- Xác định chính xác **1 mô hình sinh**: `model_gemini_3.8_flash_checkpoint_v1.0.0`.
- Xác định chính xác **1 prompt chỉ dẫn**: `prompt_exercise_generator_system_prompt_v1.0.0`.
- Tổng cộng tìm thấy **11 tuyến đường dẫn nhân quả** độc lập với độ sâu đồ thị bằng 2.

### 3.3. Bảng Ma Trận Các Tuyến Mũi Tên Kết Nối Nhân Quả (Directed Causal Edges)
Mọi mũi tên trên sơ đồ kiến trúc `Picture_24_Detail.png` đều có hướng đi vật lý xác định và nhãn giải thích trực tiếp:

| STT | Nút Bắt Đầu (Source) | Nút Kết Thúc (Target) | Hướng Mũi Tên | Nhãn Hiển Thị (Label) | Giải Thích Quan Hệ Kiến Trúc |
| :-- | :--- | :--- | :--- | :--- | :--- |
| **01** | `ds_retail` (Cột 1) | `ex_bank` (Cột 4) | Cột 1 ➔ Cột 4 | `Schema bán lẻ 3NF` | Cung cấp cấu trúc bảng transactions, stores để sinh đề thi |
| **02** | `ds_hr` (Cột 1) | `ex_bank` (Cột 4) | Cột 1 ➔ Cột 4 | `Schema ca trực nhân sự` | Cung cấp lược đồ chấm công & ca kíp nhân sự để sinh đề thi |
| **03** | `ds_churn` (Cột 1) | `ex_bank` (Cột 4) | Cột 1 ➔ Cột 4 | `Schema viễn thông rời mạng` | Cung cấp lược đồ thuê bao viễn thông để sinh đề thi phân loại |
| **04** | `ds_chunks_v1` (Cột 1) | `ds_chunks_v2` (Cột 1) | Trên ➔ Dưới (Cột 1) | `Nâng cấp Multi-Hop` | Nâng cấp cấu trúc phân đoạn tri thức chống rò rỉ đáp án |
| **05** | `ds_chunks_v1` (Cột 1) | `idx_bm25` (Cột 3) | Cột 1 ➔ Cột 3 | `Chỉ mục từ khóa Sparse` | Xây dựng bộ chỉ mục BM25 Okapi từ phân đoạn tri thức v1 |
| **06** | `ds_chunks_v2` (Cột 1) | `idx_hybrid` (Cột 3) | Cột 1 ➔ Cột 3 | `Chỉ mục tri thức đa bước` | Cung cấp phân đoạn nâng cao cho bộ chỉ mục tìm kiếm lai |
| **07** | `m_emb` (Cột 2) | `idx_faiss` (Cột 3) | Cột 2 ➔ Cột 3 | `Vector hóa 384 chiều Flat-IP` | Embedder tạo chỉ mục tương đồng vector cho bảng bán lẻ |
| **08** | `m_emb` (Cột 2) | `idx_hybrid` (Cột 3) | Cột 2 ➔ Cột 3 | `Vector hóa ngữ nghĩa Dense` | Embedder tạo vector dense cho tìm kiếm lai RRF |
| **09** | `p_gen_v1` (Cột 2) | `p_gen_v2` (Cột 2) | Trên ➔ Dưới (Cột 2) | `Bổ sung SQLite Sandbox` | Nâng cấp prompt sinh đề có quy chuẩn kiểm tra tính khả thi |
| **10** | `p_gen_v2` (Cột 2) | `ex_bank` (Cột 4) | Cột 2 ➔ Cột 4 | `Chỉ dẫn Few-shot sinh đề` | Định hình cấu trúc câu hỏi, test cases và thang đo Bloom |
| **11** | `m_llm` (Cột 2) | `ex_bank` (Cột 4) | Cột 2 ➔ Cột 4 | `LLM suy luận sinh 20 bài` | Gemini 3.8 Flash thực hiện suy luận sinh 20 bài tập thực hành |
| **12** | `p_tutor` (Cột 2) | `eval_rag` (Cột 3) | Cột 2 ➔ Cột 3 | `Chỉ dẫn chống ảo giác` | Chỉ dẫn trích nguồn làm tiêu chuẩn đối soát benchmark |
| **13** | `idx_hybrid` (Cột 3) | `eval_rag` (Cột 3) | Trên ➔ Dưới (Cột 3) | `Ngữ cảnh truy xuất đối soát` | Cung cấp top đoạn tri thức để kiểm tra độ chính xác RAG |
| **14** | `ex_bank` (Cột 4) | `eval_gen` (Cột 3) | Cột 4 ➔ Cột 3 (Ngược) | `Kiểm thử SQLite Sandbox` | Đưa 20 bài tập vào kiểm thử thực thi SQL in-memory (100% Pass) |
| **15** | `ex_bank` (Cột 4) | `rel_v10` (Cột 4) | Trên ➔ Dưới (Cột 4) | `Đóng gói Baseline v1.0.0` | Đưa 20 bài tập vào bản phát hành nền tảng v1.0.0 |
| **16** | `ex_bank` (Cột 4) | `rel_v11` (Cột 4) | Trên ➔ Dưới (Cột 4) | `Kế thừa Enhanced v1.1.0` | Duy trì bài tập đã duyệt trong bản nâng cao v1.1.0 |
| **17** | `rel_v11` (Cột 4) | `rollback` (Cột 4) | Trên ➔ Dưới (Cột 4) | `Kế hoạch hoàn tác an toàn` | Đường nét đứt (dashed): Quy trình khôi phục an toàn về v1.0.0 |
| **18** | `rel_v11` (Cột 4) | `lifecycle` (Cột 4) | Trên ➔ Dưới (Cột 4) | `Tuân thủ chính sách WORM` | Áp dụng máy trạng thái DRAFT ➔ ACTIVE ➔ DEPRECATED |

---

## 4. BẢN ĐỒ PHÁT HÀNH (RELEASE MANIFESTS) & MÃ BĂM TOÀN VẸN (HOLISTIC CHECKSUM)

### 4.1. Cấu trúc Release Manifest
Bản phát hành không phải là một tệp nén zip đơn thuần mà là một tài liệu JSON chuẩn mực quản lý toàn vẹn hệ sinh thái:
- `release_id`: Mã phát hành duy nhất (`rel_v1.0.0`, `rel_v1.1.0`).
- `version`: Chuẩn Semantic Versioning (`v1.0.0`, `v1.1.0`).
- `holistic_checksum`: Mã băm SHA-256 tổng hợp được tính toán theo giải thuật xác định (deterministic sorting) từ toàn bộ danh sách `(artifact_id, version, content_hash, state)` của các thành phần con.
- `components`: Bản đồ ánh xạ chi tiết từng thành phần, phiên bản và đường dẫn lưu trữ bất biến.

### 4.2. Bảng so sánh Bản phát hành v1.0.0 và v1.1.0
| Thuộc Tính | Bản Phát Hành Baseline (v1.0.0) | Bản Phát Hành Enhanced (v1.1.0) |
| :--- | :--- | :--- |
| **Mã Bản Phát Hành** | `rel_v1.0.0` | `rel_v1.1.0` |
| **Ngày Phát Hành** | 2026-09-29 | 2026-10-02 |
| **Số Lượng Thành Phần**| 13 tài nguyên | 16 tài nguyên |
| **Thành Phần Bổ Sung** | -- | `ds_chunks_v2`, `p_gen_v2`, `idx_hybrid_v2` |
| **Thành Phần Deprecated**| 0 tài nguyên | 2 tài nguyên (`ds_chunks_v1`, `p_gen_v1`) |
| **Mã Băm Toàn Vẹn** | `20577462c080d8cbdfa00d6d06cfe6dd...` | `fa096099dc46141c19c28d80755de74f...` |
| **Git Release Tag** | `v1.0.0-release` | `v1.1.0-release` |

---

## 5. NHẬT KÝ THAY ĐỔI TỰ ĐỘNG (AUTOMATED CHANGELOG GENERATOR)

Dịch vụ `ChangelogDiffer` tự động thực hiện phép trừ đại số giữa 2 Release Manifests để tạo ra báo cáo thay đổi phân loại:
1. **Added**: Danh sách các tài nguyên mới xuất hiện trong bản đích.
2. **Changed**: Danh sách các tài nguyên có sự thay đổi về phiên bản hoặc mã băm.
3. **Deprecated**: Danh sách tài nguyên chuyển từ `active` sang `deprecated`.
4. **Removed / Retired**: Danh sách tài nguyên bị ngừng hoạt động hoàn toàn.
5. **Breaking Changes**: Tự động cảnh báo các ứng dụng hạ nguồn về việc chuyển đổi trước ngày hết hạn.

---

## 6. MÁY TRẠNG THÁI VÒNG ĐỜI & QUY TRÌNH DEPRECATION (LIFECYCLE STATE MACHINE)

### 6.1. Sơ đồ Chuyển đổi Trạng thái
```text
[ DRAFT ] ────────► [ ACTIVE ] ────────► [ DEPRECATED ] ────────► [ RETIRED ]
                         │                                              ▲
                         └──────────────────────────────────────────────┘
                                  (Thu hồi khẩn cấp bảo mật)
```

### 6.2. Ràng buộc Nghiệp vụ khi Deprecate
Khi một tài nguyên chuyển sang trạng thái `DEPRECATED`:
1. **Không xóa payload**: Tệp nội dung vẫn tồn tại vĩnh viễn trên WORM store để bảo đảm các bài làm cũ của học viên vẫn chấm điểm được.
2. **Bắt buộc nhập lý do**: Giải thích rõ lý do kỹ thuật hoặc sư phạm.
3. **Chỉ định tài nguyên thay thế (`superseded_by`)**: Cung cấp mã định danh của phiên bản kế tiếp.
4. **Ấn định ngày hết hạn (`sunset_date`)**: Thời điểm tài nguyên sẽ chính thức chuyển sang `RETIRED`.
5. **Rà soát ảnh hưởng hạ nguồn (Impact Analysis)**: Hệ thống tự động quét đồ thị DAG và cảnh báo toàn bộ các node con đang phụ thuộc trực tiếp vào tài nguyên này.

---

## 7. HƯỚNG DẪN HOÀN TÁC AN TOÀN (SAFE ROLLBACK NOTE)

Nhờ chính sách lưu trữ bất biến (WORM), việc khôi phục về phiên bản trước đó (`v1.1.0` $\rightarrow$ `v1.0.0`) diễn ra an toàn và không gây mất mát dữ liệu:
- **Mức độ rủi ro**: `LOW` (Không có thao tác xóa vật lý).
- **Quy trình 4 bước thực thi**:
  1. Chuyển con trỏ định tuyến API Gateway & Route Registry từ `v1.1.0` về `v1.0.0`.
  2. Khôi phục con trỏ tri thức và chỉ mục tìm kiếm về phiên bản gốc.
  3. Cách ly 3 tài nguyên mới sinh (`ds_chunks_v2`, `p_gen_v2`, `idx_hybrid_v2`) về khu vực kiểm thử độc lập.
  4. Xóa bộ nhớ đệm (Flush Cache) và chạy kiểm thử hồi quy xác nhận độ chính xác.

---

## 8. KẾT QUẢ KIỂM THỬ TỰ ĐỘNG & BẰNG CHỨNG THỰC NGHIỆM

### 8.1. Kiểm thử Pytest Suite (24/24 Tests PASS 100%)
Bộ kiểm thử tích hợp tự động bao phủ trọn vẹn 7 module:
- `test_immutable_store.py`: 4 tests (Kiểm thử WORM, chặn ghi đè, kiểm tra SHA-256).
- `test_provenance_trace.py`: 4 tests (Kiểm thử truy vết nguồn gốc, phát hiện node gốc/lá, đường dẫn nhân quả).
- `test_manifest_builder.py`: 4 tests (Kiểm thử đóng gói manifest, tính mã băm toàn vẹn, chặn ghi đè manifest).
- `test_changelog_differ.py`: 3 tests (Kiểm thử phát hiện thêm mới, deprecate, sinh changelog entry).
- `test_deprecation_lifecycle.py`: 4 tests (Kiểm thử chuyển trạng thái, chặn chuyển đổi sai, cảnh báo hạ nguồn, tính bất biến payload).
- `test_rollback_planner.py`: 2 tests (Kiểm thử tạo bước hoàn tác, rà soát 0 từ cấm).
- `test_lineage_api.py`: 3 tests (Kiểm thử RESTful endpoints: GET DAG, GET Trace, POST Conflict 409).

Thời gian thực thi: **0.67 giây** trên môi trường máy trạm.

### 8.2. Kết quả Chạy CLI Evaluator (`run_lineage_eval.py`)
```text
==============================================================================
CYBERSOFT DATA & AI LAB — BỘ ĐÁNH GIÁ CHẤT LƯỢNG TASK 24
Chủ đề: Theo dõi Lineage và Phiên bản (Lineage & Versioning System v0.1)
==============================================================================
[BƯỚC 1/5] Kiểm tra Truy vết Nguồn gốc (Provenance Traceability)    -> [PASS]
[BƯỚC 2/5] Kiểm tra Tính Bất biến WORM & Khóa Ghi Đè                -> [PASS]
[BƯỚC 3/5] Kiểm tra Quy trình Deprecation & Máy Trạng Thái          -> [PASS]
[BƯỚC 4/5] Kiểm tra Bản đồ Phát hành (Release Manifests)             -> [PASS]
[BƯỚC 5/5] Kiểm tra Hướng dẫn Hoàn tác & Rà soát Từ Cấm            -> [PASS]
==============================================================================
TỔNG KẾT ĐÁNH GIÁ TASK 24: 5/5 BƯỚC ĐẠT CHUẨN (100% DoD) - EXIT CODE 0
==============================================================================
```

---

## 9. KẾT LUẬN & ĐỊNH HƯỚNG PHÁT TRIỂN TIẾP THEO

Hệ thống Theo dõi Lineage và Quản lý Phiên bản v0.1 đã giải quyết triệt để bài toán truy vết nguồn gốc học liệu và bảo vệ tính bất biến của tài nguyên AI. Đây là nền tảng cốt lõi phục vụ các hoạt động kiểm thử bảo mật dữ liệu riêng tư ở **Ngày 25** và tích hợp liên thông toàn diện với Learning Platform ở **Ngày 26**.
