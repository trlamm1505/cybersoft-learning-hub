# 🤖 AI_WORKLOG.md - Ngày 04: Cấu Trúc Monorepo Backend & Database Schema (MongoDB / Mongoose & Prisma)

Tài liệu ghi nhận toàn bộ quá trình trao đổi, yêu cầu điều chỉnh của người dùng và kết quả thực thi của **AI Technical Lead / Backend Developer Persona** trong **Ngày 04** dự án **CyberSoft Learning & Contest Hub**.

---

## 📌 1. Yêu Cầu & Mong Muốn Của Người Dùng (User Directives & Iterations)

1. **Kiến trúc Thư mục Chuẩn:**
   * Phân chia rõ ràng cấu trúc `BE/src`:
     * `common/`: Tiện ích dùng chung (`constant/`, `decorators/`, `guards/`, `helper/`, `interceptors/`).
     * `modules-api/`: Giữ sạch 100%, dành riêng cho việc phát triển các API chức năng nghiệp vụ sau này.
     * `modules-system/`: Chứa `database/` (kết nối MongoDB) và `prisma/` (`prisma.module.ts`, `prisma.service.ts` cùng thư mục mô hình xuất `generated/prisma/models/`).
     * `data/`: Tạo thư mục riêng lưu dữ liệu mẫu và script seed (`initial-data.ts`, `seed.ts`).

2. **Cấu hình CSDL & Tệp `.env` Tinh Gọn:**
   * Sử dụng **duy nhất 1 biến kết nối CSDL `DATABASE_URL`** trỏ tới MongoDB `cybersoft` (`mongodb://localhost:27017/cybersoft` hoặc MongoDB Atlas connection string).

3. **Tài Khoản Mẫu Đơn Giản & Dễ Nhớ:**
   * Cập nhật danh sách tài khoản kiểm thử ngắn gọn tại `src/data/initial-data.ts`:
     * **Admin:** `admin@gmail.com` | Mật khẩu: `123456`
     * **Teacher:** `teacher@gmail.com` | Mật khẩu: `123456`
     * **Student:** `student@gmail.com` | Mật khẩu: `123456`

4. **Khởi Tạo Đầy Đủ 8 Bảng CSDL (Collections):**
   * Yêu cầu nạp dữ liệu đầy đủ cho toàn bộ 8 bảng theo đề bài: `users`, `courses`, `lessons`, `exercises`, `tests` (có quản lý version và test cases), `attempts`, `submissions`, và `scores`.

---

## 🛠️ 2. Các Bước Thực Thi Kỹ Thuật (Technical Implementation)

* **Thiết kế Model & Schema:**
  * Khai báo 8 Model Classes tại `BE/src/modules-system/prisma/generated/prisma/models/`: `Users.ts`, `Courses.ts`, `Lessons.ts`, `Exercises.ts`, `Tests.ts`, `Submissions.ts`, `Attempts.ts`, `Scores.ts`.
  * Khai báo Mongoose Schemas & Types đầy đủ cho 8 Collections trong `src/data/seed.ts`.

* **Tập Lệnh Seed Data (`src/data/seed.ts`):**
  * Tự động mã hóa mật khẩu mẫu bằng `bcrypt`.
  * Kết nối trực tiếp MongoDB `cybersoft`, thực hiện dọn dẹp và nạp mới dữ liệu cho toàn bộ 8 Collections.

* **Sửa Lỗi Kỹ Thuật & Tối Ưu:**
  * Loại bỏ `import '@prisma/client'` trong `initial-data.ts`, chuyển sang sử dụng hằng số chuỗi chuẩn MongoDB để triệt tiêu lỗi hiển thị vạch đỏ trong VS Code.
  * Đảm bảo `app.module.ts` nạp `DatabaseModule` kết nối MongoDB an toàn không bị xung đột cổng hay kết nối CSDL phụ.

---

## 🧪 3. Kiểm Chứng Độc Lập (Independent Verification Results)

### 📋 Checklist Ngày 04:
- [x] **Cấu trúc Thư mục `BE/src`:** `common/`, `modules-api/` (sạch), `modules-system/`, `data/`.
- [x] **Tệp `.env`:** Chỉ chứa duy nhất `DATABASE_URL="mongodb://localhost:27017/cybersoft"`.
- [x] **Nạp Dữ liệu Mẫu (Seed Output):** Đã chạy `npm run seed` thành công, nạp đủ 8 Collections vào CSDL `cybersoft`.
- [x] **Biên dịch TypeScript (`npx tsc --noEmit`):** **0 Errors** (Không còn bất kỳ lỗi mã nguồn nào).
- [x] **Build dự án (`npm run build`):** **Build Succeeded 100%**.

---

## 📁 Danh Mục Tệp Đã Tạo / Cập Nhật Ngày 04

| Tệp Mã Nguồn | Mô Tả Chức Năng | Trạng Thái |
| :--- | :--- | :---: |
| [BE/.env](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/.env) | Cấu hình biến môi trường với `DATABASE_URL` duy nhất cho MongoDB | ✅ Complete |
| [BE/src/data/initial-data.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/data/initial-data.ts) | Dữ liệu tĩnh mẫu với tài khoản gõ test siêu ngắn gọn (`123456`) | ✅ Complete |
| [BE/src/data/seed.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/data/seed.ts) | Kịch bản nạp tự động toàn bộ 8 Bảng CSDL MongoDB | ✅ Complete |
| [BE/src/modules-system/database/database.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/database.module.ts) | NestJS DatabaseModule kết nối MongoDB via Mongoose | ✅ Complete |
| [BE/src/modules-system/prisma/generated/prisma/models/](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/prisma/generated/prisma/models/) | Thư mục chứa 8 Model Classes CSDL | ✅ Complete |
| [BE/src/app.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/app.module.ts) | AppModule nạp DatabaseModule kết nối CSDL | ✅ Complete |
| [AI_WORKLOG.md](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/AI_WORKLOG.md) | Nhật ký ghi nhận đầy đủ quá trình làm việc Ngày 04 | ✅ Complete |
