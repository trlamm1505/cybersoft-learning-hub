# AI Work Log — 2026-09-08 (Ngày 10 - Teacher Authoring Tool v0)

*File nhật ký theo dõi các prompt của người dùng và các thay đổi file tương ứng cho Ngày 10.*

---

## Nhật ký công việc

### Prompt 1
> "Bạn là một Senior Backend Developer phụ trách module "Teacher Authoring Tool" (Ngày 10) trong dự án NestJS & MongoDB ("Learning & Contest Hub"). Hãy viết mã nguồn chi tiết cho các yêu cầu sau:
> 1. Thiết kế Schema & API Quản lý Bài học (Courses/Lessons/Exercises):
> - Tạo Mongoose Schema hỗ trợ cả bài trắc nghiệm (quiz) và bài lập trình (coding). Thêm trường trạng thái `status` phân định rõ ràng giữa `draft` (Bản nháp) và `published` (Đã xuất bản).
> - Xây dựng API `POST /lessons/create` hoặc `PUT /lessons/:id` cho phép giảng viên tạo/cập nhật nội dung bài học.
> 2. Business Logic & Điều kiện nghiệm thu:
> - Viết middleware hoặc logic validate schema: Chặn yêu cầu đổi trạng thái từ `draft` sang `published` nếu bài học/bài tập thiếu chuẩn đầu ra (`learningOutcome`) hoặc thiếu bài kiểm tra (`test`).
> - Xây dựng API Import/Export gói dữ liệu bài học dưới dạng định dạng JSON (`GET /lessons/export/:id` và `POST /lessons/import`).
> Hãy cung cấp mã nguồn NestJS (Controller, Service, Schema) hoàn chỉnh, chuẩn bảo mật và xử lý ngoại lệ tốt."

**Thời gian:** 2026-09-08 08:39:21

**Các file đã tạo / cập nhật / xóa:**

#### File Tạo Mới [NEW]
1. [lesson.schema.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/schemas/lesson.schema.ts)
   - Định nghĩa Mongoose Schema `Lesson` (`LessonDocument`) hỗ trợ loại hình `coding` và `quiz`.
   - Lưu trữ các trường: `title`, `slug`, `type`, `status` (`draft` | `published`), `learningOutcome`, `content`, `starterCode`, `solutionCode`, `difficulty`, `points`, `authorId`, `testCases`, `quizQuestions`.
2. [create-lesson.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/dto/create-lesson.dto.ts)
   - Class DTO định nghĩa cấu trúc dữ liệu tạo mới bài học.
3. [update-lesson.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/dto/update-lesson.dto.ts)
   - Class DTO định nghĩa cấu trúc dữ liệu cập nhật thông tin bài học.
4. [import-lesson.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/dto/import-lesson.dto.ts)
   - Class DTO định nghĩa cấu trúc payload import gói JSON bài học.
5. [authoring.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.service.ts)
   - Chứa Business Logic:
     - `validatePublicationEligibility`: Kiểm tra điều kiện xuất bản bài học. Bắt buộc bài học xuất bản phải có `learningOutcome` không rỗng và chứa ít nhất 1 bài kiểm tra hợp lệ (`testCases` với bài coding, `quizQuestions` có đáp án đúng với bài quiz). Ngược lại ném `BadRequestException`.
     - `createLesson` & `updateLesson`: Quản lý bài học bản nháp và chuyển đổi trạng thái sang đã xuất bản.
     - `exportLessonJson`: Xuất dữ liệu bài học thành gói JSON định dạng version 1.0.
     - `importLessonJson`: Đọc gói JSON và khởi tạo bài học mới.
6. [authoring.controller.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.controller.ts)
   - REST Controller định nghĩa 6 API endpoints dưới prefix `/api/authoring/lessons`:
     - `POST /api/authoring/lessons/create`: Tạo bài học mới.
     - `PUT /api/authoring/lessons/:id`: Cập nhật nội dung bài học.
     - `GET /api/authoring/lessons`: Lấy danh sách tất cả bài học.
     - `GET /api/authoring/lessons/:id`: Lấy chi tiết 1 bài học theo ID.
     - `GET /api/authoring/lessons/export/:id`: Xuất bài học ra gói JSON.
     - `POST /api/authoring/lessons/import`: Import bài học từ gói JSON.
7. [authoring.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.module.ts)
   - Đăng ký NestJS Module cho Teacher Authoring Tool.
8. [authoring.service.spec.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.service.spec.ts)
   - 8 unit tests kiểm tra toàn bộ logic validate điều kiện xuất bản bài học, tạo bản nháp, xuất gói JSON và xử lý ngoại lệ.

