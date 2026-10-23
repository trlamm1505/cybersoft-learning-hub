# Debug Loop v0.1 — fixtures & traces

- `failure-fixtures.json` — 20 kịch bản lỗi thật (compile/runtime/timeout/wrong-output/AC), mỗi cái là `{ id, description, input: DebugLoopTestInput, state: DebugLoopState }`.
- `generate-traces.ts` — chạy các fixture qua đúng hàm production `analyzeDebugLoop` (không tự viết tay output mẫu) và ghi ra `conversation-traces.json`.
- `conversation-traces.json` — kết quả sinh ra từ script trên, dùng làm baseline cho eval harness ngày 18.

**Cập nhật ngày 18**: 20 fixture trong `failure-fixtures.json` được tái sử dụng
trực tiếp (đọc bằng `fs.readFileSync`, không copy tay) trong bucket `debugLoop`
của Coach Eval Harness — xem `../eval/debug-loop-eval-cases.ts` và
`../eval/README.md`.

Chạy lại khi `coach-debug-loop.ts` thay đổi:

```
cd learning-hub/BE
npx ts-node -T src/modules-api/coach/fixtures/generate-traces.ts
```
