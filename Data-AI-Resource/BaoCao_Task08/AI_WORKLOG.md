# AI WORK LOG — NGÀY 08: DATASET AI ENGINEER CHO RAG (`RAG_corpus_v1`)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-10  
**Task ID**: `#DAY-08-RAG-DATASET-ENGINEERING`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Xây dựng toàn diện tài nguyên dữ liệu phục vụ huấn luyện và đánh giá hệ thống RAG (Retrieval-Augmented Generation) cho hệ sinh thái CyberSoft Academy, bao gồm 2 thành phần cốt lõi:
  1. `RAG Corpus v1`: Tập ngữ liệu gồm tối thiểu 20 tài liệu chuẩn hóa về quy chế học vụ, chính sách tài chính, hướng dẫn kỹ thuật và lộ trình đào tạo, được gắn metadata đầy đủ (`document_id`, `title`, `category`, `section_id`, `version`, `tags`).
  2. `RAG Evaluation Benchmark (100 câu hỏi)`: Bộ câu hỏi kiểm thử chất lượng hệ thống RAG có kèm Ground-truth Citations chuẩn xác, phân loại rõ ràng 4 nhóm câu hỏi (Single-hop, Multi-hop, Unanswerable, Adversarial/Distractor).
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  * Tối thiểu 20 tài liệu văn bản Markdown và đúng 100 câu hỏi đánh giá.
  * Phải có các câu hỏi gây nhiễu (Distractor / Adversarial) và câu không đủ dữ kiện (Unanswerable / Out-of-scope) để kiểm tra khả năng phòng vệ chống ảo giác (Hallucination Defense).
  * **Tuyệt đối không để xảy ra Answer Leakage**: Câu hỏi không được chứa mã hiệu nội bộ (`SEC-...`) hoặc sao chép nguyên văn cụm từ khóa của câu trả lời.
  * Trích dẫn Citation phải ánh xạ 100% khớp từng ký tự với nội dung văn bản nguồn trong corpus.
  * Có công cụ kiểm định tự động tuân thủ mã thoát POSIX (0/1/2) và test suite Pytest tự động 100% PASS.

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Bẫy Answer Leakage cơ học**: AI khi được yêu cầu sinh câu hỏi thường đưa trực tiếp cụm từ khóa của đáp án hoặc mã định danh vào trong câu hỏi (Ví dụ: *"Thời gian bảo lưu 6 tháng có áp dụng cho học viên nghỉ phép không?"* hay *"Theo điều khoản SEC-POL-001-01..."*). Lỗi này làm mất giá trị đánh giá năng lực của bộ máy tìm kiếm (Retriever) vì chỉ cần match từ khóa cơ học là ra kết quả.
* **Bẫy Bịa đặt Trích dẫn (Hallucinated Citations)**: AI có xu hướng tóm tắt hoặc viết lại câu trích dẫn citation theo ý hiểu thay vì trích xuất nguyên văn (verbatim substring) từ văn bản gốc, dẫn đến việc kiểm tra chuỗi `text_citation in section_content` bị thất bại.
* **Bẫy Trả lời Bừa khi Gặp Câu Ngoài Phạm vi (False Ground Truth)**: Khi gặp các câu hỏi ngoài phạm vi corpus (như hỏi về bảo lưu 5 năm du học hay trả góp 36 tháng), AI thường tự suy đoán chính sách chung của xã hội để trả lời thay vì kiên quyết khẳng định tài liệu không đề cập và gán citations rỗng `[]`.
* **Bẫy Phân mảnh Ngữ cảnh (Over-chunking)**: AI cắt vụn văn bản thành các câu đơn lẻ làm mất tính mạch lạc của các bảng điều kiện trong quy chế đào tạo.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash / Claude 3.5 Sonnet).
* **Mục tiêu tương tác**: Thiết kế cấu trúc 20 tài liệu văn bản Markdown, phân bổ 81 phân đoạn ngữ nghĩa, sinh bộ 100 câu hỏi đánh giá cân bằng 4 nhóm, xây dựng các JSON/Markdown Schema, bộ tài liệu hướng dẫn kỹ thuật và script kiểm thử toàn vẹn tự động.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal AI Architect & Curriculum Engineering Lead tại CyberSoft Academy.
Bối cảnh: Thực hiện Task 08 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng bộ tài nguyên RAG Corpus v1 (tối thiểu 20 documents) và bộ 100 câu hỏi RAG Benchmark có Ground-truth Citations chuẩn xác, tuân thủ nguyên tắc Zero Answer Leakage.
Yêu cầu kỹ thuật chi tiết:
1. Thiết kế 20 tài liệu Markdown thuộc 4 nhóm (CS-POL: Chính sách, CS-TEC: Kỹ thuật, CS-CRS: Lộ trình, CS-FAQ: Học vụ). Mỗi tài liệu có Frontmatter YAML chuẩn và chia nhỏ thành các section rõ ràng (SEC-XXX-YY).
2. Biên soạn đúng 100 câu hỏi đánh giá:
   - 40 câu Answerable Single-hop (truy xuất 1 section).
   - 20 câu Answerable Multi-hop (tổng hợp từ 2 sections/documents trở lên).
   - 20 câu Unanswerable (câu hỏi ngoài phạm vi corpus, kiểm thử khả năng phòng vệ chống ảo giác, citation rỗng).
   - 20 câu Adversarial/Distractor (câu hỏi gài bẫy con số biên, nhầm lẫn công nghệ, có trích dẫn bẻ gãy giả định sai).