#### File Chỉnh Sửa [MODIFY]
1. [database.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/database.module.ts)
   - Đăng ký `Lesson` Mongoose Schema vào `MongooseModule.forFeature`.
2. [app.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/app.module.ts)
   - Đăng ký `AuthoringModule` vào danh sách `imports` của root module `AppModule`.

---

### Prompt 2
> "Bạn là một Frontend Developer phụ trách giao diện quản trị của Ngày 10 trong dự án React & Tailwind CSS:
> 1. Nút chuyển đổi giao diện nhanh (Role Switcher):
> - Tạo một thanh toggle hoặc nút bấm trên header để chuyển đổi mượt mà qua lại giữa 2 góc nhìn: "Giao diện Học viên (Student View)" và "Giao diện Quản trị Giảng viên (Teacher Authoring)".
> 2. Xây dựng giao diện Teacher Authoring Tool v0:
> - Thiết kế một Form quản trị trực quan để giảng viên tạo/chỉnh sửa nội dung bài học (hỗ trợ nhập liệu cho cả trắc nghiệm và bài lập trình coding).
> - Thêm cơ chế Schema validation trên giao diện: Cảnh báo hoặc khóa nút "Publish" nếu giảng viên chưa điền đủ chuẩn đầu ra (`learning outcome`) hoặc bài test.
> - Tích hợp chế độ "Preview Learner View" giúp giảng viên xem trước giao diện hiển thị thực tế đối với học viên.
> - Thêm nút tính năng Import/Export file JSON cấu hình bài học.
> Hãy cung cấp mã nguồn component React chi tiết, state quản lý rõ ràng để tôi tích hợp trực tiếp vào dự án."

**Thời gian:** 2026-09-08 08:51:12

**Các file đã tạo / cập nhật / xóa:**

#### File Tạo Mới [NEW]
1. [authoring.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/types/authoring.ts)
   - Định nghĩa TypeScript interfaces `LessonAuthoring`, `TestCase`, `QuizQuestion`, `QuizOption`, `ImportLessonPayload`.
2. [authoringApi.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/axios/authoringApi.ts)
   - Axios API client thực hiện gọi 6 REST API endpoints từ NestJS backend.
3. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
   - Component trang quản trị dành cho giảng viên:
     - Form thiết kế bài học linh hoạt cho cả bài Lập trình (`coding`) và Trắc nghiệm (`quiz`).
     - Tự động sinh `slug` từ tiêu đề bài học.
     - **Schema Validation Real-time Guard**: Banner kiểm tra trực tiếp và hiển thị cảnh báo đỏ/xanh. Tự động khóa / disable nút `Publish` nếu thiếu `learningOutcome` hoặc chưa có ít nhất 1 bài test hợp lệ.
     - **Chế độ Preview Learner View**: Modal xem trước 100% giao diện thực tế đối với học viên trước khi xuất bản.
     - **Tính năng Import / Export JSON**: Cho phép tải xuống file cấu hình `.json` bài học hoặc đọc file `.json` để nạp dữ liệu vào form.

#### File Chỉnh Sửa [MODIFY]
1. [Header.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/Header.tsx)
   - Tích hợp **Role Switcher Pill Toggle** (`🎓 Student` vs `👨‍🏫 Teacher`) trên thanh điều hướng Header.
   - Thêm nút menu `🛠️ Authoring Tool` trong chế độ Teacher dành cho cả giao diện máy tính và mobile.
2. [App.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/App.tsx)
   - Đăng ký route điều hướng `/authoring` trỏ đến `TeacherAuthoringPage`.
   - Lưu trữ và đồng bộ trạng thái `userRole` vào `localStorage`.

---

### Prompt 3
> "sao chỗ thi trắc nghiệm này ko cho chọn bài để thi vậy và sao teacher đã thêm bài mới mà ko thấy hiển thị ra"

**Thời gian:** 2026-09-08 08:56:56

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [QuizTakingPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/QuizTakingPage.tsx)
   - Bổ sung **Giao diện Chọn Bài thi Trắc nghiệm (Quiz Topic Selector Grid)** cho phép học viên lựa chọn đề thi trắc nghiệm trước khi bấm bắt đầu.
   - Hỗ trợ hiển thị các đề thi trắc nghiệm do Giảng viên vừa thiết kế (`👨‍🏫 Giảng viên tạo`) bên cạnh các đề thi mẫu của hệ thống (`⚡ Đề Hệ thống`).
   - Tự động nạp động danh sách câu hỏi `quizQuestions` và xử lý tính điểm, giải thích cho các bài trắc nghiệm của Giảng viên.
