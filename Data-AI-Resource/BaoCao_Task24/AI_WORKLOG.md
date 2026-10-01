# NHẬT KÝ PHỐI HỢP & THẨM ĐỊNH AI (AI WORKLOG) — NGÀY 24
## THEO DÕI NGUỒN GỐC DỮ LIỆU & QUẢN LÝ PHIÊN BẢN (LINEAGE & VERSIONING SYSTEM v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 24 — Theo dõi lineage và phiên bản (`cybersoft-lineage-tracker`)  
**Người thực hiện**: Đào Trung Kiên — Data & AI Resource Engineer  
**Công cụ hỗ trợ**: Google Antigravity & Codex (Model: Gemini 3.8 Flash)  
**Thời gian thực hiện**: 2026-10-02  

---

## 1. BÀI TOÁN TRƯỚC AI (PROBLEM STATEMENT BEFORE AI)

Hệ sinh thái học liệu CyberSoft Data & AI Lab sau 23 ngày đã sở hữu hàng chục tài nguyên phức tạp thuộc nhiều chủng loại: Dataset bán hàng, Dataset nhân sự, Dataset rời bỏ viễn thông, Kho tri thức RAG, Prompt sinh đề thi Bloom, Checkpoint mô hình Embedder/LLM, Chỉ mục FAISS/BM25, Bộ đánh giá và Ngân hàng 20 bài tập thực hành.

Bài toán đặt ra:
1. Làm thế nào để truy vết ngược một bài tập học viên đang làm được sinh ra từ dataset nào, sử dụng prompt nào và mô hình AI phiên bản bao nhiêu?
2. Làm thế nào để bảo vệ tính toàn vẹn của dữ liệu trong quá khứ, cấm tuyệt đối việc ghi đè gây sai lệch kết quả đánh giá (WORM Storage)?
3. Làm thế nào để đóng gói bản phát hành (Release Manifest), tự động lập nhật ký thay đổi (Changelog) và xây dựng quy trình thu hồi (Deprecate) an toàn có kèm hướng dẫn hoàn tác (Rollback Note)?

---

## 2. CÔNG CỤ SỬ DỤNG & VAI TRÒ TƯƠNG TÁC (TOOLS & ROLES)

- **Công cụ chính**: Google Antigravity (Môi trường phát triển Agentic AI) tích hợp mô hình Gemini 3.8 Flash.
- **Phân vai tương tác**:
  - *AI Agent*: Đóng vai trò Senior Data Platform Engineer, đề xuất thuật toán duyệt đồ thị DAG, kiến trúc băm SHA-256 nội dung và cấu trúc tệp manifest.
  - *Kỹ sư con người (Đào Trung Kiên)*: Đóng vai trò Lead Data & AI Resource Architect, kiểm duyệt nghiêm ngặt mọi mã nguồn, bác bỏ các đề xuất vi phạm nguyên tắc bất biến, sửa lỗi đột biến ký tự dòng trên hệ điều hành Windows và chỉ đạo tuân thủ tuyệt đối quy định không dùng từ cấm.

---

## 3. CÁC CHỈ DẪN CHÍNH (PROMPT DIRECTIVES)

1. *"Thiết kế lớp lưu trữ ImmutableStore thực thi triệt để cơ chế Write-Once-Read-Many (WORM): nếu một tài nguyên cùng tên và cùng phiên bản đã tồn tại, lập tức chặn đứng với mã lỗi 409 Conflict."*
2. *"Xây dựng giải thuật truy vết nguồn gốc (lineage backtrace) kết hợp BFS tìm tập tổ tiên và DFS tìm toàn bộ các tuyến đường dẫn nhân quả từ gốc tới đích."*
3. *"Đóng gói Release Manifest v1.0.0 (Baseline) và v1.1.0 (Current) với mã băm toàn vẹn (holistic checksum) được tính xác định từ danh sách thành phần con."*
4. *"Thiết lập máy trạng thái vòng đời (Lifecycle State Machine): DRAFT -> ACTIVE -> DEPRECATED -> RETIRED, cảnh báo tự động các tài nguyên hạ nguồn bị ảnh hưởng."*
5. *"Xây dựng bộ kiểm thử tự động Pytest 24/24 bài test và công cụ đánh giá CLI độc lập đạt Exit Code 0."*

---

## 4. BẢNG THẨM ĐỊNH 10 ĐỀ XUẤT CỦA AI (HUMAN REVIEW & DECISIONS)

