# ❌ CyberSoft Data Quality Audit Report

![Quality Status](https://img.shields.io/badge/Quality_Status-FAILED-red?style=for-the-badge)

## 📌 1. Thông Tin Tổng Quan (Metadata)

- **Tên tập dữ liệu**: `CyberSoft Student Course Enrollments`
- **Tệp dữ liệu kiểm tra**: `D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task05\data_samples\dirty_students.csv`
- **Bộ quy tắc thẩm định**: `D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task05\config\course_students_rules.json`
- **Thời gian kiểm thử**: `2026-09-07 17:50:01`
- **Tổng số bản ghi**: **16** dòng
- **Tổng số cột**: **12** cột
- **Kết quả chung**: **FAILED** (Exit Code: `1`)

---

## 📊 2. Thống Kê Kết Quả 7 Nhóm Kiểm Tra (Checks Summary)

| STT | Tên Check | Phân loại | Trạng thái | Tổng kiểm tra | Hợp lệ | Vi phạm | Tỷ lệ đạt (%) | Thời gian (ms) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `SchemaCheck` | `schema` | ✅ PASS | 13 | 13 | 0 | 100.0% | 0.06 |
| 2 | `NullCheck` | `null` | ❌ FAIL | 112 | 109 | 3 | 97.3% | 10.20 |
| 3 | `DuplicateCheck` | `duplicate` | ❌ FAIL | 48 | 46 | 2 | 95.8% | 5.02 |
| 4 | `TypeCheck` | `type` | ❌ FAIL | 192 | 188 | 4 | 97.9% | 31.23 |
| 5 | `RangeCheck` | `range` | ❌ FAIL | 48 | 45 | 3 | 93.8% | 0.22 |
| 6 | `CategoryCheck` | `category` | ❌ FAIL | 32 | 30 | 2 | 93.8% | 0.14 |
| 7 | `DateCheck` | `date` | ❌ FAIL | 47 | 44 | 3 | 93.6% | 0.90 |

### Tổng hợp mức độ vi phạm:
- **Tổng số vi phạm phát hiện**: **17**
- **Lỗi nghiêm trọng (CRITICAL)**: **16**
- **Cảnh báo (WARNING)**: **1**

---

## 🔍 3. Danh Sách Lỗi Chi Tiết (Detailed Issues Log)

| Dòng | Cột | Nhóm Check | Mức độ | Giá trị vi phạm | Mô tả chi tiết |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 3 | `student_id` | `null` | 🔴 CRITICAL | `None/Empty` | Giá trị bị rỗng/khuyết thiếu tại dòng 3, cột 'student_id' |
| 4 | `full_name` | `null` | 🔴 CRITICAL | `None/Empty` | Giá trị bị rỗng/khuyết thiếu tại dòng 4, cột 'full_name' |
| 5 | `email` | `null` | 🔴 CRITICAL | `None/Empty` | Giá trị bị rỗng/khuyết thiếu tại dòng 5, cột 'email' |
| 6 | `student_id` | `duplicate` | 🔴 CRITICAL | `{'student_id': '1001'}` | Trùng lặp khóa chính ['student_id'] tại dòng 6: {'student_id': '1001'} |
| 6 | `student_id,course_id` | `duplicate` | 🔴 CRITICAL | `{'student_id': '1001', 'course_id': 'DS-` | Trùng lặp khóa kết hợp ['student_id', 'course_id'] tại dòng 6: {'student_id': '1001', 'course_id': 'DS-101'} |
| 7 | `student_id` | `type` | 🔴 CRITICAL | `INVALID_ID` | Sai kiểu dữ liệu tại dòng 7, cột 'student_id': giá trị 'INVALID_ID' không khớp kiểu 'integer' |
| 8 | `email` | `type` | 🔴 CRITICAL | `ha.bui_wrong_email` | Sai kiểu dữ liệu tại dòng 8, cột 'email': giá trị 'ha.bui_wrong_email' không khớp kiểu 'email' |
| 9 | `age` | `type` | 🔴 CRITICAL | `not_a_number` | Sai kiểu dữ liệu tại dòng 9, cột 'age': giá trị 'not_a_number' không khớp kiểu 'integer' |
| 15 | `enrollment_date` | `type` | 🔴 CRITICAL | `2024-13-45` | Sai kiểu dữ liệu tại dòng 15, cột 'enrollment_date': giá trị '2024-13-45' không khớp kiểu 'date' |
| 10 | `age` | `range` | 🟡 WARNING | `14` | Giá trị ngoài khoảng cho phép tại dòng 10, cột 'age': nhỏ hơn ngưỡng tối thiểu (14.0 < 18) |
| 11 | `gpa` | `range` | 🔴 CRITICAL | `4.85` | Giá trị ngoài khoảng cho phép tại dòng 11, cột 'gpa': vượt quá ngưỡng tối đa (4.85 > 4.0) |
| 12 | `tuition_fee` | `range` | 🔴 CRITICAL | `-5000000.0` | Giá trị ngoài khoảng cho phép tại dòng 12, cột 'tuition_fee': nhỏ hơn ngưỡng tối thiểu (-5000000.0 < 0.0) |
| 13 | `track` | `category` | 🔴 CRITICAL | `Blockchain Expert` | Giá trị danh mục không hợp lệ tại dòng 13, cột 'track': 'Blockchain Expert' không nằm trong danh mục cho phép ['Data Science', 'AI Engineer', 'Fullstack Web', 'Cybersecurity'] |
| 14 | `status` | `category` | 🔴 CRITICAL | `expelled` | Giá trị danh mục không hợp lệ tại dòng 14, cột 'status': 'expelled' không nằm trong danh mục cho phép ['enrolled', 'graduated', 'dropped', 'deferred'] |
| 15 | `enrollment_date` | `date` | 🔴 CRITICAL | `2024-13-45` | Sai định dạng hoặc ngày không tồn tại tại dòng 15, cột 'enrollment_date': '2024-13-45' không khớp chuẩn '%Y-%m-%d' |
| 16 | `enrollment_date` | `date` | 🔴 CRITICAL | `2099-01-01` | Vi phạm ràng buộc thời gian tại dòng 16, cột 'enrollment_date': ngày '2099-01-01' vượt quá ngày hiện tại (không được phép trong tương lai) |
| 17 | `enrollment_date,graduation_date` | `date` | 🔴 CRITICAL | `{'start': '2024-06-01', 'end': '2023-01-` | Nghịch lý thời gian tại dòng 17: Ngày nhập học (enrollment_date) phải trước hoặc bằng ngày tốt nghiệp (graduation_date) (enrollment_date='2024-06-01' > graduation_date='2023-01-01') |

---
*Báo cáo được khởi tạo tự động bởi CyberSoft Data Quality Harness v0.*
