# NGÀY 15 - Sinh biến thể đề có kiểm soát — Phase 1: Khảo sát (Read-only)

Người thực hiện: Tran_Quoc_Nguyen (AI hỗ trợ khảo sát). Ngày: 22/09/2026.
Kế hoạch: `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Ngày 15.
Vị trí thư mục này: `cybersoft-learning-hub/Test/Day15_Variant_Generator_Tran_Quoc_Nguyen/`.

> Phase này CHỈ ĐỌC — không sửa bất kỳ file nào trong `learning-hub/BE`, `learning-hub/FE`, hay dữ liệu seed. Mọi trích dẫn bên dưới lấy trực tiếp từ file thật trong repo (đường dẫn kèm theo), không bịa field/schema.

## 0. Lưu ý trước khi bắt đầu Phase 2

- Theo `claude/tien-do-30-ngay.md` (nhật ký nội bộ của dự án): team đã có "day15" trên GitHub main liên quan "editorials/luyện thi" (nhánh chung, DuongChiViet/Dương Chí Việt có push day15/day16 - AI Coach). Máy hiện tại **chưa** có thư mục `Test/Day15_...` nào (đã kiểm bằng `device_list_dir` trên `cybersoft-learning-hub/Test/`), nên chưa rõ nội dung "day15" trên remote có trùng phạm vi Variant Generator này không, hay là 1 tính năng khác trong `learning-hub/`.
  **Khuyến nghị:** chạy `git pull --ff-only origin main` và xem lại các commit/file liên quan "day15" trước khi bắt đầu Phase 2, để tránh làm trùng hoặc đụng file người khác đang dùng chung nhánh `main`.
- Máy hiện tại **không có `device_bash`** (chỉ có list/stage/commit file qua remote-devices), nên khảo sát Phase 1 này làm bằng cách stage từng file thật về sandbox cloud rồi đọc — không chạy được `git log`/`grep` trực tiếp trên `D:\thuctap`. Nếu cần xác nhận lịch sử git cụ thể, cần bạn tự chạy hoặc cấp thêm quyền.

## 1. Quiz / Question schema (thật, Mongoose)

**File:** `learning-hub/BE/src/modules-system/database/schemas/question.schema.ts`

| Field | Type | Ghi chú |
|---|---|---|
| content | string, required | Nội dung câu hỏi |
| codeSnippet | string, optional | Đoạn code kèm câu hỏi (không phải câu nào cũng có) |
| options | QuestionOption[], required | Mảng đáp án |
| explanation | string, required | Giải thích đáp án |
| difficulty | enum EASY/MEDIUM/HARD, default MEDIUM | |
| category | string, default 'General' | vd HTML5/CSS3/JavaScript/React/NestJS/Database/Python/Quiz Engine |
| points | number, default 10 | |
| tags | string[], default [] | |

`QuestionOption` (subdocument, `_id: false`): `key` (string, vd 'A'..'D'), `text` (string), `isCorrect` (boolean, default false).

**KHÔNG có field `id` hay `version` riêng** — Mongo tự sinh `_id` khi seed, không cố định qua các lần chạy lại seed script. Đây là điểm quan trọng cho traceability (xem mục 8.2).

## 2. Coding exercise schema (thật, Mongoose)

**File:** `learning-hub/BE/src/modules-system/database/schemas/exercise.schema.ts`

| Field | Type | Ghi chú |
|---|---|---|
| title | string, required | |
| slug | string, required, **unique** | vd `kiem-tra-so-nguyen-to` — **dùng được ngay làm sourceId ổn định** |
| description | string, required | Đề bài |
| type | enum QUIZ/CODE_BLOCK/CODE_TEXT/SQL_LAB, default CODE_TEXT | |
| difficulty | enum EASY/MEDIUM/HARD, default EASY | |
| points | number, default 10 | |
| starterCode | string, default '' | |
| solutionCode | string, optional | **Reference solution thật — dùng để tính lại đáp án** |
| timeLimitMs | number, default 2000 | |
| memoryLimitMb | number, default 128 | |
| testCases | ExerciseTestCase[], default [] | |
| tags | string[], default [] | |
| prerequisiteSlug, gradeBand, topic, orderInTopic, hints | optional | Dùng cho catalog Day14, ít liên quan Day15 |

`ExerciseTestCase` (subdocument): `input` (string, required), `expectedOutput` (string — cố ý KHÔNG required, vì `''` là output hợp lệ, xem comment gốc trong file), `isHidden` (boolean), `memoryLimitMb` (number, optional).

**Không có field `constraints`** (Day13 đã ghi nhận finding F-D13-02 về việc này) — nghĩa là "phạm vi tham số hợp lệ" (vd a ∈ 1..20) không có chỗ lưu trong schema thật; Day15 phải tự quản trong file riêng của mình, không thêm field vào BE.

## 3. Seed data (nguồn thật, trước khi vào DB)

| File | Nội dung |
|---|---|
| `BE/src/data/initial-quiz-questions.ts` | 20 câu quiz thật (interface `InitialQuestion`) — đã có bản trích sẵn `Test/Day12_Quiz_Validator_Tran_Quoc_Nguyen/tools/quiz-validator/real-content/quiz-questions.json` |
| `BE/src/data/initial-exercises.ts` | 10 bài coding Python cơ bản |
| `BE/src/data/initial-exercises-day14.ts` | 20 bài coding cho khối 6-9 (Day14) |
| `BE/src/data/seed-quiz.ts` | Script insert `INITIAL_QUIZ_QUESTIONS` vào Mongo (xóa collection cũ rồi `insertMany` — không versioning) |
| `BE/src/data/seed-exercises.ts` | Script insert `INITIAL_EXERCISES` + `INITIAL_EXERCISES_DAY14` vào Mongo |
| `BE/src/data/seed.ts` | Seed 8 bảng lõi khác (User/Course/Lesson/...), ít liên quan Day15 |

## 4. Correct answer / reference solution — cách biểu diễn thật

**Quiz:** không có field `correctAnswer` đơn lẻ như ví dụ minh họa trong kế hoạch (`Q001: correct = B`). Đáp án đúng nằm PHÂN TÁN trên từng `options[i].isCorrect`. Đã đọc `quiz.service.ts::submitAttempt` (đoạn chấm điểm): chấm điểm chỉ so `selectedOptionKey` (1 chuỗi) với ĐÚNG MỘT option có `isCorrect === true` — **BE hiện chỉ hỗ trợ single-choice thật sự**, dù `Test/Day12.../fixtures/good/multiple-correct-with-flag.json` là 1 fixture mà quiz-validator CHẤP NHẬN (không coi nhiều option `isCorrect:true` là lỗi cấp validator). Đó là 2 tầng khác nhau: validator không cấm, nhưng BE chấm bài thì chỉ đọc 1 lựa chọn.
→ Variant generator PHẢI đảm bảo đúng 1 và chỉ 1 option `isCorrect: true` mỗi câu, nếu không variant sẽ không chấm đúng khi đưa vào BE thật dù vẫn "pass" Day12 validator.

**Coding:** không có "công thức đáp án" lưu sẵn — mỗi bài chỉ có `testCases[].expectedOutput` là chuỗi hard-code theo từng input cụ thể. Việc "tính lại đáp án tự động" (điều kiện nghiệm thu #1) phải làm bằng cách CHẠY LẠI `solutionCode` (Python) trên input mới — đúng cách Day13 đã làm — không được đọc `expectedOutput` cũ rồi suy luận công thức bằng tay hoặc để AI "đoán" đáp án.

Cách BE thật chấm code (để recompute không lệch judge thật): `common/helper/code-runner.helper.ts` — chạy Python qua `child_process.spawn`, guard tĩnh chặn import/call nguy hiểm (`python-guard.helper.ts`), timeout mặc định 2000ms, cap output 64KB (`MAX_OUTPUT_BYTES`), so sánh output có `trim()` 2 đầu. `Test/Day13.../tools/coding-problem-validator/runner.js` đã mô phỏng lại đúng hành vi này (đã được Day13 kiểm chứng độc lập bằng `verify-independent.py`, khớp 100%) — **Day15 nên tái dùng `runner.js` của Day13**, không viết lại một bản recompute mới từ đầu.

## 5. Day12 Quiz Validator (quality gate có sẵn)

**Thư mục:** `Test/Day12_Quiz_Validator_Tran_Quoc_Nguyen/tools/quiz-validator/`
- CLI: `node quiz-validator.js <file|dir> [file2|dir2 ...] [--out-dir DIR] [--fail-on error|warning|never]`
- Input: mảng JSON câu hỏi đúng format seed (`content, codeSnippet?, category, difficulty, points, options[], explanation, tags`) — **không có field `id`**; report tự định danh câu hỏi bằng `<tên file>#Q<số thứ tự 1-based trong file>` (xem `quiz-validator.js`, hàm `runValidate`). Day15 nên theo đúng quy ước này cho `sourceId` quiz để đồng bộ với Day12, thay vì bịa field `id` mới.
- 23 rule `QV001-QV023` (`rules.js`): 21 rule cấp câu hỏi + 2 rule cấp file (kiểm pattern đáp án lệch vị trí trong cả file).
- Output `quality-report.json` + `quality-report.csv`, có sẵn 3 cột để trống `humanVerification / falsePositive / finalResult` cho người điền tay — Day15 nên dùng chung layout cột này cho Equivalence Checklist thay vì tự vẽ layout khác.

