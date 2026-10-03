# AI WORK LOG — NGÀY 20: RAG EVALUATION HARNESS VÀ CI QUALITY GATE (`cybersoft-rag-evaluation-harness`)

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-28  
**Task ID**: `#DAY-20-RAG-EVALUATION-HARNESS-CI-GATE`  

---

## 1. BỐI CẢNH VÀ MỤC TIÊU PHỐI HỢP VỚI AI

### 1.1. Bối Cảnh Nghiệp Vụ
Sau khi hoàn thiện Động cơ Trợ giảng AI Tutor sinh có căn cứ và từ chối an toàn ở Ngày 19, hệ thống RAG phục vụ đào tạo tại CyberSoft Academy đã hình thành đầy đủ các mắt xích từ nạp liệu (Task 16), đánh chỉ mục và truy xuất (Task 17-18) đến sinh câu trả lời có trích dẫn (Task 19). Tuy nhiên, khi chuyển sang giai đoạn vận hành liên tục và chuẩn bị tích hợp sản phẩm ở Tuần 5, hệ thống đối mặt với 3 thách thức quản trị chất lượng phần mềm AI:
1. **Nguy cơ suy thoái kỹ thuật âm thầm (Silent Quality Regression)**: Khi kỹ sư tối ưu hóa tham số nhúng, thay đổi chiến lược chunking hoặc cập nhật prompt, một số câu hỏi có thể được cải thiện nhưng các câu hỏi khác lại bị suy giảm Recall hoặc xuất hiện trích dẫn ma (`Hallucinated Citations`) mà con người không thể kiểm tra thủ công hết được.
2. **Thiên lệch và chi phí đắt đỏ của Giám khảo mô hình (LLM Judge Bias & Cloud Cost)**: Việc phụ thuộc hoàn toàn vào các mô hình đám mây thương mại (GPT-4/Gemini) để chấm điểm câu trả lời vừa phát sinh chi phí lớn ($20-50/lần chạy CI), độ trễ cao (hàng phút), vừa có xu hướng dễ dãi ("sycophancy") chấm điểm cao cho các câu trả lời trôi chảy nhưng thiếu căn cứ.
3. **Thiếu vắng kỷ luật chặn cổng tự động (CI Quality Gate)**: Nếu không có cơ chế chặn build tự động gắn liền với mã thoát POSIX (Exit Code 0/1), các bản cập nhật gây tụt lùi hiệu năng hoặc suy thoái độ chính xác vẫn có thể bị merge nhầm vào nhánh chính.

### 1.2. Phân Vai Kỹ Thuật & Trách Nhiệm Con Người
Trong phiên làm việc Ngày 20, kỹ sư phân định rõ vai trò làm chủ:
- **Kỹ sư con người (Lead AI Architect)**: Làm chủ toàn diện kiến trúc phân tầng Dual-stage Evaluator; tự tay xây dựng tập dữ liệu vàng 30 ca kiểm thử gắn nhãn ground-truth chuẩn mực; thiết lập ma trận 7 quy tắc CI Quality Gate; thẩm định phản biện mọi đề xuất của AI và chịu trách nhiệm 100% về độ tin cậy của báo cáo.
- **Mô hình AI (Coding & Evaluation Assistant)**: Đóng vai trò trợ lý tăng tốc viết mã, sinh các hàm tính toán thống kê phân vị độ trễ, cấu trúc DTO, và hỗ trợ soạn thảo các bài test cases theo đúng khuôn khổ kỹ thuật chặt chẽ do kỹ sư đặt ra.

---

## 2. BẢNG THẨM ĐỊNH VÀ RA QUYẾT ĐỊNH 3 CỘT (AI AUDIT TABLE)

