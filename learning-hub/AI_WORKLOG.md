# 🤖 AI_WORKLOG.md - Ngày 05: Xây Dựng Giao Diện Học Viên Course UI v0.1 (React / FE)

Tài liệu ghi nhận toàn bộ quá trình trao đổi, các câu prompt yêu cầu của người dùng và danh sách các tệp mã nguồn đã thêm mới / chỉnh sửa trong **Ngày 05** của dự án **Learning & Contest Hub** (CyberSoft Academy).

---

## 📌 1. Lịch Sử Prompt & Yêu Cầu Của Người Dùng (User Prompts & Directives)

### 💬 Prompt 1 (Xây dựng giao diện Học viên phiên bản v0.1):
> **Nội dung Prompt:**
> "Bạn là một Frontend Developer phụ trách Ngày 05 trong dự án 'Learning & Contest Hub' của CyberSoft Academy. Hôm nay nhiệm vụ của chúng ta là xây dựng giao diện phiên bản đầu tiên (v0.1) cho phía học viên trên nền tảng React (\`FE/\`).
>
> Hãy giúp tôi viết code hoàn chỉnh và chi tiết cho các yêu cầu sau:
> 1. Việc phải làm:
>    - Tạo trang Course Catalog (Danh mục khóa học) và Lesson Detail (Chi tiết bài học).
>    - Hiển thị đầy đủ các thông tin: Mục tiêu, độ khó, thời lượng và điều kiện tiên quyết (Prerequisite).
>    - Thiết kế giao diện gọn gàng, tương thích tốt trên cả máy tính lẫn thiết bị di động (Responsive desktop/mobile).
> 2. Đầu ra bàn giao cuối ngày (Deliverables):
>    - Source code giao diện Course UI v0.1.
>    - Tích hợp sẵn 5 bài học mẫu để hiển thị kiểm thử trực quan.
>    - Hướng dẫn cấu trúc để chụp ảnh màn hình Responsive.
> 3. Điều kiện nghiệm thu (Acceptance Criteria):
>    - Đảm bảo điều hướng rõ ràng giữa các trang.
>    - Đạt chuẩn Accessibility cơ bản."

### 💬 Prompt 2 (Tối ưu UI/UX & Khắc phục hiển thị Video bài học):
> **Nội dung Prompt:**
> "Giao diện v0.1 hiện tại của tôi (Course Catalog và Lesson Detail như trong hình) đang cần tối ưu lại UI/UX và xử lý phần hiển thị video bài học:
> 1. Tinh chỉnh UI/UX cho đẹp mắt hơn:
>    - Tăng tính hiện đại cho trang Course Catalog: làm gọn phần banner đầu trang, cải tiến các thẻ card bài học (thêm hiệu ứng hover nổi lên, bo góc mềm mại hơn, căn chỉnh lại khoảng cách padding/margin giữa các khối cho thoáng và cân đối).
>    - Cải thiện trang Lesson Detail: bố trí lại khung video bài học và cột 'Danh sách bài học' bên cạnh sao cho hài hòa, không bị lệch bố cục trên màn hình desktop.
> 2. Khắc phục lỗi 'Video không có sẵn':
>    - Thêm cơ chế mock dữ liệu video mẫu (ví dụ nhúng một video nhúng YouTube công khai dạng iframe làm video học tập mẫu) cho cả 5 bài học để khi người dùng bấm nút 'Học ngay' ở trang chủ hoặc chuyển đổi bài học ở cột bên phải, video sẽ tự động đổi link và phát chạy được bình thường thay vì báo lỗi không có sẵn.
> Hãy viết lại code cập nhật cho các component này giúp tôi."

---

## 🛠️ 2. Kết Quả Thực Thi Kỹ Thuật (Technical Implementation)

* **Thiết Kế Kiến Trúc & Component (Modular Architecture):**
  * Xây dựng hệ thống kiểu dữ liệu TypeScript domain model tại `src/types/course.ts`.
  * Tích hợp bộ 5 bài học mẫu chuẩn CyberSoft thực tế với đầy đủ Mục tiêu, Độ khó, Thời lượng & Tiên quyết tại `src/data/mockLessons.ts`.
  * Cập nhật bộ link video YouTube nhúng công khai tương thích cao (`youtube-nocookie.com/embed/...`) cho toàn bộ 5 bài học mẫu, kèm cơ chế tự động re-mount `iframe` bằng React `key={currentLesson.id}` khi người dùng đổi bài.
  * Nâng cấp bộ Design System CSS Variables tại `src/styles/main.css`: Card bo góc mềm mại `border-radius: 18px`, hiệu ứng hover bay nhẹ `transform: translateY(-6px)`, banner hero gọn gàng, và căn lề sticky đồng đều giữa Video player & Sidebar trên desktop.
  * Tách biệt các component hiển thị hạt nhân: `DifficultyBadge`, `ObjectiveList`, `PrerequisiteCard`, `CourseCard`, `LessonSidebar`, `ResponsiveGuideModal`, `Header`, `Footer`.
  * Phát triển 2 trang chính: `CourseCatalogPage` (Search, Filter, Stats, Grid layout) và `LessonDetailPage` (Video player mock, Metrics grid, Objectives, Prerequisites, Lesson content, Prev/Next navigation controls).