## 6. Day13 Coding Problem Validator (quality gate có sẵn)

**Thư mục:** `Test/Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen/tools/coding-problem-validator/`
- CLI (`coding-problem-validator.js`, gọi qua `run-all.js`), subcommand chính: `validate <dir> [--overlay FILE] [--out-dir DIR]`, `mutate <base.json> --slug SLUG --mutants FILE --mutants-out DIR [--overlay FILE]`, `probe-leak <base.json> --slug SLUG`.
- Input: mảng JSON bài đúng format `problems/base-exercises.json` (`slug, title, type, difficulty, description, starterCode, solutionCode, timeLimitMs, testCases[]`) — **`slug` chính là sourceId ổn định có sẵn**, không cần bịa thêm field.
- 19 rule `CP001-CP019` (`rules.js`), kèm `leak-guard.js` (chặn hidden test lọt vào report) và `mutation.js` (kiểm bộ test có đủ mạnh không, dùng `--mutants`). Day15 nên tái dùng `leak-guard.js` khi xuất report variant có field `isHidden`.
- `verify-independent.py` — kiểm chứng độc lập bằng Python riêng, KHÔNG dùng chung code với `runner.js`/`mutation.js`. Day15 nên copy lại đúng cách làm này cho bước "tính lại đáp án tự động", để không tự kiểm bằng chính code sinh ra đáp án đó (tránh vòng tròn).

