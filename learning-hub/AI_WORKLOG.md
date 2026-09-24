# AI Work Log — Ngày 17: Debug loop cho AI Coach

| | |
|---|---|
| **Người thực hiện** | Dương Chí Việt |
| **Ngày** | 2026-09-23 đến 2026-09-24 |
| **Nhánh** | `feature/learning-hub-day17` |
| **Công cụ** | Claude Code (CLI, VSCode extension), model Claude Sonnet 5 |
| **Phạm vi quyền** | Đọc/ghi trong `learning-hub/`; tạo branch mới từ `main`; chạy build/typecheck/test thật; khởi động dev server thật (BE + FE) và gọi API thật qua MongoDB local (`localhost:27017/cybersoft`) để kiểm chứng end-to-end; tạo và xóa dữ liệu smoke-test tự tạo sau khi kiểm chứng xong. |

---

## Tóm tắt 1 dòng mỗi việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Triển khai nhiệm vụ ngày 17 theo đề bài: phân loại lỗi từ kết quả test thật, chuẩn hóa feedback, giới hạn vòng lặp thử-sai, 20 fixtures và conversation traces | Xong |
| 2 | Rà soát toàn bộ code 17 ngày theo yêu cầu người dùng, phát hiện lỗ hổng thiếu auth guard | Xong (phát hiện, chưa xử lý ở bước này) |
| 3 | Xây dựng auth guard cơ bản (JWT) và vá lỗ hổng cho các module Quiz, Leaderboard, Authoring | Xong |
| 4 | Thay Docker bằng AST-based sandbox thật cho Python code runner theo yêu cầu không dùng Docker | Xong |
| 5 | Bổ sung luồng đăng ký/đăng nhập/quên mật khẩu thật, chọn nhóm lớp qua modal, sinh mã học viên Cxxxx, và hoàn thiện việc tồn đọng của ngày 3 (health endpoint, CI chạy test) | Xong |
| 6 | Loại bỏ hoàn toàn khái niệm tài khoản demo/khách, đồng bộ toast thông báo toàn app | Xong |
| 7 | Sửa Quiz và Block Puzzle: cho xem trước không cần đăng nhập, chỉ chặn khi thao tác thật (nộp bài/chơi/vào thi) | Xong |
| 8 | Audit lại lần 2 toàn bộ nhiệm vụ 1-17, phát hiện 4 module còn lại (Contest, Exercise/Judge, Hint, AI Coach) vẫn tin `userId` do client tự khai | Xong (phát hiện, xử lý ở Việc 9) |
| 9 | Vá đồng loạt 4 module còn lại theo đúng pattern auth guard đã dùng cho Quiz | Xong |

---

## Việc 1 — Triển khai nhiệm vụ ngày 17: Debug loop

### Prompt gốc của người dùng
Người dùng dán nguyên văn đề bài ngày 17: xây dựng vòng lặp gỡ lỗi (debug loop) cho AI Coach dựa trên kết quả test THẬT của một submission đã lưu (không nhận mô tả lỗi tự do từ client, không để AI tự bịa nguyên nhân); phân loại lỗi theo các nhóm cố định (lỗi biên dịch/cú pháp, lỗi runtime, timeout, sai kết quả, đã đạt); chuẩn hóa nội dung feedback trích dẫn đúng bằng chứng từ test case thật (input/expected/actual, không lộ dữ liệu test ẩn); có bước gợi ý tiếp theo (next step); giới hạn số vòng lặp thử-sai liên tiếp chưa đạt để tránh học viên loay hoay vô hạn; bàn giao tối thiểu 20 fixture kịch bản lỗi và bộ conversation trace sinh ra từ đúng hàm production (không tự viết tay output mẫu) làm baseline cho việc chấm điểm/đánh giá ở ngày 18.

### Đã làm
Khảo sát lại `coach.service.ts`, `coach-context.builder.ts`, `submission.schema.ts` của ngày 16 để xác định nguồn dữ liệu thật duy nhất được phép dùng: bản ghi `Submission` đã lưu trong MongoDB (trường `status`, `passedCount`, `totalCount`, `results[]`, `errorMessage`), không tạo thêm kênh nhận input tự do nào khác từ client cho tính năng này.