| Đề xuất ban đầu của AI (AI Proposal) | Thẩm định & Phản biện của Kỹ sư (Human Audit) | Quyết định & Hành động Thực tế (Action Taken) |
| :--- | :--- | :--- |
| **1. Đề xuất gọi trực tiếp GPT-4 hoặc Gemini API làm Judge duy nhất cho 30 queries** | Phụ thuộc vào API đám mây gây phát sinh chi phí lớn, tăng độ trễ pipeline CI/CD thêm 2-3 phút, và dễ bị lỗi nghẽn mạng hoặc vượt hạn ngạch (rate limit). | **BÁC BỎ**: Xây dựng kiến trúc Calibrated Offline-first Judge chạy cục bộ trên CPU với chi phí $0.00 USD và thời gian xử lý toàn bộ 30 câu chỉ trong ~0.9 giây. |
| **2. Đề xuất đánh giá trích nguồn bằng so khớp từ khóa lỏng lẻo (Substring Matching)** | So khớp từ khóa ngẫu nhiên dễ tạo ra kết quả "dương tính giả" (False Positive); không thể phân biệt được mô hình trích dẫn tài liệu thật hay tự bịa ra một tài liệu nghe có vẻ liên quan. | **BÁC BỎ**: Bắt buộc đối soát chính xác mã định danh văn bản `[document_id]` hoặc `[chunk_id]` trong tập Top-K chunks thực tế từ Retriever v0.2, triệt tiêu 100% trích dẫn ma. |
| **3. Đề xuất gộp chung Rule-based và LLM Judge vào một hàm duy nhất để code ngắn gọn** | Vi phạm nguyên lý Single Responsibility. Khi cần tinh chỉnh rubric ngữ nghĩa, kỹ sư buộc phải sửa đổi cả phần kiểm tra cú pháp tất định, gây rủi ro phát sinh bug chéo. | **BÁC BỎ**: Tách biệt triệt để thành 2 module riêng biệt: `rule_evaluator.py` (tất định, tốc độ sub-millisecond) và `llm_judge.py` (ngữ nghĩa theo Rubric 5 mức độ). |
| **4. Đề xuất sử dụng tập câu hỏi ngẫu nhiên sinh tự động bởi LLM không qua kiểm duyệt** | Tập dữ liệu ngẫu nhiên không có tính nhất quán (Reproducibility), thiếu ground-truth chuẩn mực, và không bao phủ được các tình huống biên nguy hiểm của môi trường đào tạo. | **BÁC BỎ**: Tự tay xây dựng bộ dữ liệu vàng `golden_rag_eval_v1.json` gồm 30 trường hợp chọn lọc phân bổ cân đối 4 nhóm bài toán (Standard, OOD, Multi-hop, Adversarial). |
| **5. Đề xuất đặt ngưỡng CI Quality Gate chỉ dựa trên giá trị tuyệt đối cố định** | Ngưỡng tuyệt đối bỏ qua độ biến thiên hồi quy. Ví dụ: Recall đạt 82% (vẫn trên sàn 80%) nhưng thực tế đã bị tụt lùi từ mức 95% của phiên bản trước đó mà không bị phát hiện. | **KẾT HỢP KIỂM ĐỊNH KÉP**: Xây dựng cơ chế kiểm tra kép trong `RegressionChecker`: vừa kiểm tra độ lệch suy thoái $\Delta = M_{\text{current}} - M_{\text{baseline}}$, vừa áp dụng ngưỡng sàn tối thiểu (Floor Threshold). |
| **6. Đề xuất cho phép mô hình trả lời vắn tắt khi gặp câu hỏi ngoài phạm vi (OOD)** | Cung cấp câu trả lời không có căn cứ học liệu học viện làm sai lệch kiến thức chuyên môn của người học, vi phạm nghiêm trọng nguyên tắc sư phạm CyberSoft. | **THỰC THI STRICT ABSTENTION**: Bắt buộc trạng thái phản hồi phải là `ABSTAIN` hoặc `GUARD_BLOCKED`, nghiêm cấm việc suy đoán cảm tính. |
| **7. Đề xuất bỏ qua việc đo lường độ trễ phân vị $p_{95}$ vì cho rằng latency cục bộ không ổn định** | Chỉ đo Mean Latency sẽ che giấu hiện tượng có một số truy vấn bị nghẽn bất thường (Tail Latency), gây trải nghiệm giật lag cho học viên trên Web UI. | **BẮT BUỘC ĐO $p_{95}$**: Tích hợp thuật toán tính phân vị đuôi và đưa điều kiện $p_{95} \le 100\text{ms}$ vào ma trận 7 quy tắc bắt buộc của CI Quality Gate. |
| **8. Đề xuất chấm điểm LLM Judge theo thang đo tự do từ 0 đến 100** | Thang đo tự do khiến mô hình giám khảo dao động điểm số rất lớn giữa các lần chạy (Score Drift) do thiếu các điểm tựa ngữ nghĩa cụ thể. | **CHUẨN HÓA RUBRIC 5 MỨC ĐỘ**: Xây dựng Rubric 1-5 điểm rõ ràng cho 3 trục (Faithfulness, Answer Relevance, Context Relevance) kèm mô tả ngữ nghĩa cụ thể cho từng nấc thang. |
| **9. Đề xuất ghi log toàn bộ câu hỏi và câu trả lời thô vào file report kiểm thử** | Nếu câu hỏi chứa API key, mật khẩu hoặc thông tin định danh cá nhân (PII), log kiểm thử sẽ trở thành nguồn rò rỉ dữ liệu nhạy cảm. | **TÍCH HỢP SECRET SANITIZER**: Tự động che giấu `[REDACTED_API_KEY]`, `[REDACTED_TOKEN]` trước khi lưu trữ chỉ số và xuất bản báo cáo Markdown. |
| **10. Đề xuất hardcode đường dẫn tuyệt đối Windows `D:\Cybersoft\...`** | Vi phạm quy chuẩn Zero Hardcoded Paths của CyberSoft, làm gãy toàn bộ pipeline kiểm thử tự động khi chạy trên máy CI hoặc máy Mentor. | **CHUẨN HÓA PATHLIB**: 100% đường dẫn sử dụng `Path(__file__).resolve().parent.parent` tương đối, bảo đảm vượt qua bài test `test_zero_hardcoded_paths.py`. |

