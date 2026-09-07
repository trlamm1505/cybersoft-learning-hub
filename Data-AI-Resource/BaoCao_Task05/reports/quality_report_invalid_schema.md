# ❌ CyberSoft Data Quality Audit Report

![Quality Status](https://img.shields.io/badge/Quality_Status-FAILED-red?style=for-the-badge)

## 📌 1. Thông Tin Tổng Quan (Metadata)

- **Tên tập dữ liệu**: `CyberSoft Student Course Enrollments`
- **Tệp dữ liệu kiểm tra**: `D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task05\data_samples\invalid_schema.csv`
- **Bộ quy tắc thẩm định**: `D:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task05\config\course_students_rules.json`
- **Thời gian kiểm thử**: `2026-09-07 14:30:59`
- **Tổng số bản ghi**: **1** dòng
- **Tổng số cột**: **10** cột
- **Kết quả chung**: **FAILED** (Exit Code: `1`)

---

## 📊 2. Thống Kê Kết Quả 7 Nhóm Kiểm Tra (Checks Summary)

| STT | Tên Check | Phân loại | Trạng thái | Tổng kiểm tra | Hợp lệ | Vi phạm | Tỷ lệ đạt (%) | Thời gian (ms) |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | `SchemaCheck` | `schema` | ❌ FAIL | 13 | 9 | 4 | 69.2% | 0.05 |
| 2 | `NullCheck` | `null` | ✅ PASS | 5 | 5 | 0 | 100.0% | 25.57 |
| 3 | `DuplicateCheck` | `duplicate` | ✅ PASS | 3 | 3 | 0 | 100.0% | 23.75 |
| 4 | `TypeCheck` | `type` | ✅ PASS | 9 | 9 | 0 | 100.0% | 0.39 |
| 5 | `RangeCheck` | `range` | ✅ PASS | 3 | 3 | 0 | 100.0% | 0.11 |
| 6 | `CategoryCheck` | `category` | ✅ PASS | 2 | 2 | 0 | 100.0% | 0.05 |
| 7 | `DateCheck` | `date` | ✅ PASS | 0 | 0 | 0 | 100.0% | 0.05 |

### Tổng hợp mức độ vi phạm:
- **Tổng số vi phạm phát hiện**: **4**
- **Lỗi nghiêm trọng (CRITICAL)**: **3**
- **Cảnh báo (WARNING)**: **1**

---

## 🔍 3. Danh Sách Lỗi Chi Tiết (Detailed Issues Log)

| Dòng | Cột | Nhóm Check | Mức độ | Giá trị vi phạm | Mô tả chi tiết |
| :---: | :--- | :--- | :---: | :--- | :--- |
| N/A | `email` | `schema` | 🔴 CRITICAL | `None/Empty` | Cột bắt buộc bị thiếu trong schema: 'email' |
| N/A | `enrollment_date` | `schema` | 🔴 CRITICAL | `None/Empty` | Cột bắt buộc bị thiếu trong schema: 'enrollment_date' |
| N/A | `graduation_date` | `schema` | 🔴 CRITICAL | `None/Empty` | Cột bắt buộc bị thiếu trong schema: 'graduation_date' |
| N/A | `extra_random_column` | `schema` | 🟡 WARNING | `None/Empty` | Phát hiện cột không được phép trong cấu trúc: 'extra_random_column' |

---
*Báo cáo được khởi tạo tự động bởi CyberSoft Data Quality Harness v0.*
