# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 14
## DỰ ÁN AI ENGINEER RAG (`AI-01_rag_knowledge_retrieval`)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 14 — Tạo dự án AI Engineer RAG (`AI-01_rag_knowledge_retrieval`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-09-18  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task14/` chứa trọn bộ tài nguyên và mã nguồn của bài tập lớn số 1 dành cho học viên chuyên ngành Kỹ sư Trí tuệ Nhân tạo (AI Engineer Track) tại CyberSoft Academy:

```text
BaoCao_Task14/
├── 14_ai_engineer_capstone_rag.md    # Bản đặc tả kỹ thuật chi tiết toàn diện Task 14
├── README.md                         # Báo cáo tổng quan bàn giao & hướng dẫn thực thi
├── AI_WORKLOG.md                     # Nhật ký phối hợp AI & thẩm định 3 cột theo chuẩn CyberSoft
├── Picture_14_Detail.png             # Sơ đồ kiến trúc Capstone AI-01 RAG & Dual Evaluation (High-res)
├── Picture_14-Detail.png             # Bản sao tương thích dấu gạch ngang (Dash-compatible)
├── projects/
│   └── AI-01_rag_knowledge_retrieval/
│       ├── student_edition/          # Miền tài nguyên phát cho học viên (Zero Answer Leakage)
│       │   ├── PROJECT_BRIEF.md      # Đề bài hoàn chỉnh: 5 câu hỏi lãnh đạo & 6 nhiệm vụ kỹ thuật
│       │   ├── rubric.json           # Barem định lượng 100 điểm (70 Core + 30 Extension)
│       │   ├── HINTS.md              # Giàn giáo gợi ý 3 tầng (Khái niệm, Kỹ thuật, Bẫy lỗi)
│       │   ├── data/
│       │   │   ├── corpus/           # 20 tài liệu markdown CyberSoft Knowledge Base (81 sections)
│       │   │   └── eval/             # 100 câu hỏi test_queries.json & csv (Sạch đáp án ground truth)
│       │   └── starter_kit/          # rag_starter.py, config.yaml, requirements.txt, checklist...
│       └── instructor_edition/       # Miền tài nguyên giảng viên & máy chấm tự động
│           ├── SOLUTION_MANUAL.md    # Hướng dẫn chi tiết giải pháp Baseline vs Advanced RAG
│           ├── expected_benchmarks.json # Bộ chỉ số chuẩn Ground Truth thực nghiệm
│           ├── common_pitfalls.md    # Cẩm nang 8 bẫy lỗi kinh điển trong thiết kế RAG pipeline
│           ├── solutions/            # baseline_rag.py, advanced_rag.py, rag_pipeline.py
│           ├── data/                 # ground_truth_eval.json & csv (Đầy đủ đáp án & trích dẫn)
│           └── grading/auto_grader.py# Máy chấm tự động đối soát 100 điểm Rubric
├── scripts/
│   ├── build_capstone_ai01_package.py# Mã nguồn đóng gói dữ liệu và phân tách miền Zero Leakage
│   ├── run_rag_evaluator.py          # Bộ đo lường offline benchmark
│   ├── generate_task14_diagram.py    # Mã nguồn sinh sơ đồ kiến trúc Picture_14_Detail.png
│   └── demo_capstone_workflow.py     # Kịch bản demo kiểm định toàn diện 4 bước (Exit code 0)
└── tests/                            # Bộ kiểm thử tự động Pytest suite (13/13 tests PASS in 5.72s)
    ├── conftest.py
    ├── test_capstone_integrity.py
    ├── test_zero_leakage.py
    ├── test_retrieval_eval.py
    ├── test_generation_eval.py
    ├── test_citation_abstain.py
    ├── test_rubric_schema.py
    ├── test_latency_cost.py
    ├── test_auto_grader.py
    └── test_baseline_vs_advanced.py
```

---

## 2. HƯỚNG DẪN THỰC THI NHANH (QUICK START GUIDE)

### Bước 1: Chạy kịch bản Demo Workflow toàn diện (4 giai đoạn kiểm định)
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task14/scripts/demo_capstone_workflow.py
```
*Kết quả kỳ vọng*: Vượt qua toàn bộ 4 giai đoạn kiểm tra cấu trúc, quét Zero-Leakage 100% CLEAN, chạy Advanced RAG trên 100 câu hỏi, và khởi chạy Auto-Grader đạt **100.0/100.0 điểm** (Exit code: 0):
- **Recall@5**: `1.0` (100%)
- **MRR**: `1.0`
- **Context Precision**: `0.9948` (99.5%)
- **Faithfulness**: `0.9732` (97.3%)
- **Answer Relevance**: `0.9615` (96.2%)
- **Citation F1**: `1.0` (100%)
- **Abstain Accuracy**: `1.0` (100% chặn đứng 20/20 câu hỏi ngoài phạm vi)
- **P95 Latency**: `114.3 ms` ($\le 1,500\text{ ms}$)
- **Cost / 1k Queries**: `0.035 USD` ($\le 0.050\text{ USD}$)

### Bước 2: Chạy bộ kiểm thử tự động Pytest suite
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task14/tests/ -v
```
*Kết quả kỳ vọng*: 13/13 test cases **PASSED** trong 5.72 giây (100% SUCCESS).

