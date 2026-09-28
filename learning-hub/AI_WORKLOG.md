# AI Work Log Ngày 19: AI hỗ trợ tạo đề có kiểm soát

## Thông tin chung

| Mục | Nội dung |
|---|---|
| Người thực hiện | Dương Chí Việt |
| Ngày | 28 tháng 9 năm 2026 |
| Nhánh | feature/learning-hub-day19 |
| Công cụ, model | Claude Code, mô hình Claude Sonnet 5, có sử dụng một subagent loại Explore để đọc kiến trúc exercise/judge trước khi thiết kế |
| Phạm vi quyền | Chỉ đọc và ghi trong thư mục learning-hub, không đụng vào thư mục Data-AI-Resource và Test |
| Dữ liệu nhạy cảm | Có một sự cố: người dùng dán nhầm một chuỗi trông giống access token OAuth (tiền tố `AQ.Ab8...`) vào chat 2 lần khi được yêu cầu lấy Gemini API key, trước khi xác nhận qua ảnh chụp màn hình đây thực chất là định dạng key Gemini hợp lệ do Google cấp (không phải OAuth token như nghi ngờ ban đầu). Đã khuyến nghị người dùng cân nhắc xoá/tạo lại key vì đã xuất hiện trong lịch sử chat; người dùng chọn dùng luôn key đó. Key được lưu trong `learning-hub/BE/.env` (đã xác nhận nằm trong `.gitignore`, không lọt vào commit) — xem Việc 7. |

## Mục lục các việc trong ngày

| Số thứ tự | Tên việc | Trạng thái |
|---|---|---|
| 1 | Tạo nhánh feature/learning-hub-day19 từ main đã cập nhật | Đạt |
| 2 | Nghiên cứu kiến trúc Exercise/Judge hiện tại trước khi thiết kế | Đạt |
| 3 | Xây dựng Problem Generator v0.1 (stub, không gọi LLM thật) | Đạt |
| 4 | Xây validator chạy reference solution qua test thật + kiểm tra trùng lặp | Đạt |
| 5 | Chạy 10 bài qua pipeline, phát hiện và sửa lỗi test case tự viết sai | Đạt |
| 6 | Sinh Validation report, xác nhận điều kiện nghiệm thu | Đạt |
| 7 | Thay stub bằng Gemini thật theo yêu cầu người dùng | Đạt |
| 8 | Thêm API cho giáo viên tự nhập, sinh nhiều bài, lưu vào ngân hàng đề | Đạt |
| 9 | Thêm chức năng chọn bài từ ngân hàng đề trong trang Soạn Thảo Bài Thi | Đạt |
| 10 | Sửa lỗi lưu bài trắc nghiệm báo thành công giả và lỗi thao tác nhầm khi đổi loại bài học | Đạt |
| 11 | Sửa lỗi hai nơi lưu dữ liệu tách biệt khiến AI Coach không thấy bài mới xuất bản | Đạt |
| 12 | Sửa lỗi chấm sai bài có phép tính số thực do sai số làm tròn | Đạt |
| 13 | Tự rà soát lại toàn bộ thay đổi trong ngày, phát hiện và ghi nhận lỗi còn sót | Đạt, còn lỗi để lại cho ngày mai |

---

## Việc 1: Tạo nhánh feature/learning-hub-day19 từ main đã cập nhật

> **Prompt người dùng:** "tạo hub day19 vào pull main về".

### Điều tôi hiểu trước khi gọi AI