Viết `coach-debug-loop.types.ts` định nghĩa `DebugLoopTestInput` (dữ liệu test thật trích từ submission: trạng thái, số test pass/tổng, lỗi runtime nếu có, test case đầu tiên bị fail kèm input/expected/actual/stderr/cờ ẩn), `DebugLoopState` (số lần loop trước đó), và `DebugErrorCategory` gồm 5 nhóm cố định: `COMPILE_SYNTAX`, `RUNTIME_EXCEPTION`, `TIMEOUT`, `WRONG_OUTPUT`, `PASSED`.

Viết `coach-debug-loop.ts` chứa hàm thuần `analyzeDebugLoop(input, state)`: suy ra `errorCategory` trực tiếp từ `status` của submission thật (không đoán); dựng `evidence` chỉ từ test case không bị đánh dấu ẩn (test ẩn chỉ báo số thứ tự, không lộ input/expected/actual); soạn `feedback` trích dẫn nguyên văn giá trị thật (ví dụ so sánh expected/actual) thay vì câu chung chung; soạn `nextStep` gợi ý hướng khắc phục theo từng nhóm lỗi; tính `loopCount` bằng cách cộng dồn số submission liên tiếp chưa AC ngay trước submission hiện tại (chuỗi bị ngắt/reset khi gặp một lần AC xen giữa); đặt `MAX_DEBUG_LOOPS = 5`, trả về `loopLimitReached = true` kèm gợi ý tìm người hướng dẫn khi chạm giới hạn.

Viết `dto/debug-loop.dto.ts` (`userId`, `exerciseSlug`, `submissionId` — bắt buộc phải là submission thật đã lưu, không nhận kết quả test tự mô tả). Bổ sung `debugLoop()` vào `coach.service.ts`: xác thực exercise và submission thuộc đúng user/bài; truy vấn danh sách submission trước đó theo thời gian để tính `loopCount`; gọi `analyzeDebugLoop`; ghi log tóm tắt lượt phân tích vào `coach_messages` giống cơ chế logging đã có ở ngày 16. Thêm `POST /api/coach/debug-loop` vào `coach.controller.ts`.

Viết `coach-debug-loop.spec.ts` phủ cả 5 nhóm lỗi, trường hợp test ẩn không bị lộ, trường hợp chạm giới hạn vòng lặp, và trường hợp chuỗi loop bị reset khi có AC xen giữa.

Tạo `fixtures/failure-fixtures.json` với 20 kịch bản khác nhau trải đều 5 nhóm lỗi (mỗi kịch bản có `id`, `description`, `input`, `state`). Viết `fixtures/generate-traces.ts` chạy toàn bộ 20 fixture qua đúng hàm `analyzeDebugLoop` của production (không tự soạn tay output mẫu), ghi kết quả ra `fixtures/conversation-traces.json` để làm baseline cho việc chấm điểm ở ngày 18. Viết `fixtures/README.md` mô tả mục đích từng file và lệnh chạy lại khi logic thay đổi.

Nối tính năng vào giao diện: thêm nút "Phân tích lỗi lần nộp gần nhất" trong `CoachPanel.tsx`, chỉ hiện khi đã có submission thật, gọi `POST /api/coach/debug-loop`, hiển thị nhãn nhóm lỗi, bộ đếm vòng lặp (`loopCount/maxLoops`), feedback trích dẫn bằng chứng thật, và next step.

### Kiểm chứng
```
cd learning-hub/BE
npx jest src/modules-api/coach --silent
# toàn bộ test debug-loop pass, không phá test ngày 16

npx tsc --noEmit -p tsconfig.json
# không có lỗi kiểu

npx ts-node -T src/modules-api/coach/fixtures/generate-traces.ts
# sinh lại conversation-traces.json từ đúng hàm production
```

Kiểm chứng qua trình duyệt thật (Playwright, headless Chromium) với backend/frontend dev server thật: mở Code Playground, chọn bài `tinh-tong-hai-so-nguyen`, nộp code sai cố ý (`print(str(a)+str(b))` thay vì cộng số), chờ chấm xong ra kết quả WA thật, chuyển sang tab AI Coach, bấm nút phân tích lỗi — xác nhận kết quả hiển thị đúng nhãn "Sai kết quả" (WRONG_OUTPUT), bộ đếm vòng lặp, feedback trích dẫn đúng input/expected/actual của test case thật, và next step. Chụp ảnh màn hình xác nhận không có lỗi console.

