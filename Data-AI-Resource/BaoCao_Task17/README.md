# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 17
## RETRIEVER BASELINE VÀ CHỈ MỤC VECTOR (`cybersoft-rag-retriever-baseline`)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 17 — Retriever baseline (`cybersoft-rag-retriever-baseline`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-09-23  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task17/` chứa trọn bộ tài nguyên, mã nguồn, chỉ mục vector và báo cáo đo lường thực nghiệm của Động cơ truy xuất ngữ nghĩa cơ sở (**Retriever Baseline**) kế thừa trực tiếp từ 91 chunks chuẩn hóa của Task 16 trong Tuần 4 (RAG và AI Tutor) tại CyberSoft Academy:

```text
BaoCao_Task17/
├── 17_retriever_baseline.md        # Bản đặc tả kỹ thuật chi tiết toàn diện Task 17
├── README.md                       # Báo cáo tổng quan bàn giao & hướng dẫn thực thi
├── AI_WORKLOG.md                   # Nhật ký phối hợp AI & thẩm định 3 cột theo chuẩn CyberSoft
├── Picture_17_Detail.png           # Sơ đồ kiến trúc Retriever Baseline & Chỉ mục Vector 3 tầng tối giản (300 DPI)
├── requirements.txt                # Danh mục thư viện phụ thuộc (Scikit-learn, FastAPI, Pytest, Pillow...)
├── data/
│   └── eval/
│       └── retrieval_eval_queries.json # Bộ 30 câu hỏi thực tế (10 Train / 20 Test) có nhãn ground-truth
├── src/
│   ├── __init__.py                 # Khởi tạo package Python chuẩn
│   ├── embeddings.py               # Động cơ nhúng ngữ nghĩa (TF-IDF & SVD L2-normalized dense space)
│   ├── vector_index.py             # Chỉ mục vector Flat Cosine Similarity & đóng gói artifact (.npz)
│   ├── retriever.py                # Động cơ truy xuất Top-K, bộ lọc metadata & trích xuất Citation
│   ├── api.py                      # RESTful Search API qua FastAPI (/search, /health, /stats)
│   └── evaluator.py                # Động cơ đo lường IR (Recall@1/3/5, MRR, Latency p50/p95, Failures)
├── indexes/
│   ├── embedding_model.pkl         # Trọng số mô hình nhúng ngữ nghĩa đã huấn luyện
│   ├── vector_index.npz            # Ma trận vector (91, 64) và metadata nén (55 KB)
│   └── index_manifest.json         # Bản kê khai toàn vẹn kỹ thuật có mã băm SHA-256
├── reports/
│   ├── retrieval_baseline_report.md  # Báo cáo kết quả đo lường IR Baseline chi tiết
│   └── retrieval_baseline_metrics.json # Dữ liệu JSON chi tiết các chỉ số đo lường thực nghiệm
├── scripts/
│   ├── build_index.py              # CLI huấn luyện và xây dựng Vector Index Artifacts
│   ├── run_evaluation.py           # CLI benchmark đo lường IR metrics trên tập đánh giá
│   ├── run_api.py                  # CLI khởi chạy FastAPI REST Server trên localhost
│   └── demo_day17_workflow.py      # Kịch bản kiểm chứng 4 giai đoạn toàn trình đạt Exit Code 0
└── tests/
    ├── __init__.py
    ├── conftest.py                 # Thiết lập sys.path tương đối chuẩn mực
    ├── test_embeddings.py          # Kiểm thử mô hình nhúng, chuẩn hóa L2 và tính tất định
    ├── test_vector_index.py        # Kiểm thử thêm vector, sắp xếp điểm Cosine, lọc metadata và NPZ
    ├── test_retriever.py           # Kiểm thử truy xuất Top-K, tính toàn vẹn Citation và ngưỡng điểm
    ├── test_evaluator.py           # Kiểm thử tính toán Recall@K, MRR và phân tách train/test split
    ├── test_api.py                 # Kiểm thử các endpoint REST API qua TestClient
    └── test_zero_hardcoded_paths.py # Kiểm thử chặn đứng triệt để đường dẫn cá nhân (Zero Hardcoded)
```

---

## 2. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

> **Lưu ý đường dẫn**: Mọi lệnh dưới đây đều thực thi độc lập từ thư mục gốc `cybersoft-learning-hub/`. Hệ thống tuân thủ 100% nguyên tắc **Zero Hardcoded Paths**.

