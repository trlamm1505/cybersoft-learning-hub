# 🚀 CyberSoft Learning & Contest Hub

Dự án **CyberSoft Learning & Contest Hub** chứa 2 ứng dụng chính: Frontend (`FE`) sử dụng React + Vite và Backend (`BE`) sử dụng NestJS Framework.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```text
learning-hub/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI
├── FE/                        # Frontend (React 18 + Vite + TypeScript)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── BE/                        # Backend (NestJS + TypeScript)
│   ├── src/
│   ├── test/
│   ├── package.json
│   └── nest-cli.json
├── AI_WORKLOG.md              # Nhật ký làm việc và kiểm chứng
└── README.md                  # Hướng dẫn khởi chạy dự án
```

---

## ⏱️ Quick Start Guide (Hướng Dẫn Khởi Chạy)

### 1️⃣ Khởi Chạy Frontend (`FE` - React + Vite)
```bash
cd FE
npm install
npm run dev
```
👉 **Ứng dụng Frontend sẽ chạy tại:** `http://localhost:5173`

---

### 2️⃣ Khởi Chạy Backend (`BE` - NestJS)
```bash
cd BE
npm install
npm run start:dev
```
👉 **Ứng dụng Backend API sẽ chạy tại:** `http://localhost:3000`