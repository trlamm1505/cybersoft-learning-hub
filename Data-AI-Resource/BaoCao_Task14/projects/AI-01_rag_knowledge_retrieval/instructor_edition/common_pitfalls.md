# CẨM NANG 8 BẪY LỖI KINH ĐIỂN TRONG RAG (COMMON PITFALLS IN RAG PIPELINE)
## CAPSTONE AI-01: CYBERSOFT ENTERPRISE KNOWLEDGE RETRIEVAL

Tài liệu này được biên soạn dành riêng cho Giảng viên và Trợ giảng để nhận diện, đánh giá và hướng dẫn học viên vượt qua 8 sai lầm thường gặp nhất khi xây dựng hệ thống RAG thực tế.

---

### 1. BẪY PHÂN ĐOẠN ĐỨT GÃY NGỮ CẢNH (NAIVE CHARACTER CHUNKING PITFALL)
* **Hiện tượng**: Học viên sử dụng hàm `split()` thô hoặc cắt cố định 500 ký tự với overlap 50 ký tự.
* **Hậu quả**: Trong các văn bản quy chế pháp lý, một điều khoản có cấu trúc: Tiêu đề điều khoản -> Điều kiện được hưởng -> Trường hợp loại trừ. Khi cắt cứng theo số ký tự, điều kiện loại trừ (ví dụ "Không áp dụng cho học viên nhận học bổng trên 50%") bị rơi sang chunk tiếp theo. Kết quả là mô hình trả lời học viên nào cũng được hoàn phí.
* **Khắc phục chuẩn**: Áp dụng **Section-aware / Markdown Header Chunking**. Sử dụng biểu thức chính quy tách theo `#`, `##`, `###` để mỗi chunk là một điều khoản hoàn chỉnh gắn kèm metadata (`doc_id`, `section_id`).

---

### 2. BẪY THẤT BẠI KHI CHỈ DÙNG VECTOR NGỮ NGHĨA (DENSE-ONLY RETRIEVAL PITFALL)
* **Hiện tượng**: Học viên chỉ sử dụng mô hình embedding (như text-embedding-ada-002 hoặc sentence-transformers) để tính Cosine Similarity mà không dùng tìm kiếm từ khóa.
* **Hậu quả**: Các câu truy vấn chứa mã định danh kỹ thuật (`SEC-POL-001-01`, `CS-TEC-004`), số tiền cụ thể (`500.000 VNĐ`), hoặc công nghệ mã hóa (`SHA-256`, `Docker Compose`) thường bị vector ngữ nghĩa làm mờ nhạt (semantic blur). Mô hình tìm ra các đoạn văn chung chung về học phí thay vì điều khoản chính xác.
* **Khắc phục chuẩn**: Xây dựng **Hybrid Retrieval** kết hợp BM25 (tìm kiếm từ khóa và mã định danh chính xác) và Dense Vector (nắm bắt ý định ngữ nghĩa).

---

### 3. BẪY "MẤT THÔNG TIN Ở GIỮA" (LOST IN THE MIDDLE PHENOMENON)
* **Hiện tượng**: Khi truy xuất Top-5 hoặc Top-10 chunks, học viên xếp thẳng hàng các chunk theo thứ tự điểm số giảm dần đưa vào prompt.
* **Hậu quả**: Các nghiên cứu về LLM chứng minh mô hình chú ý mạnh nhất ở phần đầu và phần cuối của Context Window, và dễ "quên" các đoạn văn nằm ở giữa. Nếu bằng chứng then chốt nằm ở Chunk thứ 3 hoặc thứ 4, LLM rất dễ bỏ sót hoặc suy đoán sai.
* **Khắc phục chuẩn**: Áp dụng kỹ thuật sắp xếp lại vị trí ngữ cảnh (Context Re-ordering): Đưa chunk quan trọng nhất (Rank 1) lên đầu, chunk quan trọng thứ nhì (Rank 2) xuống cuối cùng, và các chunk còn lại ở giữa.

---