2. [App.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/App.tsx)
   - Tự động gọi API `authoringApi.getLessons()` khi ứng dụng khởi chạy để tải danh sách các bài học do Giảng viên đã tạo/xuất bản từ Backend (kèm bộ nhớ đệm `localStorage`).
   - Đồng bộ động danh sách bài học của Giảng viên vào toàn bộ hệ thống: **Danh mục khóa học (`CourseCatalogPage`)**, **Chi tiết bài học (`LessonDetailPage`)**, **Code Playground**, và **Thi Trắc Nghiệm (`QuizTakingPage`)**.
3. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
   - Tích hợp callback `onLessonSaved` giúp tự động làm mới và cập nhật bài học mới thêm vào state chung của ứng dụng ngay sau khi Giảng viên lưu nháp hoặc xuất bản bài học.

---

### Prompt 4
> "nếu giáo viên thêm bài lâpj trình thì sẽ lưu vào database và hiển thị ra bài tập ở đây cho sinh viên xem còn nếu bài trắc nghiệm thì sẽ hiển thị bên phần thi trắc nghiệm và chỗ teacher nhập form thêm bài lập trình phải có tất cả các trường cần thiết và thêm cả 3 phần gợi ý này nữa"

**Thời gian:** 2026-09-08 09:01:42

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [lesson.schema.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/schemas/lesson.schema.ts)
   - Bổ sung Mongoose Sub-Schema `LessonHints` (`hint1`, `hint2`, `hint3`) hỗ trợ lưu trữ 3 tầng gợi ý vào MongoDB database.
2. [create-lesson.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/dto/create-lesson.dto.ts) & [update-lesson.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/dto/update-lesson.dto.ts)
   - Thêm DTO class `LessonHintsDto` cho phép truyền payload 3 tầng gợi ý lên backend API.
3. [authoring.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/types/authoring.ts)
   - Thêm interface `LessonHints` trong TypeScript Frontend.
4. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
   - Bổ sung **Phần 4: Thiết lập 3 Tầng Gợi Ý (Hint Engine)** trong Form bài lập trình coding với đầy đủ 3 ô nhập liệu (Tầng 1: Khái niệm & Tư duy, Tầng 2: Chiến lược thuật toán, Tầng 3: Code mẫu Python kèm nút nạp nhanh từ Solution Code).
5. [HintPanel.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/HintPanel.tsx)
   - Hỗ trợ nhận prop `customHints` truyền trực tiếp 3 tầng gợi ý do Giảng viên thiết lập khi học viên thực hành.
6. [CodePlaygroundPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/CodePlaygroundPage.tsx)
   - Hiển thị danh sách các bài tập lập trình do Giảng viên tạo (`👨‍🏫 Bài tập Giảng viên`) ngay trong bộ chọn bài tập Code Playground. Tự động nạp đề bài, starter code, test cases và 3 tầng gợi ý tương ứng.

---

### Prompt 5
> "teacher có thể chọn lại bài để chỉnh sửa thông tin trắc nghiệm hoặc lập trình hoặc có thể xóa các bài đi"

**Thời gian:** 2026-09-08 09:06:55

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [authoring.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.service.ts)
   - Bổ sung phương thức `deleteLesson(id)` xóa bài học khỏi cơ sở dữ liệu MongoDB.
2. [authoring.controller.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.controller.ts)
   - Thêm REST API endpoint `@Delete('/api/authoring/lessons/:id')`.
3. [authoringApi.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/axios/authoringApi.ts)
   - Thêm phương thức `authoringApi.deleteLesson(id)`.
4. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
   - Bổ sung thanh **Quản lý & Chọn bài học để Chỉnh sửa / Xóa**:
     - Menu thả xuống cho phép Giảng viên chọn lại bất kỳ bài học nào đã tạo (Coding hoặc Quiz) để nạp dữ liệu lên Form và cập nhật.
     - Nút `➕ Bài tập mới` để reset Form nhập bài tập mới.
     - Nút `🗑️ Xóa bài này` để xóa bài tập khỏi cơ sở dữ liệu.
5. [App.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/App.tsx)
   - Tích hợp callback `handleLessonDeleted` tự động xóa bài học khỏi state hệ thống khi Giảng viên bấm xóa.

---

