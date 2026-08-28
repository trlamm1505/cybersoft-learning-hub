# 🤖 AI_WORKLOG.md - Ngày 05: Xây Dựng Giao Diện Học Viên Course UI v0.1 (React / FE + Tailwind CSS v4)

Tài liệu ghi nhận toàn bộ quá trình trao đổi, các câu prompt yêu cầu của người dùng và danh sách chi tiết các tệp mã nguồn được **Tạo mới / Cập nhật** theo từng bước prompt trong **Ngày 05** của dự án **Learning & Contest Hub** (CyberSoft Academy).

---

## 📌 Chi Tiết Công Việc Theo Từng Prompt (Per-Prompt Detailed Change Log)

---

### 💬 PROMPT 1: Xây dựng giao diện Học viên phiên bản v0.1
> **Nội dung Yêu cầu:**
> Xây dựng giao diện Course UI v0.1 cho phía học viên trên ứng dụng React (`FE/`). Bao gồm trang Course Catalog và Lesson Detail, hiển thị đầy đủ: **Mục tiêu, Độ khó, Thời lượng, Điều kiện tiên quyết (Prerequisite)**, tích hợp 5 bài học mẫu, tương thích Responsive và chuẩn Accessibility.

#### 📄 Danh sách File Tạo mới & Chỉnh sửa cho Prompt 1:
- 🟢 **`FE/src/types/course.ts` [TẠO MỚI]**: Định nghĩa domain model TypeScript cho `Lesson`, `DifficultyLevel`, `PrerequisiteItem`.
- 🟢 **`FE/src/data/mockLessons.ts` [TẠO MỚI]**: Tích hợp dữ liệu 5 bài học mẫu chuẩn CyberSoft đầy đủ thông số.
- 🟢 **`FE/src/styles/main.css` [TẠO MỚI]**: Khởi tạo CSS Design Tokens, Flex/Grid layout & Accessibility `:focus-visible` styles.
- 🟢 **`FE/src/components/DifficultyBadge.tsx` [TẠO MỚI]**: Badge hiển thị cấp độ bài học (Cơ bản, Trung bình, Nâng cao).
- 🟢 **`FE/src/components/ObjectiveList.tsx` [TẠO MỚI]**: Component danh sách mục tiêu kết quả đầu ra sau bài học.
- 🟢 **`FE/src/components/PrerequisiteCard.tsx` [TẠO MỚI]**: Component hiển thị điều kiện tiên quyết kèm icon trạng thái hoàn thành.
- 🟢 **`FE/src/components/CourseCard.tsx` [TẠO MỚI]**: Thẻ bài học xem trước trong trang Catalog.
- 🟢 **`FE/src/components/LessonSidebar.tsx` [TẠO MỚI]**: Sidebar danh sách bài học hỗ trợ chuyển bài tức thì.
- 🟢 **`FE/src/components/ResponsiveGuideModal.tsx` [TẠO MỚI]**: Modal hướng dẫn chụp ảnh responsive bằng DevTools.
- 🟢 **`FE/src/components/Header.tsx` [TẠO MỚI]**: Thanh navigation header hỗ trợ Mobile Drawer & Theme Switcher.
- 🟢 **`FE/src/components/Footer.tsx` [TẠO MỚI]**: Footer thông tin bản quyền CyberSoft Academy chuẩn WCAG.
- 🟢 **`FE/src/pages/CourseCatalogPage.tsx` [TẠO MỚI]**: Trang Danh mục với ô tìm kiếm, bộ lọc độ khó và thẻ thống kê.
- 🟢 **`FE/src/pages/LessonDetailPage.tsx` [TẠO MỚI]**: Trang Chi tiết bài học hiển thị video player, metadata grid, objectives, prerequisites, content & prev/next buttons.
- 🟡 **`FE/src/App.tsx` [CHỈNH SỬA]**: Kết nối router state giữa Catalog và Detail.
- 🟡 **`FE/src/main.tsx` [CHỈNH SỬA]**: Mount ứng dụng React và nạp stylesheet `main.css`.

---

### 💬 PROMPT 2: Tối ưu UI/UX & Khắc phục hiển thị Video bài học
> **Nội dung Yêu cầu:**
> Làm gọn banner hero, nâng cấp thẻ card bài học (thêm hiệu ứng hover bay lên, bo góc mềm mại 18px), bố trí cột video player và sidebar thẳng hàng trên desktop, đồng thời sửa lỗi "Video không có sẵn" cho cả 5 bài học mẫu.