| STT | Đề Xuất Của AI | Đánh Giá Của Kỹ Sư | Quyết Định Của Con Người | Lý Do Kỹ Thuật & Nghiệp Vụ |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Lưu toàn bộ Lineage vào một bảng cơ sở dữ liệu quan hệ SQL bên ngoài. | Phụ thuộc dịch vụ ngoài, khó phân phối offline cho học viên. | **BÁC BỎ / THAY THẾ** | Sử dụng cấu trúc thư mục phân vùng WORM và tệp JSON phi tập trung để hệ thống chạy độc lập 100% On-premise. |
| **2** | Dùng Git Commit Hash làm mã định danh duy nhất cho artifact. | Học viên có thể chạy ngoài Git repo hoặc tải tệp ZIP khiến hash Git bị mất. | **BÁC BỎ / THAY THẾ** | Kết hợp Semantic Versioning (`v1.0.0`) và SHA-256 Content Hash của chính payload nhị phân. |
| **3** | Ghi đè tệp `metadata.json` khi có bản cập nhật nhỏ của cùng phiên bản. | Vi phạm nghiêm trọng nguyên tắc bất biến (WORM Violation). | **BÁC BỎ** | Cấm tuyệt đối việc ghi đè; mọi thay đổi bắt buộc phải sinh phiên bản mới (`v1.1.0`). |
| **4** | Ghi tệp văn bản bằng `payload_file.write_text(content)`. | Trên Windows, hàm này tự động chuyển đổi `\n` thành `\r\n` làm lệch mã băm SHA-256. | **HIỆU CHỈNH** | Ép chuẩn hóa `content.replace('\r\n', '\n')` và ghi nhị phân bằng `write_bytes()` để bảo toàn mã băm đa nền tảng. |
| **5** | Cho phép xóa vật lý tệp cũ khi tài nguyên chuyển sang trạng thái Deprecated. | Phá hủy tính tái lập (Reproducibility), khiến các bài tập cũ không còn tài nguyên nguồn để đối soát. | **BÁC BỎ** | Giữ nguyên 100% tệp payload trên đĩa; chỉ chuyển cờ trạng thái `state: deprecated` trong siêu dữ liệu. |
| **6** | Dùng thuật toán đệ quy ngây thơ để tìm đường dẫn trên DAG. | Nguy cơ tràn ngăn xếp (RecursionError) nếu đồ thị có chu trình hoặc độ sâu lớn. | **HIỆU CHỈNH** | Kết hợp BFS thu thập tập hợp tổ tiên hữu hạn trước khi chạy DFS tìm đường dẫn. |
| **7** | Trả về lỗi 500 Internal Server Error khi cố tình ghi đè tài nguyên đã có. | Mã lỗi 500 là lỗi máy chủ không mong muốn, vi phạm chuẩn RESTful. | **HIỆU CHỈNH** | Bắt ngoại lệ `ImmutableArtifactError` và ánh xạ chuẩn HTTP 409 Conflict kèm mã `IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED`. |
| **8** | Để trống ngày hết hạn khi Deprecate tài nguyên. | Không có lộ trình rõ ràng, gây mơ hồ cho đội ngũ phát triển hạ nguồn. | **BỔ SUNG** | Bắt buộc cung cấp `sunset_date`, `deprecation_reason` và tài nguyên thay thế `superseded_by`. |
| **9** | Sử dụng các thuật ngữ dịch thô như rollback scenario thành từ cấm trong hướng dẫn. | Vi phạm quy định chuẩn mực về văn phong kỹ thuật CyberSoft. | **BÁC BỎ / LOẠI BỎ** | Thay thế toàn bộ bằng các thuật ngữ chuẩn: 'hướng dẫn hoàn tác', 'quy trình khôi phục', 'kế hoạch hoàn tác'. |
| **10**| Chỉ kiểm tra Unit Test cục bộ trên từng hàm lưu trữ. | Chưa bao quát luồng gọi RESTful API từ giao diện Web Review. | **BỔ SUNG** | Xây dựng bộ test tích hợp toàn diện 24/24 tests bao phủ từ WORM Store, DAG Traversal, Manifest Diff đến FastAPI Endpoints. |

---

## 5. BẢNG NHẬN DIỆN 10 BẪY AI (AI TRAP DETECTION & DEFENSE)

