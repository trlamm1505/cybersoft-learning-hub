# AI WORK LOG — NGÀY 16: INGEST VÀ CHUNKING PIPELINE (RAG INGESTION PIPELINE v1.0)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-22  
**Task ID**: `#DAY-16-RAG-INGESTION-CHUNKING-PIPELINE`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### 1.1. Bối Cảnh Nghiệp Vụ & Yêu Cầu Kỹ Thuật Ban Đầu
* **Mục tiêu**: Bước sang Tuần 4 (RAG và AI Tutor), nhiệm vụ của Data & AI Resource Engineer là xây dựng lớp hạ tầng đầu vào then chốt: **Đường ống nạp dữ liệu (Document Ingestion Pipeline)** và **Động cơ phân đoạn ngữ nghĩa (Semantic Chunking Engine)** cho toàn bộ kho tài liệu quy chế đào tạo, sổ tay sinh viên và lộ trình học tập của CyberSoft Academy.
* **Mối liên kết chuỗi giá trị trong lộ trình 30 ngày**:
  - Kế thừa tập ngữ liệu sạch gồm 20 tài liệu văn bản quy chế (`CS-POL`, `CS-TEC`, `CS-CRS`, `CS-FAQ`) từ **Task 08** (`RAG_corpus_v1`).
  - Mở rộng thêm các tài liệu mới phản ánh nghiệp vụ thực tế: Quy chế phòng thi trực tuyến (`CS-POL-006`), Sổ tay sinh viên Quickstart (`CS-TXT-001`), và Quy chế đào tạo thực chiến PDF mock (`CS-PDF-001`).
  - Tạo tiền đề dữ liệu chuẩn hóa trực tiếp cho các nhiệm vụ tiếp theo của Tuần 4: **Task 17** (Retriever baseline & Vector Index), **Task 18** (Hybrid search BM25 + Dense RRF & Reranking), **Task 19** (AI Tutor có trích nguồn và từ chối trả lời), và **Task 20** (RAG Evaluation Harness).
* **Tiêu chí nghiệm thu cốt lõi (Acceptance Criteria / DoD)**:
  1. **Khả năng phân giải đa định dạng (Multi-format Parsing)**: Nạp và bóc tách mượt mà Markdown (`.md`) kèm YAML Frontmatter, Plain Text (`.txt`), và tài liệu trích xuất từ PDF (`.pdf.txt`).
  2. **Thực nghiệm ít nhất 2 chiến lược phân đoạn (Multi-strategy Chunking)**: Cài đặt và đo lường so sánh định lượng tối thiểu 2 chiến lược (triển khai thực tế 3 chiến lược: Fixed-Size Overlap, Markdown Header-Aware Semantic, Sentence-Window Boundary).
  3. **Bảo tồn nguồn gốc & Siêu dữ liệu (Provenance & Lineage)**: Mỗi chunk lưu trọn vẹn `document_id`, `version`, `heading_hierarchy` (breadcrumbs), `section_id`, `char_start`, `char_end`, `token_count`, `content_hash`.
  4. **Bảo đảm tính lũy đẳng (Idempotency Guarantee)**: Chạy lại pipeline nhiều lần trên cùng một kho dữ liệu không tạo ra bản ghi trùng lặp (duplicate chunks), không làm tăng dung lượng chỉ mục vô cớ.
  5. **Cập nhật gia tăng qua Băm nội dung (Incremental Hashing)**: Sử dụng mã băm SHA-256 để phân loại tệp thành 4 trạng thái: `NEW`, `MODIFIED`, `UNCHANGED`, `DELETED`. Tự động bỏ qua (`SKIP`) các tệp `UNCHANGED`.
  6. **Cô lập lỗi và Nhật ký chuyên biệt (Fault Isolation & Error Logging)**: Khi gặp tệp hỏng, tệp rỗng, sai cú pháp YAML frontmatter hoặc mã hóa nhị phân, hệ thống ghi nhật ký chi tiết vào `logs/ingestion_errors.log` và tiếp tục vận hành an toàn.
  7. **Tuyệt đối không hard-code đường dẫn cá nhân (Zero Hardcoded Paths)**: 100% mã nguồn sử dụng `pathlib.Path` tương đối, bảo đảm tính di động trên mọi môi trường CI/CD.
  8. **Kiểm thử tự động & Báo cáo chính thức**: Bộ kiểm thử Pytest 16/16 tests PASS 100% trong dưới 1 giây, kịch bản demo 4 giai đoạn đạt Exit Code 0, ảnh kiến trúc 300 DPI và Báo cáo Word Ngay_16.docx.

