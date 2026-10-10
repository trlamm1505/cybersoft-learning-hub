# Automation labs

```powershell
npm ci
npm run browsers
npm run test:smoke
```

Chạy riêng:

```powershell
npm run test:lab10
npm run test:lab11
npm run test:lab12
```

LAB-10 đọc `DEMO2_USER` và `DEMO2_PASSWORD` từ environment. Không ghi hai giá trị này vào source, report hoặc file `.env` được commit. Ca dùng credential đã tắt trace/screenshot để tránh lưu secret.

`node_modules`, `reports` và `test-results` là output cục bộ, không commit.
