# BÁO CÁO NGÀY 26 - END TO END RELEASE REHEARSAL

**Người thực hiện:** Trần Quốc Nguyên  
**Ngày thực hiện:** 10/10/2026  
**Dự án:** CyberSoft Learning Hub  
**Commit:** `cb311b5569f871134474005fbddbdac121be2294`  
**Kết luận:** RELEASE HOLD có điều kiện (còn lỗi High, chưa rollback ứng dụng, chưa chạy lại 13 gate trên bản clone). Smoke chức năng trên bản clone mới đạt 16/16 (mục 19); lỗi seed thiếu chỉ còn ở DB cũ

## 1. Mục tiêu

Diễn tập quy trình phát hành từ chuẩn bị dữ liệu, build, test, deploy local, smoke, content gate, AI evaluation đến rollback. Mọi gate phải có exit code hoặc HTTP evidence; không được bỏ qua failure.

## 2. Kết quả từng gate

| Gate | Evidence thực tế | Kết quả |
|---|---|---|
| Preflight | Branch `main`, commit `cb311b5`. `git status --short` ngày 10/10: 34 mục (14 file đã sửa, 20 mục chưa theo dõi). 14 file sửa gồm báo cáo/index của Data-AI Task17, 18, 24 và `coach/eval/reports/*`, nhiều khả năng do chạy eval và pytest sinh lại; còn có thư mục `.tmp-jest/` | PASS, cây làm việc không sạch (xem mục 12) |
| Seed safety | MongoDB có `users: 13`, `exercises: 25`, `questions: 20`; script giữ nguyên, không dùng `--force`. Chưa kiểm nội dung: ngày 08/10 trên web đề Python báo không có câu hỏi, đề HTML5 ghi 20 câu nhưng chỉ có 2 câu, `GET /exercises` chỉ trả 2 bài | PASS về an toàn dữ liệu, CẦN XÁC MINH về nội dung (mục 11) |
| FE build | `tsc -b && vite build`, 2.121 modules, build thành công | PASS |
| BE build | `nest build`, exit code 0 | PASS |
| FE tests | 23 file, 169 test PASS | PASS |
| BE tests | 73 suite PASS; 924 PASS, 2 skip có sẵn | PASS |
| Content lint | 17/17 test PASS ngoài sandbox | PASS |
| AI evaluation | 100/100 case đạt; prompt hash `dd3d9493b07e`; `StubLlmClient` | PASS |
| Data-AI lineage/rollback tests | 24/24 PASS; 1 deprecation warning | PASS |
| Backend deploy local | Production build chạy tại `127.0.0.1:3000` | PASS |
| Frontend deploy local | Production preview chạy tại `127.0.0.1:4173` | PASS |
| Backend smoke | `GET /api/health` → HTTP 200, `mongo=connected`, 127 ms | PASS |
| Frontend smoke | `GET /` → HTTP 200, có `<div id="root"></div>`, 72 ms | PASS |
| Rollback rehearsal | `POST /api/v1/releases/rollback-plan` v1.1.0 → v1.0.0, HTTP 200, risk LOW, 5 bước. Mới tạo và kiểm tra plan, chưa rollback ứng dụng FE/BE về commit trước | PASS (rollback plan), CHƯA thử rollback ứng dụng |
| Docker full stack | Lần chạy 08:06 ngày 10/10: `docker info` exit 0, Docker Server 29.8.0 (bản đầu 00:33 bị `WSL ExecError`). Nguồn: `evidence/logs/docker-info.log` | PASS (đã hết blocker) |
| Postgres sandbox / DA Lab SQL | `docker compose ps`: `da-sandbox-sales-v1` Up, healthy, cổng 55432. DA Lab SQL: `da-sql-01` submit trả ACCEPTED 10/10 (75 ms) — `evidence/da-sql-smoke.txt` | PASS |

## 3. Seed và dữ liệu

Chạy setup an toàn, không dùng `--force`. Database đã có dữ liệu nên hệ thống giữ nguyên thay vì xóa và seed lại:

```text
users: 13
exercises: 25
questions: 20
```

Backend khởi động đã đồng bộ dữ liệu mặc định:

- Tester Lab: 10 bài.
- DA Lab: cập nhật 15 bài.
- AI Lab: cập nhật 8 bài.

Không có dữ liệu người dùng bị xóa trong rehearsal.

## 4. Build và automated tests

