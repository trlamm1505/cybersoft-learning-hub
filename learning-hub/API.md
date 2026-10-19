# API — Danh mục REST API chính

> Base URL: `http://localhost:3000/api`. Liệt kê theo đúng các controller trong `BE/src/modules-api/*/*.controller.ts`.
> **Xác thực:** cookie `access_token` (httpOnly) do `POST /auth/login` đặt, hoặc header `Authorization: Bearer <token>`. Request đổi dữ liệu dùng cookie phải gửi thêm header `x-csrf-token` = cookie `csrf_token`.
> **Role:** `Public` = không cần đăng nhập · `Auth` = mọi vai trò đã đăng nhập · `S` = STUDENT · `T` = TEACHER · `A` = ADMIN.

## Mã lỗi chung

| HTTP / mã | Ý nghĩa |
|---|---|
| `400` | Payload sai kiểu, chứa toán tử NoSQL `$`, thiếu trường bắt buộc (vd `answers` không phải mảng) |
| `401` | Chưa đăng nhập, token hết hạn / đã thu hồi / phát hành trước `sessionsRevokedAt`, tài khoản bị khóa |
| `403` | Sai vai trò, sai khối, không phụ trách lớp, thiếu/lệch CSRF token |
| `403 E403_KID_NO_CODE_QUIZ` | Học sinh Khối 3–5 gọi quiz / chạy-nộp code / AI Coach |
| `403 E403_EXERCISE_LOCKED` | Nộp bài Playground chưa mở khóa tuần tự |
| `403 E403_PLAYGROUND_FIXED` | Sửa/xóa bài Playground cố định |
| `403 E403_NOT_OWNER` | Giảng viên sửa/xóa bài của giảng viên khác |
| `403 E403_QUESTION_BANK_NOT_ELIGIBLE` | Giảng viên không phụ trách lớp 6–9/10–12 vào Ngân hàng đề |
| `403` "đã hết hạn - đã khóa" | Nộp bài giao của lớp sau hạn chót |
| `404` | Không tìm thấy tài nguyên |
| `409` | Xung đột nghiệp vụ: email trùng, khóa/thu hồi giảng viên còn đứng lớp, Admin cuối cùng |
| `409 E409_BANK_EXERCISE_IN_USE` | Xóa/đổi khối bài Ngân hàng đề đang dùng ở lớp hoặc cuộc thi |
| `400 E400_INVALID_TEACHERS` | Phân công tài khoản không phải giảng viên đang hoạt động (kèm `invalidIds`) |
| `429` | Vượt rate limit (đăng nhập 5/phút/email, chạy code 30/phút, AI Coach 10/phút...) |

## Auth — `/auth`

| Method | Endpoint | Role | Mô tả | Lỗi đáng chú ý |
|---|---|---|---|---|
| POST | `/auth/register` | Public | Đăng ký học viên (mật khẩu 8–32 ký tự, đủ loại ký tự) | 400, 409 email trùng |
| POST | `/auth/login` | Public | Đăng nhập, đặt cookie phiên + CSRF | 401, 429 |
| POST | `/auth/logout` | Auth | Thu hồi token (`revoked_tokens`), xóa cookie | |
| GET | `/auth/me` | Auth | Thông tin người dùng hiện tại | 401 |
| PUT | `/auth/profile`, `/auth/avatar`, `/auth/age-group` | Auth | Cập nhật hồ sơ / ảnh / khối học | 400 |
| POST | `/auth/forgot-password`, `/auth/reset-password` | Public | Quên / đặt lại mật khẩu (hủy mọi phiên cũ) | 429 |

## Exercises & Playground — `/exercises`

