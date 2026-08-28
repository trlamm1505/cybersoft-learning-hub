# 🚀 CyberSoft Learning & Contest Hub

Dự án **CyberSoft Learning & Contest Hub** là hệ thống quản lý học tập và chấm bài lập trình trực tuyến cho nhiều lứa tuổi (K3-12, Sinh viên & Người đi làm), được xây dựng dưới dạng Monorepo gồm 2 ứng dụng chính:

* **🎨 Frontend (`FE`)**: React 19 + Vite + TypeScript + Tailwind CSS v4 + Light/Dark Theme System + Axios API Layer.
* **⚙️ Backend (`BE`)**: NestJS Framework + MongoDB (Mongoose) + Quiz Engine + CORS Support + Jest Unit/Integration Tests.

---

## 🌟 Chức Năng Hiện Tại (Features Status)

### 🎨 Frontend UI (`FE/` - Version 0.1 Học Viên)
- 📝 **Trang Thi Trắc Nghiệm (`QuizTakingPage.tsx`)**:
  - Giao diện làm bài thi trắc nghiệm trực tuyến đồng bộ trực tiếp với Backend qua tầng `FE/src/axios/quizApi.ts`.
  - **Đồng hồ đếm ngược thời gian thực (`QuizTimer.tsx`)**: Đếm ngược 30:00 phút với cảnh báo đổi màu đỏ nhấp nháy khi dưới 5 phút và tự động nộp bài khi hết giờ.
  - **Thanh điều hướng câu hỏi (`QuestionNavigator.tsx`)**: Lưới chọn nhanh 20 câu hỏi hiển thị trạng thái Đã chọn / Chưa chọn rõ ràng.
  - **Thẻ nội dung câu hỏi (`QuestionCard.tsx`)**: Hiển thị nội dung, mức độ, chủ đề, khung mã code mẫu (Code Snippet Box) và 4 phương án A/B/C/D với hiệu ứng hover/focus mượt mà.
  - **Màn hình tổng kết điểm & Giải thích (`QuizResultView.tsx`)**: Hiển thị bảng điểm, tỷ lệ % đạt và danh sách xem lại câu đúng/câu sai kèm **lời giải thích chi tiết từ Giảng viên**.
- 🎨 **Thiết kế Tailwind CSS v4 & Chế độ Sáng/Tối (Light/Dark Mode)**:
  - Mặc định giao diện ở **Chế độ Sáng (Light Mode)** tươi mới, hỗ trợ chuyển đổi mượt mà sang Dark Mode qua Theme Toggle.
- 📚 **Trang Course Catalog (Danh mục khóa học)**:
  - Hiển thị danh sách thẻ bài học chuẩn UI/UX, tìm kiếm trực tiếp (*Live Search*) và bộ lọc phân loại độ khó.
- 📖 **Trang Lesson Detail (Chi tiết bài học)**:
  - Khung phát video tỷ lệ `16:9` sử dụng nhúng YouTube công khai tương thích 100%, tự động chuyển video mượt mà khi đổi bài.

---

### ⚙️ Backend System (`BE/` - Quiz Engine Module v0.1 & Database)
- 🌐 **CORS & Global Prefix (`BE/src/main.ts`)**:
  - Bật CORS cho phép kết nối liên cổng từ Frontend (`http://localhost:5173`) sang Backend với tiền tố toàn cục `/api`.
- 🗄️ **Kiến trúc CSDL Mongoose Schemas (`BE/src/modules-system/database/schemas/`)**:
  - `Question`: Nội dung câu hỏi (`content`), mảng phương án (`options` dạng subdocument `key`, `text`, `isCorrect`), giải thích sư phạm chi tiết (`explanation`), mức độ (`difficulty`), chủ đề (`category`), điểm số (`points`) và nhãn (`tags`).
  - `QuizAttempt`: Quản lý lượt thi (`userId`, `testId`, chuỗi `seed` ngẫu nhiên xáo trộn, mảng câu hỏi `shuffledQuestions`, vị trí phương án xáo trộn, lựa chọn học viên `selectedOptionKey`, cờ `isCorrect`, thời gian bắt đầu `startedAt`, thời hạn `timeLimitSeconds`, trạng thái `status` và điểm tổng `score/maxScore`).
