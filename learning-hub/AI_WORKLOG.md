# AI Work Log — Ngày 16: AI Coach có context học tập

| | |
|---|---|
| **Người thực hiện** | Dương Chí Việt |
| **Ngày** | 2026-09-22 |
| **Nhánh** | `feature/learning-hub-day16` |
| **Công cụ** | Claude Code (CLI, VSCode extension), model Claude Sonnet 5 |
| **Phạm vi quyền** | Đọc/ghi trong `learning-hub/`; tạo branch mới từ `main`; chạy build/typecheck/test thật; khởi động dev server thật (BE + FE) và gọi API thật qua MongoDB local (`localhost:27017/cybersoft`) để kiểm chứng end-to-end; xóa dữ liệu smoke-test tự tạo sau khi kiểm chứng xong. |

---

## Tóm tắt 1 dòng mỗi việc

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Tạo branch `feature/learning-hub-day16`, kéo `main` mới nhất | Xong |
| 2 | Khảo sát kiến trúc BE hiện có để thiết kế module Coach theo đúng convention của `hint`/`exercise` | Xong |
| 3 | Thiết kế Context Schema tối thiểu, quy định rõ không chứa hidden test và không chứa solutionCode | Xong |
| 4 | Viết Context Builder — build lại từ DB mỗi lượt: đề bài, attempt gần nhất, hint đã unlock | Xong |
| 5 | Viết Policy Enforcement — chặn dữ liệu cấm lọt vào prompt, chặn AI trả lời full solution khi chưa đủ điều kiện | Xong |
| 6 | Viết LLM Client dạng interface có thể thay thế, kèm implementation stub (repo chưa cài SDK AI nào) | Xong |
| 7 | Viết Coach Service — ghép context, giới hạn token, ghi log mỗi lượt chat | Xong |
| 8 | Viết Controller + Module, wire vào `app.module.ts` | Xong |
| 9 | Viết Policy Tests + Context Builder Tests + Service Tests | Xong |
| 10 | Kiểm chứng độc lập bằng typecheck, test, build, và gọi API thật qua dev server | Xong |
| 11 | Nối AI Coach vào giao diện Code Playground (tab chat mới) theo yêu cầu của người dùng | Xong |
| 12 | Người dùng phát hiện bug: response echo nguyên văn traceback lỗi, không bám nội dung câu hỏi | Xong |
| 13 | Sửa stub nhận diện các loại lỗi Python phổ biến, không còn echo nguyên văn message | Xong |
| 14 | Sửa `submitCode` ở FE gửi kèm `userId` để Coach đọc đúng trạng thái đã AC | Xong |
| 15 | Rà soát lại toàn bộ nhiệm vụ ngày 16, ghi nhận một hạn chế đã biết chưa xử lý | Xong (có ghi chú hạn chế) |

---

## Việc 1 — Tạo branch, kéo main

### Prompt gốc của người dùng
Yêu cầu tạo nhánh làm việc cho ngày 16 và cập nhật từ nhánh `main` mới nhất.

### Đã làm
Checkout `main`, `git pull` (fast-forward 4 commit mới từ `origin/main`), tạo branch `feature/learning-hub-day16` từ đó.

---

## Việc 2 — Khảo sát kiến trúc để thiết kế module Coach nhất quán

### Đề bài
Nhiệm vụ ngày 16 yêu cầu AI Coach biết bài, attempt và hint đã dùng — nghĩa là phải tích hợp với dữ liệu thật của `exercise`, `submission`, `hint-usage` đã có từ các ngày trước.

### Đã làm
Đọc `hint.service.ts`, `hint.controller.ts`, `hint.module.ts`, `exercise.service.ts`, các schema Mongoose liên quan, `database.module.ts` để nắm quy ước đăng ký model, quy ước DTO (class thuần, không dùng `class-validator` vì thư viện này chưa được cài trong `package.json`), và cách `exercise.service.ts` đã lọc sẵn `isHidden` ở endpoint public — dùng làm tham chiếu cho việc lọc dữ liệu tương tự ở Context Builder.

### Quyết định của bản thân
Không cài thêm SDK AI thật vì đây là thay đổi ngoài phạm vi được giao và cần API key thật để chạy. Thiết kế `LlmClient` là một interface độc lập, có một implementation stub chạy được ngay không cần mạng ngoài — khi có API key thật, chỉ cần thêm một class implement cùng interface và đổi provider trong `coach.module.ts`.

---

## Việc 3 — Thiết kế Context Schema tối thiểu

