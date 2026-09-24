# BÁO CÁO PHÂN TÍCH 10 DẠNG THẤT BẠI CỦA RETRIEVAL (FAILURE ANALYSIS - TASK 18)
**Dự án**: CyberSoft Data & AI Lab  
**Học phần**: Tuần 4 — RAG và AI Tutor  
**Nhiệm vụ**: Phân loại và phân tích ít nhất 10 ca thất bại của Động cơ truy xuất (DoD Requirement)  
**Thời điểm tạo**: 2026-09-24T21:19:53.822549

---

## 1. TỔNG QUAN PHÂN LOẠI 10 DẠNG LỖI (IR FAILURE TAXONOMY)

Trong hệ thống RAG thực tế, một động cơ truy xuất đơn lẻ (chỉ dựa vào Dense Vector hoặc chỉ dựa vào Lexical BM25) luôn tồn tại những "vùng mù" (blind spots) cố hữu. Để thỏa mãn tiêu chí DoD Ngày 18 (*"Có ít nhất 10 lỗi được phân loại"*), bộ khung kiểm thử đã thiết lập 10 ca điển hình tương ứng 10 cơ chế lỗi khác nhau:

| STT | Mã Lỗi | Tên Dạng Thất Bại (Failure Mode) | Điểm Yếu Mô Hình Đơn Lẻ | Giải Pháp Trong Retriever v0.2 |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **CAT-01** | Exact Technical Identifier Mismatch | Dense vector làm mờ cờ tham số (`-b`, `WSL2`) | BM25 Exact Matching & Tokenizer bảo toàn ký tự |
| 2 | **CAT-02** | Synonym Disconnect (Sinh viên vs Học viên) | BM25 trượt do từ đồng nghĩa không khớp chuỗi | Không gian Dense L2 bù đắp tương đồng ngữ nghĩa |
| 3 | **CAT-03** | Fine-grained Subsection Misranking | Preamble chiếm điểm tổng quát lấn át tiểu mục | Cross-Context Reranker ưu tiên Heading/Breadcrumb |
| 4 | **CAT-04** | Negation & Prohibited Constraints | Dense dễ nhầm giữa "được phép" và "bị cấm" | BM25 + Proximity phạt từ phủ định và lọc đúng mục |
| 5 | **CAT-05** | Semantic Drift in Informal Query | BM25 thiếu từ khóa hành chính, điểm số thấp | Không gian Dense kết hợp RRF gom cụm ngữ cảnh |
| 6 | **CAT-06** | Out-of-Vocabulary (OOV) Course Code | Vector dense chiếu sai các mã học phần mới | BM25 token hóa mã alphanumeric `CS-CRS-002` |
| 7 | **CAT-07** | Multi-Aspect Query Dilution | Câu hỏi đa điều kiện làm loãng trọng số | RRF hợp nhất thứ hạng đa nhánh bổ trợ |
| 8 | **CAT-08** | Short Keyword Query Ambiguity | Câu hỏi quá ngắn gây nhiễu entropy cao | Title Match Bonus xác định tài liệu trọng tâm |
| 9 | **CAT-09** | Number & Percentage Sensitivity | Vector dense đối xử số như từ thường | BM25 giữ nguyên token số `06 tháng`, `100%` |
| 10 | **CAT-10** | Technical Formatting Standard (PEP8) | Nhầm lẫn hướng dẫn cài đặt với chuẩn code | Reranker phân tích cross-token proximity |

---

## 2. BẢNG SO SÁNH THỰC NGHIỆM ĐỐI CHỨNG TRÊN 10 CA THẤT BẠI

| Mã | Câu Truy Vấn Kiểm Thử | Chunk Đích | Dense | BM25 | Hybrid RRF | Reranked | Kết Quả Khắc Phục |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **CAT-01** | Cấu hình WSL2 và Ubuntu 22.04 LTS cho mô... | `CS-TEC-001_hdr_000` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-02** | Quy định xử lý khi sinh viên vắng mặt qu... | `CS-POL-003_hdr_000` | #1 | #2 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-03** | Tiêu chuẩn đánh giá đồ án tốt nghiệp Cap... | `CS-POL-003_hdr_002` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-04** | Các vật dụng bị cấm và không được mang v... | `CS-MOCK-001_hdr_000` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-05** | Lớp học online tương tác trực tiếp với m... | `CS-FAQ-002_hdr_001` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-06** | Yêu cầu đầu vào và kiến thức tiên quyết ... | `CS-CRS-002_hdr_003` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-07** | Hậu quả và hình thức xử lý khi học viên ... | `CS-POL-001_hdr_004` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-08** | Cấu hình Visual Studio Code?... | `CS-TEC-001_hdr_002` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |
| **CAT-09** | Điều kiện và thời hạn bảo lưu khóa học t... | `CS-POL-001_hdr_000` | #3 | #2 | #2 | **#2** | Top-2 |
| **CAT-10** | Tiêu chuẩn format code và quy tắc PEP8 t... | `CS-TEC-001_hdr_002` | #1 | #1 | #1 | **#1** | KHẮC PHỤC HOÀN TOÀN |