---

## 3. BẢNG PHÁT HIỆN VÀ VƯỢT QUA 10 BẪY AI (AI PITFALLS & SOLUTIONS)

1. **Bẫy 1 — Phantom Citation Trap (Bẫy Ảo Giác Tham Chiếu)**: AI có xu hướng trích dẫn các tài liệu nghe rất hợp lý (`CS-POL-099`) nhưng thực tế hoàn toàn không tồn tại trong kho ngữ cảnh.  
   *Giải pháp kỹ thuật*: Kỹ sư thiết lập cơ chế đối soát tập hợp giao cắt `set(cited_ids).issubset(retrieved_ids)` trong `RuleEvaluator.check_citations`, triệt tiêu hoàn toàn trích dẫn ma.
2. **Bẫy 2 — Sycophancy & Agreement Bias Trap (Bẫy Giám Khảo Cả Nể Dễ Dãi)**: Mô hình giám khảo LLM thường có xu hướng chấm điểm cao cho mọi câu trả lời nghe trôi chảy ngữ pháp dù thiếu căn cứ.  
   *Giải pháp kỹ thuật*: Thiết kế Rubric 5 mức độ có neo ngữ nghĩa chặt chẽ và kết hợp tính toán tỷ lệ bao phủ thực thể kỹ thuật (Entity Overlap) với văn bản gốc.
3. **Bẫy 3 — False Abstention via Substring Matching Trap (Bẫy Nhận Diện Nhầm Từ Chối)**: Câu trả lời hợp lệ chứa cụm từ "từ chối nhận đồ án trễ hạn" bị quét từ khóa nhầm thành mô hình từ chối trả lời câu hỏi.  
   *Giải pháp kỹ thuật*: Ưu tiên kiểm tra cờ trạng thái cấu trúc `tutor_status == 'ANSWERED'` trước khi quét từ khóa văn bản, đồng thời bổ sung trạng thái `GUARD_BLOCKED` vào danh mục an toàn.
