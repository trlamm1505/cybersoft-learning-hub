# AI WORK LOG - DAY 13 (Validator bài coding và test case)

> Quy ước của file này: mục "Kiểm chứng đã thực hiện" ghi những gì đã được kiểm bằng cách **độc lập với chính tool**
> (đọc code BE, script Python riêng, grep, phá cố ý). Đó là việc AI đã làm trong phiên làm việc, **không thay cho bước kiểm của bạn**:
> mục "Việc bạn cần tự làm trước khi nộp" ở cuối là phần con người phải tự chạy/tự phán quyết. Đừng ghi "đã kiểm" khi chưa tự chạy.

## Problem statement trước AI

Theo kế hoạch (`03_Ke_hoach_30_ngay_Thuc_tap_sinh_QA_AI_Evaluation.docx`, Ngày 13): xây `coding_problem_validator` để bảo đảm statement,
constraints, test case nhất quán; kiểm reference solution; mutation testing; timeout; output format. Sản phẩm: validator, mutation set,
coverage report. Nghiệm thu: reference luôn AC; ≥80% mutant chủ đích bị bắt; không lộ hidden tests; có kiểm chứng độc lập (không chỉ dựa AI).

Giả định trước khi viết code:

- Bám khuôn Ngày 11-12: CLI Node thuần, rule `{code, severity, description, fix, check()}`, lấy số dòng thật bằng `text-scan.js` (dùng lại nguyên vẹn),
  report JSON + CSV có 3 cột `humanVerification / falsePositive / finalResult` để trống, test bằng `node:test` gọi CLI thật.
- **Phải dùng bài thật của project**, không tự bịa. Đọc `BE/src/data/initial-exercises.ts` (10 bài) và `initial-exercises-day14.ts` (20 bài),
  `exercise.schema.ts`, và toàn bộ đường chấm bài (`code-runner.helper.ts`, `python-guard.helper.ts`, `judge-queue.service.ts`, `judge.controller.ts`,
  `exercise.service.ts`) trước khi thiết kế rule - vì kết luận "reference AC / mutant KILLED" chỉ có ý nghĩa nếu tool chấm **giống** judge thật.
- Bài chính chọn **Kiểm tra số nguyên tố** (đơn giản, có biên n<2, có đường hiệu năng O(√n)/O(n), output YES/NO) đúng hướng "bắt đầu bằng bài đơn giản";
  thêm **Sắp xếp tăng dần** để đối chiếu.

## Input / Output / Constraint

**Input:** kế hoạch Ngày 13 + hướng dẫn từ user; toàn bộ dữ liệu bài coding thật; code judge thật trong BE; thư mục Ngày 12 làm mẫu kiến trúc.
**Output:** xem `README.md` mục 2. **Constraint:** không cài package ngoài; không sửa dữ liệu/BE gốc (chỉ đọc); chạy offline; không đưa dữ liệu hidden vào report.

## AI hỗ trợ

- Đề xuất 19 rule (10 rule theo kế hoạch + 9 rule sau khi đọc dữ liệu thật): CP011-CP013 (test trùng/thiếu), CP014 (starter lộ đáp án), CP015 (reference vi phạm sandbox guard),
  CP016 (hidden lộ trong đề), CP017 (ID), CP018 (khoảng trắng expected), CP019 (expected >64KB).
- Viết `runner.js` mô phỏng judge thật (guard, timeout, so sánh trim, trạng thái = test fail cuối), `mutation.js`, `leak-guard.js`.
- Đề xuất 16 mutant cho bài số nguyên tố (boundary, off-by-one, missing edge, wrong condition/operator, hard-code, parsing, rounding, 3 kiểu output format,
  slow algorithm, heuristic, boundary thứ hai) và 12 mutant cho bài sắp xếp; đề xuất tách trạng thái `EQUIVALENT` và `INVALID` khỏi mẫu số.
- Đề xuất bộ test bổ sung (overlay) với expected **tính bằng JS độc lập**, không dùng lời giải Python đang cần kiểm (tránh vòng tròn).
- Sinh fixture bank (19 bad + 6 good) và 45 test.

## Kiểm chứng đã thực hiện (độc lập với tool chính)

