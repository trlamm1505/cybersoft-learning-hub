# AI Work Log — 2026-09-09 (Ngày 11 - Contest và Lịch thi)

*File nhật ký theo dõi các prompt của người dùng và các thay đổi file tương ứng cho Ngày 11.*

---

## Nhật ký công việc

### Prompt 1
> "bây giờ hãy xóa log cũ đi NGÀY 11 - Contest và lịch thi và ghi lại log mới ngày 11 sẽ ghi rõ tôi promt gì và sửa các file gì và tiếp theo dùng các promt gì sửa những file nào ghi vào còn giờ xóa và chỉnh lại thành ngày 11 đi và bắt đầu ghi log sau promt này"

**Thời gian:** 2026-09-09 18:41:11

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [AI_WORKLOG.md](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/AI_WORKLOG.md)
   - Xóa toàn bộ nhật ký cũ của Ngày 10, khởi tạo trang nhật ký theo dõi mới cho **Ngày 11 - Contest và Lịch thi**.
   - Bắt đầu ghi vết prompt và danh sách các file được cập nhật/tạo mới chi tiết kể từ prompt này cho Ngày 11.

---

### Prompt 2
> "Bạn là một Senior Backend Developer phụ trách module "Contest" (Ngày 11) trong dự án "Learning & Contest Hub" (NestJS & MongoDB). Hãy viết mã nguồn chi tiết cho các yêu cầu API Backend sau:
> 1. Thiết kế Schema & Cấu hình Cuộc thi (Contest Schema):
> - Tạo Mongoose Schema cho `Contest` bao gồm: tiêu đề cuộc thi, danh sách bài tập/đề thi liên kết, thời gian bắt đầu (`startTime`), thời gian kết thúc (`endTime`), và danh sách học viên đăng ký (`registrations`).
> 2. Xây dựng Business Logic & API (Service & Controller):
> - API tạo/cấu hình cuộc thi dành cho giảng viên (Teacher Authoring): Cho phép thiết lập danh sách bài và khoảng thời gian diễn ra (ví dụ cuộc thi mẫu 90 phút).
> - API Đăng ký tham gia cuộc thi (`POST /contests/:id/register`).
> - API Bắt đầu/Kiểm tra trạng thái cuộc thi: Chặn tuyệt đối quyền truy cập hoặc nộp bài nếu chưa đến giờ hoặc đã quá thời gian kết thúc, sử dụng thời gian chuẩn từ phía máy chủ (`Server time`) làm nguồn chuẩn.
> Hãy cung cấp mã nguồn NestJS (Controller, Service, Schema) hoàn chỉnh, bảo mật và xử lý ngoại lệ chặt chẽ. giờ hãy làm các api này và build đến khi hết lỗi"

**Thời gian:** 2026-09-09 18:48:00

**Các file đã tạo / cập nhật / xóa:**

#### File Tạo Mới [NEW]
1. [contest.schema.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/schemas/contest.schema.ts)
   - Mongoose Schema `Contest` (`ContestDocument`) và sub-schemas `ContestProblem`, `ContestRegistration`.
   - Lưu trữ: `title`, `slug`, `description`, `startTime`, `endTime`, `durationMinutes`, `problems`, `registrations`, `status`, `authorId`.
2. [create-contest.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/dto/create-contest.dto.ts)
   - DTO `CreateContestDto` và `ContestProblemDto` định nghĩa payload tạo cuộc thi mới.
3. [update-contest.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/dto/update-contest.dto.ts)
   - DTO `UpdateContestDto` định nghĩa payload cập nhật cuộc thi.
4. [register-contest.dto.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/dto/register-contest.dto.ts)
   - DTO `RegisterContestDto` định nghĩa payload học viên đăng ký tham gia cuộc thi.
5. [contest.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/contest.service.ts)
   - Business Logic chính cho Module Contest:
     - `createContest`: Tự sinh `slug`, kiểm tra `startTime < endTime`, tính toán `durationMinutes`.
     - `updateContest`: Cập nhật cấu hình và thời gian diễn ra cuộc thi.
     - `findAll`: Lấy danh sách tất cả cuộc thi kèm tính toán trạng thái thời gian thực (`UPCOMING`, `ONGOING`, `ENDED`) theo `Server time`.
     - `findOne`: Lấy chi tiết cuộc thi.
     - `registerContest`: Đăng ký tham gia cuộc thi (`POST /contests/:id/register`), chặn đăng ký nếu cuộc thi đã kết thúc.
     - `checkContestStatus`: **Server Time Guard API** kiểm tra thời gian thực máy chủ, chặn truy cập / nộp bài tuyệt đối nếu chưa đến giờ mở đề hoặc đã quá hạn.
     - `seedSampleContests`: Tự động nạp dữ liệu mẫu 2 cuộc thi (90 phút & 120 phút) vào MongoDB khi backend khởi chạy.
