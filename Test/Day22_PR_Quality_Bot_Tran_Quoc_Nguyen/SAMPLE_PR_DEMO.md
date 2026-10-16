# Sample PR demo

Ba report mẫu dưới đây được tạo bằng lệnh thật ngày 05/10/2026 và lưu trong `reports/samples/`. Chạy lại được ở máy local từ `D:\thuctap\cybersoft-learning-hub`.

## Mẫu 1 — chọn gate theo file thay đổi (`reports/samples/01-plan/`)

PR giả lập đổi 4 file: một file FE, workflow, một controller BE và một README của nhóm khác.

```powershell
py "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\scripts\pr_quality.py" --files "learning-hub/FE/src/App.tsx" ".github/workflows/pr-quality.yml" "learning-hub/BE/src/modules-api/exercise/exercise.controller.ts" "Data-AI-Resource/README.md" --plan-only --output-dir "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\reports\samples\01-plan"
```

Kết quả: chọn Frontend, Backend và self-test; README là docs-only; có mục "Lưu ý cho người review" về contract. Exit code 0.

## Mẫu 2 — gate fail, giữ đúng exit code (`reports/samples/02-gate-fail/`)

Dùng config demo có một gate cố ý trả exit code 3.

```powershell
py "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\scripts\pr_quality.py" --files "demo/broken_feature.py" --config "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\config\demo-failing-gate.json" --output-dir "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\reports\samples\02-gate-fail"
echo $LASTEXITCODE
```

Kết quả: bảng ghi exit code 3 của gate, kết quả tổng FAIL, bot trả exit code 1, report có dòng "Cách khắc phục".

## Mẫu 3 — lộ secret (`reports/samples/03-secret-fail/`)

Tạo tạm một file chứa khóa giả rồi cho bot quét, sau đó xóa file.

```powershell
$d = "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\demo-tmp"; mkdir $d | Out-Null
"OPENAI_API_KEY=sk-" + ("d" * 40) | Set-Content "$d\leak.env"
py "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\scripts\pr_quality.py" --files "Test/Day22_PR_Quality_Bot_Tran_Quoc_Nguyen/demo-tmp/leak.env" --output-dir "Test\Day22_PR_Quality_Bot_Tran_Quoc_Nguyen\reports\samples\03-secret-fail"
Remove-Item $d -Recurse
```

Kết quả: FAIL, exit code 1, report ghi file + dòng + tên rule, không in giá trị khóa.

## Demo trên GitHub (bằng chứng PR check thật — bạn tự làm)

1. Tạo branch, commit `.github/workflows/pr-quality.yml` và thư mục Day22, push, mở Pull Request vào `main`.
2. Tab **Checks** → job `Changed-file quality gates` → mở **Summary** để xem bảng gate. Chụp màn hình.
3. Tải artifact `pr-quality-report-<run_id>`.
4. Push thêm một commit làm hỏng một test của bot (ví dụ đổi `assertEqual(3, ...)` thành `4` trong `test_failed_command_preserves_nonzero_exit_code`) → check chuyển đỏ, summary có "Cách khắc phục". Chụp màn hình, rồi revert.
5. Xác nhận PR không có comment hay review nào do bot tạo; người review tự approve.
