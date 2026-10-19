# DATA — Từ điển dữ liệu, toàn vẹn và lưu trữ

> MongoDB qua Mongoose. Schema gốc: `BE/src/modules-system/database/schemas/*.schema.ts`. Mọi collection có `createdAt`/`updatedAt` (trừ khi ghi khác).

## 1. Data dictionary

### `users`

| Trường | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `email` | string | duy nhất, định danh đăng nhập (không sửa được) |
| `password` | string | băm bcrypt |
| `fullName` | string | bắt buộc, ≤ 100 ký tự |
| `role` | enum | `STUDENT` · `TEACHER` · `ADMIN` |
| `ageGroup` | enum | `3-5` · `6-9` · `10-12` · `CAREER_ADULT` — **chỉ học viên**; giảng viên/Admin không có |
| `studentCode` | string | `C0001`... duy nhất (sparse), cấp tự tăng qua `counters` |
| `status` | enum | `ACTIVE` (mặc định) · `LOCKED` |
| `phone`, `bio` | string | **không lưu với học viên 3-5** |
| `sessionsRevokedAt` | Date | token phát hành trước mốc này bị từ chối |
| `avatar` | string | |

### `classrooms`

| Trường | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `name`, `description` | string | |
| `code` | string | `CL-` + 6 ký tự, duy nhất, sinh tự động |
| `teacherId` | string | giảng viên chính (= phần tử đầu `teacherIds`, giữ để tương thích) |
| `teacherIds` | string[] | giảng viên phụ trách, tối đa 10 |
| `studentIds` | string[] | học viên; **khóa Người đi làm không lưu** (mọi tài khoản Người đi làm học đủ 3 khóa) |
| `ageGroup` | enum | `3-5` · `6-9` · `10-12` (khối của lớp phổ thông) |
| `courseKey` | enum | `tester-qa` · `data-sql` · `ai-prompt` (khóa Người đi làm) |
| `archived` | boolean | lớp lưu trữ: chỉ xem, không nhận bài |
| `exerciseSlugs` | string[] | bài giao kiểu cũ (không hạn chót) |

### `exercises`

| Trường | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `title`, `slug`, `description` | string | `slug` duy nhất |
| `type` | enum | `QUIZ` · `CODE_BLOCK` · `CODE_TEXT` · `SQL_LAB` · `DA_INSIGHT` · `AI_LAB` |
| `difficulty` | enum | `EASY` · `MEDIUM` · `HARD` |
| `points` | number | mặc định 10 |
| `starterCode`, `solutionCode` | string | |
| `timeLimitMs`, `memoryLimitMb` | number | mặc định 2000 ms / 128 MB |
| `testCases[]` | `{input, expectedOutput, isHidden}` | test hiển thị |
| `hiddenTestCases[]` | như trên | **`select: false`** — chỉ máy chấm và màn quản trị đọc |
| `officialSolution` | string | **`select: false`** |
| `targetGroup` | enum | `K3_5` · `K6_9` · `K10_12` · `CAREER_ADULT` |
| `labType` | enum | `PUZZLE_BLOCK` · `PYTHON_CODE` · `ALGO_JUDGE` · `DATA_SQL` · `AI_PROMPT` · `TESTER_QA` |
| `topic`, `orderInTopic` | string, number | vị trí trong lộ trình Playground |
| `bankOnly` | boolean | `true` = bài Ngân hàng đề của giảng viên/Admin, **không bao giờ vào Playground** (schema ép `true` khi có `authorId`) |
| `bankBand` | enum | `6-9` · `10-12` (nhãn khối Ngân hàng đề) |
| `authorId` | string | người tạo (bài GV/AI) |
| `hasDuplicateWarning`, `approvedBy`, `approvedAt`, `overrideReason` | | vết duyệt của AI Tạo Đề |

### `questions`

| Trường | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `content`, `codeSnippet` | string | |
| `options[]` | `{key, text, isCorrect}` | 2–6 đáp án, đúng một đáp án đúng (câu của Ngân hàng đề) |
| `explanation` | string | học sinh xem sau khi nộp |
| `difficulty`, `points`, `category`, `tags[]` | | `category` = bộ đề (`Python`, `HTML5`, `CSS3`...) |
| `gradeBands[]` | enum[] | `6-9`, `10-12`; 3 bộ đề công khai dùng cả hai |
| `bankOnly`, `authorId` | | câu của giảng viên: không vào `/quiz` công khai |

### `submissions` (bài nộp code)

| Trường | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `exerciseId`, `userId` | string | |
| `assignmentId` | string | có = bài nộp cho bài giao của lớp (tính điểm lớp, hạn chót) |
| `code` | string | |
| `status` | enum | `QUEUED` · `RUNNING` · `AC` · `WA` · `TLE` · `RE` · `CE` · `FAILED` |
| `passedCount`, `totalCount`, `results[]` | | kết quả từng test (thời gian, bộ nhớ) |
| `attempts` | number | số lần máy chấm thử (phục hồi job kẹt) |
| `idempotencyKey` | string | duy nhất (sparse) — chống nộp trùng |
| `outOfSequence` | boolean | đánh dấu bài AC nhảy cóc từ trước khi có khóa tuần tự (không tính tiến độ) |
| `integrity` | object | tín hiệu liêm chính (timeline, focus, similarity, `reviewStatus`, quyết định) |

