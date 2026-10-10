# Cơ chế Chống Rò rỉ Đáp án (Anti-Leakage) và Phòng thủ Ảo giác (Negative Sampling Defense)

Bản tài liệu phân tích sâu hai kỹ thuật cốt lõi bảo đảm tính tin cậy tuyệt đối của bộ dữ liệu RAG Benchmark tại CyberSoft.

## 1. Cơ chế Chống Rò rỉ Đáp án (Zero Answer Leakage)

### Vấn đề thường gặp trong thiết kế Benchmark AI
Nhiều tập dữ liệu RAG bị lỗi thiết kế khi câu hỏi chứa nguyên văn cụm từ khóa hiếm của đáp án hoặc bao gồm luôn câu trả lời bên trong prompt (Ví dụ bẩn: *"Học viên được bảo lưu tối đa 6 tháng phải không?"*). Lỗi này khiến Retriever dễ dàng đạt điểm cao giả tạo (False High Precision) do trùng khớp từ khóa cơ học (n-gram overlap).

### Giải pháp Kỹ thuật Triệt để tại CyberSoft
1. **Diễn đạt câu hỏi mở (Open-ended Inquiry)**: Đặt câu hỏi theo ngữ cảnh người dùng cần trợ giúp (Ví dụ: *"Thời gian bảo lưu tối đa cho một khóa học là bao lâu?"* thay vì đưa con số 6 tháng vào câu hỏi).
2. **Loại trừ Metadata ID trong Prompt**: Câu hỏi người dùng không bao giờ chứa mã số nội bộ như `SEC-POL-001-01` hay số hiệu mẫu đơn `CS-F-01` làm chỉ dẫn truy xuất.
3. **Bộ quét Tự động Regex (Anti-Leakage Linter)**: Script kiểm thử tự động quét đối soát giữa `query` và `ground_truth_answer` để bảo đảm độ dài trùng lặp ký tự liên tiếp không vượt ngưỡng cho phép.

## 2. Phòng thủ Ảo giác bằng Bộ Mẫu Âm (Negative Examples Defense)

```
+-------------------------------------------------------------+
|                PHÂN LOẠI 100 CÂU HỎI BENCHMARK              |
+-------------------------------------------------------------+
| [40% Single-Hop]    -> Kiểm tra Năng lực Truy xuất Chuẩn xác  |
| [20% Multi-Hop]     -> Kiểm tra Khả năng Tổng hợp Đa văn bản  |
| [20% Unanswerable]  -> Chốt chặn Phòng vệ Chống Ảo giác      |
| [20% Distractor]    -> Chốt chặn Phân định Ranh giới Giả định |
+-------------------------------------------------------------+
```

- **Nhóm 20 Câu Unanswerable**: Các câu hỏi rất hợp lý về mặt ngôn ngữ (trả góp 36 tháng, học phí điện toán lượng tử, du học 5 năm) nhưng không có trong tri thức trung tâm. Mô hình bắt buộc phải trả về câu trả lời chuẩn: *"Tài liệu CyberSoft không đề cập hoặc chưa ban hành quy định này..."*, tuyệt đối cấm bịa đặt (Zero Hallucination).
- **Nhóm 20 Câu Distractor**: Các câu hỏi gài bẫy con số biên (10% vs 20%, 500k lần 1 vs lần 2, 6.8 vs 7.0 điểm). Mô hình phải đủ năng lực chỉ ra tiền đề sai của người dùng và đính chính dựa trên tài liệu trích dẫn.