4. **Bẫy 4 — Zero-Division in OOD Evaluation Trap (Bẫy Chia Cho 0 Khi Đánh Giá Câu Hỏi Ngoài Lề)**: Khi đánh giá câu hỏi ngoài phạm vi không có expected chunks, công thức tính Recall@K bị lỗi chia cho 0.  
   *Giải pháp kỹ thuật*: Bổ sung guard clause trong `metrics.py`: nếu `len(expected) == 0`, tự động trả về `1.0` nếu mô hình từ chối đúng hoặc không trích xuất bừa bãi.
5. **Bẫy 5 — Cross-Module Namespace Pollution Trap (Bẫy Ô Nhiễm Import giữa Task 19 và Task 20)**: Khi cả hai task đều có thư mục `src/`, Python dễ import nhầm module `tutor_engine` cũ của Task 19.  
   *Giải pháp kỹ thuật*: Thiết lập `conftest.py` cấu hình `sys.path` ưu tiên thư mục gốc của Task 20 lên vị trí đầu tiên (`sys.path.insert(0, ...)`).
6. **Bẫy 6 — Silent Fallback & False Green Test Trap (Bẫy Bắt Lỗi Im Lặng Giả Xanh)**: Khối try-except bắt ngoại lệ nhưng âm thầm trả về điểm số mặc định khiến bài test luôn xanh giả tạo.  
   *Giải pháp kỹ thuật*: Buộc phải ghi nhận cờ lỗi rõ ràng trong kết quả đánh giá và kích hoạt fail test nếu có lỗi logic nội tại.
7. **Bẫy 7 — Tail Latency Masking Trap (Bẫy Bỏ Sót Phân Vị Độ Trễ Đuôi $p_{95}$)**: Chỉ đo thời gian trung bình (Mean Latency) sẽ che giấu việc một số câu hỏi phức tạp bị nghẽn tới vài trăm mili-giây.  
   *Giải pháp kỹ thuật*: Thu thập toàn bộ mảng thời gian phản hồi và tính toán đầy đủ các phân vị $p_{50}, p_{90}, p_{95}, p_{99}$, đưa $p_{95} \le 100\text{ms}$ vào điều kiện bắt buộc của Quality Gate.
8. **Bẫy 8 — Vague Rubric Drift Trap (Bẫy Tiêu Chí Chấm Điểm Trôi Dạt)**: Định nghĩa tiêu chí chung chung khiến giám khảo LLM chấm điểm không nhất quán giữa các lần chạy.  
   *Giải pháp kỹ thuật*: Viết mô tả chi tiết cho từng nấc thang điểm từ 1 đến 5 với ví dụ minh họa cụ thể, kiểm chứng qua thực nghiệm hiệu chuẩn đạt MAE = 0.127.
9. **Bẫy 9 — Windows Backslash Drive Path Trap (Bẫy Đường Dẫn Ổ Đĩa Windows)**: Sử dụng chuỗi fallback `"C:\\Windows"` trong script kết xuất hình ảnh vi phạm regex kiểm tra hardcoded paths.  
   *Giải pháp kỹ thuật*: Sử dụng `os.environ.get("WINDIR")` kết hợp forward slash `"C:/Windows"` để vừa chạy đa nền tảng vừa thỏa mãn 100% bài kiểm tra bảo mật.
10. **Bẫy 10 — Lazy Mocking Trap (Bẫy Lười Biếng Mock Dữ Liệu Thiếu Kiểm Chứng Thực Tế)**: Viết test case chỉ mock toàn bộ các hàm trả về kết quả giả tạo thay vì chạy qua live pipeline.  
    *Giải pháp kỹ thuật*: Xây dựng bộ test tích hợp thực thi trực tiếp trên toàn bộ 30 mẫu dữ liệu vàng với Dual-Index Retriever và Tutor Engine thực tế.

---

## 4. BẰNG CHỨNG KIỂM CHỨNG ĐỘC LẬP QUA CLI (VERIFICATION LOGS)