| Method | Endpoint | Role | Mô tả | Lỗi đáng chú ý |
|---|---|---|---|---|
| GET | `/exercises` | Auth | Danh sách bài theo khối của người xem (học viên không thấy bài `bankOnly`) | |
| GET | `/exercises/playground` | Auth | Lộ trình cố định 20 bài (6–9) / 15 bài (10–12) kèm trạng thái mở khóa do máy chủ tính | |
| GET | `/exercises/:slug` | Auth | Chi tiết bài; chỉ test công khai | 403 khác khối, 404 |
| GET | `/exercises/:slug/full` | T, A | Chi tiết đầy đủ (kèm test ẩn, lời giải) | |
| POST | `/exercises/:slug/run` | Auth | Chạy thử với input tự nhập (không tạo bài nộp, không bị trừ điểm) | 403 E403_KID_NO_CODE_QUIZ, 429 |
| POST | `/exercises/check-syntax` | Auth | Kiểm tra cú pháp (lỗi đã che đường dẫn) | 403 kid |
| POST | `/exercises/:slug/submit` | Auth | Nộp bài vào hàng chờ chấm, trả `submissionId` (kèm `assignmentId` nếu là bài lớp) | 403 E403_EXERCISE_LOCKED, 403 hết hạn, 403 kid |
| GET | `/exercises/submissions/:id` | Auth (chủ bài) | Trạng thái chấm: QUEUED / RUNNING / AC / WA / TLE / RE / CE | 403 bài người khác |
| POST | `/exercises` | T, A | Tạo bài (luôn `bankOnly: true`) | 400 |
| PATCH / DELETE | `/exercises/:id` | T, A | Sửa / xóa bài | 403 E403_PLAYGROUND_FIXED, E403_NOT_OWNER, 409 E409_BANK_EXERCISE_IN_USE |

## Quiz — `/quiz`

| Method | Endpoint | Role | Mô tả | Lỗi đáng chú ý |
|---|---|---|---|---|
| POST | `/quiz/start` | Auth | Bắt đầu (hoặc tiếp tục lượt dở còn giờ) bộ đề `{ category }` — 20 câu công khai, không kèm đáp án | 403 kid, 400 |
| POST | `/quiz/:attemptId/submit` | Auth (chủ lượt) | Nộp `answers: [{questionId, selectedOptionKey}]`; luyện tập tự do luôn chấm **GRADED** kể cả hết giờ | 400 answers sai kiểu (giữ IN_PROGRESS), 403 bài lớp quá hạn |
| GET | `/quiz/:attemptId/review` | Auth (chủ lượt) | Kết quả Đúng / Sai / Bỏ trống + giải thích | |

## Contests — `/contests` và giám sát `/proctor`

| Method | Endpoint | Role | Mô tả | Lỗi đáng chú ý |
|---|---|---|---|---|
| GET | `/contests` | Public/Auth | Danh sách cuộc thi | |
| GET | `/contests/:id`, `/contests/:id/status` | Auth | Chi tiết, trạng thái | |
| POST | `/contests/:id/register` | S | Đăng ký | 403 khác khối |
| POST | `/contests/:id/start` | S | Vào phòng thi, bắt đầu lượt | 403 khác khối / ngoài giờ |
| GET | `/contests/:id/problems/:slug` | S | Đề một bài trong cuộc thi | |
| POST | `/contests/:id/submissions` | S | Nộp bài cuộc thi | 429 (15/phút), 403 phòng đã khóa |
| GET | `/contests/:id/my-attempt` · POST `/contests/:id/finish` | S | Lượt của tôi · kết thúc bài | |
| POST | `/proctor/heartbeat` | S | Nhịp 5 giây/lần (phân biệt mất mạng) | |
| POST | `/proctor/leave` | S | Báo một lần rời màn hình (≥ 5 giây); lần thứ 3 trong cuộc thi → khóa phòng thi + tự nộp | |
| POST / PUT / DELETE | `/contests`, `/contests/:id` | T, A | Tạo / sửa / xóa cuộc thi | 400, 403 |
| GET | `/contests/bank/exercises`, `/contests/bank/questions` | T, A | Chọn đề từ Ngân hàng | |
| GET | `/contests/:id/manage/results` | T, A | Kết quả + tín hiệu liêm chính | |
| PUT | `/contests/:id/manage/attempts/:attemptId/disqualify` · `/reinstate` | T, A | Không công nhận kết quả (lý do ≥ 10 ký tự) / khôi phục | 400 |

## Teacher — Ngân hàng đề, lớp, liêm chính

