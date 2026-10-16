# Báo Cáo Đối Chứng Hồi Quy & Đánh Giá Chất Lượng RAG (Task 20)

### 🟢 CI QUALITY GATE: PASSED (ALL CRITERIA SATISFIED)

- **Trạng thái Build:** `Exit Code 0` (SUCCESS)
- **Số tiêu chí đạt:** `7/7`
- **Phiên bản Baseline:** `v0.1-baseline` (2026-09-20T10:00:00Z)
- **Phiên bản Current:** `v1.0-current` (2026-09-29T17:11:05Z)
- **Tập dữ liệu đánh giá:** `30 queries`

## 1. Bảng Đối Soát Tiêu Chí CI Quality Gate

| Tiêu chí Kiểm định | Điều kiện Chấp nhận | Baseline | Current | Độ lệch ($\Delta$) | Kết quả |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Recall@5 Regression | `Delta >= -3.0%` | 0.8125 | 1.0000 | `+0.1875` | ✅ **PASS** |
| MRR (Mean Reciprocal Rank) | `Delta >= -0.05` | 0.7241 | 1.0000 | `+0.2759` | ✅ **PASS** |
| Citation Precision | `Current >= 0.95` | 0.8421 | 1.0000 | `+0.1579` | ✅ **PASS** |
| Hallucinated Citations Count | `Current <= 0` | 6.0000 | 0.0000 | `-6.0000` | ✅ **PASS** |
| Groundedness Score | `Current >= 0.85` | 0.8250 | 0.8867 | `+0.0617` | ✅ **PASS** |
| Abstention Accuracy | `Current >= 0.90` | 0.7500 | 1.0000 | `+0.2500` | ✅ **PASS** |
| Latency p95 (ms) | `Current <= 100.0ms` | 85.2000 | 38.2900 | `-46.9100` | ✅ **PASS** |

## 2. Chi Tiết So Sánh Các Trụ Cột Đánh Giá

### A. Trụ cột Truy xuất (Retrieval Performance)
- **Recall@5:** Cải thiện từ `81.25%` lên `100.00%` (nhờ cơ chế Hybrid Search kết hợp BM25 + Vector và Reranking).
- **MRR:** Tăng từ `0.7241` lên `1.0000`, giúp đưa tài liệu liên quan nhất lên vị trí Top-1.

### B. Trụ cột Sinh & Kiểm soát (Generation & Guardrails)
- **Citation Precision:** Đạt `100.00%` (so với Baseline chỉ đạt `84.21%`).
- **Hallucinated Citations:** Giảm triệt để về `0` ca (Baseline tồn tại `6` ca trích dẫn ma).
- **Groundedness Score:** Đạt `88.67%` (đánh giá theo Rubric LLM-as-judge 5 mức độ).
- **Abstention Accuracy:** Đạt `100.00%` trên 8 ca ngoài phạm vi và 3 ca tấn công đối kháng.

### C. Hiệu năng Vận hành (Operational SLA)
- **Độ trễ trung bình:** `23.24 ms`
- **Độ trễ phân vị p50:** `22.16 ms`
- **Độ trễ phân vị p95:** `38.29 ms` (đáp ứng SLA < 100ms)
- **Chi phí ước tính:** `$0.00 USD` (chạy hoàn toàn trên CPU cục bộ)

---
*Báo cáo được khởi tạo tự động bởi RAG Evaluation Harness v1.0 — CyberSoft Data & AI Lab.*
