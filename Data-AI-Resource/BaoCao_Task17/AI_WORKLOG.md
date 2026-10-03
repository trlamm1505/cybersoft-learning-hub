# AI WORK LOG — NGÀY 17: RETRIEVER BASELINE & VECTOR INDEX (`cybersoft-rag-retriever-baseline`)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-23  
**Task ID**: `#DAY-17-RETRIEVER-BASELINE-VECTOR-INDEX`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### 1.1. Bối Cảnh Nghiệp Vụ & Yêu Cầu Kỹ Thuật Ban Đầu
* **Mục tiêu**: Sau khi hoàn thành Task 16 (Đường ống Ingestion và phân đoạn thành công 91 chunks chuẩn hóa), nhiệm vụ của Data & AI Resource Engineer ở Ngày 17 là xây dựng lớp hạ tầng truy xuất cốt lõi: **Động cơ truy xuất ngữ nghĩa cơ sở (Retriever Baseline)** và **Chỉ mục Vector nén (Vector Index Artifact)** cho toàn bộ kho tài liệu quy chế đào tạo, sổ tay sinh viên và lộ trình học tập của CyberSoft Academy.
* **Mối liên kết chuỗi giá trị trong lộ trình 30 ngày**:
  - Kế thừa trực tiếp 91 chunks chuẩn hóa theo chiến lược Markdown Header-Aware từ **Task 16** (`BaoCao_Task16/output/chunks_markdown_header_semantic.jsonl`).
  - Thiết lập không gian vector dense $L_2$-normalized và chỉ mục ma trận vector Flat Cosine phục vụ tìm kiếm Top-K với độ trễ siêu tốc (< 5ms).
  - Chuẩn hóa cấu trúc trích nguồn (Citation Metadata Lineage DTO) bảo đảm 100% kết quả truy xuất đều gắn liền với `document_id`, `section_id`, `title`, `breadcrumbs`, và `file_path`.
  - Cung cấp điểm mốc đo lường cơ sở (Baseline Metrics) đáng tin cậy để đối chứng trực tiếp với **Task 18** (Hybrid search BM25 + Dense RRF & Reranking), **Task 19** (AI Tutor có trích nguồn và từ chối trả lời), và **Task 20** (RAG Evaluation Harness).
* **Tiêu chí nghiệm thu cốt lõi (Acceptance Criteria / DoD)**:
  1. **Có Top-K và Citation Metadata**: Mọi kết quả tìm kiếm phải trả về danh sách Top-K kèm điểm tương đồng và siêu dữ liệu trích dẫn nguồn gốc chi tiết.
  2. **Recall@5 được báo cáo trung thực**: Đo lường Recall@5 trên tập kiểm thử độc lập (Test Split), không rò rỉ dữ liệu (Zero Data Leakage).
  3. **Tách Train/Dev/Test rõ ràng**: Bộ dữ liệu đánh giá 30 câu hỏi thực tế phải phân chia tách bạch giữa tập tinh chỉnh (Train: 10 queries) và tập kiểm thử nghiệm thu (Test: 20 queries).
  4. **Bàn giao Retriever API & Index Artifact**: Cung cấp RESTful Search API qua FastAPI, đóng gói chỉ mục `.npz` và kê khai toàn vẹn SHA-256 trong `index_manifest.json`.
  5. **Tuyệt đối không hardcode đường dẫn cá nhân (Zero Hardcoded Paths)**: 100% mã nguồn sử dụng `pathlib.Path` tương đối, bảo đảm tính di động trên mọi môi trường CI/CD.
  6. **Kiểm thử tự động & Báo cáo chính thức**: Bộ kiểm thử Pytest 20/20 tests PASS 100%, kịch bản demo 4 giai đoạn đạt Exit Code 0, sơ đồ kiến trúc 300 DPI và Báo cáo Word Ngay_17.docx.