- ⚡ **3 Luồng Nghiệp Vụ Trắc Nghiệm Cốt Lõi (`BE/src/modules-api/quiz/`)**:
  1. **API Bắt đầu làm bài (`POST /api/quiz/start`)**: Sinh `seed` ngẫu nhiên, tự động xáo trộn phương án ngầm ngẫu nhiên nhất quán bằng thuật toán PRNG Fisher-Yates, lọc bỏ (strip) thuộc tính `isCorrect` và `explanation` ra khỏi JSON trả về để chống gian lận khi làm bài.
  2. **API Nộp bài & Tự động chấm điểm (`POST /api/quiz/:attemptId/submit`)**: Kiểm tra thời hạn làm bài (`startedAt` + `timeLimitSeconds`), tự động hủy bài quá hạn (`EXPIRED`), tự động chấm điểm bài nộp theo đáp án gốc và cập nhật trạng thái `GRADED`.
  3. **API Xem kết quả & Giải thích (`GET /api/quiz/:attemptId/review`)**: Kiểm tra chính sách xem bài của giảng viên (*Review Policy*: `IMMEDIATE`, `AFTER_SUBMISSION`, `AFTER_DEADLINE`, `NEVER`) để quyết định trả về đáp án đúng và phần giải thích sư phạm chi tiết.
- 🌾 **Kịch bản Seed Data 20 Câu Hỏi Trắc Nghiệm**:
  - Tích hợp bộ 20 câu hỏi trắc nghiệm Lập trình Web thực tế (*HTML5, CSS Flexbox/Grid, JS ES6+ Async/Await, React Hooks, NestJS Architecture, MongoDB/Prisma*) kèm giải thích từng câu. Chạy lệnh: `npm run seed:quiz`.
- 🧪 **Bộ Kiểm Thử Jest Unit & Integration Test Suite**:
  - 10/10 bài test tự động vượt qua 100% (`npm run test`).

---

## 💻 Yêu Cầu Hệ Thống (Prerequisites)

* **Node.js**: Phiên bản `18.x` trở lên (Khuyên dùng Node.js 20+ LTS).
* **MongoDB**: MongoDB Server Local (Cổng `27017`) hoặc **MongoDB Atlas**.
* **Git**: Trình quản lý mã nguồn Git.

---

## 🛠️ Hướng Dẫn Khởi Chạy Chi Tiết (Getting Started)

### 📥 1. Clone Dự Án Về Máy
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
   Tạo tệp `.env` tại thư mục `BE/` (hoặc sao chép từ `.env.example`):
   ```env
   # Database Connection (MongoDB Local hoặc Atlas)
   DATABASE_URL="mongodb://localhost:27017/<your_database_name>"

   # App Port
   PORT=3000

   # JWT Secret Key
   JWT_SECRET="<your_jwt_secret_key>"
   ```

4. **Nạp dữ liệu Quiz Engine 20 câu hỏi trắc nghiệm:**
   ```bash
   npm run seed:quiz
   ```

5. **Khởi động Backend Server:**
   ```bash
   npm run start:dev
   ```
   👉 **Backend REST API Server chạy tại:** `http://localhost:3000/api`

6. **Chạy bộ kiểm thử Jest Test Suite:**
   ```bash
   npm run test
   ```

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

3. **Cấu hình biến môi trường (`.env`):**
   Tạo tệp `.env` tại thư mục `FE/` (hoặc sao chép từ `.env.example`):
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Khởi động Frontend Dev Server:**
   ```bash
   npm run dev
   ```
   👉 **Frontend Web App chạy tại:** `http://localhost:5173`

---

## 🧪 Hướng Dẫn Test API Quiz Engine Trên Postman / Thunder Client

Đặt biến môi trường trong Postman: **`Su = http://localhost:3000/api`**

### 1. API Bắt đầu làm bài (Start Attempt)
- **Method**: `POST` | **URL**: `{{Su}}/quiz/start`
- **Body (raw JSON)**:
  ```json
  {
    "userId": "673f11111111111111111111",
    "testId": "673f22222222222222222222"
  }
  ```
- **Script tự động làm bài (dán vào tab `Post-response`)**:
  ```javascript
  const response = pm.response.json();
  pm.environment.set("attemptId", response.attemptId);

  if (response.questions && response.questions.length > 0) {
      const autoAnswers = response.questions.map(q => ({
          questionId: q.questionId,
          selectedOptionKey: q.options[Math.floor(Math.random() * q.options.length)].key
      }));
      pm.environment.set("answers", JSON.stringify(autoAnswers));
  }
  ```