Ban đầu hiểu nhầm là tự thiết kế nội dung ngày 19 dựa trên suy đoán (nhánh
day18 chưa merge main). Đã tự ý viết một file spec rỗng "chờ đề bài" — bị
người dùng từ chối ngay lập tức với phản hồi "tôi kêu gì thì làm nấy đừng
tự ý quyết định, từ từ rồi giao đề, tự ghi text hao token".

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Sau khi bị từ chối, chỉ giữ lại đúng phần việc git: `git fetch`, xác nhận
`feature/learning-hub-day18` đã merge vào `origin/main` qua PR #75,
`git checkout main && git pull` rồi `git checkout -b feature/learning-hub-day19`.
Không tạo thêm file nào cho tới khi nhận đề bài thật.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: không tự suy đoán nội dung công việc khi chưa có đề bài rõ
ràng, kể cả khi có ngữ cảnh gợi ý (worklog ngày 18 có nhắc "đã gửi đề ngày
19 để tham khảo") — phải hỏi lại thay vì tự viết placeholder tốn token.

---

## Việc 2: Nghiên cứu kiến trúc Exercise/Judge hiện tại trước khi thiết kế

> **Prompt người dùng:** Dán nguyên văn đề bài ngày 19 (AI hỗ trợ tạo đề có
> kiểm soát: tạo prompt từ learning outcome/level/constraints, sinh
> statement/examples/tests/solution sketch, chạy validator + reference
> solution trước review; bàn giao Problem generator v0.1, 10 bài qua
> pipeline, Validation report; điều kiện nghiệm thu: không publish tự động,
> reference solution pass mọi test, kiểm tra trùng lặp thủ công hoặc
> semantic) kèm đề bài ngày 20 để tham khảo trước, với yêu cầu rõ ràng
> "chỉ xem để làm 19 có lợi cho 20 tránh bị lạc nhịp chứ không code ngày
> 20", và một câu hỏi riêng: ngày 19 có cần gọi API Gemini không.

### Context, tài liệu, file, constraint đã cung cấp

Context cung cấp cho subagent Explore: toàn bộ thư mục
`modules-system/database/schemas` (Exercise, Hint, Submission),
`modules-api/judge`, `common/helper/code-runner.helper.ts`,
`common/helper/python-guard.helper.ts`, `data/seed-exercises.ts`, và
`modules-api/coach/` (để lấy convention module/LlmClient interface làm mẫu
tổ chức code).

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Chỉ dẫn chính: đọc schema Exercise, cơ chế chấm code Python thật (có sandbox
không, chạy bằng cách nào), cấu trúc hint, và convention module Coach ngày
17-18, để trả lời trực tiếp câu hỏi "ngày 19 có cần gọi Gemini chưa" bằng
bằng chứng cụ thể thay vì suy đoán, đồng thời lấy shape dữ liệu tham chiếu
cho generator.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Việc này chưa tạo file, chỉ nghiên cứu. Phát hiện quan trọng nhất được giữ
lại làm cơ sở thiết kế: `package.json` của backend không có bất kỳ SDK
Gemini/Anthropic/OpenAI nào; `StubLlmClient` (Coach, ngày 17-18) là bằng
chứng sống cho việc "chưa có LLM thật, dùng stub template" đã từng được
người dùng chấp nhận trước đó. Trả lời cho người dùng: **chưa cần gọi
Gemini ở ngày 19** — đề bài không có điều kiện nghiệm thu nào bắt buộc gọi
LLM thật, và pipeline có thể hoàn thành bằng generator dạng template +
validator chạy code thật, theo đúng mẫu Coach đã dùng.

Phát hiện phụ: `Exercise.testCases` với cờ `isHidden` chính là "examples"
(không hidden) và "test thật" (hidden) gộp chung một mảng — không có field
`examples` riêng, nên generator ngày 19 phải theo đúng quy ước này, không
tự tạo field mới. `runPythonCode()`/`checkPythonSyntax()` tại
`code-runner.helper.ts` là hàm production dùng để chấm bài học viên thật,
tái dùng được thẳng cho việc "chạy reference solution qua test" thay vì
viết lại logic chấm.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Không có lệnh kiểm thử ở bước nghiên cứu. Không phát hiện lỗi AI nào ở bước
này.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: kết luận ban đầu ở việc này ("chưa cần gọi Gemini vì đề bài
không bắt buộc") đúng về mặt điều kiện nghiệm thu, nhưng chưa đúng ý người
dùng — sau khi thấy pipeline chỉ chọn giữa 4 template cố định, người dùng
yêu cầu thẳng "cài Gemini đi chứ, làm phải cho ra hồn xíu" (xem Việc 7).
Bài học: "không bắt buộc theo đề bài" không đồng nghĩa "không nên làm" —
cần phân biệt rõ giới hạn tối thiểu của đề bài với kỳ vọng thực tế của
người dùng. Điều chưa chắc: chưa rõ khi nào ngày 20 (cá nhân hóa lộ trình)
sẽ cần tag chuẩn hóa từ exercise để tính mastery — quyết định giữ field
`tags` trên `ProblemDraft` đi thẳng theo input spec, không tự bịa thêm
taxonomy mới, để không đi trước quyết định của ngày 20.

---

## Việc 3: Xây dựng Problem Generator v0.1 (stub, không gọi LLM thật)

> **Prompt người dùng:** "cứ làm đúng bám sát theo lộ trình này" (đề bài
> ngày 19 đã dán ở Việc 2).

### Điều tôi hiểu trước khi gọi AI

Cần một pipeline: input là `ProblemSpec` (learning outcome, level,
constraints, tags), output là `ProblemDraft` đúng shape các field chính của
`Exercise` schema, sinh ra bởi một client có interface tách biệt để sau này
cắm LLM thật vào không phải viết lại phần còn lại.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Trước khi viết code, dùng công cụ hỏi người dùng để chốt 2 quyết định thiết
kế thay vì tự đoán: (1) nguồn 10 bộ input mẫu — người dùng chọn "thấy cái
nào đúng nhất thì làm"; (2) mức độ kiểm tra trùng lặp — người dùng chọn
"thấy cái nào đúng, hợp lý thì làm, tránh làm cho có mai mốt sửa lại kéo
theo sai". Tự quyết định kỹ thuật cuối cùng: 10 bộ input viết tay (không
suy ra từ exercise đã seed, để đúng bản chất sinh đề mới), kiểm tra trùng
lặp bằng so khớp text Jaccard (không giả vờ là semantic thật vì backend
không có model embedding nào cài sẵn).

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Tạo module mới `learning-hub/BE/src/modules-api/problem-generator/`, theo
đúng convention DI token + interface của `coach/` (ngày 17-18):

- `problem-generator.types.ts`: `ProblemSpec`, `ProblemDraft`,
  `ProblemDraftTestCase` — `ProblemDraftTestCase` cố tình cùng shape với
  `ExerciseTestCase` để draft có thể insert thẳng vào `exercises` sau khi
  người review duyệt, không cần chuyển đổi field.
- `problem-generator-llm.client.ts`: interface `ProblemGeneratorLlmClient`
  + `StubProblemGeneratorClient` — chọn 1 trong 4 template (vòng lặp/tổng,
  chuỗi/palindrome, danh sách, so sánh điều kiện) theo từ khóa trong
  `learningOutcome`/`tags`, không gọi mạng ngoài.
- `problem-generator-specs.ts`: 10 bộ `ProblemSpec` viết tay.

Toàn bộ giữ nguyên, không có phần nào bị loại bỏ vì đây là module hoàn toàn
mới, không thay thế logic cũ nào.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết `problem-generator-llm.client.spec.ts`: xác nhận cả 10 spec đều sinh
draft hợp lệ (có cả test visible lẫn hidden), slug duy nhất cho toàn bộ 10
spec, slug truy vết đúng về `specId` gốc.

```
npx jest problem-generator
```

3/3 test đạt ở bước này. Không phát hiện lỗi AI nào ở việc này — lỗi thật
(test case tự viết sai đáp án) chỉ lộ ra ở Việc 5 khi chạy qua validator
thật, không phải qua test đơn vị của generator.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tách riêng phần "chọn template + ghép nội dung" khỏi phần
"chạy test thật để xác nhận đúng" là đúng hướng — vì chính bước sau mới bắt
được lỗi. Điều chưa chắc: bộ 4 template hiện tại chỉ phủ được các dạng bài
cơ bản (tổng, chuỗi, danh sách, so sánh); khi có LLM thật thay stub, cần
kiểm tra lại toàn bộ logic chọn template theo từ khóa có còn phù hợp không.

---

## Việc 4: Xây validator chạy reference solution qua test thật + kiểm tra trùng lặp

> **Prompt người dùng, viết lại cho rõ ý:** Phần việc này thuộc cùng chỉ
> dẫn "cứ làm đúng bám sát theo lộ trình này" đã ghi ở Việc 3, ứng với hai
> điều kiện nghiệm thu của đề bài ngày 19: reference solution phải pass
> mọi test trước khi được xem là hợp lệ, và phải có bước kiểm tra trùng
> lặp thủ công hoặc dựa trên nội dung gần giống trước khi đưa bài vào diện
> chờ duyệt.

### Context, tài liệu, file, constraint đã cung cấp

Context: hàm `runPythonCode()`/`checkPythonSyntax()` đã có sẵn tại
`code-runner.helper.ts` (dùng chung với `judge-queue.service.ts` để chấm
bài học viên thật), và 3 nguồn exercise đã seed
(`initial-exercises.ts`, `initial-exercises-day14.ts`,
`initial-exercises-day15.ts`) làm tập đối chiếu trùng lặp.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

- `problem-duplicate-check.ts`: `findDuplicateCandidates()` — so khớp
  Jaccard trên tập từ (đã chuẩn hoá bỏ dấu, bỏ stopword tiếng Việt cơ bản)
  giữa draft mới và từng exercise đã seed, ngưỡng cảnh báo 0.5, chỉ gắn cờ
  nghi vấn chứ không tự loại bài.
- `problem-validator.ts`: `validateProblemDraft()` — gọi
  `checkPythonSyntax()` trước, nếu hợp lệ mới chạy từng `testCases[]` qua
  `runPythonCode()`, so khớp `stdout` đã trim/normalize CRLF với
  `expectedOutput`, gộp kết quả cùng `duplicateCandidates` thành
  `ValidationResult`. Trường `readyForReview` chỉ true khi vừa pass mọi
  test vừa không có nghi vấn trùng lặp.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết `problem-validator.spec.ts` với 4 trường hợp: solution đúng pass mọi
test, solution sai bị bắt ít nhất 1 test fail, solution lỗi cú pháp bị chặn
trước khi chạy test, draft trùng nội dung với bài đã seed bị gắn cờ nghi
vấn.

```
npx jest problem-validator
```

4/4 test đạt. Không phát hiện lỗi AI nào ở bước viết validator — validator
tự nó không có bug, lỗi nằm ở dữ liệu test case tự viết tay cho generator
(xem Việc 5).

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tái dùng đúng hàm production để chấm (`runPythonCode`) thay
vì tự viết logic so sánh output riêng giúp validator phản ánh đúng hành vi
chấm bài thật, không lệch pha với judge thật. Điều chưa chắc: ngưỡng 0.5
cho cảnh báo trùng lặp là ước lượng ban đầu, chưa có dữ liệu đủ lớn để hiệu
chỉnh — cần theo dõi thêm khi số lượng exercise trong catalog tăng lên.

---

## Việc 5: Chạy 10 bài qua pipeline, phát hiện và sửa lỗi test case tự viết sai

> **Prompt người dùng, viết lại cho rõ ý:** Cùng thuộc chỉ dẫn ở Việc 3,
> ứng với phần bàn giao cuối ngày của đề bài ngày 19 yêu cầu mười bài phải
> thực sự chạy qua pipeline, không phải chỉ viết code lý thuyết rồi báo
> cáo bằng lời.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Viết `run-pipeline.ts` (theo mẫu `generate-baseline-report.ts` của ngày 18:
không ghi DB, chỉ ghi file report) rồi chạy thật bằng
`npm run generate:problems` để tự kiểm chứng, không tin vào việc code "nhìn
có vẻ đúng".

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Lệnh chạy:

```
cd learning-hub/BE
npm run generate:problems
```

**Lỗi AI mắc phải, phát hiện bởi chính pipeline tự viết:** lần chạy đầu chỉ
7/10 bài pass mọi test. 3 bài (spec-01, spec-04, spec-08, cùng dùng template
"tổng chia hết cho 3 hoặc 5") có test case hidden `input=20` viết tay
`expectedOutput=119`, nhưng chạy thật ra `98`. Xác minh độc lập bằng
`python -c` tính lại tổng các số từ 1 đến 20 chia hết cho 3 hoặc 5, kết quả
đúng là 98 — sửa lại `expectedOutput` trong `problem-generator-llm.client.ts`
rồi chạy lại pipeline, đạt 10/10 bài pass mọi test.

Không tự động sửa cảnh báo trùng lặp (3/10 bài nhóm palindrome bị gắn cờ
trùng với bài `kiem-tra-palindrome` đã seed sẵn) để "làm đẹp" số liệu —
giữ nguyên vì đây đúng là hành vi validator cần có, minh chứng cơ chế kiểm
tra trùng lặp hoạt động đúng trên dữ liệu thật, không phải lỗi cần sửa.

Chạy lại toàn bộ test suite backend để xác nhận không có regression:

```
npx jest
```

Kết quả: 24/24 test suite, 202/202 test đạt.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: đây chính là giá trị cốt lõi của điều kiện nghiệm thu
"reference solution pass mọi test" — nếu không có bước chạy thật qua
validator, lỗi tính sai tay (119 thay vì 98) sẽ lọt qua và không ai phát
hiện cho tới khi học viên thật gặp phải. Thay đổi cho lần sau: mọi test
case hidden viết tay cho generator nên được tính lại bằng cách chạy thử
solution qua trình thông dịch thật ngay khi soạn, thay vì tính nhẩm.

---

## Việc 6: Sinh Validation report, xác nhận điều kiện nghiệm thu

> **Prompt người dùng, viết lại cho rõ ý:** Cùng thuộc chỉ dẫn ở Việc 3,
> ứng với hạng mục bàn giao cuối ngày thứ ba của đề bài ngày 19 là báo cáo
> kiểm chứng, để người review đọc lại kết quả mà không cần tự chạy lệnh.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

`run-pipeline.ts` xuất `reports/validation-report.json` và
`reports/validation-report.md` (bảng tổng hợp + chi tiết từng bài: cú pháp,
từng test case pass/fail, cảnh báo trùng lặp). Thêm script
`generate:problems` vào `package.json`. Viết tài liệu tham chiếu
`learning-hub/docs/day19/problem-generator-spec.md`, mô tả luồng xử lý,
giới hạn (chưa có LLM thật), và cách 3 điều kiện nghiệm thu được hiện thực
hoá trong code — theo đúng khuôn `docs/day18/coach-eval-harness-spec.md`.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Đối chiếu lại 3 điều kiện nghiệm thu của đề bài với kết quả chạy thật:

1. Không publish tự động: xác nhận bằng cách đọc lại `run-pipeline.ts`,
   không có bất kỳ lệnh gọi `ExerciseModel`/MongoDB nào.
2. Reference solution pass mọi test: 10/10 bài đạt sau khi sửa lỗi ở Việc 5.
3. Kiểm tra trùng lặp thủ công hoặc semantic: 7/10 bài không có cảnh báo,
   3/10 bài (nhóm palindrome) được gắn cờ nghi vấn đúng, chờ người review
   quyết định cuối cùng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: bàn giao "10 bài qua pipeline" không có nghĩa 10/10 bài phải
sẵn sàng publish ngay — mục đích của validator là lọc ra bài nào cần sửa
(3 bài palindrome trùng lặp) trước khi con người vào cuộc, đúng tinh thần
"human-in-the-loop" trong kiến thức nhận lại của đề bài. Điều chưa chắc:
chưa rõ ngày 20 sẽ cần những field nào từ `ProblemDraft`/`tags` để tính
mastery — nếu ngày 20 cần thêm field, nên mở rộng `ProblemSpec`/`ProblemDraft`
thay vì đổi shape hiện tại, để không phá vỡ pipeline đã chạy được.

---

## Việc 7: Thay stub bằng Gemini thật theo yêu cầu người dùng

> **Prompt người dùng:** Sau khi xem stub chỉ chọn giữa 4 template cố định
> ("nhưng mà cái này 10 bài cố sẵn thấy đề bảo tạo prompt"), người dùng yêu
> cầu "cài gemini đi chứ, làm phải cho ra hồn xíu", sau đó "thêm dùm luôn đi
> đã vibe thì biết đâu" (ý: tự thêm API key vào `.env` luôn, không cần hỏi
> lại từng bước), và "dùng model nhẹ với giới hạn token thôi để dùng được
> nhiều" khi model đầy đủ đầu tiên bị lỗi quá tải.

