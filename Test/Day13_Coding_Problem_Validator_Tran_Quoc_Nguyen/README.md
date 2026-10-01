# Ngày 13 - Validator bài coding và test case (Tran_Quoc_Nguyen)

Kế hoạch tham chiếu: `03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Tuần 3, Ngày 13.
Vị trí chính thức: `cybersoft-learning-hub/Test/Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen/`.

**Mục tiêu:** bảo đảm statement, constraints và test case của bài coding nhất quán; reference solution luôn AC;
đo độ mạnh của bộ test bằng mutation testing; kiểm timeout và output format; không làm lộ hidden test.

Ngày 11 kiểm bài học, Ngày 12 kiểm quiz, **Ngày 13 kiểm bài coding và độ mạnh của bộ test**.

## 1. Kết quả một dòng

| Hạng mục | Kết quả |
|---|---|
| Dữ liệu thật đã kiểm | 30 bài Code Playground trong BE (`initial-exercises.ts` 10 bài + `initial-exercises-day14.ts` 20 bài) |
| Reference solution | **30/30 AC** (0 ERROR sau khi rà false positive, 27 WARNING thật) |
| Bài làm mutation | *Kiểm tra số nguyên tố* (16 mutant, bài chính) và *Sắp xếp tăng dần* (12 mutant, bài đối chiếu) |
| Mutation score, **test gốc** trong BE | Số nguyên tố **66.7% (FAIL, ngưỡng 80%)**; Sắp xếp **90.9% (PASS)** |
| Mutation score, **test đã bổ sung (hardened)** | Số nguyên tố **100%**; Sắp xếp **100%** |
| Timeout | Mutant O(n) / O(n^2) bị bắt bằng TIMEOUT khi có test lớn; test vòng lặp vô hạn bị kill đúng hạn |
| Hidden test | Không có trong report (3 lớp bảo vệ, có test); **tìm thấy 2 đường lộ trong BE, cần xác nhận**: stderr của hidden test và `hints.hint3` (mục 8) |
| Test tự động | `node --test tests/coding-problem-validator.test.js` - **45/45 pass** |

Điểm cần đọc kỹ: điều kiện nghiệm thu "≥ 80% mutant bị bắt" **không đạt trên bộ test gốc của bài số nguyên tố**.
Đó là *phát hiện*, không phải lỗi của tool: 5 mutant sống sót chỉ ra 4 nhóm lỗ hổng độ phủ thật (mục 6). Bộ test bổ sung
`problems-hardened/overrides.json` đưa score lên 100%, **nhưng chưa được áp vào seed data của BE** (chờ mentor quyết định).

## 2. Cấu trúc thư mục

```
Day13_Coding_Problem_Validator_Tran_Quoc_Nguyen/
├── README.md  AI_WORKLOG.md  DAY13_REPORT.md  Day13_Quality_Report.xlsx
└── tools/coding-problem-validator/
    ├── coding-problem-validator.js   CLI: validate | mutate | probe-leak
    ├── rules.js                      19 rule CP001-CP019
    ├── runner.js                     judge mini mô phỏng judge thật của BE
    ├── mutation.js                   áp mutant, chấm, tính score, coverage report
    ├── leak-guard.js                 chốt chặn không cho hidden test lọt vào report
    ├── parsers/                      problem-loader.js (lấy số dòng thật), text-scan.js (dùng lại từ Ngày 11-12)
    ├── real-content/                 extract-exercises-from-ts.js (trích bài thật từ BE .ts -> JSON), check-hint3-equals-solution.js (F-D13-08)
    ├── problems/                     base-exercises.json (10), day14-exercises.json (20)  <- dữ liệu thật
    ├── problems-hardened/            build-overrides.js + overrides.json (test QA đề xuất thêm, overlay)
    ├── mutants/                      kiem-tra-so-nguyen-to.json (16), sap-xep-tang-dan.json (12)
    ├── solutions/reference/          reference solution của 2 bài (để đọc)
    ├── solutions/mutants/<slug>/     mã Python của từng mutant (MUT-01.py ...) để mở ra xem
    ├── fixtures/{good,bad}/          25 fixture (19 bad, 6 good) + fixtures-manifest.json
    ├── tests/coding-problem-validator.test.js      45 test node:test
    ├── verify-independent.py         kiểm chứng độc lập bằng Python (không dùng chung code với JS)
    ├── run-all.js                    chạy lại toàn bộ quy trình + sinh lại mọi report
    └── reports/                      validate-*, mutation-*, probe-leak
