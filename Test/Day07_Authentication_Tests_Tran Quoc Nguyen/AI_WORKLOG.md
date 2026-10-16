# AI WORK LOG - DAY 07

## Problem statement trước AI

Cần xây bộ Authentication/Authorization tests cho student, teacher, admin và truy cập chéo lớp. Phải kiểm tra token expired/missing/tampered, tạo security regression set, bao phủ basic IDOR, không log token thật và đảm bảo endpoint nhạy cảm đều có test.

## Input / Output / Constraint

**Input:** role, class ownership, resource ownership, token state.  
**Output:** auth suite, access matrix, defect report, JUnit result.  
**Constraint:** chỉ dùng dữ liệu giả; không log Authorization token; không dùng kết luận AI thay cho việc chạy test.

## AI hỗ trợ

- Đề xuất access rules và negative cases.
- Đề xuất token mock có expiry + signature.
- Đề xuất IDOR regression cases.
- Đề xuất cấu trúc test suite và defect template.

## Phần con người kiểm chứng

- Review access matrix theo yêu cầu hệ thống thật.
- Chạy pytest độc lập.
- Đọc các test IDOR/token/RBAC và giải thích được lý do PASS/FAIL.
- Nếu tích hợp API thật, thay mock token/rule bằng auth contract thực tế.

## Quyết định

Chấp nhận mô hình mock để chứng minh kỹ thuật. Không coi các defect seeded/demo là lỗi của website production.