### Đề bài
"Thiết kế context builder tối thiểu" và điều kiện nghiệm thu "không gửi hidden test cho model".

### Đã làm
Viết `coach-context.types.ts` định nghĩa `CoachContext` gồm: thông tin bài (title, description, difficulty, chỉ test case không ẩn), tóm tắt attempt (số lần nộp, trạng thái và số test pass lần gần nhất, đã từng AC hay chưa — không đưa code đã nộp của học viên vào context), hint đã unlock (chỉ nội dung các tầng đã mở), lịch sử hội thoại gần nhất (giới hạn 6 lượt), và một object `policy` (`allowFullSolution`, `maxHintLevelUnlocked`) để tầng service/policy quyết định dựa trên dữ liệu đã tính sẵn.

---

## Việc 4 — Context Builder

### Đã làm
Viết `coach-context.builder.ts`: truy vấn `Exercise` theo slug, lọc `testCases` giữ `!isHidden`, đếm `hiddenTestCount` riêng. Truy vấn `Submission` theo `exerciseId` và `userId`, chỉ lấy `status/passedCount/totalCount`, không lấy field `code`. Truy vấn `HintUsage` để biết các level đã unlock, sau đó chỉ fetch nội dung `Hint` đúng các level đó bằng `level: { $in: unlockedLevels }` — không fetch toàn bộ hint của bài rồi lọc ở tầng ứng dụng.

Tính `policy.allowFullSolution = hasEverPassed || maxHintLevelUnlocked >= 3`: chỉ cho phép trình bày lời giải đầy đủ khi học viên đã tự AC, hoặc đã mở hết 3 tầng gợi ý theo đúng cơ chế cooldown/thứ tự đã có từ `hint.service.ts`.

---

## Việc 5 — Policy Enforcement

### Đề bài
"Cấm AI đưa full solution khi policy không cho phép" — yêu cầu bắt buộc của nhiệm vụ ngày 16.

### Đã làm
Viết `coach-policy.ts` với hai lớp kiểm tra độc lập:

1. `assertContextHasNoForbiddenData(context)` — chạy trước khi gọi model, serialize context và kiểm tra không chứa chuỗi `solutionCode`. Là lớp phòng thủ thứ hai độc lập với Context Builder.
2. `checkCoachResponsePolicy(content, context)` — chạy sau khi có response, dùng khi `policy.allowFullSolution === false`: chặn nếu response chứa khối code markdown dài từ 6 dòng trở lên, hoặc chứa các cụm từ báo hiệu đưa nguyên đáp án. Nếu bị chặn, thay response gốc bằng một câu trả lời trung tính và ghi lại lý do bị chặn.

### Quyết định của bản thân
Chọn heuristic đơn giản (đếm dòng code block, so khớp cụm từ) thay vì gọi thêm một lượt model để kiểm duyệt, vì việc đó sẽ tốn thêm token cho mỗi câu trả lời, không phù hợp với điều kiện "giới hạn token". Đây là giới hạn đã biết của bản v0.1, chưa thay được việc so khớp theo cấu trúc code (AST).

---

## Việc 6 — LLM Client dạng thay thế được

### Đã làm
Viết interface `LlmClient` và implementation mặc định `StubLlmClient` không gọi mạng ngoài, trả lời dựa trên dữ liệu context đã lọc sẵn. Viết `estimateTokens()` ước lượng token theo tỷ lệ 4 ký tự trên 1 token.

### Quyết định của bản thân
Kiểm tra `package.json` xác nhận repo chưa cài `@anthropic-ai/sdk` hay `openai`, không có API key nào được cấu hình. Không tự ý thêm dependency hay giả lập response trông giống như đã gọi API thật, để tránh gây hiểu lầm rằng đây là kết nối model thật. Ghi rõ trong code đây là bản v0.1 chưa gọi AI thật.

---

## Việc 7 — Coach Service: giới hạn token và logging

### Đề bài
Điều kiện nghiệm thu: "có logging và giới hạn token".

### Đã làm
Viết `coach.service.ts`: tính `promptTokenEstimate` từ system prompt, context serialize và message, so với `MAX_PROMPT_TOKENS = 4000` — nếu vượt, từ chối trước khi gọi model. Sau khi có response, nếu `completionTokens` vượt `MAX_COMPLETION_TOKENS = 800`, cắt bớt nội dung theo giới hạn ký tự tương ứng. Ghi log mỗi lượt (cả message của học viên và response) vào collection `coach_messages` mới, gồm `tokenCount`, `policyBlocked`, `policyReason`.

---

