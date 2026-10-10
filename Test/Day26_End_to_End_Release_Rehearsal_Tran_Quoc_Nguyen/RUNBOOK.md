# RUNBOOK NGÀY 26 - RELEASE REHEARSAL

## 0. Chạy tự động các gate (khuyến nghị)

```powershell
cd D:\thuctap\cybersoft-learning-hub
powershell -ExecutionPolicy Bypass -File .\Test\Day26_End_to_End_Release_Rehearsal_Tran_Quoc_Nguyen\run_release_gates.ps1
```

Script chạy preflight, build, test, content lint, AI eval, pytest Data-AI, Docker, ghi log từng gate (`evidence/logs/`) và thời gian (`evidence/gate-timing.csv`). Thêm `-IncludeSmoke` sau khi bật BE và FE preview ở mục 7. Các mục 1 đến 9 bên dưới là bước chạy tay tương ứng.

## 1. Preflight

```powershell
cd D:\thuctap\cybersoft-learning-hub
git rev-parse HEAD
git status --short   # ghi lại kết quả; cây không sạch thì ghi rõ file nào
node --version
npm --version
docker info
```

Nếu Docker lỗi, ghi BLOCKED và không đánh PASS cho Postgres/DA Lab.

## 2. Setup và seed an toàn

Không dùng `npm run seed:all` khi database có dữ liệu vì lệnh đó dùng `--force` và xóa dữ liệu cũ.

```powershell
cd D:\thuctap\cybersoft-learning-hub\learning-hub
npm run setup -- --skip-install
```

Kỳ vọng: nếu MongoDB có dữ liệu, setup báo giữ nguyên. Chỉ seed khi collection còn trống.

## 3. Build

```powershell
cd D:\thuctap\cybersoft-learning-hub\learning-hub\BE
npm run build

cd D:\thuctap\cybersoft-learning-hub\learning-hub\FE
npm run build
```

Gate PASS khi cả hai lệnh trả exit code 0.

## 4. Automated tests

```powershell
cd D:\thuctap\cybersoft-learning-hub\learning-hub\BE
npm test -- --runInBand

cd D:\thuctap\cybersoft-learning-hub\learning-hub\FE
npm test
```

Kỳ vọng hiện tại: BE 73 suite, 924 PASS, 2 skip; FE 23 file, 169 PASS.

## 5. Content gate

```powershell
cd D:\thuctap\cybersoft-learning-hub\Test\Day11_Content_Lint_Tran_Quoc_Nguyen\tools\content-lint
node --test tests\content-lint.test.js
```

Kỳ vọng: 17/17 PASS. Nếu môi trường sandbox chặn localhost, chạy trong terminal Windows bình thường và ghi rõ phân loại lỗi môi trường.

## 6. AI evaluation

```powershell
cd D:\thuctap\cybersoft-learning-hub\learning-hub\BE
npm run eval:coach
```

Ghi số case, prompt hash và LLM client. Không gọi stub result là model production result.

## 7. Deploy local

Mở hai terminal:

```powershell
# Terminal 1
cd D:\thuctap\cybersoft-learning-hub\learning-hub\BE
$env:PORT='3000'
npm run start:prod
```

```powershell
# Terminal 2
cd D:\thuctap\cybersoft-learning-hub\learning-hub\FE
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

## 8. Smoke

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health
Invoke-WebRequest http://127.0.0.1:4173/ -UseBasicParsing
```

PASS khi backend trả 200 và `mongo=connected`; frontend trả 200 và có root element.

## 8b. Smoke chức năng (bổ sung)

Sau smoke ở mục 8, thử tay trên `http://127.0.0.1:4173/` bằng tài khoản test: đăng nhập, bắt đầu và nộp một quiz, chạy một bài Playground, gửi một câu cho AI Coach. Ghi PASS/FAIL, chụp ảnh. Không dùng tài khoản thật.

## 9. Docker và DA Lab

```powershell
cd D:\thuctap\cybersoft-learning-hub\learning-hub
docker compose up -d postgres-sandbox
docker compose ps
npm run doctor
```

Chỉ PASS khi `da-sandbox-sales-v1` ở trạng thái healthy. Không dựa riêng thông báo của setup script.

## 10. Rollback rehearsal Data-AI

```powershell
cd D:\thuctap\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task24
py -m pytest tests -v
py scripts\run_server.py
```

Trong terminal khác:

```powershell
$body = @{
  current_release_id = 'rel_v1.1.0'
  target_release_id  = 'rel_v1.0.0'
  operator           = 'Tran Quoc Nguyen - QA'
  reason             = 'Day 26 release rehearsal rollback verification'
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/api/v1/releases/rollback-plan `
  -Method Post -ContentType application/json -Body $body
```

PASS khi HTTP 200, plan từ `rel_v1.1.0` về `rel_v1.0.0`, có preflight, execution steps và post-tests.

## 11. Cleanup

- Dừng backend, frontend và Data-AI server bằng `Ctrl+C`.
- Nếu Docker đã dùng cho rehearsal: `docker compose down` chỉ khi chắc chắn container thuộc dự án này.
- Không xóa volume nếu chưa có phê duyệt vì volume chứa dữ liệu.

## 12. Release decision

- Tất cả gate blocking PASS và không còn lỗi High chưa có quyết định: READY.
- Có gate FAIL/BLOCKED: HOLD, ghi owner và deadline.
- Không đổi FAIL thành PASS chỉ vì chạy lại; phải ghi nguyên nhân của lần đầu.


## 13. Sau khi chạy xong

- `npm run eval:coach` và pytest có thể sinh lại file báo cáo trong repo. Chạy `git status --short` và xem `git diff`; không commit các file sinh tự động nếu không thuộc phạm vi.
- Rollback ứng dụng (chưa rehearsal): checkout commit trước vào thư mục tạm, build, chạy lại smoke, rồi quay lại commit hiện tại. Chỉ làm khi cây làm việc sạch.