### Điều tôi hiểu trước khi gọi AI

Người dùng đúng: dù đề bài không bắt buộc gọi LLM thật, việc dùng thuần
template cố định khiến "10 bài qua pipeline" thực chất chỉ là 4 dạng bài
lặp lại theo từ khóa, không phản ánh đúng tinh thần "generative assessment"
của đề bài. Cần thay `StubProblemGeneratorClient` bằng một client gọi
Gemini thật, giữ nguyên interface `ProblemGeneratorLlmClient` để
`problem-validator.ts` và `run-pipeline.ts` không phải sửa.

### Sự cố cần ghi nhận: API key bị dán vào chat

Khi hỏi người dùng lấy Gemini API key tại aistudio.google.com/apikey, người
dùng dán một chuỗi bắt đầu bằng `AQ.Ab8...` vào chat. Nhận định ban đầu: đây
không đúng định dạng `AIzaSy...` quen thuộc của Gemini key cũ, nên cảnh báo
đây có thể là access token OAuth, khuyên không dùng và đề nghị thu hồi
quyền tại myaccount.google.com/permissions. Người dùng dán lại chuỗi đó
thêm 2 lần nữa kèm ảnh chụp màn hình trang "API key details" thật của
Google AI Studio (có nhãn "Gemini API Key", tên project rõ ràng) — xác nhận
đây đúng là Gemini key thật, chỉ là Google đã đổi sang định dạng tiền tố
mới `AQ.` mà nhận định ban đầu không biết tới. Đã xin lỗi vì cảnh báo nhầm.
Vẫn giữ khuyến nghị nên tạo lại key mới vì đã xuất hiện trong lịch sử chat
nhiều lần; người dùng chọn dùng luôn key cũ. Key được tự thêm vào
`learning-hub/BE/.env` (đã xác nhận trước đó nằm trong `.gitignore`), không
gõ giá trị key vào bất kỳ file code nào.