### Bước 1: Chạy kịch bản Demo Workflow toàn diện (4 giai đoạn kiểm định)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/scripts/demo_day17_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 4 giai đoạn kiểm tra (Exit code: 0):
- **Phase 1 (Index Building & Artifact Serialization)**: Huấn luyện và lập chỉ mục thành công 91 chunks chuẩn, xuất bản `embedding_model.pkl`, `vector_index.npz` (55 KB), và `index_manifest.json` có mã băm SHA-256 (`7c157529...`).
- **Phase 2 (Semantic Top-5 Search & Citation Lineage)**: Truy xuất chính xác câu hỏi thực tế, hiển thị trọn vẹn `document_id`, `section_id`, `breadcrumbs`, `file_path`, và `char_start/char_end`; lọc danh mục `category='Curriculum'` thành công.
- **Phase 3 (IR Evaluation & DoD Verification)**: Đạt **Recall@5: 100.0%** (ngưỡng DoD $\ge 70.0\%$), **MRR: 0.9750**, độ trễ median **2.67 ms** trên tập Test Split 20 câu.
- **Phase 4 (REST API Endpoints Verification)**: Kiểm thử toàn diện qua FastAPI TestClient: `/api/v1/health` (healthy, 91 vectors), `/api/v1/stats`, `/api/v1/search` (200 OK với Citation DTO đầy đủ), và bắt lỗi cú pháp 422 Unprocessable Entity khi truy vấn rỗng.

### Bước 2: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/tests/ -v
```
*Kết quả kỳ vọng*: **20/20 test cases PASSED 100%** trong dưới 4 giây.

### Bước 3: Chạy đo lường và xuất báo cáo IR Baseline Benchmark
```powershell
# Chạy đánh giá trên tập kiểm thử độc lập (Test Split - 20 queries, Zero Data Leakage):
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/scripts/run_evaluation.py --split test

# Hoặc chạy kiểm tra toàn bộ 30 queries:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/scripts/run_evaluation.py --split all
```
*Kết quả kỳ vọng*: Tự động xuất bản `reports/retrieval_baseline_report.md` và `reports/retrieval_baseline_metrics.json`.

### Bước 4: Khởi chạy Search REST API Server
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task17/scripts/run_api.py --port 8000
```
*Truy cập Swagger UI*: `http://127.0.0.1:8000/docs` để tra cứu và thử nghiệm API tương tác trực quan.

#### 4.1. Hướng Dẫn Thử Nghiệm Nhanh Trên Swagger UI
1. Mở trình duyệt tại địa chỉ: `http://127.0.0.1:8000/docs`.
2. Chọn endpoint cần kiểm tra (ví dụ: `POST /api/v1/search`).
3. Nhấp nút **Try it out** ở góc phải trên của bảng endpoint.
4. Sao chép và dán một trong các **Bản mẫu JSON Payload Demo** dưới đây vào ô **Request body**.
5. Nhấp **Execute** để gửi yêu cầu và kiểm tra kết quả (Response Body 200 OK kèm trọn vẹn Citation metadata DTO và Latency).

#### 4.2. Các Bản Mẫu Request JSON Demo Cho `POST /api/v1/search`

* **Mẫu 1: Tìm kiếm ngữ nghĩa cơ bản (Top-3 kết quả)**:
```json
{
  "query": "Điều kiện để được xét công nhận tốt nghiệp chính thức tại CyberSoft?",
  "top_k": 3
}
```

* **Mẫu 2: Lọc theo Danh mục Quy chế đào tạo (`Academic Policy`)**:
```json
{
  "query": "Chính sách bảo lưu khóa học và hoàn trả học phí như thế nào?",
  "top_k": 5,
  "category": "Academic Policy"
}
```

* **Mẫu 3: Lọc theo Danh mục Lộ trình đào tạo (`Curriculum`)**:
```json
{
  "query": "Lộ trình học Spring Boot, Docker và microservices trong khóa Backend?",
  "top_k": 3,
  "category": "Curriculum"
}
```

* **Mẫu 4: Lọc theo Mã tài liệu cụ thể (`document_id`)**:
```json
{
  "query": "Hình thức xử lý kỷ luật khi sinh viên gian lận thi cử?",
  "top_k": 3,
  "document_id": "CS-POL-003"
}
```

* **Mẫu 5: Lọc kết hợp với Ngưỡng điểm tương đồng tối thiểu (`min_score`)**:
```json
{
  "query": "Quy định làm đồ án capstone và bảo vệ trước hội đồng tốt nghiệp",
  "top_k": 5,
  "min_score": 0.3
}
```

#### 4.3. Lệnh Mẫu Thử Nghiệm Qua Console (cURL & PowerShell)

* **Thực thi qua cURL**:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/search" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"Điều kiện xét công nhận tốt nghiệp?\", \"top_k\": 3}"
```

* **Thực thi qua PowerShell**:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/search" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"query": "Điều kiện xét công nhận tốt nghiệp?", "top_k": 3}' | ConvertTo-Json -Depth 5
```

