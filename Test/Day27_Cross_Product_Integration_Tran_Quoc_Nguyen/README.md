# Ngày 27 - Kiểm thử tích hợp ba sản phẩm

## Mục tiêu

Xác nhận luồng dùng chung chạy xuyên suốt: **Resource Registry -> giao bài/lab -> học viên nộp -> hệ thống chấm/giảng viên review**. Trọng tâm là hợp đồng dữ liệu, version, phân quyền, xử lý lỗi và dữ liệu test có thể chạy lặp lại rồi cleanup.

## Phạm vi bộ test

| Nhóm | File test nguồn | Nội dung chính |
|---|---|---|
| Registry/contract | `dataset-integration.service.spec.ts` | Map contract, API key, cache, 404/502/503, fallback, không lộ DB URL |
| Registry thật/fixture | `real-registry-contract.spec.ts` | Chuẩn hóa data dictionary, evaluation set, checksum, version |
| Submission | `da-labs.submissions.spec.ts` | Lưu/cập nhật bài SQL và Insight, không spam bản ghi |
| Permission/review | `teacher-submissions.controller.spec.ts` | Teacher được review, Student bị 403, ID sai trả 404 |
| Evaluation | `ai-lab-grader.service.spec.ts` | Chấm chất lượng/chi phí, reproducibility, input validation, chống secret |
| E2E publish | `ai-exercise-to-lesson-publish.spec.ts` | AI tạo bài -> lưu ngân hàng -> mở Library -> publish; failure path thiếu solution |

## Cách chạy

Từ PowerShell tại thư mục gốc repo:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Test\Day27_Cross_Product_Integration_Tran_Quoc_Nguyen\run_day27_checks.ps1"
```

Nếu có Registry thật:

```powershell
powershell -ExecutionPolicy Bypass -File ".\Test\Day27_Cross_Product_Integration_Tran_Quoc_Nguyen\run_day27_checks.ps1" -DataServiceContractUrl "http://127.0.0.1:8000"
```

## Quy tắc kết luận

- **PASS fixture/integration:** exit code `0`, 6/6 suite pass, không có test fail.
- **PASS live contract:** chạy thêm URL Registry thật và không còn test skip do thiếu URL.
- **FAIL:** exit code khác `0`, contract/schema/version sai, Student truy cập được API Teacher, submission không lưu/cập nhật đúng, hoặc bộ chấm cho kết quả không tái lập.
- Log có chữ `ERROR` vẫn có thể PASS nếu đó là case cố ý giả lập 404/502/503; kết luận dựa vào Jest summary và exit code.

## Kết quả các lần chạy 10/10/2026

**Lần 2 (chốt): bản clone, có Registry thật** (21:23, `evidence/run-summary.json`)

- Repo: `D:\thuctap\clone\cybersoft-learning-hub`; Registry thật là Data service chạy từ `Data-AI-Resource/BaoCao_Task21` tại `http://127.0.0.1:8000`; chạy với `-DataServiceContractUrl`.
- 6/6 test suites PASS; **90 test PASS, 0 SKIP, 0 FAIL**; exit code 0; 45,32 giây (Jest 36,7 giây).
- Hai test LIVE contract đã chạy thật (không còn skip): 3 endpoint đúng cấu trúc adapter mong đợi; checksum CSV khớp header và số dòng khớp data_dictionary (clean).
- Dòng `WARN ... http://tts01:8000 không trả lời` trong log là case giả lập cố ý (fallback embedded), không phải lỗi kết nối tới Registry thật.

**Lần 1 (lịch sử): repo cũ, không có Registry thật** (20:58)

- 6/6 suite PASS, 83 test PASS, 2 SKIP (hai case LIVE thiếu `DATA_SERVICE_CONTRACT_URL`), 0 FAIL, exit code 0. Repo cũ có ít test hơn bản clone (85 so với 90 test), nên số liệu chốt là của lần 2.

**Chuỗi tích hợp chạy thật trên web local** (21:56, `evidence/day27-live-chain.md`): DA Lab SQL, DA Lab Insight kèm teacher review, AI Lab (evaluation set -> nộp -> chấm -> tái lập), 19/19 bước PASS; student gọi API review/danh sách của giảng viên đều nhận 403. `D27-GAP-002` đã đóng.

**Chuỗi tích hợp với Registry thật** (11/10/2026 14:27 đến 14:36, `evidence/day27-live-chain.md`, mục "Lần chạy với Registry thật"): BE gọi Data service `127.0.0.1:8000` (`dataset_name` đúng của Registry thật; access log của Data service ghi nhận request từ BE). Chuỗi A (DA Lab SQL) và chuỗi C (AI Lab) 11/11 bước PASS. Khi Registry tắt: trong 60 giây đầu BE trả 200 từ cache, sau đó **503** rõ ràng, không fallback ngầm, response không lộ `sandbox_db_url`, `postgresql://` hay URL nội bộ. `D27-GAP-003` đã đóng.

**Quan sát còn lại:** (1) cache 60 giây trong BE che sự cố Registry tối đa 60 giây (`D27-DEF-001`, Open); (2) thông báo 503 nêu tên biến `DATA_SERVICE_BASE_URL` cho học viên (`D27-DEF-002`, Open).

**Phạm vi CHƯA kiểm với Registry thật (không ghi PASS):** (a) chuỗi B (DA Lab Insight + teacher review) chưa chạy lại với Registry thật; kết quả 8/8 của chuỗi B chỉ có từ lần chạy 10/10 khi BE dùng Registry tích hợp sẵn; (b) trường hợp nộp bài (`submit`) khi Registry tắt chưa kiểm, chỉ kiểm các endpoint đọc dataset/evaluation set.

## File bàn giao

- `run_day27_checks.ps1`: cross-product E2E/integration runner.
- `Day27_Contract_Defects.csv`: defect và test gap có bằng chứng.
- `Day27_Demo_Trace.md`: trace để demo luồng trong 3 phút.
- `AI_WORKLOG.md`: bằng chứng sử dụng và kiểm chứng AI.
- `cleanup_day27_test_data.js`: dọn dữ liệu thử của tài khoản `student@gmail.com` trong DB dev, từ mốc `--since`, **chỉ ở 2 collection `da_lab_submissions` và `ai_lab_submissions`** (không đụng `quizattempts` hay collection nào khác). Mặc định chỉ đếm, thêm `--execute` mới xóa; chỉ chạy sau khi xem dry-run.
- `evidence/`: log và summary được sinh sau khi chạy script; `evidence/day27-live-chain.md` là kết quả chạy chuỗi tích hợp thật trên web local.
