# CYBERSOFT DATA & AI LAB — TASK 18: HYBRID SEARCH VÀ RERANKING

> **Tuần 4 — RAG và AI Tutor**  
> **Thực tập sinh phụ trách**: Đào Trung Kiên — *Data & AI Resource Engineer*  
> **Sản phẩm**: Động cơ tìm kiếm lai và Tái xếp hạng ngữ cảnh (Retriever v0.2)  
> **Trạng thái**: Hoàn thành xuất sắc 100% Tiêu chí Nghiệm thu (DoD Passed)  

---

## 1. TỔNG QUAN SẢN PHẨM BÀN GIAO (DELIVERABLES)

Thực hiện nhiệm vụ **Ngày 18** theo kế hoạch đào tạo thực chiến 30 ngày của CyberSoft Academy, sản phẩm bàn giao bao gồm:

1. **`18_hybrid_search_reranking.md`**: Bản đặc tả kỹ thuật chi tiết toàn diện về cơ sở toán học Okapi BM25, thuật toán hợp nhất thứ hạng Reciprocal Rank Fusion (RRF), tầng tái xếp hạng Cross-Context Reranker, RESTful API và báo cáo thí nghiệm đối chứng.
2. **`Picture_18_Detail.png`**: Sơ đồ kiến trúc kỹ thuật độ phân giải cao (3400x1900, 300 DPI) chuẩn Dark Theme thể hiện 5 tầng xử lý và 6 thẻ KPI định lượng.
3. **Mã nguồn Động cơ (`src/`)**:
   - `bm25.py`: Động cơ tìm kiếm từ khóa Okapi BM25 với Technical Tokenizer bảo toàn mã lệnh và cờ tham số.
   - `embeddings.py`: Động cơ nhúng vector dense 64 chiều chuẩn hóa $L_2$ thuần Python.
   - `vector_index.py`: Chỉ mục vector tính tích vô hướng SIMD Cosine Similarity siêu tốc.
   - `reranker.py`: Bộ tái xếp hạng tương tác chéo 4 đặc trưng (Coverage, Title Match, Phrase Proximity, Semantic Score).
   - `hybrid_retriever.py`: Động cơ Retriever v0.2 tích hợp 5 chế độ tìm kiếm, bộ lọc metadata và Citation Lineage.
   - `evaluator.py`: Bộ khung đo lường IR tự động chạy thí nghiệm đối chứng A/B và phân tích 10 dạng lỗi.
   - `api.py`: Dịch vụ RESTful API v0.2 với FastAPI và Pydantic DTO.
4. **Kho lưu trữ chỉ mục kép (`indexes/`)**:
   - `vector_index.npz` (55 KB), `embedding_model.pkl` (3.69 MB), `bm25_model.pkl` (102 KB), `index_manifest.json` (SHA-256).
5. **Báo cáo Thực nghiệm & Phân tích lỗi (`reports/`)**:
   - `experiment_report.md` & `experiment_metrics.json`: Báo cáo đối chứng A/B giữa Baseline và Retriever v0.2 trên cùng tập Test.
   - `failure_analysis.md` & `failure_analysis.json`: Báo cáo phân loại và phân tích nguyên nhân gốc cho 10 ca lỗi IR điển hình.
6. **Bộ kịch bản tự động hóa (`scripts/`)**:
   - `build_indexes.py`: Lập chỉ mục song song Dense Vector và BM25.
   - `run_experiment.py`: Chạy đo lường thí nghiệm đối chứng A/B.
   - `run_failure_analysis.py`: Đánh giá bộ 10 ca kiểm thử đối kháng.
   - `run_api.py`: Khởi chạy REST API server trên cổng 8000.
   - `demo_day18_workflow.py`: Quy trình kiểm định tự động 5 pha đạt Exit Code 0.
7. **Bộ kiểm thử tự động (`tests/`)**:
   - 20 bài kiểm thử Pytest bao phủ toàn diện unit test, integration test, API test và zero hardcoded paths test (100% PASS).