### 4. BẪY ẢO GIÁC DO THIẾU NGƯỠNG TỪ CHỐI (NO ABSTENTION GUARDRAIL)
* **Hiện tượng**: Hệ thống không kiểm tra độ tự tin của tài liệu truy xuất và prompt không có ràng buộc nghiêm ngặt, cố gắng trả lời 100% câu hỏi.
* **Hậu quả**: Khi gặp 40 câu hỏi Unanswerable (hỏi về chứng chỉ lái xe, chính sách học bổng Harvard) hoặc Adversarial (chứa tiền đề sai: "CyberSoft cam kết hoàn tiền 100% sau khi học xong 90% đúng không?"), hệ thống tự suy diễn và tạo ra thông tin giả mạo nguy hiểm.
* **Khắc phục chuẩn**: Thiết lập ngưỡng tương đồng tự tin (`confidence_threshold < 0.35`) và chỉ thị bắt buộc trong System Prompt: Nếu không có bằng chứng, phải trả về chính xác token `OUT_OF_SCOPE: Không tìm thấy thông tin phù hợp trong tài liệu quy chế nội bộ CyberSoft.`

---

### 5. BẪY CỘNG ĐIỂM THÔ KHI LAI TÌM KIẾM (RAW SCORE ADDITION INSTEAD OF RRF)
* **Hiện tượng**: Học viên cộng trực tiếp điểm số BM25 và điểm Cosine Similarity: `Score = BM25_score + Vector_score`.
* **Hậu quả**: Điểm BM25 có thể dao động từ 0 đến 25+, trong khi Cosine Similarity chỉ nằm trong khoảng 0 đến 1. Điểm BM25 hoàn toàn áp đảo điểm ngữ nghĩa, khiến việc tìm kiếm lai trở thành tìm kiếm từ khóa đơn thuần.
* **Khắc phục chuẩn**: Sử dụng **Reciprocal Rank Fusion (RRF)** chuẩn quốc tế:
  $$RRF\_Score(d) = \sum_{m} \frac{1}{60 + \text{rank}_m(d)}$$
  RRF chuẩn hóa thứ hạng thay vì điểm số, triệt tiêu sự chênh lệch đơn vị đo lường.

---

### 6. BẪY NHỒI NGỮ CẢNH GÂY BÙNG NỔ CHI PHÍ VÀ ĐỘ TRỄ (CONTEXT WINDOW STUFFING)
* **Hiện tượng**: Học viên lo sợ thiếu thông tin nên nhồi Top-20 hoặc Top-30 chunks vào Prompt.
* **Hậu quả**: Thời gian xử lý P95 vọt lên hơn 3.000 ms (vượt quá ngưỡng cho phép 1.500 ms), chi phí token tăng gấp 5 lần (vượt ngưỡng 0.050 USD / 1,000 lượt hỏi), đồng thời tăng nguy cơ gây nhiễu cho bộ sinh.
* **Khắc phục chuẩn**: Tối ưu hóa Top-k cô đọng ($k = 3 \text{ đến } 5$), đo lường Context Precision để đảm bảo chỉ đưa các đoạn văn có giá trị thông tin cao vào prompt.

---

### 7. BẪY TRÍCH NGUỒN MA HOẶC TRÍCH NGUỒN TỰ SUY (BROKEN / PHANTOM CITATION)
* **Hiện tượng**: LLM tự sáng tác ra các mã điều khoản không tồn tại (ví dụ: `[CS-RULE-999]`), hoặc chỉ trích dẫn tên tài liệu chung chung (`[CS-POL-001]`) mà không chỉ rõ điều khoản `[SEC-POL-001-02]`.
* **Hậu quả**: Học viên bị trừ toàn bộ 8 điểm ở tiêu chí `CIT-01`.
* **Khắc phục chuẩn**: Đính kèm tường minh metadata `doc_id` và `section_id` vào từng chunk được truyền vào prompt, và ép buộc mô hình định dạng bằng biểu thức chính quy mẫu.

---

### 8. BẪY RÒ RỈ THÔNG TIN GROUND TRUTH (ANSWER LEAKAGE IN PROMPTS / REPO)
* **Hiện tượng**: Đưa câu trả lời mẫu hoặc danh sách câu hỏi kiểm thử kèm nhãn vào thư mục phát cho học viên (`student_edition`).
* **Hậu quả**: Phá vỡ tính toàn vẹn của bài đánh giá, học viên có thể ghi nhớ máy móc (memorization) thay vì giải quyết bài toán kỹ thuật.
* **Khắc phục chuẩn**: Tuân thủ tuyệt đối quy trình **Zero Answer Leakage**: Tách biệt hoàn toàn `test_queries.json` (chỉ chứa query) trong student edition và `ground_truth_eval.json` trong instructor edition.