### 1.2. Rủi Ro Dự Kiến & Bẫy AI Thường Gặp (Pre-Emptive Trap Analysis)
Trước khi đưa chỉ dẫn vào các mô hình AI, kỹ sư con người đã dự báo và thiết lập chốt chặn phòng ngừa 8 cạm bẫy kỹ thuật điển hình:
1. **Bẫy Phụ Thuộc API Embedding Đóng Phí Ngoài (External API Dependency Trap)**: AI thường tự động đề xuất gọi API bên ngoài như `OpenAI text-embedding-3-small` hoặc kéo model hàng trăm MB từ HuggingFace. Việc này tiềm ẩn nguy cơ lộ API Key, phát sinh chi phí token, và làm gãy hoàn toàn quy trình CI/CD khi chạy offline hoặc môi trường mạng nội bộ bảo mật.
2. **Bẫy Đo Lường Tự Sướng và Rò Rỉ Dữ Liệu (Self-Serving Measurement & Data Leakage Trap)**: AI thường tạo một danh sách câu hỏi kiểm tra rồi chạy đánh giá trực tiếp trên chính những câu đó mà không phân chia tập huấn luyện/kiểm thử. Việc này gây ra hiện tượng rò rỉ dữ liệu (Data Leakage), dẫn đến các báo cáo số liệu ảo, không phản ánh đúng năng lực truy xuất thực tế.
3. **Bẫy Bỏ Quên Siêu Dữ Liệu Trích Nguồn (Citation Metadata Omission Trap)**: Khi trả về kết quả tìm kiếm, AI thường chỉ trả về chuỗi văn bản thuần túy (`text`) và điểm số (`score`), bỏ qua thông tin phân cấp tiêu đề `breadcrumbs`, mã điều khoản `section_id` và vị trí ký tự. Điều này khiến các tác vụ sinh có trích nguồn (Grounded Generation) ở Ngày 18–19 không thể truy vết được nguồn gốc tài liệu.
4. **Bẫy Vector Không Chuẩn Hóa $L_2$ (Unnormalized Vector Cosine Trap)**: AI thường dùng tích vô hướng `np.dot(q, d)` để tính độ tương đồng nhưng lại quên chuẩn hóa vector về độ dài đơn vị ($\|v\|_2 = 1.0$). Khi đó, các đoạn văn dài có tổng trọng số lớn sẽ luôn bị ưu tiên sai lệch so với các đoạn văn ngắn chứa đúng từ khóa.
5. **Bẫy Chỉ Mục Tạm Thời Trên Bộ Nhớ RAM (Transient In-Memory Index Trap)**: AI thường khởi tạo vector trong một biến danh sách Python tạm thời và không xây dựng cơ chế tuần tự hóa (Serialization) lưu trữ ra đĩa. Mỗi lần khởi động lại server hoặc chạy CLI phải huấn luyện lại từ đầu, vi phạm tiêu chí bàn giao Index Artifact của DoD.
6. **Bẫy Chỉ Vector Hóa Thân Văn Bản Bỏ Quên Tiêu Đề (Orphan Text Vectorization Trap)**: AI chỉ đưa trường `chunk["text"]` vào bộ vectorizer mà không làm giàu thêm tiêu đề tài liệu (`title`) và cây phân cấp (`breadcrumbs`). Khi học viên hỏi câu hỏi chung chung về chính sách, chunk con chứa điều khoản chi tiết không được kích hoạt do không có từ khóa cha.
7. **Bẫy Lỗi Mã Hóa Tiếng Việt Trên Console Windows (Windows UnicodeEncodeError Trap)**: Môi trường Windows PowerShell mặc định sử dụng bảng mã `cp1252`, khi terminal in các ký tự tiếng Việt có dấu sẽ ném ngoại lệ `UnicodeEncodeError` làm crash script.
8. **Bẫy Hardcode Đường Dẫn Máy Cá Nhân (Hardcoded Workstation Path Trap)**: AI thường viết sẵn các đường dẫn tuyệt đối như `C:\Users\Admin\...` hoặc `d:\Cybersoft\...` vào file code, phá vỡ tính di động của kho mã nguồn.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Vai trò giả định (Persona)**: Lead RAG Architect & Data Resource Engineer tại CyberSoft Academy.
* **Mục tiêu**: Xây dựng trọn vẹn giải pháp Vector Retriever Baseline v1.0, bao gồm động cơ nhúng ngữ nghĩa chuẩn hóa $L_2$, chỉ mục vector Flat Cosine với artifact `.npz`, RESTful Search API qua FastAPI, bộ đánh giá IR với 30 câu hỏi thực tế có Train/Test Split, bộ kiểm thử Pytest 20/20 tests và kịch bản demo 4 giai đoạn.