8. **Báo cáo Word Chính thức**:
   - `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_18.docx` theo đúng biểu mẫu CyberSoft.

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
BaoCao_Task18/
├── 18_hybrid_search_reranking.md        # Bản đặc tả kỹ thuật chi tiết
├── README.md                            # Hướng dẫn tổng quan và khởi chạy
├── AI_WORKLOG.md                        # Nhật ký cộng tác AI minh bạch 3 cột
├── Picture_18_Detail.png                # Sơ đồ kiến trúc 3400x1900 Dark Palette
├── requirements.txt                     # Danh mục thư viện phụ thuộc
├── data/
│   ├── chunks_markdown_header_semantic.jsonl   # 91 chunks ngữ nghĩa từ Task 16/17
│   └── eval/
│       ├── retrieval_eval_queries.json         # 30 câu hỏi đánh giá có chia Train/Test
│       └── adversarial_failure_testset.json    # 10 ca kiểm thử đối kháng 10 dạng lỗi
├── indexes/
│   ├── vector_index.npz                 # Ma trận vector dense (55 KB)
│   ├── embedding_model.pkl              # Mô hình nhúng SVD L2 (3.69 MB)
│   ├── bm25_model.pkl                   # Mô hình từ vựng BM25 Okapi (102 KB)
│   └── index_manifest.json              # Bản kê khai toàn vẹn và mã SHA-256
├── reports/
│   ├── experiment_report.md             # Báo cáo thí nghiệm đối chứng A/B
│   ├── experiment_metrics.json          # Chỉ số đo lường định dạng JSON
│   ├── failure_analysis.md              # Báo cáo phân tích 10 dạng lỗi IR
│   └── failure_analysis.json            # Dữ liệu phân tích lỗi định dạng JSON
├── scripts/
│   ├── build_indexes.py                 # Script lập chỉ mục kép Vector + BM25
│   ├── run_experiment.py                # Script chạy thí nghiệm A/B
│   ├── run_failure_analysis.py          # Script phân tích 10 dạng lỗi
│   ├── run_api.py                       # Script khởi động FastAPI server
│   ├── render_diagram.py                # Script render sơ đồ kiến trúc 300 DPI
│   └── demo_day18_workflow.py           # Kịch bản demo kiểm định 5 pha
├── src/
│   ├── __init__.py
│   ├── bm25.py                          # Động cơ từ khóa Okapi BM25
│   ├── embeddings.py                    # Động cơ nhúng vector dense L2
│   ├── vector_index.py                  # Chỉ mục ma trận vector Flat Cosine
│   ├── reranker.py                      # Động cơ tái xếp hạng ngữ cảnh sâu
│   ├── hybrid_retriever.py              # Retriever v0.2 tích hợp RRF và Reranker
│   ├── evaluator.py                     # Bộ khung đo lường IR metrics
│   └── api.py                           # Dịch vụ RESTful FastAPI
└── tests/
    ├── conftest.py
    ├── test_bm25.py                     # Kiểm thử BM25 và tokenizer
    ├── test_embeddings.py               # Kiểm thử chuẩn hóa L2 vector
    ├── test_vector_index.py             # Kiểm thử chỉ mục vector
    ├── test_reranker.py                 # Kiểm thử Cross-Context Reranker
    ├── test_hybrid_retriever.py         # Kiểm thử 5 chế độ truy xuất và citation
    ├── test_evaluator.py                # Kiểm thử bộ đo lường IR
    ├── test_api.py                      # Kiểm thử FastAPI endpoints
    └── test_zero_hardcoded_paths.py     # Kiểm thử kiểm toán đường dẫn di động
```

---

## 3. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

> **Lưu ý đường dẫn**: Mọi lệnh dưới đây đều thực thi độc lập từ thư mục gốc dự án (`d:\Cybersoft\Kien` hoặc `cybersoft-learning-hub/`). Hệ thống tuân thủ 100% nguyên tắc **Zero Hardcoded Paths**.

### Cách 1: Thực thi từ thư mục gốc dự án (Khuyên dùng)

#### Bước 1: Cài đặt môi trường
```powershell
pip install -r cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18/requirements.txt
```

#### Bước 2: Chạy kịch bản Demo Workflow toàn diện (5 pha kiểm định đạt Exit Code 0)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18/scripts/demo_day18_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 5 pha kiểm định:
- **Phase 1 (Dual Indexing)**: Lập chỉ mục thành công 91 chunks, xuất bản `vector_index.npz` (55 KB), `bm25_model.pkl` (102 KB), và `index_manifest.json` có mã SHA-256.
- **Phase 2 (5 Search Modes Verification)**: Kiểm chứng 5 chế độ: `dense`, `bm25`, `rrf`, `weighted`, `reranked` với đầy đủ Citation Lineage DTO.
- **Phase 3 (A/B Controlled Experiment)**: Đo lường đối chứng trên tập Test Split (20 câu): Recall@1: 100.0%, Recall@5: 100.0%, MRR: 1.0000.
- **Phase 4 (10 Failure Modes Taxonomy)**: Kiểm định 10 ca kiểm thử đối kháng trong `adversarial_failure_testset.json`.
- **Phase 5 (FastAPI Endpoints Audit)**: Kiểm thử toàn diện qua TestClient: `/api/v1/health`, `/api/v1/stats`, và `/api/v1/search`.

#### Bước 3: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18/tests/ -v
```
*Kết quả kỳ vọng*: **20/20 test cases PASSED 100%** trong ~2.63 giây.

#### Bước 4: Chạy thí nghiệm đối chứng A/B Benchmark (Test Split)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18/scripts/run_experiment.py --split test
```
*Kết quả kỳ vọng*: Tự động xuất bản `reports/experiment_report.md` và `reports/experiment_metrics.json`.

#### Bước 5: Chạy phân tích 10 dạng lỗi IR kinh điển
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18/scripts/run_failure_analysis.py
```
*Kết quả kỳ vọng*: Tự động xuất bản `reports/failure_analysis.md` và `reports/failure_analysis.json`.

