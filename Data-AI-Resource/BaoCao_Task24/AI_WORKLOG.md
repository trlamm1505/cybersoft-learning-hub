# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 24
## DỰ ÁN: CYBERSOFT DATA & AI LAB — HỆ THỐNG THEO DÕI NGUỒN GỐC DỮ LIỆU & QUẢN LÝ PHIÊN BẢN (LINEAGE & WORM STORE v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 24 — Theo dõi lineage và phiên bản (`cybersoft-lineage-tracker`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-02  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Bước sang Ngày 24 của Tuần 5 (Sản phẩm hóa), hệ sinh thái CyberSoft Data & AI Lab đã sở hữu một khối lượng tài nguyên học liệu lớn và đa dạng sau 23 ngày xây dựng (Datasets đa bảng 3NF, Prompts thang Bloom, Checkpoints Embedder/LLM, Chỉ mục FAISS/BM25, Bộ benchmark 100 câu hỏi và Ngân hàng 20 bài tập thực hành đã qua Giảng viên phê duyệt).

Trước khi ứng dụng AI để tự động hóa, phân hệ phải đối mặt với 4 bài toán kỹ thuật trọng yếu:
1. **Mất dấu vết nguồn gốc (Provenance Loss & Orphan Artifacts)**: Khi học viên làm một bài tập hoặc hệ thống trả về một kết quả đánh giá, không có cơ chế nào để giải trình và truy ngược chính xác bài tập đó được sinh ra từ những bộ dữ liệu gốc nào, sử dụng mẫu prompt nào và dựa trên checkpoint mô hình AI phiên bản bao nhiêu.
2. **Rủi ro ghi đè phá hủy lịch sử (Destructive Overwrite Hazard)**: Khi kỹ sư tinh chỉnh prompt hoặc cập nhật bảng dữ liệu, việc ghi đè lên tài nguyên cũ sẽ phá hủy tính tái lập (Reproducibility), làm sai lệch kết quả kiểm thử hồi quy của học viên và vi phạm kỷ luật quản trị dữ liệu. Cần thiết lập cơ chế lưu trữ bất biến Write-Once-Read-Many (WORM Storage).
3. **Mơ hồ trong đóng gói phát hành (Unverified Release Packaging)**: Việc bàn giao tài nguyên sang Tuần 6 nếu chỉ dùng các tệp nén zip đơn thuần sẽ không thể kiểm chứng tính toàn vẹn (Integrity). Cần một Bản đồ Phát hành (Release Manifest) với mã băm toàn vẹn (holistic checksum) để phát hiện tức thì mọi can thiệp trái phép.
4. **Quy trình ngừng hỗ trợ tùy tiện (Uncontrolled Deprecation)**: Khi nâng cấp tài nguyên mới (ví dụ từ `v1.0.0` lên `v1.1.0`), các tài nguyên cũ thường bị bỏ rơi hoặc xóa vội, gây đổ vỡ cho các ứng dụng hạ nguồn. Cần một Máy trạng thái vòng đời minh bạch (DRAFT ➔ ACTIVE ➔ DEPRECATED ➔ RETIRED) kèm ngày hết hạn (`sunset_date`), tài nguyên thay thế và tài liệu Hướng dẫn hoàn tác (Rollback Note) bảo đảm an toàn.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI (HUMAN-IN-THE-LOOP)

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning, DAG traversal algorithms & schema design).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI giữ vai trò Kỹ sư Nền tảng dữ liệu (Data Platform Assistant): Đề xuất thuật toán duyệt đồ thị DAG, gợi ý cấu trúc mã băm SHA-256 xác định và sinh mã khung Pydantic schemas/FastAPI endpoints.
  * Kỹ sư con người (Đào Trung Kiên) giữ vai trò Kiến trúc sư Trưởng (Lead Architect): Kiểm duyệt từng dòng code, triệt tiêu bẫy đột biến dòng Windows CRLF, chặn đứng việc dùng cờ ghi đè, thiết lập chốt chặn HTTP 409 Conflict cho kho WORM, độc lập kiểm thử và thẩm định toàn bộ 24/24 bài test Pytest.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề Xuất Ban Đầu Của AI | Phân Tích Rủi Ro & Điểm Bất Hợp Lý | Quyết Định & Tinh Chỉnh Của Kỹ Sư Con Người |
