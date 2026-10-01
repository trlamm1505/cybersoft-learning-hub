# AI WORK LOG - DAY 12 (Validator đề trắc nghiệm)

## Problem statement trước AI

Theo kế hoạch (`03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`,
mục "NGÀY 12 - Validator đề trắc nghiệm"): xây `quiz_validator` bắt lỗi
đáp án và câu hỏi kém chất lượng (check số đáp án/duplicate/empty/answer
key/ambiguity flag, phát hiện pattern đáp án lệch), kèm 50 fixture tốt/xấu
và 1 quality report. Điều kiện nghiệm thu: không dùng AI làm nguồn phán
quyết duy nhất, mỗi flag có giải thích, known false positive được ghi.

Giả định/kế hoạch trước khi viết code:

- Dùng lại đúng kiến trúc của `content-lint` (Ngày 11): CLI Node.js thuần
  (không cài package ngoài), text-scan để lấy số dòng thật, rule dạng
  `{code, severity, description, fix, check()}`, report JSON/CSV. Đọc lại
  `tools/content-lint/{content-lint.js,rules.js,parsers/*}` của Ngày 11
  TRƯỚC khi viết code Ngày 12 để giữ nhất quán quy ước giữa các ngày (cùng
  1 người review sẽ thấy quen thuộc), không phải để copy nguyên - chỉ
  `text-scan.js` được tái dùng nguyên vẹn (hàm quét text thuần, không phụ
  thuộc "lesson"), còn `quiz-parser.js`/`rules.js`/`quiz-validator.js` viết
  mới hoàn toàn cho đúng schema câu hỏi trắc nghiệm.
- Trước khi thiết kế rule, phải biết ĐÚNG schema câu hỏi thật (không tự
  bịa) - đọc `cybersoft-learning-hub/learning-hub/BE/src/modules-api/quiz/
  quiz.service.ts`, `BE/src/data/initial-quiz-questions.ts`, và
  `BE/prisma/schema.prisma` trước. Phát hiện quan trọng: schema thật dùng
  Mongoose (`Question` schema riêng, không nằm trong `schema.prisma` - file
  đó chỉ có `Exercise`/`Test`/... không có `QuizQuestion`), format là
  `{content, codeSnippet?, category, difficulty, points, options:
  [{key,text,isCorrect}], explanation, tags}` - quyết định dùng ĐÚNG format
  này làm input của validator thay vì tự đặt 1 format khác, để tool chạy
  được thẳng trên seed data thật (xem mục 6 README).
- Phát hiện quan trọng thứ 2 (ảnh hưởng trực tiếp tới thiết kế rule QZ015):
  `quiz.service.ts.startAttempt()` gọi `seededShuffle()` để xáo trộn thứ tự
  option MỖI LƯỢT làm bài. Việc này nghĩa là rule "ambiguity flag" không
  chỉ nên là suy đoán chung chung ("all of the above" nghe có vẻ mơ hồ) mà
  có thể LẬP LUẬN CỤ THỂ dựa trên hành vi runtime thật của hệ thống: 1
  option "tất cả đáp án trên" chỉ đúng nghĩa nếu vị trí cố định, mà xáo trộn
  thì không đảm bảo - nên rule QZ015 được viết kèm giải thích này thay vì
  chỉ liệt kê banned pattern suông.
