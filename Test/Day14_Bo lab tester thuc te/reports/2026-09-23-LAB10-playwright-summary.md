# LAB-10 Playwright verification — 23/09/2026

Command: `npm run test:lab10 -- --repeat-each=2`

- PASS 2/2: form đăng nhập hiển thị đúng trường.
- PASS 2/2: submit rỗng không rời trang đăng nhập.
- PASS 2/2: sai mật khẩu không đăng nhập.
- BLOCKED 2/2: tài khoản được cung cấp bị demo2 từ chối với thông báo “Tài khoản hoặc mật khẩu không đúng”.

Kết luận: 6/8 checks pass. Hai check còn lại bị chặn bởi test data/account. Không có đủ bằng chứng để ghi bug sản phẩm. HTML report và error context nằm trong `automation/reports/html` và `automation/test-results`. Trace/screenshot của ca dùng credential đã tắt để không lưu secret.