### 1.2. Rủi Ro Dự Kiến & Bẫy AI Thường Gặp (Pre-Emptive Trap Analysis)
Trước khi đưa chỉ dẫn vào các mô hình AI, kỹ sư con người đã dự báo và thiết lập chốt chặn phòng ngừa 6 cạm bẫy kỹ thuật điển hình:
1. **Bẫy Kéo Thư Viện Nặng Ngoài Tiêu Chuẩn (LangChain / LlamaIndex Bloat Trap)**: AI thường tự động đề xuất cài đặt `langchain`, `llama-index`, `unstructured` để dùng sẵn các Document Loaders. Việc này kéo theo hàng chục dependencies nặng (>1.5 GB), làm chậm thời gian khởi động CI/CD, che giấu logic băm và làm mất quyền kiểm soát chi tiết tính lũy đẳng.
2. **Bẫy Cắt Cố Định Làm Rách Câu Văn Tiếng Việt (Naive Character Severing Trap)**: AI thường chỉ cắt cố định 500 ký tự với overlap 50 ký tự (`text[i:i+chunk_size]`). Việc này cắt ngang giữa từ hoặc giữa câu văn quy chế (ví dụ cắt đôi cụm từ `"Học viện CyberSoft"` thành `"Học vi"` và `"ện CyberSoft"`), phá hủy hoàn toàn vector ngữ nghĩa của mô hình embedding.
3. **Bẫy Mất Phân Cấp Tiêu Đề (Breadcrumbs Loss Trap)**: Khi phân đoạn Markdown theo tiêu đề, AI thường chỉ lưu nội dung section mà bỏ qua các tiêu đề cha H1, H2 phía trên. Chunk con rơi vào tình trạng "mất ngữ cảnh" (orphan chunk), khiến bước trích nguồn Citation ở Ngày 18–19 không thể xác định được điều khoản thuộc quy chế nào.
4. **Bẫy Phát Sinh Chunk Tiêu Đề Rỗng (Empty Header Chunk Trap)**: Khi tiêu đề H1 ở đầu tệp không có văn bản giới thiệu mà lập tức gặp tiêu đề H2 tiếp theo, thuật toán thô sơ của AI sẽ phát sinh một chunk rỗng chỉ chứa đúng dòng tiêu đề H1, làm loãng chỉ mục và lãng phí chi phí embedding.
5. **Bẫy Giả Lập Tính Lũy Đẳng Bằng Timestamp (mtime-based Fake Idempotency Trap)**: AI đề xuất kiểm tra file trùng chỉ dựa trên `file_path` và `file_mtime`. `mtime` rất dễ bị sai lệch khi checkout Git trên máy khác nhau hoặc khi chạy lệnh clone mới; không phát hiện được trường hợp nội dung file bị thay đổi nhưng timestamp giữ nguyên hoặc ngược lại.
6. **Bẫy Nuốt Lỗi Không Ghi Vết Khi Gặp Tệp Hỏng (Silent Exception Swallowing Trap)**: AI thường dùng `try...except: pass` hoặc để ngoại lệ văng ra tự do làm crash toàn bộ tiến trình nạp, vi phạm nghiêm trọng tiêu chuẩn vận hành sản xuất.
7. **Bẫy Hardcode Đường Dẫn Máy Cá Nhân (Hardcoded Workstation Path Trap)**: AI có thói quen viết sẵn các đường dẫn như `C:\Users\Admin\...` hoặc `d:\Cybersoft\...` vào file code và cấu hình, phá vỡ tính di động của kho mã nguồn.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Vai trò giả định (Persona)**: Lead RAG Architect & Data Resource Engineer tại CyberSoft Academy.
* **Mục tiêu**: Xây dựng trọn vẹn giải pháp Ingestion & Chunking Pipeline v1.0, bao gồm động cơ nạp đa định dạng thuần Python, 3 chiến lược chunking thực nghiệm, cơ chế băm SHA-256 State Store, bộ kiểm thử Pytest 16/16 tests và kịch bản demo 4 giai đoạn.