- Chia 20 rule thành 7 nhóm bám sát 3 gạch đầu dòng "Việc phải làm" của kế
  hoạch: Số đáp án + Duplicate + Empty (nhóm đầu, ứng với "check số đáp án,
  duplicate, empty, answer key, ambiguity flag"), Answer key + Ambiguity
  (tiếp tục cùng gạch đầu dòng đó), Pattern đáp án lệch (ứng với "phát hiện
  pattern đáp án lệch" - quyết định tách thành 2 rule CẤP FILE riêng biệt,
  QZ017 "lệch tỉ lệ" và QZ018 "lệch theo chuỗi liên tiếp", vì đây là 2 dạng
  lệch khác nhau về bản chất thống kê, gộp làm 1 rule sẽ khó viết `fix`
  message rõ ràng), Structure (bọc lại các field kỹ thuật còn thiếu).
- Chiến lược viết: viết `text-scan.js` (tái dùng) + `quiz-parser.js` trước,
  test thủ công bằng cách trích thật 30 câu hỏi từ BE
  (`extract-quiz-from-ts.js`) và parse thử - xác nhận parser chạy đúng trên
  DỮ LIỆU THẬT trước khi viết rule, để không thiết kế rule dựa trên giả định
  sai về hình dạng dữ liệu. Sau đó viết 20 rule, rồi CLI, rồi fixture bank,
  rồi test.

## Input / Output / Constraint

**Input để tham khảo:** `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`
(mục Ngày 12), toàn bộ `Day11_Content_Lint_Tran_Quoc_Nguyen/` (kiến trúc
tham chiếu), `cybersoft-learning-hub/learning-hub/BE/src/data/
initial-quiz-questions.ts` (30 câu hỏi thật, schema thật), `BE/src/
modules-api/quiz/quiz.service.ts` (hành vi runtime: xáo trộn option),
`BE/prisma/schema.prisma` (xác nhận Quiz KHÔNG dùng Prisma model).

**Output:** `quiz-validator.js` (CLI), `rules.js` (20 rule QZ001-QZ020),
`parsers/{text-scan.js,quiz-parser.js}`, report console + `quality-report.
json`/`.csv` có `file/line/path/rule/severity/message/fix`, 67 test
`node:test`, 50 fixture (`fixtures/`) + `fixtures-manifest.json`,
`real-content/` (30 câu hỏi thật trích từ BE + report chạy trên đó),
`reports/rules-catalog.json`, `reports/fixtures-run/` (bonus).

**Constraint:** không cài thêm package ngoài (chỉ module có sẵn của Node);
không sửa file input; chạy offline; không dùng dữ liệu nhạy cảm/PII thật
(seed data đào tạo, đã có sẵn trong repo cybersoft-learning-hub); không
dùng AI làm nguồn phán quyết duy nhất lúc CHẠY (chỉ dùng lúc viết code).

## AI hỗ trợ

- Đề xuất tái dùng nguyên vẹn `text-scan.js` từ Ngày 11 (hàm quét text
  thuần, generic) thay vì viết lại, và viết `quiz-parser.js` theo đúng mẫu
  `json-lesson-parser.js` nhưng thêm phần quét RIÊNG cho mảng `options`
  (mảng OBJECT lồng nhau, khác với mảng string `links` của Ngày 11) - dùng
  lại `scanArrayItems()` một lần nữa ở TẦNG CON (bên trong ranh giới của 1
  câu hỏi) để lấy đúng dòng bắt đầu của TỪNG option.
- Thiết kế 20 rule + hằng số ngưỡng (`SKEW_MIN_QUESTIONS`, `SKEW_RATIO_
  THRESHOLD`, `RUN_MIN_LENGTH`, `MAX_OPTIONS_WARN`, `MIN_EXPLANATION_LEN`)
  kèm lý do cho từng con số (vd 40% vì > 2/5 câu cùng vị trí đã là dấu hiệu
  đáng ngờ với bộ đề nhỏ; 4 câu liên tiếp vì 3 câu vẫn có thể là ngẫu nhiên
  hợp lý với xác suất ~1/9-1/16 tuỳ số option, 4 câu bắt đầu hiếm hơn đáng
  kể).
- Viết `build-fixtures.js` (script tạm, không phải deliverable) để SINH 50
  fixture một cách có hệ thống: 20 cặp good/bad near-miss theo từng rule
  (mỗi cặp chỉ khác nhau đúng 1 điểm mấu chốt - vd good-QZ002 có đúng 2
  option, bad-QZ002 có đúng 1 - để fixture thật sự kiểm được RANH GIỚI của
  rule, không chỉ trường hợp rõ ràng), 2 cặp riêng cho rule cấp file
  (QZ017/QZ018, thiết kế để KHÔNG kích hoạt chéo lẫn nhau - xem phần "con
  người kiểm chứng" bên dưới), 5 fixture good bổ sung lấy TỪ nội dung thật,
  5 fixture bad bổ sung mô phỏng lỗi kết hợp nhiều rule cùng lúc.
- Viết `tests/quiz-validator.test.js` theo đúng mẫu `content-lint.test.js`
  (Ngày 11): dùng `execFileSync` gọi CLI thật (black-box), không require
  thẳng hàm internal để test - đảm bảo test đúng cái NGƯỜI DÙNG THẬT sẽ
  chạy, không phải đường tắt qua code nội bộ. Đề xuất thêm 1 vòng lặp test
  tự động qua TOÀN BỘ `fixtures-manifest.json` (50 test riêng, mỗi fixture
  1 test) thay vì gộp chung 1 test lớn - để khi 1 fixture fail, biết ngay
  chính xác fixture nào, rule nào, không phải dò lại.

## Phần con người kiểm chứng

- Sau khi viết xong `quiz-parser.js`, **không tin ngay** parser chạy đúng -
  chủ động chạy thử trên DỮ LIỆU THẬT (`node real-content/extract-quiz-
  from-ts.js ... && node quiz-validator.js real-content/quiz-questions.json`)
  TRƯỚC khi viết fixture giả, và đọc thủ công vài dòng output đối chiếu với
  `initial-quiz-questions.ts` gốc (vd xác nhận câu hỏi đầu tiên "Thẻ HTML5
  Semantic..." đúng có đáp án `<nav>` ở vị trí index 1). Việc này phát hiện
  ngay 1 kết quả thật đáng chú ý (QZ017: 63% câu hỏi có đáp án đúng ở vị trí
  2) TRƯỚC KHI viết fixture - xác nhận rule QZ017 không chỉ chạy được trên
  dữ liệu tự bịa mà bắt được pattern thật trong seed data production.
- Sau khi viết `build-fixtures.js` và chạy sinh 50 fixture, **không tin
  ngay** các fixture "good" thật sự sạch - viết riêng `check-fixtures.js`
  (script kiểm tra độc lập, KHÔNG dùng `execFileSync` mà require thẳng
  `rules.js`+`quiz-parser.js` - một đường kiểm khác với test suite chính,
  để 2 cách kiểm tra không dùng chung 1 lỗi tiềm ẩn) chạy qua toàn bộ
  manifest. Phát hiện 3 fixture "good" không sạch thật sự:
  - `good-QZ004` (minh hoạ "2 option KHÔNG trùng") vô tình có `"HTTP"` là
    thành phần của `"HTTPS"` → kích hoạt QZ016 (substring) ngoài ý muốn.
    Sửa: đổi option sang `HTTP/SMTP/FTP` (đã kiểm tra thủ công cả 2 chiều
    không còn quan hệ substring nào).
  - `bad-QZ012` (minh hoạ "thiếu key") có text `"Có key"` là chuỗi con của
    `"Không có key"` (sau khi lowercase: "không **có key**") → kích hoạt
    thêm QZ016. Vì đây là fixture BAD nên không tính là lỗi (manifest chỉ
    yêu cầu rule MỤC TIÊU có mặt, không cấm rule khác), nhưng sửa lại text
    thành `"Đã điền key"` cho fixture rõ ràng, dễ đọc hơn khi người khác
    review sau này.
  - `bad-QZ015` ("tất cả đáp án trên") dùng option `"Java"` là chuỗi con của
    `"JavaScript"` cùng danh sách → kích hoạt thêm QZ016 không liên quan.
    Sửa: đổi `"Java"` thành `"C++"`.
  Chạy lại `check-fixtures.js`: `ALL FIXTURES OK`. Đây đúng là ví dụ thực tế
  của chính rule QZ016 mà tool đang implement - viết fixture cho rule A vô
  tình kích hoạt rule B, và chỉ script kiểm tra độc lập mới bắt được, không
  phải đọc code bằng mắt.
- Chạy `node --test tests/quiz-validator.test.js` lần đầu: **2/67 fail**.
  Tự đọc traceback, không sửa mù:
  1. `truyền 1 thư mục -> tự quét đệ quy hết file .json bên trong` kỳ vọng
     50 file nhưng CLI báo "Scanned 51 file(s)". Nguyên nhân: `fixtures-
     manifest.json` (lúc đó còn đặt TRONG `fixtures/`) tự bị `walkDir()`
     gom vào vì cũng là file `.json`. Đây là 1 lỗi thiết kế thật (không
     phải lỗi test) - đặt file catalog CÙNG thư mục với dữ liệu nó mô tả là
     sai, giống việc để 1 file README.json lẫn vào bộ dữ liệu cần lint.
     Sửa bằng cách dời `manifest.json` RA NGOÀI `fixtures/`, đổi tên thành
     `fixtures-manifest.json` đặt cạnh (không nằm trong) thư mục đó - sửa ở
     cả `build-fixtures.js` (nơi sinh ra) và `quiz-validator.test.js` (nơi
     đọc lại). Đây là quyết định fix ở THIẾT KẾ (đường dẫn file), không fix
     bằng cách thêm exception "bỏ qua file tên manifest.json" trong
     `quiz-validator.js` - vì cách đó sẽ ẩn 1 giả định ngầm là "thư mục dữ
     liệu quét bằng CLI này không bao giờ chứa file phụ trợ nào" trong khi
     thực ra CLI hoàn toàn hợp lý khi coi MỌI file `.json` trong thư mục
     được quét là dữ liệu cần kiểm tra.
  2. `file định dạng không hỗ trợ (.txt) báo lỗi rõ ràng` fail vì assert
     tìm chữ "ERROR" trong `stdout` nhưng thực ra `quiz-validator.js` in lỗi
     này ra `console.error` (tức `stderr`), không phải `stdout` - đây là
     LỖI TRONG TEST (test giả định sai kênh output), không phải lỗi CLI.
     Kiểm tra lại `main()`: nhánh `catch (err) { console.error(...) }` cho
     lỗi định dạng không hỗ trợ là ĐÚNG THIẾT KẾ (nhất quán với các lỗi
     `ERROR file not found`/`ERROR ${err.message}` khác, tất cả đều ra
     stderr qua `console.error`, chỉ finding hợp lệ mới ra `console.log`/
     stdout) - nên sửa Ở TEST (gộp `stdout+stderr` khi assert), không sửa
     CLI.
  Sau khi sửa cả 2, chạy lại: 67/67 pass. Chạy thêm **2 lần liên tiếp** để
  loại khả năng flaky do side-effect giữa các test (test ghi/xoá file tạm
  trong `tests/_tmp-*`) - cả 3 lần đều 67/67 PASS, không file tạm nào còn
  sót lại sau khi test xong (đã tự `ls tests/` kiểm tra bằng tay).
- Trước khi chốt `README.md` mục 6 (nội dung thật), tự đối chiếu lại 2 con
  số quan trọng bằng tay thay vì copy nguyên output CLI: đếm lại 19/30 câu
  có đáp án ở vị trí 1 bằng script Python riêng (không dùng lại code JS của
  chính rule QZ017, để không "tự kiểm bằng chính công cụ đang nghi ngờ") -
  khớp với con số CLI báo.

## Quyết định

Chấp nhận kiến trúc 18 rule cấp câu hỏi + 2 rule cấp file (thay vì ép tất cả
20 rule về cùng 1 shape `check(question, ctx)`) vì QZ017/QZ018 về bản chất
KHÔNG thể trả lời được nếu chỉ nhìn 1 câu hỏi - đây là quyết định thiết kế
có đánh đổi thật: code `quiz-validator.js` phức tạp hơn 1 chút (2 vòng lặp
riêng, 1 cho rule câu hỏi, 1 cho rule file) nhưng đổi lại từng rule có ý
nghĩa rõ ràng, đúng với đúng tinh thần "mỗi flag có giải thích" thay vì gò
1 rule "phát hiện pattern lệch" mơ hồ.

Chấp nhận việc QZ013 (explanation trích key sai) và QZ006 (trùng câu hỏi)
thiên về ít false positive hơn là bắt hết mọi trường hợp (xem "Giới hạn đã
biết" trong README) - lựa chọn có chủ đích, vì kế hoạch yêu cầu RÕ "mỗi flag
có giải thích" và "known false positive được ghi", tức công cụ này được
dùng làm TÍN HIỆU cho người QA đọc tiếp, không phải để tự động reject câu
hỏi - thà bỏ sót còn hơn báo oan hàng loạt khiến người dùng mất niềm tin
vào tool (bài học rút ra trực tiếp từ chính 3 fixture "good" bị báo oan ở
vòng kiểm tra fixture bank phía trên).

Không làm thêm file Excel guide (khác với Ngày 11 có `*.xlsx`) - đây là
bonus ở Ngày 11, không nằm trong bàn giao tối thiểu của kế hoạch cho Ngày
12 (`quiz_validator`, `Fixture bank`, `Quality report`), và thời gian trong
ngày ưu tiên cho việc kiểm chứng kỹ 50 fixture + 67 test hơn là làm thêm
định dạng báo cáo. Ghi nhận đây là việc có thể làm thêm nếu còn thời gian ở
ngày sau.

---

## Vòng 2 - tích hợp theo hướng dẫn điều chỉnh của mentor

### Bối cảnh

Sau khi bản v1 (20 rule `QZ001-QZ020`, 67 test) được bàn giao, mentor gửi 1
hướng dẫn điều chỉnh chi tiết (10 mục) yêu cầu: xác nhận lại schema thật
(đã làm ở vòng 1, tái xác nhận không đổi), đổi tiền tố rule thành `QV0xx`
với quy ước severity ERROR/WARNING rõ ràng, tổ chức lại fixture bank thành
`fixtures/good/` + `fixtures/bad/` với ID `FIX-0xx` và tên file mô tả, cấu
trúc thư mục `tools/quiz-validator/{quiz-validator.js,rules.js,fixtures/
{good,bad},tests/,reports/}`, output phải "explainable" (ví dụ cụ thể),
ambiguity/skew flag CHỈ được là WARNING, real-data validation chỉ chạy SAU
KHI fixture bank đã cứng, Quality Report mở rộng thêm cột con người điền
tay, AI Worklog theo mẫu cụ thể, và file Excel 8 sheet. Đồng thời, hướng
dẫn cũng chỉ ra rằng nơi bàn giao ĐÚNG là
`D:\thuctap\cybersoft-learning-hub\Test\` (repo thật, nơi Day 3/6-11 đã có
sẵn) chứ không phải thư mục gốc `D:\thuctap\` đã dùng ở vòng 1.

Hướng dẫn có kèm 1 danh sách 15 rule minh hoạ (`QV001-QV015`) nhưng ghi rõ
đây là "ví dụ, không bắt buộc viết y nguyên". Quyết định KHÔNG copy nguyên
danh sách đó và KHÔNG renumber 20 rule đã có của v1 theo đúng thứ tự liệt
kê - lý do nêu chi tiết ở mục "Quyết định" bên dưới.

### AI đề xuất

- Đổi tiền tố `QZ` → `QV` bằng `sed` trên toàn bộ mã nguồn
  (`rules.js`, `quiz-validator.js`, `parsers/quiz-parser.js`,
  `tests/quiz-validator.test.js`, `samples/*.json`) thay vì viết lại từ đầu
  - giữ nguyên 100% logic đã kiểm chứng của 20 rule cũ, giảm rủi ro tạo bug
    mới trong lúc "đổi tên".
- Thêm 3 rule MỚI (`QV021` content quá ngắn/mơ hồ, `QV022` câu hỏi gần
  trùng bằng Jaccard similarity, `QV023` option lệch độ dài bất thường) để
  che phủ đủ 3 ý mentor nêu trong bộ 15 rule minh hoạ mà bản v1 (bám sát 3
  gạch đầu dòng gốc của kế hoạch 30 ngày) chưa có.
- Viết lại hoàn toàn `build-fixtures-v2.js` (thay vì sửa script cũ) để sinh
  fixture vào `fixtures/good/`/`fixtures/bad/` với tên file mô tả
  (kebab-case, vd `missing-options.json` thay vì `bad-QZ001.json`) và ID
  `FIX-0xx` tuần tự trong `fixtures-manifest.json` - giữ manifest NGOÀI
  `fixtures/` (bài học đã rút ra từ vòng 1, xem lỗi walkDir() ở trên) và
  giữ nguyên tỉ lệ 25 good / 25 bad đã kiểm chứng ở v1 (mentor đưa ví dụ
  minh hoạ 20/30 nhưng ghi rõ đây cũng chỉ là ví dụ).
- Mở rộng schema finding trong `quiz-validator.js`: thêm `questionId`
  (`<file>#Q<n>`, không dùng field `id` vì schema thật không có field này),
  và 3 field cố ý để trống `humanVerification`/`falsePositive`/
  `finalResult` - tool CHỈ tạo SƯỜN cột, không tự điền giá trị, để không vi
  phạm "không dùng AI/tool làm nguồn phán quyết duy nhất".
- Thêm 1 test bất biến riêng khẳng định mọi rule nhóm `Ambiguity`/`Skew
  pattern` PHẢI là `severity: WARNING` - biến yêu cầu mục 6/7 của hướng dẫn
  từ "quy ước bằng lời" thành "test tự động chặn regression".

### Con người kiểm chứng (vòng 2)

- Sau khi sinh lại fixture bank bằng `build-fixtures-v2.js`, **không tin
  ngay** kết quả - viết `check-fixtures-v2.js` (bản cập nhật của
  `check-fixtures.js` ở vòng 1, đọc từ cấu trúc `fixtures/good|bad/` +
  field `fixtureId`/`name` mới) chạy độc lập qua toàn bộ 50 fixture: `ALL
  FIXTURES OK`, cả 23 rule đều có ít nhất 1 fixture bad che phủ (in ra
  danh sách `uncovered` để tự kiểm, rỗng).
- Mở bằng mắt 3 fixture bất kỳ (`good/valid-options.json`,
  `bad/missing-options.json`, `bad/near-duplicate-question.json`) đối
  chiếu với entry tương ứng trong `fixtures-manifest.json` - đúng nội dung,
  đúng targetRules, đúng ghi chú `note`.
- Chạy `node --test tests/quiz-validator.test.js` sau khi cập nhật test:
  phát hiện 1 fail thật (`--fail-on warning` kỳ vọng exit 0 cho
  `quiz-good.json`) - nguyên nhân ĐÚNG, không phải lỗi test: rule mới
  `QV023` bắt được 1 trường hợp thật trong chính `samples/quiz-good.json`
  (câu hỏi Python "từ khoá nào dùng để gán giá trị", đáp án đúng `"="` chỉ
  1 ký tự so với distractor "let"/"var"/"const" dài hơn hẳn). Đây KHÔNG
  phải lỗi ra đề (đáp án đúng thật sự chỉ là dấu `=` trong Python), nhưng
  cũng KHÔNG sửa bằng cách "làm yếu rule QV023 cho qua" - quyết định giữ
  nguyên rule, cập nhật lại kỳ vọng của test cho khớp thực tế, và ghi rõ
  đây là ví dụ THẬT của false positive đã biết vào README (mục "Giới hạn
  đã biết") thay vì giấu đi. Sau khi sửa: chạy lại 76/76 pass, lặp lại 3
  lần liên tiếp để loại flaky - cả 3 lần đều 76/76.
- Chạy `quiz-validator.js` trên TOÀN BỘ thư mục `fixtures/` (bonus, cho
  `reports/fixtures-run/`) và phát hiện rất nhiều `QV006`/`QV022` (trùng/
  gần trùng) chéo giữa các fixture GOOD - tự kiểm tra bằng cách đọc lại
  từng file: đúng như dự đoán, đây là do nhiều fixture single-purpose dùng
  chung câu hỏi placeholder mặc định. Xác nhận đây LÀ false positive DO
  CÁCH TỔ CHỨC fixture bank (không phải lỗi logic QV006/QV022), vì khi
  từng fixture được chạy ĐỘC LẬP qua CLI (đúng cách `tests/
  quiz-validator.test.js` làm) thì không hề bị nhiễu - đã ghi rõ vào README
  mục "Giới hạn đã biết" để không ai đọc nhầm số liệu
  `reports/fixtures-run/` theo nghĩa đen.
- Chạy lại `real-content/quiz-questions.json` (30 câu thật) SAU KHI xác
  nhận fixture bank + test đã ổn định hoàn toàn (đúng thứ tự mục 9 hướng
  dẫn điều chỉnh) - đối chiếu lại bằng mắt dòng 700 trong report (QV023,
  đáp án dài 1 ký tự) đúng là câu hỏi Python nói trên, không phải bug thật
  của bộ đề - xác nhận qua chính false positive đã biết ở bước test phía
  trên, không coi đây là "bug mới phát hiện trên dữ liệu thật".

### AI sai ở đâu

- Lúc mới thêm rule `QV023`, không lường trước rule mới có thể tự kích
  hoạt trên chính `samples/quiz-good.json` đã có sẵn từ v1 (v1 chỉ kiểm
  chứng file này với 20 rule cũ, chưa kiểm lại với rule mới trước khi coi
  "không đổi gì ở samples/") - đây là lỗi quy trình: thêm rule mới PHẢI
  chạy lại kiểm tra trên MỌI file mẫu đã có, không chỉ fixture mới sinh.
  Đã tự phát hiện qua chính vòng chạy test (không phải do người review chỉ
  ra), và sửa bằng cách cập nhật kỳ vọng test + ghi false positive, không
  sửa dữ liệu mẫu để "che" cho qua.
- Bản nháp đầu của `quiz-validator.js` phần mở rộng report quên thêm 3 cột
  mới (`humanVerification`/`falsePositive`/`finalResult`) vào output của
  lỗi PARSE (`QVPARSE`) - chỉ thêm vào 2 nhánh finding cấp câu hỏi/cấp file,
  bỏ sót nhánh lỗi parse riêng. Tự phát hiện khi đọc lại toàn bộ hàm
  `loadFile()`/`runValidate()` lần 2 trước khi coi là xong (không đợi test
  báo đỏ vì lúc đó chưa có file mẫu nào lỗi cú pháp trong bộ test đang chạy
  qua `--out-dir`), đã bổ sung cho nhất quán.

### Quyết định

- KHÔNG renumber 23 rule theo đúng thứ tự 15 rule minh hoạ mentor đưa (dù
  mentor có thể có dụng ý sắp xếp riêng) - mentor đã ghi rõ đây là "ví dụ,
  không bắt buộc viết y nguyên", và renumber sẽ buộc phải sinh lại toàn bộ
  50 fixture + viết lại 76 test đã kiểm chứng kỹ mà KHÔNG mang lại giá trị
  QA nào thêm (chỉ đổi số, không đổi logic). Thay vào đó đối chiếu bằng
  NHÓM lỗi (xem bảng trong README) để đảm bảo không thiếu ý nào mentor nêu.
- Giữ tỉ lệ fixture 25 good / 25 bad (không đổi theo ví dụ minh hoạ 20/30
  của mentor) vì đây cũng chỉ là ví dụ, và tỉ lệ 25/25 đã được vòng 1 kiểm
  chứng đầy đủ (mỗi rule có đúng 1 cặp good/bad near-miss) - đổi tỉ lệ mà
  không có lý do QA cụ thể sẽ chỉ tạo thêm rủi ro không cần thiết.
- Chấp nhận giữ 3 field `humanVerification`/`falsePositive`/`finalResult`
  trống trong OUTPUT của tool (không tự AI điền "gợi ý" vào 3 cột này dù kỹ
  thuật hoàn toàn làm được) - đây là ranh giới cố ý giữa "tool tạo tín
  hiệu" và "người ra quyết định cuối", đúng tinh thần điều kiện nghiệm thu
  gốc của kế hoạch 30 ngày lẫn hướng dẫn điều chỉnh mục 9.
- Chuyển toàn bộ deliverable vào `cybersoft-learning-hub/Test/
  Day12_Quiz_Validator_Tran_Quoc_Nguyen/` (repo thật) thay vì giữ ở
  `D:\thuctap\` gốc - giữ NGUYÊN bản v1 tại vị trí cũ (không xoá) và ghi rõ
  trong README/báo cáo rằng bản ở `cybersoft-learning-hub/Test/` là bản
  CHÍNH THỨC/mới nhất, tránh gây nhầm lẫn 2 bản khác nhau nếu người review
  vô tình mở nhầm thư mục cũ.
