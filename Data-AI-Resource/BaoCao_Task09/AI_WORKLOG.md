# AI WORK LOG — NGÀY 09: PIPELINE SINH DỮ LIỆU CÓ KIỂM SOÁT BẰNG AI

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-09-11  
**Task ID**: `#DAY-09-AI-CONTROLLED-SYNTHESIS-PIPELINE`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu Kỹ thuật Ban đầu
* **Mục tiêu**: Xây dựng toàn diện một **Pipeline sinh dữ liệu có kiểm soát bằng AI (AI-Controlled Synthetic Data Pipeline)** nhằm tạo ra tập dữ liệu đánh giá học vụ chuẩn hóa `synthetic_learning_eval_dataset` gồm 100 bản ghi chi tiết về học viên, bài toán lập trình, kết quả nộp bài, điểm số và nhận xét sư phạm trên 5 chuyên ngành trọng điểm của CyberSoft Academy.
* **Tiêu chí nghiệm thu (Acceptance Criteria / DoD)**:
  1. **Thiết kế Prompt & Schema có cấu trúc**: Sử dụng JSON Schema (Draft 2020-12) và Pydantic để kiểm soát chặt chẽ Structured Output; quản lý phiên bản prompt có hệ thống.
  2. **Tính tất định & Tái lập 100%**: Ứng dụng Faker (`vi_VN`) kết hợp kiểm soát seed tập trung (`seed=42`). Cùng một seed phải tái sinh ra tập dữ liệu khớp chính xác từng bit (Bit-exact match).
  3. **Data Quality Harness & Vòng lặp tự sửa lỗi (Loop Engineering)**: Kiểm định 7 chốt chặn bảo vệ (Guardrails) đa tầng. Khi phát hiện bản ghi vi phạm, Harness tự động tạo thông điệp chẩn đoán có cấu trúc gửi ngược lại cho AI tự điều chỉnh.
  4. **Kiểm soát vòng lặp và Cơ chế Fallback an toàn**: Giới hạn số lần thử tối đa `MAX_RETRIES = 3` để ngăn ngừa vòng lặp vô hạn (Infinite Loop) và lãng phí token/GPU; kích hoạt Fallback Generator tự động khi vượt ngưỡng.
  5. **Bàn giao đủ 3 cấu phần**: Generator script, Prompt versioning files, Error correction loop logs.
  6. **Kiểm thử độc lập**: CLI Validator tuân thủ chuẩn mã thoát POSIX (0/1/2) và Test suite Pytest đạt 100% PASS.