```

## 3. Cách chạy

Yêu cầu: Node.js (không cần cài package) và **Python 3 trong PATH** (giống judge thật). Trên Windows tool tự dùng
`%LOCALAPPDATA%\Python\bin\python.exe` nếu có (giống `code-runner.helper.ts`), hoặc truyền `--python <đường dẫn>`.

```bash
cd tools/coding-problem-validator

# Chạy lại TẤT CẢ (validate, 4 lượt mutation, probe-leak, kiểm chứng độc lập, 45 test) - khoảng 1-2 phút
node run-all.js

# Hoặc từng bước
node coding-problem-validator.js validate problems --out-dir reports/validate-baseline
node coding-problem-validator.js mutate problems/base-exercises.json --slug kiem-tra-so-nguyen-to \
     --mutants mutants/kiem-tra-so-nguyen-to.json --mutants-out solutions/mutants/kiem-tra-so-nguyen-to \
     --out-dir reports/mutation-prime-baseline
node coding-problem-validator.js mutate problems/base-exercises.json --slug kiem-tra-so-nguyen-to \
     --mutants mutants/kiem-tra-so-nguyen-to.json --overlay problems-hardened/overrides.json \
     --out-dir reports/mutation-prime-hardened

node --test tests/coding-problem-validator.test.js
```

Nếu bài trong BE đổi, chạy lại `node real-content/extract-exercises-from-ts.js` (mặc định đọc `../learning-hub/BE/src/data` tính từ repo).

Exit code: `0` ok, `1` có ERROR (validate) hoặc score < ngưỡng (mutate), `2` sai cách dùng, `3` reference không AC (mutation **dừng**),
`4` phát hiện hidden test lọt vào report (**không ghi file**).

## 4. Dữ liệu thật và judge thật

Format bài = đúng model `Exercise` trong `BE/src/modules-system/database/schemas/exercise.schema.ts`:
`slug, title, description, difficulty, starterCode, solutionCode, timeLimitMs, testCases[{input, expectedOutput, isHidden}]`.
Ngôn ngữ: Python 3. Hiện **schema chưa có trường `constraints`** - nên chưa thể có ràng buộc dạng cấu trúc trong DB; overlay hardened dùng
`constraintsText`/`constraints` như đề xuất.

`runner.js` mô phỏng đúng `code-runner.helper.ts` + `python-guard.helper.ts` + `judge-queue.service.ts`:

- `python -I -B -X utf8`, cwd tạm, env chỉ còn `PATH`; guard chặn `import os/sys/...` và `open/eval/exec...` (bản JS của guard nằm trong `runner.js`).
- Timeout cứng = `timeLimitMs`, quá hạn `SIGKILL` -> TLE; `py_compile` trước khi chạy -> CE.
- So sánh `stdout.replace(CRLF, LF).trim() === expected.replace(CRLF, LF).trim()`.
- Trạng thái tổng = trạng thái của test **fail cuối cùng** (đúng như BE, xem F-D13-07 trong `DAY13_REPORT.md`).
- Stdout bị cắt ở **64KB**, giống BE (dẫn tới phát hiện F-D13-05).

Khác BE đúng 1 chỗ, có chủ đích: kết quả hidden test chỉ giữ `{index, hiddenIndex, passed, kind, timeMs}`.

## 5. 19 rule (CP001-CP019)

CP001-CP010 đúng theo kế hoạch Ngày 13; CP011-CP019 bổ sung sau khi đọc dữ liệu thật. Mỗi rule có `severity`, `fix`; report ghi
`file:dòng` thật. Ba cột `humanVerification / falsePositive / finalResult` trong CSV **cố ý để trống** cho con người điền.

| Rule | Mức | Kiểm gì |
|---|---|---|
| CP001 | ERROR | Thiếu/quá ngắn đề bài |
| CP002 | WARNING | Đề không có ràng buộc số học (cận trên/dưới) |
| CP003 | ERROR | Không có sample test |
| CP004 | ERROR | Test thiếu `input`/`expectedOutput` (chuỗi rỗng `""` là hợp lệ) |
| CP005 | ERROR | Không có reference solution |
| CP006 | ERROR | Reference **không AC** trên chính bộ test (dừng mutation) |
| CP007 | ERROR | `timeLimitMs` sai/thiếu/≤0; cảnh báo nếu >10000ms, <500ms, hoặc reference chạy >50% limit |
| CP008 | ERROR | Output mâu thuẫn đề: nhãn thừa ("Result: 10"), sai tập giá trị đề nêu ("YES"/"NO"), nhiều dòng khi đề bảo một dòng |
| CP009 | ERROR | Không có hidden test |
| CP010 | ERROR | Test ngoài miền đề ("nguyên dương", "không âm", "chữ cái thường", constraints khai báo) hoặc N không khớp số phần tử/dòng |
| CP011 | WARNING | Hai test cùng input (cùng loại sample/hidden) |
| CP012 | WARNING | Hidden test trùng input với sample |
| CP013 | WARNING | Quá mỏng: <4 test hoặc <2 hidden |
| CP014 | ERROR | `starterCode` chứa ≥90% dòng lệnh của lời giải (lộ đáp án) |
| CP015 | ERROR | Reference vi phạm sandbox guard (judge thật sẽ chặn chính lời giải chuẩn) |
| CP016 | WARNING | Giá trị hidden xuất hiện nguyên văn trong đề/starterCode |
| CP017 | ERROR | Thiếu/trùng slug, thiếu title |
| CP018 | WARNING | `expectedOutput` thừa khoảng trắng/xuống dòng/CRLF (judge trim nên vẫn chấm được) |
| CP019 | ERROR | `expectedOutput` >64KB - judge cắt stdout nên không lời giải nào đạt AC |

Kết quả trên 30 bài thật: **0 ERROR, 27 WARNING** = 24 x CP002 (thiếu constraints) + 3 x CP013 (`tim-so-lon-nhat`, `dao-nguoc-chuoi`,
`day14-bang-cuu-chuong` có 2-3 test, chỉ 1 hidden). Sau khi áp overlay hardened còn 25 WARNING (2 bài đã có constraints).

## 6. Mutation testing

Mutant = reference bị sửa cố ý thành **sai**, chấm bằng đúng bộ test của bài (sample + hidden). Bị bắt (`status != AC`) = **KILLED**; vẫn AC = **SURVIVED**
= bộ test thủng.

```
Mutation Score = KILLED / VALID x 100          VALID = KILLED + SURVIVED
```

`EQUIVALENT` (con người xác nhận judge không phân biệt được - phải có `equivalentReason`, và chỉ tính khi mutant thật sự sống sót; nếu test lại bắt
được thì tool báo cờ `equivalentClaimWrong`) và `INVALID` (patch không áp dụng được, mutant lỗi cú pháp) bị loại khỏi mẫu số và luôn được liệt kê.

### Bài chính: Kiểm tra số nguyên tố (`kiem-tra-so-nguyen-to`) - 16 mutant

| ID | Loại | Mô tả | Test gốc | Test hardened |
|---|---|---|---|---|
| MUT-01 | Boundary | `x < 2` -> `x < 1` | KILLED (hidden) | KILLED |
| MUT-02 | Off-by-one | bỏ `+ 1` ở cận vòng lặp | **SURVIVED** | KILLED (hidden) |
| MUT-03 | Missing edge | bỏ nhánh `x < 2` | KILLED (hidden) | KILLED |
| MUT-04 | Wrong condition | `== 0` -> `== 1` | KILLED (sample) | KILLED |
| MUT-05 | Wrong operator | `%` -> `//` | KILLED (sample) | KILLED |
| MUT-06 | Hard-code sample | chỉ đúng với input sample | KILLED (hidden) | KILLED |
| MUT-07 | Input parsing | chỉ đọc chữ số đầu | KILLED (hidden) | KILLED |
| MUT-08 | Wrong rounding | làm tròn thay vì +1 | **SURVIVED** | KILLED (hidden) |
| MUT-09 | Output format | `Yes/No` thay `YES/NO` | KILLED (sample) | KILLED |
| MUT-10 | Slow algorithm | thử chia tới `x-1` (O(n)) | **SURVIVED** | KILLED (**TIMEOUT**) |
| MUT-11 | Output format | thêm dòng debug `input = n` | KILLED (sample) | KILLED |
| MUT-12 | Output format | thêm nhãn `Result:` | KILLED (sample) | KILLED |
| MUT-13 | Output format | thừa khoảng trắng/dòng trống **ở cuối** | EQUIVALENT | EQUIVALENT |
| MUT-14 | Off-by-one | vòng lặp bắt đầu từ 3 | KILLED (sample) | KILLED |
| MUT-15 | Heuristic | "lẻ > 1 = nguyên tố" | **SURVIVED** | KILLED (hidden) |
| MUT-16 | Boundary | `x < 2` -> `x <= 2` | **SURVIVED** | KILLED (hidden) |

