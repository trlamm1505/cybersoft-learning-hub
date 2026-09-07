# AI WORK LOG - NGÀY 02: THIẾT KẾ KIẾN TRÚC DATA & AI LAB

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-08-31  
**Task ID**: `#DAY-02-ARCHITECTURE`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Kế thừa 15 Nhu cầu tài nguyên (REQ-01 $\rightarrow$ REQ-15) đã xác lập ở Ngày 01 để xây dựng **Kiến trúc hệ thống tổng thể (System Architecture)** cho CyberSoft Data & AI Lab.
* **Yêu cầu kỹ thuật cốt lõi**:
  * Thiết kế ranh giới phân tách mạch lạc cho **5 module**: `Dataset Registry`, `Data Quality Harness`, `Project Bank`, `Semantic Search & RAG Tutor`, và `Evaluation Harness`.
  * Chuẩn hóa vòng đời dữ liệu theo luồng 4 bước khép kín: $\text{Ingest} \longrightarrow \text{Validate} \longrightarrow \text{Publish} \longrightarrow \text{Search / Retrieve}$.
  * Xây dựng văn bản **ADR-001** lựa chọn Tech Stack có phân tích đánh đổi (trade-offs) và phân định ranh giới rõ ràng giữa **MVP 30 ngày** và **Post-MVP mở rộng**.
  * Đặc tả danh sách API Contracts và mô hình dữ liệu (Data Schema).

### Rủi ro dự kiến
* AI thường có xu hướng đề xuất các kiến trúc quá phức tạp (*over-engineering*) như microservices phân tán, Apache Kafka, cụm Milvus Docker, hoặc dùng API trả phí bên ngoài (OpenAI API), vượt quá năng lực máy tính cá nhân của học viên và thời hạn 30 ngày.
* AI dễ bỏ qua việc mô tả các **trạng thái lỗi (Error States)** và cơ chế xử lý ngoại lệ thực tế (lệch schema, phát hiện PII, embedding timeout, similarity thấp).
* Rủi ro vi phạm nguyên tắc Local-first nếu để hệ sinh thái phụ thuộc vào mạng Internet hoặc dịch vụ Cloud tốn phí.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & ChatGPT (Model: Gemini 3.7 Flash / GPT-4o).
* **Mục tiêu tương tác**: Thiết kế sơ đồ kiến trúc C4 Container, phân tích ma trận so sánh công nghệ trong ADR-001, và xây dựng danh sách API contracts chuẩn OpenAPI/Pydantic.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal Data & AI Architect tại CyberSoft Academy.
Bối cảnh: Kế thừa 15 nhu cầu tài nguyên từ Ngày 01, hãy thiết kế kiến trúc hệ thống cho CyberSoft Data & AI Lab.
Ràng buộc: Đội ngũ 3 người, thời gian 30 ngày, hệ thống chạy local-first trên máy cá nhân không GPU rời, tối ưu chi phí (0đ).
Hãy thực hiện các yêu cầu sau theo chuẩn công nghiệp:
1. Vẽ sơ đồ kiến trúc phân tầng (C4 Container) phân định ranh giới trách nhiệm của 5 module: Dataset Registry, Data Quality Harness, Project Bank, RAG Tutor, Evaluation Harness.
2. Mô tả chi tiết luồng dữ liệu 4 bước Ingest -> Validate -> Publish -> Search. Bắt buộc có bảng Ma trận Trạng thái Lỗi (Error States) xử lý: sai định dạng, lệch schema, phát hiện PII, lỗi embedding, và RAG độ tin cậy thấp.
3. Soạn thảo tài liệu ADR-001 so sánh sâu các phương án công nghệ: FastAPI vs Flask/Django; SQLite vs PostgreSQL/SQL Server; ChromaDB vs FAISS/Milvus; Local MiniLM vs OpenAI Embeddings. Nêu rõ lý do chọn và lộ trình scale.
4. Đặc tả API Contracts (định dạng REST JSON Schema) cho các hành động cốt lõi và schema lưu trữ metadata.
5. Phân định rõ ràng phạm vi MVP 30 ngày vs Post-MVP mở rộng.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đề xuất dùng PostgreSQL & SQL Server ngay từ MVP Day 02**. | Bắt buộc phải cài đặt database server ngầm, cấu hình cổng (port 5432/1433), mật khẩu, gây nguy cơ lỗi cài đặt rất cao trên máy tính cá nhân của học viên mới và làm chậm pipeline CI. | **CHỌN SQLITE CỤC BỘ CHO MVP**, kết hợp **Repository Pattern (SQLAlchemy)**. Toàn bộ database gói gọn trong 1 file `.db` duy nhất, zero-config. Lộ trình chuyển sang PostgreSQL ở Tuần 6 chỉ cần đổi duy nhất 1 dòng connection string mà không sửa code logic. |
| **Đề xuất sử dụng cụm Milvus Cluster & Apache Kafka** để truyền dữ liệu bất đồng bộ. | Quá nặng (*over-engineering*). Cụm Milvus ngốn tối thiểu 4GB–8GB RAM và bắt buộc phải có Docker Daemon; trong khi dữ liệu giáo trình CyberSoft chỉ ở mức vài ngàn chunks. | **LOẠI BỎ KAFKA & MILVUS**. Chọn **ChromaDB chạy embedded cục bộ**, lưu trữ trực tiếp trên disk (`./chroma_db`), không tốn RAM và chạy mượt mà 100% trên CPU. |
| **Đề xuất sử dụng OpenAI API (`text-embedding-3-small`)** để tạo vector embeddings. | Tốn chi phí thẻ tín dụng hàng tháng, phụ thuộc hoàn toàn vào kết nối Internet, và tiềm ẩn nguy cơ rò rỉ tài liệu giáo trình nội bộ của CyberSoft ra bên thứ 3. | **LOẠI BỎ OPENAI API**, chuyển sang model mã nguồn mở **`all-MiniLM-L6-v2`** (384 dim, dung lượng ~80MB). Chạy 100% offline, chi phí 0đ, tốc độ suy luận CPU chỉ 15–30ms/chunk. |
| **Bỏ qua trạng thái lỗi khi RAG không tìm thấy thông tin tin cậy** trong giáo trình. | Nếu không có cơ chế chặn, LLM sẽ tự suy diễn và sinh ra lỗi ảo giác (*hallucination*), trả lời sai quy chế học tập gây hậu quả xấu. | **THIẾT LẬP CƠ CHẾ ABSTENTION (TỪ CHỐI)**: Nếu điểm tương đồng chunk $< 0.65$, hệ thống lập tức ngắt luồng LLM và trả lời: *"Tài liệu giáo trình không đủ dữ kiện, vui lòng liên hệ Giảng viên."* |
| **Đặc tả API contracts chung chung**, thiếu các trường kiểm soát toàn vẹn dữ liệu. | Thiếu thông tin băm để chống giả mạo file và không gắn điểm kiểm định chất lượng. | **BỔ SUNG CÁC TRƯỜNG BẮT BUỘC**: `sha256_hash`, `quality_score`, `is_abstained`, và danh sách `citations` chi tiết đến từng chunk ID và section tài liệu. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Không nghiệm thu bằng cảm tính, một script kiểm thử tự động độc lập bằng Python (`scripts/validate_day02.py`) đã được xây dựng để quét cấu trúc và nội dung của `02_architecture.md` và `ADR-001_tech_stack.md`.