### Rủi ro dự kiến & Bẫy AI thường gặp
* **Bẫy Không nhất quán Số học (Arithmetic Inconsistency)**: Khi được yêu cầu sinh các tiêu chí rubric kèm trọng số phần trăm, mô hình ngôn ngữ lớn (LLM) thường sinh các con số cảm tính (ví dụ: $30\% + 40\% + 40\% = 110\%$, hoặc $25\% + 25\% + 25\% = 75\%$), làm sai lệch hoàn toàn công thức tính điểm của hệ sinh thái LMS.
* **Bẫy Mâu thuẫn Logic Nghiệp vụ (Business Rule Contradiction)**: AI có xu hướng gán điểm cao một cách máy móc (ví dụ: gán điểm 85-90) ngay cả khi trạng thái bài nộp là `FAILED_TESTS` hoặc `SYNTAX_ERROR`, gây mất uy tín dữ liệu kiểm định.
* **Bẫy Ký tự Rác & Placeholder ngầm**: Khi sinh khối lượng lớn, AI thường chèn các chuỗi giả lập như `[TODO: Viết thêm]`, `undefined`, `NaN`, `Lorem ipsum` hoặc viết mã nguồn dạng comment sơ sài.
* **Bẫy Vòng lặp Vô hạn (Infinite Loop Trap)**: Nếu AI liên tục sinh sai cấu trúc mà hệ thống không có giới hạn lặp hoặc không có cơ chế Fallback, pipeline sẽ bị treo vô tận hoặc gây cạn kiệt tài nguyên tính toán.
* **Bẫy Bất đối xứng Mã định danh (Schema Pattern Mismatch)**: AI đề xuất regex quá hẹp hoặc không lường hết các tên viết tắt của chuyên ngành (ví dụ: `[A-Z]{3,4}` không bao quát được tiền tố `DEVOPS`), dẫn đến việc từ chối oan các bản ghi nghiệp vụ hợp lệ.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & Codex (Model: Gemini 3.8 Flash).
* **Mục tiêu tương tác**: Thiết kế cấu trúc JSON Schema Draft 2020-12, tối ưu hóa các phiên bản Prompt Template (v1 Zero-Shot sang v2.1 Few-Shot Constrained), xây dựng Data Quality Harness với 7 chốt chặn bảo vệ, thiết kế cơ chế vòng lặp tự sửa lỗi và bộ sinh dự phòng tất định Fallback.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Principal AI Data Architect & Automation Lead tại CyberSoft Academy.
Bối cảnh: Triển khai Task 09 trong Kế hoạch 30 ngày Thực tập sinh Data & AI Resource Engineer.
Nhiệm vụ: Xây dựng Pipeline sinh dữ liệu có kiểm soát bằng AI kết hợp Faker vi_VN, quản lý seed tất định, tích hợp Data Quality Harness với vòng lặp tự sửa lỗi và Fallback.
Yêu cầu kỹ thuật chi tiết:
1. Thiết kế JSON Schema Draft 2020-12 (record_schema.json) cho bản ghi đánh giá học tập 5 chuyên ngành CyberSoft.
2. Xây dựng 2 phiên bản prompt: v1_zero_shot.json (khởi tạo, dễ gặp lỗi số học để thử nghiệm harness) và v2_few_shot_constrained.json (sản xuất, tích hợp mẫu chuẩn và bảng ràng buộc bất biến invariants).
3. Hiện thực Data Quality Harness (quality_harness.py) kiểm định 7 chốt chặn: Schema, Rubric Sum 100%, Score-Status Correlation, Anti-Leakage/Placeholder, Min-Length, Track Enum và Checksum SHA-256.
4. Hiện thực Generator Engine (generate_controlled_data.py) điều phối Faker vi_VN, vòng lặp sửa lỗi (max_retries = 3) và Deterministic Fallback Generator. Ghi vết toàn bộ quá trình vào data/logs/error_correction_loop.log.
5. Xây dựng CLI Validator (validate_task09_deliverables.py) với mã thoát POSIX 0/1/2 và Pytest test suite đạt 100% PASS.
6. Soạn thảo README.md, AI_WORKLOG.md và tài liệu kỹ thuật chi tiết.
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