### Context & Prompt Chính Đã Sử Dụng:
```text
Bạn là Lead RAG Architect & Data Resource Engineer tại CyberSoft Academy.
Bối cảnh: Triển khai NGÀY 16 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Ingest và Chunking Pipeline (CyberSoft RAG Ingestion & Chunking Pipeline v1.0)
mở màn Tuần 4 (RAG và AI Tutor) cho toàn bộ kho tài liệu quy chế, sổ tay sinh viên và lộ trình đào tạo.

Yêu cầu kỹ thuật chi tiết:
1. Xây dựng src/loaders.py:
   - Nạp đa định dạng thuần Python không phụ thuộc thư viện ngoài: Markdown (.md) kèm YAML Frontmatter,
     Plain Text (.txt), và PDF trích xuất (.pdf.txt).
   - Tự động bóc tách metadata: document_id, title, category, version, char_offsets, content_hash SHA-256.
   - Cơ chế cô lập lỗi (Fault Isolation): bắt LoaderError, UnicodeDecodeError, empty files.
2. Xây dựng src/chunkers.py triển khai 3 chiến lược phân đoạn:
   - Strategy A: FixedSizeChunker (500 chars, 100 overlap).
   - Strategy B: MarkdownHeaderChunker (Header-Aware, bảo tồn H1-H3 Breadcrumbs, Section ID, không emit chunk rỗng).
   - Strategy C: SentenceWindowChunker (Cửa sổ trượt 3 câu / bước 2, bảo tồn ranh giới câu tiếng Việt).
   - Metadata enricher cho từng chunk: doc_id, section_id, version, breadcrumbs, char_start/end, token_count, content_hash.
3. Xây dựng src/hashing.py & src/pipeline.py:
   - SHA-256 content hashing chuẩn hóa ký tự kết thúc dòng.
   - StateStore (state_store.json) phân loại tệp: NEW, MODIFIED, UNCHANGED, DELETED.
   - Idempotency Guarantee: re-run trên cùng dữ liệu tự động SKIP 100% tệp UNCHANGED, phát sinh 0 duplicate chunks.
   - Tách biệt kênh log: logs/ingestion.log và logs/ingestion_errors.log.
   - Xuất bản output/chunks_markdown_header_semantic.jsonl và output/ingestion_manifest.json.
4. Xây dựng src/comparator.py:
   - Đo lường so sánh định lượng: tổng chunks, tokens trung bình/độ lệch chuẩn, header preservation rate,
     boundary integrity score, redundancy ratio, latency.
   - Xuất bản reports/chunk_comparison_report.md và reports/chunk_metrics.json.
5. Xây dựng scripts/ và tests/:
   - demo_day16_workflow.py (kịch bản 4 giai đoạn: Cold Start, Idempotency, Incremental, Fault Isolation - Exit Code 0).
   - run_ingestion.py, run_chunk_comparison.py.
   - Bộ kiểm thử tự động Pytest 16/16 tests PASS 100% trong dưới 1 giây, audit Zero Hardcoded Personal Paths.

```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động rà soát mã nguồn, đối chiếu nguyên lý kiến trúc phần mềm và đưa ra các quyết định điều chỉnh dứt khoát:

| Đề xuất Ban Đầu của AI | Vấn Đề / Rủi Ro Phát Hiện Được | Quyết Định & Chỉnh Sửa của Con Người |
| :--- | :--- | :--- |
| **1. Đề xuất cài đặt `langchain` và `unstructured` để dùng sẵn các Document Loaders.** | **Bẫy Dependency Bloat**: Kéo theo hàng chục thư viện nặng (>1.5 GB), làm chậm thời gian chạy CI/CD và làm mất quyền kiểm soát chi tiết tính lũy đẳng. | **BÁC BỎ HOÀN TOÀN**. Tự xây dựng bộ `loaders.py` thuần Python chuẩn gọn nhẹ, không phụ thuộc framework bên thứ ba, tốc độ xử lý nhanh gấp 10 lần và kiểm soát 100% logic metadata. |
| **2. Cắt đoạn văn bản cố định theo số ký tự (`FixedSizeChunker`) cho toàn bộ tài liệu.** | **Bẫy Xé Rách Câu Tiếng Việt**: Điểm cắt rơi ngẫu nhiên vào giữa câu văn quy chế, làm đứt gãy liên kết ngữ nghĩa giữa chủ ngữ và vị ngữ, phá hủy vector embedding. | **BỔ SUNG VÀ ƯU TIÊN STRATEGY B (HEADER-AWARE)**: Chỉ giữ fixed-size làm đối chứng; xây dựng `MarkdownHeaderChunker` bảo tồn trọn vẹn ranh giới điều khoản và `SentenceWindowChunker` bảo tồn ranh giới câu. |
| **3. Khi cắt Markdown theo tiêu đề, phát sinh một chunk rỗng chỉ chứa đúng dòng `# Title` đầu tệp.** | **Bẫy Empty Header Chunk**: Tiêu đề H1 không có văn bản giới thiệu mà gặp ngay H2, dẫn đến việc sinh ra chunk thừa không có nội dung, làm loãng chỉ mục vector. | **HIỆU CHỈNH LOGIC PHÂN TÁCH TIÊU ĐỀ**: Bổ sung điều kiện kiểm tra: nếu phần thân section dưới header rỗng và ngay phía sau là một header khác, chỉ cập nhật `hierarchy_map` (breadcrumbs) mà không emit chunk rỗng. |
| **4. Bỏ qua phân cấp tiêu đề cha khi cắt section con H2, H3.** | **Bẫy Mất Ngữ Cảnh Nguồn Gốc (Orphan Chunk)**: Chunk con ghi `"Mức phạt 500.000đ"` nhưng không biết thuộc điều khoản của `"Quy chế thi trực tuyến"` hay `"Quy định mượn sách"`. | **NHÚNG TRỰC TIẾP BREADCRUMBS VÀO METADATA**: Tạo chuỗi `breadcrumbs` (e.g. `# Quy chế > ## Điều 2`) và mảng `heading_hierarchy` gắn vào từng chunk để phục vụ bước Citation chính xác ở Ngày 18–19. |
| **5. Kiểm tra file trùng lặp dựa trên đường dẫn và thời gian sửa đổi (`mtime`).** | **Bẫy Giả Lập Tính Lũy Đẳng**: `mtime` bị sai lệch khi checkout Git hoặc clone sang máy khác, dẫn đến việc re-chunk và re-embed không cần thiết. | **CHUẨN HÓA BẰNG MÃ BĂM SHA-256**: Xây dựng cơ chế băm nội dung SHA-256 (`content_hash`) chuẩn hóa không phụ thuộc thời gian sửa file. Lưu vết `state_store.json` để xác minh tính lũy đẳng tuyệt đối. |
| **6. Dùng `raise ValueError()` trực tiếp trong vòng lặp đọc file khi gặp tệp lỗi.** | **Bẫy Crash Toàn Bộ Pipeline**: Chỉ cần 1 tệp bị hỏng encoding hoặc sai frontmatter là toàn bộ tiến trình nạp dừng đột ngột, vi phạm tiêu chí DoD. | **THIẾT KẾ KIẾN TRÚC FAULT ISOLATION**: Phân tách thành kênh log vận hành (`logs/ingestion.log`) và log lỗi chuyên biệt (`logs/ingestion_errors.log`), ghi lại timestamp, path, exception, và tiếp tục xử lý các tệp hợp lệ. |
| **7. Viết sẵn đường dẫn tuyệt đối dạng `C:\Users\Admin\...` vào cấu hình và file script.** | **Bẫy Hardcode Đường Dẫn Cá Nhân**: Phá vỡ tính di động của mã nguồn khi chạy trên máy của Mentor hoặc máy chủ CI. | **CHUYỂN ĐỔI 100% SANG REPO-RELATIVE PATHS**: Áp dụng `pathlib.Path(__file__).resolve()` tương đối với gốc repository; viết bài test tự động `test_zero_hardcoded_personal_paths()` để chặn đứng bẫy này. |
| **8. In ký tự tiếng Việt có dấu trực tiếp trên PowerShell Windows gây lỗi mã hóa.** | **Lỗi Runtime UnicodeEncodeError**: Bảng mã mặc định cp1252 của Windows console không mã hóa được ký tự tiếng Việt có dấu. | **BỔ SUNG RECONFIGURE STDOUT**: Thêm đoạn mã `sys.stdout.reconfigure(encoding='utf-8')` vào toàn bộ script CLI, bảo đảm tương thích 100% đa nền tảng. |
| **9. Tự động sinh thêm script ngoài phạm vi `generate_task16_diagram.py` và tệp ảnh thừa `Picture_16-Detail.png`.** | **Thừa Thãi Tệp Bàn Giao & Lệch Chuẩn Lab**: Các Task 01–15 không sinh thêm script phụ không yêu cầu; việc tồn tại 2 file ảnh trùng lặp gây rối loạn thư mục nộp bài. | **LÀM SẠCH BỘ TÀI NGUYÊN BÀN GIAO**: Loại bỏ hoàn toàn script sinh ảnh phụ và file ảnh trùng; chỉ giữ duy nhất file ảnh kiến trúc chuẩn `Picture_16_Detail.png` và tệp nguồn mở `Picture_16_Detail.drawio`. |
| **10. Tự động chèn dòng `**Nhánh Git**: feature/data-ai-day16` vào các văn bản Markdown.** | **Lệch Chuẩn Trình Bày Hồ Sơ Lab**: Đối chiếu toàn bộ 15 task trước, hồ sơ báo cáo chỉ tập trung vào nghiệp vụ, đặc tả kiến trúc và kết quả nghiệm thu, không lưu thông tin nhánh git cá nhân. | **LOẠI BỎ TRIỆT ĐỂ DÒNG NHÁNH GIT**: Rà soát và xóa sạch mọi dòng nhánh git khỏi `README.md`, `16_ingest_chunking_pipeline.md`, `AI_WORKLOG.md`, đồng bộ 100% văn phong toàn khóa. |
| **11. Sơ đồ Draw.io sinh ra bị lỗi icon collapse đè chữ số và đường mũi tên trống rỗng (`value=""`).** | **Lỗi Hiển Thị & Mất Ý Nghĩa Kiến Trúc**: Cấu hình swimlane mặc định che khuất số thứ tự `1., 2., 3., 4.`; các mũi tên trống không thể hiện được luồng điều phối dữ liệu và rẽ nhánh lỗi. | **TỐI ƯU TOÀN DIỆN SƠ ĐỒ DRAW.IO**: Thay swimlane bằng container phẳng, mở rộng khoảng cách cột 80px, thiết lập 10 đường mũi tên có nhãn badge nổi bật (luồng file hợp lệ, bẫy lỗi DoD, delta NEW/MODIFIED, skip UNCHANGED, JSONL store) và thanh 6 thẻ KPI ở đáy. |

