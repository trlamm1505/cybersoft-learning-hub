# ADR-001: Tech Stack và Chiến Lược Sandbox Thực Thi Code

**Người thực hiện:** Dương Chí Việt
**Trạng thái (Status):** Accepted
**Ngày:** Ngày 02 - Tuần 1 (kế thừa quyết định từ Ngày 01)
**Liên quan:** [architecture.md](../architecture/architecture.md), [mvp_backlog.md](../../learning-hub/mvp_backlog.md)

---

## 1. Ngữ cảnh (Context)

Dự án **CyberSoft Learning & Contest Hub** cần một nền tảng cho phép 4 nhóm persona (K3-5, K6-9, K10-12, Người lớn Data/AI/Tester) học, luyện tập và **nộp code để chấm tự động**, được xây dựng bởi một thực tập sinh trong **30 ngày**.

Hai ràng buộc kỹ thuật bắt buộc từ điều kiện nghiệm thu Ngày 02:

1. Luồng nộp bài **không được chạy code tùy ý trực tiếp trên App Server**.
2. Hệ thống phải có **Audit Log** để truy vết hành vi.

Đồng thời, phạm vi phải **vừa sức thực tập sinh** — ưu tiên công nghệ phổ biến, tài liệu nhiều, chi phí vận hành thấp, dễ deploy lên Vercel/Render (đã chốt ở `mvp_backlog.md` Ngày 01).

---

## 2. Quyết định (Decision)

### 2.1 Tech Stack tổng thể (kế thừa Ngày 01)

| Thành phần                                | Lựa chọn                                                                                                                                                   | Lý do                                                                                                                                                                                                         |
| :------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Framework Web**                     | Next.js (App Router), kiến trúc**Monolith**                                                                                                          | 1 repo duy nhất dễ quản lý cho 1 thực tập sinh; App Router hỗ trợ Server Actions/Route Handlers gọn cho cả FE lẫn API, tránh phải dựng thêm backend riêng trong 30 ngày.                      |
| **Database & ORM**                    | PostgreSQL (Production) / SQLite (Dev local) qua**Prisma ORM**                                                                                         | Prisma cho type-safety, migration dễ, và có thể đổi qua lại Postgres/SQLite mà ít sửa code — phù hợp môi trường dev cá nhân lẫn deploy cloud.                                               |
| **Code Editor (K6-12, Người lớn)** | **Monaco Editor**                                                                                                                                      | Chuẩn công nghiệp (lõi VS Code), hỗ trợ syntax highlight, Vim mode, nhúng dễ vào React/Next.js.                                                                                                       |
| **Code Editor (K3-5)**                | **Blockly**                                                                                                                                            | Kéo-thả khối lệnh, phù hợp trẻ chưa biết gõ phím, có thể export sang pseudo-code để judge.                                                                                                      |
| **SQL Lab (Người lớn)**            | **sql.js** (SQLite WebAssembly chạy trên browser)                                                                                                    | Giải quyết pain point "Setup Hell" (baseline 38% bỏ học) — không cần cài PostgreSQL local, chạy ngay trên trình duyệt.                                                                             |
| **AI Coach**                          | **Gemini API** với System Prompt ràng buộc                                                                                                          | Chi phí thấp, dễ tích hợp REST, có thể cấu hình prompt "chỉ giải thích lỗi, không sinh đáp án" để giữ tính giáo dục.                                                                    |
| **Message Queue**                     | Redis + BullMQ (hoặc queue tương đương nhẹ)                                                                                                           | Redis phổ biến, có free-tier trên nhiều nền tảng cloud, BullMQ là thư viện Node.js phổ biến, đã được kiểm chứng rộng rãi cho job queue, tích hợp tự nhiên với Next.js/Node backend.  |
| **Judge Runner**                      | **Piston API** (self-host hoặc public instance) hoặc Node.js `child_process` cách ly trong container, chạy trong **Sandbox Worker riêng** | Piston đã có sẵn cơ chế multi-language sandbox; là lựa chọn nhanh nhất cho MVP. Tự viết wrapper quanh`child_process` và `Docker` là phương án dự phòng nếu cần kiểm soát sâu hơn. |

### 2.2 Vì sao Monolith thay vì Microservices?

