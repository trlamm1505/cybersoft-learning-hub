# Từ điển Dữ liệu: RAG Evaluation Benchmark Schema

Tài liệu này đặc tả quy chuẩn cho bộ 100 câu hỏi đánh giá chất lượng hệ thống RAG (`rag_eval_questions.json` & `.csv`).

## Bảng Thuộc tính của Câu hỏi Đánh giá

| Thuộc tính | Kiểu dữ liệu | Bắt buộc | Mô tả & Mục đích Kiểm định |
| :--- | :--- | :---: | :--- |
| `question_id` | String | Có | Mã định danh câu hỏi từ `Q001` đến `Q100`. |
| `query` | String | Có | Câu hỏi tự nhiên của người dùng, độc lập, không chứa rò rỉ đáp án (Zero Answer Leakage). |
| `category` | String | Có | Nhóm chủ đề câu hỏi (`Academic Policy`, `Technical Guide`, `Curriculum`, `Academic FAQ`, `Out of Scope`). |
| `type` | String | Có | Loại câu hỏi: `Answerable - Single Hop` (40 câu), `Answerable - Multi Hop` (20 câu), `Unanswerable` (20 câu), `Adversarial / Distractor` (20 câu). |
| `reasoning_type`| String | Có | Kiểu tư duy yêu cầu: `Direct Factual Retrieval`, `Cross-Section Synthesis`, `Out-of-Scope / Absence Detection`, `Trap Identification / Boundary Correction`. |
| `expected_behavior`| String | Có | Hành vi kỳ vọng của mô hình ngôn ngữ khi nhận câu hỏi. |
| `ground_truth_answer`| String | Có | Câu trả lời chuẩn xác định bởi con người dựa trên tài liệu (hoặc lời từ chối nếu unanswerable). |
| `citations` | Array[Object]| Có | Danh sách trích dẫn bằng chứng gồm `document_id`, `section_id`, `text_citation` (rỗng đối với câu Unanswerable). |
| `reasoning` | String | Có | Diễn giải lý do vì sao câu trả lời và trích dẫn được lựa chọn. |
| `anti_leakage_verified`| Boolean | Có | Cờ xác nhận câu hỏi đã vượt qua bộ lọc kiểm tra chống rò rỉ đáp án tự động (`true`). |