**Test gốc: 10/15 = 66.7% -> FAIL.** Hardened (10 test, 8 hidden): **15/15 = 100% -> PASS**. 5 mutant sống sót ứng với 4 nhóm lỗ hổng: (1) không có test là bình phương
của số nguyên tố, (2) không có test số lẻ hợp số, (3) không có test cho số nguyên tố chẵn duy nhất, (4) không có test n rất lớn để phân biệt O(√n) với O(n).
Các test bổ sung được sinh bằng JS **độc lập** với lời giải Python (`build-overrides.js`), và reference vẫn AC trên toàn bộ.

### Bài đối chiếu: Sắp xếp tăng dần (`sap-xep-tang-dan`) - 12 mutant

Test gốc: **10/11 = 90.9% PASS** (sống sót duy nhất: `SRT-10` bubble sort O(n^2) - lại là lỗ hổng "không có test lớn"). Hardened: **11/11 = 100%**.
Hai bài cho thấy tool không "ăn may": cùng công thức, một bài FAIL một bài PASS trên test gốc.

**Không có constraints thì test hiệu năng là không công bằng.** Vì đề hiện chưa nêu `N`/giá trị tối đa (CP002), overlay hardened đi kèm `constraintsText`
(`1 ≤ N ≤ 10^9`; `1 ≤ N ≤ 10^5, |a_i| ≤ 10^9`). Nếu mentor chấp nhận test lớn thì phải sửa đề cho khớp.