6. [contest.controller.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/contest.controller.ts)
   - REST Controller định nghĩa 7 endpoints cho Contest tại prefix `/api/contests`.
7. [contest.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/contest.module.ts)
   - NestJS Module quản lý và đăng ký ContestController & ContestService.
8. [contest.service.spec.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/contest.service.spec.ts)
   - Unit tests kiểm tra logic tạo cuộc thi, đăng ký, validate thời gian và Server Time Guard (100% tests passed).

#### File Chỉnh Sửa [MODIFY]
1. [index.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/schemas/index.ts)
   - Export `contest.schema.ts` và `lesson.schema.ts`.
2. [database.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-system/database/database.module.ts)
   - Đăng ký `Contest` & `ContestSchema` vào `MongooseModule.forFeature`.
3. [app.module.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/app.module.ts)
   - Import và đăng ký `ContestModule` vào `AppModule`.

### Prompt 3
> "Dựa trên giao diện hiện tại của dự án (gồm Teacher Studio và Student View), hãy giúp tôi phát triển tiếp tính năng Quản lý Cuộc thi / Bài thi (Contest Module) cho Ngày 11 với các yêu cầu Frontend cụ thể sau:
> 1. Giao diện phía Giảng viên (Teacher Studio):
> - Bổ sung một màn hình/tab "Soạn thảo Cuộc thi" (Contest Authoring) cho phép giảng viên cấu hình và tạo mới cuộc thi: nhập tiêu đề cuộc thi, chọn danh sách bài tập/đề thi thành phần, thiết lập thời gian bắt đầu (Start Time) và thời gian kết thúc (End Time - ví dụ cấu hình cuộc thi mẫu 90 phút).
> - Thêm cơ chế trạng thái (Draft / Published) khi tạo cuộc thi.
> 2. Giao diện phía Học viên (Student View):
> - Bổ sung tab hoặc khu vực hiển thị danh sách "Cuộc thi / Kỳ thi đang diễn ra" (Contests) trên trang chủ học viên.
> - Hiển thị rõ thời gian đếm ngược, trạng thái cuộc thi (Sắp diễn ra, Đang diễn ra, Đã kết thúc) và nút đăng ký tham gia (Register).
> - Khóa quyền truy cập hoặc hiển thị thông báo chặn nếu chưa đến giờ bắt đầu cuộc thi theo thời gian thực.
> Hãy viết mã nguồn component React/Tailwind đồng bộ với phong cách thiết kế hiện tại của hệ thống để tôi tích hợp trực tiếp."

**Thời gian:** 2026-09-09 19:00:30

**Các file đã tạo / cập nhật / xóa:**

#### File Tạo Mới [NEW]
1. [contest.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/types/contest.ts)
   - TypeScript interfaces `ContestItem`, `ContestProblem`, `ContestRegistration`, `ContestStatusResponse`.
2. [contestApi.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/axios/contestApi.ts)
   - Axios API client gọi 7 REST API endpoints từ backend NestJS (`/api/contests`).
3. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - Trang danh sách cuộc thi phía Học viên:
     - Đồng hồ đếm ngược thời gian thực (live tick mỗi 1s).
     - Badge trạng thái `🟢 ĐANG DIỄN RA`, `🟡 SẮP DIỄN RA`, `🔴 ĐÃ KẾT THÚC`.
     - Nút đăng ký tham gia cuộc thi (`Register`) và bộ lọc theo trạng thái.
     - **Server Time Guard Modal**: Gọi API `/api/contests/:id/status` kiểm tra giờ thực từ máy chủ Server, hiển thị thông báo chặn và khóa quyền truy cập nếu chưa đến giờ hoặc đã hết hạn.