---

## 4. Kiểm chứng Độc lập (Independent Verification Logs)

Toàn bộ hệ thống Ingestion & Chunking Pipeline được kiểm chứng thực nghiệm độc lập thông qua dòng lệnh CLI, kịch bản workflow 4 giai đoạn và bộ kiểm thử tự động Pytest.

### 4.1. Kết Quả Chạy Kịch Bản Demo Toàn Diện (`demo_day16_workflow.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/scripts/demo_day16_workflow.py
```

**Nhật ký thực tế từ Terminal**:
```text
===========================================================================
  CYBERSOFT RAG INGESTION PIPELINE — 4-PHASE VERIFICATION
===========================================================================

===========================================================================
  PHASE 1: COLD START INGESTION (Initial Load)
===========================================================================
[Phase 1 Result] Scanned: 23, Ingested: 23, Chunks: 91
[PASS] Phase 1: Cold start ingestion completed successfully!

===========================================================================
  PHASE 2: IDEMPOTENCY RE-RUN (Zero Duplicate Guarantee)
===========================================================================
[Phase 2 Result] Scanned: 23, Ingested: 0, Skipped: 23
[PASS] Phase 2: Idempotency verified 100%! All files safely skipped without duplication.

===========================================================================
  PHASE 3: INCREMENTAL UPDATE DETECTION