| Method | Endpoint | Role | Mô tả | Lỗi đáng chú ý |
|---|---|---|---|---|
| GET | `/teacher/question-bank/access` | T, A | Giảng viên có quyền dùng Ngân hàng đề không | |
| GET | `/teacher/question-bank` | T, A | Danh sách bài code (lọc khối, độ khó, tìm kiếm, phân trang) | 403 E403_QUESTION_BANK_NOT_ELIGIBLE |
| GET / PATCH / DELETE | `/teacher/question-bank/:slug` | T, A | Xem / sửa / xóa bài code | 403 E403_PLAYGROUND_FIXED, E403_NOT_OWNER, 409 E409_BANK_EXERCISE_IN_USE |
| GET / POST | `/teacher/question-bank/questions` | T, A | Danh sách / tạo câu trắc nghiệm (2–6 đáp án) | 400 |
| GET / PATCH / DELETE | `/teacher/question-bank/questions/:id` | T, A | Xem / sửa / xóa câu | 409 đang dùng |
| GET | `/teacher/classes`, `/teacher/classes/:classId` | T, A | Lớp được phân công, chi tiết, học viên, điểm | 403 lớp người khác |
| GET | `/teacher/class-assignments/:classId/days` | T, A | Bài giao theo Ngày | 403 |
| GET | `/teacher/class-assignments/catalog/exercises` · `catalog/questions` | T, A | Danh mục để chọn bài | |
| POST | `/teacher/class-assignments/:classId` | T, A | Giao bài vào Ngày (type, slug/questionIds, `dueAt`, `maxPoints`) | 403, 400 |
| DELETE | `/teacher/class-assignments/:classId/:assignmentId` | T, A | Gỡ bài khỏi lớp | 403 |
| GET | `/teacher/integrity/alerts` | T, A | Cảnh báo rời màn hình | |
| PUT | `/teacher/integrity/alerts/:id/ack` · `/invalidate` | T, A | Bỏ qua / hủy kết quả (lý do ≥ 10 ký tự) | 400 |
| GET | `/student/classes`, `/student/classes/:classId/overview` | S | Lớp của tôi, bài theo Ngày | 403 lớp khác |

## Admin — `/admin`

| Method | Endpoint | Role | Mô tả | Lỗi đáng chú ý |
|---|---|---|---|---|
| GET / POST | `/admin/users` | A | Danh sách (lọc vai trò/khối/trạng thái, tìm kiếm) / tạo học viên hoặc giảng viên | 403 tạo Admin, 409 email trùng |
| PUT | `/admin/users/:id` | A | Sửa họ tên, khối, đặt lại mật khẩu (hủy phiên) | 400 |
| PUT | `/admin/users/:id/role` | A | STUDENT ↔ TEACHER (lên GV: xóa `ageGroup`, rút khỏi lớp) | 403 gán Admin, 409 còn đứng lớp |
| POST | `/admin/users/:id/revoke-teacher` | A | Hạ về học viên / khóa | 409 kèm danh sách lớp |
| PUT | `/admin/users/:id/status` · PATCH `/admin/users/bulk-status` | A | Khóa / mở khóa (hàng loạt ≤ 100) | 409 GV đứng lớp, 409 Admin cuối |
| GET | `/admin/users/:id/profile` | A | Hồ sơ chi tiết | |
| GET / POST | `/admin/classes` | A | Danh sách / tạo lớp (mã tự sinh) | 400 |
| GET / PUT / DELETE | `/admin/classes/:classId` | A | Chi tiết / sửa / xóa lớp | |
| POST | `/admin/classes/:classId/students` | A | Thêm học viên bằng email hoặc mã `Cxxxx` | 400 sai khối / không tồn tại |
| DELETE | `/admin/classes/:classId/students/:studentId` | A | Gỡ học viên | |
| GET | `/admin/portal/classes`, `/admin/portal/classes/:classId` | A | Tổng quan lớp (giảng viên, cờ khóa/không tồn tại) | |
| PUT | `/admin/classes/:classId/teachers` | A | Phân công danh sách giảng viên (tự gỡ ID ma) | 400 E400_INVALID_TEACHERS |
| DELETE | `/admin/classes/:classId/teachers/:teacherId` | A | Gỡ một giảng viên | 400 lớp cần ít nhất 1 GV |
| PUT | `/admin/classes/:classId/archive` | A | Lưu trữ / kích hoạt lại | |
| GET | `/admin/health-check` | A | Kiểm tra 5 cụm (1 lần / 10 giây) | 429 |
| GET | `/admin/dashboard/summary`, `/admin/audit-logs` | A | Số liệu tổng quan, nhật ký | |
| GET / PUT | `/admin/configs` · POST `/admin/configs/test-gemini` | A | Cấu hình AI (key mã hóa), thử key Gemini | |

## Health

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/health` | Public | `{status, timestamp, mongo}` |
| GET | `/health/dependencies` | Public | Nguồn dữ liệu Lab, Postgres sandbox, `pythonSandbox` |