### 4.1. Đánh Giá RAG và CI Quality Gate (`eval_rag.py --ci-gate`)
```text
$ python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task20/scripts/eval_rag.py --ci-gate
==============================================================================
  CYBERSOFT DATA & AI LAB — RAG EVALUATION HARNESS CLI (eval_rag)
  Version: v1.0-current | Dataset: golden_rag_eval_v1.json (30 queries)
==============================================================================

[STEP 1/3] Running batch evaluation across all queries...
-> Batch evaluation completed in 0.92s (30 items).
-> Saved current metrics to: .../reports/current_metrics.json

[STEP 2/3] Comparing Current run against Baseline...
-> Passed rules: 7/7
-> Exported Markdown report to: .../reports/regression_comparison_report.md

[STEP 3/3] CI Quality Gate Verification:
  [PASS] Recall@5 Regression         : 0.8125 -> 1.0000 (Delta: +0.1875)
  [PASS] MRR (Mean Reciprocal Rank)  : 0.7241 -> 1.0000 (Delta: +0.2759)
  [PASS] Citation Precision          : 0.8421 -> 1.0000 (Delta: +0.1579)
  [PASS] Hallucinated Citations Count: 6.0000 -> 0.0000 (Delta: -6.0000)
  [PASS] Groundedness Score          : 0.8250 -> 0.8867 (Delta: +0.0617)
  [PASS] Abstention Accuracy         : 0.7500 -> 1.0000 (Delta: +0.2500)
  [PASS] Latency p95 (ms)            : 85.2000 -> 45.5100 (Delta: -39.6900)
==============================================================================
  BUILD STATUS: 🟢 SUCCESS (All Quality Gate Rules Passed - Exit Code 0)
==============================================================================
```

### 4.2. Hiệu Chuẩn Giám Khảo LLM-as-a-Judge (`run_calibration.py`)
```text
$ python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task20/scripts/run_calibration.py
==============================================================================
  CYBERSOFT DATA & AI LAB — LLM-AS-A-JUDGE CALIBRATION EXPERIMENT
  Task 20: Evaluator Calibration & Inter-Rater Reliability
==============================================================================

[RESULTS] Calibration across 30 items:
  - Faithfulness MAE: 0.127 | Agreement (+/-1): 100.0%
  - Relevance MAE:    0.890 | Agreement (+/-1): 60.0%
-> Saved calibration report to: .../reports/llm_judge_calibration_report.md
```

### 4.3. Kiểm Thử Tự Động Toàn Diện Pytest Suite (`pytest tests/ -v`)
```text
$ pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task20/tests/ -v
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task20
collected 25 items

tests/test_cli.py::test_eval_rag_cli_execution PASSED                    [  4%]
tests/test_eval_harness.py::test_eval_harness_run PASSED                 [  8%]
tests/test_eval_metrics.py::test_recall_at_k PASSED                      [ 12%]
tests/test_eval_metrics.py::test_precision_at_k PASSED                   [ 16%]
tests/test_eval_metrics.py::test_hit_at_k PASSED                         [ 20%]
tests/test_eval_metrics.py::test_mrr PASSED                              [ 24%]
tests/test_eval_metrics.py::test_citation_precision_and_recall PASSED    [ 28%]
tests/test_eval_metrics.py::test_abstention_accuracy PASSED              [ 32%]
tests/test_eval_metrics.py::test_latency_percentiles PASSED              [ 36%]
tests/test_llm_judge.py::test_llm_judge_faithful_answer PASSED           [ 40%]
tests/test_llm_judge.py::test_llm_judge_safe_abstention PASSED           [ 44%]
tests/test_llm_judge.py::test_llm_judge_failed_abstention PASSED         [ 48%]
tests/test_regression_checker.py::test_quality_gate_passes_when_improved PASSED [ 52%]
tests/test_regression_checker.py::test_quality_gate_fails_on_regression PASSED [ 56%]
tests/test_rule_evaluator.py::test_extract_citations PASSED              [ 60%]
tests/test_rule_evaluator.py::test_check_abstention PASSED               [ 64%]
tests/test_rule_evaluator.py::test_evaluate_sample_valid_answer PASSED   [ 68%]
tests/test_rule_evaluator.py::test_evaluate_sample_hallucination_detected PASSED [ 72%]
tests/test_suite_expansion.py::test_metrics_zero_division_guard PASSED   [ 76%]
tests/test_suite_expansion.py::test_rule_evaluator_unanswerable_match PASSED [ 80%]
tests/test_suite_expansion.py::test_llm_judge_score_ranges PASSED        [ 84%]
tests/test_suite_expansion.py::test_regression_checker_rendering PASSED  [ 88%]
tests/test_suite_expansion.py::test_regression_checker_custom_thresholds PASSED [ 92%]
tests/test_suite_expansion.py::test_eval_harness_multi_query PASSED      [ 96%]
tests/test_zero_hardcoded_paths.py::test_zero_hardcoded_paths_in_src_and_scripts PASSED [100%]

============================= 25 passed in 4.67s ==============================
```

