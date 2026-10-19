# ADR-001: Local Python Sandbox (subprocess + AST Guard) thay cho Docker

| | |
|---|---|
| **Trạng thái** | Accepted (17/10/2026) — áp dụng từ v1.0 |
| **Người quyết định** | Dương Chí Việt (owner Learning Hub) |
| **Liên quan** | Commit `c044190`; báo cáo QA Day 30 của Tester Trần Quốc Nguyên; [SECURITY.md mục 4](../../SECURITY.md#4-code-execution-sandbox); Known Issue K-01 |

## Bối cảnh

- Máy chấm trước đây có hai chế độ: `docker run` (mặc định) và chạy local. Khi Docker Desktop tắt, máy chấm trả **RE** hàng loạt; Tester ghi nhận lỗi này khi chạy `verify-matrix`.
- Máy của thực tập sinh và giảng viên (Windows) không có Docker ổn định; script khởi động phải chờ Docker (`ensure-sandbox.js`) khiến backend báo `ERR_CONNECTION_REFUSED` khi Docker chưa lên.
- Yêu cầu bàn giao: người mới clone repo phải chạy được trong dưới 20 phút chỉ với **Node.js + Python + MongoDB**.
- Mọi bài code của v1.0 là Python, chạy ngắn (mặc định 2000 ms / 128 MB).

## Quyết định

Bỏ hoàn toàn Docker. Máy chấm chạy **100% local**:

1. **AST Guard** (`python-guard.helper.ts`) dùng module `ast` chuẩn của Python phân tích code **trước khi chạy**, chặn import module nguy hiểm (`os`, `subprocess`, `socket`, `ctypes`, `pickle`...), các hàm `eval`/`exec`/`compile`/`__import__`/`open`, và truy cập dunder để thoát ra ngoài.
2. **Subprocess** `python -I -B -X utf8` với biến môi trường tối giản, file tạm trong `os.tmpdir()` ngoài repo, timeout và giới hạn RAM theo bài, cắt stdout/stderr ở 64 KB, che đường dẫn máy chủ ở **cả stdout và stderr**.
3. Giới hạn đồng thời / hàng đợi bằng `CODE_RUNNER_MAX_CONCURRENCY`, `CODE_RUNNER_MAX_QUEUE`.

Đã xóa: nhánh `docker run` trong `code-runner.helper.ts`, `code-runner.docker.spec.ts`, `docker-compose.yml`, `docker-compose.prod.yml`, `BE/Dockerfile`, `FE/Dockerfile`, `ensure-sandbox.js`, các lệnh `docker:*`, biến `PYTHON_SANDBOX`/`PYTHON_SANDBOX_IMAGE`.

## Các phương án đã cân nhắc

| Phương án | Lý do không chọn |
|---|---|
| Giữ Docker làm mặc định | Lỗi RE khi Docker tắt; setup nặng trên Windows |
| Giữ nhánh Docker dạng **tùy chọn tắt mặc định** (AI đề xuất) | Một nhánh chạy code không ai kiểm thử thường xuyên là rủi ro bảo mật và bảo trì — **bác bỏ** |
| Giữ `docker-compose`/`Dockerfile` cho triển khai (AI đề xuất) | Chưa có quy trình triển khai container được kiểm thử; sẽ thiết kế lại đúng cách ở Roadmap — **bác bỏ** |
| gVisor / Firecracker ngay ở v1.0 | Không kịp trong chu kỳ 30 ngày, cần hạ tầng Linux riêng |

## Hệ quả

**Tích cực:** setup đơn giản (không Docker), chấm nhanh hơn (không khởi động container), một đường code duy nhất được kiểm thử bởi 1635 Jest + audit + E2E.

**Tiêu cực / rủi ro chấp nhận:**
- **Không có cô lập cấp hệ điều hành** (namespace/cgroup/container): code học viên chạy như một tiến trình trên máy chủ backend. Phòng thủ dựa vào AST guard và các giới hạn tiến trình. Ghi rõ là Known Issue **K-01**; không phù hợp để mở cho người lạ trên Internet.
- Giới hạn RAM là đo và dừng ở mức tiến trình, không phải giới hạn cứng của kernel.

**Điều kiện xem xét lại:** trước khi public, hoặc khi hỗ trợ thêm ngôn ngữ — Roadmap Ngày 36–39 tách Worker Judge độc lập chạy trong gVisor/MicroVM, giữ AST guard làm lớp phòng thủ thứ hai.