### `contests`

| Trường | Kiểu | Ràng buộc / ý nghĩa |
|---|---|---|
| `title`, `slug`, `description` | string | `slug` duy nhất |
| `startTime`, `endTime` | Date | cửa sổ vào thi |
| `durationMinutes` | number | thời gian làm bài mỗi thí sinh |
| `problems[]` | `{source, exerciseSlug, questionIds, type: coding\|quiz, points, order}` | đề thi |
| `registrations[]` | `{studentId, studentName, registeredAt}` | |
| `status` | enum | `draft` · `published` |
| `gradeBand` | enum | `ALL` · `6-9` · `10-12` |
| `integrityEnabled` | boolean | bật giám sát rời màn hình |

### Collection liên quan

| Collection | Vai trò |
|---|---|
| `class_assignments` | Bài giao theo Ngày: `classId`, `type` (CODING/QUIZ), `exerciseSlug` hoặc `questionIds`, `maxPoints` (1–100), `startAt`, `dueAt`, `order`, `createdBy` |
| `quizattempts` | Lượt trắc nghiệm: `status` IN_PROGRESS · SUBMITTED · EXPIRED · GRADED; `timeLimitSeconds`, `shuffledQuestions[]`, `score`, `assignmentId` |
| `contest_attempts`, `contest_submissions` | Lượt thi và bài nộp cuộc thi |
| `proctor_alerts` | Cảnh báo rời màn hình (`leaveCount`, `severity`, `status`, quyết định hủy kết quả) |
| `assessments`, `assessment_submissions` | Bài đánh giá của lớp và vòng đời điểm (DRAFT → SUBMITTED → GRADED → PUBLISHED → FINALIZED) |
| `revoked_tokens` | `jti`, `expiresAt` — TTL |
| `coach_messages` | Lịch sử AI Coach (`policyBlocked`, `policyReason`) — TTL 90 ngày |
| `audit_logs` | Nhật ký thao tác quản trị (trước/sau), không sửa/xóa qua ứng dụng |
| `counters` | Bộ đếm `studentCode` |
| `block_puzzle_progress` | Tiến độ Kid Mode (màn, sao, mốc thời gian) |

## 2. Data integrity

**Quan hệ Lớp – Giảng viên – Học viên** (lưu bằng mảng ID, MongoDB không có khóa ngoại nên ứng dụng tự giữ):

| Bất biến | Cách giữ |
|---|---|
| Mọi ID trong `teacherIds` là tài khoản `TEACHER` tồn tại | `assignTeachers` tự gỡ ID không còn là giảng viên ("ID ma"), chỉ chấp nhận người mới đang hoạt động (`400 E400_INVALID_TEACHERS`) |
| Lớp đang hoạt động luôn có giảng viên dùng được | Khóa/thu hồi giảng viên còn đứng lớp → `409`; Health Check báo *Suy giảm* khi có lớp thiếu GV hoặc GV không tồn tại/bị khóa |
| Chỉ học viên đúng khối nằm trong `studentIds` | Thêm học viên kiểm tra khối; đổi khối → rút khỏi lớp khác khối; lên giảng viên → rút khỏi mọi lớp và xóa `ageGroup` |
| Bài Ngân hàng đề đang được dùng không bị xóa/đổi khối | `409 E409_BANK_EXERCISE_IN_USE` (kiểm tra `class_assignments`, `classrooms.exerciseSlugs`, `contests`) |

**Dọn dữ liệu rác — `scripts/lib/class-integrity.js`:** `repairAllClasses(db)` gỡ khỏi mọi lớp các ID giảng viên/học viên không tồn tại hoặc sai vai trò, sửa `teacherId` chính, rút học viên lệch khối. Được gọi trong `npm run seed` / `seed:clean` (bước 0 và chốt cuối) và trong `node scripts/migrate-day29.js` (có `--dry-run`). Có test `class-integrity.test.js`.

## 3. Lưu trữ & PII retention

| Dữ liệu | Thời hạn | Cơ chế |
|---|---|---|
| Lịch sử chat AI Coach (`coach_messages`) | **90 ngày** | TTL index trên `createdAt` (tạo bởi schema và `migrate-day29.js`) |
| Token đã thu hồi (`revoked_tokens`) | Đến khi token hết hạn | TTL index trên `expiresAt` |
| Bài nộp, điểm, lượt thi, nhật ký quản trị | Không tự xóa | Dữ liệu học tập và bằng chứng; xóa theo quy trình của tổ chức |
| Log ứng dụng | Không lưu trong MongoDB; xuất ra stdout của tiến trình | Đã che PII (email, token, link đặt lại mật khẩu không được log) |

**Tối thiểu hóa PII:** trẻ Khối 3–5 không lưu `phone`/`bio`; nội dung gửi Gemini đã che email/SĐT/CCCD và không kèm `userId`; dữ liệu mẫu dùng email giả lập. Không đưa dữ liệu học viên thật vào công cụ AI công cộng khi phát triển.
