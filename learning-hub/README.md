# 🚀 CyberSoft Learning & Contest Hub

Dự án **CyberSoft Learning & Contest Hub** là hệ thống quản lý học tập và chấm bài lập trình trực tuyến cho nhiều lứa tuổi (K3-12, Sinh viên & Người đi làm), được xây dựng dưới dạng Monorepo gồm 2 ứng dụng chính:

* **🎨 Frontend (`FE`)**: React 19 + Vite + TypeScript + Vanilla CSS Design System.
* **⚙️ Backend (`BE`)**: NestJS Framework + MongoDB (Mongoose) + Prisma ORM.

---

## 🌟 Chức Năng Hiện Tại (Features Status)

### 🎨 Frontend UI (`FE/` - Version 0.1 Học Viên)
- 📚 **Trang Course Catalog (Danh mục khóa học)**:
  - Hiển thị danh sách thẻ bài học chuẩn UI/UX với hiệu ứng hover bay nhẹ và bo góc mềm mại (`18px`).
  - Thanh tìm kiếm trực tiếp (*Live Search*) theo từ khóa và bộ lọc phân loại độ khó (*Cơ bản, Trung bình, Nâng cao*).
  - Thẻ thống kê tổng quan tổng số bài học và thời lượng khóa học.
- 📖 **Trang Lesson Detail (Chi tiết bài học)**:
  - Khung phát video mẫu tỷ lệ `16:9` sử dụng link nhúng YouTube công khai tương thích 100%, tự động chuyển video mượt mà khi đổi bài.
  - Hiển thị đầy đủ 4 thông số bắt buộc: **Mục tiêu bài học (Objectives)**, **Độ khó (Difficulty)**, **Thời lượng (Duration)**, và **Điều kiện tiên quyết (Prerequisites)** kèm trạng thái đáp ứng.
  - Sidebar danh sách bài học hỗ trợ chuyển nhanh giữa các bài và cụm nút điều hướng `Bài trước / Bài tiếp theo`.
- 📱 **Responsive & Accessibility**:
  - Giao diện đáp ứng tốt trên Mobile (`375px`), Tablet (`768px`) và Desktop (`1280px`).
  - Đạt chuẩn Accessibility (WCAG 2.1 AA) với `:focus-visible` ring, Semantic HTML5 (`header`, `nav`, `main`, `article`, `aside`, `footer`) và nhãn ARIA.
  - Tích hợp Modal hướng dẫn từng bước chụp ảnh màn hình Responsive bằng Chrome DevTools.

### ⚙️ Backend System (`BE/` - Version System & Database)
- 🗄️ **Kiến trúc CSDL MongoDB & Prisma Models**:
  - Khởi tạo đầy đủ 8 Collections/Bảng: `users`, `courses`, `lessons`, `exercises`, `tests`, `attempts`, `submissions`, `scores`.
  - Quản lý tầng CSDL qua `DatabaseModule` (Mongoose) kết nối MongoDB `cybersoft`.
- 🌾 **Kịch bản Seed Data tự động**:
  - Nạp sẵn tài khoản kiểm thử đơn giản (`admin@gmail.com`, `teacher@gmail.com`, `student@gmail.com` | Mật khẩu: `123456`).

---

## 💻 Yêu Cầu Hệ Thống (Prerequisites)

* **Node.js**: Phiên bản `18.x` trở lên (Khuyên dùng Node.js 20+ LTS).
* **MongoDB**: MongoDB Server Local (Cổng `27017`) hoặc **MongoDB Atlas**.
* **Git**: Trình quản lý mã nguồn Git.

---

## 🛠️ Hướng Dẫn Khởi Chạy Chi Tiết (Getting Started)

### 📥 1. Clone Dự Án Về Máy
Mở Terminal / Command Prompt và chạy:
```bash
git clone https://github.com/trlamm1505/cybersoft-learning-hub.git
cd cybersoft-learning-hub/learning-hub
```

---

### ⚙️ 2. Hướng Dẫn Chạy Backend Service (`BE`)

Mở Terminal tại thư mục `learning-hub`:

1. **Di chuyển vào thư mục Backend:**
   ```bash
   cd BE
   ```