1. **Rà từng finding của lần chạy đầu bằng tay.** Lần đầu chạy trên 30 bài thật: **14 ERROR**. Đọc lại từng bài trong dữ liệu gốc, cả 14 đều là **báo oan** của 3 rule:
   - `CP010` (2 ca): đề nói "N (nguyên dương)" ở dòng 2, nhưng tool quét mọi số của input nên bắt luôn giá tiền = 0 (dòng 3) và số lệnh = 0 (dòng 2 của bài túi đồ, biến khác `C`).
     Sửa: gắn biến với dòng input qua "Dòng hai là ... N"; không gắn được và input không thuần số thì **bỏ qua**.
   - `CP014` (4 ca): bài "viết hàm" có sẵn khung `def` + `print(hàm(...))` trong starter - đó là driver, không phải đáp án. Sửa: chỉ báo khi starter chứa ≥90% dòng lệnh của lời giải.
   - `CP008` (8 lần báo, 2 bài): (a) expected nhiều dòng "A\nC\nF" bị so cả khối với tập {A,B,C,D,F}; (b) câu "mỗi kết quả **trên một dòng**" bị hiểu là "output một dòng". Sửa: so từng dòng; bỏ câu có "mỗi/từng".
   Sau sửa: 0 ERROR, 27 WARNING. Ba ca "báo oan" được giữ lại thành fixture good `FIX-G02/03/04` để lần sau không tái phát. Rule vẫn bắt được lỗi thật: 19 fixture bad đều bị đúng rule mục tiêu bắt.
2. **Dự đoán trước, chạy sau.** Trước khi chạy mutation, tự lập luận bằng tay rằng trên test gốc (7, 10, 1, 97) mutant `int(x ** 0.5)` (bỏ `+1`) vẫn AC. Kết quả tool khớp dự đoán cho cả 5 survivor.
   **Lưu ý thiên lệch:** bộ mutant do AI viết *sau khi đã phân tích điểm yếu của bộ test gốc*, nên con số 66.7% phản ánh bộ mutant này, không phải "độ yếu tuyệt đối" của bài.
3. **Kiểm chéo bằng Python độc lập** (`verify-independent.py`): không dùng chung code với `runner.js`/`mutation.js`, tự chạy từng file mutant trong `solutions/mutants/` trên từng test, tự so sánh.
   Cả 4 lượt mutation (2 bài x test gốc/hardened) **khớp 100%** KILLED/SURVIVED với report của tool.
4. **STOP gate hoạt động thật.** Khi thêm test 12.000 phần tử vào overlay, reference bài sắp xếp bị **WA** và mutation dừng (exit 3) đúng như thiết kế. Đọc lại nguyên nhân bằng script riêng:
   stdout của reference bị cắt ở 65.536 ký tự, expected dài 82.630 - do `MAX_OUTPUT_BYTES = 64 * 1024` trong `code-runner.helper.ts`. Đây là hành vi **thật của BE** (đã thêm CP019), không phải bug của tool.
   Sửa test bổ sung để output <64KB rồi chạy lại.
5. **Phá cố ý leak-guard.** Bản sao tool bị sửa để nhét `rawResults` (kèm input hidden) vào report: guard báo `hidden result có key "input" không được phép`, `exit 4`, **không ghi file**. Trước đó sửa `runner.shape()` thì report vẫn sạch vì `mutation.js` chỉ giữ số liệu tổng hợp (2 lớp bảo vệ chồng nhau - ghi nhận, không tính là bằng chứng của guard).
6. **Grep độc lập** các giá trị hidden (gồm cả test QA thêm) trong toàn bộ `reports/`: 0 kết quả.
7. **Đọc code BE để kiểm lời khẳng định.** `judge.controller.ts` viết "hidden ... never persisted"; `judge-queue.service.ts` vẫn lưu `stderr` và `errorMessage` cho hidden test. Mô phỏng bằng `probe-leak`: 2/2 hidden test của cả 2 bài bị echo dòng input đầu qua stderr.
   Trong lúc đọc `exercise.service.ts` để hiểu dữ liệu, thấy `findBySlug` trả nguyên `hints`; viết `real-content/check-hint3-equals-solution.js` để đếm thay vì tin mắt: **20/20** bài Ngày 14 có `hint3` trùng nguyên văn `solutionCode` (F-D13-08). `HintService` có cơ chế che hint theo unlock/cooldown, nhưng `GET /exercises/:slug` đi đường khác - chưa gọi API thật để xác nhận.
8. **Test không "pass cho vui".** 45/45 pass ngay lần đầu là dấu hiệu cần nghi ngờ, nên đã làm bước 5 (phá cố ý) và thêm các test âm: reference sai -> exit 3, patch không áp dụng được -> INVALID, mutant gắn nhầm equivalent -> cờ, hidden lọt vào mô tả mutant -> exit 4.

