# DATA DICTIONARY: SYNTHETIC LEARNING EVALUATION RECORD SCHEMA

**Mã Schema**: `CS-SCHEMA-SYNTHETIC-LEARN-V1`  
**Phiên bản**: v1.0  
**Tập tin JSON Schema**: `record_schema.json`  
**Mục đích**: Quy định cấu trúc dữ liệu bắt buộc (Data Contract) cho từng bản ghi học tập tổng hợp sinh ra bởi AI và Faker trong hệ thống kiểm định tự động CyberSoft Data & AI Lab.

---

## 1. Cấu trúc Tổng quan (Top-Level Fields)

| Tên trường | Kiểu dữ liệu | Bắt buộc | Mô tả tóm tắt | Ví dụ |
| :--- | :--- | :---: | :--- | :--- |
| `record_id` | `string` | Có | Định danh bản ghi duy nhất, định dạng `REC-CYB-{index:04d}` | `"REC-CYB-0001"` |
| `student_profile` | `object` | Có | Thông tin hồ sơ học viên tạo bởi Faker xác định | `{...}` |
| `learning_assessment` | `object` | Có | Bài toán kỹ thuật, tiêu chí chấm điểm và khái niệm | `{...}` |
| `student_submission` | `object` | Có | Mã nguồn nộp, kết quả chạy thực thi, điểm và phản hồi mentor | `{...}` |
| `generation_metadata` | `object` | Có | Dữ liệu kiểm định quá trình sinh, seed, vòng lặp, mã băm SHA256 | `{...}` |

---

## 2. Chi tiết Cấu trúc Từng Đối tượng (Field Details)

### 2.1. Đối tượng `student_profile`
* `student_id` (`string`, regex `^HV-[0-9]{5}$`): Mã số học viên tại CyberSoft.
* `full_name` (`string`, minLength 3): Họ và tên tiếng Việt của học viên.
* `email` (`string`, format email): Địa chỉ email liên lạc.
* `track` (`string`, enum): Chuyên ngành đào tạo. Giá trị cho phép:
  - `"Fullstack Web"`
  - `"Data & AI Resource Engineer"`
  - `"DevOps Cloud"`
  - `"Cybersecurity SOC"`
  - `"Mobile React Native"`
* `current_module` (`string`): Tên học phần hiện tại đang theo học.
* `prior_coding_experience_months` (`integer`, 0 - 120): Số tháng kinh nghiệm lập trình trước khi vào CyberSoft.

### 2.2. Đối tượng `learning_assessment`
* `challenge_id` (`string`, regex `^CHAL-[A-Z]{3,6}-[0-9]{3}$`): Mã bài toán kỹ thuật.
* `topic` (`string`): Chủ đề kiến thức chuyên môn.
* `difficulty_level` (`string`, enum: `["Beginner", "Intermediate", "Advanced"]`): Cấp độ khó.
* `problem_statement` (`string`, minLength 50): Mô tả chi tiết yêu cầu bài toán hoặc tình huống hệ thống.
* `expected_solution_concept` (`string`, minLength 20): Ý tưởng giải pháp kỹ thuật chuẩn kiến trúc.
* `rubric_criteria` (`array` of objects, minItems 2, maxItems 5): Danh sách tiêu chí chấm điểm.
  - `criterion_name` (`string`): Tên tiêu chí.
  - `weight_percent` (`integer`, 5 - 100): Trọng số phần trăm. **Quy tắc**: Tổng trọng số các tiêu chí phải đúng bằng **100%**.
  - `description` (`string`): Diễn giải tiêu chí đánh giá.

### 2.3. Đối tượng `student_submission`
* `submission_code` (`string`, minLength 10): Đoạn mã Python / TypeScript / SQL được học viên nộp.
* `submission_timestamp` (`string`): Thời gian nộp bài chuẩn ISO 8601 UTC.
* `execution_status` (`string`, enum): Trạng thái kiểm thử tự động trên hệ thống CI/CD:
  - `"PASSED"`: Vượt qua toàn bộ unit test.
  - `"FAILED_TESTS"`: Chạy được nhưng sai kết quả kiểm thử logic.
  - `"SYNTAX_ERROR"`: Lỗi cú pháp mã nguồn.
  - `"TIMEOUT"`: Chạy quá thời gian quy định (Time Limit Exceeded).
* `score` (`integer`, 0 - 100): Điểm số đánh giá. **Ràng buộc nghiệp vụ**:
  - `PASSED`: $70 \le score \le 100$
  - `FAILED_TESTS`: $30 \le score \le 69$
  - `SYNTAX_ERROR` / `TIMEOUT`: $0 \le score < 30$
* `mentor_feedback` (`string`, minLength 40): Nhận xét sư phạm chi tiết và hướng dẫn cải tiến từ Mentor.

### 2.4. Đối tượng `generation_metadata`
* `seed` (`integer`): Giá trị seed tạo số ngẫu nhiên dùng để tái lập record.
* `prompt_version` (`string`): Phiên bản prompt AI được áp dụng (`"v1_zero_shot"` hoặc `"v2_few_shot_constrained"`).
* `generator_iteration` (`integer`, $\ge 0$): Số lần lặp sửa lỗi qua Data Quality Harness (0 = đạt chuẩn ngay lần đầu, 1-3 = đã qua tự sửa lỗi).
* `validation_status` (`string`, enum: `["PASSED", "FALLBACK_APPLIED"]`): Trạng thái kiểm chuẩn cuối cùng.
* `checksum_sha256` (`string`, 64 hex chars): Mã băm SHA256 bảo đảm tính toàn vẹn và bất biến của bản ghi.