---

## Việc 2 — Rà soát toàn bộ code 17 ngày, phát hiện thiếu auth guard

### Prompt gốc của người dùng
Người dùng yêu cầu kiểm tra lại toàn bộ 17 ngày đã làm đúng chưa, chỉ xét phần code, bỏ qua phần tài liệu.

### Đã làm
Rà soát lần lượt các module đã triển khai qua các ngày: xác nhận logic nghiệp vụ (chấm điểm, sinh câu hỏi, context builder, debug loop) đúng theo từng đề bài. Phát hiện lỗ hổng bảo mật nghiêm trọng xuyên suốt nhiều module: toàn bộ endpoint ghi dữ liệu (nộp bài, mở hint, chat AI Coach, đăng ký thi, nộp bài thi) đều nhận `userId`/`studentId` trực tiếp từ body/query do client tự khai, không có cơ chế xác thực nào — cho phép bất kỳ ai mạo danh học viên khác chỉ bằng cách sửa giá trị này trong request. Đồng thời phát hiện `GET /api/authoring/lessons?forStudent=true` (route công khai) trả về nguyên `solutionCode` và đáp án đúng của test case ẩn cho mọi bài giáo viên tạo.

### Quyết định của bản thân
Không tự ý sửa ngay vì đây là thay đổi kiến trúc lớn ảnh hưởng nhiều module cùng lúc, cần thống nhất hướng xử lý với người dùng trước.

---

## Việc 3 — Xây dựng auth guard cơ bản và vá Quiz, Leaderboard, Authoring

### Prompt gốc của người dùng
Người dùng xác nhận cần làm auth guard chi tiết để xử lý lỗ hổng đã phát hiện ở Việc 2.

### Đã làm
Xây bộ hạ tầng xác thực dùng chung tại `common/auth/`: `jwt.strategy.ts` (Passport JWT, payload gồm `sub`/`email`/`role`), `jwt-auth.guard.ts` (bắt buộc đăng nhập), `optional-jwt-auth.guard.ts` (không bắt buộc, override `handleRequest` để không ném lỗi khi thiếu token — dùng cho route công khai cần biết danh tính nếu có), `roles.guard.ts` cùng decorator `@Roles()` (phân quyền theo vai trò dùng `Reflector`), và `current-user.decorator.ts` (`@CurrentUser()` lấy user từ token đã xác thực).

Vá `quiz.controller.ts`/`quiz.service.ts`: toàn bộ route dùng `JwtAuthGuard`, `userId` lấy từ `@CurrentUser()`, bỏ hẳn field `userId` khỏi các DTO nhận từ client. Vá `leaderboard.controller.ts` dùng `OptionalJwtAuthGuard` để cờ hiển thị điểm giáo viên chỉ tin theo token thật, không tin query string. Vá `authoring.controller.ts`/`authoring.service.ts`: thêm hàm `stripLearnerSensitiveFields()` ẩn `solutionCode`, input/output của test ẩn, và đáp án đúng của quiz trước khi trả cho route công khai; các thao tác tạo/sửa/xóa bắt buộc `JwtAuthGuard` kèm `@Roles('TEACHER')`.

### Kiểm chứng
Chạy `npx tsc --noEmit` và `npx jest --silent` toàn bộ backend sau mỗi module vá, xác nhận không hồi quy. Gọi lại API thật qua `curl` với và không có Bearer token hợp lệ để xác nhận đúng hành vi chặn/cho phép.

---

## Việc 4 — Thay Docker bằng AST-based sandbox thật

### Prompt gốc của người dùng
Người dùng cho biết không muốn dùng Docker để chạy sandbox Python, hỏi cách nào vẫn vá được lỗ hổng thực thi code nguy hiểm mà không cần Docker.