3. Đảm bảo 100% trích dẫn citation khớp từng ký tự với nội dung văn bản nguồn.
4. Xây dựng CLI Validator tự động validate_rag_dataset.py với mã thoát POSIX 0/1/2.
5. Xây dựng Test suite tests/test_rag_integrity.py với Pytest đạt 100% PASS.
6. Soạn thảo Data Dictionary (corpus_schema, eval_schema) và các tài liệu hướng dẫn Chunking & Anti-Leakage.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đưa mã định danh `SEC-POL-001-01` vào câu hỏi của người dùng** (Ví dụ: *"Theo điều khoản SEC-POL-001-01, học viên được bảo lưu khi nào?"*). | **Rò rỉ dữ liệu nghiêm trọng (Severe Answer Leakage)**: Người dùng thực tế không bao giờ biết mã section nội bộ; đưa mã này vào query sẽ biến bài toán tìm kiếm ngữ nghĩa thành tìm kiếm từ khóa tầm thường. | **LOẠI BỎ TRIỆT ĐỂ MÃ NỘI BỘ TRONG QUERY**: Viết lại toàn bộ câu hỏi dưới dạng ngôn ngữ tự nhiên mở (*"Điều kiện về thời lượng hoàn thành để học viên được quyền nộp đơn xin bảo lưu khóa học tại CyberSoft là gì?"*). Thiết lập regex audit kiểm tra cấm từ `sec-` trong query. |
| **AI tự ý tóm tắt lại nội dung trích dẫn trong trường `text_citation` thay vì trích nguyên văn**. | Khiến việc kiểm tra tự động `text_citation in section_content` bị báo lỗi 100% (`AssertionError`) vì câu tóm tắt không tồn tại trong tài liệu gốc. | **ÉP BUỘC TRÍCH XUẤT NGUYÊN VĂN (EXACT SUBSTRING EXTRACTION)**: Rà soát và thay thế toàn bộ chuỗi trích dẫn bằng các đoạn văn bản nguyên mẫu (Verbatim text spans) lấy trực tiếp từ các file Markdown, bảo đảm hàm `find_citation()` trả về True 100%. |
| **Khi xử lý câu Unanswerable Q071 (Hỏi về việc Mentor giải bài tập đại học riêng), AI trả lời: "Theo CS-FAQ-003, Mentor có quyền từ chối..."**. | Không có từ khóa khẳng định rõ ràng ("Không hỗ trợ" hoặc "Tài liệu không có"), khiến bài kiểm thử nhận diện câu trả lời từ chối bị fail. | **CHUẨN HÓA CÂU PHẢN HỒI CHO UNANSWERABLE**: Bổ sung rõ ràng *"Không hỗ trợ. Theo CS-FAQ-003..."* để thống nhất chuẩn ngữ nghĩa cho toàn bộ 20 câu hỏi âm tính (Negative examples). |
| **Sử dụng cơ chế cắt đoạn theo số lượng token cố định (Fixed-size Chunking 200 tokens)**. | Cắt ngang giữa các câu quy chế, tách rời con số phần trăm điều kiện khỏi điều khoản tương ứng, phá vỡ tính logic của văn bản pháp lý. | **ÁP DỤNG MARKDOWN HEADER CHUNKING THEO TIÊU ĐỀ `## SEC-...`**: Giữ nguyên vẹn toàn bộ một điều khoản trong một section độc lập (300 - 600 tokens), tối ưu hóa cấu trúc cho cả Retriever và LLM Context. |
| **Sử dụng lệnh `import generate_rag_dataset` bên trong chính file `generate_rag_dataset.py`**. | Gây lỗi vòng lặp `AttributeError: partially initialized module (circular import)` khi chạy độc lập qua CLI. | **TÁCH BIỆT VÀ CHUYỂN THÀNH HÀM `load_corpus_documents()` ĐỘC LẬP**: Đọc trực tiếp các file `.md` từ thư mục `data/corpus/`, loại bỏ hoàn toàn sự phụ thuộc lẫn nhau của các module. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi hệ thống kiểm thử tự động độc lập gồm script sinh dữ liệu, CLI validator và bộ 9 Pytest unit tests.

