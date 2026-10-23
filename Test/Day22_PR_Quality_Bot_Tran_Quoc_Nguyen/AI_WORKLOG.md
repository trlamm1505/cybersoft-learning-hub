# AI_WORKLOG — Ngày 22

## 1. Bài toán trước khi dùng AI

Repository có nhiều bộ test FE, BE, API và content nhưng chưa có một PR gate ở root để tự chọn test theo file thay đổi, tổng hợp exit code và phát hành report. Workflow cũ nằm rời rạc, có chỗ bỏ qua lỗi bằng `|| true`, nên chưa đáp ứng nghiệm thu Ngày 22.

## 2. Công cụ và chỉ dẫn chính

- Công cụ: Codex, PowerShell, Python `unittest`, GitHub Actions.
- Chỉ dẫn: tạo change-impact mapping; chạy gate theo file đổi; dùng exit code thật; report phải có remediation; quét secret; AI/bot không được tự approve PR.

## 3. Diff chính do AI đề xuất

- Thêm `.github/workflows/pr-quality.yml` với quyền chỉ đọc.
- Thêm `config/change-impact-map.json` ánh xạ FE/BE/API/content/quiz/coding/self-test.
- Thêm `scripts/pr_quality.py` để chọn và chạy gate, redaction log, tạo Markdown/JSON.
- Thêm 8 regression test và tài liệu demo.

## 4. Kiểm chứng độc lập và quyết định của tester

Lệnh đã chạy:

```powershell
py -m unittest discover -s "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\tests" -v
```

Lần đầu: **7 PASS, 1 FAIL**. Rule chống auto-approve không nhận ra `.github/workflows/...` vì hàm dùng `lstrip("./")`, làm mất dấu chấm đầu đường dẫn.

Quyết định của tester: không chấp nhận kết luận của AI khi chưa chạy test; sửa chuẩn hóa đường dẫn thành chỉ loại đúng tiền tố `./`. Chạy lại: **8/8 PASS**.

Khi chạy demo trên Windows, script tiếp tục lộ lỗi `UnicodeEncodeError` do console `cp1252` không in được tiếng Việt. Tester bổ sung cấu hình UTF-8 cho `stdout/stderr` và chạy lại demo thành công với exit code `0`.

Khi chạy gate Node qua PR bot, log tiếng Việt bị mojibake như `KhÃ´ng` vì `subprocess.run` giải mã output theo Windows-1252. Tester buộc `encoding="utf-8"` cho cả lệnh test và lệnh Git, đồng thời thêm regression test cho chuỗi `Không lỗi tiếng Việt`. Kết quả mới: **9/9 PASS**.

Các quyết định giữ lại:

- Không dùng secret thật trong fixture; token giả được ghép lúc runtime để chính source test không bị scanner hiểu nhầm.
- Không cấp `pull-requests: write` và không có lệnh approve/merge.
- Không dùng `|| true`; workflow lưu exit code, ghi summary rồi trả lại đúng exit code.
- Report-only change không kích hoạt test FE/BE nặng, nhưng security gate vẫn chạy.

## 5. Nội dung trình bày 3 phút

AI đề xuất một bot chọn test theo thay đổi và xuất report. Các điểm sai phát hiện khi kiểm chứng gồm normalize path làm rule `.github` bị vô hiệu, console Windows lỗi mã hóa và output Node bị giải mã sai. Tôi đọc lỗi, sửa từng nguyên nhân rồi chạy lại 9 test và demo đều pass. Tôi cũng kiểm tra workflow chỉ có quyền đọc, không tự approve, không che exit code và report FAIL luôn có hướng xử lý.

## 6. Vòng rà soát và sửa ngày 05/10 (Claude)

Chỉ dẫn: "kiểm tra Day22 có đúng yêu cầu kế hoạch không" rồi "giúp fix". Mục 1-5 ở trên là lịch sử của vòng đầu (8 rồi 9 test); hiện bộ test có **36 test**.