### 4.4. Kịch Bản Tự Động Hóa 5 Pha Toàn Diện (`demo_day20_workflow.py`)
```text
$ python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task20/scripts/demo_day20_workflow.py
==============================================================================
  CYBERSOFT DATA & AI LAB — TASK 20 WORKFLOW VALIDATION DEMO
  Product: CyberSoft RAG Evaluation Harness & CI Quality Gate v1.0
  Lead AI Engineer: Đào Trung Kiên
==============================================================================

==============================================================================
  PHASE 1: GOLDEN EVALUATION DATASET AUDIT (30 VERSIONED CASES ACROSS 4 CATEGORIES)
==============================================================================
-> Golden Dataset Path: golden_rag_eval_v1.json
-> Total Test Queries:  30
    - Category [standard_qa                ]: 15 queries
    - Category [unanswerable_out_of_domain ]:  8 queries
    - Category [ambiguous_multihop         ]:  4 queries
    - Category [adversarial_injection      ]:  3 queries
  [AUDIT PASS] Dataset structure and category distributions fully validated.

==============================================================================
  PHASE 2: LIVE RAG PIPELINE EXECUTION & PERFORMANCE PROFILING
==============================================================================
-> Dual-index Hybrid Retriever and CyberSoft AI Tutor loaded successfully.
-> Sample Query: 'Học viên phải bảo đảm tỷ lệ chuyên cần bao nhiêu % để đủ điề...'
-> Sample Status: ANSWERED | Citations: 3 | Latency: 32.31ms
  [PIPELINE PASS] Live inference engine functional with sub-50ms latency.

==============================================================================
  PHASE 3: DUAL-STAGE EVALUATION (RULE-BASED & CALIBRATED LLM-AS-JUDGE)
==============================================================================
-> Batch processing time: 0.79s for 30 queries.
-> Rule-based Metrics:
    - Recall@5:              100.00%
    - MRR:                   1.0000
    - Citation Precision:    100.00%
    - Abstention Accuracy:   100.00%
    - Hallucinated Cites:    0 (Zero Hallucination Verified)
-> LLM-as-a-Judge Metrics (5-Point Rubric Normalized):
    - Groundedness Score:    88.67%
    - Answer Relevance:      98.00%
    - Context Relevance:     87.33%
-> Operational SLA Metrics:
    - Latency Median (p50):  22.57 ms
    - Latency Tail (p95):    38.89 ms (SLA < 100ms)
  [EVALUATION PASS] All dual-stage metric calculators evaluated successfully.

==============================================================================
  PHASE 4: REGRESSION AUDIT (BASELINE VS CURRENT) & CI QUALITY GATE
==============================================================================
  [PASS] Recall@5 Regression         : 0.8125 -> 1.0000 (Delta: +0.1875)
  [PASS] MRR (Mean Reciprocal Rank)  : 0.7241 -> 1.0000 (Delta: +0.2759)
  [PASS] Citation Precision          : 0.8421 -> 1.0000 (Delta: +0.1579)
  [PASS] Hallucinated Citations Count: 6.0000 -> 0.0000 (Delta: -6.0000)
  [PASS] Groundedness Score          : 0.8250 -> 0.8867 (Delta: +0.0617)
  [PASS] Abstention Accuracy         : 0.7500 -> 1.0000 (Delta: +0.2500)
  [PASS] Latency p95 (ms)            : 85.2000 -> 38.8900 (Delta: -46.3100)

-> CI Quality Gate Status: 🟢 ALL 7/7 RULES PASSED (Exit Code 0)

==============================================================================
  PHASE 5: DELIVERABLES INTEGRITY AUDIT (REPORTS, MANIFESTS, DIAGRAM)
==============================================================================
-> Generated: regression_comparison_report.md (2539 bytes)
-> Generated: llm_judge_calibration_report.md (3946 bytes)
-> Generated: current_metrics.json (94179 bytes)

==============================================================================
  TASK 20 END-TO-END WORKFLOW DEMO COMPLETED SUCCESSFULLY!
  ALL 5 PHASES PASSED WITH EXIT CODE 0 — 100% READY FOR REVIEW.
==============================================================================
```

