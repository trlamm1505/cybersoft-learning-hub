# DANH MỤC KIỂM TRA BÀI NỘP (SUBMISSION CHECKLIST)
## CAPSTONE AI-01: CYBERSOFT ENTERPRISE RAG SYSTEM

Trước khi nộp bài và chạy máy chấm tự động `auto_grader.py`, học viên vui lòng đối chiếu toàn bộ các hạng mục dưới đây:

### 1. Cấu trúc mã nguồn & Tệp bàn giao
- [ ] Tệp pipeline chính: `rag_pipeline.py` có khả năng chạy độc lập từ CLI không báo lỗi import.
- [ ] Hỗ trợ cả 2 chế độ: `--mode baseline` và `--mode advanced`.
- [ ] Đã chạy đánh giá trên 100 câu truy vấn và sinh tệp `submission_report.json`.
- [ ] Đã hoàn thành bản ghi nhớ `executive_memo.md` (2-3 trang) giải thích thiết kế và phân tích đánh đổi.

### 2. Tiêu chí kỹ thuật bắt buộc
- [ ] **Tách biệt Ingest & Chunking**: Có thuật toán Section-aware Chunking cho mode advanced, giữ lại metadata `doc_id` và `section_id`.
- [ ] **Hybrid Retrieval**: Mode advanced có kết hợp tối thiểu 2 cơ chế (Sparse BM25/TF-IDF và Dense Similarity) bằng thuật toán tổng hợp thứ hạng RRF.
- [ ] **Định dạng trích dẫn**: 100% câu hỏi có thông tin trả lời đều kèm trích dẫn chuẩn `Nguồn: [doc_id#section_id]`.
- [ ] **Cơ chế từ chối (Abstention Guardrail)**: Khi gặp 40 câu hỏi Unanswerable hoặc Adversarial, hệ thống xuất đúng thông báo chuẩn `OUT_OF_SCOPE: Không tìm thấy thông tin phù hợp trong tài liệu quy chế nội bộ CyberSoft.` mà không bịa đặt.
- [ ] **Hiệu năng & Chi phí**: Độ trễ P95 toàn chu trình không vượt quá 1.500 ms và ngân sách token ước tính dưới 0.050 USD / 1,000 queries.

### 3. Nguyên tắc trung thực & Bảo mật
- [ ] Đảm bảo không sử dụng hardcode ID câu hỏi hay câu trả lời có sẵn trong mã nguồn.
- [ ] Máy chấm tự động sẽ kiểm thử trên cả tập test ẩn ngẫu nhiên để phát hiện bẫy overfitting.