### Prompt 6: Tùy ý chọn, chỉnh sửa và xóa tất cả các bài tập trong hệ thống (Coding exercises & Quiz topics)
- **User Prompt**: "sao có rất nhiều bài mà teacher lại chỉ có thể chọn 4 vậy teacher sẽ có thể tùy ý chỉnh sửa tất cả các bài"
- **Files Modified**:
  1. [authoring.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.service.ts)
     - Khởi tạo `OnModuleInit` tự động nạp (seed) toàn bộ 10 bài tập lập trình Python hệ thống (`INITIAL_EXERCISES` + `INITIAL_HINTS`) cùng các bộ đề trắc nghiệm hệ thống (`SYSTEM_QUIZZES`) vào MongoDB collection `lessons` nếu chưa tồn tại.
     - Cho phép Giảng viên quản lý, xem, tùy ý chọn, chỉnh sửa nội dung/3-tier hints và xóa tất cả các bài tập hệ thống hoặc do Giảng viên tạo.
  2. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
     - Cập nhật menu chọn bài học hiển thị đầy đủ tất cả các bài học/bài tập trong cơ sở dữ liệu (`existingLessons.length` bài).
     - Thêm tùy chọn `➕ Tạo bài học mới` và hỗ trợ nạp dữ liệu bài tập bất kỳ lên form để chỉnh sửa/xóa.

---

### Prompt 8: Loại bỏ icon/emoji tiền tố và khử trùng lặp bài tập
- **User Prompt**: "bỏ mấy icon này đi cho nó đồng bộ"
- **Files Modified**:
  1. [CodePlaygroundPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/CodePlaygroundPage.tsx)
     - Loại bỏ các icon/emoji tiền tố như `👨‍🏫`, `🧑‍💻`, `📝` khỏi tiêu đề bài tập.
     - Áp dụng `useMemo` và `Map<string, ExerciseListItem>` để khử trùng lặp bài tập theo `slug`, đảm bảo mỗi bài tập chỉ xuất hiện duy nhất 1 lần trong menu chọn của Code Playground.
  2. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
     - Chuẩn hóa định dạng danh sách dropdown chọn bài học: sử dụng nhãn text đồng nhất `[Coding]` / `[Quiz]` thay cho icon emoji.

---

### Prompt 9: Loại bỏ nhãn "Giảng viên tạo" trên các thẻ bài thi trắc nghiệm
- **User Prompt**: "bỏ chữ giảng viên tạo đi"
- **Files Modified**:
  1. [QuizTakingPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/QuizTakingPage.tsx)
     - Loại bỏ nhãn badge `👨‍🏫 Giảng viên tạo` và `⚡ Đề Hệ thống` trên tất cả các thẻ bài thi trắc nghiệm.
     - Thay thế bằng nhãn danh mục chuyên đề (`FULLSTACK WEB`, `PYTHON`, `TRẮC NGHIỆM`) với kiểu dáng đồng nhất và chuyên nghiệp.

---

### Prompt 10: Tách biệt tuyệt đối dữ liệu JSON Xuất/Nhập và Lưu trữ giữa Trắc nghiệm (Quiz) và Lập trình (Coding)
- **User Prompt**: "bài trắc nghiệm và tự luận là riêng biệt khi xuất json hoặc thêm bằng json thì chỉ có riêng trắc nghiệm hoặc lập trình thôi ko gọp chugn"
- **Files Modified**:
  1. [authoring.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.service.ts)
     - Bổ sung hàm `sanitizePayloadByType`: Nếu là bài `coding` thì dọn dẹp `quizQuestions = []`, nếu là bài `quiz` thì dọn dẹp `starterCode`, `solutionCode`, `content`, `testCases`, `hints`.
     - Cập nhật `exportLessonJson`: File JSON xuất ra của bài `coding` chỉ chứa các trường mã nguồn, test cases & hints. File JSON của bài `quiz` chỉ chứa danh sách câu hỏi `quizQuestions`.
     - Cập nhật `importLessonJson`: Tự động phân loại và chỉ nạp đúng các trường thuộc loại bài tương ứng.
  2. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
     - Cập nhật `handleExportJson` và `handleImportJson` trên giao diện Frontend để tạo/đọc file JSON tách biệt 100% theo loại bài (`lesson-coding-*.json` vs `lesson-quiz-*.json`).
     - Tự động làm sạch Form và các trường không liên quan khi Giảng viên chuyển đổi qua lại giữa nút `Bài Lập trình (Coding)` và `Bài Trắc nghiệm (Quiz)`.

---