## AI sai / chưa đủ ở đâu

- Bản rule đầu **báo oan 14/14 ERROR** trên dữ liệu thật (mục 1) - viết rule từ tưởng tượng về đề bài trước khi xem hết cách đề bài Ngày 14 thực sự viết (nhiều dòng, nhiều biến, "mỗi ... trên một dòng").
- Bộ test bổ sung đầu tiên **vượt giới hạn 64KB** của judge, làm chính reference bị WA (mục 4).
- Ban đầu viết `node --test tests/` - Node 22 coi `tests/` là module và lỗi; phải chỉ đúng file.
- Console in `[KHÔNG NHƯ KỲ VỌNG]` cho mọi survivor của test gốc vì `expected` = kết quả "bộ test đủ mạnh" phải cho. Đúng ý thiết kế nhưng dễ gây hiểu nhầm là tool lỗi - đã ghi trong README mục 6.
- Chưa làm được: chạy trên Windows (môi trường thật của bạn); tái hiện F-D13-04 trên server BE thật; sinh mutant tự động bằng AST; đo memory; mutation cho 28/30 bài còn lại.
- Mutant EQUIVALENT (MUT-13, SRT-12) do AI đề xuất và lập luận từ dòng 123 của `judge-queue.service.ts`; tool chỉ kiểm được một chiều. Con người cần xác nhận lập luận này.

## Quyết định

- Giữ CP002 ở mức **WARNING** (24/30 bài thiếu cận số học): đây là thiếu sót nội dung cần mentor quyết, chưa thể coi là lỗi chặn.
- **Báo cáo trung thực cả hai con số:** test gốc 66.7% (FAIL) và hardened 100% (PASS). Không đổi mutant, không dồn survivor sang `EQUIVALENT` để đạt 80%.
- **Không sửa `initial-exercises.ts`** trong BE. Bộ test bổ sung nằm ở `problems-hardened/overrides.json` (overlay) để mentor duyệt; nó chứa giá trị hidden thật nên không đưa ra ngoài.
- Tool chấm bằng judge mini viết lại (không gọi trực tiếp code TypeScript trong BE) để chạy được không cần build Nest; đổi lại phải tự bảo đảm khớp hành vi - liệt kê các điểm khớp ở README mục 4.
- F-D13-04 (stderr lộ hidden) và F-D13-08 (hint3 = lời giải) ghi ở mức **"đọc code + mô phỏng/đếm, cần tái hiện"**, không khẳng định là lỗi chắc chắn. F-D13-08 hơi ngoài phạm vi "test case" của Ngày 13 nhưng liên quan trực tiếp tới việc reference solution bị lộ nên vẫn ghi.

## Việc bạn cần tự làm trước khi nộp

- [ ] `cd tools/coding-problem-validator && node run-all.js` **trên máy Windows của bạn**; nếu Python không nhận, thêm `--python <đường dẫn python.exe>`. Ghi lại kết quả thật (ảnh chụp/console) làm EVD-D13-01..07.
- [ ] Mở `solutions/mutants/kiem-tra-so-nguyen-to/MUT-02.py`, `MUT-10.py`, `MUT-15.py` và tự nhẩm 1-2 input xem có đúng là lời giải sai không; tự xét MUT-13 có thật sự "equivalent" theo chính sách của bài.
- [ ] Mở `reports/validate-baseline/validator-report.csv`, điền tay 3 cột `humanVerification / falsePositive / finalResult` cho các dòng WARNING (CP002, CP013) - tool không tự phán quyết.
- [ ] Tái hiện F-D13-08: gọi `GET /api/exercises/day14-ham-tinh-giai-thua` (không cần unlock hint) và xem `hints.hint3` có phải lời giải đầy đủ không.
- [ ] Tái hiện F-D13-04 trên UI: nộp một bài mà chương trình gây lỗi có in dòng input (ví dụ ép `ValueError` khi đọc input), rồi `GET /api/exercises/submissions/:id` xem `results[i].stderr` và `errorMessage` của test hidden. Chỉ báo mentor nếu tái hiện được.
- [ ] Quyết định (hoặc hỏi mentor) có áp `overrides.json` vào seed hay không, và có thêm trường `constraints` vào schema/đề bài hay không.
- [ ] Cập nhật lại bảng "Độc lập kiểm chứng" ở `DAY13_REPORT.md` bằng những gì **bạn** đã tự chạy.
