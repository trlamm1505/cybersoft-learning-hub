# Coach Eval Harness v0.1 — ngày 18

Đánh giá tự động chất lượng của AI Coach (nhánh `chat` và `debugLoop`) bằng
100 test case cố định, chấm theo rubric 4 tiêu chí (correctness, pedagogy,
leakage, safety), chạy như một Jest regression gate trong CI.

## Giới hạn quan trọng — đọc trước khi dùng

Repo hiện **chưa có LLM thật** (`coach.module.ts` hard-code `StubLlmClient` —
một bộ regex/template, xem comment trong `coach-llm.client.ts`). Vì vậy:

- "LLM judge" ở đây là **rule-based judge** (`coach-rubric.ts`), không phải
  một model thật chấm điểm tự do. Nó bám sát các bất biến đã biết trước
  (không rò rỉ full solution, không lộ hidden test, injection phải bị chặn,
  không bịa số liệu khi context thiếu).
- Kiến trúc tách `coach-eval-runner.ts` (chạy case qua production code) khỏi
  `coach-rubric.ts` (chấm điểm) để sau này thay rule-based judge bằng một lời
  gọi LLM thật (ví dụ Anthropic Messages API) mà không phải viết lại test
  case hay report.
- "Correctness/pedagogy" cho nhánh `chat` bị giới hạn bởi những gì
  `StubLlmClient` có thể sinh ra (câu template cố định) — không phản ánh chất
  lượng của một model thật khi được wire vào sau này.

## Cấu trúc

- `eval-types.ts` — schema `EvalCase` (2 kind: `chat`, `debugLoop`),
  `RubricScore`, `CaseResult`, `EvalSummary`.
- `chat-eval-cases.ts` — 70 case cho nhánh `CoachService#chat` (context +
  userMessage), chia 4 category: correct (20), incorrect (15),
  missing_context (15), prompt_injection (20).
- `debug-loop-eval-cases.ts` — 30 case cho nhánh `analyzeDebugLoop`: tái dùng
  20 fixture từ ngày 17 (`coach/fixtures/failure-fixtures.json`, category
  `correct`) + 5 case `incorrect` (dữ liệu tự mâu thuẫn) + 5 case
  `missing_context` (thiếu `firstFailingTest`/`errorMessage`) mới.
- `coach-eval-cases.ts` — gộp `chatEvalCases` + `debugLoopEvalCases` =
  **100 case** (`allEvalCases`).
- `coach-eval-runner.ts` — chạy MỘT case qua đúng thứ tự bước thật của
  `CoachService#chat` (assertContextHasNoForbiddenData → detectPromptInjection
  → StubLlmClient.chat → checkCoachResponsePolicy) hoặc gọi thẳng
  `analyzeDebugLoop`. Không mock, không tự bịa output.
- `coach-rubric.ts` — chấm điểm 1 outcome theo 4 tiêu chí, trả về
  `RubricScore` + `passed` + lý do fail cụ thể.
- `run-all-cases.ts` — chạy toàn bộ `allEvalCases` qua runner + rubric.
- `coach-eval-summary.ts` — tổng hợp theo category + điểm trung bình, xuất
  Markdown.
- `coach-eval.spec.ts` — **regression gate**: assert ngưỡng cứng cho
  leakage/safety (phải tuyệt đối, không cho phép trung bình mềm) + ngưỡng mềm
  cho correctness/pedagogy/pass-rate. Tự động chạy trong CI vì khớp
  `*.spec.ts` (xem `npm run test --prefix BE`).
- `generate-baseline-report.ts` — script sinh `reports/baseline-report.json`
  và `reports/baseline-report.md` (baseline report bàn giao cuối ngày 18),
  đồng thời lưu thêm một bản vào `reports/history/` theo tên phiên bản.

## Regression theo prompt hoặc model version

`coach-eval-runner.ts` export hàm `getEvalRunVersion()` trả về:

- `promptHash`: 12 ký tự đầu của sha256 trên `SYSTEM_PROMPT` (import lại
  nguyên văn từ `coach.service.ts`, không copy riêng một bản) — đổi ngay khi
  prompt đổi một ký tự.
- `llmClientName`: tên class đang implement `LlmClient` (`StubLlmClient` hôm
  nay, sẽ là tên client thật khi đổi sang model thật).

Mỗi lần chạy `npm run eval:coach`, ngoài file `reports/baseline-report.json`
(luôn bị ghi đè, dùng để xem nhanh kết quả gần nhất), script còn lưu thêm một
bản vào `reports/history/<promptHash>_<llmClientName>.json` — file này KHÔNG
bị ghi đè giữa các lần chạy có phiên bản khác nhau. Khi đổi `SYSTEM_PROMPT`
hoặc đổi client, so sánh 2 file trong `history/` để biết điểm rubric tăng hay
giảm do thay đổi đó gây ra — đây là cách hiện thực điều kiện nghiệm thu
"chạy regression theo prompt/model version".

## Chạy

```bash
cd learning-hub/BE
npx jest coach-eval          # chạy regression gate
npm run eval:coach           # sinh lại baseline report vào eval/reports/
```

CI (`learning-hub/.github/workflows/ci.yml`) chạy cả hai: `npm run test`
(bao gồm `coach-eval.spec.ts`) rồi `npm run eval:coach` để in report ra log.

## Đối chiếu thủ công

`coach-eval.spec.ts` có riêng nhóm `describe` "case mẫu đối chiếu thủ công"
chọn 3 case đại diện mỗi nhánh (chat injection, debug-loop hidden-test,
missing-context) để tự đọc input/output rồi so với điểm rubric trả ra, thay
vì tin tuyệt đối vào judge tự động. Chi tiết quá trình đối chiếu (kể cả các
lỗi rubric/injection-guard được phát hiện và sửa trong lúc làm) nằm trong
`learning-hub/AI_WORKLOG.md` — mục ngày 18.
