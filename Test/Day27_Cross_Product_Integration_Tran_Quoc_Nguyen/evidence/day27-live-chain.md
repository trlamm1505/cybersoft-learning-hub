# Day 27 - Chuỗi tích hợp chạy thật trên web local (10/10/2026, 21:56 đến 22:05 giờ Việt Nam)

Môi trường: bản clone `D:\thuctap\clone\cybersoft-learning-hub`, BE `localhost:3000` (dev), FE `localhost:5173`, MongoDB `cybersoft`, Postgres sandbox. Tài khoản mẫu trong README: `student@gmail.com`, `teacher@gmail.com`. Gọi API từ trang FE trong Chrome của tester.

**Nguồn Registry của BE trong lần chạy này: dữ liệu tích hợp sẵn** (`DATA_SERVICE_BASE_URL` trong `BE/.env` để trống), dù Data service `127.0.0.1:8000` đang chạy. Registry thật được kiểm riêng bằng hai test LIVE trong `run_day27_checks.ps1` (xem `day27-integration-test.log`). Chuỗi BE gọi Registry thật chưa chạy (`D27-GAP-003`).

## Chuỗi A - DA Lab SQL: Registry -> giao bài -> nộp -> chấm -> giảng viên xem

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| A1 | `GET /da-labs/da-sql-01/dataset` (student) | 200; `resource_id=ds-retail-ecommerce-sales-v1`, `version=v1.0`, 5 bảng; không có `sandbox_db_url` hay `postgresql://` | PASS |
| A2 | `POST /da-labs/da-sql-01/submit` SQL đúng | 201, ACCEPTED 10/10 (100 ms) | PASS |
| A3 | Nộp lại cùng bài | 201, ACCEPTED; teacher thấy 1 bản ghi với `attemptCount = 2` (cập nhật bản cũ, không tạo rác) | PASS |
| A4 | Teacher `GET /teacher/submissions/da?type=SQL` | 200, thấy bài, GRADED, điểm 10, `bestScore` 10 | PASS |
| A5 | Student `GET /teacher/submissions/da?type=SQL` | 403 | PASS |
| A6 | Student `GET /teacher/submissions/pending` | 403 | PASS |

## Chuỗi B - DA Lab Insight: nộp -> chờ chấm tay -> giảng viên review -> học viên thấy kết quả

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| B1 | Student `POST /da-labs/da-insight-01/insight` (câu trả lời ngắn) | 201, PENDING_REVIEW, phản hồi "cần ít nhất 40 từ... đã lưu để giảng viên chấm" | PASS (bài được lưu, không chấm bừa) |
| B2 | Teacher `GET /teacher/submissions/pending` | 200, hàng chờ có bài vừa nộp | PASS |
| B3 | Student `PUT /teacher/submissions/:id/review` | **403** | PASS |
| B4 | Teacher review điểm 11 (ngoài khoảng) | 400, không lưu | PASS |
| B5 | Teacher review id không tồn tại | 404 | PASS |
| B6 | Teacher review điểm 7 kèm nhận xét | 200, GRADED, điểm 7 | PASS |
| B7 | Teacher `GET /teacher/submissions/pending` lại | Bài đã chấm không còn trong hàng chờ | PASS |
| B8 | Student `GET /da-labs/exercises/:id/my-submission` | 200, GRADED, điểm 7, thấy nhận xét giảng viên | PASS |

## Chuỗi C - AI Lab: evaluation set -> nộp prompt -> chấm -> tái lập

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| C1 | `GET /ai-labs/ai-lab-01/evaluation-set` | 200; `eval-cs-faq-basic-v1`, 4 câu, `v1.0`; không lộ `ground_truth` | PASS |
| C2 | Student `POST /ai-labs/ai-lab-01/submit` | 201, PASSED, điểm 9,4/10, quality 93,8 (28 ms) | PASS |
| C3 | Nộp lại đúng cùng prompt, model, config | Cùng điểm 9,4, cùng quality 93,8, cùng `promptSha256` và cùng `seed` | PASS (tái lập) |
| C4 | Prompt chứa chuỗi giống API key | 400, thông báo không lặp lại chuỗi key | PASS |
| C5 | Student `GET /teacher/ai-lab-submissions` | 403; teacher: 200 (1 bản ghi) | PASS |