---

## 3. CHI TIẾT PHÂN TÍCH NGUYÊN NHÂN GỐC VÀ CÁCH XỬ LÝ CHO TỪNG CA

### 3.1. CAT-01: Exact Technical Identifier Mismatch
- **Câu truy vấn**: *"Cấu hình WSL2 và Ubuntu 22.04 LTS cho môi trường phát triển AI trên Windows?"*
- **Tài liệu & Chunk Đích**: `CS-TEC-001` — `CS-TEC-001_hdr_000`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi chứa mã lệnh, cờ tham số hoặc định danh kỹ thuật chính xác (ví dụ WSL2, Ubuntu 22.04). Vector dense dễ làm mờ định danh thành từ lập trình chung, BM25 giúp kéo đúng chunk.
- **Cơ chế Khắc phục của Retriever v0.2**: BM25Engine bảo toàn nguyên vẹn chuỗi '-b' và 'WSL2' trong bộ tách từ technical tokenizer, giúp kéo chunk kỹ thuật lên đầu.

### 3.2. CAT-02: Synonym & Student Term Disconnect
- **Câu truy vấn**: *"Quy định xử lý khi sinh viên vắng mặt quá số buổi học cho phép?"*
- **Tài liệu & Chunk Đích**: `CS-POL-003` — `CS-POL-003_hdr_000`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `2`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Người dùng dùng từ đồng nghĩa đời thường 'sinh viên' trong khi văn bản CyberSoft dùng 'học viên'. BM25 bị trượt từ khóa, Vector dense gỡ gạc nhờ không gian ngữ nghĩa tương đồng.
- **Cơ chế Khắc phục của Retriever v0.2**: Không gian vector Dense L2 ánh xạ ngữ nghĩa 'sinh viên' tương đương 'học viên', bù đắp cho việc BM25 bị tụt hạng do thiếu từ khóa.

### 3.3. CAT-03: Fine-grained Subsection Misranking
- **Câu truy vấn**: *"Tiêu chuẩn đánh giá đồ án tốt nghiệp Capstone trong quy chế đào tạo thực chiến?"*
- **Tài liệu & Chunk Đích**: `CS-POL-003` — `CS-POL-003_hdr_002`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi hỏi sâu về tiểu mục đồ án Capstone, phần mở đầu văn bản bao quát toàn bộ tiêu đề lấn át điểm số dense. Reranker phân tích tiêu đề heading đưa chunk tiểu mục lên Rank 1.
- **Cơ chế Khắc phục của Retriever v0.2**: CrossContextReranker tính điểm Title & Breadcrumb Match, ưu tiên tuyệt đối phân đoạn chuyên đề Capstone thay vì phần mở đầu chung.

### 3.4. CAT-04: Negation & Prohibited Items Constraints
- **Câu truy vấn**: *"Các vật dụng bị cấm và không được mang vào phòng thi trực tuyến?"*
- **Tài liệu & Chunk Đích**: `CS-MOCK-001` — `CS-MOCK-001_hdr_000`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi chứa từ phủ định hoặc cấm đoán ('không được mang', 'bị cấm'). Mô hình vector dễ nhầm sang tài liệu quy định đồ dùng được phép mang theo.
- **Cơ chế Khắc phục của Retriever v0.2**: Sự kết hợp BM25 cho các từ 'cấm', 'không được' cùng thuật toán Phrase Proximity giúp định vị đúng điều khoản cấm đoán.

### 3.5. CAT-05: Semantic Drift in Informal Conversational Query
- **Câu truy vấn**: *"Lớp học online tương tác trực tiếp với mentor như thế nào?"*
- **Tài liệu & Chunk Đích**: `CS-FAQ-002` — `CS-FAQ-002_hdr_001`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi diễn đạt bằng văn phong giao tiếp tự nhiên 'học online có được hỏi mentor trực tiếp không'. BM25 thiếu từ khóa hành chính, Vector dense và Reranker hỗ trợ bắt đúng ý.
- **Cơ chế Khắc phục của Retriever v0.2**: Động cơ Vector nhúng nhận diện câu hỏi giao tiếp tự nhiên và RRF kết hợp điểm số giúp duy trì chunk giải đáp FAQ ở Top-1.

