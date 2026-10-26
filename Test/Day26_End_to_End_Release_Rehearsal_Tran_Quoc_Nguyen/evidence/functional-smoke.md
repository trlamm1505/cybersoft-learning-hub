# Smoke chức năng - Day 26

Chạy ngày 10/10/2026 từ 08:18 đến 08:23 (giờ Việt Nam), qua Chrome của tester, tài khoản student đã đăng nhập sẵn (tester tự đăng nhập, không nhập mật khẩu hộ). Môi trường: BE `127.0.0.1:3000` (production build), FE preview `127.0.0.1:4173`. Commit `cb311b5`.

## Không cần đăng nhập (08:15)

| Bước | Kết quả |
|---|---|
| GET /api/health | PASS: 200, 8 ms, status=ok, mongo=connected |
| GET /api/exercises | Ghi nhận: 200, 2 bài, cả hai testCaseCount = 0 |
| GET /api/authoring/lessons | PASS: 200, 29 bài |
| GET /api/auth/me không token | PASS: 401 |

## Cần đăng nhập

| # | Bước | Kỳ vọng | Kết quả | Evidence |
|---|---|---|---|---|
| 1 | Phiên đăng nhập | `/auth/me` 200, vào được catalog | PASS | token hợp lệ, `/auth/me` 200 lúc 08:18 |
| 2 | Quiz HTML5: bắt đầu, làm, nộp | Có kết quả điểm | PASS: đề chỉ có 2 câu (thẻ ghi 20 câu), kết quả 20/20 điểm, 2/2 câu đúng | `smoke-02-quiz-html5-ket-qua.jpg` |
| 3 | Quiz Python: bắt đầu | Có câu hỏi | **FAIL**: banner "Không tìm thấy câu hỏi nào trong hệ thống bài thi" (DEF-029; DB thiếu 40 câu so với seed, mục 11) | `smoke-03-quiz-python-khong-co-cau-hoi.jpg` |
| 4 | Playground Run (bài 1, code mẫu) | stdout đúng | PASS có lưu ý: lần Run đầu mất hơn 10 giây, FE báo "Không thể kết nối tới máy chủ chạy code. Vui lòng kiểm tra lại backend" dù BE đang chạy (cold start vượt timeout 10 giây của FE); lần hai 828 ms, trả EOFError vì code mẫu cần input mà STDIN trống (đúng). Gọi API trực tiếp với code đúng: 201, stdout "5", 509 ms | `smoke-04-run-lan-dau-timeout-10s.jpg`, `smoke-04-run-lan-hai-ok-stdin-rong.jpg` |
| 5 | Playground Submit | Có kết quả chấm | **FAIL**: "Lỗi hệ thống khi chấm bài (0/0 test) - Bài tập thiếu Test Cases, không thể chấm điểm". Cả 2 bài trong DB đều 0 test case. Gọi API submit trả 201 QUEUED | `smoke-05-submit-bai-0-test.jpg` |
| 6 | AI Coach: hỏi cách đọc hai số nguyên từ input | Trả lời bám câu hỏi | PASS chạy được, chất lượng chưa đạt: trả lời mẫu "Lần nộp gần nhất bạn đạt 0/0 test..." không trả lời câu hỏi. Lịch sử hội thoại còn dòng `[debug-loop] ... Tất cả 0/0 test đã pass` | `smoke-06-ai-coach-tra-loi.png` |

## Kết luận

4 bước đạt (có lưu ý), 2 bước FAIL (Quiz Python, Submit). Cả hai FAIL liên quan dữ liệu seed thiếu (D26-08) nên không chặn riêng về mã nguồn nhưng chặn phát hành trên DB này. Dữ liệu rác để lại: 1 lượt quiz HTML5, 2 bài nộp, 1 tin nhắn coach.

---

# Lần chạy 2: bản clone mới, DB seed đầy đủ (10/10/2026, 17:15 đến 17:30 giờ Việt Nam)