| STT | Bẫy AI Phổ Biến | Biểu Hiện Trong Quá Trình Làm Việc | Biện Pháp Phòng Vệ & Triệt Tiêu |
| :---: | :--- | :--- | :--- |
| **1** | **Bẫy Đột biến Dòng Mới (Newline Mutation Trap)** | AI tự ý dùng `open(..., 'w')` ghi tệp text trên Windows khiến mã băm SHA-256 bị thay đổi khi đọc lại nhị phân. | Sử dụng `encode('utf-8')` với ký tự xuống dòng chuẩn `\n` và ghi trực tiếp bằng phương thức nhị phân `write_bytes()`. |
| **2** | **Bẫy Đường dẫn Đa Ổ Đĩa (Cross-drive Path Trap)** | AI dùng `path.relative_to(config.base_dir)` gây lỗi `ValueError` khi chạy pytest trên ổ đĩa tạm `C:\` trong khi repo nằm ở `D:\`. | Bổ sung khối bắt ngoại lệ `try...except ValueError` để xử lý linh hoạt giữa đường dẫn tương đối và tuyệt đối. |
| **3** | **Bẫy Nuốt Mã Lỗi (Exception Masking Trap)** | AI dùng `except Exception: pass` trong các vòng lặp kiểm tra khiến các lỗi cú pháp JSON bị bỏ qua âm thầm. | Ghi nhận cụ thể loại ngoại lệ `json.JSONDecodeError` và ghi log cảnh báo chi tiết thay vì nuốt lỗi. |
| **4** | **Bẫy Chu trình Ẩn (Hidden Cyclic Dependency Trap)** | AI cho phép một tài nguyên dẫn xuất ngược lại chính tổ tiên của nó mà không kiểm tra tính chất DAG. | Cài đặt thuật toán kiểm tra tính chất phi chu trình trước khi cập nhật cạnh (edge) vào đồ thị. |
| **5** | **Bẫy Mã Băm Không Xác Định (Non-deterministic Hash Trap)** | AI tính băm trên dictionary Python không sắp xếp thứ tự khóa (`dict.keys()`), dẫn tới mã băm thay đổi ngẫu nhiên giữa các lần chạy. | Sắp xếp danh sách khóa theo thứ tự bảng chữ cái (`sorted(keys)`) trước khi nối chuỗi băm toàn vẹn (holistic hash). |
| **6** | **Bẫy Phá Vỡ Tính Bất Biến (Immutability Bypass Trap)** | AI đề xuất thêm tham số `force_overwrite=True` để tiện kiểm thử. | Kiên quyết từ chối cờ `force_overwrite`; trong kho WORM, tuyệt đối không có ngoại lệ ghi đè. |
| **7** | **Bẫy Nuốt Uniform Envelope (Error Envelope Bypassing)** | AI dùng `raise HTTPException(status_code=409, detail="...")` làm mất cấu trúc phong bì lỗi chuẩn CyberSoft. | Cho phép ngoại lệ `ImmutableArtifactError` bắn thẳng lên middleware `app.exception_handler` để xuất phong bì lỗi chuẩn. |
| **8** | **Bẫy Ảo Giác Nguồn Gốc (Hallucinated Provenance Trap)** | AI tự tạo các ID nguồn gốc không tồn tại trong danh mục tài nguyên. | Ràng buộc khóa ngoại logic: Kiểm tra sự tồn tại của `upstream_id` trong danh mục trước khi cho phép tạo cạnh quan hệ. |
| **9** | **Bẫy Rơi Rớt Từ Cấm (Forbidden Vocabulary Trap)** | AI tự động dịch các cụm từ tiếng Anh 'rollback scenario' thành thuật ngữ dịch thô không phù hợp. | Thiết lập kiểm tra linter tự động rà soát từ cấm trong toàn bộ mã nguồn, báo cáo và markdown. |
| **10**| **Bẫy Phụ Thuộc Mạng (Cloud Dependency Trap)** | AI gợi ý gọi API băm hoặc lưu trữ trên AWS S3 / Cloudflare R2. | Kiến trúc On-premise offline $100\%$ chạy trực tiếp trên máy chủ nội bộ với chi phí vận hành $0.00 USD. |

---

## 6. BỐN TẦNG NĂNG LỰC AI (FOUR TIERS OF AI CAPABILITY)

1. **Tầng 1: Hỗ trợ cú pháp & khung mã nguồn (Code Generation & Scaffolding)**:
   - AI hỗ trợ sinh nhanh khung Pydantic Schemas, cấu hình Router FastAPI và các mẫu giao diện HTML/CSS.
2. **Tầng 2: Tối ưu thuật toán & Kiểm thử tự động (Algorithmic & Test Optimization)**:
   - AI đề xuất thuật toán duyệt đồ thị BFS/DFS và hỗ trợ viết 24 trường hợp kiểm thử Pytest bao phủ các góc cạnh.
3. **Tầng 3: Thẩm định & Phản biện Kiến trúc (Architectural Review & Refinement)**:
   - Con người phản biện các đề xuất của AI về việc lưu trữ tập trung, ép chặt quy chuẩn WORM bất biến và kiểm soát sai lệch mã băm đa nền tảng.
4. **Tầng 4: Làm chủ & Định hướng Nghiệp vụ (Mastery & Pedagogical Alignment)**:
   - Con người hoàn toàn làm chủ hệ thống, quyết định cách liên kết nhân quả giữa học liệu Ngày 23 với các tài nguyên nền tảng từ Ngày 01 đến Ngày 22, bảo đảm tính sư phạm và an toàn tuyệt đối khi triển khai.