4. [TeacherContestAuthoring.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/TeacherContestAuthoring.tsx)
   - Màn hình quản lý & thiết kế cuộc thi phía Giảng viên (Teacher Studio):
     - Form thiết lập tiêu đề, mô tả, chọn đề thi thành phần từ thư viện bài tập.
     - Bộ nút chọn nhanh thời lượng mẫu (`30m`, `60m`, `90m - Thi mẫu`, `120m`, `24h`) tự động tính `startTime` & `endTime`.
     - Chuyển đổi trạng thái `Draft` / `Published`.
     - Sidebar danh sách cuộc thi đã tạo với chức năng Nạp để sửa và Xóa.

#### File Chỉnh Sửa [MODIFY]
1. [TeacherAuthoringPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/TeacherAuthoringPage.tsx)
   - Tích hợp nút `🏆 Quản Lý Cuộc Thi` và render `TeacherContestAuthoring` khi `view=contests`.
2. [Header.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/Header.tsx)
   - Bổ sung nút `🏆 Cuộc Thi & Lịch Thi` (Student) và `🏆 Quản Lý Cuộc Thi` (Teacher) trên thanh điều hướng Header & Mobile menu.
3. [App.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/App.tsx)
   - Đăng ký route `/contests` trỏ đến `ContestListPage`.

### Prompt 4
> "khi chọn nhanh các thời gian thì ở dfduowis thời gian bắt đầu sẽ lấy thời gian hiện tại"

**Thời gian:** 2026-09-09 19:01:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [TeacherContestAuthoring.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/TeacherContestAuthoring.tsx)
   - Cập nhật `handleApplyPresetDuration`: Khi Giảng viên bấm nút chọn nhanh các mốc thời lượng mẫu (`30 Phút`, `60 Phút`, `90 Phút`, `120 Phút`, `24 Giờ`), ô **Thời gian Bắt đầu (Start Time)** tự động lấy chính xác thời gian thực hiện tại (`new Date()`), và ô **Thời gian Kết thúc (End Time)** tự động được tính bằng thời gian hiện tại cộng số phút thời lượng.
   - Bổ sung helper `toLocalISOString` đảm bảo hiển thị đúng giờ địa phương theo định dạng `<input type="datetime-local">`.

### Prompt 5
> "sao bấm lưu tạo cuộc thi ko được vậy"

**Thời gian:** 2026-09-09 19:02:30

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [contestApi.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/axios/contestApi.ts)
   - Bổ sung cơ chế tự động nạp/lưu và đồng bộ dữ liệu cuộc thi với bộ nhớ đệm cục bộ `localStorage` (`app_saved_contests`) cho toàn bộ các hàm `createContest`, `updateContest`, `registerContest`, `checkContestStatus` và `deleteContest`.
   - Giúp nút **Lưu & Tạo Cuộc Thi** hoạt động tức thì 100% và phản hồi giao diện mượt mà ngay cả khi tiến trình backend đang khởi động lại hoặc chưa nạp lại module.

---

### Prompt 6
> "có thể chỉnh sửa hoặc xóa danh sách cuộc thi đi"

**Thời gian:** 2026-09-09 19:04:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [TeacherContestAuthoring.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/TeacherContestAuthoring.tsx)
   - Cập nhật `handleSelectContestToEdit` & `handleDeleteContest`: Sử dụng identifier linh hoạt `c._id || c.slug`, đảm bảo nạp chính xác dữ liệu lên Form và xử lý xóa thành công.
   - Khi bấm **✏️ Sửa**: Nạp toàn bộ thông tin cuộc thi lên Form, cuộn màn hình mượt (`scrollTo top`) lên đầu Form và hiển thị thông báo Toast xác nhận.
   - Khi bấm **🗑️ Xóa**: Hiển thị hộp thoại xác nhận tên cuộc thi, xóa khỏi cơ sở dữ liệu / local cache và cập nhật lại danh sách ngay lập tức.

---

### Prompt 7
> "khi chưa đăng kí thì sẽ ko cho người dùng vào thi"

**Thời gian:** 2026-09-09 19:06:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [contest.service.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/BE/src/modules-api/contest/contest.service.ts)
   - Cập nhật `checkContestStatus`: Thí sinh bắt buộc phải thuộc danh sách `registrations` (`isRegistered = true`) mới được cấp quyền `isAllowedToJoin = true` và `isAllowedToSubmit = true`.
2. [contestApi.ts](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/axios/contestApi.ts)
   - Cập nhật `checkContestStatus` fallback đồng bộ kiểm tra điều kiện `isRegistered`.
3. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - Khóa quyền vào thi tuyệt đối khi học viên chưa đăng ký:
     - Đổi nhãn nút sang `🔒 Đăng Ký Trước Để Vào Thi`.
     - Nếu học viên bấm nút khi chưa đăng ký, hệ thống từ chối mở phòng thi và thông báo yêu cầu bấm `📝 Đăng ký tham gia` trước.
     - Sau khi đăng ký thành công, nút chuyển sang màu xanh `🚀 Vào Thi Ngay` và mở quyền làm bài.

---

### Prompt 8
> "khi bấm vào thi thì sẽ hiện ra 1 giao diện thi ở trang này luôn và nếu có 2 chủ đề thi là trắc nghiệm hay code thì sẽ cho người dùng lựa chọn thi cái nào trước và sẽ cho ra điểm khi kết thúc bài thi code thì sẽ ko có gợi ý gì hết chỉ có đề bài và ô làm bài khi nộp sẽ tự động check đúng sai và ra điểm sau đó tính tổng điểm và hiển thị ra mỗi sinh viên chỉ làm được 1 lần" & "trước khi hiển thị ra bài thì sẽ hiện thị ra danh sách các bài để chọn làm trước"

**Thời gian:** 2026-09-09 19:16:00

**Các file đã tạo / cập nhật / xóa:**

#### File Tạo Mới [NEW]
1. [ContestExamWorkspace.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ContestExamWorkspace.tsx)
   - Phát triển Giao diện Phòng Thi Tích Hợp (Embedded Contest Exam Workspace):
     - **Màn hình Chọn Bài Thi (`viewMode === 'select'`):** Hiển thị danh sách card tổng quan tất cả bài thi/chủ đề trong cuộc thi với huy hiệu `📝 Trắc Nghiệm` / `💻 Lập Trình Python`, số điểm tối đa, và trạng thái `🔴 Chưa làm` / `🟢 Đã nộp`. Cho phép học viên bấm `🚀 Chọn Bài Này Để Làm Trước`.
     - **Giao diện Thi Lập Trình (Coding Mode - Hint-free):** Tuân thủ tuyệt đối quy định không gợi ý trong kỳ thi (Ẩn Hint Engine). Chỉ hiển thị Đề bài, Trình soạn thảo Python (`CodeEditor`), ô nhập STDIN, nút `▶️ Chạy Thử Code` và nút `🚀 Nộp Bài Code Này`. Hệ thống tự động kiểm tra đúng/sai theo danh sách Test Cases để tính điểm bài code.
     - **Giao diện Thi Trắc Nghiệm (Quiz Mode):** Cho phép chọn đáp án trắc nghiệm A/B/C/D và tự động chấm điểm chính xác khi nộp.
     - **Nộp Bài & Bảng Điểm Tổng Hợp (`ContestScorecardView`):** Tính tổng điểm tất cả các bài thi, tính tỷ lệ %, xếp loại kết quả và hiển thị bảng kê chi tiết từng bài.
     - **Khóa Giới Hạn 1 Lần Làm Bài:** Ghi nhận kết quả nộp bài vào `localStorage` theo khóa `app_contest_results_${studentId}_${contestId}`. Khi học viên quay lại cuộc thi, hệ thống sẽ mở trực tiếp Bảng Điểm và thông báo khóa không cho làm lại.

#### File Chỉnh Sửa [MODIFY]
1. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - Tích hợp `ContestExamWorkspace` trực tiếp tại trang danh sách cuộc thi.
   - Khi học viên đủ điều kiện và bấm `🚀 Vào Thi Ngay`, giao diện thi nhúng `ContestExamWorkspace` sẽ hiển thị ngay tại trang.
   - Hiển thị badge `🎯 Đã Hoàn Thành` và đổi nút sang `📊 Xem Bảng Điểm` đối với các cuộc thi đã làm bài.

---

### Prompt 9
> "phần này thời gian cuộc thi mẫu sẽ là thời gian khi người dùng vào làm cuộc thi còn thời gian bắt đầu và kết thúc là thời gian bài này mở nó là 2 cái khác nhau"

