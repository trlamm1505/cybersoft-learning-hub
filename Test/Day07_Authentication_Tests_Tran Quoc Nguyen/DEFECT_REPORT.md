# DEFECT REPORT - DAY 07

## SEC-DEMO-001 - Basic IDOR nếu bỏ ownership/cross-class check

**Loại:** Security / Authorization / IDOR  
**Severity:** Critical  
**Priority:** High  
**Environment:** Local mock API - Day 07  
**Trạng thái:** Regression protected (secure mock hiện PASS)

### Precondition

- `stu_a` thuộc `class_a`.
- `sub_b1` thuộc `stu_b` trong `class_b`.
- `stu_a` có token hợp lệ.

### Steps to Reproduce (kịch bản lỗi giả lập)

1. Đăng nhập/khởi tạo token cho `stu_a`.
2. Gửi `GET /classes/class_b/submissions/sub_b1`.
3. Quan sát response.

### Expected Result

Server phải từ chối truy cập, HTTP 403; không trả nội dung submission của user/lớp khác.

### Unsafe Actual Result (nếu code authorization bị bỏ)

Server trả HTTP 200 cùng dữ liệu `sub_b1`.

### Risk

User có thể đổi object/class identifier để đọc dữ liệu không thuộc quyền của mình.

### Regression Test

`test_idor_regression_student_a_cannot_read_student_b_submission`

### Lưu ý

Đây là **defect seeded/demo** phục vụ thực hành Day 07, không phải bằng chứng rằng website thật đang có lỗ hổng.
