# Controlled fixtures Ngày 14

Các file JSON nhỏ thay cho web lab riêng. Chúng không gửi request và không thay đổi demo CyberSoft.

```powershell
node fixtures/reset.mjs --mode buggy --lab LAB-01
node fixtures/reset.mjs --mode clean --lab LAB-01
node --test fixtures/tests/fixtures.test.mjs
```

`buggy/` chứa lỗi chủ đích, `clean/` chứa trạng thái đúng, `runtime/` là bản học viên đang dùng. `manifest.json` là tài liệu instructor.