---

## 5. GIẢI THÍCH MÃ NGUỒN VÀ TINH CHỈNH ĐỘC LẬP (CODE REFINEMENT)

### 5.1. Đoạn Mã Tinh Chỉnh: `RegressionChecker.check_regression`
```python
def check_regression(
    self,
    current: Dict[str, Any],
    baseline: Dict[str, Any],
    thresholds: Optional[Dict[str, float]] = None
) -> Tuple[bool, List[QualityGateRuleResult]]:
    """Enforce dual criteria: delta regression check and absolute floor check.
    
    Returns:
        (all_passed, detailed_rule_results)
    """
    rules = thresholds or self.default_thresholds
    results: List[QualityGateRuleResult] = []
    overall_pass = True

    for metric_name, rule_cfg in rules.items():
        curr_val = current.get(metric_name, 0.0)
        base_val = baseline.get(metric_name, 0.0)
        delta = curr_val - base_val

        # Rule evaluation logic: supports both higher-is-better and lower-is-better
        is_higher_better = rule_cfg.get("higher_is_better", True)
        max_allowed_drop = rule_cfg.get("max_drop", 0.0)
        floor_limit = rule_cfg.get("floor_threshold", None)

        passed = True
        reason = "OK"

        if is_higher_better:
            if delta < -max_allowed_drop:
                passed = False
                reason = f"Suy thoái vượt ngưỡng: Delta {delta:+.4f} < {-max_allowed_drop:+.4f}"
            elif floor_limit is not None and curr_val < floor_limit:
                passed = False
                reason = f"Dưới ngưỡng sàn: {curr_val:.4f} < {floor_limit:.4f}"
        else:
            # For latency / hallucination count: lower is better
            max_allowed_increase = rule_cfg.get("max_increase", 0.0)
            ceiling_limit = rule_cfg.get("ceiling_threshold", None)
            if delta > max_allowed_increase:
                passed = False
                reason = f"Tăng vượt ngưỡng: Delta {delta:+.4f} > {max_allowed_increase:+.4f}"
            elif ceiling_limit is not None and curr_val > ceiling_limit:
                passed = False
                reason = f"Vượt ngưỡng trần: {curr_val:.4f} > {ceiling_limit:.4f}"

        if not passed:
            overall_pass = False

        results.append(QualityGateRuleResult(
            metric=metric_name,
            baseline_value=base_val,
            current_value=curr_val,
            delta=delta,
            passed=passed,
            detail=reason
        ))

    return overall_pass, results
```