| # | Vấn đề tìm thấy khi tự chạy thử | Kiểm bằng gì | Sửa |
|---|---|---|---|
| 1 | File code không khớp mapping (Dockerfile, `nest-cli.json`, `FE/index.html`...) được báo PASS "report-only" | `--plan-only` với các file đó | Mở rộng pattern FE/BE; tách docs-only; file chưa map → WARN, có `--strict-unmapped` |
| 2 | Danh sách file rỗng → PASS | `--changed-file` trỏ tới file rỗng | Exit code 2 kèm cách xử lý |
| 3 | Gate API contract lỗi `ModuleNotFoundError: app` khi chạy từ root repo, tức là sẽ fail trên CI | Chạy đúng lệnh trong config | Thêm `cwd` cho gate; chạy lại 37 test PASS |
| 4 | Gate quiz/coding/content chỉ chạy test của công cụ, không kiểm nội dung vừa đổi; contract test chạy trên mock | Đọc test và `conftest.py` | Thêm 3 gate trích nội dung thật rồi validate; controller/DTO → lưu ý cho người review |
| 5 | Chính file test của bot bị scanner coi là lộ secret, nên PR đầu tiên chứa Day22 sẽ FAIL | Quét thư mục Day22 bằng `scan_security` | Ghép tên biến lúc runtime; thêm test bot tự quét chính nó |
| 6 | `.env.production`, `.pem`, file không đuôi không được quét | Tạo file giả với cùng một khóa | Quét mọi file text; test theo 5 tên file |
| 7 | Log không che `password=`, Bearer ngoài header, JWT | Gọi `redact()` | Thêm mẫu che; test |
| 8 | Quét rộng hơn làm 8 file fixture của nhóm bị bắt (secret giả) | Quét 1 748 file đang track | `secret_scan_allowlist` chỉ đích danh file + rule + lý do; rule workflow không allowlist được |
| 9 | "Không spam" mới chỉ là một câu trong tài liệu | Đọc workflow | Giới hạn log/report, `concurrency`, rule `unbounded_pr_comment`, test |
| 10 | So khớp pattern khác nhau giữa Windows và Linux; report in đường dẫn Python của máy | Đọc code | `fnmatchcase`; hiển thị lệnh gốc |
| 11 | Claude viết chú thích "không thể approve, merge" trong workflow làm chính rule chống approve báo nhầm | Test `test_repo_workflow_is_read_only_and_cannot_approve` FAIL | Siết regex về `event: APPROVE` / `--approve` / `createReview(` |
| 12 | Rule `assigned_secret` báo oan trên PR #99 của nhóm Learning Hub: dòng `JWT_SECRET: h.generateSecret()` trong `learning-hub/scripts/setup.js` (code sinh khóa lúc chạy, không phải khóa viết cứng) làm check đỏ | Report của run 37287770405; đọc dòng 76 của file | Regex bỏ qua giá trị là biểu thức code (gọi hàm, tham chiếu biến); thêm 2 test (không báo oan biểu thức code, vẫn bắt khóa viết cứng); quét lại toàn bộ file của PR #99: 0 finding. Bộ test hiện có 38 test. Đổi Node của workflow từ 20 lên 22 theo `.nvmrc` của nhóm (vitest báo không hỗ trợ Node 20) |

Lệnh kiểm chứng và kết quả:

```text
python -m unittest discover -s Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/tests   ->  Ran 36 tests ... OK
pr_quality.py --files <8 file Day06/07/11/12/13 + 3 file dữ liệu BE> (bỏ gate FE/BE)  ->  WARN, exit 0
pr_quality.py --files demo/broken_feature.py --config config/demo-failing-gate.json   ->  FAIL, exit 1 (gate exit 3)
```

**Phần bạn tự làm và tự ghi (AI không làm thay):**

- [ ] Chạy lại 36 test trên Windows bằng `py -m unittest ...`, dán output.
- [ ] Push, mở PR thật, chụp check PASS và một lần FAIL có chủ ý.
- [ ] Giải thích bằng lời của bạn một đoạn code (gợi ý: `classify_changes` hoặc `execute_gate`) và tự sửa một thay đổi nhỏ, ví dụ thêm một pattern docs-only hoặc đổi `PASS_LOG_LINES`, rồi chạy lại test.
- [ ] Quyết định của bạn: có bật `--strict-unmapped` trên CI không? Danh sách allowlist 8 file có chấp nhận không?
