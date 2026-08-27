# 🤖 AI_WORKLOG.md - Ngày 03: Khởi Tạo Khung Monorepo (FE & BE)

Tài liệu ghi nhận quá trình AI Assistant cùng Thực tập sinh thực hiện **Ngày 03 (Monorepo Setup)** cho dự án **CyberSoft Learning & Contest Hub**.

---

## 📌 1. Bài Toán Trước AI (Problem Statement - Day 03)

* **Nhiệm vụ:** Khởi tạo cấu trúc Monorepo thống nhất tại thư mục `learning-hub` bao gồm:
  * Thư mục `FE`: Ứng dụng Frontend (React 18 + Vite + TypeScript).
  * Thư mục `BE`: Ứng dụng Backend (NestJS + TypeScript).
* **Yêu cầu kỹ thuật:**
  * Quản lý tập trung các lệnh chạy qua `package.json` ở root bằng tham số `--prefix`.
  * Cấu hình luồng CI/CD tự động bằng GitHub Actions (`learning-hub/.github/workflows/ci.yml`).
  * Ghi nhận nhật ký kiểm chứng độc lập.

---

## 🛠️ 2. Công Cụ & Chỉ Dẫn Chính (Tools & Directives)

* **Công cụ đã dùng:** Antigravity AI Agent (Senior Tech Lead persona), VS Code, PowerShell, GitHub Actions runner.
* **Chỉ dẫn chính:**
  1. Khởi tạo `FE` dùng `npm create vite@latest FE -- --template react-ts`.
  2. Khởi tạo `BE` dùng `npx @nestjs/cli new BE --strict --skip-git --package-manager npm`.
  3. Cấu hình root `package.json` các script `--prefix`: `dev:fe`, `dev:be`, `build:fe`, `build:be`, `install:all`, `dev`.
  4. Tạo file CI `learning-hub/.github/workflows/ci.yml` kiểm thử tự động `npm install`, `lint`, `build` cho cả FE lẫn BE khi có Pull Request.

---

## 🧪 3. Kiểm Chứng Độc Lập (Independent Verification)

### 📋 Checklist Ngày 03:
- [x] **Cấu trúc Monorepo:** Thư mục `FE` (React+Vite) và `BE` (NestJS) tồn tại song song.
- [x] **Root Script Execution:** Chạy lệnh `--prefix` thành công từ root `learning-hub`.
- [x] **GitHub Actions Workflow:** File `learning-hub/.github/workflows/ci.yml` chuẩn cú pháp YAML v4.
- [x] **Tài liệu hóa:** Cập nhật `AI_WORKLOG.md` và `README.md` theo chuẩn dự án CyberSoft Academy.

---

## 📁 Danh Mục Tệp Đã Tạo / Cập Nhật Ngày 03

| Tệp Tài Liệu | Mô Tả | Trạng Thái |
| :--- | :--- | :---: |
| [package.json](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/package.json) | Root package.json quản lý `--prefix` scripts | ✅ Complete |
| [.github/workflows/ci.yml](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/.github/workflows/ci.yml) | GitHub Actions CI workflow trong folder learning-hub | ✅ Complete |
| [AI_WORKLOG.md](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/AI_WORKLOG.md) | Nhật ký minh bạch quá trình làm việc Ngày 03 | ✅ Complete |
| [README.md](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/README.md) | Hướng dẫn khởi chạy dự án Monorepo | ✅ Complete |