### Đã làm
Tư vấn và thống nhất hướng dùng kiểm tra tĩnh dựa trên cây cú pháp (AST) thật của Python thay vì so khớp chuỗi từ khóa (dễ bị lách qua bằng cách viết lại cú pháp tương đương). Viết lại hoàn toàn `python-guard.helper.ts`: gọi trực tiếp Python thật qua `child_process.spawn` chạy một script dùng `ast.parse()` và `ast.walk()` để duyệt toàn bộ cây cú pháp của code học viên nộp, chặn `ast.Import`/`ast.ImportFrom` (import module nguy hiểm), `ast.Call`/`ast.Attribute` (gọi hàm hoặc truy cập thuộc tính nguy hiểm), và `ast.Name` khi code gán tham chiếu hàm nguy hiểm ra biến khác trước khi gọi (né tránh kiểm tra tên gọi trực tiếp). Kết hợp với giới hạn ở tầng hệ điều hành (timeout, không có mạng ngoài) đã có sẵn từ trước.

### Kiểm chứng
Viết `python-guard.helper.spec.ts` với 13 test case, bao gồm các kiểu né tránh từng khai thác được ở bản kiểm tra chuỗi cũ (`().__class__.__base__.__subclasses__()`, lấy `__builtins__` qua `f.__globals__`, gán `__import__` ra biến trước khi gọi, dùng `globals()`), xác nhận toàn bộ đều bị chặn đúng bằng AST thật.

---

## Việc 5 — Luồng đăng ký/đăng nhập thật và hoàn thiện việc tồn đọng ngày 3

### Prompt gốc của người dùng
Người dùng yêu cầu làm chi tiết: đăng ký, đăng nhập, quên mật khẩu, bắt chọn nhóm lớp qua modal ở lần đăng nhập đầu tiên, sinh mã học viên dạng Cxxxx tự động; đồng thời làm luôn phần còn treo của ngày 3 (thiếu health endpoint, CI chỉ lint chưa chạy test).

### Đã làm
Thêm `GET /health` vào `app.controller.ts` dùng `@InjectConnection()` kiểm tra kết nối MongoDB thật. Sửa `learning-hub/.github/workflows/ci.yml` bổ sung bước chạy `npm run test --prefix BE` (trước đó CI chỉ lint, không chạy test).

Thêm cơ chế sinh mã học viên tuần tự an toàn dưới tải đồng thời: schema `counter.schema.ts` dùng `findOneAndUpdate` với `$inc` nguyên tử (atomic) để tránh trùng mã khi nhiều học viên đăng ký cùng lúc. Thêm `forgotPassword()`/`resetPassword()` trong `auth.service.ts`: token đặt lại mật khẩu chỉ lưu dạng băm SHA-256 trong DB (không lưu token gốc), có thời hạn 15 phút, gửi qua `mail.service.ts` dùng Nodemailer với Gmail SMTP. Thêm `AgeGroupModal.tsx` bắt học viên chọn nhóm lớp ở lần đăng nhập đầu tiên khi tài khoản chưa có `ageGroup`. Sửa `RegisterPage.tsx` bỏ hẳn việc để người dùng tự chọn vai trò khi đăng ký, luôn tạo tài khoản với vai trò STUDENT.

### Kiểm chứng
```
npx jest --silent
# toàn bộ test pass, bao gồm test mới cho health endpoint

npx tsc --noEmit -p tsconfig.json
```
Gọi thật `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password` qua `curl`, xác nhận mã học viên sinh đúng thứ tự Cxxxx và email đặt lại mật khẩu gửi thành công qua Gmail thật.

---

## Việc 6 — Loại bỏ tài khoản demo, đồng bộ toast thông báo

### Prompt gốc của người dùng
Người dùng gửi ảnh chụp màn hình cho thấy hiển thị "Mã SV: student-demo" dù đã đăng xuất, đồng thời yêu cầu chuyển toàn bộ chỗ liên quan tới tài khoản demo/khách sang dùng tài khoản thật (vì hệ thống đã có đăng nhập thật), và làm thông báo (toast) thống nhất kiểu rơi từ trên xuống, tự ẩn sau vài giây, dùng chung một mẫu cho toàn app.

### Đã làm
Xác định nguồn gốc chuỗi `student-demo`: là giá trị mặc định cứng trong `exerciseApi.ts`/`hintApi.ts` khi không truyền `userId`, và dữ liệu tiến độ Code Playground/Block Puzzle cũ trong `localStorage` được lưu theo namespace không phân biệt tài khoản nên vẫn hiển thị lại sau khi đăng xuất.

