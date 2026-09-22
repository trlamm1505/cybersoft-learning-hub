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
| 2 | Triển khai nhiệm vụ ngày 16 theo đề bài: context builder, endpoint chat, policy chặn full solution | Xong |
| 3 | Giải thích cơ chế AI Coach đang dùng cho người dùng khi được hỏi lại | Xong |
| 4 | Giải thích lý do vẫn cần giới hạn token dù chưa gọi model AI thật | Xong |
| 5 | Rà soát khoảng trống dữ liệu giữa Authoring (Lesson) và Exercise theo câu hỏi của người dùng | Xong (ghi nhận hạn chế, chưa xử lý) |
| 6 | Chạy thử dự án theo yêu cầu của người dùng | Xong |
| 7 | Nối AI Coach vào giao diện Code Playground sau khi người dùng phản hồi chưa thấy tính năng trên UI | Xong |
| 8 | Sửa lỗi response echo nguyên văn traceback lỗi, không bám câu hỏi — do người dùng phát hiện qua ảnh chụp màn hình | Xong |
| 9 | Đối chiếu nhiệm vụ ngày 17-19 theo yêu cầu người dùng, đánh giá thời điểm cần API AI thật | Xong (chỉ phân tích, không code) |
| 10 | Rà soát lại toàn bộ nhiệm vụ ngày 16 và ghi đè AI_WORKLOG theo đúng mẫu | Xong |
| 11 | Giải thích file chứa logic sinh câu trả lời khi người dùng hỏi lại | Xong |
| 12 | Giải thích phương án short-circuit rule-based trước khi gọi API thật để tiết kiệm quota | Xong (chỉ tư vấn, không code) |
| 13 | Thêm nhánh xử lý lời cảm ơn theo yêu cầu người dùng, kiểm tra lại toàn bộ trước khi sửa | Xong |
| 14 | Chia commit theo chủ đề, đẩy lên nhánh `feature/learning-hub-day16` | Xong |

---

## Việc 1 — Tạo branch, kéo main

### Prompt gốc của người dùng
Yêu cầu tạo nhánh làm việc cho ngày 16 và kéo về nhánh `main` mới nhất.

### Đã làm
Checkout `main`, `git pull` (fast-forward 4 commit mới từ `origin/main`), tạo branch `feature/learning-hub-day16` từ đó.

---

## Việc 2 — Triển khai nhiệm vụ ngày 16

### Prompt gốc của người dùng
Người dùng dán nguyên văn đề bài ngày 16: thiết kế context builder tối thiểu, tạo endpoint chat theo exercise, cấm AI đưa full solution khi policy không cho phép; bàn giao AI Coach v0.1, context schema, policy tests; điều kiện nghiệm thu là không gửi hidden test cho model, câu trả lời bám bài, có logging và giới hạn token; yêu cầu cập nhật AI_WORKLOG kèm bằng chứng sử dụng AI theo đúng khung báo cáo của dự án.

### Đã làm
Khảo sát kiến trúc BE hiện có (`hint.service.ts`, `hint.controller.ts`, `hint.module.ts`, `exercise.service.ts`, các schema Mongoose liên quan, `database.module.ts`) để thiết kế module `coach` đúng convention đang dùng trong repo: quy ước đăng ký model, quy ước DTO dạng class thuần (không dùng `class-validator` vì thư viện này chưa được cài trong `package.json`), và cách `exercise.service.ts` đã lọc sẵn `isHidden` ở endpoint public — dùng làm tham chiếu cho Context Builder.

Viết `coach-context.types.ts` định nghĩa `CoachContext`: thông tin bài (title, description, difficulty, chỉ test case không ẩn), tóm tắt attempt (số lần nộp, trạng thái và số test pass lần gần nhất, đã từng AC hay chưa — không đưa code đã nộp vào context), hint đã unlock (chỉ nội dung các tầng đã mở), lịch sử hội thoại gần nhất (giới hạn 6 lượt), và object `policy` (`allowFullSolution`, `maxHintLevelUnlocked`).

