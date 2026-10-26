# Problem Generator v0.1 (Ngày 19)

Tài liệu này là nguồn tham chiếu cho Problem Generator, khớp với code thật
tại `learning-hub/BE/src/modules-api/problem-generator/`. Nếu thay đổi
template, spec mẫu hay ngưỡng trùng lặp, phải sửa ở code trước, tài liệu
này chỉ mô tả lại.

## Mục tiêu

Sinh bản nháp bài tập lập trình (statement, examples, tests, solution
sketch) từ learning outcome, level và constraints, rồi chạy validator +
reference solution trước khi con người review — không publish tự động vào
collection `exercises`.

## Giới hạn quan trọng cần biết trước khi dùng

Có 2 client cùng implement `ProblemGeneratorLlmClient`, chọn tự động trong
`run-pipeline.ts` theo việc biến môi trường `GEMINI_API_KEY` có tồn tại
trong `learning-hub/BE/.env` hay không:

- `GeminiProblemGeneratorClient` (mặc định khi có key): gọi Gemini thật
  (model `gemini-flash-lite-latest`, chọn vì nhẹ và quota free tier cao
  nhất) qua SDK `@google/genai`, dùng `responseSchema` để ép model trả JSON
  đúng shape. Có retry tối đa 3 lần cho lỗi 503 (quá tải)/429 (rate limit);
  các lỗi khác (sai key, model không tồn tại...) ném thẳng, KHÔNG tự âm
  thầm rơi về stub, để không có bài nào "trông như AI thật sinh ra" nhưng
  thực chất là template giả.
- `StubProblemGeneratorClient` (fallback khi không có key): bộ chọn 1 trong
  4 template cố định theo từ khóa trong `learningOutcome`/`tags`, không gọi
  mạng ngoài. Đây vẫn là client mặc định cho toàn bộ `*.spec.ts` (test đơn
  vị chạy offline, không tốn quota Gemini mỗi lần `npx jest`).

Cả hai cùng implement `ProblemGeneratorLlmClient` nên `problem-validator.ts`
và phần còn lại của `run-pipeline.ts` không cần biết đang dùng client nào.

## Luồng xử lý

1. `ProblemSpec` (learning outcome, level, constraints, tags) — 10 bộ viết
   tay tại `problem-generator-specs.ts`, không sinh ngẫu nhiên và không suy
   ra từ exercise đã seed sẵn, vì mục tiêu là sinh đề mới.
2. `buildProblemPrompt(spec)` (`problem-prompt-builder.ts`) ghép 4 trường
   của spec thành một prompt văn bản thật — đây là phần hiện thực hóa đúng
   nghĩa đen yêu cầu đề bài "Tạo prompt từ learning outcome, level,
   constraints". Cùng một prompt này được cả `GeminiProblemGeneratorClient`
   gửi đi lẫn `run-pipeline.ts` in vào report, để người review đối chiếu
   input đã gửi với output nhận về.
3. Client (Gemini hoặc stub) sinh `ProblemDraft` đúng shape các field chính
   của `Exercise` schema (`exercise.schema.ts`): title, description,
   difficulty, tags, starterCode, solutionCode, testCases (`isHidden`
   true/false thay cho một field "examples" riêng — đúng quy ước seed hiện
   tại, xem `initial-exercises.ts`).
4. `validateProblemDraft()` chạy `solutionCode` qua từng `testCases[]` bằng
   `runPythonCode()`/`checkPythonSyntax()` có sẵn (cùng hàm
   `judge-queue.service.ts` dùng để chấm bài học viên thật), rồi gọi
   `findDuplicateCandidates()` so khớp text (Jaccard trên tập từ của
   title+description) với toàn bộ exercise đã seed (`INITIAL_EXERCISES`,
   `*_DAY14`, `*_DAY15`).
5. `run-pipeline.ts` chạy toàn bộ 10 spec qua bước 2-4 tuần tự (không
   `Promise.all`, để không vượt rate limit Gemini), xuất
   `reports/validation-report.json` và `.md`, KHÔNG ghi gì vào MongoDB.