### Context & Prompt Chính Đã Sử Dụng:
```text
Bạn là Lead RAG Architect & Data Resource Engineer tại CyberSoft Academy.
Bối cảnh: Triển khai NGÀY 17 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Retriever baseline và chỉ mục vector (CyberSoft RAG Retriever Baseline v1.0)
kế thừa từ 91 chunks chuẩn hóa của Task 16 trong Tuần 4 (RAG và AI Tutor).

Yêu cầu kỹ thuật chi tiết:
1. Xây dựng src/embeddings.py:
   - Triển khai EmbeddingEngine thuần Python chuẩn hóa L2 (||v||_2 = 1.0).
   - Kết hợp n-gram TF-IDF (1, 2) sublinear TF và TruncatedSVD chiều sâu 64 components.
   - Đảm bảo 100% offline, deterministic, sub-millisecond latency, không phụ thuộc external API.
2. Xây dựng src/vector_index.py:
   - Lưu trữ ma trận vector (N, D) và danh sách metadata.
   - Tính toán Cosine Similarity siêu tốc qua phép nhân tích vô hướng np.dot().
   - Hỗ trợ lọc điều kiện (Metadata Filtering theo category và document_id).
   - Đóng gói artifact nén vector_index.npz và index_manifest.json kèm mã băm SHA-256.
3. Xây dựng src/retriever.py:
   - Triển khai BaselineRetriever kết nối EmbeddingEngine và VectorIndex.
   - Trả về cấu trúc SearchResult chứa trọn vẹn Citation metadata DTO (document_id, section_id,
     title, breadcrumbs, file_path, char_start/end).
4. Xây dựng src/api.py:
   - Xây dựng FastAPI app chuẩn Pydantic DTO: POST /api/v1/search, GET /api/v1/health, GET /api/v1/stats.
5. Xây dựng data/eval/retrieval_eval_queries.json & src/evaluator.py:
   - Xây dựng 30 câu hỏi thực tế bao quát 4 nhóm POL, TEC, CRS, FAQ có nhãn ground-truth chính xác.
   - Phân tách nghiêm ngặt 10 câu Train và 20 câu Test để tránh rò rỉ dữ liệu (Zero Data Leakage).
   - Đo lường Recall@1, Recall@3, Recall@5, Doc-Recall@5, MRR và Latency percentiles (p50/p90/p95).
   - Xuất bản reports/retrieval_baseline_report.md và reports/retrieval_baseline_metrics.json.
6. Xây dựng scripts/ và tests/:
   - build_index.py, run_evaluation.py, run_api.py, demo_day17_workflow.py (4 giai đoạn đạt Exit Code 0).
   - Bộ kiểm thử tự động Pytest 20/20 tests PASS 100% trong dưới 4 giây, audit Zero Hardcoded Personal Paths.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động rà soát mã nguồn, phát hiện các điểm thiếu sót kỹ thuật và đưa ra các quyết định điều chỉnh dứt khoát:

| Đề xuất Ban Đầu của AI | Vấn Đề / Rủi Ro Phát Hiện Được | Quyết Định & Chỉnh Sửa của Con Người |
| :--- | :--- | :--- |
| **1. Đề xuất gọi OpenAI Embedding API (`text-embedding-3-small`) hoặc kéo mô hình nặng từ HuggingFace Hub.** | **Bẫy External Dependency & Network Bloat**: Tiềm ẩn rủi ro lộ API Key, phát sinh chi phí token, và làm sập tiến trình CI/CD khi môi trường kiểm thử bị ngắt mạng Internet. | **BÁC BỎ HOÀN TOÀN**. Tự xây dựng `EmbeddingEngine` cục bộ dựa trên n-gram TF-IDF và SVD dense basis với chuẩn hóa $L_2$. Tốc độ xử lý siêu tốc (< 3ms), 100% offline và hoàn toàn miễn phí. |
| **2. Chỉ vector hóa nội dung thân của chunk (`chunk["text"]`).** | **Bẫy Orphan Chunk Mất Ngữ Cảnh**: Chunk con chứa các quy định chi tiết nhưng không nhắc lại tên chính sách cha; các câu hỏi tổng quát của sinh viên không tìm thấy tài liệu liên quan. | **ÁP DỤNG SEMANTIC TEXT ENRICHMENT**: Ghép nối có cấu trúc `Title + Breadcrumbs + Text Body` trước khi vector hóa. Nâng tỷ lệ Recall@5 trên tập kiểm thử từ 25.0% lên **100.0%**. |
| **3. Đánh giá IR metrics trên toàn bộ tập dữ liệu gộp chung không chia split.** | **Bẫy Đo Lường Tự Sướng (Data Leakage Trap)**: Không phản ánh đúng năng lực tổng quát hóa của hệ thống, vi phạm trực tiếp tiêu chí nghiệm thu DoD về phân tách train/dev/test. | **PHÂN TÁCH MINH BẠCH TRAIN VÀ TEST SPLIT**: Chia 30 câu hỏi thành 10 câu Train (tinh chỉnh) và 20 câu Test (báo cáo chính thức). Báo cáo Recall@5: 100% và MRR: 0.9750 độc lập trên tập Test. |
| **4. Ban đầu AI đoán mò nhãn `target_chunk_id` trong tập câu hỏi dẫn đến sai lệch với kho chunks thực tế.** | **Lỗi Nhãn Ground-Truth Sai Lệch**: AI gán câu hỏi về chứng chỉ tốt nghiệp vào `CS-POL-005` (học bổng) thay vì `CS-POL-004` (tốt nghiệp), khiến điểm Recall đo được bị tụt vô cớ. | **ĐỐI SOÁT VÀ CHUẨN HÓA 100% GROUND-TRUTH**: Kỹ sư người viết script bóc tách toàn bộ 91 chunks thực tế trong `scratch_crs_faq.txt`, ánh xạ chính xác từng câu hỏi vào đúng chunk và tài liệu đích tương ứng. |
| **5. Tính Cosine Similarity bằng công thức phân số lặp đi lặp lại trong vòng lặp tìm kiếm.** | **Lãng Phí Tài Nguyên Tính Toán**: Việc tính căn bậc hai và chuẩn hóa vector của từng chunk ở mỗi lượt truy vấn làm tăng độ trễ p95 lên gấp 5 lần. | **TỐI ƯU HÓA MA TRẬN VECTOR $L_2$**: Chuẩn hóa toàn bộ ma trận vector kho dữ liệu trước khi lưu vào chỉ mục. Khi truy vấn, chỉ cần chuẩn hóa vector câu hỏi và thực hiện 1 phép nhân ma trận `np.dot()`. |
| **6. Trả về kết quả tìm kiếm chỉ gồm `chunk_id`, `score` và `text`.** | **Bẫy Thiếu Siêu Dữ Liệu Nguồn Gốc**: AI Tutor ở Ngày 19 không thể trích dẫn chính xác số điều, tên văn bản hay đường dẫn file gốc khi trả lời người học. | **BẮT BUỘC ĐÓNG GÓI CITATION METADATA DTO**: Thiết lập dataclass `Citation` lưu trọn vẹn `document_id`, `section_id`, `title`, `breadcrumbs`, `file_path`, `char_start/char_end` cho mọi kết quả Top-K. |
| **7. Lưu chỉ mục dạng danh sách Python thô trong bộ nhớ RAM.** | **Vi Phạm Tiêu Chí DoD Về Artifacts**: Khi tắt tiến trình server thì toàn bộ chỉ mục bị mất, không thể bàn giao độc lập cho các thành viên khác trong nhóm. | **ĐÓNG GÓI ARTIFACT NÉN VÀ BẢN KÊ KHAI SHA-256**: Xuất bản `indexes/vector_index.npz` (55 KB) và `indexes/index_manifest.json` có mã hash SHA-256 xác thực toàn vẹn dữ liệu. |
| **8. In trực tiếp chuỗi tiếng Việt có dấu ra màn hình Windows PowerShell gây lỗi mã hóa.** | **Lỗi Runtime UnicodeEncodeError**: Bảng mã mặc định cp1252 của Windows không hỗ trợ một số ký tự Unicode tiếng Việt. | **BỔ SUNG RECONFIGURE STDOUT**: Thêm cơ chế tự động cấu hình `sys.stdout.reconfigure(encoding='utf-8')` vào toàn bộ script CLI, bảo đảm tương thích đa nền tảng. |
| **9. Bài test `test_zero_hardcoded_paths.py` bị bắt lỗi chính nó do chứa chuỗi mẫu cấm trong mảng kiểm tra.** | **Lỗi False Positive Trong Kiểm Thử Tự Động**: Tệp kiểm thử quét chính nó và báo vi phạm chuỗi mẫu cấm được định nghĩa. | **CHUẨN HÓA REGEX VÀ PHẠM VI QUÉT**: Áp dụng biểu thức chính quy `(?:[c-zC-Z]:[\\/](?:users|Users)[\\/][a-zA-Z0-9_-]+[\\/])` quét các thư mục mã nguồn thực tế như đã thực hiện ở Task 16. |
| **10. Tự động chèn dòng `**Nhánh Git**: feature/data-ai-day17` vào các văn bản Markdown.** | **Lệch Chuẩn Trình Bày Hồ Sơ Bàn Giao**: Theo chuẩn mực thống nhất từ Task 01 đến Task 16, các văn bản Markdown nghiệp vụ không chứa thông tin nhánh git cá nhân. | **LOẠI BỎ TRIỆT ĐỂ DÒNG NHÁNH GIT**: Rà soát và loại bỏ toàn bộ thông tin nhánh git khỏi `README.md`, `17_retriever_baseline.md`, `AI_WORKLOG.md`. |
| **11. Chỉ hướng dẫn khởi chạy cổng API mà chưa cung cấp bản mẫu JSON demo cho người dùng thử nghiệm.** | **Trải Nghiệm Nghiệm Thu Chưa Tối Ưu**: Người dùng hoặc kiểm thử viên khi mở Swagger UI phải tự gõ thủ công cấu trúc JSON payload, dễ nhập sai kiểu dữ liệu hoặc thiếu trường citation. | **BỔ SUNG 5 BẢN MẪU DEMO VÀ HƯỚNG DẪN SWAGGER UI VÀO MD**: Đã cập nhật `README.md` (Mục 4.1-4.3) và `17_retriever_baseline.md` (Mục 6.4-6.6) với 5 bản mẫu payload chuẩn (Basic, Policy filter, Curriculum filter, Document ID filter, Min score) cùng cú pháp cURL và PowerShell chạy tức thì. |
| **12. Sơ đồ kiến trúc ban đầu vẽ dạng 5 cột song song dày đặc chữ, nhiều mũi tên chéo và thanh KPI rời rạc ở đáy gây rối mắt.** | **Bẫy Trực Quan Hóa Quá Tải & Khó Theo Dõi (Visual Clutter Trap)**: Luồng dữ liệu bị phân mảnh, mũi tên nhảy xiên chéo giữa các khối và thanh KPI tách rời khiến người xem khó nắm bắt được kiến trúc thực tế của hệ thống. | **TÁI THIẾT KẾ SƠ ĐỒ 3 TẦNG TỐI GIẢN (MINIMALIST 3-TIER ARCHITECTURE)**: Bác bỏ bố cục cũ, tái cấu trúc thành 3 tầng chức năng phân tách rõ ràng (Tier 1: Offline Indexing, Tier 2: Online FastAPI Service, Tier 3: Benchmark & Evaluation Harness), chuẩn hóa luồng dữ liệu 1 chiều (ngang từ trái qua phải, dọc thẳng đứng 90° từ trên xuống dưới), loại bỏ thanh KPI đáy và tích hợp trực tiếp metrics vào Tier 3, xuất bản `Picture_17_Detail.png` chuẩn 300 DPI sắc nét. |

---

## 4. Kiểm chứng Độc lập (Independent Verification Logs)

Toàn bộ hệ thống Retriever Baseline được kiểm chứng thực nghiệm độc lập thông qua dòng lệnh CLI, kịch bản workflow 4 giai đoạn và bộ kiểm thử tự động Pytest.

### 4.1. Kết Quả Chạy Kịch Bản Demo Toàn Diện (`demo_day17_workflow.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/scripts/demo_day17_workflow.py
```

**Nhật ký thực tế từ Terminal**:
```text
===========================================================================
  CYBERSOFT RAG RETRIEVER BASELINE — 4-PHASE VERIFICATION WORKFLOW