Viết `coach-context.builder.ts`: truy vấn `Exercise` theo slug, lọc `testCases` giữ `!isHidden`; truy vấn `Submission` theo `exerciseId` và `userId`, chỉ lấy `status/passedCount/totalCount`, không lấy field `code`; truy vấn `HintUsage` để biết các level đã unlock, chỉ fetch nội dung `Hint` đúng các level đó bằng `level: { $in: unlockedLevels }`. Tính `policy.allowFullSolution = hasEverPassed || maxHintLevelUnlocked >= 3`.

Viết `coach-policy.ts` với hai lớp kiểm tra độc lập: `assertContextHasNoForbiddenData()` chạy trước khi gọi model, kiểm tra context không chứa chuỗi `solutionCode`; `checkCoachResponsePolicy()` chạy sau khi có response, chặn nếu response chứa khối code dài từ 6 dòng trở lên hoặc cụm từ báo hiệu đưa nguyên đáp án khi `allowFullSolution === false`.

Viết interface `LlmClient` và implementation mặc định `StubLlmClient` không gọi mạng ngoài, trả lời dựa trên dữ liệu context đã lọc sẵn. Viết `coach.service.ts`: giới hạn `MAX_PROMPT_TOKENS = 4000` (từ chối trước khi gọi model nếu vượt), giới hạn `MAX_COMPLETION_TOKENS = 800` (cắt bớt nếu vượt), ghi log mọi lượt chat (cả câu hỏi và câu trả lời) vào collection `coach_messages` mới. Tạo `POST /api/coach/chat` và `GET /api/coach/history/:userId/:exerciseSlug`, đăng ký module vào `app.module.ts` và `database.module.ts`.

Viết `coach-policy.spec.ts`, `coach-context.builder.spec.ts`, `coach.service.spec.ts` phủ các điều kiện nghiệm thu: không lộ hidden test, không lộ solutionCode, không lộ full solution khi chưa đủ điều kiện, giới hạn token, có logging.

### Quyết định của bản thân
Không cài thêm SDK AI thật vì đây là thay đổi ngoài phạm vi được giao và cần API key thật để chạy. Thiết kế `LlmClient` là một interface độc lập để khi có API key thật chỉ cần thêm một class implement cùng interface, không phải sửa Service/Controller/Policy.

### Kiểm chứng
```
cd learning-hub/BE
npx jest src/modules-api/coach --silent
# Test Suites: 3 passed, 3 total
# Tests:       18 passed, 18 total

npx tsc --noEmit -p tsconfig.json
# (không có output, không lỗi kiểu)

npm run build
# nest build — thành công, không lỗi

npx jest --silent
# Test Suites: 1 failed, 13 passed, 14 total
# Tests:       1 failed, 90 passed, 91 total
```

Test suite thất bại duy nhất (`hint.service.spec.ts`, test cooldown) xác nhận không liên quan tới thay đổi ngày 16: `git status --short src/modules-api/hint/` cho kết quả rỗng.

Khởi động `npm run start:dev` với MongoDB local đang chạy, gọi API thật: `POST /api/coach/chat` cho bài chưa nộp, chưa mở hint → từ chối đưa code đầy đủ đúng kỳ vọng. Gọi thật `POST /api/hints/unlock` mở Tầng 1, gọi lại chat → xác nhận `maxHintLevelUnlocked` cập nhật đúng từ dữ liệu thật trong `hint_usages`. Sau khi kiểm chứng, xóa dữ liệu smoke-test khỏi MongoDB local bằng `mongosh`.

---

## Việc 3 — Giải thích cơ chế AI đang dùng

### Prompt gốc của người dùng
Người dùng cho biết chưa hiểu rõ cơ chế AI Coach đang sử dụng loại model nào.

