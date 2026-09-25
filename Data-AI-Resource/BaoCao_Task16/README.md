# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 16
## INGEST VÀ CHUNKING PIPELINE (`cybersoft-rag-ingestion-chunking-pipeline`)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 16 — Ingest và chunking pipeline (`cybersoft-rag-ingestion-chunking-pipeline`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-09-22  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task16/` chứa trọn bộ tài nguyên, mã nguồn và báo cáo kiểm định thực nghiệm của đường ống nạp (**Ingestion Pipeline**) và phân đoạn ngữ nghĩa (**Chunking Engine**) mở màn cho Tuần 4 (RAG và AI Tutor) tại CyberSoft Academy:

```text
BaoCao_Task16/
├── 16_ingest_chunking_pipeline.md       # Bản đặc tả kỹ thuật chi tiết toàn diện Task 16
├── README.md                            # Báo cáo tổng quan bàn giao & hướng dẫn thực thi
├── AI_WORKLOG.md                        # Nhật ký phối hợp AI & thẩm định 3 cột theo chuẩn CyberSoft
├── Picture_16_Detail.png                # Sơ đồ kiến trúc Ingestion Pipeline, 3 Chiến lược Chunking & State Store (300 DPI)
├── Picture_16_Detail.drawio             # Tệp thiết kế kiến trúc mở trên Draw.io (đầy đủ 10 luồng nghiệp vụ & 6 KPI)
├── requirements.txt                     # Danh mục thư viện phụ thuộc (Pytest, Matplotlib, Pillow, Python-Docx...)
├── data/
│   ├── corpus/                          # Kho 23 tài liệu học liệu số chuẩn hóa (POL, TEC, CRS, FAQ, TXT, PDF)
│   └── dirty_samples/                   # 3 mẫu tệp hỏng có chủ đích để kiểm thử bẫy lỗi cô lập (DoD)
├── src/
│   ├── __init__.py                      # Khởi tạo package Python chuẩn
│   ├── loaders.py                       # Động cơ nạp đa định dạng (Markdown Frontmatter, Text, PDF) & cô lập lỗi
│   ├── chunkers.py                      # 3 chiến lược chunking (Fixed-Size, Header-Aware, Sentence-Window)
│   ├── hashing.py                       # Quản lý băm SHA-256, StateStore & kiểm soát tính lũy đẳng (Idempotency)
│   ├── pipeline.py                      # Động cơ điều phối Ingestion Pipeline toàn trình, ghi log & xuất manifest
│   └── comparator.py                    # Động cơ đo lường thực nghiệm & tính toán chỉ số chất lượng phân đoạn
├── reports/
│   ├── chunk_comparison_report.md       # Báo cáo so sánh định lượng 3 chiến lược phân đoạn ngữ liệu
│   └── chunk_metrics.json               # Dữ liệu JSON chi tiết các chỉ số đo lường thực nghiệm
├── logs/
│   ├── ingestion.log                    # Nhật ký vận hành pipeline tổng thể
│   └── ingestion_errors.log             # Nhật ký bóc tách các trường hợp tệp hỏng/lỗi cú pháp (DoD)
├── output/
│   ├── chunks_markdown_header_semantic.jsonl # Kho 91 chunks chuẩn hóa sẵn sàng cho Vector Index Ngày 17
│   ├── ingestion_manifest.json          # Bản manifest tổng hợp chi tiết phiên chạy ingestion
│   └── state_store.json                 # Cơ sở dữ liệu trạng thái băm phục vụ cập nhật gia tăng
├── scripts/
│   ├── run_ingestion.py                 # CLI launcher thực thi Ingestion Pipeline linh hoạt
│   ├── run_chunk_comparison.py          # CLI benchmark và trích xuất báo cáo so sánh thực nghiệm
│   └── demo_day16_workflow.py           # Kịch bản kiểm chứng 4 giai đoạn toàn trình đạt Exit Code 0
└── tests/
    ├── __init__.py
    ├── conftest.py                      # Thiết lập sys.path tương đối chuẩn mực
    ├── test_loaders.py                  # Kiểm thử nạp tài liệu đa định dạng và bắt lỗi tệp hỏng
    ├── test_chunkers.py                 # Kiểm thử 3 chiến lược chunking và tính toàn vẹn metadata
    ├── test_idempotency_and_hashing.py  # Kiểm thử băm SHA-256, State Store và chống trùng lặp
    └── test_pipeline_e2e.py             # Kiểm thử luồng toàn trình, DoD và Zero Hardcoded Paths
```

---

## 2. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

> **Lưu ý đường dẫn**: Mọi lệnh dưới đây đều thực thi độc lập từ thư mục gốc `cybersoft-learning-hub/`. Hệ thống tuân thủ 100% nguyên tắc **Zero Hardcoded Paths**.