## Kiểm tra trùng lặp — mức thủ công có hỗ trợ text, không phải semantic thật

`findDuplicateCandidates()` chỉ là so khớp text (Jaccard trên tập từ đã bỏ
dấu, bỏ stopword), KHÔNG dùng model embedding — backend không có sẵn thư
viện embedding nào (khác phía Data-AI-Resource dùng Python). Ngưỡng cảnh
báo (`SIMILARITY_WARNING_THRESHOLD = 0.5`) chỉ gắn cờ nghi vấn vào report,
không tự động loại bài; quyết định cuối cùng "có phải trùng lặp hay không"
do người review đọc report tự quyết, đúng điều kiện nghiệm thu "kiểm tra
trùng lặp thủ công hoặc semantic" ở mức đơn giản.

## Điều kiện nghiệm thu và cách pipeline hiện thực hoá

- **Không publish tự động**: `run-pipeline.ts` chỉ ghi file report, không
  gọi tới `ExerciseModel`/MongoDB ở bất kỳ bước nào.
- **Reference solution pass mọi test**: mỗi `ValidationResult.allTestsPassed`
  yêu cầu cú pháp hợp lệ và toàn bộ `testResults[]` đều `passed`. Bài không
  đạt bị chặn ở `readyForReview=false`, không đề xuất publish. Lần chạy gần
  nhất bằng Gemini thật: 7/10 bài đạt — 1 bài bị chặn vì `solutionCode`
  Gemini trả về có chuỗi `\n` hỏng gây `SyntaxError`, 2 bài bị chặn vì
  `expectedOutput` Gemini tự tính không khớp kết quả chạy thật. Đây là bằng
  chứng validator hoạt động đúng trên LLM thật, không phải lỗi cần sửa —
  xem `reports/validation-report.md` để đọc chi tiết từng bài.
- **Kiểm tra trùng lặp thủ công hoặc semantic**: `duplicateCandidates` liệt
  kê ứng viên trùng nghi vấn; `readyForReview` chỉ true khi vừa pass test
  vừa không có ứng viên trùng lặp. Lần chạy gần nhất bằng Gemini thật:
  0/10 bài bị gắn cờ (khác bản stub cũ luôn dính 3/10 vì lặp cùng 1
  template palindrome).

## Cấu hình Gemini API key

Thêm `GEMINI_API_KEY=<key>` vào `learning-hub/BE/.env` (đã có sẵn trong
`.gitignore` của `learning-hub/`, không lọt vào git). Lấy key miễn phí tại
aistudio.google.com/apikey. Không có key → pipeline tự động rơi về
`StubProblemGeneratorClient`, vẫn chạy được nhưng chỉ sinh 4 dạng bài cố
định.

## Cách chạy thủ công

```
cd learning-hub/BE
npx jest problem-generator problem-validator
npm run generate:problems
```

Lệnh đầu chạy test đơn vị cho generator và validator (luôn dùng stub, không
gọi Gemini, không cần key). Lệnh sau chạy pipeline thật, sinh lại validation
report tại `src/modules-api/problem-generator/reports/` — dùng Gemini nếu
có `GEMINI_API_KEY`, dùng stub nếu không.

## Mở rộng thêm trong ngày: API cho giáo viên và lưu vào ngân hàng đề

Sau khi hoàn thành pipeline CLI theo đúng đề bài, người dùng yêu cầu thêm
khả năng cho giáo viên tự nhập learning outcome qua giao diện, sinh nhiều
bài cùng lúc, và lưu bài đạt vào catalog thật cho học viên dùng.

Backend thêm module `ProblemGeneratorModule` (`problem-generator.module.ts`,
`problem-generator.controller.ts`, `problem-generator.service.ts`, thư mục
`dto/`), expose hai route, cả hai chỉ TEACHER gọi được:

- `POST /api/problem-generator/generate` nhận mảng specs (tối đa 10),
  sinh tuần tự qua cùng client (Gemini hoặc stub) và cùng validator như
  pipeline CLI, không ghi DB.
