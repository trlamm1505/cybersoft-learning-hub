# 🤖 AI_WORKLOG.md - Ngày 06: Quiz Engine NestJS Mongoose Schemas, QuizService, QuizController & Jest Unit/Integration Tests

Tài liệu ghi nhận toàn bộ quá trình trao đổi, các câu prompt yêu cầu của người dùng và danh sách chi tiết các tệp mã nguồn được **Tạo mới / Cập nhật** trong **Ngày 06** của dự án **Learning & Contest Hub** (CyberSoft Academy).

---

## 📌 Chi Tiết Công Việc Theo Từng Prompt (Per-Prompt Detailed Change Log)

---

### 💬 PROMPT 1: Thiết kế Mongoose Schemas & Seed 20 câu hỏi trắc nghiệm cho "Quiz Engine" (Backend NestJS)
> **Nội dung Yêu cầu:**
> Với vai trò Senior Database Architect, viết các Mongoose Schemas bằng TypeScript cho module "Quiz Engine" (Ngày 06) trong dự án NestJS (`BE/`):
> 1. Schema `Question`: Chứa nội dung câu hỏi, danh sách đáp án (`key`, `text`, `isCorrect`), cờ đánh dấu đáp án đúng và giải thích (`explanation`).
> 2. Schema `QuizAttempt`: Quản lý lượt làm bài của học viên (`userId`, `testId`, chuỗi `seed` ngẫu nhiên dùng để xáo trộn câu hỏi và đáp án, `shuffledQuestions`, thời gian bắt đầu/hạn nộp, trạng thái và điểm số).
> 3. Tập lệnh seed mẫu 20 câu hỏi trắc nghiệm kèm giải thích chi tiết để nạp vào database.

#### 📄 Danh sách File Tạo mới & Chỉnh sửa cho Prompt 1:
- 🟢 **`BE/src/modules-system/database/schemas/question.schema.ts` [TẠO MỚI]**: NestJS Mongoose Decorator Schema `Question` & `QuestionOption`.
- 🟢 **`BE/src/modules-system/database/schemas/quiz-attempt.schema.ts` [TẠO MỚI]**: NestJS Mongoose Decorator Schema `QuizAttempt` & `ShuffledQuestionItem`.
- 🟢 **`BE/src/modules-system/database/schemas/index.ts` [TẠO MỚI]**: Barrel export cho các Mongoose schemas.
- 🟡 **`BE/src/modules-system/database/database.module.ts` [CẬP NHẬT]**: Đăng ký `Question` và `QuizAttempt` Mongoose Models qua `MongooseModule.forFeature()`.
- 🟢 **`BE/src/data/initial-quiz-questions.ts` [TẠO MỚI]**: Bộ 20 câu hỏi trắc nghiệm Lập trình Web thực tế kèm 4 lựa chọn A/B/C/D và giải thích chi tiết.
- 🟢 **`BE/src/data/seed-quiz.ts` [TẠO MỚI]**: Kịch bản nạp tự động 20 câu hỏi vào CSDL MongoDB `cybersoft` và tạo lượt bài thi mẫu cho học viên `student@gmail.com`.
- 🟡 **`BE/package.json` [CẬP NHẬT]**: Thêm lệnh `"seed:quiz": "ts-node src/data/seed-quiz.ts"`.

---

### 💬 PROMPT 2: Xây dựng QuizService & QuizController xử lý 3 luồng nghiệp vụ trắc nghiệm cốt lõi
> **Nội dung Yêu cầu:**
> Với vai trò Senior Backend Developer, viết toàn bộ `QuizService` và `QuizController` trong NestJS xử lý 3 luồng nghiệp vụ:
> 1. API Bắt đầu làm bài (Start Attempt): Khởi tạo lượt làm bài, tự động xáo trộn các lựa chọn (shuffle options) dựa trên `seed` cố định (Fisher-Yates PRNG) và ẩn đáp án đúng/giải thích trong dữ liệu trả về cho học viên.
> 2. API Nộp bài (Submit Attempt): Kiểm tra thời hạn (chống nộp quá hạn), tự động chấm điểm dựa trên đáp án học viên chọn, cập nhật trạng thái `GRADED` và điểm số.
> 3. API Xem kết quả/Giải thích (Review Policy): Kiểm tra cấu hình Review Policy của giảng viên (`IMMEDIATE`, `AFTER_SUBMISSION`, `AFTER_DEADLINE`, `NEVER`) để quyết định có trả về danh sách đáp án đúng và phần giải thích chi tiết hay không.