#### 📄 Danh sách File Chỉnh sửa cho Prompt 2:
- 🟡 **`FE/src/data/mockLessons.ts` [CẬP NHẬT]**: Thay thế toàn bộ 5 link video mẫu bằng URL nhúng YouTube công khai tương thích cao (`youtube-nocookie.com/embed/...`).
- 🟡 **`FE/src/styles/main.css` [CẬP NHẬT]**: Thêm hiệu ứng hover card (`transform: translateY(-6px)`), bo góc `18px`, banner hero gọn đẹp & sticky alignment cho sidebar.
- 🟡 **`FE/src/components/CourseCard.tsx` [CẬP NHẬT]**: Bổ sung panel tóm tắt thông số bài học và cụm nút `Học ngay →`.
- 🟡 **`FE/src/pages/CourseCatalogPage.tsx` [CẬP NHẬT]**: Làm gọn banner hero, căn chỉnh khoảng cách padding/margin giữa các khối bài học.
- 🟡 **`FE/src/pages/LessonDetailPage.tsx` [CẬP NHẬT]**: Gán thuộc tính `key={currentLesson.id}` cho thẻ `iframe` giúp tự động re-mount và đổi video tức thì khi người dùng bấm chuyển bài.

---

### 💬 PROMPT 3: Chuyển đổi toàn bộ dự án sang Tailwind CSS v4
> **Nội dung Yêu cầu:**
> Chuyển đổi toàn bộ giao diện dự án Frontend sang sử dụng Tailwind CSS.

#### 📄 Danh sách File Chỉnh sửa cho Prompt 3:
- 🟡 **`FE/package.json` [CẬP NHẬT]**: Cài đặt dependencies `tailwindcss` và `@tailwindcss/vite`.
- 🟡 **`FE/vite.config.ts` [CẬP NHẬT]**: Tích hợp plugin `@tailwindcss/vite` tương thích Vite 8.
- 🟡 **`FE/src/styles/main.css` [CẬP NHẬT]**: Khai báo chỉ thị `@import "tailwindcss";`.
- 🟡 **10 Component UI (`Header`, `Footer`, `DifficultyBadge`, `ObjectiveList`, `PrerequisiteCard`, `CourseCard`, `LessonSidebar`, `ResponsiveGuideModal`, `CourseCatalogPage`, `LessonDetailPage`) [CẬP NHẬT]**: Refactor toàn bộ 100% inline/CSS class cũ sang Tailwind Utility Classes.

---

### 💬 PROMPT 4: Khắc phục màu sắc giao diện & Thiết lập mặc định Giao diện Sáng (Light Mode)
> **Nội dung Prompt:**
> "giao diện đang bị lỗi màu sắc chỉnh lại đi và tôi muốn giao diện mới vào sẽ là sáng"

#### 📄 Danh sách File Chỉnh sửa cho Prompt 4:
- 🟡 **`FE/src/App.tsx` [CẬP NHẬT]**: Đổi mặc định `isLightTheme = true` (khi mở trang web sẽ mặc định hiển thị Giao diện Sáng) và đồng bộ class `theme-dark` khi học viên bấm chuyển đổi theme.
- 🟡 **`FE/src/styles/main.css` [CẬP NHẬT]**: Khai báo hệ thống biến CSS Theme Variables (`--bg-main: #f8fafc`, `--bg-card: #ffffff`, `--text-main: #0f172a`, `--border-color: #e2e8f0`) cho phép giao diện tự động chuyển đổi mịn màng giữa Sáng & Tối.
- 🟡 **`FE/src/components/Header.tsx` [CẬP NHẬT]**: Chuyển đổi màu nền header và chữ sang biến theme tương phản cao trên nền sáng.
- 🟡 **`FE/src/components/CourseCard.tsx` [CẬP NHẬT]**: Đổi thẻ card thành nền trắng `#ffffff`, viền nhẹ `border-slate-200`, chữ tối `text-slate-900` sắc nét.
- 🟡 **`FE/src/components/DifficultyBadge.tsx` [CẬP NHẬT]**: Badge độ khó màu chữ đậm tương phản rõ ràng trên nền sáng (Xanh lá, Cam, Đỏ).
- 🟡 **`FE/src/components/ObjectiveList.tsx` [CẬP NHẬT]**: Đổi màu chữ hiển thị mục tiêu theo biến theme.
- 🟡 **`FE/src/components/PrerequisiteCard.tsx` [CẬP NHẬT]**: Đổi màu nền & chữ thẻ điều kiện tiên quyết theo biến theme.
- 🟡 **`FE/src/components/LessonSidebar.tsx` [CẬP NHẬT]**: Đổi màu nền bài học active/inactive chuẩn tương phản trên nền sáng.
- 🟡 **`FE/src/pages/CourseCatalogPage.tsx` [CẬP NHẬT]**: Banner hero dải màu dịu mát trên nền sáng, ô tìm kiếm & nút lọc rõ nét.
- 🟡 **`FE/src/pages/LessonDetailPage.tsx` [CẬP NHẬT]**: Bố cục nội dung bài học chữ tối tương phản cao trên nền sáng.

---

## 🧪 Kết Quả Kiểm Thử (Verification Summary)
- **TypeScript Compilation**: `npm run build` -> Clean 100% (Vite build bundle thành công).
- **Linter**: `npm run lint` -> 0 Warnings, 0 Errors trên 15 files.