Xây `components/Toast.tsx`: `ToastProvider`/`useToast()` dùng Context, animation rơi từ trên xuống, tự ẩn sau vài giây, bọc toàn app trong `main.tsx`. Thay toàn bộ lời gọi toast rải rác trước đó (4 file: `ContestListPage.tsx`, `ContestExamWorkspace.tsx`, `TeacherAuthoringPage.tsx`, `TeacherContestAuthoring.tsx`) sang dùng chung `useToast()`.

Bỏ giá trị mặc định `'student-demo'` khỏi `exerciseApi.ts`/`hintApi.ts`, chuyển `userId` thành tham số bắt buộc kiểu `string`. Bỏ ô nhập "tên khách" và nhãn "Học viên Demo" trong `ContestListPage.tsx`, thay bằng mã học viên thật của tài khoản đang đăng nhập. Sửa lỗi logic trong `App.tsx`: hàm đăng xuất trước đó có đoạn tự động xóa mọi khóa `localStorage` chứa `id` của user, đoạn này vô hại trước khi có namespace theo user nhưng sau khi thêm namespace cho tiến độ Code Playground/Block Puzzle thì bắt đầu xóa nhầm tiến độ ngay khi đăng xuất — sửa lại chỉ xóa đúng `token`/`app_auth_user`.

### Kiểm chứng
Kiểm tra qua trình duyệt thật: đăng nhập, làm bài, đăng xuất, đăng nhập lại bằng tài khoản khác — xác nhận không còn hiển thị "student-demo" và tiến độ của từng tài khoản không bị lẫn hay bị xóa nhầm. Kiểm tra dữ liệu thật trong MongoDB bằng `mongosh`, xóa các bản ghi test cũ mang `userId = 'student-demo'` sau khi xác nhận không phải dữ liệu học viên thật.

---

## Việc 7 — Sửa login gate cho Quiz và Block Puzzle

### Prompt gốc của người dùng
Người dùng phản hồi: 4 mục (Thi Trắc Nghiệm, Block Puzzle, và các mục liên quan) khi chưa đăng nhập vẫn xem được bài nhưng không làm được, tuy nhiên việc chặn hiện tại chặn cứng cả route (kể cả gõ thẳng URL cũng không vào được), thay vì chỉ chặn đúng lúc thao tác thật.

### Đã làm
Trao đổi làm rõ với người dùng để xác nhận đúng phạm vi từng mục: giữ nguyên chặn cứng route "Chi tiết bài học" (`/detail`) theo đúng quyết định trước đó của người dùng; Quiz và Block Puzzle chuyển từ chặn ở cấp route sang cho xem danh sách/bài trước, chỉ bắt đăng nhập ngay tại thời điểm bấm hành động thật (bắt đầu làm quiz, vào chơi game).

Sửa `App.tsx` bỏ guard chặn cứng ở cấp route cho `/quiz` và `/block-puzzle`. Sửa `QuizTakingPage.tsx` thêm kiểm tra `authUser` ngay trong `handleStartQuiz`, điều hướng sang trang đăng nhập kèm thông báo nếu chưa đăng nhập. Sửa `BlockPuzzlePage.tsx` thêm cùng kiểm tra tại sự kiện bấm vào game và khi chọn bài học.

### Kiểm chứng
Kiểm tra qua trình duyệt thật ở cả hai trạng thái đăng nhập và chưa đăng nhập: xác nhận xem được danh sách/mô tả bài khi chưa đăng nhập, nhưng bị chuyển hướng kèm thông báo khi bấm hành động thật; gõ thẳng URL `/quiz` và `/block-puzzle` khi chưa đăng nhập vẫn vào xem được, đúng yêu cầu.

---

## Việc 8 — Audit lần 2, phát hiện 4 module còn tin userId từ client

### Prompt gốc của người dùng
Người dùng yêu cầu kiểm tra lại toàn bộ từ nhiệm vụ 1 đến 17 xem các lần sửa trước có thực sự đúng chưa.

