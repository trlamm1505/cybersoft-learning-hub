# 🚀 CyberSoft Learning & Contest Hub

Dự án **CyberSoft Learning & Contest Hub** là hệ thống quản lý học tập và chấm bài lập trình trực tuyến cho nhiều lứa tuổi (K3-12, Sinh viên & Người đi làm), gồm 2 ứng dụng chính trong Monorepo:
* **Frontend (`FE`)**: React 18 + Vite + TypeScript.
* **Backend (`BE`)**: NestJS Framework + MongoDB (Mongoose) / Prisma ORM.

---

## 💻 Yêu Cầu Hệ Thống (Prerequisites)

* **Node.js**: Phiên bản `18.x` trở lên (Khuyên dùng Node.js LTS).
* **MongoDB**: MongoDB Local hoặc **MongoDB Atlas**.
* **Git**: Trình quản lý mã nguồn Git.

---

## 🛠️ Hướng Dẫn Tải Về & Khởi Chạy Chi Tiết (Installation Guide)

### 📥 Bước 1: Clone Dự Án Về Máy
Mở Terminal / Command Prompt và chạy lệnh:
```bash
git clone https://github.com/trlamm1505/cybersoft-learning-hub.git
cd cybersoft-learning-hub/learning-hub
```

---

### ⚙️ Bước 2: Khởi Chạy Backend Service (`BE`)

1. **Di chuyển vào thư mục Backend:**
   ```bash
   cd BE
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Tạo tệp `.env` tại thư mục `BE/` theo cấu hình mẫu sau:
   ```env
   # Database Connection (MongoDB / MongoDB Atlas)
   DATABASE_URL="mongodb://localhost:27017/your_database_name"

   # App Port
   PORT=3000

   # JWT Secret Key
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. **Nạp dữ liệu mẫu ban đầu vào CSDL (Seed Data):**
   ```bash
   npm run seed
   ```
   *Lệnh này sẽ tự động khởi tạo 8 Bảng/Collections (`users`, `courses`, `lessons`, `exercises`, `tests`, `attempts`, `submissions`, `scores`) và các tài khoản gõ test.*

5. **Khởi động ứng dụng Backend (Watch Mode):**
   ```bash
   npm run start:dev
   ```
   👉 **Backend API sẽ chạy tại:** `http://localhost:3000`

---

### 🎨 Bước 3: Khởi Chạy Frontend Service (`FE`)

Mở thêm một tab Terminal mới tại thư mục gốc `learning-hub`:

1. **Di chuyển vào thư mục Frontend:**
   ```bash
   cd FE
   ```

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Khởi động ứng dụng Frontend:**
   ```bash
   npm run dev
   ```
   👉 **Frontend App sẽ chạy tại:** `http://localhost:5173`

---

## 🔑 Danh Sách Tài Khoản Mẫu Để Đăng Nhập / Test

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@gmail.com` | `123456` | Toàn quyền quản trị hệ thống |
| **Giảng viên (Teacher)** | `teacher@gmail.com` | `123456` | Tạo bài học, khóa học & bài tập |
| **Học sinh (Student)** | `student@gmail.com` | `123456` | Làm bài tập, nộp code & xem điểm |

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
learning-hub/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI Workflow
├── FE/                        # Frontend Application (React 18 + Vite + TypeScript)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── BE/                        # Backend Application (NestJS + TypeScript)
│   ├── src/
│   │   ├── common/            # Shared Decorators, Guards, Interceptors, Helpers
│   │   ├── data/              # Dữ liệu tĩnh & Script nạp CSDL (initial-data.ts, seed.ts)
│   │   ├── modules-api/       # API nghiệp vụ (Auth, Users, Courses, Exercises...)
│   │   └── modules-system/    # Cấu hình CSDL DatabaseModule & Prisma Models
│   ├── package.json
│   └── nest-cli.json
├── AI_WORKLOG.md              # Nhật ký ghi nhận công việc & kiểm chứng AI Worklog
└── README.md                  # Hướng dẫn khởi chạy dự án
```