Trong quá trình đồng hành cùng AI, kỹ sư con người đã chủ động kiểm soát, phát hiện các sai lệch kỹ thuật và đưa ra quyết định chỉnh sửa dứt khoát:

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Quy định regex cho `challenge_id` là `^CHAL-[A-Z]{3,4}-[0-9]{3}$`**. | **Lỗi chặn oan bản ghi hợp lệ (False Positive Rejection)**: Mã chuyên ngành `DEVOPS` có 6 ký tự (`CHAL-DEVOPS-001`), dẫn đến việc toàn bộ 20 bản ghi chuyên ngành DevOps Cloud bị Harness từ chối và kích hoạt Fallback không đáng có. | **MỞ RỘNG BIÊN ĐỘ REGEX LÊN `[A-Z]{3,6}`**: Cập nhật trực tiếp `record_schema.json` và `record_schema.md` sang pattern `^CHAL-[A-Z]{3,6}-[0-9]{3}$` để hỗ trợ đầy đủ các mã chuyên ngành (WEB, DATA, DEV, DEVOPS, SEC, MOB). |
| **Sử dụng vòng lặp `while not passed:` không giới hạn số lần thử**. | **Nguy cơ rơi vào Vòng lặp Vô hạn (Infinite Loop)**: Nếu AI gặp lỗi suy luận lặp lại hoặc dịch vụ API gặp sự cố, tiến trình sẽ bị treo cứng vĩnh viễn, làm sập CI/CD pipeline và tiêu tốn ngân sách API. | **ÁP DỤNG NGĂN CHẶN CỨNG `MAX_RETRIES = 3` KÈM DETERMINISTIC FALLBACK**: Giới hạn tối đa 3 lần sửa lỗi. Nếu sau 3 lần vẫn vi phạm, kích hoạt ngay `_generate_fallback_record()` để bảo đảm tính liên tục (Zero-Downtime Pipeline) và gắn nhãn `FALLBACK_APPLIED` để kiểm toán. |
| **Chỉ dùng một lệnh `random.seed(42)` duy nhất ở đầu chương trình**. | **Trôi dạt tính tất định khi xử lý đa luồng hoặc tái sinh từng phần**: Nếu thứ tự sinh bản ghi bị thay đổi, các bản ghi phía sau sẽ nhận các giá trị hạt giống khác nhau, phá vỡ tính độc lập của từng record. | **THIẾT KẾ DETERMINISTIC SEED PROGRESSION THEO TỪNG RECORD**: Tính toán sub-seed độc lập cho mỗi bản ghi thứ $i$: `sub_seed = (global_seed * 10007 + i * 37) % (2^31 - 1)`. Đảm bảo tái sinh bất kỳ bản ghi nào cũng luôn thu được kết quả bit-exact giống hệt nhau. |
| **AI đề xuất đánh giá Rubric chỉ cần tổng xấp xỉ $\approx 100\%$ (cho phép dung sai $\pm 5\%$)**. | **Vi phạm nguyên tắc bất biến kế toán và kiểm định hệ thống**: Cho phép dung sai sẽ tạo tiền lệ xấu cho dữ liệu học vụ, khiến bảng điểm học viên bị lệch và gây tranh cãi khi công bố kết quả tốt nghiệp. | **ÉP BUỘC TUÂN THỦ TUYỆT ĐỐI BẤT BIẾN $\sum w_i = 100$**: Bác bỏ dung sai, thiết lập chốt chặn `GR-02-RUBRIC-SUM` ở mức `CRITICAL` và cấu hình cơ chế tự cân bằng trọng số ở tiêu chí cuối cùng trong prompt v2.1. |
| **Chỉ kiểm tra JSON Schema cơ bản mà không kiểm tra tương quan giữa trạng thái nộp bài và điểm số**. | **Mâu thuẫn ngữ nghĩa nghiêm trọng**: Dữ liệu sinh ra xuất hiện các bản ghi học viên làm bài bị lỗi cú pháp (`SYNTAX_ERROR`) nhưng vẫn nhận 80-90 điểm. | **THIẾT LẬP GUARDRAIL NGHIỆP VỤ `GR-03-SCORE-STATUS`**: Xây dựng ma trận dải điểm bắt buộc cho từng trạng thái: PASSED (70-100), FAILED_TESTS (30-69), SYNTAX_ERROR/TIMEOUT (0-29). |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không tin tưởng mù quáng vào kết luận của AI mà thiết lập quy trình kiểm chứng thực nghiệm độc lập thông qua việc chạy trực tiếp Generator Engine, CLI Validator và bộ 10 Pytest Unit Tests.

### 4.1. Lệnh chạy và Kết quả CLI Validator:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task09/scripts/validate_task09_deliverables.py
```

**Nhật ký thực tế (Console Output)**:
```text
================================================================================
 CYBERSOFT DATA & AI RESOURCE QUALITY GATE — TASK 09 VALIDATOR
 Pipeline sinh dữ liệu có kiểm soát bằng AI & Data Quality Harness
================================================================================

[STAGE 1] Checking Directory & Essential Files Existence...
  -> All 22 essential files exist.