### Context, tài liệu, file, constraint đã cung cấp

Không có tài liệu ngoài. Ràng buộc tự đặt ra: không tự fallback âm thầm về
stub khi Gemini lỗi (để tránh một bài "trông như AI sinh thật" nhưng thực
chất là template giả mà không ai biết) — nếu gọi lỗi không phục hồi được,
ném lỗi rõ ràng và dừng pipeline.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

- Cài package `@google/genai` (SDK chính thức hiện tại của Google cho
  Gemini API, thay `@google/generative-ai` cũ đã deprecated).
- Tạo `problem-prompt-builder.ts`: `buildProblemPrompt(spec)` ghép learning
  outcome/level/constraints/tags thành prompt text thật — đúng nghĩa đen
  yêu cầu đề bài "Tạo prompt từ learning outcome, level, constraints", tách
  riêng để cả Gemini client lẫn validation report đều dùng chung một nguồn.
- Tạo `problem-generator-gemini.client.ts`: `GeminiProblemGeneratorClient`
  implement `ProblemGeneratorLlmClient`, dùng `responseSchema` (Structured
  Output) để ép Gemini trả JSON đúng shape thay vì tự parse text lộn xộn.
  Có `callWithRetry()` retry tối đa 3 lần, chỉ với lỗi 503 (quá tải)/429
  (rate limit) — không retry lỗi khác vì thử lại vô ích. Model đổi 2 lần
  theo phản hồi thực tế: `gemini-2.5-flash` (lỗi 404, model đã bị Google
  deprecated) → `gemini-3.8-flash` (lỗi 503 liên tục, quá tải) →
  `gemini-flash-lite-latest` theo yêu cầu người dùng dùng model nhẹ, kèm
  `maxOutputTokens=2048` để tiết kiệm quota.
- Sửa `run-pipeline.ts`: thêm `buildClient()` chọn
  `GeminiProblemGeneratorClient` khi có `GEMINI_API_KEY` trong env (đọc qua
  `dotenv.config()`), rơi về `StubProblemGeneratorClient` nếu không có key
  — để máy/CI không có key vẫn chạy được. Chạy tuần tự (không `Promise.all`)
  để không vượt rate limit khi gọi gần đồng thời. Report ghi thêm dòng
  "Generator client" và toàn bộ prompt đã dùng cho mỗi bài, để người review
  đối chiếu input với output thật.
- `StubProblemGeneratorClient` (Việc 3) được giữ nguyên, không xoá — vẫn là
  client mặc định cho toàn bộ `*.spec.ts` (để test đơn vị chạy offline,
  không tốn quota Gemini mỗi lần `npx jest`).

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Chạy `npm run generate:problems` nhiều lần, tự log lại từng lỗi thật gặp
phải thay vì chỉ báo cáo lần chạy thành công cuối cùng:

1. Lần 1 (`gemini-2.5-flash`): lỗi 404 — model đã bị Google gỡ khỏi API cho
   người dùng mới, thông báo lỗi trực tiếp đề nghị đổi sang
   `gemini-3.8-flash`.
2. Lần 2-3 (`gemini-3.8-flash`): lỗi 503 "high demand" liên tục — model
   đúng nhưng quá tải, không phải lỗi code.
3. Lần 4 (`gemini-flash-lite-latest`, chưa có retry): sinh được 3/10 bài
   (spec-01 đến spec-03) rồi dừng ở spec-04 vì 503 — xác nhận model nhẹ gọi
   được nhưng vẫn cần retry.
4. Lần 5 (sau khi thêm `callWithRetry`): chạy trọn 10/10 request thành công,
   không còn exception nào giữa chừng.