### Lệnh chạy kiểm thử:
```powershell
python Data-AI-Resource/BaoCao_Task02/scripts/validate_day02.py
```

### Kết quả chạy thực tế:
```text
==================================================
CYBERSOFT DATA & AI LAB - DAY 02 VALIDATION HARNESS
==================================================
[PASS] Target architecture file exists: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task02\02_architecture.md
[PASS] Target ADR-001 file exists: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task02\ADR-001_tech_stack.md
[PASS] All 5 Core Modules verified (Registry, Quality, Project, RAG, Evaluation)
[PASS] Data Lifecycle 4-step flow verified (Ingest -> Validate -> Publish -> Search)
[PASS] Error States and Fallback Matrix verified (8 unique error codes detected)
[PASS] MVP vs Post-MVP boundaries clearly distinguished
[PASS] API Specifications & Contracts defined (6 endpoints detected)
[PASS] ADR-001 Tech Stack rationale & trade-offs verified
--------------------------------------------------
SUCCESS: All Day 02 DoD requirements passed (100%)!
==================================================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Tự thiết lập ranh giới 5 module, chu trình 4 bước vòng đời dữ liệu, và các ràng buộc phần cứng máy cá nhân (Local-first, No-GPU) trước khi yêu cầu AI hỗ trợ.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Giao prompt có cấu trúc chặt chẽ, bắt buộc AI tuân thủ định dạng C4 Container, ma trận lỗi, và quy chuẩn tài liệu ADR (Architecture Decision Record) chuẩn công nghiệp.
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Phát hiện và kiên quyết loại bỏ các đề xuất *over-engineering* của AI (Kafka, Milvus, PostgreSQL cho MVP, OpenAI API trả phí); siết chặt cơ chế chống ảo giác (*Abstention Policy*) và cổng kiểm soát PII nhạy cảm.
* **Tầng 4 — Làm chủ (Engineering Ownership)**: Lập trình script `validate_day02.py` để thẩm định tự động 100% tiêu chí DoD, giải thích cặn kẽ các đánh đổi kiến trúc (SQLite vs PostgreSQL, ChromaDB vs FAISS), sẵn sàng phản biện trực tiếp trước Giảng viên và Hội đồng.