### Bước 1: Chạy kịch bản Demo Workflow toàn diện (4 giai đoạn kiểm định)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/scripts/demo_day16_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 4 giai đoạn kiểm tra (Exit code: 0):
- **Phase 1 (Cold Start)**: Ingest thành công 23/23 tài liệu học liệu, sinh 91 chunks chuẩn, xuất bản `ingestion_manifest.json` và `state_store.json`.
- **Phase 2 (Idempotency Re-run)**: Chạy lại lần 2 trên cùng tập dữ liệu; hệ thống tự động nhận diện và **SKIP 23/23 files** không đổi, phát sinh **0 duplicate chunks** (Tính lũy đẳng đạt 100%, độ trễ 0.003s).
- **Phase 3 (Incremental Update)**: Nhận diện chính xác 1 file `MODIFIED`, 1 file `NEW`, và giữ nguyên 22 files `UNCHANGED`.
- **Phase 4 (Fault Isolation & Error Logging)**: Tự động bắt toàn bộ 3 tệp lỗi trong `data/dirty_samples/`, ghi vết chi tiết vào `logs/ingestion_errors.log`, bảo vệ an toàn cho tiến trình chính.

### Bước 2: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/tests/ -v
```
*Kết quả kỳ vọng*: 16/16 test cases **PASSED** trong 0.89 giây (100% SUCCESS).

### Bước 3: Chạy so sánh thực nghiệm 3 chiến lược phân đoạn ngữ liệu
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/scripts/run_chunk_comparison.py
```
*Kết quả kỳ vọng*: Tự động chạy và trích xuất bảng so sánh trực quan giữa Fixed-Size, Markdown Header-Aware và Sentence-Window ra `reports/chunk_comparison_report.md` và `reports/chunk_metrics.json`:
- **Strategy B (Markdown Header-Aware)**: 91 chunks, ~108.96 tokens/chunk, 100% Breadcrumbs retention, 97.8% Boundary Integrity, 1.00x Redundancy (Chiến lược sản xuất tối ưu).
- **Strategy A (Fixed-Size Overlap)**: 107 chunks, 117.42 tokens/chunk, Boundary Integrity chỉ đạt 23.4% (gãy câu).
- **Strategy C (Sentence-Window)**: 147 chunks, 102.79 tokens/chunk, Redundancy 1.46x (phình to dữ liệu).

### Bước 4: Khởi chạy Ingestion Pipeline với chiến lược tùy chọn qua CLI
```powershell
# Chạy chiến lược mặc định đề xuất (Markdown Header-Aware Semantic):
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/scripts/run_ingestion.py --strategy header

# Hoặc ép buộc re-ingest toàn bộ (bỏ qua cache State Store):
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task16/scripts/run_ingestion.py --strategy header --force
```

---

## 3. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí nghiệm thu (DoD Criteria theo Kế hoạch 30 Ngày) | Trạng thái | Bằng chứng kiểm chứng độc lập |
| :---: | :--- | :---: | :--- |
| **01** | **Parse Markdown/PDF/text giả lập** | **ĐẠT (PASS)** | `loaders.py` hỗ trợ nạp `.md` kèm Frontmatter, `.txt`, `.pdf.txt`, tự động bóc tách metadata. |
| **02** | **Thử ít nhất 2 chiến lược chunk** | **ĐẠT (PASS)** | Triển khai thực tế 3 chiến lược: Fixed-Size, Header-Aware Semantic, Sentence-Window; xuất báo cáo so sánh định lượng. |
| **03** | **Lưu chunk metadata và hash để incremental update** | **ĐẠT (PASS)** | Mỗi chunk lưu rõ `doc_id`, `version`, `breadcrumbs`, `section_id`, `char_start`, `char_end`, `token_count`, `content_hash`. |
| **04** | **Không mất source/version** | **ĐẠT (PASS)** | `DocumentMetadata` và `Chunk` giữ trọn vẹn đường dẫn tương đối, phiên bản tài liệu và phân cấp tiêu đề. |
| **05** | **Chạy lại không tạo bản ghi trùng (Idempotency)** | **ĐẠT (PASS)** | `StateStore` nhận diện file `UNCHANGED`, skip re-chunking; re-run sinh cùng tập chunk hash, 0 duplicate chunks. |
| **06** | **Có log file lỗi (Fault Isolation)** | **ĐẠT (PASS)** | `logs/ingestion_errors.log` cô lập và ghi lại chi tiết timestamp, file_path, traceback từ `data/dirty_samples/`. |
| **07** | **Bộ kiểm thử tự động Pytest đạt 100% PASS** | **ĐẠT (PASS)** | 16/16 test cases Pytest Passed trong 0.89 giây; kịch bản demo 4 giai đoạn đạt Exit Code 0. |
| **08** | **Không hard-code đường dẫn cá nhân (Zero Hardcoded Paths)** | **ĐẠT (PASS)** | 100% mã nguồn sử dụng `pathlib.Path` tương đối, vượt qua bài kiểm tra regex `test_zero_hardcoded_personal_paths()`. |
| **09** | **Báo cáo Word chính thức đúng quy chuẩn CyberSoft** | **ĐẠT (PASS)** | `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_16.docx`. |