### Đã làm
Giải thích rõ: phần trả lời của Coach hiện tại không gọi model AI thật nào, mà là một class stub (`StubLlmClient`) tự ghép câu trả lời từ template dựa trên dữ liệu context, do repo chưa cài SDK AI nào và chưa có API key. Giải thích lý do thiết kế theo interface `LlmClient` để dễ thay bằng model thật sau này.

---

## Việc 4 — Giải thích lý do vẫn giới hạn token dù chưa có AI thật

### Prompt gốc của người dùng
Người dùng đặt câu hỏi: nếu hệ thống chưa thực sự gọi AI, vì sao code vẫn báo giới hạn token.

### Đã làm
Giải thích giới hạn token trong `coach.service.ts` là cơ chế hạ tầng độc lập với việc bên dưới là stub hay AI thật — dùng để giới hạn kích thước context/response, chuẩn bị sẵn cho khi cắm model thật vào (khi đó mỗi token sẽ tốn phí thật). Đây cũng là điều kiện nghiệm thu bắt buộc của đề bài ngày 16.

---

## Việc 5 — Rà soát khoảng trống dữ liệu Lesson/Exercise

### Prompt gốc của người dùng
Người dùng đặt câu hỏi: nếu dữ liệu bài tập hiện tại đã có sẵn, thì khi sau này giảng viên tạo bài tập mới qua vai trò giảng viên, Coach có còn đủ context để hoạt động không.

### Đã làm
Kiểm tra `coach-context.builder.ts` xác nhận không hardcode dữ liệu, luôn truy vấn động theo `exerciseSlug`. Kiểm tra tiếp `authoring.service.ts` phát hiện giảng viên tạo bài mới qua Authoring chỉ ghi vào collection `Lesson`, trong khi `ExerciseService`, `HintService` và `CoachContextBuilder` đều chỉ đọc từ collection `Exercise` riêng biệt, không có cơ chế đồng bộ tự động giữa hai bảng.

### Quyết định của bản thân
Không tự ý sửa trong phạm vi ngày 16 vì ảnh hưởng cả `Judge` và `Hint`, không riêng `Coach`, cần quyết định kiến trúc rộng hơn. Đặt câu hỏi lại cho người dùng về hướng xử lý (bỏ qua/thêm cơ chế đồng bộ/cho Coach đọc dự phòng từ Lesson) nhưng cuộc trao đổi chuyển hướng sang yêu cầu chạy thử dự án trước khi có quyết định cuối; ghi nhận đây là hạn chế đã biết, chưa xử lý.

---

## Việc 6 — Chạy thử dự án

### Prompt gốc của người dùng
Người dùng yêu cầu chạy dự án lên để xem trực quan qua giao diện.

### Đã làm
Khởi động đồng thời `npm run start:dev` (BE, cổng 3000) và `npm run dev` (FE, cổng 5173), xác nhận cả hai phục vụ request thành công.

---

## Việc 7 — Nối AI Coach vào giao diện

### Prompt gốc của người dùng
Sau khi chạy thử, người dùng phản hồi không thấy tính năng AI Coach ở đâu trên giao diện. Sau khi được giải thích module ngày 16 mới chỉ có backend, người dùng chọn phương án làm luôn giao diện chat thay vì chỉ kiểm tra qua gọi API.

### Đã làm
Khảo sát `HintPanel.tsx` và cách nó được nhúng trong `CodePlaygroundPage.tsx` để giữ đúng cấu trúc giao diện đã có. Viết `types/coach.ts`, `axios/coachApi.ts` theo khuôn mẫu của `hintApi.ts`. Viết `components/CoachPanel.tsx`: khung chat có lịch sử hội thoại, ô nhập, cảnh báo khi một câu trả lời bị policy chặn. Thêm tab "AI Coach" vào `CodePlaygroundPage.tsx`, cạnh các tab Output, Kết quả Test mẫu, Gợi ý đã có sẵn. Sửa `exerciseApi.ts`: `submitCode` gửi kèm `userId` mặc định `'student-demo'` giống `hintApi`, sau khi phát hiện toàn bộ submission cũ trong MongoDB local đều thiếu `userId` khiến Coach không đọc được trạng thái đã AC thật.