===========================================================================
[*] Base directory: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task17

===========================================================================
  PHASE 1: VECTOR INDEX BUILDING & ARTIFACT SERIALIZATION
===========================================================================
[*] Loaded 91 chunks from Task 16 output.
[Phase 1 Result] Indexed 91 vectors (dim=64).
[Phase 1 Result] SHA-256 Checksum: 7c157529e9e7b5d702ee4861db62627ce63bdf84e3ad9d55c8e5a052d0320ae5
[PASS] Phase 1: Vector Index & Artifact Serialization completed successfully!

===========================================================================
  PHASE 2: TOP-5 SEMANTIC SEARCH & CITATION LINEAGE
===========================================================================
[*] Query: 'Điều kiện để được xét công nhận tốt nghiệp chính thức tại CyberSoft?'
[*] Top-1 Chunk: CS-POL-004_hdr_000 (Score: 0.8678)
[*] Document ID: CS-POL-004
[*] Citation Title: Tiêu chuẩn tốt nghiệp và quy trình cấp chứng chỉ đào tạo
[*] Citation Breadcrumbs: # CS-POL-004: Tiêu chuẩn tốt nghiệp và quy trình cấp chứng chỉ đào tạo > ## SEC-POL-004-01: Điều kiện công nhận tốt nghiệp chính thức
[*] Citation Section: CS-POL-004-S01
[*] Text snippet: ## SEC-POL-004-01: Điều kiện công nhận tốt nghiệp chính thức