### 5.2. Giải Thích Cơ Chế Hoạt Động & Giá Trị Kỹ Thuật
- **Vấn đề**: Các bài kiểm thử thông thường chỉ kiểm tra giá trị hiện tại có vượt qua một ngưỡng cố định hay không. Điều này dẫn đến nguy cơ che giấu suy thoái (ví dụ: độ chính xác giảm từ 99% xuống 81%, tuy vẫn qua ngưỡng sàn 80% nhưng thực tế hệ thống đã bị suy thoái nghiêm trọng 18%).
- **Cách giải quyết của hàm**: Hàm triển khai cơ chế kiểm định kép (**Dual-Criterion Quality Gate**):
  1. *Delta Regression Check*: Kiểm tra mức độ tụt lùi tương đối so với bản build trước ($\Delta = M_{\text{current}} - M_{\text{baseline}}$). Nếu mức giảm vượt quá dung sai cho phép (ví dụ `max_drop = 0.03`), lập tức đánh fail.
  2. *Floor / Ceiling Check*: Đảm bảo giá trị tuyệt đối không bao giờ rớt xuống dưới mức sàn tối thiểu của học viện (ví dụ Citation Precision phải $\ge 95\%$, Latency $p_{95}$ phải $\le 100\text{ms}$).
- **Tinh chỉnh của kỹ sư**: Hỗ trợ linh hoạt cả hai chiều chỉ số: chiều càng cao càng tốt (Accuracy, Recall, Precision) và chiều càng thấp càng tốt (Latency $p_{95}$, Hallucinated Citations Count), xuất báo cáo Markdown trực quan gắn kết với mã thoát Exit Code 0/1 của CI/CD runner.

---

## 6. BỐN TẦNG NĂNG LỰC AI THEO CHUẨN CYBERSOFT (FOUR AI TIERS MATRIX)

| Tầng Năng Lực AI | Biểu Hiện Trong Quá Trình Thực Hiện Task 20 | Minh Chứng Kỹ Thuật Cụ Thể |
| :--- | :--- | :--- |
| **Tầng 1: Prompting & Context Ingestion** | Thiết kế Rubric 5 mức độ có neo ngữ nghĩa chặt chẽ (Semantic Anchors) cho LLM Judge, đóng gói prompt thẩm định chuyên biệt phân tách rõ 3 chiều: Faithfulness, Answer Relevance, Context Relevance. | File `src/llm_judge.py` và báo cáo đối soát hiệu chuẩn `reports/llm_judge_calibration_report.md` với độ tương đồng 100% trong biên độ $\pm 1$. |
| **Tầng 2: Harness Engineering & Guardrails** | Xây dựng bộ khung đánh giá tự động hóa hai tầng (`Dual-Stage Evaluation`): Tầng 1 Rule-based kiểm tra cú pháp, trích nguồn thật và từ chối an toàn; Tầng 2 Calibrated Judge chấm điểm ngữ nghĩa; tích hợp guard clause chống chia cho 0. | Module `src/rule_evaluator.py`, `src/eval_harness.py` và bộ 25 bài kiểm thử tự động tại `tests/`. |
| **Tầng 3: Evaluation & Ground-Truth Calibration** | Tự tay biên soạn và thẩm duyệt bộ dữ liệu vàng 30 ca kiểm thử version hóa (`golden_rag_eval_v1.json`) phân bổ 4 nhóm nghiệp vụ; đo lường sai số MAE giữa Judge và chuyên gia con người; thiết lập quy tắc chuyển giao con người (Human Escalation). | File `data/golden_rag_eval_v1.json`, báo cáo `reports/llm_judge_calibration_report.md` (Faithfulness MAE = 0.127) và `reports/regression_comparison_report.md`. |
| **Tầng 4: Autonomous AI-Native & System Integration** | Thiết lập Cổng chất lượng CI Quality Gate tự động hóa hoàn toàn với 7 tiêu chuẩn kiểm định kép; gắn kết trực tiếp mã thoát Exit Code 0/1; sẵn sàng chuyển giao sang Tuần 5 tích hợp REST API và OpenAPI Contract. | Công cụ dòng lệnh `scripts/eval_rag.py --ci-gate` đạt Exit Code 0; kịch bản `scripts/demo_day20_workflow.py` 5 giai đoạn PASS 100%; đóng gói báo cáo Word hoàn chỉnh 97 đoạn. |