- FE build thành công; có cảnh báo chunk lớn hơn 500 kB, không chặn release nhưng cần theo dõi hiệu năng tải trang.
- FE: 169/169 PASS.
- BE: 924 PASS, 2 skip, 0 fail.
- Các log ERROR/WARN trong BE test là fixture kiểm thử failure path; Jest kết thúc exit code 0.
- Content lint lần đầu trong sandbox không mở được localhost test server; chạy lại ngoài sandbox đạt 17/17. Đây là lỗi môi trường sandbox, không phải defect của content lint.

## 5. AI evaluation

Coach evaluation chạy 100 case bằng `StubLlmClient`:

- Kết quả: 100/100 đạt.
- Prompt hash: `dd3d9493b07e`.
- Không phát hiện leakage score dưới ngưỡng.
- Giới hạn: đây là deterministic stub evaluation, không thay thế kiểm tra model Gemini thật khi có API key.

## 6. Deploy và smoke

Đã chạy backend production build và frontend production preview. Hai endpoint được gọi thật ngoài sandbox:

| Endpoint | HTTP | Thời gian | Kiểm tra nội dung |
|---|---:|---:|---|
| `http://127.0.0.1:3000/api/health` | 200 | 127 ms | `status=ok`, `mongo=connected` |
| `http://127.0.0.1:4173/` | 200 | 72 ms | Có root element của React |

Sau smoke, các server tạm đã được dừng để không chiếm port.

## 7. Rollback rehearsal

Đã khởi động dịch vụ Lineage & Versioning và gọi thật endpoint tạo rollback plan:

```text
From: rel_v1.1.0
To: rel_v1.0.0
Plan: plan_rollback_v1.0.0
Risk: LOW
Preflight checks: 4
Execution steps: 5
Post rollback tests: 3
```

24/24 test Data-AI PASS, gồm test rollback planner, manifest integrity, WORM store và provenance trace. Rehearsal chỉ chuyển con trỏ/kế hoạch trong môi trường kiểm thử; không ghi đè artifact bất biến.

## 8. Blocker

**Docker Desktop/WSL: đã hết.** Bản đầu (00:33 ngày 10/10) Docker báo `DockerDesktop/Wsl/ExecError`, chưa thể chứng minh Postgres, Python sandbox, DA Lab. Ở lần chạy lại lúc 08:06 (`run_release_gates.ps1`), `docker info` và `docker compose ps` đều exit 0 và container `da-sandbox-sales-v1` healthy. Đã xác nhận thêm bằng smoke:

- DA Lab chạy SQL trên Postgres sandbox: submit `da-sql-01` ACCEPTED 10/10 (`evidence/da-sql-smoke.txt`).
- Python sandbox: Run trả `stdout "5"`, exit 0 (509 ms) bằng API; lần Run đầu từ giao diện chậm hơn 10 giây (mục 18).

Chưa làm: `npm run doctor` chưa chạy lại; chưa ghi nguyên nhân Docker đã được sửa như thế nào (tester bổ sung, ví dụ khởi động lại WSL/Docker).

Lưu ý quan sát: script setup vẫn in "Postgres sandbox sẵn sàng" dù helper chỉ cảnh báo khi lỗi (D26-04); release gate phải dựa vào `docker compose ps`.

## 9. Quyết định release

**HOLD full release** (cập nhật 10/10 08:25). Docker không còn là lý do. Các điều kiện còn lại:

1. Seed đủ dữ liệu: ĐÃ ĐẠT trên bản clone mới (60 câu quiz, 45 bài đều có test case, mục 19); DB cũ vẫn thiếu, nên dùng DB của bản clone cho release.
2. Smoke chức năng không còn FAIL: ĐÃ ĐẠT 16/16 trên bản clone mới (mục 19); mục 18 là kết quả lần 1 trên DB cũ.
3. Quyết định cho các lỗi High (mục 12, 16).
4. Chạy lại `npm run doctor` không còn mục đỏ.
5. Rollback ứng dụng thật (mục 17).
6. Cây làm việc sạch (mục 15).

Cho phép tiếp tục review phần FE/BE/Mongo/Postgres đã PASS.

## 10. Tiêu chí nghiệm thu Ngày 26

- [x] Seed được kiểm tra an toàn, không xóa dữ liệu cũ.
- [x] Evidence đủ cho từng gate: 13 log trong `evidence/logs/`, `evidence/gate-timing.csv`, ảnh smoke.
- [x] Build FE và BE.
- [x] Smoke FE và BE có HTTP evidence.
- [x] Content gate chạy độc lập.
- [x] AI evaluation có phiên bản prompt/model.
- [x] Rollback plan được gọi thật và test tự động PASS.
- [x] Có thời gian từng gate và điểm nghẽn đo thật (mục 13).
- [x] Có owner/action cho blocker (deadline chưa được xác nhận).
- [x] Full Docker/Postgres sandbox rehearsal: PASS ở lần chạy 08:06 (Docker, compose ps healthy, DA Lab SQL ACCEPTED).