Với 1 thực tập sinh và 30 ngày, chi phí vận hành nhiều service (network, deploy, observability riêng) vượt quá lợi ích. Next.js Monolith cho MVP, nhưng **Submission/Judge được tách vật lý thành Worker process riêng** — đây là ranh giới bắt buộc duy nhất, không thỏa hiệp, vì lý do an toàn thực thi code (xem mục 3).

---

## 3. Chiến lược Sandbox / Worker cô lập cho thực thi code

### 3.1 Nguyên tắc cốt lõi

> **App Server tuyệt đối không được gọi bất kỳ API nào thực thi code người dùng trong cùng tiến trình/request thread của nó.**

Lý do: App Server xử lý authentication, session, và truy cập DB của toàn hệ thống. Nếu code người dùng (có thể độc hại — vòng lặp vô hạn, fork bomb, đọc file hệ thống, gọi mạng ra ngoài) chạy chung tiến trình, một submission ác ý có thể:

- Làm sập/treo App Server (DoS toàn hệ thống).
- Đọc trộm biến môi trường (DB credentials, API keys).
- Tấn công lẫn sang submission của học viên khác đang chạy song song.

### 3.2 Kiến trúc Queue + Worker

```text
Client -> App Server (chỉ validate + enqueue) -> Message Queue -> Sandbox Worker (thực thi)
```