#### 📄 Danh sách File Tạo mới & Chỉnh sửa cho Prompt 2:
- 🟢 **`BE/src/common/helper/prng.helper.ts` [TẠO MỚI]**: Thuật toán xáo trộn deterministic PRNG Fisher-Yates bằng LCG.
- 🟢 **`BE/src/modules-api/quiz/dto/start-attempt.dto.ts` [TẠO MỚI]**: DTO đầu vào bắt đầu làm bài `{ userId, testId }`.
- 🟢 **`BE/src/modules-api/quiz/dto/submit-attempt.dto.ts` [TẠO MỚI]**: DTO đầu vào nộp bài `{ userId, answers: [{ questionId, selectedOptionKey }] }`.
- 🟢 **`BE/src/modules-api/quiz/dto/review-attempt.dto.ts` [TẠO MỚI]**: DTO đầu vào xem lại bài làm `{ userId, policy }`.
- 🟢 **`BE/src/modules-api/quiz/quiz.service.ts` [TẠO MỚI]**: Service triển khai `startAttempt`, `submitAttempt` và `reviewAttempt`.
- 🟢 **`BE/src/modules-api/quiz/quiz.controller.ts` [TẠO MỚI]**: Controller định nghĩa các endpoints `POST /quiz/start`, `POST /quiz/:id/submit`, `GET /quiz/:id/review`.
- 🟢 **`BE/src/modules-api/quiz/quiz.module.ts` [TẠO MỚI]**: Module đăng ký `QuizService` và `QuizController`.
- 🟡 **`BE/src/app.module.ts` [CẬP NHẬT]**: Nạp `QuizModule` vào AppModule gốc.

---

### 💬 PROMPT 3: Viết bộ Jest Unit Test & Integration Test cho QuizEngine
> **Nội dung Yêu cầu:**
> Với vai trò QA/Testing Engineer, viết tập tin Unit Test và Integration Test bằng Jest cho `QuizService` với các kịch bản bắt buộc:
> 1. Kiểm tra tính toàn vẹn của thuật toán xáo trộn câu hỏi/đáp án dựa trên seed (nhất quán 100%, không mất hoặc lệch đáp án đúng).
> 2. Kiểm tra logic chặn nộp bài khi thời gian nộp vượt quá thời hạn cho phép (overdue check -> `BadRequestException` & `EXPIRED`).
> 3. Kiểm tra tính đúng đắn của chính sách hiển thị giải thích (Review Policy: `NEVER`, `AFTER_SUBMISSION`, `AFTER_DEADLINE`, `IMMEDIATE`).

#### 📄 Danh sách File Tạo mới & Chỉnh sửa cho Prompt 3:
- 🟢 **`BE/src/common/helper/prng.helper.spec.ts` [TẠO MỚI]**: Unit Test kiểm thử tính toàn vẹn và độ nhất quán ngẫu nhiên 100% của thuật toán PRNG Seed Shuffle.
- 🟢 **`BE/src/modules-api/quiz/quiz.service.spec.ts` [TẠO MỚI]**: Unit & Integration Test Suite cho `QuizService` kiểm thử đầy đủ kịch bản Start Attempt (Sanitization), Overdue Submission Check (`EXPIRED`), và Review Policy (`NEVER`, `AFTER_SUBMISSION`, `GRADED`).
- 🟡 **`BE/package.json` [CẬP NHẬT]**: Cấu hình khối `jest` với `ts-jest` transformer.

---

## 🧪 Kết Quả Kiểm Thử (Verification Summary)

- **NestJS TypeScript Compilation (`npm run build`)**: **Build Succeeded 100%** (0 errors).
- **Quiz Engine Database Seeding (`npm run seed:quiz`)**: Nạp thành công 20 câu hỏi trắc nghiệm kèm giải thích vào MongoDB `cybersoft`.
- **Jest Test Runner Output (`npm run test` / `npx jest`)**:
  ```text
  PASS src/common/helper/prng.helper.spec.ts
  PASS src/app.controller.spec.ts
  PASS src/modules-api/quiz/quiz.service.spec.ts

  Test Suites: 3 passed, 3 total
  Tests:       10 passed, 10 total
  Snapshots:   0 total
  Time:        1.311 s
  Ran all test suites.
  ```