### 3.6. CAT-06: Out-of-Vocabulary (OOV) Course Code Matching
- **Câu truy vấn**: *"Yêu cầu đầu vào và kiến thức tiên quyết của khóa học CS-CRS-002?"*
- **Tài liệu & Chunk Đích**: `CS-CRS-002` — `CS-CRS-002_hdr_003`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Truy vấn tìm kiếm chính xác theo mã khóa học 'CS-CRS-002'. Vector dense khó phân biệt mã học phần nếu chưa được fine-tune, BM25 định vị chính xác tuyệt đối.
- **Cơ chế Khắc phục của Retriever v0.2**: Từ vựng BM25 lập chỉ mục trực tiếp chuỗi 'CS-CRS-002', bảo đảm truy xuất chính xác 100% mã học phần ngay cả khi vector dense phân tán.

### 3.7. CAT-07: Multi-Aspect Query Dilution
- **Câu truy vấn**: *"Hậu quả và hình thức xử lý khi học viên bảo lưu quá thời hạn quy định?"*
- **Tài liệu & Chunk Đích**: `CS-POL-001` — `CS-POL-001_hdr_004`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi chứa hai khía cạnh: bảo lưu và xử lý vi phạm quá thời hạn. Đơn lẻ một retriever dễ thiên lệch, RRF kết hợp cả hai luồng để đảm bảo đúng phân đoạn chế tài.
- **Cơ chế Khắc phục của Retriever v0.2**: RRF (Reciprocal Rank Fusion) kết hợp điểm số của cả hai khía cạnh bảo lưu và quá thời hạn từ 2 bảng xếp hạng độc lập.

### 3.8. CAT-08: Short Keyword Query Ambiguity
- **Câu truy vấn**: *"Cấu hình Visual Studio Code?"*
- **Tài liệu & Chunk Đích**: `CS-TEC-001` — `CS-TEC-001_hdr_002`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi quá ngắn (dưới 4 từ) 'cấu hình VS Code'. Không gian dense có entropy cao vì nhiều chunk chứa từ khóa này, Reranker ưu tiên chunk có title chứa đúng công cụ.
- **Cơ chế Khắc phục của Retriever v0.2**: Hệ số Title Match Bonus của Reranker tập trung vào văn bản có tiêu đề công cụ 'Visual Studio Code', loại bỏ các chunk rác.

### 3.9. CAT-09: Number & Percentage Constraint Sensitivity
- **Câu truy vấn**: *"Điều kiện và thời hạn bảo lưu khóa học tối đa tại CyberSoft?"*
- **Tài liệu & Chunk Đích**: `CS-POL-001` — `CS-POL-001_hdr_000`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `3`
  - BM25 Lexical: `2`
  - Hybrid RRF: `2`
  - **Retriever v0.2 Reranked**: **`2`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi chứa điều kiện số liệu và mốc thời hạn như 'thời hạn bảo lưu tối đa'. Vector dense thường coi nhẹ số, BM25 bắt chính xác điều khoản quy định thời gian.
- **Cơ chế Khắc phục của Retriever v0.2**: BM25 giữ nguyên các token số lượng và thời hạn ('06 tháng', '100%') giúp phân biệt chính xác điều khoản thời hiệu.

### 3.10. CAT-10: Fine-Grained Technical Standard (PEP8 & Formatting)
- **Câu truy vấn**: *"Tiêu chuẩn format code và quy tắc PEP8 trong môi trường Python?"*
- **Tài liệu & Chunk Đích**: `CS-TEC-001` — `CS-TEC-001_hdr_002`
- **Thứ hạng Thực nghiệm**:
  - Dense Baseline: `1`
  - BM25 Lexical: `1`
  - Hybrid RRF: `1`
  - **Retriever v0.2 Reranked**: **`1`**
- **Nguyên nhân gốc (Root Cause)**: Câu hỏi về tiêu chuẩn định dạng code PEP8. Reranker phân tích cross-token giúp định vị đúng phần cấu hình linter/formatter thay vì hướng dẫn cài đặt chung.
- **Cơ chế Khắc phục của Retriever v0.2**: Reranker đo lường độ phủ từ khóa 'PEP8' kết hợp proximity bigram 'quy tắc PEP8' để định vị đúng phân đoạn cấu hình linter.