### Kiểm chứng
Chạy `npx tsc -b --force` ở FE, xác nhận không có lỗi kiểu liên quan tới các file vừa thêm hoặc sửa (lỗi kiểu duy nhất còn lại nằm ở `TeacherContestAuthoring.tsx`, file không bị đụng tới, xác nhận bằng `git status --short`). Test trực tiếp trên trình duyệt tại `localhost:5173`.

---

## Việc 8 — Sửa lỗi response không bám câu hỏi

### Phát hiện của người dùng
Người dùng gửi ảnh chụp màn hình: dán nguyên văn traceback lỗi Python (kèm đường dẫn file tạm trên máy) vào ô chat, Coach trả lời bằng cách lặp lại gần như nguyên văn đoạn traceback đó, không đưa ra nhận xét gì về nội dung lỗi. Người dùng nhận xét câu trả lời không bám bài và không chính xác.

### Nguyên nhân
`StubLlmClient` ghép trực tiếp một đoạn message gốc vào câu mở đầu cố định, không phân biệt được loại nội dung của message (câu hỏi bằng lời hay traceback lỗi dán nguyên văn).

### Trao đổi với người dùng
Đặt câu hỏi cho người dùng về hướng xử lý: tích hợp AI thật (cần cung cấp API key) hoặc nâng cấp stub trong giới hạn không cần AI thật. Người dùng chọn nâng cấp stub.

### Đã làm
Sửa `coach-llm.client.ts`: thêm danh sách nhận diện các loại lỗi Python phổ biến (SyntaxError, NameError, TypeError, IndexError, IndentationError) bằng so khớp mẫu trên nội dung message, trả lời đúng loại lỗi và hướng khắc phục thay vì lặp lại nguyên văn traceback. Thêm nhận diện câu hỏi xin đáp án đầy đủ. Tách `buildReply` thành các nhánh rõ ràng theo loại nội dung nhận được.

### Kiểm chứng
Viết `coach-llm.client.spec.ts` với 5 test xác nhận không còn chứa đường dẫn file tạm của traceback gốc trong response, nhận diện đúng SyntaxError và NameError, vẫn giữ đúng hành vi không lộ full solution khi chưa đủ điều kiện.

```
npx jest src/modules-api/coach --silent
# Test Suites: 4 passed, 4 total
# Tests:       23 passed, 23 total
```

Gọi lại API thật với đúng nội dung traceback trong ảnh chụp màn hình người dùng gửi, xác nhận response mới nêu đúng "thiếu dấu đóng ngoặc/quote" và hướng dẫn đếm lại dấu ngoặc, không còn chứa đường dẫn file tạm. Xóa dữ liệu smoke-test sau khi kiểm chứng.

### Giới hạn còn lại
Bản stub sau khi sửa chỉ nhận diện được các mẫu lỗi đã liệt kê sẵn trong code. Với câu hỏi tự nhiên ngoài các mẫu này, Coach vẫn chỉ trả lời theo template chung, không phân tích được nội dung như một model AI thật.

---

## Việc 9 — Đối chiếu nhiệm vụ ngày 17-19

### Prompt gốc của người dùng
Người dùng dán nguyên văn đề bài ngày 17, 18, 19 và yêu cầu đánh giá riêng cho ngày 16: hôm nay có cần API AI thật hay chưa, đồng thời nói rõ chỉ xem xét, không yêu cầu triển khai code cho các ngày tiếp theo.

### Đã làm
Đối chiếu điều kiện nghiệm thu ngày 16 với hiện trạng: kết luận ngày 16 không bắt buộc cần API AI thật, các điều kiện đã đạt được ở mức bản stub. Phân tích riêng từng ngày 17-19: ngày 17 (phân loại lỗi từ kết quả test thật) vẫn có thể làm bằng rule-based mở rộng tương tự Việc 8; ngày 18 (LLM judge chấm 100 test case theo rubric) nhiều khả năng cần model thật để đúng tinh thần đề bài; ngày 19 (sinh đề bài, ví dụ, test mới) gần như chắc chắn cần model thật vì là bài toán sinh nội dung sáng tạo, rule-based không đáp ứng được. Không thực hiện thay đổi code nào ở bước này.