### Lệnh chạy kiểm thử:
```powershell
# 1. Tự động kiểm định chất lượng toàn vẹn và đối soát trích dẫn RAG:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task08/scripts/validate_rag_dataset.py

# 2. Chạy toàn bộ Pytest Suite tự động:
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task08/tests/ -v
```

### Kết quả chạy thực tế:
```text
================================================================================
 CYBERSOFT DATA & AI RESOURCE QUALITY GATE - TASK 08 RAG VALIDATOR
================================================================================

[CHECK] 1. Checking Directory & Essential Files Existence...
  -> All core directories and files exist.

[CHECK] 2. Validating Corpus Documents & Metadata Frontmatter...
  -> Found 20 Markdown files in corpus directory.
  -> Successfully parsed 20 documents with 81 sections.

[CHECK] 3. Validating 100 RAG Evaluation Benchmark Questions...
  -> Total evaluation questions loaded: 100
  -> Types distribution: {'Answerable - Single Hop': 40, 'Answerable - Multi Hop': 20, 'Unanswerable': 20, 'Adversarial / Distractor': 20}
  -> Categories distribution: {'Academic Policy': 44, 'Technical Guide': 26, 'Curriculum': 15, 'Academic FAQ': 15}

[CHECK] 4. Validating Ground-Truth Citations Strict Match...
  -> Total verified authentic citation text spans: 100

[CHECK] 5. Executing Anti-Leakage & Query Quality Audit...
  -> Zero Answer Leakage verified! All queries pass heuristic anti-leakage checks.

[CHECK] 6. Validating JSON and CSV Parity...
  -> CSV row count (100) perfectly matches JSON count (100).

================================================================================
 VALIDATION SUMMARY REPORT
================================================================================
  - Total Corpus Documents:      20 (DoD minimum: 20)
  - Total Corpus Sections:       81
  - Total Benchmark Questions:   100 (DoD requirement: 100)
  - Verified Ground Truth Citations: 100
  - Total Quality Violations:    0

[PASS] ALL CHECKS PASSED 100%! DATASET INTEGRITY VERIFIED.
Validator exiting with Exit Code 0 (Success).

============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
collected 9 items

tests/test_rag_integrity.py::test_corpus_document_count PASSED [ 11%]
tests/test_rag_integrity.py::test_corpus_manifest_consistency PASSED [ 22%]
tests/test_rag_integrity.py::test_corpus_frontmatter_metadata PASSED [ 33%]
tests/test_rag_integrity.py::test_eval_question_count PASSED [ 44%]
tests/test_rag_integrity.py::test_eval_question_distribution PASSED [ 55%]
tests/test_rag_integrity.py::test_ground_truth_citations_match PASSED [ 66%]
tests/test_rag_integrity.py::test_unanswerable_citations_are_empty PASSED [ 77%]
tests/test_rag_integrity.py::test_anti_leakage_and_quality PASSED [ 88%]
tests/test_rag_integrity.py::test_validator_cli_execution PASSED [100%]

============================== 9 passed in 0.35s ==============================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Phân tích bài toán thiết kế kiến trúc RAG Corpus 20 tài liệu văn bản bán cấu trúc (81 sections kèm Frontmatter YAML phong phú), hoạch định bộ 100 câu hỏi Benchmark chia 4 nhóm đặc thù (Single-hop, Multi-hop, Unanswerable, Adversarial/Distractor), xác lập chiến lược phân đoạn Markdown Header Chunking và ma trận đối soát trích dẫn Ground Truth trước khi gọi AI.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân vai Principal AI Architect & Curriculum Engineering Lead, thiết kế prompt có cấu trúc chặt chẽ với các ràng buộc kỹ thuật rõ ràng (Zero Answer Leakage, trích dẫn nguyên văn substring, POSIX exit codes), kiểm soát mạch lạc từng module bàn giao (Corpus Data, Benchmark QA, JSON/Markdown Schemas, Technical Docs, CLI Validator và Pytest test suite).
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Độc lập phát hiện và loại bỏ các cạm bẫy do AI sinh ra: triệt tiêu hiện tượng rò rỉ đáp án (xóa sạch mã `SEC-...` trong câu hỏi), ép buộc trích xuất nguyên văn `text_citation` thay vì tóm tắt, chuẩn hóa phản hồi dứt khoát "Không hỗ trợ" cho nhóm câu hỏi phòng vệ chống ảo giác (Unanswerable Q071), và sửa lỗi vòng lặp phụ thuộc `circular import`.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự thiết kế và hiện thực hóa CLI Validator chuẩn POSIX (exit code 0/1/2), bộ test suite 9 unit tests bằng Pytest tự động hóa hoàn toàn, ma trận Ground Truth 100% khớp văn bản nguồn, và làm chủ toàn diện 100% tài nguyên kỹ thuật bàn giao phục vụ các hệ thống RAG thực tế tại CyberSoft.