### Prompt 11: Cho phép Giảng viên chọn Lập trình hay Trắc nghiệm trước để lọc danh sách bài học tương ứng
- **User Prompt**: "chỗ teacher này sẽ cho người dùng chọn trước là bài lập trình hay quiz trước và sẽ lấy danh sách theo đó luôn"
- **Files Modified**:
  1. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
     - Bổ sung thanh lọc 2 bước (**Bước 1: Chọn loại bài học trước** `🧑‍💻 Bài Lập trình` / `📝 Bài Trắc nghiệm` / `Tất cả`).
     - Tự động lọc và cập nhật danh sách bài học tại **Bước 2 (Dropdown selector)** chỉ hiển thị đúng các bài học thuộc loại đã chọn, giúp Giảng viên quản lý nhanh chóng và trực quan.

---

### Prompt 12: Tự động đồng bộ hai chiều (2-way binding) giữa Bộ lọc loại bài học ở Bước 1 và Form nhập liệu phía dưới
- **User Prompt**: "ở trên đã chọn loại bài lập trình hoặc quiz thì ở dưới sẽ ra form theo trên ko cần chọn lại nữa"
- **Files Modified**:
  1. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
     - Đồng bộ 2 chiều tức thì: Khi Giảng viên chọn `🧑‍💻 Bài Lập trình` hoặc `📝 Bài Trắc nghiệm` ở **Bước 1**, Form nhập liệu phía dưới tự động cập nhật đúng loại bài học (`formData.type`) và chuyển đổi giao diện Form tương ứng mà không cần Giảng viên phải thao tác chọn lại.
     - Ngược lại, khi Giảng viên bấm thay đổi loại bài trong Form hoặc nạp bài từ Dropdown, bộ lọc ở **Bước 1** cũng tự động nhảy theo loại tương ứng.

---

### Prompt 13: Loại bỏ bộ nút chọn lại "Loại bài học" trùng lặp tại Phần 1 của Form
- **User Prompt**: "chỗ này ko cần chọn lại nữa"
- **Files Modified**:
  1. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
     - Loại bỏ nút chuyển đổi Loại bài học dư thừa trong **Phần 1: Thông tin cơ bản bài học**.
     - Thay thế bằng nhãn Badge tĩnh thông minh hiển thị tự động Loại bài học hiện tại (ví dụ: `🧑‍💻 Bài Lập trình (Coding)` hoặc `📝 Bài Trắc nghiệm (Quiz)`) được thừa hưởng từ lựa chọn ở **Bước 1**, giúp giao diện form tối gọn, tinh tế và không gây nhầm lẫn.

---

### Prompt 14: Đồng bộ 100% số lượng bài giữa Teacher Authoring và các trang Thi trắc nghiệm / Thi tự luận
- **User Prompt**: "sao bên teacher có 1 bài mà ở thi trắc nghiệm hiển thị tới 2 vậy và kiểm tra luôn thi tự luận"
- **Files Modified**:
  1. [authoring.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/authoring/authoring.service.ts)
     - Cập nhật hàm `seedSystemLessons()` trong NestJS Backend để khi khởi tạo database MongoDB, bài `python-basic` nếu đã tồn tại nhưng chưa có `type: 'quiz'` hoặc thiếu danh sách câu hỏi trắc nghiệm `quizQuestions` sẽ được tự động cập nhật lên MongoDB thành `type: 'quiz'` cùng toàn bộ bộ câu hỏi trắc nghiệm tương ứng.
     - Đảm bảo trong MongoDB có đầy đủ các bài thi trắc nghiệm mặc định để bên Teacher Authoring hiển thị đúng `Bài Trắc nghiệm (2)`.
  2. [QuizTakingPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/QuizTakingPage.tsx)
     - Cập nhật `availableQuizzes` và `teacherQuizzes`: Khi dữ liệu `teacherLessons` từ Backend API được nạp vào, `availableQuizzes` sẽ ưu tiên sử dụng danh sách bài trắc nghiệm thực tế từ Teacher Authoring/MongoDB làm nguồn dữ liệu chính.
     - Khi Giảng viên thêm/sửa/xóa bài trắc nghiệm ở Teacher Authoring, trang Thi Trắc Nghiệm của Học viên sẽ lập tức phản ánh chính xác 100% (khớp số lượng bài 1-1 realtime).
  3. [CodePlaygroundPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/CodePlaygroundPage.tsx)
     - Cập nhật `combinedExercises`: Ưu tiên sử dụng trực tiếp các bài tập lập trình `teacherCodingItems` từ Teacher Authoring/MongoDB khi có dữ liệu.
     - Đảm bảo khi Giảng viên thêm, chỉnh sửa hoặc xóa bất kỳ bài thi tự luận/lập trình nào ở phía Teacher Authoring thì danh sách bài tập ở trang Thi Tự luận / Code Playground cũng sẽ đồng bộ 100% ngay lập tức.