Học viên được công nhận tốt nghiệp khó...
[*] Filtered Search: 5 chunks matching category='Curriculum'
[PASS] Phase 2: Semantic Top-K Search and Citation Lineage verified 100%!

===========================================================================
  PHASE 3: IR BASELINE EVALUATION & DOD VERIFICATION
===========================================================================
[*] Evaluated on 20 test queries (Zero Data Leakage).
[*] Recall@1:     95.00%
[*] Recall@3:     100.00%
[*] Recall@5:     100.00%  (DoD Threshold: >= 70.0%)
[*] Doc-Recall@5: 100.00%
[*] MRR:          0.9750
[*] Median (p50): 4.04 ms (SLA: < 20.0 ms)
[PASS] Phase 3: IR Evaluation and DoD criteria successfully verified!

===========================================================================
  PHASE 4: REST API ENDPOINTS VERIFICATION (FASTAPI TESTCLIENT)
===========================================================================
[*] /api/v1/health -> Status: healthy, Vectors: 91
[*] /api/v1/stats -> Total Chunks: 91, Unique Docs: 23
[*] POST /api/v1/search -> Returned 3 chunks in 3.15 ms
    - First Hit: CS-POL-001_hdr_001 (Quy chế bảo lưu khóa học tại CyberSoft Academy)