Kết quả validate 10 bài do Gemini sinh: 7/10 reference solution pass mọi
test, 0/10 bị cảnh báo trùng lặp (khác hẳn bản stub trước đó luôn dính
3/10 trùng vì lặp cùng 1 template). 3 bài fail có nguyên nhân cụ thể, đọc
trực tiếp từ report:

- spec-07: `solutionCode` Gemini trả về chứa chuỗi `\n` bị hỏng thành 2 ký
  tự literal `\` và `n` thay vì xuống dòng thật ở một số đoạn, khiến
  `checkPythonSyntax()` báo `SyntaxError: unexpected character after line
  continuation character` — bắt được TRƯỚC khi chạy test, đúng thiết kế
  validator.
- spec-08, spec-09: cú pháp hợp lệ nhưng `expectedOutput` Gemini tự tính
  không khớp kết quả thật khi chạy `solutionCode` qua `runPythonCode()` —
  đúng loại lỗi mà điều kiện nghiệm thu "reference solution pass mọi test"
  được đặt ra để chặn.

Chạy lại toàn bộ test suite backend (dùng stub, không gọi Gemini) để xác
nhận không có regression:

```
npx jest
```

Kết quả: 24/24 test suite, 202/202 test đạt — không đổi so với trước khi
thêm Gemini, vì các spec hiện có cố tình không phụ thuộc network/API key.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: validator viết ở Việc 4 (dựa hoàn toàn trên chạy code thật,
không tin nội dung LLM trả về) chứng minh giá trị rõ nhất ở chính bước này
— khi đổi từ stub sang LLM thật, tỷ lệ lỗi tăng lên (10/10 → 7/10) đúng như
dự đoán tự nhiên (LLM không đảm bảo đúng 100%), và hệ thống bắt được đúng
loại lỗi mà một pipeline sinh đề tự động cần bắt (cú pháp hỏng, sai đáp
án) — không phải sửa gì thêm ở validator, chỉ cần đổi client sinh đề. Điều
học được thứ hai, ngoài phạm vi kỹ thuật: xử lý sai một tín hiệu bảo mật
(nhận định sai định dạng key) vẫn tốt hơn bỏ qua cảnh báo, nhưng cần xác
minh bằng bằng chứng cụ thể (ảnh chụp màn hình nguồn gốc) trước khi kết
luận chắc chắn, thay vì giữ nguyên phán đoán ban đầu khi có bằng chứng mới
mâu thuẫn với nó. Điều chưa chắc: `gemini-flash-lite-latest` là model nhẹ
nhất hiện có nhưng vẫn có thể đổi tên/bị deprecate trong tương lai gần
(đã xảy ra 2 lần chỉ trong một phiên làm việc) — nên coi tên model là cấu
hình dễ đổi, không hard-code giả định nó ổn định lâu dài.

---

## Việc 8: Thêm API cho giáo viên tự nhập, sinh nhiều bài, lưu vào ngân hàng đề

> **Prompt người dùng, viết lại cho rõ ý từ nội dung trao đổi thực tế:**
> Pipeline hiện tại chỉ chạy được bằng dòng lệnh với 10 spec cố định sẵn
> trong code, giáo viên không rành kỹ thuật sẽ không dùng được. Yêu cầu bổ
> sung một giao diện cho giáo viên tự nhập learning outcome, chọn mức độ,
> nhập ràng buộc, sinh được một hoặc nhiều bài cùng lúc, xem kết quả kèm
> trạng thái kiểm tra, và có nút lưu riêng cho từng bài đạt yêu cầu vào hệ
> thống bài tập thật.

### Điều tôi hiểu trước khi gọi AI

Cần tách rõ hai việc: sinh xem trước (không đổi trạng thái hệ thống) và
lưu chính thức (ghi vào cơ sở dữ liệu thật). Việc lưu chỉ được thực hiện
khi người dùng chủ động bấm, không được tự động, và phải tự kiểm tra lại
điều kiện đạt ngay tại backend, không tin dữ liệu phía trình duyệt gửi
lên.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Thêm module backend mới gồm `problem-generator.module.ts`,
`problem-generator.controller.ts`, `problem-generator.service.ts`, và thư
mục `dto`. Route sinh bài nhận một mảng specs thay vì một spec đơn, giới
hạn tối đa mười bài một lần gọi, chạy tuần tự để không vượt giới hạn tốc
độ gọi của Gemini. Route lưu bài nhận một bản nháp, chạy lại toàn bộ kiểm
tra ở tầng backend trước khi ghi, từ chối nếu chưa đạt hoặc trùng đường
dẫn định danh với bài đã có.

Thêm trang giao diện `TeacherProblemGeneratorPage.tsx`, cho phép thêm bớt
nhiều dòng nhập liệu, hiển thị kết quả từng bài kèm danh sách trường hợp
kiểm tra đạt hay không đạt, và nút lưu riêng cho từng bài, chỉ bật khi bài
đó đã đạt điều kiện.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Gọi trực tiếp các route mới bằng lệnh gọi mạng thật với tài khoản giáo
viên có sẵn trong dữ liệu mẫu, xác nhận sinh nhiều bài trong một lần gọi
thành công, lưu một bài đạt thành công và xuất hiện ngay ở đường dẫn công
khai dành cho học viên, từ chối lưu khi bài chưa đạt hoặc khi trùng đường
dẫn định danh. Chạy toàn bộ bộ kiểm thử sẵn có của backend, không phát
sinh lỗi mới.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: tách hành động xem trước và hành động lưu thành hai lệnh
gọi riêng, cùng với việc backend tự kiểm tra lại điều kiện đạt thay vì tin
dữ liệu từ trình duyệt, là cách chắc chắn nhất để giữ đúng nguyên tắc
không tự động đưa bài chưa kiểm chứng vào hệ thống thật.

---

## Việc 9: Thêm chức năng chọn bài từ ngân hàng đề trong trang Soạn Thảo Bài Thi

> **Prompt người dùng, viết lại cho rõ ý từ nội dung trao đổi thực tế:**
> Trang Soạn Thảo Bài Thi dùng để tạo bài học cho học viên hiện chưa có
> cách nào lấy lại nội dung từ những bài đã tạo trước đó hoặc từ những bài
> sinh bằng công cụ hỗ trợ AI, mọi trường nhập liệu đều phải gõ lại từ đầu.
> Yêu cầu thêm khả năng chọn một bài có sẵn để nạp sẵn nội dung vào biểu
> mẫu soạn thảo.

### Điều tôi hiểu trước khi gọi AI

Cần một điểm truy cập backend riêng dành cho giáo viên, trả về đầy đủ nội
dung bài tập bao gồm cả lời giải và toàn bộ trường hợp kiểm tra, khác với
điểm truy cập công khai dành cho học viên vốn phải che giấu lời giải và
trường hợp kiểm tra ẩn.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Thêm route lấy chi tiết đầy đủ theo đường dẫn định danh, chỉ giáo viên gọi
được, đặt trước route công khai đã có để không bị route đó nhận nhầm.
Thêm hộp thoại chọn bài trong trang Soạn Thảo, tải danh sách bài mỗi lần
mở để luôn thấy bài mới nhất, có ô tìm kiếm theo tên hoặc đường dẫn định
danh. Chọn một bài sẽ tạo bản sao mới trong biểu mẫu, không ghi đè bài
gốc.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Xác nhận bằng lệnh gọi mạng thật rằng giáo viên xem được đầy đủ lời giải,
học viên chưa đăng nhập bị từ chối, tài khoản học viên đã đăng nhập cũng
bị từ chối. Trong lúc người dùng thử trên giao diện thật, phát hiện ô tìm
kiếm chỉ gõ được đúng một ký tự rồi mất con trỏ nhập liệu.

**Lỗi AI mắc phải:** nguyên nhân nằm ở một hàm dùng chung xử lý việc giữ
tiêu điểm bàn phím trong hộp thoại, nhận vào một hàm gọi lại để đóng hộp
thoại. Hàm gọi lại này được truyền vào dưới dạng một hàm viết tại chỗ,
nên có một giá trị mới mỗi lần thành phần cha vẽ lại. Mỗi lần gõ một ký
tự vào ô tìm kiếm, thành phần cha vẽ lại, hàm gọi lại có giá trị mới, làm
đoạn xử lý bên trong chạy lại và ép tiêu điểm bàn phím quay về phần tử
đầu tiên trong hộp thoại, không còn ở ô tìm kiếm nữa. Lỗi này vốn đã tồn
tại tiềm ẩn trong hàm dùng chung từ trước, chỉ lộ ra khi thêm ô nhập liệu
đầu tiên vào một hộp thoại dùng hàm này.

Đã sửa bằng cách giữ hàm gọi lại mới nhất trong một tham chiếu không kích
hoạt vẽ lại, để đoạn xử lý giữ tiêu điểm không còn phụ thuộc vào giá trị
hàm gọi lại thay đổi mỗi lần vẽ lại. Xác nhận lại bằng việc đọc lại đoạn
mã sau khi sửa, chưa có điều kiện kiểm thử tự động riêng cho hành vi bàn
phím này.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một hàm dùng chung được viết đúng cho các trường hợp dùng
trước đó không có nghĩa là đúng cho mọi trường hợp dùng sau này, đặc biệt
khi trường hợp mới thêm một ô nhập liệu cần giữ tiêu điểm liên tục, đây
là kiểu lỗi chỉ lộ ra khi có người dùng thật gõ liên tục, khó thấy qua
đọc mã tĩnh.

---

## Việc 10: Sửa lỗi lưu bài trắc nghiệm báo thành công giả và lỗi thao tác nhầm khi đổi loại bài học

> **Prompt người dùng, viết lại cho rõ ý từ nội dung trao đổi thực tế:**
> Trang Soạn Thảo Bài Thi khó sử dụng đối với người mới, không có cách nào
> lấy bài từ ngân hàng đề, các trường nhập liệu khi tạo bài mới đều trống,
> và đặc biệt phần tạo câu hỏi trắc nghiệm có vẻ không hoạt động được nữa.

### Điều tôi hiểu trước khi gọi AI

Yêu cầu gồm nhiều ý khác nhau, cần khảo sát kỹ trước khi kết luận đâu là
lỗi thật cần sửa và đâu là hạn chế thiết kế đã có từ trước. Dùng một tác
vụ đọc mã nguồn riêng để khảo sát toàn bộ trang Soạn Thảo Bài Thi trước
khi quyết định.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Kết quả khảo sát cho thấy phần lưu bài, khi gọi máy chủ thất bại vì bất
kỳ lý do gì như hết phiên đăng nhập, trùng đường dẫn định danh, hay mất
kết nối, đều bị bắt lỗi rồi hiển thị thông báo lưu thành công kèm chữ lưu
cục bộ, trong khi dữ liệu chỉ tồn tại tạm trong bộ nhớ trình duyệt, tải
lại trang là mất hoàn toàn. Đây chính là nguyên nhân khiến người dùng cảm
thấy phần trắc nghiệm không dùng được, vì bài tưởng đã lưu thực chất chưa
từng được ghi vào cơ sở dữ liệu.

Sửa lại để hiển thị đúng thông báo lỗi thật khi gọi máy chủ thất bại,
không còn nhánh giả vờ thành công. Áp dụng sửa tương tự cho thao tác xóa
bài.

Cũng phát hiện thêm một lỗi kỹ thuật khác trong lúc đọc mã: khi cập nhật
đáp án đúng cho câu hỏi trắc nghiệm, đoạn mã thay đổi trực tiếp vào đối
tượng dữ liệu cũ thay vì tạo bản sao mới, vi phạm nguyên tắc không thay
đổi trực tiếp trạng thái giao diện, có thể gây hành vi khó đoán khi dữ
liệu đó đang được hiển thị đồng thời ở nơi khác trên trang. Đã sửa để
luôn tạo bản sao mới ở mọi cấp dữ liệu lồng nhau.

Thêm xác nhận trước khi đổi loại bài học từ lập trình sang trắc nghiệm
hoặc ngược lại, chỉ hỏi khi đang có nội dung thật sẽ bị xóa, tránh mất dữ
liệu do bấm nhầm. Đồng thời cấp lại đường dẫn định danh mới mỗi lần đổi
loại, vì đường dẫn định danh mặc định của biểu mẫu trống dễ trùng với bài
mẫu có sẵn trong hệ thống, gây lỗi trùng khi xuất bản mà trước đây bị che
giấu bởi lỗi báo thành công giả.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Chạy toàn bộ bộ kiểm thử sẵn có của backend sau khi sửa, không phát sinh
lỗi mới. Kiểm tra lại bằng mắt phần mã đã sửa, chưa có điều kiện kiểm thử
tự động riêng cho luồng thao tác này ở phía giao diện.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: một thông báo báo thành công sai sự thật nguy hiểm hơn một
thông báo lỗi thật, vì người dùng sẽ tin tưởng và không tìm cách khác để
hoàn thành công việc, trong khi dữ liệu thực chất chưa được lưu. Không có
đủ thời gian trong ngày để tự thao tác kiểm tra trên trình duyệt thật,
việc xác nhận các sửa đổi giao diện chủ yếu dựa vào đọc lại mã nguồn sau
khi sửa và lệnh gọi mạng thật tới máy chủ, chưa phải xác nhận bằng thao
tác chuột và bàn phím trực tiếp.

---

## Việc 11: Sửa lỗi hai nơi lưu dữ liệu tách biệt khiến AI Coach không thấy bài mới xuất bản

> **Prompt người dùng, viết lại cho rõ ý từ nội dung trao đổi thực tế:**
> Sau khi tạo một bài mới bằng cách kết hợp bài sinh từ AI Tạo Đề và trang
> Soạn Thảo Bài Thi rồi xuất bản, mở bài đó trong khu vực luyện tập lập
> trình và hỏi AI Coach thì nhận được thông báo không tìm thấy bài tập.

### Điều tôi hiểu trước khi gọi AI

Cần xác định chính xác bài đang hỏi tồn tại ở đâu trong cơ sở dữ liệu
trước khi kết luận nguyên nhân, không suy đoán.

### Context, tài liệu, file, constraint đã cung cấp

Tra cứu trực tiếp trong cơ sở dữ liệu bằng đường dẫn định danh người dùng
cung cấp, xác nhận bài này tồn tại trong tập hợp bài học của trang Soạn
Thảo nhưng không tồn tại trong tập hợp bài tập mà khu vực luyện tập lập
trình và AI Coach cùng đọc.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Xác nhận nguyên nhân: hệ thống có hai nơi lưu bài tách biệt từ trước, một
nơi phục vụ trang Soạn Thảo, một nơi phục vụ khu vực luyện tập lập trình
và AI Coach. Xuất bản một bài ở trang Soạn Thảo trước đây chỉ ghi vào nơi
thứ nhất.

Thêm cơ chế đồng bộ: mỗi lần tạo mới hoặc cập nhật một bài loại lập trình
ở trạng thái đã xuất bản tại trang Soạn Thảo, tự động ghi hoặc cập nhật
bản tương ứng sang nơi thứ hai theo đường dẫn định danh. Xóa bài loại lập
trình cũng xóa theo bản tương ứng ở nơi thứ hai. Việc đồng bộ thất bại chỉ
ghi lại nhật ký lỗi, không làm hỏng thao tác chính của người dùng.

Đồng thời sửa danh sách bài hiển thị ở trang Soạn Thảo để gộp thêm những
bài chỉ tồn tại ở nơi thứ hai, ví dụ bài lưu thẳng qua AI Tạo Đề chưa từng
qua trang Soạn Thảo, để giáo viên xem và quản lý được đầy đủ từ một nơi.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Xác nhận bằng lệnh gọi mạng thật: tạo và xuất bản một bài mới, kiểm tra
ngay lập tức bài đó xuất hiện ở nơi thứ hai qua đường dẫn công khai dành
cho học viên. Cập nhật tiêu đề bài đã xuất bản, xác nhận nội dung ở nơi
thứ hai cũng đổi theo. Xóa bài, xác nhận bài biến mất ở cả hai nơi.

Trong lúc kiểm tra thêm, phát hiện thao tác cập nhật một bài chỉ tồn tại
ở nơi thứ hai, tức những bài vừa được gộp thêm vào danh sách hiển thị,
vẫn báo lỗi không tìm thấy, vì đoạn mã cập nhật chỉ tra cứu ở nơi thứ
nhất, không có phương án dự phòng như đoạn mã xóa đã có. Tái hiện được
lỗi này bằng lệnh gọi mạng thật, sau đó sửa bằng cách thêm nhánh xử lý
tương tự, xác nhận lại bằng lệnh gọi mạng thật một lần nữa cho kết quả
đúng.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi thêm một thao tác dự phòng cho một hành động, ví dụ
thao tác xóa, cần rà lại toàn bộ các hành động cùng nhóm, ví dụ thao tác
cập nhật, xem có cần thao tác dự phòng tương tự hay không, không chỉ dừng
lại ở hành động vừa được yêu cầu sửa.

---

## Việc 12: Sửa lỗi chấm sai bài có phép tính số thực do sai số làm tròn

> **Prompt người dùng, viết lại cho rõ ý từ nội dung trao đổi thực tế:**
> Một bài kiểm tra có phép cộng hai số thực bị đánh giá sai dù kết quả về
> mặt toán học là đúng, do máy tính in ra nhiều chữ số thập phân hơn giá
> trị mong đợi.

### Điều tôi hiểu trước khi gọi AI

Ban đầu định chỉ sửa phần kiểm tra của công cụ AI Tạo Đề, nhưng người
dùng chỉ ra ngay việc chỉ sửa một nơi sẽ tạo ra tình huống nguy hiểm hơn:
một bài được công cụ AI Tạo Đề duyệt đạt, nhưng khi học viên thật làm
đúng cùng cách và nộp bài, hệ thống chấm điểm chính thức lại chấm sai vì
dùng tiêu chí so sánh khác. Phải sửa đồng thời cả hai nơi dùng chung một
tiêu chí so sánh.

### Context, tài liệu, file, constraint đã cung cấp

Xác nhận cả hai nơi, hệ thống chấm điểm bài nộp thật và bộ kiểm tra của
công cụ AI Tạo Đề, trước đây đều so sánh kết quả bằng cách so từng ký tự
tuyệt đối.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Thêm một hàm so sánh dùng chung, đặt tại nơi cả hai hệ thống cùng có thể
gọi tới. Hàm so sánh theo từng dòng kết quả, nếu cả hai dòng tương ứng
đều là số hợp lệ thì so sánh bằng sai số cho phép rất nhỏ thay vì so ký
tự tuyệt đối, nếu không phải số thì vẫn so ký tự tuyệt đối như cũ. Áp
dụng hàm này ở cả hệ thống chấm bài nộp thật và bộ kiểm tra của công cụ
AI Tạo Đề.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Viết thêm các trường hợp kiểm thử riêng cho hàm so sánh mới, gồm trường
hợp hai chuỗi giống hệt nhau, hai chuỗi văn bản khác nhau thật sự, hai số
thực lệch nhau rất nhỏ do sai số làm tròn, hai số thực lệch nhau nhiều do
sai logic thật sự, kết quả nhiều dòng, số dòng không khớp, và một chuỗi
chỉ chứa chữ số nhưng không phải là số thuần túy. Toàn bộ trường hợp đều
đạt. Chạy lại toàn bộ bộ kiểm thử sẵn có của backend, không phát sinh lỗi
mới. Gọi trực tiếp trình thông dịch Python thật với các cặp số thực để
xác nhận hàm so sánh xử lý đúng trường hợp gây ra lỗi ban đầu.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: khi sửa một hành vi kiểm tra được dùng để quyết định một
bài có được đưa vào hệ thống hay không, cần luôn kiểm tra hành vi kiểm
tra đó có đang lệch với hành vi chấm điểm chính thức mà người dùng cuối
thật sự trải nghiệm hay không, hai nơi lệch nhau sẽ gây hậu quả nghiêm
trọng hơn nhiều so với việc chỉ có một nơi sai. Điều chưa chắc: mức sai
số cho phép hiện tại chưa được kiểm tra kỹ với các bài yêu cầu định dạng
đầu ra chính xác theo số chữ số, ghi nhận ở Việc 13.

---

## Việc 13: Tự rà soát lại toàn bộ thay đổi trong ngày, phát hiện và ghi nhận lỗi còn sót

> **Prompt người dùng, viết lại cho rõ ý từ nội dung trao đổi thực tế:**
> Yêu cầu kiểm tra lại toàn bộ nhiệm vụ ngày 19 cùng toàn bộ nội dung đã
> làm và đã sửa trong ngày, xem có gì sai không, việc sửa lỗi này có kéo
> theo lỗi chức năng khác không. Nếu kiểm tra ổn thì báo đã xong và chờ
> giao việc tiếp theo, không tự ý cập nhật tài liệu hay tạo commit.

### Điều tôi hiểu trước khi gọi AI

Đây là yêu cầu tự kiểm tra lại toàn diện, không phải yêu cầu sửa thêm
tính năng. Cần phân biệt rõ giữa lỗi thật cần sửa ngay vì đang chặn một
thao tác cơ bản, và lỗi cần ghi nhận lại nhưng chưa sửa vì đã hết dư địa
làm việc trong ngày.

### Chỉ dẫn chính và các vòng phản hồi quan trọng

Dùng công cụ đánh giá lại mã nguồn theo nhiều góc nhìn độc lập để giảm
thiên vị, vì tự đọc lại mã do chính mình viết trong cùng một phiên làm
việc dễ bỏ sót lỗi đã tự thuyết phục bản thân là đúng. Sau khi có danh
sách phát hiện, xác nhận lại từng phát hiện bằng cách đọc mã nguồn liên
quan hoặc gọi thử API thật, loại bỏ phát hiện không đúng thực tế, chỉ giữ
lại phát hiện đã xác nhận.

Giữa chừng, người dùng yêu cầu dừng việc tự sửa thêm, chỉ liệt kê lỗi vào
tài liệu và nhật ký công việc để dành cho ngày làm việc tiếp theo, ngoại
trừ một lỗi đã lỡ sửa xong trước khi có yêu cầu dừng.

### File hoặc diff do AI tạo, phần giữ lại, chỉnh sửa, loại bỏ và lý do

Xác nhận được tổng cộng chín phát hiện thật qua đọc mã nguồn hoặc gọi thử
API. Một phát hiện, việc cập nhật bài học báo lỗi không tìm thấy với
những bài chỉ tồn tại ở nơi lưu thứ hai, đã được sửa ngay trong lúc rà
soát vì tái hiện được cụ thể bằng lệnh gọi mạng thật và mức độ ảnh hưởng
rõ ràng, chặn hẳn một thao tác cơ bản của giáo viên. Tám phát hiện còn
lại được ghi nhận vào tài liệu tham chiếu ngày mười chín và mục này, chưa
sửa, để lại cho công việc ngày mai, gồm: hàm so sánh số thực coi nhầm hai
số nguyên khác định dạng ký tự số không ở đầu là bằng nhau, route sinh
nhiều bài không có xử lý lỗi giữa chừng khiến mất toàn bộ kết quả đã sinh
thành công trước đó, cơ chế thử lại khi gọi Gemini chỉ nhận diện đúng một
dạng lỗi tạm thời cụ thể, việc đồng bộ dữ liệu sang nơi lưu thứ hai không
kiểm tra nguồn gốc bài đã tồn tại nên có thể ghi đè nhầm, bộ kiểm tra
trùng lặp chỉ so khớp với dữ liệu mẫu tĩnh không truy vấn dữ liệu thật
đang chạy, khả năng phản hồi từ Gemini bị cắt ngang do giới hạn số lượng
token đầu ra gây lỗi phân tích cú pháp không được thử lại, và một hàm
chuyển tiêu đề thành đường dẫn định danh bị viết trùng lặp ở hai tệp mã
nguồn khác nhau.

Cũng xác nhận riêng một hành vi lỗi trả về mã năm trăm khi xóa bài học
bằng một mã định danh sai định dạng là hành vi đã tồn tại từ trước khi
bắt đầu công việc trong ngày, không phải do các thay đổi hôm nay gây ra,
nên không đưa vào phạm vi sửa của ngày mai theo yêu cầu người dùng chỉ
sửa những gì tự tay gây ra trong ngày.

### Test, metric, checklist dùng để kiểm chứng, lỗi AI mắc phải và cách phát hiện

Chạy lại toàn bộ bộ kiểm thử sẵn có của backend sau lần sửa duy nhất
trong mục này, không phát sinh lỗi mới. Với mỗi phát hiện, xác nhận bằng
một trong hai cách: đọc trực tiếp đoạn mã nguồn liên quan để xác nhận
hành vi đúng như mô tả, hoặc gọi thử hàm hay điểm truy cập liên quan bằng
dữ liệu thật để quan sát kết quả thực tế, không dừng lại ở suy đoán từ
công cụ đánh giá tự động.

### Điều học được, điều chưa chắc, thay đổi đưa vào lần sau

Điều học được: việc tự rà soát lại có hệ thống sau một ngày làm việc dài
với nhiều thay đổi phát sinh ngoài kế hoạch ban đầu tìm ra được ít nhất
một lỗi ảnh hưởng thật đến thao tác cơ bản của giáo viên, việc này xứng
đáng dành thời gian làm dù đề bài gốc của ngày không yêu cầu. Điều chưa
chắc: một số phát hiện trong danh sách tám lỗi còn lại là hệ quả hợp lý
từ đọc mã nguồn nhưng chưa được tái hiện bằng dữ liệu thật do giới hạn
thời gian và tài nguyên gọi mô hình ngôn ngữ trong ngày, cần ưu tiên tái
hiện trước khi sửa vào ngày mai để tránh sửa nhầm hướng.
