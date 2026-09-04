# QUY CHUẨN CI/CD PIPELINE & QUALITY GATE

Tài liệu đặc tả quy trình tích hợp liên tục (CI) và cổng kiểm định tự động cho CyberSoft Data & AI Lab.

---

## 🔄 1. Luồng Hoạt động của CI Pipeline

Mỗi khi một Pull Request (PR) được tạo hoặc có commit đẩy lên các nhánh `main`, `develop`, `feature/**`:

```text
[ Developer Push / PR ]
         │
         ▼
┌────────────────────────────────────────┐
│  GitHub Actions: quality-gate job      │
├────────────────────────────────────────┤
│ 1. Checkout repository                 │
│ 2. Cài Python 3.10 & 3.11 + pip cache  │
│ 3. Cài đặt dependencies (CPU-First)    │
│ 4. Kiểm tra sự tồn tại của .env.example│
│ 5. Chạy Ruff Linter (ruff check .)     │
│ 6. Chạy Ruff Formatter check           │
│ 7. Chạy Pytest Test Suite              │
└────────────────────────────────────────┘
         │
    ┌────┴────┐
 [ PASS ]   [ FAIL ]
    │         │
 Cho phép    Chặn merge PR,
 Merge       báo đỏ chi tiết lỗi
```

---

## 🛡️ 2. Các Tiêu chuẩn Quality Gate Bắt buộc

1. **Zero Secret Policy**: Không cho phép commit bất kỳ secret key nào (kiểm tra qua `.gitignore` và pre-commit).
2. **File Size Limit**: Chặn tuyệt đối mọi file vượt quá **50 MB** được commit vào Git tree.
3. **PEP 8 Compliance**: 100% mã nguồn phải vượt qua `ruff check` và `ruff format --check`.
4. **Test Coverage**: Toàn bộ unit test và integration test phải vượt qua (Exit code 0).