## Kết luận

19/19 bước PASS. Chuỗi nộp -> chấm -> giảng viên review chạy xuyên suốt trên BE, MongoDB và Postgres thật; phân quyền, quy tắc từ chối và khả năng tái lập đều đúng. Giới hạn: Registry của BE lúc này là dữ liệu tích hợp sẵn; AI Lab chấm bằng bộ chấm mô phỏng trong BE (không có `GEMINI_API_KEY`).

Dữ liệu thử để lại trong DB dev `cybersoft`: 1 bài SQL (2 lần nộp), 1 bài Insight (đã chấm 7 điểm), 1 bài AI Lab (nhiều lần chạy) của `student@gmail.com`; không đụng dữ liệu của người dùng khác.

---

# Lần chạy với Registry thật (11/10/2026, 14:27 đến 14:36 giờ Việt Nam)

Môi trường: BE `localhost:3000` và FE `localhost:5173` khởi động bằng `npm.cmd run dev`; `learning-hub/.env` và `learning-hub/BE/.env` đều có `DATA_SERVICE_BASE_URL=http://127.0.0.1:8000` và API key dev (không ghi lại ở đây); `DATA_SERVICE_FALLBACK` không bật. Registry thật là Data service `Data-AI-Resource/BaoCao_Task21` (`scripts/run_server.py`, cổng 8000). Docker Desktop và Postgres sandbox (cổng 55432) phải bật lại trước khi chạy chuỗi A (xem "Ghi chú trung thực").

## Bước 2 - BE dùng Registry thật

| Kiểm tra | Kết quả | Trạng thái |
|---|---|---|
| `GET /da-labs/da-sql-01/dataset` (student) | 200; `dataset_name` = "Bộ Dữ Liệu Bán Hàng E-Commerce Đa Bảng (Retail Sales v1.0)" (bản tích hợp sẵn trả "Sales Performance (Retail Sales v1.0)"); `resource_id=ds-retail-ecommerce-sales-v1`, `v1.0`, 5 bảng; không có `sandbox_db_url`/`postgresql://` | PASS |
| Access log của Data service | Có `GET /api/v1/registry/datasets/ds-retail-ecommerce-sales-v1` và `GET /api/v1/registry/evaluation-sets/eval-policy-curriculum-v1` trả 200 OK từ BE (5 request ở phiên đầu, 2 request sau khi bật lại) | PASS (bằng chứng BE gọi Registry thật) |

## Chuỗi A - DA Lab SQL (Registry thật)

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| A1 | `GET /da-labs/da-sql-01/dataset` | 200, như bảng trên | PASS |
| A2 | `POST /da-labs/da-sql-01/submit` SQL đúng | 201, ACCEPTED 10/10, 6 dòng kết quả | PASS |
| A3 | Nộp lại cùng bài | 201, ACCEPTED; teacher vẫn thấy 1 bản ghi của student cho da-sql-01 (cập nhật, không tạo thêm) | PASS |
| A4 | Teacher `GET /teacher/submissions/da?type=SQL` | 200, GRADED, điểm 10, `bestScore` 10 | PASS |
| A5 | Student `GET /teacher/submissions/da?type=SQL` | 403 | PASS |
| A6 | Student `GET /teacher/submissions/pending` | 403 | PASS |

## Chuỗi C - AI Lab (Registry thật)