Ngày 26 đã tạo được quy trình và evidence đầy đủ cho các gate chạy được, nhưng điều kiện “không bỏ qua failure” yêu cầu giữ trạng thái RELEASE HOLD cho đến khi blocker Docker được xử lý.


## 11. Đối chiếu dữ liệu seed với giao diện

Kết quả đối chiếu ngày 10/10/2026 (08:15, từ trình duyệt vào BE `127.0.0.1:3000`):

| Hạng mục | Nguồn seed trong repo | Gate seed (MongoDB) | Thấy trên web/API | Kết luận |
|---|---|---|---|---|
| Câu hỏi quiz | `learning-hub/BE/src/data/initial-quiz-questions.ts`: 60 câu (20 Python, 20 HTML5, 20 CSS3) | `questions: 20` | Ngày 08/10: đề Python báo không có câu hỏi, đề HTML5 chỉ có 2 câu dù thẻ ghi 20 | **Thiếu 40 câu so với seed**; DB local chưa seed đủ |
| Bài tập `exercises` | Chưa đối chiếu file seed | `exercises: 25` | `GET /api/exercises` trả 2 bài, cả hai `testCaseCount = 0` | Chưa khớp, chưa rõ 25 gồm những bài nào |
| Bài giảng `authoring/lessons` | - | - | 29 bài | Ghi nhận |

Nguyên nhân khả dĩ (giả thuyết, chưa xác minh): `npm run setup` giữ nguyên khi DB đã có dữ liệu, nên không bổ sung phần còn thiếu của từng collection. Gate seed "PASS" vì không xóa dữ liệu, nhưng chưa chứng minh DB có đủ dữ liệu cho release. Cần quyết định cách bổ sung (seed theo collection, hoặc chỉ seed collection trống) và chạy lại gate; không dùng `seed:all` vì có `--force`.

## 12. Lỗi đang mở ảnh hưởng quyết định release

Từ `Test/Day23_Defect_Analytics_Tran_Quoc_Nguyen` và `Test/Day24_Exploratory_Testing_Tran_Quoc_Nguyen`:

| Lỗi | Mô tả | Mức |
|---|---|---|
| DEF-026 | Gửi object thay cho chuỗi làm API (login, forgot-password...) trả 500; tái hiện lại ngày 08/10 | High |
| DEF-021 | AI Coach không nhận diện yêu cầu không phù hợp với trẻ | High |
| DEF-023 | AI Coach nhắc lại traceback có đường dẫn nội bộ | High |
| DEF-034 | Bài do giáo viên soạn không thể đạt (test ẩn chạy với input rỗng) | High |
| DEF-019 | Mã phim không tồn tại trả 500 | High |
| DEF-012 | Bộ test bài số nguyên tố để lọt lời giải sai | High |
| B24-01 | Forgot-password không giới hạn tần suất (12/12 request trả 201) | Medium |
| B24-02 | Nộp bài với code rỗng trả 500 | Medium |

Các lỗi trên không bị gate tự động của Ngày 26 phát hiện (smoke chỉ kiểm `/api/health` và trang chủ). Quyết định HOLD vì vậy không chỉ do Docker: cần quyết định riêng cho các lỗi High này. Số liệu lấy từ các file Excel Ngày 23 và 24 ở thời điểm 08/10.

Smoke chức năng cần bổ sung ít nhất: đăng nhập, bắt đầu và nộp một quiz, chạy một bài trong Playground, gửi một câu cho AI Coach.

## 13. Bằng chứng và thời gian từng gate

`run_release_gates.ps1 -IncludeSmoke` chạy ngày 10/10/2026 từ 08:05:52, **13/13 gate PASS**, tổng 57,6 giây. Log từng gate: `evidence/logs/`; bảng: `evidence/gate-timing.csv`.

| Gate | Giây | Gate | Giây |
|---|---:|---|---:|
| preflight-commit | 0,07 | ai-eval | 2,04 |
| preflight-status | 0,11 | data-ai-pytest | 1,30 |
| fe-build | 8,39 | docker-info | 0,59 |
| be-build | 10,39 | docker-compose-ps | 0,22 |
| fe-test | 2,14 | smoke-be | 0,11 |
| **be-test** | **30,92** | smoke-fe | 0,03 |
| content-lint | 1,26 | | |