- `POST /api/problem-generator/save` nhận một draft, chạy lại validator ở
  tầng service (không tin kết quả do client tự gửi lên), chỉ ghi vào
  `exercises` khi `readyForReview` true và slug chưa tồn tại.

Frontend thêm trang `TeacherProblemGeneratorPage.tsx` (route
`/problem-generator`, tab "AI Tạo Đề" trong thanh điều hướng giáo viên),
cho nhập nhiều spec, xem kết quả kèm từng test case pass/fail, và bấm lưu
riêng cho từng bài đạt.

Đồng thời tạo route `GET /api/exercises/:slug/full` (chỉ TEACHER) trả về
đầy đủ `solutionCode` và toàn bộ testCases không lọc hidden, dùng cho nút
"Chọn từ Ngân hàng đề" mới thêm trong trang Soạn Thảo Bài Thi
(`TeacherAuthoringPage.tsx`), cho phép nạp một bài đã có sẵn trong
`exercises` vào form soạn thảo thay vì gõ lại từ đầu.

## Vấn đề phát sinh và cách xử lý trong ngày

Trong lúc kiểm tra tính năng mới, phát hiện AI Coach báo "Không tìm thấy
bài tập" với một bài vừa tạo qua Soạn Thảo. Nguyên nhân: hệ thống có hai
nơi lưu bài tách biệt, `lessons` (Soạn Thảo Bài Thi ghi vào) và `exercises`
(Code Playground, AI Coach đọc từ đây). Xuất bản một lesson chỉ ghi vào
`lessons`, không có gì đồng bộ sang `exercises`.

Đã thêm cơ chế đồng bộ trong `AuthoringService`: khi tạo mới hoặc cập nhật
một lesson loại lập trình ở trạng thái published, tự động upsert bản tương
ứng vào `exercises` theo slug. Xóa lesson loại lập trình cũng xóa theo bản
đồng bộ bên `exercises`. Đồng thời sửa `findAll()` để trang "Xem Các Bài
Thi" hiển thị gộp cả bài chỉ tồn tại trong `exercises` (ví dụ bài lưu thẳng
qua AI Tạo Đề, chưa từng qua Soạn Thảo), đánh dấu nguồn bằng field
`sourceCollection`.

Trong lúc kiểm tra tiếp, phát hiện thêm việc so sánh output tuyệt đối theo
chuỗi khiến bài có phép tính số thực bị chấm sai dù logic đúng, do sai số
làm tròn nhị phân tự nhiên của Python (ví dụ 0.1 cộng 0.2 in ra
0.30000000000000004). Đã thêm hàm `outputsMatch()` trong
`code-runner.helper.ts`, so khớp từng dòng, chấp nhận sai lệch nhỏ giữa hai
số thực thay vì so chuỗi tuyệt đối, áp dụng cho cả validator AI Tạo Đề và
hệ thống chấm bài học viên thật để hai nơi dùng chung một tiêu chí đúng
sai.

## Lỗi phát hiện khi tự rà soát lại, để lại cho công việc ngày mai

Sau khi hoàn thành các mục trên, tự rà soát lại toàn bộ thay đổi trong
ngày bằng công cụ review đa góc nhìn. Các lỗi dưới đây đã được xác nhận là
có thật qua đọc code hoặc gọi thử API, chưa sửa, để lại cho ngày làm việc
tiếp theo.

1. `updateLesson` trong `authoring.service.ts` ban đầu chỉ tìm theo
   `lessonModel`, không có phương án dự phòng sang `exerciseModel`. Một
   bài chỉ tồn tại trong `exercises` (ví dụ lưu qua AI Tạo Đề, được gộp
   hiển thị trong trang Library nhờ thay đổi ở `findAll()`) khi giáo viên
   bấm sửa sẽ nhận lỗi 404, dù giao diện hiển thị y hệt một bài sửa được
   bình thường. Đã tái hiện được bằng cách gọi API thật và đã sửa ngay
   trong ngày bằng cách thêm nhánh xử lý tương tự `deleteLesson`.

