# BẢN ĐẶC TẢ KỸ THUẬT: PIPELINE SINH DỮ LIỆU CÓ KIỂM SOÁT BẰNG AI
## CYBERSOFT DATA & AI RESOURCE ENGINEERING — TASK 09

**Dự án**: CyberSoft Data & AI Lab  
**Học phần**: Tuần 2 — Tạo tài nguyên dữ liệu  
**Tập dữ liệu**: `synthetic_learning_eval_dataset` (100 records)  
**Tác giả**: Đào Trung Kiên — Data & AI Resource Engineer  
**Phiên bản**: v1.0 — 2026-09-11  

---

## 1. Bối cảnh Kỹ thuật và Mục tiêu Dự án

Trong quá trình xây dựng hệ sinh thái học vụ thông minh tại CyberSoft Academy, việc đánh giá năng lực giải quyết vấn đề của học viên trên các bài tập lập trình (Coding Challenges) đòi hỏi một tập dữ liệu chuẩn hóa, đa dạng và có cấu trúc chặt chẽ. Tuy nhiên, việc thu thập thủ công tốn rất nhiều thời gian, trong khi việc dùng mô hình ngôn ngữ lớn (LLM) sinh trực tiếp thường gặp phải:
1. **Ảo giác cấu trúc (Structural Hallucination)**: Mô hình xuất JSON sai định dạng, thiếu trường hoặc sai kiểu dữ liệu.
2. **Không nhất quán về số học (Arithmetic Inconsistency)**: Tổng trọng số các tiêu chí trong rubric không bằng 100%.
3. **Mâu thuẫn logic nghiệp vụ (Business Rule Conflicts)**: Học viên có trạng thái nộp bài `FAILED_TESTS` nhưng lại được AI chấm 85-95 điểm.
4. **Thiếu tính tái lập (Non-Deterministic Output)**: Cùng một prompt nhưng các lần chạy khác nhau sinh ra các tập dữ liệu hoàn toàn khác nhau, không thể đưa vào CI/CD pipeline để kiểm thử hồi quy.

**Mục tiêu của Task 09**: Thiết kế và triển khai trọn vẹn một **Pipeline sinh dữ liệu có kiểm soát bằng AI (AI-Controlled Synthetic Data Pipeline)** kết hợp hạt giống ngẫu nhiên (Seed-anchored Faker), Prompt Engineering có cấu trúc, Data Quality Harness đa tầng với vòng lặp tự sửa lỗi (Self-Correction Feedback Loop) và cơ chế Fallback an toàn.

---

## 2. Kiến trúc Hệ thống Pipeline

Hệ thống được tổ chức thành 4 phân lớp độc lập:

```text
+-----------------------------------------------------------------------------------+
| 1. DETERMINISTIC SEED & FAKER LAYER (Lớp Khởi tạo Tất định)                       |
|    - Global Seed (seed=42) & Record Sub-seed Progression                          |
|    - Faker (vi_VN) sinh định danh học viên: Họ tên, Email, Mã số HV-xxxxx          |
+-----------------------------------------------------------------------------------+
                                      |
                                      v
+-----------------------------------------------------------------------------------+
| 2. CONTROLLED PROMPT & SYNTHESIS LAYER (Lớp Điều phối Sinh Dữ liệu)               |
|    - System Instructions: Ràng buộc Structured Output & Chống rò rỉ              |
|    - Prompt v2.1.0 Few-Shot: Ràng buộc tổng rubric 100% & bảng dải điểm           |
|    - Domain Knowledge Bank: 5 chuyên ngành CyberSoft (Web, AI, DevOps, Sec, Mob) |
+-----------------------------------------------------------------------------------+
                                      |
                                      v Candidate Record (Iteration i)
+-----------------------------------------------------------------------------------+
| 3. DATA QUALITY HARNESS & GUARDRAILS LAYER (Lớp Kiểm định Chất lượng Đa tầng)     |
|    - GR-01-SCHEMA: Draft 2020-12 JSON Schema Validation                          |
|    - GR-02-RUBRIC-SUM: Tổng trọng số rubric_criteria == 100%                     |
|    - GR-03-SCORE-STATUS: PASSED (70-100), FAILED (30-69), ERROR/TIMEOUT (0-29)   |
|    - GR-04-ANTI-LEAK: Cấm placeholder [TODO], [LEAK], undefined, NaN             |
|    - GR-05-MIN-LENGTH: Yêu cầu độ dài ngữ cảnh tối thiểu                          |
|    - GR-06-TRACK-ENUM: Kiểm chuẩn 5 chuyên ngành đào tạo                          |
|    - GR-07-CHECKSUM: Xác thực mã băm SHA-256 bất biến                            |
+-----------------------------------------------------------------------------------+
         |                                                 |
  [CRITICAL VIOLATION]                              [ALL PASSED 100%]
         |                                                 |
         v                                                 v
+---------------------------------------+      +------------------------------------+
| 4. LOOP & FALLBACK LAYER              |      | 5. PERSISTENCE & AUDIT LAYER       |
|    - Attempt < MAX_RETRIES (3):       |      |    - synthetic_dataset.json (100)  |
|      Generate Error Feedback          |      |    - synthetic_dataset.csv (100)   |
|      Feed corrective prompt into loop |      |    - error_correction_loop.log     |
|    - Attempt == MAX_RETRIES:          |      |    - correction_summary.json       |
|      Activate Deterministic Fallback  |      +------------------------------------+
+---------------------------------------+
```