## 7. Source đề xuất parameterize (Phase 2)

Chọn 5 source, bám đúng dữ liệu thật (không bịa), đa dạng độ khó tham số hóa — đúng gợi ý "3-5 source dễ kiểm soát" của kế hoạch:

| # | sourceId đề xuất | Loại | Vì sao chọn |
|---|---|---|---|
| 1 | `tinh-tong-hai-so-nguyen` (slug) | Coding | `a+b` đơn giản nhất, answer tính lại tức thời — tốt để chạy thử generator v0.1 đầu tiên |
| 2 | `kiem-tra-so-chan-le` (slug) | Coding | 1 tham số `n`, answer phụ thuộc `n % 2`, dễ kiểm equivalence |
| 3 | `kiem-tra-so-nguyen-to` (slug) | Coding | Đã có sẵn 16 mutant + reference + mutation report từ Day13 — tái dùng ngay để kiểm bộ test của variant mới có đủ mạnh không |
| 4 | `tim-so-lon-nhat` (slug) | Coding | Tham số là 1 DANH SÁCH số (không phải số đơn lẻ) — buộc generator xử lý được tham số dạng mảng, không chỉ số nguyên đơn |
| 5 | `initial-quiz-questions.ts#Q5` (câu `console.log(typeof typeof 1)`) | Quiz | DUY NHẤT trong 20 câu quiz thật có tính "tính được": `typeof (typeof X)` luôn là `"string"` với BẤT KỲ `X` nào → đổi literal (số/chuỗi/bool/mảng/null/undefined) vẫn giữ nguyên learning outcome ("typeof luôn trả về string") và đáp án bất biến — chứng minh được bằng quy tắc ngôn ngữ, không cần chạy code thật |