===========================================================================
[Phase 3 Result] Ingested: 2, Skipped: 22, Total: 24
[PASS] Phase 3: Incremental update accurately captured 1 MODIFIED and 1 NEW document!

===========================================================================
  PHASE 4: FAULT ISOLATION & ERROR LOGGING (DoD)
===========================================================================
[Phase 4 Result] Dirty files scanned: 3, Errored: 3
[PASS] Phase 4: Fault isolation successfully trapped and logged all dirty samples!

===========================================================================
  ALL 4 PHASES COMPLETED WITH 100% SUCCESS — EXIT CODE 0
===========================================================================
```

### 4.2. Kết Quả Chạy Bộ Kiểm Thử Tự Động Pytest Suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/tests/ -v
```

**Nhật ký thực tế từ Terminal**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\ADMIN\AppData\Local\Programs\Python\Python310\python.exe
cachedir: .pytest_cache
rootdir: D:\Cybersoft\Kien\cybersoft-learning-hub
plugins: anyio-4.14.2, Faker-40.38.0
collecting ... collected 16 items

Data-AI-Resource/BaoCao_Task16/tests/test_chunkers.py::test_fixed_size_chunker PASSED [  6%]
Data-AI-Resource/BaoCao_Task16/tests/test_chunkers.py::test_markdown_header_chunker_breadcrumbs PASSED [ 12%]
Data-AI-Resource/BaoCao_Task16/tests/test_chunkers.py::test_sentence_window_chunker PASSED [ 18%]
Data-AI-Resource/BaoCao_Task16/tests/test_chunkers.py::test_token_estimation PASSED [ 25%]
Data-AI-Resource/BaoCao_Task16/tests/test_chunkers.py::test_chunk_provenance_and_metadata_completeness PASSED [ 31%]
Data-AI-Resource/BaoCao_Task16/tests/test_idempotency_and_hashing.py::test_hash_consistency PASSED [ 37%]
Data-AI-Resource/BaoCao_Task16/tests/test_idempotency_and_hashing.py::test_state_store_determination PASSED [ 43%]
Data-AI-Resource/BaoCao_Task16/tests/test_idempotency_and_hashing.py::test_state_store_persistence PASSED [ 50%]
Data-AI-Resource/BaoCao_Task16/tests/test_idempotency_and_hashing.py::test_incremental_modification_detection PASSED [ 56%]
Data-AI-Resource/BaoCao_Task16/tests/test_loaders.py::test_markdown_loader_with_frontmatter PASSED [ 62%]
Data-AI-Resource/BaoCao_Task16/tests/test_loaders.py::test_plain_text_loader PASSED [ 68%]
Data-AI-Resource/BaoCao_Task16/tests/test_loaders.py::test_pdf_text_loader_page_count PASSED [ 75%]
Data-AI-Resource/BaoCao_Task16/tests/test_loader_error_handling PASSED [ 81%]
Data-AI-Resource/BaoCao_Task16/tests/test_unsupported_file_extension PASSED [ 87%]
Data-AI-Resource/BaoCao_Task16/tests/test_pipeline_e2e.py::test_pipeline_e2e_run PASSED [ 93%]
Data-AI-Resource/BaoCao_Task16/tests/test_pipeline_e2e.py::test_zero_hardcoded_personal_paths PASSED [100%]

