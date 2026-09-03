# ADR-001: LỰA CHỌN TECH STACK CHO CYBERSOFT DATA & AI LAB

**Dự án**: CyberSoft Data & AI Lab  
**Mã quyết định**: ADR-001  
**Trạng thái**:  **ACCEPTED (ĐÃ PHÊ DUYỆT)**  
**Người quyết định**: Đào Trung Kiên (Data & AI Resource Engineer)  
**Ngày quyết định**: 2026-08-31  
**Đầu việc liên quan**: NGÀY 02 — Thiết kế kiến trúc Data & AI Lab  

---

## 1. BỐI CẢNH VÀ BÀI TOÁN (CONTEXT & PROBLEM STATEMENT)

Dự án CyberSoft Data & AI Lab được triển khai trong chu kỳ **30 ngày làm việc** với đội ngũ tinh gọn (3 thực tập sinh: Resource Engineer, Platform Engineer, QA Engineer). 

Hệ thống phải đáp ứng các ràng buộc kỹ thuật thực tế sau:
1. **Ràng buộc phần cứng**: Phần lớn học viên và giảng viên sử dụng laptop cá nhân (Windows/macOS) với cấu hình tiêu chuẩn, không có GPU rời dung lượng lớn (No High-end GPU).
2. **Ràng buộc vận hành**: Cần cài đặt nhanh gọn (One-command setup qua `pip install -r requirements.txt` hoặc script), không phụ thuộc vào các dịch vụ đám mây trả phí (Cloud-free / Zero monthly cost).
3. **Ràng buộc tốc độ (Speed of Delivery)**: Mỗi ngày đều phải có sản phẩm bàn giao chạy được (Working software daily), ưu tiên các thư viện trưởng thành, tài liệu phong phú, ít boilerplate code.
4. **Khả năng nâng cấp (Extensibility)**: Codebase ban đầu chạy cục bộ (Local-first) nhưng cấu trúc phải đủ sạch để có thể mở rộng lên Client-Server hoặc Docker container ở Tuần 5 và Tuần 6.

---

## 2. QUYẾT ĐỊNH CÔNG NGHỆ (DECISION SUMMARY)

Nhóm quyết định lựa chọn bộ công nghệ cốt lõi (Tech Stack) cho giai đoạn **MVP 30 Ngày** như sau:

| Thành phần kỹ thuật | Công nghệ được chọn | Phiên bản khuyến nghị | Vai trò trong hệ sinh thái |
| :--- | :--- | :--- | :--- |
| **Ngôn ngữ cốt lõi** | **Python** | `3.10+` | Toàn bộ backend, data pipeline, CLI và evaluation harness. |
| **Backend API Gateway** | **FastAPI + Pydantic v2** | `0.110+` | Định nghĩa API contracts, tự động sinh tài liệu Swagger/OpenAPI, validate dữ liệu đầu vào. |
| **Metadata Database** | **SQLite (với DuckDB cho phân tích)** | `3.x` | Lưu trữ metadata của Dataset Registry và lịch sử kiểm định chất lượng mà không cần cài đặt RDBMS server. |
| **Vector Database** | **ChromaDB** | `0.4+` | Lưu trữ vector embeddings của tài liệu giáo trình, hỗ trợ tìm kiếm ngữ nghĩa (cosine similarity) chạy local. |
| **Embedding Model** | **all-MiniLM-L6-v2** | `HuggingFace / Sentence-Transformers` | Model sinh vector 384 chiều, siêu nhẹ (~80MB), tối ưu chạy trên CPU với tốc độ < 50ms/chunk. |
| **Data Quality Engine** | **Custom Rules + Pandas + Pydantic** | `Native Python` | Engine kiểm tra 7 nhóm lỗi dữ liệu, tính Quality Score và xuất báo cáo JSON/Markdown. |
| **Testing & Verification** | **Pytest + Shutil / Subprocess** | `8.0+` | Viết các harness kiểm thử tự động, thẩm định chuẩn DoD hàng ngày. |

---

## 3. PHÂN TÍCH SO SÁNH CÁC PHƯƠNG ÁN (CONSIDERED OPTIONS & TRADE-OFFS)

### 3.1. Lựa chọn Web / API Framework: FastAPI vs Flask vs Django

* **Django**: Quá cồng kềnh, sinh nhiều file thừa (ORM, Admin, Templates) không cần thiết cho một hệ thống thuần Data/AI micro-service; thời gian khởi động chậm.
* **Flask**: Đơn giản nhưng thiếu cơ chế Type Checking tự động, phải cài thêm nhiều extension bên ngoài (Flask-RESTful, Marshmallow), dễ dẫn đến cấu trúc lộn xộn giữa các thành viên.
* **FastAPI (ĐƯỢC CHỌN)**:
  * Hỗ trợ Pydantic v2 ép kiểu cực mạnh, tự động chặn sai lệch schema ngay tại cửa ngõ API.
  * Tự động sinh tài liệu chuẩn `/docs` (Swagger UI) giúp bạn Platform Engineer và QA dễ dàng tích hợp mà không cần viết tài liệu API thủ công.
  * Hiệu năng bất đồng bộ (Asynchronous) cao, sẵn sàng cho việc streaming phản hồi RAG sau này.

---

### 3.2. Lựa chọn Metadata Storage: SQLite vs PostgreSQL vs MongoDB