- **App Server**: nhận request, validate (giới hạn độ dài code, ngôn ngữ hợp lệ), tạo record `Submission(status=PENDING)`, đẩy job vào Queue, trả về ngay `submissionId` (bất đồng bộ — không block request).
- **Message Queue (Redis/BullMQ)**: đệm job, cho phép retry khi Worker lỗi, và **giới hạn concurrency** (số job chạy song song) để tránh quá tải hệ thống khi Contest đông người (giải quyết pain point #4: OJ nghẽn lag).
- **Sandbox Worker**: tiến trình Node.js độc lập, **chạy tách biệt hoàn toàn** khỏi App Server (process/container riêng), là nơi duy nhất thực thi code người dùng.

### 3.3 Giới hạn tài nguyên bắt buộc trong Sandbox

| Giới hạn                           | Giá trị đề xuất MVP                                            | Mục đích                                                                                                    |
| :----------------------------------- | :------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------- |
| **CPU time**                   | 2-5 giây / lần chạy (tùy độ khó bài)                        | Chặn vòng lặp vô hạn                                                                                      |
| **RAM (Memory limit)**         | 128-256 MB                                                          | Chặn memory bomb                                                                                              |
| **Timeout tổng (wall-clock)** | 5-10 giây                                                          | Đảm bảo Queue không bị nghẽn (target latency < 2s theo mvp_backlog.md, dự phòng thêm cho hàng đợi) |
| **Network access**             | **Tắt hoàn toàn** (no network)                             | Chặn code gọi ra ngoài (exfiltrate data, tấn công DDoS qua hệ thống mình)                              |
| **File system**                | Read-only, trừ thư mục tạm bị xóa sau khi chạy               | Chặn ghi đè hệ thống, chặn đọc file nhạy cảm                                                         |
| **Process isolation**          | Container Docker riêng (hoặc sandbox của Piston) mỗi lần chạy | Chặn 1 submission ảnh hưởng submission khác                                                               |

### 3.4 Vì sao chọn Piston API (hoặc tương đương) cho MVP

- Piston đã đóng gói sẵn cơ chế container hóa + giới hạn tài nguyên cho nhiều ngôn ngữ (Python, C++, ...) — thực tập sinh không cần tự viết Dockerfile phức tạp cho từng ngôn ngữ trong 30 ngày.
- Có thể tự host (Docker Compose) hoặc dùng public instance cho giai đoạn dev/demo.
- Nếu cần kiểm soát sâu hơn (ví dụ giới hạn network chặt hơn), thực tập sinh có thể viết wrapper riêng bằng `child_process` + Docker — đây là điểm mở rộng ở Production Hardening.

### 3.5 Audit Log gắn với Sandbox

Mọi lần Worker thực thi job đều ghi `AuditLog(action=SUBMISSION_JUDGED, metadata={verdict, runtimeMs, memoryKb, exitCode})` — vừa phục vụ truy vết bảo mật (phát hiện submission bất thường), vừa phục vụ Teacher Dashboard (chi tiết ở architecture.md mục 4).

---

## 4. Bảng phân biệt: MVP (30 ngày) vs Production Hardening

| Hạng mục                         | MVP (30 ngày)                                                                                      | Production Hardening (mở rộng sau)                                                                     |
| :--------------------------------- | :-------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **Kiến trúc tổng thể**   | Next.js Monolith, 1 repo                                                                            | Có thể tách Judge Service thành microservice độc lập, deploy riêng scale theo tải               |
| **Message Queue**            | Redis + BullMQ, 1 queue`submission.queue`                                                         | Nhiều queue theo priority (contest vs practice), Kafka nếu cần throughput lớn                        |
| **Sandbox Worker**           | Piston API hoặc 1 Docker container dùng chung, concurrency giới hạn cứng (vd. 5 job song song) | Worker pool auto-scale (Kubernetes Jobs/Firecracker microVM), warm-pool container để giảm cold-start  |
| **Giới hạn tài nguyên**  | Cấu hình tĩnh (CPU/RAM/Timeout cố định trong code)                                            | Giới hạn động theo độ khó bài/gói người dùng, cgroups/seccomp tùy biến sâu                |
| **Ngôn ngữ hỗ trợ**      | Python, C++, SQL (qua sql.js), Scratch/Blockly export                                               | Thêm Java, JS/Node, Rust, Go... theo nhu cầu                                                           |
| **Audit Log**                | Ghi thẳng bảng`AuditLog` trong cùng Postgres                                                   | Xuất log sang hệ thống tập trung (ELK/Datadog/CloudWatch), alerting tự động                       |
| **Bảo mật Sandbox**        | Container hóa cơ bản, tắt network                                                               | Firecracker/gVisor microVM, seccomp-bpf syscall filtering, network namespace riêng, image scanning      |
| **Chống gian lận Contest** | Rate-limit số lần submit, ghi log IP                                                              | Phát hiện code trùng lặp (plagiarism detection), anomaly detection dựa trên pattern nộp bài      |
| **AI Coach**                 | Gọi Gemini API trực tiếp mỗi request, prompt tĩnh                                              | Cache câu trả lời phổ biến, rate-limit theo user, fine-tune/RAG với ngân hàng lỗi thường gặp |
| **Observability**            | Console log + bảng AuditLog để query thủ công                                                  | Distributed tracing (OpenTelemetry), dashboard real-time (Grafana), alerting khi Worker queue nghẽn     |
| **Triển khai (Deploy)**     | Vercel (App) + Render/Railway (Worker + Redis + DB)                                                 | CI/CD đầy đủ, blue-green deploy, đa vùng (multi-region) cho latency thấp toàn cầu               |

---

## 5. Hệ quả (Consequences)

### Tích cực

- Đáp ứng đúng điều kiện nghiệm thu: code không bao giờ chạy trên App Server, có Audit Log, có phân định MVP/Production rõ ràng.
- Kiến trúc Queue + Worker cho phép scale số lượng Worker độc lập khi Contest đông người mà không cần sửa App Server — trực tiếp giải quyết pain point #4 (OJ nghẽn lag).
- Toàn bộ stack dùng công nghệ phổ biến (Next.js, Prisma, Redis, Docker), tài liệu nhiều, phù hợp năng lực thực tập sinh.

### Đánh đổi / Rủi ro

- Độ trễ tăng nhẹ do đi qua Queue (bất đồng bộ) thay vì đồng bộ trực tiếp — chấp nhận được vì đổi lại an toàn hệ thống, và vẫn đạt target latency < 2s nếu Worker đủ nhanh.
- Cần thêm hạ tầng Redis (thêm 1 service phải vận hành) so với phương án chạy code luôn trên App Server — nhưng đây là chi phí bắt buộc để đảm bảo an toàn, không có phương án thay thế chấp nhận được.
- Piston API (nếu dùng public instance) có thể có giới hạn rate/uptime không do mình kiểm soát — rủi ro này được ghi nhận và xử lý ở Production Hardening bằng cách tự host.
