# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 08

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 08 — Dataset AI Engineer cho RAG (`RAG_corpus_v1` & `RAG_eval_benchmark_100`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  

---

## 📂 1. CẤU TRÚC THƯ MỤC BÀN GIAO (DELIVERABLES)

```text
Data-AI-Resource/
└── BaoCao_Task08/
    ├── README.md                            # Hướng dẫn tổng quan & chỉ mục nghiệm thu Ngày 08
    ├── 08_rag_dataset.md                    # Bản đặc tả kỹ thuật chi tiết RAG Corpus & Eval Benchmark
    ├── AI_WORKLOG.md                        # Nhật ký sử dụng AI minh bạch theo chuẩn CyberSoft
    ├── data/
    │   ├── corpus/                          # Tập ngữ liệu 20 tài liệu Markdown chuẩn hóa metadata
    │   │   ├── CS-POL-001_quy_che_bao_luu.md
    │   │   ├── CS-POL-002_chinh_sach_hoan_phi.md
    │   │   ├── CS-POL-003_quy_dinh_diem_danh_do_an.md
    │   │   ├── CS-POL-004_cap_chung_chi_tot_nghiep.md
    │   │   ├── CS-POL-005_hoc_bong_va_ho_tro_viec_lam.md
    │   │   ├── CS-TEC-001_moi_truong_lap_trinh_python_ai.md
    │   │   ├── CS-TEC-002_quy_chuan_git_va_github_classroom.md
    │   │   ├── CS-TEC-003_huong_dan_docker_va_database.md
    │   │   ├── CS-TEC-004_cau_hinh_moi_truong_gpu_cloud.md
    │   │   ├── CS-TEC-005_quy_chuan_clean_code_va_linting.md
    │   │   ├── CS-CRS-001_lo_trinh_fullstack_web.md
    │   │   ├── CS-CRS-002_lo_trinh_data_ai_resource_engineer.md
    │   │   ├── CS-CRS-003_lo_trinh_devops_cloud_computing.md
    │   │   ├── CS-CRS-004_lo_trinh_cybersecurity_soc.md
    │   │   ├── CS-CRS-005_lo_trinh_mobile_react_native.md
    │   │   ├── CS-FAQ-001_faq_hoc_phi_va_thanh_toan.md
    │   │   ├── CS-FAQ-002_faq_hinh_thuc_hoc_online_offline.md
    │   │   ├── CS-FAQ-003_faq_ho_tro_mentor_va_review_code.md
    │   │   ├── CS-FAQ-004_faq_co_hoi_viec_lam_sau_tot_nghiep.md
    │   │   ├── CS-FAQ-005_faq_tai_khoan_lms_va_he_thong.md
    │   │   └── corpus_manifest.json         # Bảng chỉ mục tổng hợp 20 documents và 81 sections
    │   └── eval_qa/                         # Bộ 100 câu hỏi đánh giá RAG đa chiều
    │       ├── rag_eval_questions.json      # File JSON cấu trúc chi tiết ground truth & citations
    │       └── rag_eval_questions.csv       # File CSV trích xuất để phân tích, đánh giá tự động
    ├── data_dictionary/
    │   ├── corpus_schema.json               # Schema JSON kiểm chuẩn metadata tài liệu & phân đoạn
    │   ├── corpus_schema.md                 # Từ điển dữ liệu mô tả các trường của corpus
    │   ├── eval_schema.json                 # Schema JSON kiểm chuẩn bộ câu hỏi đánh giá RAG
    │   └── eval_schema.md                   # Từ điển dữ liệu mô tả cấu trúc câu hỏi & citations
    ├── docs/
    │   ├── rag_chunking_and_retrieval_guidelines.md # Hướng dẫn chiến lược Chunking & Retrieval cho AI
    │   ├── ground_truth_citations_matrix.md         # Ma trận đối soát 100 câu hỏi và trích dẫn nguồn
    │   └── anti_leakage_and_negative_sampling_defense.md # Phân tích cơ chế chống rò rỉ và phòng thủ ảo giác
    ├── scripts/
    │   ├── __init__.py
    │   ├── generate_rag_dataset.py          # Engine tự động sinh và làm mới dataset xác định
    │   └── validate_rag_dataset.py          # CLI kiểm định toàn vẹn RAG (chuẩn mã thoát POSIX 0/1/2)
    └── tests/
        ├── __init__.py
        └── test_rag_integrity.py            # Pytest suite tự động kiểm thử 9 tiêu chuẩn chất lượng (100% PASS)
```

---

## 🚀 2. HƯỚNG DẪN THỰC THI (QUICK START)

> **Lưu ý đường dẫn**: Các lệnh dưới đây có thể chạy trực tiếp từ thư mục `cybersoft-learning-hub/`. Nếu đứng từ thư mục gốc `d:\Cybersoft\Kien`, chỉ cần thêm tiền tố `cybersoft-learning-hub/`.

### 2.1. Tái sinh và đồng bộ bộ tài nguyên (Dataset Engine)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task08/scripts/generate_rag_dataset.py
```
* **Thời gian thực thi**: < 0.5 giây.
* **Kết quả**: Tự động rà soát 20 tài liệu Markdown, cập nhật `corpus_manifest.json`, đồng bộ 100 câu hỏi đánh giá ra `rag_eval_questions.json` và `rag_eval_questions.csv`.

### 2.2. Kiểm định toàn diện chất lượng RAG qua CLI Validator
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task08/scripts/validate_rag_dataset.py
```
* **Kết quả**: Thực thi 6 bước kiểm tra nghiêm ngặt (Tồn tại tệp, Frontmatter, 100 câu hỏi, Khớp 100% trích dẫn, Chống rò rỉ đáp án Zero Leakage, Parity JSON-CSV).
* **Mã thoát POSIX**: Trả về `0` khi hoàn tất thành công 100%.

### 2.3. Chạy toàn bộ Test Suite với Pytest
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task08/tests/ -v
```
* **Kết quả**: `9 passed in 0.35s (100% SUCCESS)`.

---

## 📋 3. BẢNG TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA CHECKLIST)

- [x] **Tối thiểu 20 tài liệu và 100 câu hỏi**:
  - Đạt đúng **20 tài liệu Markdown** chuyên sâu chia 4 lĩnh vực (`CS-POL`, `CS-TEC`, `CS-CRS`, `CS-FAQ`) với **81 sections** chi tiết.
  - Đạt đúng **100 câu hỏi đánh giá** phân loại chuẩn xác.
- [x] **Phân loại câu hỏi đa chiều**:
  - **40 câu Single-hop Answerable**: Truy xuất dữ kiện trực tiếp từ 1 section cụ thể.
  - **20 câu Multi-hop Answerable**: Tổng hợp thông tin từ nhiều điều khoản/văn bản.
  - **20 câu Unanswerable (Negative Examples)**: Các câu hỏi ngoài phạm vi corpus để kiểm tra chốt chặn phòng thủ ảo giác (Hallucination Defense).
  - **20 câu Adversarial / Distractor**: Các câu hỏi gài bẫy con số biên, nhầm lẫn công nghệ, hoặc tiền đề sai lệch.
- [x] **Gắn metadata chuẩn hóa**:
  - Mỗi tài liệu có đầy đủ YAML Frontmatter: `document_id`, `title`, `category`, `version`, `effective_date`, `author`, `tags`, `target_audience`.
  - Mỗi phân đoạn có định danh `section_id` chuẩn hóa phục vụ bộ tách đoạn (Chunker).
- [x] **Ground-Truth Citations chuẩn xác 100%**:
  - 100% câu hỏi Answerable và Distractor có trích dẫn `document_id`, `section_id` và chuỗi `text_citation` khớp từng ký tự với corpus văn bản.
  - 100% câu Unanswerable có citations rỗng `[]` và câu trả lời thừa nhận rõ ràng sự thiếu thông tin.
- [x] **Không để Answer Leakage trong metadata/query**:
  - Query không chứa mã định danh nội bộ `SEC-...` hoặc mã văn bản `CS-...`.
  - Không chứa nguyên văn câu trả lời bên trong câu hỏi, bảo đảm tính công bằng khi chấm điểm Retriever.
- [x] **Bộ công cụ kiểm định & Test tự động**:
  - CLI `validate_rag_dataset.py` tuân thủ mã thoát POSIX (0/1/2).
  - Pytest `test_rag_integrity.py` đạt 9/9 test cases PASS (100%).
- [x] **Báo cáo chính thức Word**:
  - Tệp `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_08.docx` chuẩn form 8 mục theo quy định CyberSoft.