[STAGE 2] Validating Schemas and Prompt Versioning Files...
  -> Schemas and prompt templates validated successfully.

[STAGE 3] Validating 100 Synthetic Records with DataQualityHarness...
  -> All 100 records PASSED schema and guardrails inspection 100%!
  -> Track distribution: {'Fullstack Web': 25, 'Data & AI Resource Engineer': 25, 'DevOps Cloud': 20, 'Cybersecurity SOC': 15, 'Mobile React Native': 15}

[STAGE 4] Validating Bit-Exact Reproducibility (Seed=42)...
  -> Bit-Exact Reproducibility VERIFIED! Dataset SHA-256: 09d3b417c884b2c0... (100% match)

[STAGE 5] Checking Self-Correction Loop Logs & Summary...
  -> Initial pass rate (iter 0): 94/100
  -> Corrected via loop:        6/100
  -> Fallback applied:          0/100
  -> Total retries logged:      6

[STAGE 6] Validating Data Parity between JSON and CSV...
  -> CSV and JSON 100% aligned across all 100 records.

================================================================================
 TASK 09 VALIDATION SUMMARY REPORT
================================================================================
  - Total Synthetic Records:     100 (DoD requirement: 100)
  - Schema & Guardrail Quality:  100% PASSED (0 critical violations)
  - Reproducibility (Seed=42):   100% BIT-EXACT MATCH
  - Self-Correction Loop Events: 6 records successfully recovered
  - JSON & CSV Data Parity:      100% ALIGNED
  - Exit Code:                   0 (SUCCESS)

[PASS] ALL ACCEPTANCE CRITERIA SATISFIED 100%! READY FOR PRODUCTION.
```

### 4.2. Lệnh chạy và Kết quả Pytest Test Suite:
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task09/tests/ -v
```