### 2. API Nộp bài & Tự động chấm điểm (Submit Attempt)
- **Method**: `POST` | **URL**: `{{Su}}/quiz/{{attemptId}}/submit`
- **Body (raw JSON)**:
  ```json
  {
    "userId": "673f11111111111111111111",
    "answers": {{answers}}
  }
  ```

### 3. API Xem kết quả & Giải thích (Review Policy)
- **Method**: `GET` | **URL**: `{{Su}}/quiz/{{attemptId}}/review?userId=673f11111111111111111111&policy=AFTER_SUBMISSION`

---

## 🔑 Tài Khoản Mẫu Kiểm Thử (Backend Seed Data)

| Vai Trò | Email Đăng Nhập | Mật Khẩu | Quyền Hạn Hế Thống |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@gmail.com` | `123456` | Toàn quyền quản trị hệ thống |
| **Giảng viên (Teacher)** | `teacher@gmail.com` | `123456` | Quản lý khóa học, bài học & đề thi trắc nghiệm |
| **Học sinh (Student)** | `student@gmail.com` | `123456` | Làm bài trắc nghiệm, nộp bài & xem giải thích |

---

## ⚡ Các Lệnh Thường Dùng (Commands Summary)

### Backend (`BE/`)
| Lệnh | Công Dụng |
| :--- | :--- |
| `npm run start:dev` | Chạy Backend NestJS ở chế độ Watch mode (`http://localhost:3000/api`) |
| `npm run seed:quiz` | Khởi chạy script seed nạp 20 câu hỏi trắc nghiệm & bài thi mẫu |
| `npm run test` | Khởi chạy Jest Test Runner thực thi toàn bộ 10 bài unit & integration test |
| `npm run build` | Biên dịch TypeScript backend sang `dist/` |

### Frontend (`FE/`)
| Lệnh | Công Dụng |
| :--- | :--- |
| `npm run dev` | Khởi chạy Vite React Frontend Dev Server tại `http://localhost:5173` |
| `npm run build` | Đóng gói sản phẩm production bundle vào `dist/` |
| `npm run lint` | Kiểm tra linter mã nguồn với `oxlint` (0 warning, 0 error) |

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
learning-hub/
├── FE/                        # Frontend React Application
│   ├── src/
│   │   ├── axios/             # Tầng Service Calls (quizApi.ts)
│   │   ├── common/            # Shared utilities & Axios Client (configAxios.ts)
│   │   ├── components/        # UI Components nằm phẳng (QuestionCard, QuestionNavigator, QuizResultView, QuizTimer...)
│   │   ├── data/              # 5 bài học mẫu chuẩn (mockLessons.ts)
│   │   ├── pages/             # Trang Danh mục, Chi tiết bài học & Trang Thi Trắc Nghiệm (QuizTakingPage.tsx)
│   │   ├── styles/            # Tailwind CSS v4 & Theme Variable Styles (main.css)
│   │   ├── types/             # TypeScript Interfaces (course.ts, quiz.ts)
│   │   └── App.tsx            # Navigation Router & Theme State
│   ├── .env
│   ├── .env.example
│   └── vite.config.ts
├── BE/                        # Backend NestJS Application
│   ├── src/
│   │   ├── common/
│   │   │   └── helper/        # PRNG Seed Shuffle Helper & Unit Tests (prng.helper.ts, prng.helper.spec.ts)
│   │   ├── data/              # 20 câu hỏi trắc nghiệm & Script Seed (initial-quiz-questions.ts, seed-quiz.ts)
│   │   ├── modules-api/
│   │   │   └── quiz/          # Module Quiz Engine (dto, quiz.service.ts, quiz.controller.ts, quiz.service.spec.ts)
│   │   └── modules-system/
│   │       └── database/      # NestJS Mongoose Schemas (question.schema.ts, quiz-attempt.schema.ts)
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── main.ts                # Entry point với app.enableCors() & app.setGlobalPrefix('api')
├── AI_WORKLOG.md              # Nhật ký làm việc chi tiết Ngày 06
└── README.md                  # Hướng dẫn khởi chạy & test dự án
```