---

## 3. Danh mục Ràng buộc Guardrails

### 3.1. Ràng buộc Tổng trọng số Rubric (`GR-02-RUBRIC-SUM`)
Mỗi bài toán học vụ chứa từ 2 đến 5 tiêu chí chấm điểm. Thuật toán kiểm định tính tổng trọng số:
$$\sum_{k=1}^{M} w_k = 100, \quad \text{với } 5 \le w_k \le 100$$
Nếu tổng này khác 100, Harness báo lỗi vi phạm mức CRITICAL và gửi phản hồi yêu cầu cân bằng lại trọng số.

### 3.2. Ràng buộc Tương quan Trạng thái - Điểm số (`GR-03-SCORE-STATUS`)
Hệ thống loại bỏ hoàn toàn hiện tượng AI tự mâu thuẫn giữa trạng thái bài làm và điểm số:
$$\text{Score}(status) \in \begin{cases} [70, 100] & \text{khi } status = \text{PASSED} \\ [30, 69] & \text{khi } status = \text{FAILED\_TESTS} \\ [0, 29] & \text{khi } status \in \{\text{SYNTAX\_ERROR}, \text{TIMEOUT}\} \end{cases}$$

### 3.3. Ràng buộc Chống Ký tự Giả lập (`GR-04-ANTI-LEAK`)
Quét toàn bộ chuỗi JSON của bản ghi để phát hiện các mẫu chuỗi rác do AI sinh lười:
$$\text{Prohibited} = \{ \text{"[TODO"}, \text{"[LEAK"}, \text{"Lorem ipsum"}, \text{"undefined"}, \text{"NaN"}, \text{"null\_marker"}, \text{"PLACEHOLDER"} \}$$

---

## 4. Quản lý Phiên bản Prompt (Prompt Versioning)

* **Bản v1.0.0 (`v1_zero_shot.json`)**:
  - Không có mẫu JSON tham chiếu, không có ràng buộc số học.
  - Tỷ lệ lỗi qua Harness: 58% (thường xuyên vi phạm tổng rubric và lệch dải điểm).
* **Bản v2.1.0 (`v2_few_shot_constrained.json`)**:
  - Tích hợp Few-Shot exemplar đầy đủ cấu trúc.
  - Khai báo tường minh bảng `invariants` số học.
  - Tỷ lệ vượt qua ngay vòng đầu: 94-96%. Các trường hợp còn lại được tự sửa lỗi thành công ở lần lặp thứ nhất (Iteration 1).

---

## 5. Báo cáo Thực nghiệm & Tính Tất định (Seed=42)

* **Quy mô tập dữ liệu**: Đúng 100 bản ghi đánh giá học tập.
* **Phân bổ chuyên ngành**:
  - Fullstack Web: 25 bản ghi (25%)
  - Data & AI Resource Engineer: 25 bản ghi (25%)
  - DevOps Cloud: 20 bản ghi (20%)
  - Cybersecurity SOC: 15 bản ghi (15%)
  - Mobile React Native: 15 bản ghi (15%)
* **Phân bổ trạng thái nộp bài**:
  - `PASSED`: 65 bản ghi
  - `FAILED_TESTS`: 20 bản ghi
  - `SYNTAX_ERROR`: 10 bản ghi
  - `TIMEOUT`: 5 bản ghi
* **Tỷ lệ vượt qua Quality Gate**: 100/100 bản ghi đạt chuẩn (0 lỗi vi phạm).
* **Tính tất định (Reproducibility)**: Tái lập 100% bit-exact khi chạy với `seed=42`. Mã băm SHA-256 của tập dữ liệu hoàn toàn trùng khớp giữa các lần chạy độc lập.