* **Kiểm tra trạng thái hệ thống (`GET /api/v1/health`)**:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get
```

---

## 3. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí Nghiệm thu (DoD Criteria) | Hiện trạng Triển khai | Kết quả Đối soát | Trạng thái |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Tạo Embeddings và Vector Index** | Triển khai `EmbeddingEngine` (TF-IDF SVD $L_2$-normalized) và `VectorIndex` Flat Cosine. | Đã lập chỉ mục 91/91 chunks Task 16 vào `vector_index.npz` |  **PASSED** |
| **2** | **Xây dựng API Search** | Xây dựng RESTful API FastAPI với đầy đủ endpoints `/search`, `/health`, `/stats`. | Đạt chuẩn Pydantic DTO, hỗ trợ filter và phân trang Top-K |  **PASSED** |
| **3** | **Đo Recall@K trên Evaluation Set** | Thiết lập bộ 30 queries thực tế, đo lường Recall@1, Recall@3, Recall@5, MRR và Latency. | Đã xuất `retrieval_baseline_report.md` và `metrics.json` |  **PASSED** |
| **4** | **Bàn giao Retriever API** | Script `run_api.py` và module `src/retriever.py` sẵn sàng tích hợp và gọi trực tiếp. | Sẵn sàng phục vụ AI Tutor ở Ngày 19 |  **PASSED** |
| **5** | **Bàn giao Index Artifact** | Đóng gói `indexes/vector_index.npz` (55 KB) kèm `index_manifest.json` có mã SHA-256. | Lưu trữ độc lập trên đĩa, nạp lại tức thì trong 0.01s |  **PASSED** |
| **6** | **Báo cáo Baseline Metrics** | Xuất báo cáo chi tiết Recall@1 (95.0%), Recall@5 (100.0%), MRR (0.9750), Latency (2.67ms). | Đạt ngưỡng nghiệm thu vượt mức cam kết |  **PASSED** |
| **7** | **Có Top-K và Citation Metadata** | Trả về trọn vẹn `document_id`, `section_id`, `title`, `breadcrumbs`, `file_path`, `char_offsets`. | 100% kết quả có citation chuẩn, không bịa nguồn |  **PASSED** |
| **8** | **Tách Train/Dev/Test rõ ràng** | Phân tách tập đánh giá thành 10 câu Train và 20 câu Test độc lập. | Không rò rỉ dữ liệu (Zero Data Leakage), báo cáo trung thực |  **PASSED** |
| **9** | **Zero Hardcoded Paths** | Sử dụng 100% `pathlib.Path` tương đối, không hardcode `C:\` hay `D:\`. | Đã kiểm chứng tự động qua `test_zero_hardcoded_paths.py` |  **PASSED** |
| **10** | **Kiểm thử Tự động 100%** | Bộ 20 bài unit test và kịch bản demo 4 giai đoạn toàn trình. | 20/20 test cases PASSED, Exit Code 0 |  **PASSED** |

---

## 4. TỔNG HỢP CHỈ SỐ RETRIEVAL BASELINE & SLA HIỆU NĂNG

### Bảng Chỉ Số Thông Tin (IR Performance Metrics) trên Tập Test (20 Queries)

| Chỉ số Đánh giá | Giá trị Đạt được | Ngưỡng Tiêu chuẩn (DoD) | Đánh giá Chuyên môn |
| :--- | :--- | :--- | :--- |
| **Recall@1** | **95.00%** | $\ge 40.0\%$ | Đạt xuất sắc, câu trả lời nằm ngay vị trí đầu tiên |
| **Recall@3** | **100.00%** | $\ge 60.0\%$ | 100% câu hỏi tìm thấy chunk trong Top-3 |
| **Recall@5** | **100.00%** | $\ge 70.0\%$ | **Vượt xa yêu cầu cốt lõi của DoD** |
| **Doc-Recall@5** | **100.00%** | $\ge 85.0\%$ | Định vị chính xác tuyệt đối tài liệu chứa điều khoản |
| **MRR (Mean Reciprocal Rank)** | **0.9750** | $\ge 0.5000$ | Thứ hạng trung bình xấp xỉ vị trí số 1 |
| **Số lỗi thất bại (Failures)** | **0 / 20** | $\le 4$ câu | 0% tỷ lệ lỗi trên tập kiểm thử |

### Bảng SLA Độ Trễ (Latency SLA)
* **Mean Latency**: **2.88 ms** (Mục tiêu: $< 25.0\text{ ms}$)
* **p50 Latency (Median)**: **2.67 ms** (Mục tiêu: $< 20.0\text{ ms}$)
* **p90 Latency**: **3.31 ms** (Mục tiêu: $< 40.0\text{ ms}$)
* **p95 Latency**: **3.32 ms** (Mục tiêu: $< 50.0\text{ ms}$)

---

## 5. KẾT NỐI VÀ BÀN GIAO CHO NGÀY 18 (HYBRID SEARCH & RERANKING)

Toàn bộ chỉ mục vector, trọng số mô hình và tập dữ liệu đánh giá 30 queries tại `data/eval/retrieval_eval_queries.json` được bàn giao hoàn chỉnh để ngày mai (**NGÀY 18**), nhóm kỹ thuật tiến hành:
1. Xây dựng bộ chỉ mục Lexical Search (BM25) song song với Vector Index hiện tại.
2. Thiết lập thuật toán hợp nhất xếp hạng Reciprocal Rank Fusion (RRF) để kết hợp điểm số Lexical + Vector.
3. Tích hợp mô hình Reranker phân tích ngữ cảnh sâu và đối chứng trực tiếp với Baseline Metrics của Ngày 17 trên cùng tập evaluation set.