Điểm nghẽn: `be-test` (30,92 giây, 54% tổng thời gian), tiếp theo `be-build` và `fe-build`. Không có gate nào chậm bất thường.

Lưu ý: `npm run eval:coach` và `pytest` sinh lại báo cáo trong repo (xem mục 15); không commit các thay đổi này.

## 14. Sửa blocker Docker

Blocker đã hết khi chạy lại lúc 08:06 (mục 8). Chưa có ghi chép bước đã làm. Tester bổ sung: _đã làm gì (ví dụ `wsl --shutdown`, cập nhật WSL, mở lại Docker Desktop) và lúc nào_.

## 15. Phân loại cây làm việc (git)

`git status --short` ngày 10/10 sau rehearsal, commit `cb311b5`: 14 file đã sửa, 20 mục chưa theo dõi. Chưa xóa hay khôi phục file nào.

| Nhóm | File | Nhận định | Đề xuất |
|---|---|---|---|
| Sinh lại khi chạy eval/pytest | `learning-hub/BE/src/modules-api/coach/eval/reports/baseline-report.json`, `.md`, `history/dd3d9493b07e_StubLlmClient.json` | Chỉ đổi `generatedAt` (1 dòng mỗi file) | Không commit; khôi phục bằng `git restore -- <file>` |
| Sinh lại khi chạy pytest Data-AI | `Data-AI-Resource/BaoCao_Task17/indexes/*`, `reports/*`; `BaoCao_Task18/reports/*`; `BaoCao_Task24/data/artifacts/.../metadata.json` (10 file) | Báo cáo và index được tạo lại, diff rất lớn nhưng cùng nội dung logic | Không commit; khôi phục sau khi lưu gate evidence |
| File của tester | `Test/Day11_Content_Lint_Tran_Quoc_Nguyen/Bao_Cao_Ngay_11Tran_Quoc_Nguyen_Bo_Sung.xlsx` | Đã sửa 55 byte, có thể do mở/lưu bằng Excel | Tester xem lại rồi quyết định giữ hoặc khôi phục |
| Bài làm các ngày | `Test/Day13 ... Day26`, `Test/day21/`, `Test/ngay16/`, file docx, xlsx Day16, Day23 | Sản phẩm của tester, chưa commit | Commit theo nhánh từng ngày |
| File rác/tạm | `.tmp-jest/`, `learning-hub/FE/src/components/TeacherContestAuthoring.tsx.backup`, `.conflict-backup` | Thư mục tạm của Jest; hai file backup nằm trong mã nguồn | Thêm `.tmp-jest/` vào `.gitignore`; xóa hoặc chuyển hai file backup ra ngoài sau khi chắc chắn không còn cần |
| File lớn không thuộc mã nguồn | `weights/`, `yolov8n.pt` | Trọng số mô hình, không liên quan release | Không commit; đưa vào `.gitignore` hoặc chuyển khỏi repo |

Để đo gate cho sạch từ đầu, chạy `git status --short > evidence/git-status-before.txt` trước và `... -after.txt` sau khi chạy script. Script `run_release_gates.ps1` cũng ghi `preflight-status.log`.

## 16. Quyết định cho các lỗi High (tester và mentor điền)

Các đề xuất dưới đây của QA (AI soạn từ log Ngày 23/24), chưa phải quyết định. Cột "Quyết định" để trống cho người có thẩm quyền.

| Lỗi | Tác động nếu phát hành | Đề xuất của QA | Quyết định | Người quyết định | Ngày |
|---|---|---|---|---|---|
| DEF-021: Coach không từ chối yêu cầu không phù hợp cho trẻ | Sản phẩm phục vụ lớp 3 đến 12 | Chặn release cho tới khi thêm nhánh child-safety | | | |
| DEF-023: Coach nhắc lại traceback có đường dẫn nội bộ | Lộ cấu trúc máy chủ | Sửa trước release | | | |
| DEF-026: object thay chuỗi làm API trả 500 | Lỗi 500 hàng loạt; dữ liệu rác | Sửa trước release (bật validation) | | | |
| DEF-019: mã phim không tồn tại trả 500 | Lỗi 500 ở lab tester | Sửa hoặc chấp nhận nếu lab chưa mở cho học viên | | | |
| DEF-034: bài giáo viên soạn không thể đạt | Giáo viên không dùng được bài tự soạn | Chặn nếu release gồm tính năng giáo viên soạn bài | | | |
| DEF-012: bộ test bài số nguyên tố để lọt lời giải sai | Chấm sai một bài | Chấp nhận tạm có điều kiện, sửa trong sprint tới | | | |
| B24-01: forgot-password không giới hạn tần suất | Spam email | Sửa trước release hoặc giới hạn ở tầng hạ tầng | | | |
| B24-02: nộp code rỗng trả 500 | Lỗi 500 | Sửa nhanh (kiểm tra input) | | | |