#### Bước 6: Khởi động Search REST API Server
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18/scripts/run_api.py --port 8000
```
*Truy cập Swagger UI*: `http://127.0.0.1:8000/docs` để tra cứu và thử nghiệm API trực quan.

---

### Cách 2: Di chuyển trực tiếp vào thư mục Task 18 rồi thực thi
```powershell
cd cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task18
pip install -r requirements.txt
python scripts/demo_day18_workflow.py
pytest tests/ -v
python scripts/run_experiment.py --split test
python scripts/run_failure_analysis.py
python scripts/run_api.py --port 8000
```

---

### 3.8. Hướng Dẫn Thử Nghiệm API (`POST /api/v1/search`)

* **Thực thi qua cURL**:
```bash
curl -X POST "http://127.0.0.1:8000/api/v1/search" \
     -H "Content-Type: application/json" \
     -d "{\"query\": \"Cấu hình môi trường WSL2 và Ubuntu 22.04 LTS?\", \"mode\": \"reranked\", \"top_k\": 3}"
```

* **Thực thi qua PowerShell**:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/search" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"query": "Quy chế bảo lưu khóa học tại CyberSoft?", "mode": "reranked", "top_k": 3}' | ConvertTo-Json -Depth 5
```

* **Kiểm tra trạng thái hệ thống (`GET /api/v1/health`)**:
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get
```

---

## 4. BẢNG CHỈ SỐ THỰC NGHIỆM ĐỐI CHỨNG VÀ KẾT QUẢ DoD

| Chỉ số / Tiêu chuẩn | Baseline (Task 17) | Retriever v0.2 (Task 18) | Mức Cải Thiện | Ngưỡng Tiêu Chuẩn DoD | Kết Quả |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Recall@1 (Test Split)** | 95.0% | **100.0%** | **+5.0%** | Không tuyên bố nếu không tăng | **PASS** |
| **Recall@5 (Test Split)** | 100.0% | **100.0%** | Duy trì tuyệt đối | $\ge 70.0\%$ | **PASS** |
| **Doc-Recall@5** | 100.0% | **100.0%** | Hoàn hảo | $\ge 85.0\%$ | **PASS** |
| **MRR (Mean Reciprocal Rank)** | 0.9750 | **1.0000** | **+0.0250** | $\ge 0.5000$ | **PASS** |
| **NDCG@5** | 0.9842 | **1.0000** | **+0.0158** | Đưa chunk đích lên Top-1 | **PASS** |
| **Độ trễ Median (p50)** | 5.85 ms | **7.95 ms** | Phù hợp overhead | $< 20.0\text{ ms}$ | **PASS** |
| **Chi phí vận hành API** | $0.00 | **$0.00 USD** | Tiết kiệm 100% | Ghi rõ chi phí | **PASS** |
| **Số ca lỗi phân loại** | 0 ca | **10 ca lỗi** | Đầy đủ 10 nhóm | Có ít nhất 10 lỗi | **PASS** |
| **Kiểm thử tự động** | 20/20 PASS | **20/20 PASS** | 100% tin cậy | 100% tests PASS | **PASS** |

---

## 5. KẾT NỐI VÀ BÀN GIAO CHO NGÀY 19 (AI TUTOR CÓ TRÍCH NGUỒN VÀ TỪ CHỐI)

Toàn bộ chỉ mục kép (`vector_index.npz`, `bm25_model.pkl`), mô hình tái xếp hạng (`CrossContextReranker`), bộ đánh giá IR đối kháng và RESTful Search API v0.2 được bàn giao hoàn chỉnh để ngày mai (**NGÀY 19**), nhóm kỹ thuật tiến hành:
1. **Thiết kế Prompt có cấu trúc (System & User Persona)**: Ép LLM chỉ trả lời dựa trên context được cung cấp bởi Retriever v0.2.
2. **Cơ chế bắt buộc trích nguồn (Mandatory Citation Grounding)**: Khai thác trực tiếp Citation Metadata DTO (`document_id`, `section_id`, `file_path`, `offsets`) để hiển thị nguồn trích dẫn minh bạch trong câu trả lời của AI Tutor.
3. **Guardrail từ chối khi không đủ dữ kiện (Abstention & Out-of-Domain Policy)**: Tự động phát hiện các câu hỏi ngoài phạm vi hoặc độ tin cậy thấp để từ chối lịch sự, triệt tiêu 100% ảo giác (Zero Hallucination).
4. **Phòng vệ Prompt Injection cơ bản**: Thiết lập chốt chặn an toàn bảo vệ hướng dẫn hệ thống không bị ghi đè bởi người dùng cuối.