| # | Bước | Kết quả | Trạng thái |
|---|---|---|---|
| C1 | `GET /ai-labs/ai-lab-01/evaluation-set` | 200; `eval-cs-faq-basic-v1`, 4 câu, `eval-policy-curriculum-v1@v1.0`; không lộ `ground_truth` | PASS |
| C2 | Student `POST /ai-labs/ai-lab-01/submit` (`gemini-2.5-flash`, temperature 0,2, maxTokens 256) | 201, PASSED, điểm 9/10, quality 90, cost 0,000374 | PASS |
| C3 | Nộp lại cùng prompt/model/config (2 lần liên tiếp, so từng trường) | Cùng điểm, quality, cost, `promptSha256` (`99fa46a7...`), `seed` (`3440baee4d435f92`), checksum evaluation set (`e19e9bca...`) | PASS (tái lập) |
| C4 | Prompt chứa chuỗi giống API key | 400 "Không được để lộ API Key trong submission" | PASS |
| C5 | Student `GET /teacher/ai-lab-submissions` | 403; teacher: 200 | PASS |

Chuỗi A và C: 11/11 bước PASS với Registry thật.

## Registry tắt khi BE đang chạy (Data service dừng, BE vẫn chạy)

`DATA_SERVICE_FALLBACK` không bật nên BE không dùng dữ liệu tích hợp sẵn.

| Thời điểm | Request | Kết quả | Nhận xét |
|---|---|---|---|
| Ngay sau khi tắt (cache BE còn hạn, TTL 60 giây) | `GET .../da-sql-01/dataset`, `da-sql-02/dataset`, `ai-lab-01/evaluation-set`, `ai-lab-02/evaluation-set` | 200 cho cả 4, nội dung giống lúc Registry còn chạy | Phục vụ từ cache trong BE, không phải fallback; che mất sự cố tối đa 60 giây |
| Sau khi cache hết hạn (> 60 giây) | 4 request trên | **503 Service Unavailable** cả 4, ~14 ms | Lỗi rõ ràng, không fallback ngầm, không 502 |

Nội dung 503: "Không kết nối được máy chủ dữ liệu (DATA_SERVICE_BASE_URL). Hãy bật máy chủ đó, hoặc để trống DATA_SERVICE_BASE_URL để dùng dữ liệu tích hợp sẵn trong backend".

Kiểm tra lộ thông tin: response (cả 8 request) không chứa `sandbox_db_url`, `postgresql://`, `127.0.0.1`, `:8000`, `ECONNREFUSED`, `X-API-Key`. URL nội bộ và `ECONNREFUSED 127.0.0.1:8000` chỉ nằm trong log phía server. Thông báo có nêu tên biến môi trường `DATA_SERVICE_BASE_URL` và gợi ý cách cấu hình; không phải URL hay bí mật nhưng là chi tiết cấu hình hiển thị cho học viên (quan sát nhỏ, xem README).

Sau khi bật lại Data service: `GET /da-labs/da-sql-01/dataset` trả 200 với đúng dataset_name của Registry thật, không cần khởi động lại BE.

## Ghi chú trung thực

- Lần gọi A2/A3 đầu tiên trả 503 "Sandbox DB ... không kết nối được" vì Docker Desktop đang tắt (không liên quan Registry). Sau khi bật Docker và container `da-sandbox-sales-v1` (healthy, dữ liệu giữ nguyên) chạy lại cho kết quả PASS ở bảng trên. Hai lần 503 này không tạo bản ghi.
- Lần gọi C2/C3 đầu tiên trả 400 vì payload của tester thiếu `config.maxTokens` (BE yêu cầu 32 đến 1024); đây là lỗi của payload thử, không phải lỗi BE. Bảng trên là lần chạy với payload đúng.
- Data service thiếu module Python `yaml`; đã cài `pyyaml` vào thư mục tạm riêng và chạy bằng `PYTHONPATH`, không đổi môi trường Python toàn cục.
- Không kiểm trường hợp nộp bài (`submit`) khi Registry tắt; chỉ kiểm các endpoint đọc dataset/evaluation set.