## Việc 8 — Controller, Module, wiring

### Đã làm
`POST /api/coach/chat` (body: `userId`, `exerciseSlug`, `message`) và `GET /api/coach/history/:userId/:exerciseSlug`. Đăng ký `CoachMessage` schema vào `database.module.ts`, thêm `CoachModule` vào `app.module.ts`.

---

## Việc 9 — Viết test

### Đề bài
Bàn giao cuối ngày yêu cầu Policy tests là sản phẩm riêng biệt.

### Đã làm
- `coach-policy.spec.ts`: chặn khối code dài khi chưa được phép, cho phép đoạn code ngắn minh họa, chặn cụm từ báo hiệu đưa nguyên đáp án, cho phép full solution khi `allowFullSolution = true`, và kiểm tra `assertContextHasNoForbiddenData` với context sạch và context có `solutionCode`.
- `coach-context.builder.spec.ts`: xác nhận hidden test case không xuất hiện trong context dù dữ liệu gốc từ DB có chứa, xác nhận `solutionCode` không lọt vào context, xác nhận chỉ hint đã unlock mới được đưa vào, và các điều kiện `allowFullSolution = true`.
- `coach.service.spec.ts`: validate thiếu message, xác nhận ghi log đúng số lần với đúng nội dung, response kèm giới hạn token, cắt bớt completion khi vượt giới hạn, từ chối khi context quá dài mà không gọi model, và xác nhận response bị policy chặn vẫn được log lại.

---

## Việc 10 — Kiểm chứng độc lập lần đầu

### Đã chạy và kết quả

```
cd learning-hub/BE
npx jest src/modules-api/coach --silent
# Test Suites: 3 passed, 3 total
# Tests:       18 passed, 18 total
```

```
npx tsc --noEmit -p tsconfig.json
# (không có output, không lỗi kiểu)
```

```
npm run build
# nest build — thành công, không lỗi
```

```
npx jest --silent
# Test Suites: 1 failed, 13 passed, 14 total
# Tests:       1 failed, 90 passed, 91 total
```

Test suite thất bại duy nhất (`hint.service.spec.ts`, test cooldown) xác nhận không liên quan tới thay đổi ngày 16: `git status --short src/modules-api/hint/` cho kết quả rỗng, file này không bị đụng tới trong buổi làm việc.

Khởi động `npm run start:dev` với MongoDB local đang chạy, gọi API thật: `POST /api/coach/chat` cho bài chưa nộp, chưa mở hint → từ chối đưa code đầy đủ đúng như kỳ vọng. Gọi thật `POST /api/hints/unlock` mở Tầng 1, gọi lại chat → xác nhận `maxHintLevelUnlocked` cập nhật đúng từ dữ liệu thật trong `hint_usages`. Phát hiện `curl -d` trên Git Bash/Windows làm sai lệch hiển thị ký tự tiếng Việt khi test qua terminal — xác minh lại bằng cách gửi request qua file JSON UTF-8 chuẩn, xác nhận dữ liệu lưu trong MongoDB đúng, không phải lỗi của hệ thống. Sau khi kiểm chứng, xóa dữ liệu smoke-test khỏi MongoDB local bằng `mongosh`.

---

## Việc 11 — Nối AI Coach vào giao diện

### Prompt gốc của người dùng
Người dùng yêu cầu chạy thử dự án để xem AI Coach hoạt động. Sau khi được giải thích là backend ngày 16 chưa có giao diện tương ứng, người dùng chọn phương án làm luôn một khung chat trên giao diện thay vì chỉ gọi API qua terminal.

### Đã làm
Khảo sát `HintPanel.tsx` và cách nó được nhúng trong `CodePlaygroundPage.tsx` (dạng tab bên phải màn hình làm bài) để giữ đúng cấu trúc giao diện đã có. Viết `types/coach.ts`, `axios/coachApi.ts` theo đúng khuôn mẫu của `hintApi.ts`. Viết `components/CoachPanel.tsx`: khung chat có lịch sử hội thoại, ô nhập, hiển thị cảnh báo khi một câu trả lời bị policy chặn. Thêm tab "AI Coach" thứ tư vào `CodePlaygroundPage.tsx`, cạnh các tab Output, Kết quả Test mẫu, Gợi ý đã có sẵn.