**Nhật ký thực tế (Console Output)**:
```text
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\Cybersoft\Kien
collected 10 items

tests/test_synthetic_pipeline.py::test_schema_valid_record PASSED        [ 10%]
tests/test_synthetic_pipeline.py::test_rubric_sum_guardrail_violation PASSED [ 20%]
tests/test_synthetic_pipeline.py::test_score_status_consistency_guardrail PASSED [ 30%]
tests/test_synthetic_pipeline.py::test_anti_leak_prohibited_tokens PASSED [ 40%]
tests/test_checksum_tampering_detection PASSED                          [ 50%]
tests/test_synthetic_pipeline.py::test_reproducibility_bit_exact PASSED [ 60%]
tests/test_synthetic_pipeline.py::test_deterministic_variance_with_different_seeds PASSED [ 70%]
tests/test_synthetic_pipeline.py::test_self_correction_loop_recovery PASSED [ 80%]
tests/test_synthetic_pipeline.py::test_fallback_mechanism_activation PASSED [ 90%]
tests/test_synthetic_pipeline.py::test_cli_validator_exit_code_zero PASSED [100%]

============================== 10 passed in 0.48s ==============================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 — Hiểu việc (Task Comprehension)**: Nắm vững bản chất kỹ thuật của bài toán sinh dữ liệu có kiểm soát: Structured Output, Loop Engineering, và Guardrails. Xác định rõ các giới hạn vật lý của mô hình AI (ảo giác số học, mâu thuẫn nghiệp vụ) để thiết lập bài toán chốt chặn chất lượng độc lập trước khi tiến hành sinh dữ liệu.
* **Tầng 2 — Điều phối AI (AI Orchestration)**: Phân công nhiệm vụ mạch lạc cho trợ lý AI: thiết kế song song kiến trúc JSON Schema Draft 2020-12, tối ưu hóa các phiên bản Prompt (từ Zero-Shot v1 sang Few-Shot v2.1 có ràng buộc bất biến), điều phối thư viện Faker (`vi_VN`) và xây dựng Data Quality Harness tự động hóa với 7 chốt chặn.
* **Tầng 3 — Thẩm định (Critical Evaluation)**: Độc lập phát hiện và xử lý ngay các lỗi tiềm ẩn do AI sinh ra: phát hiện regex `[A-Z]{3,4}` làm chặn oan 20 bản ghi chuyên ngành DevOps Cloud và mở rộng kịp thời lên `[A-Z]{3,6}`; kiên quyết bác bỏ đề xuất nới lỏng dung sai tổng rubric $\pm 5\%$; thiết lập chặn cứng `MAX_RETRIES = 3` ngăn ngừa nguy cơ vòng lặp vô hạn.
* **Tầng 4 — Làm chủ (Technical Ownership)**: Tự tay thiết kế và lập trình hoàn thiện Data Quality Harness, cơ chế Fallback dự phòng tất định, CLI Validator tuân thủ mã thoát POSIX (0/1/2) và bộ kiểm thử tự động 10 Pytest test cases đạt 100% PASS tuyệt đối. Toàn bộ mã nguồn, dữ liệu, schema và tài liệu được làm chủ và bàn giao an toàn phục vụ vận hành thực tế tại CyberSoft Academy.

---

## 6. Kịch bản Thuyết trình 3 phút Bảo vệ Kỹ thuật (3-Minute Defense Pitch)

> **Kính thưa Hội đồng Chuyên môn và Tech Lead CyberSoft:**  
> Hôm nay, em xin trình bày kết quả triển khai **Task 09: Pipeline sinh dữ liệu có kiểm soát bằng AI** với 3 luận điểm cốt lõi thể hiện rõ năng lực làm chủ kỹ thuật và tư duy phòng vệ dữ liệu:
>
> 1. **Vấn đề AI đề xuất chưa đạt**: Trong quá trình thiết kế ban đầu, AI đề xuất cấu trúc regex `^CHAL-[A-Z]{3,4}-[0-9]{3}$` cho mã bài toán và đề xuất cho phép dung sai $\pm 5\%$ đối với tổng trọng số rubric để "giảm thiểu tỷ lệ lỗi cho mô hình". Ngoài ra, AI gợi ý cơ chế lặp sửa lỗi dạng `while not passed:` không có điểm dừng tối đa.
> 2. **Phát hiện và Quyết định kỹ thuật của em**: 
>    - Thứ nhất, em nhận diện ngay quy tắc regex `[A-Z]{3,4}` sẽ làm đứt gãy toàn bộ các bài tập chuyên ngành DevOps Cloud (`CHAL-DEVOPS-001`), nên em đã mở rộng thành `[A-Z]{3,6}` để bao quát chính xác mọi chuyên ngành.
>    - Thứ hai, em bác bỏ hoàn toàn đề xuất dung sai $\pm 5\%$, kiên quyết bảo vệ tính bất biến toán học $\sum w_i = 100\%$ bằng việc tích hợp cấu trúc Few-Shot kèm bảng `invariants` số học trong Prompt v2.1.
>    - Thứ ba, em chặn đứng nguy cơ vòng lặp vô hạn bằng quy chuẩn cứng `MAX_RETRIES = 3` và xây dựng bộ sinh dự phòng tất định **Deterministic Fallback Generator** gắn nhãn `FALLBACK_APPLIED`, bảo đảm pipeline không bao giờ bị dừng đột ngột.
> 3. **Kết quả kiểm chứng độc lập**: 
>    - Pipeline đã sinh thành công 100 bản ghi chuẩn hóa phủ đều 5 chuyên ngành CyberSoft, đạt 100% tính tái lập theo seed (`seed=42`).
>    - Vòng lặp sửa lỗi đã tự động nhận diện và phục hồi thành công 6 bản ghi có lỗi cố ý thử nghiệm mà không cần con người can thiệp.
>    - Toàn bộ hệ thống vượt qua 6 chặng kiểm định của CLI Validator (Exit Code 0) và 10/10 unit tests của Pytest trong 0.48 giây. Em xin hoàn thành và sẵn sàng trả lời các câu hỏi chuyên sâu từ Hội đồng.