## 17. Rollback ứng dụng

Chưa chạy. Có thể chạy `run_rollback_rehearsal.ps1` (mặc định chỉ in kế hoạch; thêm `-Execute` mới chạy thật). Script tạo worktree riêng của commit trước (`HEAD~1`), build BE ở đó, chạy trên cổng 3100 để không đụng bản đang chạy, smoke `/api/health`, rồi dừng tiến trình và gỡ worktree. Chưa được chạy thử.

## 18. Smoke chức năng

Chạy ngày 10/10/2026 08:18 đến 08:23, chi tiết và ảnh ở `evidence/functional-smoke.md`.

| Bước | Kết quả |
|---|---|
| Đăng nhập (phiên tester) | PASS |
| Quiz HTML5 làm và nộp | PASS (đề chỉ có 2 câu) |
| Quiz Python bắt đầu | FAIL: không có câu hỏi |
| Playground Run | PASS có lưu ý: lần đầu quá 10 giây, FE báo sai lỗi kết nối |
| Playground Submit | FAIL: bài 0 test case, không chấm được |
| AI Coach | PASS chạy được, trả lời mẫu không bám câu hỏi |

Hai bước FAIL gắn với dữ liệu seed thiếu (mục 11, D26-08). Lỗi mới ghi nhận: **B26-01** - lần Run đầu tiên sau khi BE khởi động mất hơn 10 giây, FE báo "Không thể kết nối tới máy chủ chạy code" dù BE hoạt động (D26-12). Chưa kiểm tra nguyên nhân (khởi động lạnh của runner hay độ trễ Docker/WSL).

## 19. Smoke chức năng lần 2: bản clone mới, DB seed đầy đủ

Chạy ngày 10/10/2026 từ 17:15, chi tiết ở `evidence/functional-smoke.md` (phần "Lần chạy 2"). Môi trường khác lần 1: repo clone mới `D:\thuctap\clone\cybersoft-learning-hub`, commit `2489931`, dựng bằng `npm run setup` (DB `cybersoft` mới, seed đầy đủ), BE `localhost:3000` (dev), FE `localhost:5173`. Data service (cổng 8000) chưa bật nên DA Lab và AI Lab dùng dữ liệu tích hợp sẵn của BE.

| Hạng mục | Lần 1 (DB cũ) | Lần 2 (clone mới) |
|---|---|---|
| Số câu quiz | 20 (chỉ 2 câu HTML5, Python không có) | 60 (HTML5 20, Python 20); nộp quiz Python GRADED |
| Số bài Playground | 2 bài, 0 test case | 45 bài, không bài nào 0 test case |
| Run code đúng | Lần đầu quá 10 giây, FE báo lỗi kết nối | 616 ms lần đầu, 509 ms lần hai, stdout `5` |
| Submit code đúng / sai | FAIL, báo 0/0 test | AC 4/4 / WA 0/4 |
| DA Lab SQL | ACCEPTED 10/10 | ACCEPTED 10/10; chặn `DROP TABLE` đúng |
| AI Coach | Trả lời mẫu, không bám câu hỏi | Giống: thiếu `GEMINI_API_KEY` |
| Phân quyền | - | student gọi `/exercises/:slug/full` bị 403 |

**Kết luận:** 16/16 bước đạt, hai FAIL của lần 1 không tái hiện, xác nhận nguyên nhân là dữ liệu seed thiếu ở DB cũ (D26-08), không phải lỗi mã nguồn. Lỗi B26-01 (Run đầu quá 10 giây) cũng không tái hiện ở lần này, nhưng chưa kết luận được nguyên nhân (có thể do BE đã khởi động từ trước hoặc Docker đã nóng); giữ D26-12 ở trạng thái "chưa tái hiện, theo dõi".

**Chưa kiểm ở lần này:** Data service thật (cổng 8000) và `npm run ingest:sandbox`; Run/Submit qua giao diện (chỉ qua API); đăng nhập bằng form; AI Coach với khóa Gemini thật; 13 gate tự động trên bản clone (cần chạy `run_release_gates.ps1 -IncludeSmoke` trong thư mục này, cần PowerShell).

**Dữ liệu thử để lại:** 4 lượt quiz, 2 bài nộp Playground, 3 bài nộp DA Lab, 1 tin nhắn coach (DB dev `cybersoft`).
