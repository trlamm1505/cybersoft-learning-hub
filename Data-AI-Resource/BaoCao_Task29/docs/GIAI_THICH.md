# HƯỚNG DẪN GIẢI THÍCH VÀ BẢO VỆ TASK 29 (3-5 PHÚT)

## 1. MỤC TIÊU CỐT LÕI (MỘT CÂU)
> **Hợp nhất toàn bộ dữ liệu chuẩn 3NF, mô hình RAG BM25 + Trích dẫn, Bảo mật PII, Chốt chặn QA và 5 Bản vá Usability (Tuần 1–6) thành 1 thể thống nhất, giải quyết 3 vấn đề vận hành (LRU Cache giảm trễ, Đo tải P50-P99/RPS thực tế, Khôi phục thảm họa SHA-256) và đóng gói Docker Multi-Stage.**

---

## 2. SƠ ĐỒ LUỒNG HỆ THỐNG HỢP NHẤT (DẠNG VĂN BẢN)
```text
[Người dùng / Giao diện Web Hợp nhất (/portal/) hoặc Swagger (/docs)]
         │
         ├──> (1) Khám phá Kho Dữ liệu 3NF & Xem trước CSV (/api/v1/ops/hub/overview)
         │          └── Tích hợp Khóa Snapshot SHA-256 (Task 26) + 5 Bản vá UX (Task 28 FIX-001..005)
         │
         ├──> (2) Tìm kiếm RAG & Trợ giảng AI (/api/v1/ops/hub/search?q=...)
         │          ├── [VẤN ĐỀ 1: Tầng LRU Cache trên RAM] ──(Cache Hit)──> Trả ngay < 1ms + [doc#section]
         │          └── (Cache Miss) ──> [BM25Engine Task 18 + Kho học liệu] ──> Lưu vào LRU Cache
         │
         ├──> (3) Đo tải Thực nghiệm 500 Requests (scripts/run_load_test.py)
         │          └── [VẤN ĐỀ 2: Bấm giờ time.perf_counter()] ──> Tính phân vị P50, P75, P90, P95, P99 & RPS
         │
         └──> (4) Đóng gói Docker & Khôi phục Thảm họa (/api/v1/ops/backup/restore-test)
                    └── [VẤN ĐỀ 3: Đối soát SHA-256 từng byte + Dockerfile non-root appuser 1001]
```

---

## 3. THỨ TỰ ĐỌC FILE KHI BẢO VỆ (4 FILE TRỌNG TÂM)
1. **`src/services/performance_service.py`**: Trái tim của hệ thống hợp nhất.
   - `LRUQueryCache`: Bộ nhớ đệm lưu trên RAM theo thuật toán Least Recently Used kèm thời gian sống TTL (Giải quyết Vấn đề 1).
   - `CachedSearchEngine`: Tái sử dụng `BM25Engine` từ Task 18 gắn với `LRUQueryCache`.
   - `BackupRestoreEngine`: Quét tệp sao lưu, đối soát mã băm SHA-256 từng byte (Giải quyết Vấn đề 3).
   - `PerformanceProfiler`: Phục vụ dữ liệu hợp nhất Tuần 1–6 (`unified_hub_data.json`) và số liệu đo tải (`benchmark_metrics.json`).
2. **`src/routes/performance.py`**: Định tuyến API hợp nhất (`/ops/hub/overview`, `/ops/hub/search`, `/ops/benchmark`, `/ops/backup/restore-test`, `/api/v1/health`).
3. **`scripts/run_load_test.py`**: Script bắn 500 requests liên tiếp vào các endpoint hợp nhất để đo P50–P99 và RPS thực tế (Giải quyết Vấn đề 2).
4. **`Dockerfile` & `docker-compose.yml`**: Đóng gói toàn bộ hệ thống hợp nhất vào container `python:3.10-slim` Multi-stage chạy dưới quyền `appuser (1001)`.

---

## 4. 5 CÂU HỎI BẢO VỆ PHỔ BIẾN VÀ CÂU TRẢ LỜI NGẮN GỌN

### Câu 1: Vì sao các Task 26, 27, 28 không làm giao diện rời mà gom toàn bộ vào Task 29?
- **Trả lời**: Vì Task 26 (Integration API), Task 27 (QA Gate Harness) và Task 28 (Đo lường Usability & 5 bản vá) là các tầng dịch vụ, kiểm thử và bản vá chất lượng xoay quanh cùng 1 sản phẩm. Tại Task 29, toàn bộ dữ liệu 3NF, mô hình RAG, API, bảo mật PII và 5 bản vá UX từ Tuần 1–6 được gom thành **1 thể thống nhất duy nhất** trước khi tối ưu hiệu năng và đóng gói Docker.

### Câu 2: Ba vấn đề kỹ thuật cốt lõi mà Task 29 giải quyết trên hệ thống hợp nhất là gì?
- **Trả lời**:
  1. **Vấn đề 1 (Độ trễ lặp lại cao)**: Gắn `LRUQueryCache` trên RAM trước tầng tìm kiếm RAG BM25, giúp truy vấn lặp lại giảm độ trễ hơn 82% (từ ~18.75ms xuống dưới 3.3ms).
  2. **Vấn đề 2 (Thiếu số liệu chịu tải thực nghiệm)**: Dùng `scripts/run_load_test.py` bắn 500 requests thật đo bằng `time.perf_counter()` để xuất phân vị P50, P75, P90, P95, P99 và thông lượng RPS.
  3. **Vấn đề 3 (Rủi ro hỏng dữ liệu & lệch môi trường triển khai)**: Dùng `BackupRestoreEngine` kiểm tra mã băm SHA-256 từng byte khi khôi phục và đóng gói Docker Multi-stage (`appuser 1001`).

### Câu 3: Em làm thế nào để chứng minh bộ nhớ đệm LRU Cache thực sự tăng tốc tìm kiếm RAG?
- **Trả lời**: Trên giao diện hợp nhất `/portal/` (Tab 2) hoặc endpoint `/api/v1/ops/hub/search?q=...`, khi bấm tìm kiếm lần đầu tiên hệ thống báo `CACHE MISS` (chạy BM25 mất ~6–18ms). Khi bấm tìm lại đúng câu đó lần thứ hai, hệ thống lấy thẳng từ RAM báo `CACHE HIT` với độ trễ giảm xuống dưới 1ms và tăng bộ đếm `hits` ngay lập tức.

### Câu 4: Quy trình sao lưu và phục hồi thảm họa kiểm tra tính toàn vẹn như thế nào?
- **Trả lời**: Khi sao lưu, hệ thống xuất `catalog_snapshot.json` và `vector_index_snapshot.bin` kèm mã băm SHA-256 vào `manifest.json`. Khi phục hồi (`verify_and_restore`), hệ thống đọc từng byte và băm lại; nếu lệch dù chỉ 1 bit sẽ báo `FAILED` ngay lập tức để bảo vệ hệ thống.

### Câu 5: Docker container được thiết kế thế nào để bảo đảm bảo mật và ổn định trên Production?
- **Trả lời**: Em áp dụng `Dockerfile` 2 giai đoạn (Multi-stage build) trên nền `python:3.10-slim`, chạy dưới tài khoản phi đặc quyền `appuser (UID 1001)`, giới hạn CPU/RAM trong `docker-compose.yml` và cấu hình `HEALTHCHECK` tự động kiểm tra `/api/v1/health` mỗi 30 giây.
