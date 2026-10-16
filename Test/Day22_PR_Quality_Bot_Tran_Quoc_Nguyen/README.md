# Ngày 22 — PR Quality Bot/Report

## Mục tiêu

Mỗi pull request được kiểm tra tự động theo đúng phần đã thay đổi. Bot trả về PASS/FAIL bằng exit code thật, tạo báo cáo có hướng khắc phục, quét secret, giới hạn độ dài report và không có quyền tự approve/merge PR.

## Thành phần bàn giao

| Yêu cầu kế hoạch | File |
|---|---|
| PR checks | `.github/workflows/pr-quality.yml` (ở root repo) + `scripts/pr_quality.py` |
| Change-impact mapping | `config/change-impact-map.json`, giải thích trong `CHANGE_IMPACT_MAPPING.md` |
| Quy tắc FAIL/WARN/PASS cho từng nhóm | `PR_RULES.md` |
| Sample PR demo | `SAMPLE_PR_DEMO.md` + 3 report mẫu trong `reports/samples/` |
| Test của chính bot | `tests/test_pr_quality.py` (38 test) |
| Báo cáo | `DAY22_REPORT.md`, `Bao_Cao_Ngay_22_PR_Quality_Bot_Tran_Quoc_Nguyen.docx` |
| Bằng chứng dùng AI | `AI_WORKLOG.md` |

## Chạy ở máy local

Tại `D:\thuctap\cybersoft-learning-hub`:

```powershell
# 1. Test của chính bot
py -m unittest discover -s "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\tests"

# 2. Xem gate nào sẽ chạy, chưa chạy test
py "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\scripts\pr_quality.py" --files "learning-hub/FE/src/App.tsx" ".github/workflows/pr-quality.yml" --plan-only

# 3. Chạy theo file đang sửa chưa commit
py "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\scripts\pr_quality.py"

# 4. Chạy theo hai commit/nhánh
py "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\scripts\pr_quality.py" --base origin/main --head HEAD
```

Lệnh 2-4 ghi đè `reports/pr-quality-report.md|json`; thêm `--output-dir <thư mục>` nếu muốn giữ report cũ.

## Ý nghĩa kết quả

| Kết quả tổng | Exit code | Khi nào |
|---|---:|---|
| PASS | 0 | Mọi gate được chọn đều pass, không có finding |
| WARN | 0 | Có file code chưa có gate, hoặc gate *advisory* fail. Không chặn PR nhưng report nêu rõ để người review xem |
| PLANNED | 0 | Chạy `--plan-only` |
| FAIL | 1 | Có secret/policy finding, hoặc gate *blocking* trả exit code khác 0 (bot dừng gate đó ngay và ghi lại đúng exit code) |
| lỗi cấu hình | 2 | Không lấy được diff, config hỏng, hoặc danh sách file rỗng (không coi là PASS) |

Tùy chọn: `--strict-unmapped` biến "file chưa có gate" thành FAIL; `--allow-empty` cho phép danh sách file rỗng.

## Ba nhóm rule an toàn

1. **Không lộ secret.** Quét mọi file text thay đổi (không lọc theo đuôi file) với 8 mẫu khóa; finding chỉ ghi file, dòng, tên rule, không bao giờ in giá trị. Log của gate được che token/mật khẩu/JWT trước khi ghi. Fixture chứa secret giả phải được khai báo đích danh trong `secret_scan_allowlist` kèm lý do.
2. **Không spam.** Bot không comment vào PR; kết quả nằm ở Job Summary và artifact. Step PASS chỉ in 15 dòng cuối, step FAIL 80 dòng, danh sách file tối đa 50, finding tối đa 20, cả report tối đa 60 000 ký tự. Workflow dùng `concurrency` + `cancel-in-progress` nên push liên tiếp chỉ giữ một kết quả. Scanner báo lỗi nếu workflow nào dùng `gh pr comment` không có `--edit-last`.
3. **Không tự approve.** Workflow chỉ có `contents: read`, `pull-requests: read`. Scanner chặn `gh pr review --approve`, `gh pr merge`, `pull_request_target`, `write-all`. Các rule này không thể allowlist.

## Giới hạn đã biết

- Gate FE và BE (`npm ci`, test, build) **chưa được chạy thử qua bot ở máy local**; cần xác nhận bằng PR thật trên GitHub.
- Contract test Ngày 6 và auth test Ngày 7 chạy trên API mô phỏng (FastAPI), không gọi BE NestJS thật. Khi controller/DTO của BE đổi, bot chỉ đưa ra lưu ý cho người review chứ không tự phát hiện được.
- Gate "Content lint - bài học thật" là advisory vì `initial-data.ts` hiện có sẵn 2 lỗi CT004.
- Extractor Ngày 13 hiện đọc `initial-exercises.ts` và `initial-exercises-day14.ts` (30 bài); `initial-exercises-day15.ts` chưa được trích.
- Thư mục chưa có gate (ví dụ `Data-AI-Resource/`, Day08 UI smoke, Day14, Day15) cho kết quả WARN.

## Cách demo nộp bài

Xem `SAMPLE_PR_DEMO.md`.