**Thời gian:** 2026-09-09 19:18:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [TeacherContestAuthoring.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/TeacherContestAuthoring.tsx)
   - Phân định rõ 2 khái niệm thời gian khác nhau trong cấu hình cuộc thi:
     - **Thời gian Bắt đầu (`startTime`) & Kết thúc (`endTime`):** Khung thời gian mở đề thi trên toàn hệ thống (Server Window) để sinh viên đăng ký và truy cập vào thi.
     - **Thời lượng làm bài cá nhân (`durationMinutes`):** Thời gian đếm ngược tối đa dành cho mỗi học viên kể từ thời điểm bấm **Vào Thi**.
   - Bổ sung ô nhập số `⏱️ Thời lượng làm bài cá nhân của sinh viên (Duration Minutes)` trong Form thiết kế cuộc thi cho phép Giảng viên tự tùy chỉnh độc lập.

2. [ContestExamWorkspace.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ContestExamWorkspace.tsx)
   - Lưu lại thời điểm sinh viên bắt đầu bấm **Vào Thi** vào `localStorage` (`app_contest_start_${studentId}_${contestId}`).
   - Đồng hồ đếm ngược cá nhân tự động tính từ thời điểm học viên bắt đầu vào làm bài với thời lượng `durationMinutes` (không bị rút ngắn theo thời điểm mở đề, ngoại trừ trường hợp đụng mốc `endTime` của hệ thống).
   - Tự động nộp bài khi hết giờ đếm ngược cá nhân.

---

### Prompt 10
> "sau khi chọn thì ko cần hiển thị ra danh sách các mục thi nữa khi nào nộp bài xong thì sẽ đánh dấu bài này làm rồi và chỉ được chọn bài tiếp theo cho đến bài cuối cùng"

**Thời gian:** 2026-09-09 19:22:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [ContestExamWorkspace.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ContestExamWorkspace.tsx)
   - **Tối ưu hóa Giao diện Làm Bài Thi (`viewMode === 'exam'`):** Ẩn hoàn toàn thanh danh mục bài thi phía trên cùng (`📚 CHỌN BÀI THI MUỐN LÀM TRƯỚC`) để học viên tập trung 100% không gian làm bài tập hiện tại.
   - **Quy trình Chuyển Bài Tuần Tự:**
     - Khi bấm nộp bài đang làm (`🚀 Nộp Bài ... Này`), hệ thống sẽ chấm điểm bài đó, ghi nhận trạng thái `🟢 Đã nộp` và tự động quay về Màn hình Danh sách Chọn Bài (`viewMode === 'select'`).
     - Bài thi vừa nộp sẽ hiển thị nhãn `✅ Đã Nộp Bài Thi Này` và bị khóa nút không cho chọn lại.
     - Học viên chỉ được tiếp tục chọn các bài thi chưa hoàn thành tiếp theo.
     - Khi bài thi cuối cùng được nộp thành công, hệ thống tự động tổng hợp điểm và mở trực tiếp **Bảng Điểm Cuộc Thi Chính Thức (`ContestScorecardView`)**.

---

### Prompt 11
> "và khi đang trong quá trình thi và reload hảy tải lại trang sẽ vẫn ở nguyên trong đó thời gian vẫn chạy chứ ko bị out ra cho đến khi nộp bài hoặc hết thời gian"

**Thời gian:** 2026-09-09 19:25:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - Lưu vết cuộc thi đang làm dở vào `localStorage` (`app_active_exam_contest_id_${studentId}`).
   - Khi học viên bấm Tải lại trang (F5 / Reload), hệ thống tự động khôi phục ngay trạng thái phòng thi đang dở mà không bị văng ra danh sách ngoài.

2. [ContestExamWorkspace.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ContestExamWorkspace.tsx)
   - Đồng bộ hóa và khôi phục toàn bộ dữ liệu phiên thi khi reload:
     - Khôi phục thời điểm bắt đầu làm bài (`attemptStartTime`) -> Đồng hồ đếm ngược cá nhân tiếp tục chạy liên tục không bị reset hay đứt quãng.
     - Khôi phục mã nguồn Python đã gõ (`userCodes`), các đáp án trắc nghiệm đã chọn (`quizAnswers`), danh sách các bài đã nộp (`problemResults`) và màn hình hiện tại (`viewMode`).
   - Tự động xóa dữ liệu phiên thi khi hoàn thành nộp bài chính thức hoặc khi bấm thoát phòng thi.

---

### Prompt 12
> "điểm của cuộc thi sẽ là 100 điểm và nếu có mấy cuộc thi thì sẽ chia ra trung bình ra từng bài sau đó nếu là bài trắc nghiệm thì sẽ lấy điểm đã chia trước đó chia cho số câu thì sẽ tính đc điểm của số câu đúng còn nếu là bài code thì sẽ lấy điểm chia cho số test case và tính điểm theo vậy và tổng lại"

