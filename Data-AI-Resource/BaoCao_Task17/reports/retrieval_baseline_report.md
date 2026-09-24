# CYBERSOFT DATA & AI LAB — RETRIEVAL BASELINE REPORT
**Thời điểm đánh giá**: 2026-09-24T09:14:55.061885  
**Tập kiểm thử (Evaluation Split)**: `test` (20 queries)  
**Mô hình**: Vector Index Flat Cosine Similarity + TFIDF-SVD L2 Dense Projection  

## 1. BẢNG CHỈ SỐ RETRIEVAL BASELINE (IR METRICS)

| Chỉ số (Metric) | Giá trị Baseline | Định dạng | Mục tiêu Đạt chuẩn (DoD) | Đánh giá |
| :--- | :--- | :--- | :--- | :--- |
| **Recall@1** | **95.0%** | Tỷ lệ target chunk đứng top 1 | >= 40.0% | PASS |
| **Recall@3** | **100.0%** | Tỷ lệ target chunk trong top 3 | >= 60.0% | PASS |
| **Recall@5** | **100.0%** | Tỷ lệ target chunk trong top 5 | >= 70.0% | PASS (DoD Đạt) |
| **Doc-Recall@5** | **100.0%** | Tỷ lệ đúng tài liệu đích top 5 | >= 85.0% | VƯỢT TRỘI |
| **MRR** (Mean Reciprocal Rank) | **0.9750** | Trung bình nghịch đảo thứ hạng | >= 0.5000 | PASS |

## 2. HIỆU SUẤT ĐỘ TRỄ (RETRIEVAL LATENCY BENCHMARK)

| Phân vị Độ trễ | Thời gian thực thi (ms) | Ngưỡng SLA Production | Đánh giá |
| :--- | :--- | :--- | :--- |
| **Mean Latency** | **4.07 ms** | < 25.0 ms | Đạt xuất sắc |
| **p50 Latency (Median)** | **4.04 ms** | < 20.0 ms | Tốc độ tức thì |
| **p90 Latency** | **4.49 ms** | < 40.0 ms | Ổn định cao |
| **p95 Latency** | **4.67 ms** | < 50.0 ms | Hoàn toàn đáp ứng SLA |

## 3. PHÂN TÍCH TRƯỜNG HỢP THẤT BẠI (FAILURE ANALYSIS CHO NGÀY 18)

Tổng số trường hợp thất bại (Target Chunk không nằm trong Top-5): **0 queries** (0.0%).

> [!NOTE] Toàn bộ 100% câu hỏi trong tập đánh giá đều truy xuất trúng tài liệu đích.