* **Kiểm Thử & Đảm Bảo Chất Lượng (Verification):**
  * `npm run build`: Đã biên dịch TypeScript (`tsc -b`) và đóng gói bundle thành công (`dist/index.html`, `dist/assets/`).
  * `oxlint`: Clean 100% (0 warnings, 0 errors trên 15 tệp).

---

## 📁 3. Danh Mục Tệp Đã Tạo & Chỉnh Sửa Trong Ngày (Files Log)

| Tệp Mã Nguồn | Hành Động | Mô Tả Chức Năng |
| :--- | :---: | :--- |
| [FE/src/types/course.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/types/course.ts) | 🟢 **[TẠO MỚI]** | Định nghĩa TypeScript types/interfaces (`Lesson`, `DifficultyLevel`, `PrerequisiteItem`). |
| [FE/src/data/mockLessons.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/data/mockLessons.ts) | 🟢 **[TẠO MỚI]** | Bộ dữ liệu 5 bài học mẫu kèm link video nhúng YouTube công khai tương thích 100%. |
| [FE/src/styles/main.css](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/styles/main.css) | 🟢 **[TẠO MỚI]** | Tinh chỉnh UI/UX, hiệu ứng hover card, banner gọn đẹp & sticky sidebar alignment. |
| [FE/src/components/DifficultyBadge.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/DifficultyBadge.tsx) | 🟢 **[TẠO MỚI]** | Badge hiển thị trực quan cấp độ bài học (Cơ bản, Trung bình, Nâng cao). |
| [FE/src/components/ObjectiveList.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ObjectiveList.tsx) | 🟢 **[TẠO MỚI]** | Component danh sách mục tiêu kết quả đầu ra sau bài học. |
| [FE/src/components/PrerequisiteCard.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/PrerequisiteCard.tsx) | 🟢 **[TẠO MỚI]** | Component hiển thị điều kiện tiên quyết kèm icon trạng thái hoàn thành. |
| [FE/src/components/CourseCard.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/CourseCard.tsx) | 🟢 **[TẠO MỚI]** | Cải tiến UI Card bài học với hiệu ứng hover nâng card, bo góc 18px, căn chỉnh lề thoáng đẹp. |
| [FE/src/components/LessonSidebar.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/LessonSidebar.tsx) | 🟢 **[TẠO MỚI]** | Sidebar danh sách bài học hỗ trợ chuyển bài tức thì. |
| [FE/src/components/ResponsiveGuideModal.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ResponsiveGuideModal.tsx) | 🟢 **[TẠO MỚI]** | Modal hướng dẫn chi tiết các bước chụp ảnh màn hình Responsive bằng Chrome DevTools. |
| [FE/src/components/Header.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/Header.tsx) | 🟢 **[TẠO MỚI]** | Thanh navigation header hỗ trợ Mobile Drawer, Theme Switcher và Link menu. |
| [FE/src/components/Footer.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/Footer.tsx) | 🟢 **[TẠO MỚI]** | Footer bản quyền CyberSoft Academy chuẩn WCAG. |
| [FE/src/pages/CourseCatalogPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/CourseCatalogPage.tsx) | 🟢 **[TẠO MỚI]** | Làm gọn hero banner, cải tiến bố cục ô tìm kiếm & grid thẻ bài học. |
| [FE/src/pages/LessonDetailPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/LessonDetailPage.tsx) | 🟢 **[TẠO MỚI]** | Bố trí lại khung video & sidebar cân đối trên desktop, tự động cập nhật iframe khi chuyển bài học. |
| [FE/src/App.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/App.tsx) | 🟡 **[CHỈNH SỬA]** | Kết nối router state điều hướng giữa Catalog, Detail, Theme toggle và Modal. |
| [FE/src/main.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/main.tsx) | 🟡 **[CHỈNH SỬA]** | Nạp stylesheet chính `main.css` vào ứng dụng React. |
| [AI_WORKLOG.md](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/AI_WORKLOG.md) | 🟡 **[CHỈNH SỬA]** | Nhật ký ghi nhận yêu cầu và danh sách tệp công việc Ngày 05. |

*(Ghi chú: Nếu có các prompt tiếp theo yêu cầu chỉnh sửa hoặc thêm file trong ngày, thông tin sẽ tiếp tục được cập nhật bổ sung tại bảng này).*