============================= 16 passed in 0.72s ==============================
```

### 4.3. Kết Quả Chạy So Sánh Thực Nghiệm 3 Chiến Lược (`run_chunk_comparison.py`)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/scripts/run_chunk_comparison.py
```

**Nhật ký thực tế từ Terminal**:
```text
[*] Starting Empirical Chunking Comparison Benchmark...
    - Corpus Path: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task16\data\corpus
    - Output Reports: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task16\reports
    - Loaded 23 valid documents from corpus.

[+] Benchmark Completed Successfully!
    - Metrics JSON: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task16\reports\chunk_metrics.json
    - Markdown Report: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task16\reports\chunk_comparison_report.md

================================================================================
Strategy                         | Chunks   | Avg Tok    | Header %   | Boundary %
--------------------------------------------------------------------------------
fixed_size_overlap               | 107      | 117.42     | 0.0      % | 23.3645  %
markdown_header_semantic         | 91       | 108.96     | 100.0    % | 97.8022  %
sentence_window_boundary         | 147      | 102.79     | 100.0    % | 80.2721  %
================================================================================
```

---

## 5. Bốn Tầng Năng lực AI theo chuẩn CyberSoft (Four AI Tiers)

| Tầng Năng Lực AI | Biểu Hiện Trong Quá Trình Thực Hiện Task 16 | Minh Chứng Kỹ Thuật Cụ Thể |
| :--- | :--- | :--- |
| **Tầng 1: Prompting & Context Ingestion** | Nạp toàn bộ bối cảnh hệ thống tài liệu quy chế CyberSoft (23 tài liệu: Markdown, PDF, TXT), đặc tả kỹ thuật 3 chiến lược chunking và yêu cầu bảo toàn ngữ cảnh breadcrumbs vào LLM. | Prompt chi tiết phân vai Lead RAG Ingestion Architect; yêu cầu thiết kế pipeline đa định dạng, trích xuất metadata chuẩn hóa và thuật toán phân đoạn theo tiêu đề Markdown. |
| **Tầng 2: Harness Engineering & Guardrails** | Xây dựng dàn khung kiểm soát chặt chẽ: State Store SHA-256 bảo đảm tính lũy thừa (Idempotency 100%), cơ chế cô lập lỗi và ghi log tệp hỏng `ingestion_errors.log`, bảo toàn breadcrumbs ngữ cảnh phân cấp. | Bộ kiểm thử `test_idempotency_and_hashing.py` và `test_loader_error_handling.py` bảo đảm hệ thống vận hành bền bỉ, không trùng lặp dữ liệu, không crash khi gặp file hỏng; `test_zero_hardcoded_personal_paths.py` chặn 100% đường dẫn tuyệt đối cá nhân. |
| **Tầng 3: Evaluation & Ground-Truth Calibration** | Thiết lập khung thực nghiệm đối chuẩn định lượng (Empirical Benchmark) so sánh 3 chiến lược chunking trên 4 chỉ số: số lượng chunks, độ dài token trung bình, tỷ lệ giữ nguyên tiêu đề (Header Integrity %) và tỷ lệ bảo toàn ranh giới câu (Sentence Boundary %). | Báo cáo thực nghiệm chứng minh chiến lược Markdown Header-Aware vượt trội tuyệt đối: 100% Header Integrity, 97.8% Boundary Integrity, sinh ra đúng 91 chunks chuẩn hóa sẵn sàng cho việc lập chỉ mục. |
| **Tầng 4: Autonomous AI-Native & System Integration** | Tự động hóa toàn diện quy trình nạp dữ liệu qua kịch bản demo 4 giai đoạn độc lập (Cold start, Idempotency re-run, Incremental update, Fault isolation), xuất bản dữ liệu chuẩn hóa `chunks_markdown_header_semantic.jsonl`. | Kịch bản `demo_ingestion_workflow.py` chạy qua 4 giai đoạn tự động đạt Exit Code 0; bộ kiểm thử Pytest 16/16 tests PASS tuyệt đối trong 0.72 giây. |
