# 🤖 AI_WORKLOG.md - Ngày 06: Quiz Engine NestJS Backend, Jest Tests & React Frontend Quiz UI

Tài liệu ghi nhận toàn bộ quá trình trao đổi, các câu prompt yêu cầu của người dùng và danh sách chi tiết các tệp mã nguồn được **Tạo mới / Cập nhật** trong **Ngày 06** của dự án **Learning & Contest Hub** (CyberSoft Academy).

---

## 📌 Chi Tiết Công Việc Theo Từng Prompt (Per-Prompt Detailed Change Log)

---

### 💬 PROMPT 1: Thiết kế Mongoose Schemas & Seed 20 câu hỏi trắc nghiệm cho "Quiz Engine" (Backend NestJS)
- 🟢 **`BE/src/modules-system/database/schemas/question.schema.ts` [TẠO MỚI]**: NestJS Mongoose Decorator Schema `Question` & `QuestionOption`.
- 🟢 **`BE/src/modules-system/database/schemas/quiz-attempt.schema.ts` [TẠO MỚI]**: NestJS Mongoose Decorator Schema `QuizAttempt` & `ShuffledQuestionItem`.
- 🟢 **`BE/src/modules-system/database/schemas/index.ts` [TẠO MỚI]**: Barrel export cho các Mongoose schemas.
- 🟡 **`BE/src/modules-system/database/database.module.ts` [CẬP NHẬT]**: Đăng ký `Question` và `QuizAttempt` Mongoose Models.
- 🟢 **`BE/src/data/initial-quiz-questions.ts` [TẠO MỚI]**: Bộ 20 câu hỏi trắc nghiệm Lập trình Web thực tế.
- 🟢 **`BE/src/data/seed-quiz.ts` [TẠO MỚI]**: Kịch bản nạp tự động 20 câu hỏi vào MongoDB `cybersoft`.

---

### 💬 PROMPT 2: Xây dựng QuizService & QuizController xử lý 3 luồng nghiệp vụ trắc nghiệm
- 🟢 **`BE/src/common/helper/prng.helper.ts` [TẠO MỚI]**: Thuật toán xáo trộn deterministic PRNG Fisher-Yates bằng LCG.
- 🟢 **`BE/src/modules-api/quiz/dto/` [TẠO MỚI]**: `start-attempt.dto.ts`, `submit-attempt.dto.ts`, `review-attempt.dto.ts`.
- 🟢 **`BE/src/modules-api/quiz/quiz.service.ts` [TẠO MỚI]**: Service triển khai `startAttempt`, `submitAttempt` và `reviewAttempt`.
- 🟢 **`BE/src/modules-api/quiz/quiz.controller.ts` [TẠO MỚI]**: Controller với tiền tố toàn cục `/api` (`POST /api/quiz/start`, `POST /api/quiz/:id/submit`, `GET /api/quiz/:id/review`).

---

### 💬 PROMPT 3: Viết bộ Jest Unit Test & Integration Test cho QuizEngine
- 🟢 **`BE/src/common/helper/prng.helper.spec.ts` [TẠO MỚI]**: Unit Test xáo trộn PRNG seed nhất quán.
- 🟢 **`BE/src/modules-api/quiz/quiz.service.spec.ts` [TẠO MỚI]**: Test Suite 10/10 bài test tự động vượt qua 100%.

---

### 💬 PROMPT 4: Xây dựng React Frontend Quiz Engine UI & API Integration Layer (`FE/src/axios`)
- 🟢 **`FE/src/axios/configAxios.ts` [TẠO MỚI]**: Cấu hình Axios Instance kết nối với `http://localhost:3000/api` có tự động đính kèm Bearer JWT Token và xử lý lỗi toàn cục.
- 🟢 **`FE/src/axios/quizApi.ts` [TẠO MỚI]**: Tầng API Service Wrapper định nghĩa các hàm `startQuiz`, `submitQuiz`, `reviewQuiz`.
- 🟢 **`FE/src/types/quiz.ts` [TẠO MỚI]**: Định nghĩa các TypeScript interfaces `QuestionItem`, `QuestionOption`, `QuizStartResponse`, `QuizSubmitResponse`, `QuizReviewResponse`.
- 🟢 **`FE/src/components/QuizTimer.tsx` [TẠO MỚI]**: Component Đồng hồ đếm ngược thời gian thực 30:00 kèm cảnh báo quá hạn.
- 🟢 **`FE/src/components/QuestionNavigator.tsx` [TẠO MỚI]**: Thanh lưới chuyển nhanh 20 câu hỏi hiển thị trạng thái Đã chọn / Chưa chọn.
- 🟢 **`FE/src/components/QuestionCard.tsx` [TẠO MỚI]**: Thẻ câu hỏi trắc nghiệm với hiệu ứng chọn phương án A/B/C/D mượt mà và hộp hiển thị mã code snippet.
- 🟢 **`FE/src/components/QuizResultView.tsx` [TẠO MỚI]**: Giao diện tổng kết điểm số kèm xem lại câu đúng/câu sai và **giải thích sư phạm chi tiết**.
- 🟢 **`FE/src/pages/QuizTakingPage.tsx` [TẠO MỚI]**: Trang chính quản lý toàn bộ luồng Màn hình Chờ -> Màn hình Làm bài -> Modal Nộp bài -> Màn hình Kết quả.
- 🟡 **`BE/src/main.ts` [CẬP NHẬT]**: Thêm `app.enableCors()` mở kết nối liên cổng từ Frontend `http://localhost:5173`.
- 🟡 **`FE/src/App.tsx` & `FE/src/components/Header.tsx` [CẬP NHẬT]**: Thêm Tab "📝 Thi Trắc Nghiệm" vào thanh điều hướng chính.

---

## 🧪 Kết Quả Kiểm Thử (Verification Summary)

- **Frontend TypeScript (`npx tsc -b`)**: **0 Errors** (Biên dịch thành công 100%).
- **Frontend Linter (`npx oxlint`)**: **0 warnings, 0 errors** trên 24 tệp.
- **Backend Tests (`npx jest`)**: **10/10 tests passed** (100% pass).
- **Backend Database Seed (`npm run seed:quiz`)**: Nạp thành công 20 câu hỏi trắc nghiệm vào MongoDB `cybersoft`.
- **Frontend App Running (`http://localhost:5173`)**: Đang chạy mượt mà, gọi API thành công qua CORS và làm bài trắc nghiệm nộp bài tự động 100%.