## 7. Timeout và Output format

**Timeout (EVD-D13-05).** Với limit 2000ms: `MUT-10` và `SRT-10` bị bắt bằng `TIMEOUT` chỉ khi có test đủ lớn (test gốc không có -> sống sót). Test tự động
`timeout: reference chạy vô hạn...` chạy `while True: pass` với limit 700ms: bị `SIGKILL` đúng hạn, CP006 ghi `status=TLE`, tool không treo.

**Output format (EVD-D13-06).** Judge chỉ `trim()` hai đầu, nên: nhãn thừa (`Result: YES`), dòng debug, đổi hoa/thường, đổi dấu phân cách, in mỗi số một dòng đều **bị bắt**
(MUT-09/11/12, SRT-08/09). Chỉ khoảng trắng/xuống dòng **ở cuối** được bỏ qua (MUT-13/SRT-12, xếp `EQUIVALENT` kèm lý do trích dẫn `judge-queue.service.ts` dòng 123).
Nếu chính sách của bài là "exact output" thì judge hiện **không** thực thi điều đó (F-D13-06).

## 8. Hidden test không được lộ

Ba lớp bảo vệ trong tool, mỗi lớp có test:
1. `runner.js` không bao giờ giữ input/expected/actual/stderr của hidden test (chỉ `index`, `hiddenIndex`, `passed`, `kind`, `timeMs`).
2. `rules.js`: mọi message chỉ ghi `Hidden test #k` + nguyên nhân, không ghi giá trị.
3. `leak-guard.js` quét lần cuối trước khi ghi file: (a) mọi object `isHidden: true` chỉ được có key trong allowlist; (b) mọi giá trị hidden ≥4 ký tự mà không phải dữ liệu công khai
   không được xuất hiện trong report. Phát hiện lộ -> `exit 4`, **không ghi file**. Đã thử phá cố ý (nhét `rawResults` vào report) và guard chặn đúng.

Kiểm độc lập: grep các giá trị hidden (kể cả test QA thêm) trong toàn bộ `reports/` -> 0 kết quả.

**Phát hiện trên chính BE (F-D13-04).** `judge.controller.ts` ghi chú rằng dữ liệu hidden "never persisted", nhưng `judge-queue.service.ts` vẫn lưu `stderr` (dòng ~138) và
gán `errorMessage = run.stderr` (dòng ~147) cho **cả test hidden**, và controller trả về cả hai. Một chương trình của học viên làm phát sinh traceback có chứa dòng input
(`python-guard` không chặn `raise`/`input()`) sẽ đưa nguyên văn input hidden vào stderr. `probe-leak` mô phỏng đường này: **2/2 hidden test của 2 bài** bị echo dòng input đầu.
Mức chắc chắn: **đọc code + mô phỏng**, chưa chạy trên server thật - cần tái hiện bằng Submit trên UI trước khi báo mentor là lỗi chắc chắn.