[*] POST /api/v1/search (Empty Query) -> 422 Unprocessable Entity (Validation working)
[PASS] Phase 4: All REST API endpoints validated successfully!

===========================================================================
  ALL 4 PHASES COMPLETED WITH 100% SUCCESS — EXIT CODE 0
===========================================================================
```

### 4.2. Kết Quả Chạy Bộ Kiểm Thử Tự Động Pytest Suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/ -v
```

**Nhật ký thực tế từ Terminal**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\ADMIN\AppData\Local\Programs\Python\Python310\python.exe
cachedir: .pytest_cache
rootdir: D:\Cybersoft\Kien
plugins: anyio-4.14.2, Faker-40.38.0
collecting ... collected 20 items

cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_api.py::test_api_health_endpoint PASSED [  5%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_api.py::test_api_stats_endpoint PASSED [ 10%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_api.py::test_api_search_endpoint_success PASSED [ 15%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_api.py::test_api_search_validation_error PASSED [ 20%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_embeddings.py::test_embedding_fit_and_encode_shape PASSED [ 25%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_embeddings.py::test_embedding_l2_normalization PASSED [ 30%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_embeddings.py::test_embedding_deterministic_output PASSED [ 35%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_embeddings.py::test_embedding_save_and_load PASSED [ 40%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_evaluator.py::test_evaluator_metrics_calculation PASSED [ 45%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_evaluator.py::test_evaluator_split_filtering PASSED [ 50%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_evaluator.py::test_evaluator_markdown_report_generation PASSED [ 55%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_retriever.py::test_retriever_search_returns_citation PASSED [ 60%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_retriever.py::test_retriever_category_filter PASSED [ 65%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_retriever.py::test_retriever_empty_query PASSED [ 70%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_retriever.py::test_retriever_min_score_cutoff PASSED [ 75%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_vector_index.py::test_vector_index_add_and_len PASSED [ 80%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_vector_index.py::test_vector_index_cosine_search_ordering PASSED [ 85%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_vector_index.py::test_vector_index_metadata_filtering PASSED [ 90%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_vector_index.py::test_vector_index_save_load_npz PASSED [ 95%]
cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/test_zero_hardcoded_paths.py::test_zero_hardcoded_personal_paths PASSED [100%]

======================== 20 passed, 1 warning in 4.00s ========================
```

### 4.3. Kết Quả Chạy Đo Lường IR Baseline Thực Nghiệm (`run_evaluation.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/scripts/run_evaluation.py --split test
```

**Nhật ký thực tế từ Terminal**:
```text
===========================================================================
  CYBERSOFT RETRIEVAL BASELINE EVALUATOR — TASK 17 BENCHMARK
===========================================================================
[*] Indexes directory: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task17\indexes
[*] Evaluation split:  test (Top-K=5)
[*] Loading embedding model and vector index...
[+] Loaded index with 91 vectors, dimension=64.
[*] Running IR evaluation on 'test' set...

[+] Benchmark Evaluation Completed Successfully!
    - Total Queries:   20
    - Recall@1:        95.00%
    - Recall@3:        100.00%
    - Recall@5:        100.00%  <-- Core Acceptance DoD
    - Doc-Recall@5:    100.00%
    - MRR:             0.9750
    - Latency (p50):   2.67 ms
    - Latency (p95):   3.32 ms
    - Failures:        0 queries
    - Metrics JSON:    D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task17\reports\retrieval_baseline_metrics.json
    - Markdown Report: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task17\reports\retrieval_baseline_report.md
```

---

## 5. Bốn Tầng Năng lực AI theo chuẩn CyberSoft (Four AI Tiers)

| Tầng Năng Lực AI | Biểu Hiện Trong Quá Trình Thực Hiện Task 17 | Minh Chứng Kỹ Thuật Cụ Thể |
| :--- | :--- | :--- |
| **Tầng 1: Prompting & Context Ingestion** | Nạp toàn bộ 91 chunks chuẩn hóa từ Task 16, công thức toán học chuẩn hóa vector L2, phép đo Cosine Similarity và kiến trúc 3 tầng tối giản (Minimalist 3-Tier) vào LLM. | Prompt chi tiết phân vai Principal AI & Vector Search Architect; yêu cầu sinh mã nguồn mô-đun hóa cao, tách biệt rõ ràng giữa Embedding, Indexing, Retrieval và API serving. |
| **Tầng 2: Harness Engineering & Guardrails** | Xây dựng dàn khung kiểm soát chặt chẽ: DTO `CitationMetadata` bảo đảm mọi chunk trả về có đầy đủ bằng chứng nguồn gốc (`doc_id`, `section_id`, `score`, `text_preview`), cơ chế lọc metadata đa điều kiện và kiểm tra đường dẫn tuyệt đối cá nhân. | Bộ kiểm thử `test_retriever.py` bảo đảm 100% kết quả có citation; `test_zero_hardcoded_paths.py` quét toàn bộ codebase ngăn chặn rò rỉ đường dẫn cá nhân. |
| **Tầng 3: Evaluation & Ground-Truth Calibration** | Thiết lập bộ dữ liệu đánh giá 30 câu hỏi (10 Train / 20 Test) độc lập, bảo đảm không rò rỉ dữ liệu (Zero Data Leakage); đo lường các chỉ số IR chuẩn hóa: Recall@1, Recall@3, Recall@5, MRR và độ trễ truy xuất. | Báo cáo đánh giá thực nghiệm trên tập Test 20 câu hỏi đạt Recall@1: 95.0%, Recall@5: 100.0%, MRR: 0.9750, Latency trung vị p50: 2.67 ms (vượt xa chỉ tiêu SLA < 20 ms). |
| **Tầng 4: Autonomous AI-Native & System Integration** | Tự động hóa tuần hoàn vòng đời chỉ mục vector (Serialize sang `vector_index.npz` 55 KB kèm `index_manifest.json`), tích hợp REST API chuẩn OpenAPI qua FastAPI (`/api/v1/search`, `/health`, `/stats`). | Kịch bản `demo_retriever_workflow.py` chạy qua 4 giai đoạn tự động đạt Exit Code 0; bộ kiểm thử Pytest 20/20 tests PASS tuyệt đối trong 4.0 giây. |