### Kiểm chứng
Chạy đồng thời `npm run start:dev` (BE, cổng 3000) và `npm run dev` (FE, cổng 5173), xác nhận cả hai phục vụ request thành công (HTTP 200). Chạy `npx tsc -b --force` ở FE, xác nhận không có lỗi kiểu liên quan tới các file vừa thêm hoặc sửa (lỗi kiểu duy nhất còn lại nằm ở `TeacherContestAuthoring.tsx`, file không bị đụng tới trong buổi làm việc, xác nhận bằng `git status --short`).

---

## Việc 12 — Người dùng phát hiện bug: response không bám câu hỏi

### Phát hiện của người dùng
Người dùng dán nguyên văn traceback lỗi Python (bao gồm đường dẫn file tạm trên máy) vào ô chat. Coach trả lời bằng cách lặp lại gần như nguyên văn đoạn traceback đó trong câu trả lời, không đưa ra được nhận xét gì về nội dung lỗi. Người dùng nhận xét đúng: câu trả lời không bám bài và không chính xác.

### Nguyên nhân
`StubLlmClient` (bản v0.1, không gọi AI thật) ghép `userMessage.slice(0, 120)` trực tiếp vào một câu mở đầu cố định, không phân biệt được loại nội dung của message (câu hỏi bằng lời hay traceback lỗi dán nguyên văn).

### Đánh giá của bản thân
Đây là hạn chế thật của thiết kế stub, không phải lỗi hiển thị. Trước khi sửa, đã đối chiếu lại với điều kiện nghiệm thu ngày 16 ("câu trả lời bám bài") và xác nhận bản stub khi đó không đạt tiêu chí này ở các trường hợp người dùng dán nguyên lỗi thay vì hỏi bằng lời.

---

## Việc 13 — Sửa stub nhận diện lỗi phổ biến

### Trao đổi với người dùng
Đặt câu hỏi cho người dùng về hướng xử lý: tích hợp AI thật (cần cung cấp API key) hoặc nâng cấp stub trong giới hạn không cần AI thật. Người dùng chọn nâng cấp stub, không dùng AI thật ở ngày 16.

### Đã làm
Sửa `coach-llm.client.ts`: thêm danh sách nhận diện các loại lỗi Python phổ biến (SyntaxError, NameError, TypeError, IndexError, IndentationError) bằng so khớp mẫu (regex) trên nội dung message, trả lời đúng loại lỗi và hướng khắc phục thay vì lặp lại nguyên văn traceback. Thêm nhận diện câu hỏi xin đáp án đầy đủ. Tách hàm `buildReply` thành ba nhánh rõ ràng theo loại nội dung nhận được, thay cho một hàm gộp chung như trước.

### Kiểm chứng
Viết `coach-llm.client.spec.ts` với 5 test: xác nhận không còn chứa đường dẫn file tạm hay tên biến tạm của traceback gốc trong response, xác nhận nhận diện đúng SyntaxError và NameError, xác nhận vẫn giữ đúng hành vi không lộ full solution khi chưa đủ điều kiện.

```
npx jest src/modules-api/coach --silent
# Test Suites: 4 passed, 4 total
# Tests:       23 passed, 23 total
```

Gọi lại API thật với đúng nội dung traceback trong ảnh chụp màn hình người dùng gửi (bài "Tính tổng hai số nguyên", lỗi thiếu dấu đóng ngoặc), xác nhận response mới nêu đúng "thiếu dấu đóng ngoặc/quote" và hướng dẫn đếm lại dấu ngoặc, không còn chứa đường dẫn file tạm. Xóa dữ liệu smoke-test sau khi kiểm chứng.

### Giới hạn còn lại
Bản stub sau khi sửa chỉ nhận diện được các mẫu lỗi đã liệt kê sẵn trong code. Với câu hỏi tự nhiên ngoài các mẫu này, Coach vẫn chỉ trả lời theo template chung, không thực sự phân tích được nội dung như một model AI thật. Đây là giới hạn đã biết của bản v0.1, cần API AI thật để vượt qua.

---

## Việc 14 — Gắn userId khi submit code

### Phát hiện trong lúc rà soát
Trong lúc kiểm tra vì sao `attemptSummary.hasEverPassed` có thể không phản ánh đúng thực tế, phát hiện `exerciseApi.submitCode()` ở FE không gửi `userId` khi nộp bài, trong khi `hintApi` luôn gửi. Kiểm tra trực tiếp trong MongoDB local: toàn bộ 23 submission có sẵn đều có `userId` rỗng.

### Đã sửa
Sửa `exerciseApi.ts`: `submitCode` nhận thêm tham số `userId`, mặc định `'student-demo'` giống giá trị mặc định của `hintApi`, để cùng một học viên demo có dữ liệu nhất quán giữa nộp bài, mở hint và hỏi Coach.