**Phát hiện thứ hai (F-D13-08).** `hints.hint3` của 20/20 bài Ngày 14 trùng nguyên văn lời giải (`node real-content/check-hint3-equals-solution.js`), và `ExerciseService.findBySlug` trả nguyên object `hints`
cho `GET /exercises/:slug`, đi vòng cơ chế unlock/cooldown của `HintService`. Cũng mới ở mức đọc code + đếm, cần gọi API thật để xác nhận.

Lưu ý: `problems-hardened/overrides.json` chứa **giá trị thật của hidden test đề xuất**; nếu được chấp nhận vào seed thì không đưa file này ra ngoài.

## 9. Giới hạn đã biết / known false positive

- **CP010** dựa trên cụm từ tiếng Việt ("nguyên dương", "không âm", "Dòng hai là ... N"). Cố ý bảo thủ: nếu không gắn được biến vào dòng input và input không thuần số thì **bỏ qua** (thà bỏ sót còn hơn báo oan).
  Bản đầu quét mọi số trong input và báo oan 2 ca (giá tiền = 0, số lệnh = 0); đã sửa, có fixture `FIX-G03`. Toàn bộ 14 ERROR của lần chạy đầu trên dữ liệu thật đều là báo oan của 3 rule (CP008, CP010, CP014) - xem `AI_WORKLOG.md`.
- **CP008(b)** giả định các chuỗi trong dấu `"..."` không chứa khoảng trắng là *tập giá trị output*. Sẽ báo oan nếu đề dùng dấu ngoặc kép cho thứ khác (ví dụ tên biến). Câu có "mỗi/từng ... trên một dòng" được loại trừ (`FIX-G02`).
- **CP014** dùng ngưỡng 90% dòng lệnh trùng - bài dạng "viết hàm" có khung `def` + `print(...)` sẵn được coi là hợp lệ (`FIX-G04`); starter lộ đáp án nhưng ngắn (<3 dòng lệnh) sẽ không bị bắt.
- **CP002** nhận diện ràng buộc bằng biểu thức chính quy (`≤`, `10^`, `không quá`, `tối đa`, `từ..đến`...); ràng buộc viết theo cách khác sẽ bị báo thiếu.
- **CP016** chỉ xét giá trị ≥4 ký tự; hidden test toàn số ngắn không kiểm được.
- **leak-guard lớp văn bản** bỏ qua giá trị hidden <4 ký tự hoặc trùng dữ liệu công khai (ví dụ `YES`, `NO`, `0`) - lớp cấu trúc (allowlist key) là bảo vệ chính cho các trường hợp này.
- **Mutation score phụ thuộc vào bộ mutant do con người/AI chọn**: bộ mutant khác có thể cho score khác. 16 + 12 mutant là mẫu nhỏ, chưa phải kết luận thống kê cho cả 30 bài;
  chỉ 2/30 bài đã làm mutation.
- Mutant chỉ dùng mẫu thủ công (patch/source), chưa tự sinh bằng AST; nhận định EQUIVALENT do con người xác nhận, tool chỉ kiểm được một chiều (equivalent mà bị test bắt thì báo cờ).
- Memory limit chưa được kiểm (`memoryLimitMb` có trong schema nhưng judge hiện chỉ đo, không giới hạn).
- Chưa chạy trên Windows trong phiên tạo tool (đã viết theo đúng cách `code-runner.helper.ts` xử lý Python trên Windows nhưng cần bạn chạy lại `node run-all.js` để xác nhận).

## 10. Đối chiếu nghiệm thu Ngày 13

| Điều kiện | Trạng thái | Bằng chứng |
|---|---|---|
| Reference solution luôn AC | Đạt (30/30) | `reports/validate-baseline/validator-report.json`, `referenceRuns` |
| ≥80% mutant chủ đích bị bắt | **Đạt với test hardened (100%/100%); KHÔNG đạt với test gốc của bài số nguyên tố (66.7%)** | `reports/mutation-*/coverage-report.md` |
| Không lộ hidden tests | Đạt trong report/tool; **BE có đường lộ qua stderr (cần xác nhận)** | 3 lớp bảo vệ + grep + `probe-leak` |
| Coding_problem_validator | Có | `tools/coding-problem-validator/` |
| Mutation set | Có (28 mutant) | `mutants/`, `solutions/mutants/` |
| Coverage report | Có | `reports/mutation-*/coverage-report.md`, `Day13_Quality_Report.xlsx` |
| Kiểm chứng độc lập, không chỉ dựa vào AI | Có phần đã làm + phần bạn cần tự làm | `AI_WORKLOG.md` |