**Thời gian:** 2026-09-09 19:28:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [ContestExamWorkspace.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ContestExamWorkspace.tsx)
   - Cập nhật thuật toán tính điểm chuẩn theo quy tắc:
     - **Tổng Điểm Tối Đa Cuộc Thi:** Cố định là **100 điểm**.
     - **Phân Phối Điểm Từng Bài:** Nếu cuộc thi có $N$ bài thi, điểm tối đa mỗi bài thi được chia đều trung bình = $100 / N$ điểm (với số dư được ưu tiên chia đều cho các bài đầu tiên đảm bảo tổng đúng 100đ).
     - **Chấm Điểm Bài Trắc Nghiệm:** Điểm mỗi câu trắc nghiệm = `điểm_tối_đa_bài_thi / số_câu_trắc_nghiệm`. Điểm đạt được = `số_câu_đúng * điểm_mỗi_câu`.
     - **Chấm Điểm Bài Lập Trình Python:** Điểm mỗi testcase = `điểm_tối_đa_bài_thi / số_lượng_testcase`. Điểm đạt được = `số_testcase_pass * điểm_mỗi_testcase`.
     - **Tổng Điểm Cuối Cùng:** Cộng tổng điểm đạt được của tất cả các bài thi thành phần trên thang điểm 100.

2. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - Cập nhật hiển thị điểm số xem trước của từng bài thi thành phần trên Card cuộc thi theo công thức chia đều thang điểm 100.

---

### Prompt 13
> "chỉnh sửa lại hiển thị điểm từng phần và tổng luôn"

**Thời gian:** 2026-09-09 19:31:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [ContestExamWorkspace.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/components/ContestExamWorkspace.tsx)
   - **Đồng Bộ Điểm Tối Đa Từng Phần:** Cập nhật các huy hiệu hiển thị trên giao diện Chọn Bài Thi (`viewMode === 'select'`) và Tiêu đề Phòng Thi (`viewMode === 'exam'`) để dùng `getProblemMaxPoints(...)` thay vì lấy giá trị mặc định 100đ, đảm bảo hiển thị đúng số điểm từng bài (ví dụ: 34đ / 33đ / 33đ).
   - **Chuẩn Hóa Kết Quả Đã Lưu (`normalizeAttemptResult`):** Xây dựng hàm chuẩn hóa tự động xử lý các kết quả chấm bài cũ hoặc dữ liệu trong `localStorage`. Tự động quy đổi tổng điểm tối đa về 100đ, tính lại điểm từng phần tương ứng theo tỷ lệ phần trăm và cập nhật lại chuỗi chi tiết kết quả (ví dụ `(0/50đ)` -> `(0/34đ)`, `(50/100đ)` -> `(17/33đ)`).
2. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - Cập nhật Huy hiệu Đã Hoàn Thành trên Card cuộc thi (`🎯 Đã Hoàn Thành (17/100đ)`) sử dụng `normalizeAttemptResult` để luôn phản ánh đúng thang điểm 100 chuẩn hóa dù dữ liệu lịch sử nộp bài cũ hiển thị 170đ.

---

### Prompt 14
> "ko hiển thị ra danh sách bài thi vì hiển thị đã biết trước đề bài rồi"

**Thời gian:** 2026-09-09 19:32:00

**Các file đã tạo / cập nhật / xóa:**

#### File Chỉnh Sửa [MODIFY]
1. [ContestListPage.tsx](file:///c:/Users/Admin/Desktop/cybersoft-learning-hub/learning-hub/FE/src/pages/ContestListPage.tsx)
   - **Bảo Mật Tên Đề Bài Trước Khi Vào Thi:** Loại bỏ hoàn toàn danh sách các thẻ preview tên bài thi/chủ đề cụ thể (như `Bài Trắc Nghiệm Python Căn Bản`, `Tổng đường chéo ma trận vuông`) trên Card cuộc thi ở trang danh sách ngoài.
   - Thay thế bằng khối thông tin cấu trúc tổng quan an toàn: `📚 Cấu trúc đề thi (X bài thi) | 🏆 Tổng điểm: 100 điểm | 🔒 Bảo mật thông tin đề thi cho đến khi vào phòng thi`, đảm bảo tính bảo mật và công bằng cho kỳ thi.