2. **Cài đặt thư viện dependencies:**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`):**
   Tạo tệp `.env` tại thư mục `BE/` (hoặc kiểm tra file `.env` có sẵn) với nội dung:
   ```env
   # Database Connection (MongoDB / MongoDB Atlas)
   DATABASE_URL="mongodb://localhost:27017/cybersoft"

   # App Port
   PORT=3000

   # JWT Secret Key
   JWT_SECRET=cybersoft_secret_key_2026
   ```

4. **Nạp dữ liệu mẫu vào CSDL (Seed Data):**
   ```bash
   npm run seed
   ```
   *Lệnh này sẽ tự động khởi tạo 8 Bảng/Collections vào MongoDB `cybersoft` và mã hóa mật khẩu mẫu.*

5. **Khởi động Backend Server:**
   ```bash
   npm run start:dev
   ```
   👉 **Backend API Server sẽ chạy tại:** `http://localhost:3000`

---

### 🎨 3. Hướng Dẫn Chạy Frontend Service (`FE`)

Mở thêm **1 tab Terminal mới** tại thư mục `learning-hub`:

1. **Di chuyển vào thư mục Frontend:**
   ```bash
   cd FE
   ```

2. **Cài đặt thư viện dependencies:**
   ```bash
   npm install
   ```

3. **Khởi động Frontend Dev Server:**
   ```bash
   npm run dev
   ```
   👉 **Frontend App sẽ chạy tại:** `http://localhost:5173`

4. **Kiểm tra mã nguồn & Đóng gói:**
   - Kiểm tra Linter: `npm run lint` (Sử dụng `oxlint`).
   - Biên dịch Production Build: `npm run build` (Biên dịch TypeScript và Vite build).

---

## 🔑 Tài Khoản Mẫu Kiểm Thử (Backend Seed Data)

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn Hế Thống |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@gmail.com` | `123456` | Toàn quyền quản trị hệ thống |
| **Giảng viên (Teacher)** | `teacher@gmail.com` | `123456` | Quản lý khóa học, bài học & bài tập |
| **Học sinh (Student)** | `student@gmail.com` | `123456` | Học tập, nộp code & theo dõi tiến độ |

---

## ⚡ Các Lệnh Thường Dùng (Commands Summary)

### Backend (`BE/`)
| Lệnh | Công Dụng |
| :--- | :--- |
| `npm run start:dev` | Chạy Backend NestJS ở chế độ Development (Watch mode) |
| `npm run seed` | Khởi chạy script seed nạp dữ liệu mẫu 8 Collections |
| `npm run build` | Biên dịch TypeScript backend sang `dist/` |

### Frontend (`FE/`)
| Lệnh | Công Dụng |
| :--- | :--- |
| `npm run dev` | Khởi chạy Vite React Frontend Dev Server tại `http://localhost:5173` |
| `npm run build` | Kiểm tra TypeScript compilation (`tsc -b`) và đóng gói bundle `dist/` |
| `npm run lint` | Kiểm tra mã nguồn với `oxlint` (0 warning, 0 error) |

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
learning-hub/
├── FE/                        # Frontend React Application
│   ├── src/
│   │   ├── components/        # UI Components (CourseCard, DifficultyBadge, ObjectiveList, PrerequisiteCard...)
│   │   ├── data/              # 5 bài học mẫu chuẩn (mockLessons.ts)
│   │   ├── pages/             # Trang Danh mục (CourseCatalogPage) & Chi tiết (LessonDetailPage)
│   │   ├── styles/            # Design system CSS Variables & Responsive styling (main.css)
│   │   ├── types/             # TypeScript interfaces (course.ts)
│   │   ├── App.tsx            # Main App Router & Theme State
│   │   └── main.tsx           # Mount React App
│   ├── package.json
│   └── vite.config.ts
├── BE/                        # Backend NestJS Application
│   ├── src/
│   │   ├── common/            # Shared Decorators, Guards, Interceptors, Helpers
│   │   ├── data/              # Dữ liệu tĩnh & Script nạp CSDL (initial-data.ts, seed.ts)
│   │   ├── modules-api/       # API nghiệp vụ (Auth, Users, Courses, Exercises...)
│   │   └── modules-system/    # Cấu hình CSDL DatabaseModule & Prisma Models
│   ├── .env
│   ├── package.json
│   └── nest-cli.json
├── AI_WORKLOG.md              # Nhật ký làm việc chi tiết
└── README.md                  # Hướng dẫn khởi chạy dự án
```