**Lưu ý về quiz:** 19/20 câu quiz thật còn lại là câu hỏi khái niệm/định danh (vd "`@Injectable()` dùng để làm gì?", "MongoDB thuộc loại CSDL nào?") — KHÔNG có tham số số học để "parameter hóa" đúng nghĩa `a ∈ 1..20` như ví dụ minh họa trong yêu cầu gốc. Với nhóm này, "variant" chỉ có thể là đổi scenario/cách diễn đạt (đúng ví dụ mục 7 trong yêu cầu gốc: "login token invalid" → "API request dùng expired credential"), KHÔNG phải parameterized theo công thức toán. Cách kiểm equivalence của 2 dạng này khác nhau nhiều: coding kiểm được tự động (chạy lại `solutionCode`), quiz khái niệm chỉ con người đọc mới phán quyết được, không tính tự động được.

## 8. Điểm chưa chắc chắn cần bạn xác nhận trước Phase 2

1. **Trùng việc với team** (mục 0) — chưa `git pull` nên chưa biết "day15" của Dương Chí Việt trên GitHub có đụng phạm vi Variant Generator này không.
2. **sourceVersion:** schema thật không có field version. Đề xuất: Day15 tự lưu 1 `source-manifest.json` (trong `Test/Day15.../`) ghi `{sourceId, sourceType, filePathThật, contentHash (sha256), sourceVersion}` — version bắt đầu `"1.0"`, chỉ tăng khi hash lệch ở lần khảo sát sau. Đây là quyết định thiết kế riêng của Day15 (không sửa BE, không bịa field trong schema thật) — cần bạn gật đầu trước khi dùng làm chuẩn cho 30 variants.
3. **Quiz chỉ single-choice thật sự** (mục 4) — nếu Phase 2 sinh quiz variant, generator PHẢI validate đúng 1 option `isCorrect: true`, kể cả khi Day12 validator không coi nhiều đáp án đúng là lỗi ERROR.
4. **Tỉ lệ quiz/coding trong 5 source** (mục 7) — chỉ có 1/5 source là quiz (và là source "may mắn" có đáp án bất biến, không đại diện cho phần lớn ngân hàng quiz thật). Cần bạn chọn: giữ 4 coding + 1 quiz như đề xuất (an toàn, dễ auto-recompute), hay đổi tỷ lệ và chấp nhận thêm quiz dạng "scenario substitution" (khó kiểm tự động hơn).
5. **Không có `device_bash` trên máy hiện tại lúc khảo sát** — Phase 2 (viết generator, chạy validator, chạy test) cần chạy Node/Python thật. Nếu máy vẫn không có `device_bash` khi bắt đầu Phase 2, sẽ phải stage code lên sandbox cloud để chạy rồi commit kết quả ngược về, thay vì chạy trực tiếp trên `D:\thuctap` như Day12/13 (khi đó rất có thể đã có shell, vì cả 2 thư mục đó có `node --test` và mutation chạy hàng loạt — khó làm nếu không có shell).

## 9. Việc CHƯA làm trong Phase 1 (đúng yêu cầu "read only")

Chưa tạo `source-manifest.json`, chưa thiết kế `variant schema`, chưa viết `Variant Generator v0.1`, chưa sinh variant nào, chưa chạy Day12/13 validator trên dữ liệu gì cả, chưa đụng tới bất kỳ file nào trong `learning-hub/`. File này là tài liệu khảo sát duy nhất được tạo trong Phase 1, nằm trong thư mục riêng của Ngày 15 (tách khỏi Day12/13) để không lẫn với các ngày trước.