### Đã làm
Đối chiếu lại từng thay đổi đã thực hiện ở các Việc 2-7 với trạng thái code hiện tại để xác nhận không phải chỉ sửa qua loa: xác nhận Quiz/Leaderboard/Authoring/Block Puzzle đã dùng đúng token thật, toast đã đồng bộ, login gate hoạt động đúng như mô tả ở Việc 7. Đồng thời phát hiện 4 module chưa nằm trong đợt vá đầu (Contest, Exercise/Judge, Hint, AI Coach) vẫn giữ y nguyên lỗ hổng giống Quiz trước khi vá: `contest.controller.ts` nhận `studentId` từ body khi đăng ký/nộp bài thi; `exercise.controller.ts` nhận `userId` từ body khi nộp bài; `judge.controller.ts` cho phép đọc kết quả submission bất kỳ chỉ bằng đoán ID, không kiểm tra chủ sở hữu; `hint.controller.ts` nhận `userId` qua query/body khi mở hint và xem lịch sử; `coach.controller.ts` nhận `userId` từ body khi chat/debug-loop/xem lịch sử.

### Quyết định của bản thân
Không coi đây là việc nhỏ có thể để sau, vì cùng một lớp lỗ hổng đã xác nhận là nghiêm trọng ở Việc 2-3 vẫn còn nguyên ở 4 module khác — báo cáo đầy đủ cho người dùng quyết định vá ngay hay theo đợt.

---

## Việc 9 — Vá đồng loạt 4 module: Contest, Exercise/Judge, Hint, AI Coach

### Prompt gốc của người dùng
Người dùng chọn phương án vá cả 4 module ngay lập tức, không tách nhỏ theo từng đợt.

### Đã làm
Áp dụng thống nhất một khuôn mẫu xử lý cho cả 4 module, đúng nguyên tắc đã dùng cho Quiz ở Việc 3: `userId`/`studentId`/`authorId` luôn lấy từ `@CurrentUser()` (token đã xác thực), không bao giờ nhận từ body/query/param client tự khai; route xem công khai (danh sách, chi tiết) giữ nguyên không cần đăng nhập nhưng dùng `OptionalJwtAuthGuard` để trường thông tin cá nhân hóa (đã đăng ký chưa, đã mở hint chưa) chỉ tính theo user thật nếu có; route ghi dữ liệu hoặc đọc dữ liệu cá nhân bắt buộc `JwtAuthGuard`.

**Contest**: bỏ `studentId`/`studentName`/`authorId` khỏi các DTO nhận từ client; `createContest`, `registerContest`, `submit` đều nhận `userId` là tham số riêng do controller truyền vào từ token; `registerContest`/`submit` tự truy vấn `User` model lấy `fullName` thay vì tin client gửi tên. Viết lại toàn bộ `contest.controller.ts` với guard tương ứng cho từng nhóm route (tạo/sửa/xóa bắt buộc `TEACHER`, đăng ký/nộp bài bắt buộc đăng nhập, xem danh sách/chi tiết công khai có tùy chọn).

**Exercise/Judge**: `POST /exercises/:slug/submit` bắt buộc đăng nhập, `userId` lấy từ token thay vì DTO. `GET /exercises/submissions/:id` bắt buộc đăng nhập và thêm kiểm tra quyền sở hữu — chỉ đúng chủ bài nộp hoặc vai trò `TEACHER` mới xem được, chặn kiểu tấn công đoán ID để đọc trộm kết quả/code của học viên khác.

**Hint**: `POST /hints/unlock` bắt buộc đăng nhập, bỏ field `userId` khỏi DTO. `GET /hints/exercise/:slug` dùng `OptionalJwtAuthGuard` để vẫn xem được danh sách hint công khai nhưng trạng thái "đã mở" chỉ tính theo user thật. `GET /hints/history/:userId` thêm kiểm tra chỉ chủ tài khoản hoặc `TEACHER` được xem.

**AI Coach**: gắn `JwtAuthGuard` cho toàn bộ controller; `chat`/`debugLoop` nhận `userId` từ token thay vì DTO; `GET /coach/history/:userId/:exerciseSlug` thêm kiểm tra chỉ chủ tài khoản hoặc `TEACHER` được xem.

Cập nhật toàn bộ tầng gọi API ở frontend cho khớp: đổi `contestApi.ts` từ dùng `axios` trần (không tự gắn token, có cơ chế tự âm thầm chuyển sang lưu cục bộ khi gọi lỗi — có thể che giấu luôn cả lỗi từ chối do thiếu quyền) sang dùng `axiosClient` dùng chung của toàn app (tự gắn Bearer token, không còn fallback che lỗi); bỏ toàn bộ `userId`/`studentId`/`studentName` khỏi phần thân request ở `contestSubmissionApi.ts`, `exerciseApi.ts`, `hintApi.ts`, `coachApi.ts` và các nơi gọi chúng, vì các giá trị này giờ máy chủ tự lấy từ token, không cần và không nên gửi từ client nữa.