2. Hàm `outputsMatch()` mới thêm coi hai chuỗi số nguyên khác định dạng là
   bằng nhau nếu giá trị số học trùng nhau, ví dụ `"007"` và `"7"` được
   xem là khớp. Điều này đúng cho bài tính toán số thực nhưng sai cho bài
   có yêu cầu định dạng đầu ra cụ thể như số có số không ở đầu. Đã xác
   nhận bằng cách gọi trực tiếp hàm với hai chuỗi này. Cách sửa dự kiến:
   chỉ áp dụng so sánh bằng sai số nhỏ khi chuỗi có dấu chấm thập phân
   hoặc ký hiệu khoa học, số nguyên thuần vẫn so chuỗi tuyệt đối như cũ vì
   số nguyên trong Python không có sai số làm tròn.

3. Route `POST /api/problem-generator/generate` trong
   `problem-generator.controller.ts` gọi thẳng `generateMany()` không có
   khối try catch. Vì hàm sinh tuần tự và chỉ trả kết quả sau khi toàn bộ
   vòng lặp hoàn tất, nếu một spec giữa danh sách gọi Gemini lỗi, toàn bộ
   kết quả của các spec đã sinh thành công trước đó bị mất, người dùng chỉ
   nhận được lỗi máy chủ chung chung thay vì kết quả từng phần.

4. Hàm `callWithRetry()` trong `problem-generator-gemini.client.ts` nhận
   diện lỗi tạm thời cần thử lại bằng cách so khớp chuỗi lỗi với mẫu
   `"code": 503` hoặc `"code": 429`. Lỗi mạng không có hình dạng JSON như
   vậy, ví dụ mất kết nối hay hết thời gian chờ ở tầng mạng, sẽ không được
   nhận diện là có thể thử lại, khiến cơ chế thử lại ba lần chỉ có tác
   dụng với một loại lỗi cụ thể.

5. Hàm `syncPublishedCodingLessonToExerciseBank()` trong
   `authoring.service.ts` cập nhật vào `exercises` theo slug mà không kiểm
   tra bài đó đến từ đâu. Nếu một lesson được xuất bản với slug trùng một
   bài đã tồn tại sẵn trong `exercises` do nguồn khác tạo ra, ví dụ một
   bài đã lưu qua AI Tạo Đề, nội dung solutionCode và testCases của bài đó
   sẽ bị ghi đè mà không có cảnh báo nào.

6. `findDuplicateCandidates()` trong `problem-duplicate-check.ts` chỉ so
   khớp với ba tệp dữ liệu mẫu tĩnh nạp một lần lúc khởi động, không truy
   vấn trực tiếp collection `exercises` đang chạy thật. Một bài vừa được
   giáo viên khác lưu qua AI Tạo Đề sẽ không được tính vào danh sách đối
   chiếu trùng lặp cho các lần sinh sau, khiến cơ chế kiểm tra trùng lặp
   suy giảm dần khi catalog thật lớn lên.

7. Với cấu hình `maxOutputTokens` hiện tại là 2048, nếu Gemini trả về nội
   dung bị cắt ngang do vượt giới hạn token, phản hồi vẫn có mã trạng thái
   thành công nhưng nội dung JSON không hợp lệ, dẫn tới lỗi phân tích cú
   pháp. Trường hợp này không khớp mẫu lỗi 503 hoặc 429 nên không được thử
   lại, dễ xảy ra hơn với bài mức khó có solution và nhiều test case dài.

8. Hàm chuyển tiêu đề thành slug được viết trùng lặp nguyên văn ở cả
   `problem-generator-gemini.client.ts` và `problem-generator-llm.client.ts`
   thay vì dùng chung một hàm. Nếu sau này cần sửa cách sinh slug, dễ sửa
   một nơi mà quên nơi còn lại.

Ngoài ra, khi kiểm tra riêng lỗi máy chủ trả về mã năm trăm cho yêu cầu
xóa bài học với một mã định danh không đúng định dạng, xác nhận đây là
hành vi đã có từ trước, không phải do thay đổi trong ngày gây ra, nên
không sửa trong phạm vi hôm nay.