* **PostgreSQL**: Cực kỳ mạnh mẽ và chuẩn mực trong môi trường Production, nhưng đòi hỏi cài đặt service background, cấu hình username/password/port, gây rủi ro cài đặt thất bại trên máy tính học viên mới.
* **MongoDB**: Dữ liệu phi cấu trúc dễ gây mất kiểm soát schema quan hệ giữa các bảng trong dataset.
* **SQLite (ĐƯỢC CHỌN CHO MVP)**:
  * Hoàn toàn không cần cài đặt (Serverless / Zero-configuration), toàn bộ cơ sở dữ liệu được gói gọn trong 1 file `.db` duy nhất trong repo.
  * Dễ dàng backup, commit mẫu dữ liệu vào git, và khôi phục khi gặp sự cố.
  * **Lộ trình chuyển tiếp**: Sử dụng SQLAlchemy / SQLModel để trừu tượng hóa tầng DB, giúp chuyển dịch sang PostgreSQL ở Tuần 6 mà không cần viết lại câu truy vấn.

---

### 3.3. Lựa chọn Vector Database: ChromaDB vs FAISS vs Pinecone vs Milvus

* **Pinecone**: Dịch vụ SaaS Cloud trả phí, phụ thuộc vào kết nối Internet và API Key, không đáp ứng tiêu chí chạy offline và bảo mật nội bộ.
* **Milvus / Qdrant**: Đòi hỏi chạy qua cụm Docker phức tạp, ngốn nhiều RAM (tối thiểu 4GB-8GB chỉ để chạy database), không phù hợp máy tính cấu hình vừa phải.
* **FAISS**: Rất nhanh nhưng chỉ là thư viện tính toán ma trận (index search), thiếu các tính năng quản lý metadata, filter theo thuộc tính và cơ chế lưu trữ bền vững (persistence) dễ dùng.
* **ChromaDB (ĐƯỢC CHỌN)**:
  * Thiết kế riêng cho các ứng dụng AI-native bằng Python.
  * Chạy trực tiếp dưới dạng embedded library, lưu dữ liệu vào thư mục cục bộ (`./chroma_db`).
  * Hỗ trợ lọc metadata kết hợp với vector search (hybrid metadata filtering) cực kỳ trực quan.

---

### 3.4. Lựa chọn Embedding Strategy: Local Sentence-Transformers vs OpenAI Embeddings (text-embedding-3-small)

* **OpenAI API**: Chất lượng embedding cao nhưng tốn phí cho mỗi lần chunking lại corpus, có nguy cơ rò rỉ dữ liệu giáo trình nội bộ ra bên ngoài, và bị gián đoạn nếu mất mạng Internet.
* **all-MiniLM-L6-v2 (ĐƯỢC CHỌN)**:
  * Chạy 100% offline, miễn phí vĩnh viễn, không lo ngại về chi phí API token.
  * Tốc độ suy luận trên CPU thông thường cực kỳ ấn tượng (~15-30ms cho 1 đoạn văn bản 256 tokens).
  * Chiều vector 384 dimensions giúp tiết kiệm bộ nhớ RAM và không gian lưu trữ đĩa cứng gấp 4 lần so với vector 1536 dimensions của OpenAI.

---

## 4. HỆ QUẢ VÀ ĐÁNH ĐỔI (CONSEQUENCES & TRADE-OFFS)

### 4.1. Lợi thế tích cực (Positive Outcomes)
* **Tốc độ triển khai vượt trội**: Cả nhóm có thể khởi tạo môi trường và chạy thử nghiệm thành công chỉ trong vòng dưới 10 phút.
* **Độc lập hoàn toàn (Zero External Dependency)**: Không phụ thuộc vào API bên thứ ba, không tốn chi phí thẻ tín dụng.
* **Dễ kiểm thử tự động**: Toàn bộ dữ liệu SQLite và ChromaDB có thể dễ dàng khởi tạo lại từ đầu (tear-down and re-create) trong các test fixture của Pytest.

### 4.2. Thách thức kỹ thuật và Biện pháp giảm thiểu (Risks & Mitigations)
* **Thách thức 1: Giới hạn ghi đồng thời (Concurrency) của SQLite**:
  * *Rủi ro*: Nếu nhiều tiến trình ghi vào file database cùng lúc có thể bị khóa (`database is locked`).
  * *Biện pháp*: Trong giai đoạn MVP, chỉ áp dụng mô hình 1 tiến trình ghi (Write-Single) và nhiều tiến trình đọc (Read-Multiple), sử dụng chế độ `WAL (Write-Ahead Logging)` của SQLite để tăng tốc độ truy xuất.
* **Thách thức 2: Độ chính xác của model local nhỏ**:
  * *Rủi ro*: Model 384 dimensions có thể có độ phủ ngữ nghĩa kém hơn model thương mại đối với các thuật ngữ tiếng Việt phức tạp.
  * *Biện pháp*: Áp dụng kỹ thuật tiền xử lý văn bản (normalize text), chia nhỏ chunk có độ gối đầu (overlap 15-20%) và thiết kế ngưỡng tương đồng (Similarity Threshold $\ge 0.65$) kết hợp bộ lọc từ khóa.

---

## 5. KẾT LUẬN

Quyết định lựa chọn Tech Stack theo ADR-001 đảm bảo tính **thực tế, kỷ luật kỹ thuật cao, tiết kiệm tối đa tài nguyên** và hoàn toàn đồng bộ với mục tiêu **"Mỗi ngày có sản phẩm chạy được"** của lộ trình 30 ngày.