### Kiểm chứng
Cập nhật các bộ test backend có sẵn (`contest.service.spec.ts`, `contest-submission.service.spec.ts`, `hint.service.spec.ts`, `coach.service.spec.ts`) cho khớp chữ ký hàm mới.

```
cd learning-hub/BE
npx tsc --noEmit -p tsconfig.json
# không có lỗi kiểu

npx jest --silent
# Test Suites: 19 passed, 19 total
# Tests:       145 passed, 145 total

cd ../FE
npx tsc --noEmit -p tsconfig.json
# không có lỗi kiểu
```

Kiểm chứng bằng token JWT thật (ký bằng đúng `JWT_SECRET` đang cấu hình, gắn với một tài khoản thật trong MongoDB) gọi trực tiếp qua `curl` vào dev server thật đang chạy: xác nhận cả 5 endpoint vừa vá (`hints/unlock`, `coach/chat`, `contests/:id/register`, `exercises/:slug/submit`, `exercises/submissions/:id`) trả về 401 khi không có token, và trả về thành công khi có token hợp lệ. Ký thêm một token thứ hai gắn với danh tính khác để xác nhận `exercises/submissions/:id` trả về 403 đúng khi cố đọc submission không thuộc về mình. Sau khi kiểm chứng, xóa toàn bộ dữ liệu smoke-test tạo ra trong quá trình gọi thật (1 submission, các bản ghi `coach_messages` và `hint_usages` phát sinh) khỏi MongoDB local bằng `mongosh`, đã xin xác nhận người dùng trước khi xóa.

---

## Đối chiếu với điều kiện nghiệm thu ngày 17

| Điều kiện | Kết quả |
|---|---|
| Không nhận mô tả lỗi tự do từ client, chỉ phân tích submission thật đã lưu | Đạt |
| Phân loại lỗi theo nhóm cố định (compile/runtime/timeout/sai kết quả/đã đạt) | Đạt |
| Feedback trích dẫn đúng bằng chứng thật (input/expected/actual), không lộ test ẩn | Đạt, có test riêng xác nhận |
| Có giới hạn số vòng lặp thử-sai tối đa | Đạt (`MAX_DEBUG_LOOPS = 5`) |
| Tối thiểu 20 fixture kịch bản lỗi | Đạt |
| Conversation trace sinh từ đúng hàm production, không tự viết tay | Đạt |

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

Phần triển khai đúng nhiệm vụ ngày 17 (debug loop) bám sát cấu trúc đã có từ ngày 16 (tách hàm phân tích thuần túy khỏi Service, viết test trước khi nối vào controller) nên không phát sinh lỗi lớn ở lần đầu, các test tự viết đều pass ngay.

Phần rủi ro thật sự đến từ ngoài phạm vi nhiệm vụ ngày 17: lỗ hổng thiếu auth guard tồn tại xuyên suốt nhiều module từ trước, chỉ được phát hiện khi người dùng chủ động yêu cầu audit lại toàn bộ 17 ngày thay vì chỉ tập trung vào tính năng mới. Ở lần vá đầu (Quiz, Leaderboard, Authoring), phạm vi xử lý chưa đủ rộng — cùng một lớp lỗi (tin `userId` từ client) vẫn còn nguyên ở 4 module khác cho tới khi người dùng yêu cầu audit lần hai. Điều này cho thấy việc rà soát theo từng module riêng lẻ dễ bỏ sót các lỗ hổng có tính hệ thống, lặp lại cùng một mẫu sai ở nhiều nơi; chỉ khi được yêu cầu quét toàn bộ theo chiều ngang (cùng một loại lỗi, trên tất cả module) thì mới phát hiện đầy đủ.

Việc kiểm chứng bằng gọi API thật với token ký thủ công và dữ liệu MongoDB thật (thay vì chỉ dựa vào unit test với mock) là bước xác nhận cần thiết, vì unit test dùng mock không thể phát hiện được các vấn đề tầng tích hợp như `axios` trần không gắn token hay hành vi fallback che giấu lỗi 401 ở `contestApi.ts` cũ.