---

## Việc 10 — Rà soát lại toàn bộ nhiệm vụ ngày 16 và ghi đè worklog

### Prompt gốc của người dùng
Người dùng yêu cầu kiểm tra lại nhiệm vụ ngày 16 đã hoàn thành đầy đủ chưa, xác nhận phần tài liệu có cần bổ sung gì theo yêu cầu đề bài không, và ghi đè lại AI_WORKLOG cho chính xác, đúng mẫu đã dùng ở các ngày trước, tránh dùng ngôn từ vượt quá ngữ cảnh thực tế, không dùng icon hay ký tự đặc biệt không cần thiết.

### Đã làm
Đối chiếu từng điều kiện nghiệm thu (không gửi hidden test, câu trả lời bám bài, có logging và giới hạn token) và từng sản phẩm bàn giao (AI Coach v0.1, context schema, policy tests) với thực tế đã triển khai, xác nhận đạt đầy đủ. Xác nhận đề bài ngày 16 không yêu cầu tài liệu dạng `docs/day16/*.md` như các ngày nội dung học thuật trước đó (ngày 14, 15), vì Context schema và Policy tests chính là code, không phải văn bản riêng — chỉ cần cập nhật AI_WORKLOG. Ghi đè lại toàn bộ file theo đúng cấu trúc mẫu, loại bỏ ngôn từ đánh giá quá mức, giữ nguyên các hạn chế thật đã phát hiện thay vì bỏ qua.

---

## Việc 11 — Giải thích file chứa logic trả lời

### Prompt gốc của người dùng
Người dùng đang mở file `coach-message.schema.ts` trong IDE và hỏi file nào thực sự chứa câu trả lời của Coach.

### Đã làm
Giải thích `coach-message.schema.ts` chỉ là schema Mongoose để lưu lịch sử chat, không sinh nội dung trả lời. File thực sự chứa logic sinh câu trả lời là `coach-llm.client.ts`, cụ thể trong các hàm `buildReply`, `buildErrorTracebackReply`, `buildAskingForAnswerReply`, `buildGeneralReply` của class `StubLlmClient`.

---

## Việc 12 — Tư vấn phương án tiết kiệm quota khi tích hợp AI thật

### Prompt gốc của người dùng
Người dùng hỏi: sau này khi gọi API AI thật, có thể giữ lại các nhánh nhận diện lỗi cố định để trả lời ngay mà không tốn quota gọi model hay không.

### Đã làm
Xác nhận đây là hướng hợp lý (short-circuit rule-based trước khi gọi model thật): giữ `ERROR_PATTERNS` làm bước kiểm tra đầu tiên trong implementation gọi API thật, chỉ gọi model khi không khớp mẫu nào. Giải thích lợi ích (giảm chi phí, giảm độ trễ, không cần sửa Service/Controller/Policy vì đã tách qua interface `LlmClient`) và rủi ro cần lưu ý (tránh bắt nhầm câu hỏi thật có lồng từ khóa trùng với mẫu lỗi). Không thực hiện thay đổi code, chỉ tư vấn vì việc tích hợp AI thật chưa được giao trong ngày 16.

---

## Việc 13 — Thêm nhánh trả lời khi người dùng cảm ơn

### Prompt gốc của người dùng
Người dùng yêu cầu kiểm tra lại toàn bộ code một lần nữa xem có sai sót gì không, đồng thời bổ sung nhánh xử lý khi học viên nhắn lời cảm ơn để câu trả lời tự nhiên hơn.