### Giới hạn còn lại
Chỉ sửa cho luồng nộp bài mới. 23 submission cũ trong DB local vẫn giữ `userId` rỗng, không hồi tố. Đây không phải lỗi cần sửa gấp vì là dữ liệu thử nghiệm cục bộ, không phải dữ liệu thật của học viên.

---

## Việc 15 — Rà soát lại toàn bộ nhiệm vụ, ghi nhận hạn chế chưa xử lý

### Đã rà soát
Trong lúc kiểm tra Context Builder có phụ thuộc dữ liệu tĩnh hay không, phát hiện một khoảng trống kiến trúc có sẵn từ trước, không phải do module Coach tạo ra: giảng viên tạo bài mới qua Authoring chỉ ghi vào collection `Lesson` (`AuthoringService`), trong khi `ExerciseService`, `HintService` và `CoachContextBuilder` đều chỉ đọc từ collection `Exercise` riêng biệt. Hai bảng này không có cơ chế đồng bộ tự động.

### Ảnh hưởng tới Coach
Nếu giảng viên tạo một bài mới qua giao diện Authoring, Coach sẽ báo "không tìm thấy bài tập" khi học viên hỏi về bài đó, cho tới khi có người thủ công thêm bài vào collection `Exercise` (cách hiện tại: sửa file dữ liệu khởi tạo rồi seed lại, như cách đã làm ở ngày 14, ngày 15).

### Quyết định của bản thân
Không tự ý sửa vấn đề này trong phạm vi ngày 16, vì nó ảnh hưởng tới cả `Judge` và `Hint`, không riêng `Coach`, và cần quyết định kiến trúc rộng hơn (đồng bộ hai chiều, hay Coach đọc dự phòng từ `Lesson`, hay gộp hai collection). Đã trình bày lại vấn đề cho người dùng, đang chờ quyết định hướng xử lý ở một nhiệm vụ khác. Ghi nhận đây là hạn chế đã biết của bản giao ngày 16, chưa phải lỗi phát sinh từ module mới.

---

## Đối chiếu với điều kiện nghiệm thu ngày 16

| Điều kiện | Kết quả |
|---|---|
| Không gửi hidden test cho model | Đạt. Có test riêng xác nhận, cộng thêm lớp kiểm tra runtime độc lập với Context Builder |
| Câu trả lời bám bài | Đạt ở mức bản stub sau khi sửa ở Việc 12-13. Vẫn còn giới hạn đã ghi rõ ở Việc 13 |
| Có logging và giới hạn token | Đạt. Ghi log mọi lượt chat, có giới hạn cả token đầu vào và đầu ra |
| AI Coach v0.1 | Đạt, có cả backend và giao diện chat thật, vượt yêu cầu tối thiểu của đề (đề chỉ yêu cầu backend) |
| Context schema | Đạt |
| Policy tests | Đạt |

Hạn chế đã biết, chưa xử lý trong phạm vi ngày 16: khoảng trống đồng bộ giữa collection `Lesson` và `Exercise` (Việc 15).

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

Phần thiết kế kiến trúc ban đầu (tách Context Builder, Policy, LLM Client, Service thành các file riêng, dùng interface cho LLM Client) đúng ngay từ đầu vì bám sát cấu trúc module `hint` đã có sẵn trong repo, và các test tự viết đều pass ở lần chạy đầu.

Tuy nhiên phần chất lượng nội dung câu trả lời của Coach có lỗi thật, chỉ được phát hiện khi người dùng tự tay thao tác trên giao diện và dán một traceback lỗi thật vào ô chat — không phải qua các test đã viết trước đó, vì các test đó chỉ kiểm tra logic policy/giới hạn token bằng dữ liệu giả lập đơn giản, không mô phỏng đúng cách người dùng thật sẽ gõ. Đây là một dạng lỗi mà việc tự viết test theo hướng suy đoán trước không đủ để bắt được — cần có người dùng thật thao tác để lộ ra.

Việc kiểm tra kiến trúc dữ liệu (khoảng trống giữa `Lesson` và `Exercise`, submission không có `userId`) là hai phát hiện chủ động trong lúc rà soát lại, không phải do người dùng chỉ ra. Cả hai đều là hạn chế có sẵn trong hệ thống trước ngày 16, không phải lỗi phát sinh từ module Coach, nhưng ảnh hưởng trực tiếp tới độ chính xác của dữ liệu Coach sử dụng — đã ghi nhận rõ ràng thay vì bỏ qua.