Môi trường: repo clone mới `D:\thuctap\clone\cybersoft-learning-hub`, commit `2489931` (nhánh main, sau PR #121). Dựng bằng `npm run setup` (DB `cybersoft` mới, seed đầy đủ). BE `localhost:3000` (dev), FE `localhost:5173`. Tài khoản `student@gmail.com` (tài khoản mẫu trong README; tester cung cấp mật khẩu mẫu). Data service (cổng 8000) CHƯA bật, `DATA_SERVICE_BASE_URL` để trống nên DA Lab/AI Lab dùng dữ liệu tích hợp sẵn của BE. Kiểm qua Chrome của tester, gọi API từ trang FE (có token đăng nhập).

| # | Bước | Kỳ vọng | Kết quả | Chi tiết |
|---|---|---|---|---|
| 0 | `GET /api/health` | 200, mongo connected | PASS | 200, 6 ms, `mongo: connected` |
| 1 | Đăng nhập student | Có token | PASS | `POST /auth/login` 201, role STUDENT |
| 2 | Số bài và test case | Mọi bài có test case | PASS | `GET /exercises`: 45 bài, không bài nào testCaseCount = 0 |
| 3 | Quiz không lọc chủ đề | 60 câu | PASS | `POST /quiz/start`: 201, 60 câu |
| 4 | Quiz HTML5 | 20 câu | PASS | 201, 20 câu |
| 5 | Quiz Python: bắt đầu, nộp, xem review | Có câu, có điểm | PASS | 201, 20 câu; nộp 201 (30 ms) status GRADED, điểm 40/200 (chọn đáp án A cho mọi câu, điểm thấp là đúng kỳ vọng); review 200 |
| 6 | Playground Run, code đúng | stdout `5` | PASS | lần 1: 616 ms; lần 2: 509 ms, stdout `5`, exitCode 0 (không có lỗi quá 10 giây ở lần đầu) |
| 7 | Playground Submit, code đúng | AC | PASS | QUEUED rồi AC 4/4 test |
| 8 | Playground Submit, code sai (a - b) | WA | PASS | WA 0/4 |
| 9 | Phân quyền: student gọi `/exercises/:slug/full` | 403 | PASS | 403 |
| 10 | DA Lab: dataset, Run | Có schema, có dòng | PASS | `da-sql-01/dataset` 200 (10 ms); Run `SELECT * FROM orders LIMIT 2` 201, 83 ms, 8 cột |
| 11 | DA Lab: chặn câu không phải SELECT | Từ chối | PASS | `DROP TABLE orders` trả REJECTED |
| 12 | DA Lab: Submit SQL đúng | ACCEPTED | PASS | ACCEPTED 10/10 (63 ms). Hai lần nộp đầu của mình sai cột (`SELECT *`, rồi `customer_id` thay `order_date`) nên WRONG_ANSWER 0/10 kèm phản hồi đúng nguyên nhân; đây là lỗi của câu SQL, không phải lỗi hệ thống |
| 13 | AI Lab: đọc bài, evaluation set | 200 | PASS | `ai-lab-01` 200; evaluation-set 200 (11 ms), 4 câu |
| 14 | AI Coach | Trả lời bám câu hỏi | PASS chạy được, chất lượng chưa đạt | 201 (26 ms). Không có `GEMINI_API_KEY` nên coach trả mẫu "Lần nộp gần nhất bạn đạt 0/4 test..." không trả lời câu hỏi đọc hai số nguyên. Giống kết quả lần 1 |
| 15 | Bài học, hợp đồng | Có dữ liệu | PASS | `/authoring/lessons` 200, 62 bài; `/contests` 200, 3 cuộc thi |
| 16 | FE kết nối BE | Trang danh mục hiện | PASS | `/catalog` hiển thị đầy đủ (ảnh chụp màn hình) |

## Kết luận lần 2

16/16 bước đạt (riêng AI Coach chạy được nhưng chất lượng chưa đạt vì thiếu khóa Gemini). Hai lỗi FAIL của lần 1 (Quiz Python không có câu, Submit báo 0/0 test) KHÔNG tái hiện trên DB seed đầy đủ, nên nguyên nhân là dữ liệu seed thiếu ở DB cũ (D26-08), không phải lỗi mã nguồn.

Chưa kiểm ở lần này: Data service thật (cổng 8000) và `npm run ingest:sandbox`; chạy bài Python bằng giao diện (chỉ gọi API); luồng đăng nhập bằng form trên giao diện; AI Coach với khóa Gemini thật.

Dữ liệu thử để lại trong DB `cybersoft` (môi trường dev của tester): 4 lượt quiz (1 đã nộp), 2 bài nộp Playground (1 AC, 1 WA), 3 bài nộp DA Lab (1 ACCEPTED, 2 WRONG_ANSWER), 1 tin nhắn AI Coach.