### Đã làm
Chạy lại `npx tsc --noEmit` và `npx jest --silent` toàn bộ backend, xác nhận không có hồi quy so với lần kiểm tra trước (95/96 test pass, lỗi duy nhất là `hint.service.spec.ts` có sẵn từ trước). Sửa `coach-llm.client.ts`: thêm `looksLikeThanks()` nhận diện lời cảm ơn ngắn (dưới 60 ký tự, kiểm tra trước các nhánh khác để tránh bị hiểu nhầm là traceback hay yêu cầu đáp án), và `buildThanksReply()` trả lời khác nhau theo trạng thái attempt (đã AC, đã từng nộp nhưng chưa qua, hay chưa từng nộp).

### Kiểm chứng
Thêm 3 test mới trong `coach-llm.client.spec.ts`, bao gồm trường hợp câu dài có chứa từ "cảm ơn" lồng trong một câu hỏi khác để xác nhận không bị nhận nhầm.

```
npx jest src/modules-api/coach --silent
# Test Suites: 4 passed, 4 total
# Tests:       26 passed, 26 total
```

Gọi lại API thật qua dev server đang chạy, xác nhận response đúng như thiết kế. Xóa dữ liệu smoke-test sau khi kiểm chứng.

---

## Việc 14 — Chia commit, đẩy lên nhánh

### Prompt gốc của người dùng
Yêu cầu commit ngắn gọn, dễ hiểu và đẩy lên nhánh `feature/learning-hub-day16`, không ghi dòng liên quan tới công cụ AI trong nội dung commit.

### Đã làm
Chia thay đổi thành 3 commit theo chủ đề: module backend AI Coach (context builder, endpoint, policy, test), phần nối giao diện Code Playground, và cập nhật AI_WORKLOG. Đẩy cả 3 commit lên nhánh từ xa `feature/learning-hub-day16`.

---

## Đối chiếu với điều kiện nghiệm thu ngày 16

| Điều kiện | Kết quả |
|---|---|
| Không gửi hidden test cho model | Đạt. Có test riêng xác nhận, cộng thêm lớp kiểm tra runtime độc lập với Context Builder |
| Câu trả lời bám bài | Đạt ở mức bản stub sau khi sửa ở Việc 8. Vẫn còn giới hạn đã ghi rõ ở Việc 8 |
| Có logging và giới hạn token | Đạt. Ghi log mọi lượt chat, có giới hạn cả token đầu vào và đầu ra |
| AI Coach v0.1 | Đạt, có cả backend và giao diện chat thật |
| Context schema | Đạt |
| Policy tests | Đạt |

Hạn chế đã biết, chưa xử lý trong phạm vi ngày 16: khoảng trống đồng bộ giữa collection `Lesson` và `Exercise` (Việc 5).

---

## Đánh giá độ tin cậy của AI trong buổi làm việc

Phần thiết kế kiến trúc ban đầu (tách Context Builder, Policy, LLM Client, Service thành các file riêng, dùng interface cho LLM Client) đúng ngay từ đầu vì bám sát cấu trúc module `hint` đã có sẵn trong repo, và các test tự viết đều pass ở lần chạy đầu.

Tuy nhiên phần chất lượng nội dung câu trả lời của Coach có lỗi thật, chỉ được phát hiện khi người dùng tự tay thao tác trên giao diện và dán một traceback lỗi thật vào ô chat — không phải qua các test đã viết trước đó, vì các test đó chỉ kiểm tra logic policy/giới hạn token bằng dữ liệu giả lập đơn giản, không mô phỏng đúng cách người dùng thật sẽ gõ.

Việc kiểm tra kiến trúc dữ liệu (khoảng trống giữa `Lesson` và `Exercise`, submission thiếu `userId`) là hai phát hiện chủ động trong lúc trả lời câu hỏi của người dùng, không phải do người dùng chỉ ra trực tiếp. Cả hai đều là hạn chế có sẵn trong hệ thống trước ngày 16, không phải lỗi phát sinh từ module Coach, nhưng ảnh hưởng trực tiếp tới độ chính xác của dữ liệu Coach sử dụng.