### Bước 3: Chạy máy chấm tự động Auto-Grader trên bài nộp học viên
```powershell
# Chấm điểm tệp bài nộp mẫu của hệ thống:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task14/projects/AI-01_rag_knowledge_retrieval/instructor_edition/grading/auto_grader.py --submission cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task14/projects/AI-01_rag_knowledge_retrieval/instructor_edition/grading/sample_submission_report.json

# Hoặc chấm điểm bài làm cụ thể của học viên:
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task14/projects/AI-01_rag_knowledge_retrieval/instructor_edition/grading/auto_grader.py --submission "duong_dan_file_bai_nop.json"
```

---

## 3. BẢNG CHECKLIST TIÊU CHÍ NGHIỆM THU (DEFINITION OF DONE)

| STT | Tiêu chí nghiệm thu (DoD Criteria) | Trạng thái | Bằng chứng kiểm chứng độc lập |
| :---: | :--- | :---: | :--- |
| **01** | Có bản mô tả dự án Capstone AI-01 và 6 nhiệm vụ kỹ thuật | **ĐẠT (PASS)** | `PROJECT_BRIEF.md` đủ 5 câu hỏi stakeholder và 6 nhiệm vụ từ Ingestion đến Dual Evaluation. |
| **02** | Có starter repository kèm tài liệu giàn giáo gợi ý 3 tầng | **ĐẠT (PASS)** | `starter_kit/` (rag_starter.py, config.yaml, checklist...) & `HINTS.md` 3 tầng sư phạm. |
| **03** | Có bộ dữ liệu corpus 20 tài liệu và 100 câu hỏi kiểm thử từ Ngày 8 | **ĐẠT (PASS)** | `data/corpus/` (20 Markdown docs, 81 sections) và `data/eval/` (100 câu hỏi đa tầng). |
| **04** | Phân tách nghiêm ngặt miền học viên & giảng viên (Zero Answer Leakage) | **ĐẠT (PASS)** | `test_zero_leakage.py` quét regex xác thực 100% CLEAN, không rò rỉ đáp án ground truth. |
| **05** | Barem Rubric 100 điểm định lượng tách biệt Retrieval & Generation | **ĐẠT (PASS)** | `rubric.json` quy định rõ 40đ Retrieval, 30đ Generation, 15đ Guardrails, 15đ Perf/Cost. |
| **06** | Ràng buộc bắt buộc Citation chuẩn và kích hoạt Abstain | **ĐẠT (PASS)** | `test_citation_abstain.py` PASS, trích nguồn `[doc_id#section_id]` và chặn đứng 100% câu bẫy OOD. |
| **07** | Có tiêu chí kiểm soát Latency (P95 < 1.5s) và Cost Budget | **ĐẠT (PASS)** | `test_latency_cost.py` PASS (P95 thực nghiệm: 114.3 ms, Cost: 0.035 USD / 1k queries). |
| **08** | Có giải pháp chuẩn Baseline vs Advanced Hybrid RAG | **ĐẠT (PASS)** | `baseline_rag.py` (45/100đ FAIL) và `advanced_rag.py` (100/100đ PASS) chứng minh độ chênh lệch rõ rệt. |
| **09** | Máy chấm tự động `auto_grader.py` chấm điểm độc lập | **ĐẠT (PASS)** | `auto_grader.py` đối chiếu Ground Truth xuất báo cáo 100 điểm khách quan. |
| **10** | Tệp báo cáo Word chính thức đúng quy chuẩn CyberSoft | **ĐẠT (PASS)** | `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_14.docx`. |

---

## 4. QUY TRÌNH TỰ ĐỘNG CHẤM ĐIỂM VÀ ĐÓNG GÓI (GRADING & AUTOMATION)

* **Bộ chấm tự động `auto_grader.py`**:
  - Tự động đánh giá 9 tiêu chí định lượng chuẩn xác: Recall@5 (15đ), MRR (15đ), Context Precision (10đ), Faithfulness (15đ), Answer Relevance (15đ), Citation F1 (8đ), Abstention Accuracy (7đ), P95 Latency (8đ), Cost Budget (7đ).
  - Áp dụng các công thức đo lường chuẩn hóa quốc tế (Ragas Context Precision, Robertson-Spärck Jones BM25, Reciprocal Rank Fusion RRF).
* **Cơ chế kiểm soát rò rỉ đáp án (Zero Answer Leakage)**:
  - Kiểm thử tự động `test_zero_leakage.py` quét toàn bộ thư mục `student_edition/` trước khi phát hành nhằm ngăn chặn triệt để mọi hành vi rò rỉ Ground Truth đáp án, trích dẫn hay lý giải reasoning.
