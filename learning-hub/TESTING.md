# TESTING — Chiến lược kiểm thử và Quality Gates

> Số liệu đo trên mã nguồn phát hành v1.0. Jest, Vitest, node --test và 5 bộ audit chạy lại ngày 19/10/2026; E2E Chrome thật chạy ở commit `ac18440` (18/10/2026), mã ứng dụng không đổi từ đó.

## 1. Test pyramid

```
                 ┌──────────────────────────────┐
                 │ E2E Chrome thật   107 bước   │  5 luồng người dùng thật
                 ├──────────────────────────────┤
                 │ Audit API sống    206 kịch bản│  5 bộ bảo mật & nhất quán
             ┌───┴──────────────────────────────┴───┐
             │ Vitest FE 431 · node --test 31        │  component, model, script
         ┌───┴───────────────────────────────────────┴───┐
         │ Jest BE 1635 (unit + integration, có Coach Eval 100 case) │
         └───────────────────────────────────────────────┘
```

| Tầng | Lệnh (từ `learning-hub/`) | Kết quả | Phạm vi |
|---|---|---|---|
| **Backend unit & integration** | `npm --prefix BE test` | **1635 passed**, 12 skipped (130 suite, 1 suite skip) | Service, guard, domain (điểm, vòng đời bài nộp), code runner thật với Python, AST guard, phân quyền, IDOR, Coach Eval Harness 100 case |
| **Frontend component & unit** | `npm --prefix FE test -- --run` | **431 passed** (61 file) | Model thuần (`*Model.ts`), component React (Testing Library) |
| **Script checks** | `npm run test:scripts` | **31/31 passed** | `scripts/lib/*.test.js`: setup, seed helper, class-integrity, playground-sequence |
| **Typecheck** | `npm --prefix BE run build` · `npm --prefix FE run build` (hoặc `npx tsc --noEmit` / `npx tsc -b`) | sạch | |
| **Real browser E2E** | `npm run e2e:browser` | **107/107 passed** | Chrome thật qua puppeteer-core, đăng nhập bằng form thật |
| **Audit 1** Security & Privacy | `node scripts/audit-day29-security-privacy.js` | **33/33** | SEC-01..25, PRV-01..08 theo form của Tester |
| **Audit 2** Day 30 | `node scripts/audit-day30.js` | **45/45** | DEF-004/008/033/034/035/050/052/058/060/061, RISK-02, TC_GV_01–03, TC_K35_03, TC_UI_02, seed |
| **Audit 3** Day 31 | `node scripts/audit-day31.js` | **36/36** | Playground tuần tự, `bankOnly`, quiz 20 câu, quiz hết giờ (G-01), không "chờ chấm" (G-02) |
| **Audit 4** Cross-role | `node scripts/audit-cross-role-consistency.js` | **52/52** | Nhất quán Admin ↔ Giảng viên ↔ Học viên |
| **Audit 5** Teacher Security | `node scripts/audit-teacher-security.js` | **40/40** | IDOR, cô lập lớp, phiên, rate limit đăng nhập |

Audit và E2E gọi **backend đang chạy** (`npm run dev`) trên dữ liệu `npm run seed:clean`.

### Các luồng E2E (`scripts/e2e-browser-qa.js`)

| Luồng | Tài khoản | Kiểm tra chính |
|---|---|---|
| 1 — Học sinh 3-5 | `lop3-5`, `duongchiviet2004` | Vào thẳng `/block-puzzle`; không còn link Playground/Quiz/Cuộc thi; gõ URL bị đưa về; chơi Blockly, cộng sao, Bảng Vinh Danh |
| 2 — Học sinh 6-9 / 10-12 | `lop6-9`, `lop10-12` | 20/15 bài, khóa tuần tự, nộp đúng mở bài kế tiếp, Tiến độ khớp; bài lớp không bị khóa; quiz bàn phím, A–D, Đúng/Sai/Bỏ trống, đủ 20 câu, hết giờ tự nộp (`2.69.quiz-timeout*`); cuộc thi |
| 3 — Giảng viên | `teacher6-9`, `teacher10-12`, `teacher` | Soạn Code + Trắc nghiệm, Ngân hàng đề sửa/xóa (409), giao bài theo Ngày, học viên thấy ngay, trang Chấm bài |
| 4 — Admin | `admin` | Tạo học viên → đổi Giảng viên (Khối "—"), phân công lớp bền vững, khóa GV đứng lớp → 409 |
| 5 — Cố tình phá | nhiều vai trò | URL sai quyền, payload sai kiểu, nộp nhảy cóc, truy cập chéo lớp |

Mỗi bước còn bắt lỗi console đỏ, `pageerror`, request thất bại, HTTP ≥ 400 ngoài dự kiến và hiện tượng nháy trang trắng.

## 2. Fixtures & test data

| Loại | Cơ chế | Cô lập |
|---|---|---|
| Unit BE | Model Mongoose giả (mock) hoặc dữ liệu trong bộ nhớ trong từng `*.spec.ts`; code runner chạy Python thật với script tạm trong `os.tmpdir()` | Không cần MongoDB |
| AI | `StubLlmClient` trả lời tất định thay cho Gemini; Coach Eval dùng 100 case cố định (`BE/src/modules-api/coach/eval/`) và fixture hội thoại (`coach/fixtures/*.json`) | Không gọi mạng, không tốn quota |
| Unit FE | Model thuần + Testing Library (jsdom); API được mock | Không cần backend |
| Audit / E2E | Dữ liệu mẫu từ `npm run seed:clean`; mọi bản ghi mẫu mang cờ đánh dấu nên dọn được mà không đụng dữ liệu thật | E2E tự đặt lại tiến độ `lop6-9`/`lop10-12`; chạy `seed:clean` trước và sau |

## 3. Quality gates — điều kiện chặn phát hành

Một bản phát hành **không được ra** nếu bất kỳ điều kiện nào sau đây không đạt:

1. `npm --prefix BE test` và `npm --prefix FE test -- --run`: **0 test fail**, số test pass **không giảm** so với bản trước (1635 / 431).
2. Typecheck BE và FE sạch; `npm --prefix FE run build` thành công.
3. `npm run test:scripts`: 31/31.
4. 5 bộ audit **100% PASS** trên dữ liệu `seed:clean`.
5. `npm run e2e:browser` **107/107**, không có lỗi console/mạng ngoài dự kiến.
6. Coach Eval Harness (nằm trong Jest): leakage score = 1 cho **mọi** case, không case prompt injection nào có safety = 0, pass rate ≥ 90%.
7. `git status` không chứa `BE/.env`, `node_modules`, `dist`, `reports/`, file trong `Data-AI-Resource/`.

Không có ngoại lệ "bỏ qua" cho test critical. Test flaky phải sửa nguyên nhân (ví dụ chờ dữ liệu tải xong) thay vì chạy lại cho tới khi xanh.

**CI:** định nghĩa pipeline có sẵn tại `learning-hub/.github/workflows/ci.yml` (Node 20.x/22.x: node --test, lint + build FE, Jest BE, `eval:coach`, build BE). Vì GitHub Actions chỉ chạy workflow trong `.github/workflows` ở **gốc repo**, file này hiện **chưa được GitHub tự chạy**; các gate trên đang được chạy thủ công trước khi push. Đưa CI lên gốc repo kèm audit + E2E là việc của Roadmap Ngày 33 ([docs/day30/ROADMAP_60D.md](docs/day30/ROADMAP_60D.md)).
