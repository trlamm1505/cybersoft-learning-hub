# HƯỚNG DẪN ĐO LƯỜNG & ĐÁNH GIÁ (EVALUATION GUIDE)
## CAPSTONE AI-01: CYBERSOFT ENTERPRISE RAG SYSTEM

Tài liệu này giải thích chi tiết các công thức toán học và phương pháp luận đo lường độc lập hai tầng Retrieval và Generation.

---

## 1. ĐO LƯỜNG TẦNG TRUY XUẤT (RETRIEVAL METRICS)

### A. Recall@5
Tỷ lệ tài liệu hoặc điều khoản mục tiêu có xuất hiện trong Top-5 đoạn văn bản được truy xuất:
$$\text{Recall@5} = \frac{|\text{Retrieved@5} \cap \text{GroundTruth}|}{|\text{GroundTruth}|}$$
- Áp dụng trên 60 câu hỏi Answerable (40 Single-Hop và 20 Multi-Hop).
- Ngưỡng đạt điểm tối đa (15 điểm): $\text{Recall@5} \ge 0.80$.

### B. Mean Reciprocal Rank (MRR)
Đo lường vị trí (rank) của tài liệu đúng đầu tiên xuất hiện trong danh sách kết quả:
$$\text{MRR} = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \frac{1}{\text{rank}_i}$$
- Nếu tài liệu đúng nằm ở Top-1: Điểm = 1.0; Top-2: Điểm = 0.5; không xuất hiện: Điểm = 0.
- Ngưỡng đạt điểm tối đa (15 điểm): $\text{MRR} \ge 0.75$.

### C. Context Precision
Đo lường mức độ cô đọng và liên quan của các đoạn văn bản được nhồi vào Context Window:
$$\text{Context Precision} = \frac{\sum_{k=1}^{K} \text{Precision@}k \times \text{rel}(k)}{\text{Tổng số đoạn liên quan}}$$
- Ngưỡng đạt điểm tối đa (10 điểm): $\text{Context Precision} \ge 0.75$.

---

## 2. ĐO LƯỜNG TẦNG SINH (GENERATION METRICS)

### A. Faithfulness (Groundedness)
Đo lường xem câu trả lời có hoàn toàn dựa vào ngữ cảnh hay có chứa ảo giác (hallucination):
$$\text{Faithfulness} = \frac{\text{Số phát biểu có bằng chứng chứng minh trong Context}}{\text{Tổng số phát biểu quan trọng trong câu trả lời}}$$
- Ngưỡng đạt điểm tối đa (15 điểm): $\text{Faithfulness} \ge 0.85$.

### B. Answer Relevance
Đo lường độ tập trung vào câu hỏi, không lan man, không lặp lại:
- Ngưỡng đạt điểm tối đa (15 điểm): $\text{Answer Relevance} \ge 0.80$.

---

## 3. ĐO LƯỜNG TRÍCH DẪN & TỪ CHỐI (CITATION & ABSTAIN)

### A. Citation F1 Score
$$\text{Citation F1} = 2 \times \frac{\text{Citation Precision} \times \text{Citation Recall}}{\text{Citation Precision} + \text{Citation Recall}}$$
- Đo lường mức độ chính xác của các mã trích dẫn `[doc_id#section_id]`.
- Ngưỡng đạt điểm tối đa (8 điểm): $\text{Citation F1} \ge 0.80$.

### B. Abstain Accuracy
Tỷ lệ nhận diện và từ chối trả lời chính xác trên 40 câu hỏi Unanswerable và Adversarial:
$$\text{Abstain Accuracy} = \frac{\text{Số câu ngoài phạm vi được trả về đúng OUT\_OF\_SCOPE}}{40}$$
- Ngưỡng đạt điểm tối đa (7 điểm): $\text{Abstain Accuracy} \ge 0.85$.

---

## 4. HIỆU NĂNG & CHI PHÍ (PERFORMANCE & COST)
- **P95 Latency**: Bách phân vị thứ 95 của thời gian phản hồi toàn chu trình ($\le 1.500\text{ ms}$).
- **Cost per 1,000 Queries**: Ước tính chi phí dựa trên tổng token tiêu hao của Input và Output ($\le 0.050\text{ USD}$).
