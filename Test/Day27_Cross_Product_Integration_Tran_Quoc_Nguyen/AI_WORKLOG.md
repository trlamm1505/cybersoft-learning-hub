# AI_WORKLOG - Ngày 27

## Bài toán trước khi dùng AI

Cần xác định đúng phạm vi kiểm thử tích hợp ba sản phẩm và tạo cách chạy lặp lại cho luồng Registry -> assignment/lab -> submission -> evaluation, bao gồm contract, permission và failure handling.

## Công cụ đã dùng

- Codex: đọc kế hoạch QA, dò test tích hợp trong repo, đề xuất nhóm test và tạo runner/bộ bàn giao.
- PowerShell + Jest: chạy kiểm chứng độc lập trên mã nguồn hiện tại.

## Chỉ dẫn chính cho AI

Giúp làm Ngày 27, giải thích mục đích, việc cần làm và cách kiểm tra bài làm đúng.

## AI đề xuất và thay đổi thực tế

- Gom 6 test suite đã có thành một lệnh chạy riêng cho Ngày 27.
- Thêm runner lưu log và JSON summary.
- Thêm contract defect/test-gap log và demo trace.
- Không sửa logic FE/BE/Data-AI và không tạo số liệu giả.

## Kiểm chứng độc lập và quyết định của bản thân

- Đã chạy Jest trực tiếp, không chỉ tin kết luận của AI.
- Lần 1 (repo cũ, không có Registry thật): 6/6 suite PASS; 83 PASS; 2 SKIP; 0 FAIL; exit code 0.
- Lần 2 (bản clone, có Registry thật tại 127.0.0.1:8000, 21:23): 6/6 suite PASS; 90 PASS; 0 SKIP; 0 FAIL; exit code 0; hai case LIVE đã chạy thật.
- Xác nhận các dòng `ECONNREFUSED` là failure-path có chủ đích vì toàn suite vẫn PASS.
- Quyết định không ghi hai case LIVE chưa chạy là PASS; ghi thành `D27-GAP-001` và chỉ đóng khi có Registry thật. Sau đó đã bật Registry thật (Data service trong repo), chạy lại và mới đóng `D27-GAP-001` bằng log.
- Rà soát độc lập chỉ ra thêm `D27-GAP-002`: chưa có test nối liền Registry -> giao bài -> nộp -> chấm. Giữ OPEN cho đến khi chạy thật; sau đó đã chạy 3 chuỗi trên web local (19/19 bước PASS) và đóng. Phát sinh `D27-GAP-003` (BE chưa gọi Registry thật trong lần chạy đó), giữ OPEN, không ghi PASS. Sau đó (11/10/2026) bật Data service thật, chạy lại chuỗi A và C cho BE gọi Registry thật (11/11 bước PASS, xác nhận bằng `dataset_name` và access log của Data service), kiểm Registry tắt (503 sau khi cache 60 giây hết hạn, không lộ URL nội bộ) và mới đóng `D27-GAP-003`.
- Khi chạy lần này gặp 3 vướng mắc môi trường, đều ghi vào `evidence/day27-live-chain.md` thay vì bỏ qua: thiếu `pyyaml` cho Data service (cài vào thư mục tạm), Docker/Postgres sandbox đang tắt nên lần nộp SQL đầu trả 503 (bật lại, dữ liệu giữ nguyên), và payload AI Lab thiếu `maxTokens` nên bị 400 (lỗi payload, đã sửa).
- Phạm vi CHƯA kiểm với Registry thật, không ghi PASS: chuỗi B (DA Lab Insight + teacher review) và trường hợp nộp bài khi Registry tắt.
- Dry-run cleanup ban đầu đếm cả `quizattempts` (2 bản ghi không do chuỗi Day 27 tạo, có thể là bài quiz thật); đã sửa script chỉ làm việc với `da_lab_submissions` và `ai_lab_submissions`. Đã chạy `--execute` ngày 11/10/2026 14:44: xóa 2 bản ghi `da_lab_submissions` và 1 bản ghi `ai_lab_submissions` (tổng 3); không đụng `quizattempts`. Ghi thêm `D27-DEF-001` và `D27-DEF-002` (Open) từ hai quan sát khi Registry tắt.
- Quyết định giữ test fixture in-memory để chạy ổn định và không làm bẩn dữ liệu thật.

## Quyết định của bản thân (11/10/2026)

- Đóng `D27-GAP-003` chỉ khi tự thấy bằng chứng: BE trả `dataset_name` của Registry thật, access log của Data service có request từ BE, chuỗi A và C chạy lại 11/11 bước PASS. Không đóng chỉ dựa trên kết luận của AI.
- Ghi `D27-DEF-001` (cache 60 giây che sự cố Registry) và `D27-DEF-002` (thông báo 503 lộ tên biến cấu hình) ở mức thấp, trạng thái OPEN: không chặn luồng chính nhưng cần mentor xem lại.
- Không xóa 2 bản ghi `quizattempts` vì có thể là bài quiz thật của học viên; chỉ xóa 3 bản ghi do chuỗi Day 27 tạo.
- Giữ chuỗi B và trường hợp nộp bài khi Registry tắt ở trạng thái chưa kiểm, không ghi PASS.

## Diff thuộc phần Ngày 27

- Thêm `run_day27_checks.ps1`.
- Thêm `README.md`, `Day27_Demo_Trace.md`, `Day27_Contract_Defects.csv` và `AI_WORKLOG.md`.
- Thêm mục "Lần chạy với Registry thật" vào `evidence/day27-live-chain.md`; tạo lại `Day27_Contract_Defects.csv` (3 GAP).
- Không chỉnh sửa mã chương trình chính.

## Nội dung trình bày 3 phút

AI giúp tìm nhóm test và đóng gói lệnh chạy. Điểm AI chưa thể tự xác nhận ban đầu là hợp đồng với Registry thật; sau khi bật Data service thật, người thực hiện đã chạy và hai case LIVE PASS. Người thực hiện đã chạy Jest, đọc exit code và summary, phân biệt log lỗi giả lập với test fail, đồng thời để case LIVE ở trạng thái test gap thay vì báo PASS sai.