| :---: | :--- | :--- | :--- |
| **01** | Lưu toàn bộ cấu trúc Lineage DAG vào một hệ quản trị cơ sở dữ liệu quan hệ SQL bên ngoài (PostgreSQL). | Gây phụ thuộc dịch vụ ngoài, phức tạp hóa việc triển khai On-premise và không thể phân phối đóng gói offline nhẹ nhàng cho học viên. | **Bác bỏ & Thiết kế JSON Graph phi tập trung**: Sử dụng cấu trúc thư mục phân vùng WORM và tệp `lineage_graph.json` chạy On-premise 100% offline, chi phí vận hành $0.00 USD. |
| **02** | Sử dụng mã Git Commit SHA làm định danh duy nhất cho từng phiên bản artifact. | Học viên hoặc môi trường staging có thể chạy từ tệp giải nén ZIP hoặc container không có Git metadata, dẫn tới mất dấu vết định danh. | **Bác bỏ & Chuẩn hóa SemVer + SHA-256**: Định danh tài nguyên qua bộ ba `{type}/{name}/{version}` kết hợp mã băm SHA-256 tính trực tiếp từ nội dung tệp nhị phân (payload). |
| **03** | Cho phép ghi đè tệp `metadata.json` khi có bản cập nhật nhỏ của cùng phiên bản. | Vi phạm trực tiếp nguyên tắc bất biến WORM (Write-Once-Read-Many), phá vỡ tính toàn vẹn của lịch sử phát hành. | **Bác bỏ triệt để**: Cấm tuyệt đối hành vi ghi đè; nếu siêu dữ liệu hoặc payload thay đổi, bắt buộc phải tăng mã phiên bản Semantic Versioning (`v1.1.0`). |
| **04** | Ghi tệp văn bản bằng phương thức thông thường `payload_file.write_text(content)`. | Trên hệ điều hành Windows, hàm này tự động chuyển đổi ký tự xuống dòng `\n` thành `\r\n` (CRLF), làm sai lệch mã băm SHA-256 khi kiểm thử chéo nền tảng. | **Hiệu chỉnh ghi nhị phân `write_bytes()`**: Ép chuẩn hóa chuỗi `content.replace('\r\n', '\n')` và ghi trực tiếp bằng mảng byte nhị phân để bảo toàn mã băm đa nền tảng. |
| **05** | Xóa vật lý tệp cũ trên đĩa khi một tài nguyên chuyển sang trạng thái `DEPRECATED`. | Phá hủy tính tái lập (Reproducibility), khiến các bài nộp cũ của học viên ở Ngày 23 không còn dữ liệu nguồn để đối soát. | **Bác bỏ & Bảo lưu vĩnh viễn**: Giữ nguyên 100% payload trên kho WORM; chỉ chuyển cờ trạng thái `state: deprecated` trong metadata và ghi nhận lý do thay thế. |
| **06** | Dùng thuật toán đệ quy DFS ngây thơ từ nút đích để tìm đường dẫn trên DAG. | Nguy cơ tràn ngăn xếp (RecursionError) nếu đồ thị có chu trình phức tạp hoặc số nút gia tăng trong tương lai. | **Kết hợp thuật toán 2 pha BFS + DFS**: Pha 1 dùng BFS thu thập tập hợp tổ tiên hữu hạn (Ancestors Set), Pha 2 dùng DFS có memoization để truy xuất toàn bộ 11 đường dẫn nhân quả. |
| **07** | Trả về mã lỗi HTTP `500 Internal Server Error` khi người dùng cố tình ghi đè tài nguyên đã tồn tại. | Mã lỗi 500 là lỗi sập máy chủ không mong muốn, vi phạm nguyên tắc thiết kế RESTful API chuẩn mực. | **Chuẩn hóa HTTP `409 Conflict`**: Bắt ngoại lệ `ImmutableArtifactError` và phản hồi mã lỗi `409 Conflict` kèm mã nghiệp vụ `IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED`. |
| **08** | Cho phép để trống ngày hết hạn khi Deprecate tài nguyên. | Không có mốc thời gian chuyển đổi cụ thể, gây mơ hồ và rủi ro đổ vỡ cho các ứng dụng hạ nguồn. | **Ràng buộc Pydantic Validator**: Bắt buộc nhập `sunset_date` hợp lệ (ISO 8601), lý do `deprecation_reason` và tài nguyên thay thế `superseded_by`. |
| **09** | Sử dụng các thuật ngữ dịch thô như "kịch bản rollback", "kịch bản hoàn tác" trong tài liệu. | Vi phạm quy chuẩn văn phong kỹ thuật của CyberSoft (chứa từ cấm đối soát tự động). | **Loại bỏ triệt để từ cấm**: Rà soát và chuẩn hóa thành "Hướng dẫn hoàn tác", "Quy trình khôi phục", "Kế hoạch hoàn tác an toàn" (0 từ cấm). |
| **10** | Chỉ viết kiểm thử Unit Test cục bộ trên các hàm nội bộ của service. | Không bảo đảm tính toàn vẹn của hợp đồng tích hợp hệ thống khi gọi qua mạng HTTP. | **Bao phủ toàn diện 24/24 tests Pytest**: Kiểm thử từ tầng WORM Store, thuật toán đồ thị, đóng gói manifest, diff changelog đến trọn vẹn RESTful API endpoints. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy Đột biến Dòng Mới trên Windows (CRLF Newline Mutation Trap)**: AI tự ý dùng chế độ ghi text thông thường khiến Windows biến đổi `\n` thành `\r\n`, làm sai lệch mã băm SHA-256. *Cách phòng vệ*: Luôn encode `utf-8` và ghi nhị phân bằng `write_bytes()`.
2. **Bẫy Đường dẫn Đa Ổ Đĩa (Cross-drive Path Trap)**: AI dùng `path.relative_to(base_dir)` gây lỗi sập `ValueError` khi Pytest chạy trên thư mục tạm ổ `C:\` trong khi repo nằm tại `D:\`. *Cách phòng vệ*: Bổ sung khối `try...except ValueError` để xử lý đường dẫn tương đối an toàn.
3. **Bẫy Nuốt Ngoại Lệ Âm Thầm (Exception Masking Trap)**: AI viết `except Exception: pass` trong các hàm đọc manifest khiến lỗi cú pháp JSON bị bỏ lọt. *Cách phòng vệ*: Bắt chính xác `json.JSONDecodeError` và ghi log cảnh báo chi tiết.
4. **Bẫy Chu trình Ẩn trong Đồ thị (Hidden Cyclic Dependency Trap)**: AI cho phép một tài nguyên mới tạo cạnh phụ thuộc ngược lại con cháu của nó. *Cách phòng vệ*: Cài đặt thuật toán kiểm tra tính chất phi chu trình DAG trước khi thêm cạnh quan hệ.
5. **Bẫy Mã Băm Không Xác Định (Non-deterministic Hash Trap)**: AI tính mã băm trên dictionary Python không sắp xếp thứ tự khóa, khiến mã băm toàn vẹn bị thay đổi ngẫu nhiên giữa các lần chạy. *Cách phòng vệ*: Sắp xếp danh sách khóa theo bảng chữ cái (`sorted()`) trước khi tính SHA-256.
6. **Bẫy Phá Vỡ Tính Bất Biến (Immutability Bypass Trap)**: AI đề xuất thêm tham số `force_overwrite=True` để tiện viết test. *Cách phòng vệ*: Kiên quyết từ chối cờ này; trong kho lưu trữ WORM, nguyên tắc bất biến là tuyệt đối và không có ngoại lệ.
7. **Bẫy Nuốt Phong Bì Lỗi Đồng Nhất (Error Envelope Bypassing)**: AI dùng `raise HTTPException(status_code=409, detail="...")` làm mất cấu trúc phong bì lỗi chuẩn CyberSoft. *Cách phòng vệ*: Bắn ngoại lệ tùy biến `ImmutableArtifactError` lên `app.exception_handler` để xuất phong bì lỗi chuẩn.
8. **Bẫy Ảo Giác Nguồn Gốc (Hallucinated Provenance Trap)**: AI tự tạo các ID nguồn gốc không có thật trong danh mục tài nguyên. *Cách phòng vệ*: Ràng buộc khóa ngoại logic: Kiểm tra sự tồn tại của `upstream_id` trong catalog trước khi thiết lập quan hệ.
9. **Bẫy Rơi Rớt Từ Cấm (Forbidden Vocabulary Trap)**: AI tự động dịch các cụm từ tiếng Anh 'rollback scenario' thành thuật ngữ dịch thô. *Cách phòng vệ*: Thiết lập script kiểm tra linter tự động rà soát từ cấm trong toàn bộ mã nguồn, báo cáo và markdown.
10. **Bẫy Phụ Thuộc Điện Toán Đám Mây (Cloud Dependency Trap)**: AI gợi ý lưu trữ manifest trên AWS S3 hoặc cơ sở dữ liệu cloud. *Cách phòng vệ*: Thiết kế giải pháp On-premise offline $100\%$ chạy trực tiếp trên máy chủ nội bộ với chi phí vận hành $0.00 USD.

---

## 5. BỐN TẦNG NĂNG LỰC ỨNG DỤNG AI (THE FOUR TIERS OF AI MASTERY)

Trong quá trình thực hiện Task 24, tôi đã vận dụng nhuần nhuyễn mô hình Bốn Tầng Năng Lực AI:
- **Tầng 1 — Trợ lý cú pháp (Syntax Assistant)**: Sử dụng AI để sinh nhanh các mẫu khai báo Pydantic schemas (ArtifactMetadata, ReleaseManifest, LineageDAG), các hàm toán học băm SHA-256 và cấu trúc giao diện HTML/CSS Web Explorer.
- **Tầng 2 — Tăng tốc sinh mã khung (Scaffolding Acceleration)**: Dùng AI hỗ trợ dựng khung router FastAPI (`/lineage`, `/releases`, `/lifecycle`), các hàm tính toán khác biệt phiên bản ChangelogDiffer và bộ khung test cases Pytest ban đầu.
- **Tầng 3 — Thẩm định & Phản biện kỹ thuật (Critical Architecture Review)**: Bác bỏ việc dùng cơ sở dữ liệu SQL ngoài; phát hiện và triệt tiêu bẫy đột biến dòng Windows CRLF; xử lý lỗi đa ổ đĩa khi chạy Pytest; khóa cứng điều kiện nghiệm thu DoD bằng mã lỗi HTTP 409 Conflict.
- **Tầng 4 — Điều phối hệ sinh thái & Làm chủ giải pháp (Ecosystem Orchestration)**: Tự tay kết nối toàn bộ chu trình từ WORM Store, Lineage DAG Engine, Manifest Builder, Deprecation State Machine đến Web Lineage Explorer SPA; hoàn thành xuất sắc 24/24 bài test tự động và độc lập thẩm định kỹ thuật toàn diện.

---

## 6. LỖI KỸ THUẬT PHÁT SINH, NGUYÊN NHÂN GỐC RỄ & CÁCH KHẮC PHỤC (DEBUGGING & RESOLUTION)

### Sự cố 1: Lỗi `ValueError: path is on mount 'C:', start on mount 'D:'` khi chạy Pytest trên Windows
- **Hiện tượng**: Khi chạy bộ kiểm thử `test_immutable_store.py` với fixture `tmp_path` của Pytest, hàm tính đường dẫn tương đối bị crash với ngoại lệ `ValueError`.
- **Nguyên nhân gốc rễ**: Thư viện `pathlib.Path.relative_to()` trên Windows không thể tính toán khoảng cách tương đối giữa hai đường dẫn nằm trên hai ổ đĩa logic khác nhau (ổ `C:\Users\...` của tmp_path và ổ `D:\Cybersoft\...` của repository).
- **Giải pháp xử lý**: Bổ sung khối xử lý ngoại lệ `try...except ValueError`: Nếu hai đường dẫn khác ổ đĩa, hệ thống linh hoạt sử dụng đường dẫn chuỗi POSIX chuẩn hóa hoặc đường dẫn tuyệt đối, giúp bộ test chạy mượt mà trên mọi môi trường máy trạm.

### Sự cố 2: Lệch mã băm SHA-256 do Windows tự động chuyển đổi ký tự xuống dòng (CRLF Mutation)
- **Hiện tượng**: Một số tệp dữ liệu văn bản khi ghi xuống đĩa rồi đọc lại để kiểm tra toàn vẹn băm SHA-256 bị sai lệch mã hash so với giá trị tính toán ban đầu trong bộ nhớ.
- **Nguyên nhân gốc rễ**: Chế độ ghi văn bản mặc định `write_text()` trên Windows tự động biên dịch ký tự xuống dòng chuẩn Unix `\n` thành cặp ký tự `\r\n` (Carriage Return + Line Feed), làm thay đổi kích thước và chuỗi byte nhị phân của tệp.
- **Giải pháp xử lý**: Ép chuẩn hóa chuỗi `content.replace('\r\n', '\n')` trước khi encode UTF-8 và ghi trực tiếp bằng phương thức nhị phân `write_bytes()`. Kết quả mã băm SHA-256 bất biến $100\%$ trên mọi hệ điều hành.

### Sự cố 3: Lỗi HTTPException 409 bị thiếu cấu trúc Uniform Error Envelope của CyberSoft
- **Hiện tượng**: Khi gọi endpoint đăng ký tài nguyên trùng lặp để kiểm tra tính bất biến, phản hồi HTTP 409 trả về dạng `{"detail": "..."}` thay vì phong bì lỗi chuẩn mực của Lab `{"success": false, "error": {...}}`.
- **Nguyên nhân gốc rễ**: Việc ném trực tiếp `HTTPException` từ tầng route làm bỏ qua middleware exception handler tùy biến của ứng dụng FastAPI.
- **Giải pháp xử lý**: Cho phép ngoại lệ nghiệp vụ `ImmutableArtifactError` bắn thẳng lên bộ xử lý ngoại lệ tập trung `app.exception_handler(ImmutableArtifactError)` trong `src/main.py`. Phản hồi trả về đạt chuẩn $100\%$ phong bì lỗi đồng nhất với mã lỗi `IMMUTABLE_ARTIFACT_OVERWRITE_BLOCKED`.
