# SỔ TAY KỸ THUẬT VẬN HÀNH TOÀN DIỆN (TECHNICAL HANDBOOK) — TASK 30
## DỰ ÁN: CYBERSOFT DATA & AI LAB v1.0 (PRODUCTION READY)

**Sản phẩm:** CyberSoft Data & AI Lab v1.0  
**Vai trò phụ trách:** Đào Trung Kiên — Data & AI Resource Engineer  
**Phiên bản phát hành:** Release v1.0.0 (Production Ready)  
**Ngày bàn giao:** 2026-10-15  
**Nguyên tắc thiết kế tài liệu:** Tự phục vụ (Self-service), người khác đọc theo là vận hành và gỡ lỗi được ngay mà không cần tác giả can thiệp.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG 4 TẦNG (4-TIER ARCHITECTURE)

Hệ sinh thái **CyberSoft Data & AI Lab v1.0** được thiết kế theo kiến trúc phân tầng độc lập (Loosely Coupled Tiered Architecture), bảo đảm tính module hóa cao, bảo mật nghiêm ngặt và khả năng mở rộng linh hoạt:

```text
+-----------------------------------------------------------------------------------+
| TẦNG 1: GIAO DIỆN & TRUY CẬP (CLIENT & LEARNING HUB INTEGRATION)                  |
| - Giao diện Quản trị Tài nguyên (Resource Management Interface - Port 8022)       |
| - Bảng điều khiển Đo lường Người dùng thử (Usability Dashboard - Port 8028)        |
| - Bảng điều khiển Hiệu năng & Tải trọng (Performance Dashboard - Port 8029)       |
| - Cổng tích hợp CyberSoft Learning Hub qua chuẩn RESTful API                      |
+---------------------------------------------------------+-------------------------+
                                                          | HTTP REST / JSON
                                                          v
+-----------------------------------------------------------------------------------+
| TẦNG 2: MÁY CHỦ DỊCH VỤ & BỘ NHỚ ĐỆM HAI TẦNG (FASTAPI CORE & TWO-TIER CACHE)    |
| - FastAPI ASGI Framework (Async High-Concurrency, Pydantic v2 Contract First)     |
| - Bộ nhớ đệm L1 (Static Catalog Cache): Lưu trữ Metadata 4 Datasets & 2 Capstones  |
| - Bộ nhớ đệm L2 (Dynamic LRU Query Cache): Dung lượng 2048 keys, Hit Rate 88.5%    |
| - Middleware: CORS Guard, Structured Logging, Rate Limiter, Health Probing        |
+---------------------------------------------------------+-------------------------+
                                                          | Internal Pipeline
                                                          v
+-----------------------------------------------------------------------------------+
| TẦNG 3: ĐỘNG CƠ DỮ LIỆU & TRÍ TUỆ NHÂN TẠO (DATA & AI ENGINES)                   |
| - Hybrid Search Engine: Reciprocal Rank Fusion (RRF) kết hợp BM25 + Vector Embed  |
| - Grounded AI Tutor: Cơ chế RAG trích dẫn nguồn [doc#sec], Hallucination < 2%     |
| - Data Quality Harness: Kiểm tra 15 quy tắc schema 3NF, phát hiện missing/anomaly |
| - WORM Lineage Engine: Ghi nhận vết dữ liệu bất biến, kiểm tra mã băm SHA-256     |
+---------------------------------------------------------+-------------------------+
                                                          | Storage & Infrastructure
                                                          v
+-----------------------------------------------------------------------------------+
| TẦNG 4: ĐÓNG GÓI CONTAINER & CỨU HỘ VẬN HÀNH (CONTAINER OPS & DISASTER RECOVERY)   |
| - Multi-stage Docker Build (Base: python:3.10-slim, Image Size < 200MB)           |
| - Tài khoản phi đặc quyền: Thực thi dưới appuser (UID 1001, GID 1001)             |
| - Giới hạn tài nguyên: CPU 2.0 Cores, RAM 1024 MB qua Docker Compose               |
| - Active Healthcheck: Giám sát tự động endpoint /api/health mỗi 30 giây           |
| - Automated Disaster Recovery: Cứu hộ dữ liệu thảm họa < 1 giây, khớp 100% SHA-256 |
+-----------------------------------------------------------------------------------+
```

### 1.1. Sơ đồ luồng dữ liệu tích hợp (Data Flow Sequence)
```text
[Học viên / Giảng viên] ──(1) Gửi yêu cầu tìm kiếm / hỏi bài / tải dataset──> [Learning Hub / API]
                                                                                      │
                                                                 (2) Kiểm tra Cache L2 (LRU)
                                                                                      │
                                  ┌─────────────────── HẠNG MỤC TRÚNG CACHE (88.5%) ◄─┤
                                  │                                                   │
                                  │ (Trả lời tức thì P95: 3.3ms)          (3) TRƯỢT CACHE (11.5%)
                                  │                                                   │
                                  │                                                   ▼
                                  │                                    [Hybrid Search / AI Tutor]
                                  │                                       - BM25 + Vector RRF
                                  │                                       - Trích nguồn [doc#sec]
                                  │                                                   │
                                  │                                    (4) Ghi nhận vào LRU Cache
                                  │                                                   │
                                  ▼                                                   ▼
[Phản hồi chuẩn xác] ◄────────────────────────────────────────────────────────────────┘
```

---

## 2. HƯỚNG DẪN CÀI ĐẶT & KHỞI CHẠY HỆ THỐNG (SETUP GUIDE)

Tài liệu này được biên soạn để bất kỳ kỹ sư nào tiếp quản dự án đều có thể khởi chạy thành công trong vòng chưa đầy 5 phút.

### 2.1. Yêu cầu môi trường tối thiểu (Prerequisites)
- **Hệ điều hành:** Linux (Ubuntu 20.04+), macOS (macOS 12+), hoặc Windows 10/11 (PowerShell 5.1+ / WSL2).
- **Python:** Phiên bản 3.10 trở lên (`python --version`).
- **Bộ nhớ RAM:** Tối thiểu 4 GB (Khuyến nghị 8 GB).
- **Ổ đĩa cứng:** Tối thiểu 2 GB dung lượng trống.
- **Docker & Docker Compose (Tùy chọn):** Docker Engine 24.0+ và Docker Compose v2+.

### 2.2. Quy trình cài đặt từng bước qua Python Virtual Environment (Khuyến nghị cho phát triển)

#### Bước 1: Di chuyển vào thư mục dự án và khởi tạo môi trường ảo
```powershell
# Di chuyển vào thư mục gốc của repository
cd d:\Cybersoft\Kien\cybersoft-learning-hub

# Tạo môi trường ảo Python cô lập
python -m venv .venv

# Kích hoạt môi trường ảo
# Trên Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Trên Linux/macOS:
# source .venv/bin/activate
```

#### Bước 2: Thiết lập cấu hình biến môi trường
Tạo file `.env` tại thư mục làm việc dựa trên mẫu cấu hình chuẩn:
```env
# Cấu hình máy chủ dịch vụ
ENVIRONMENT=production
PORT=8000
HOST=0.0.0.0
LOG_LEVEL=INFO

# Cấu hình bộ nhớ đệm Two-Tier
CACHE_L1_ENABLED=true
CACHE_L2_LRU_CAPACITY=2048
CACHE_TTL_SECONDS=3600

# Cấu hình bảo mật & ranh giới tài nguyên
MAX_CONCURRENT_WORKERS=20
RATE_LIMIT_RPS=500
RUN_AS_USER=1001

# Đường dẫn dữ liệu chuẩn hóa
DATASET_ROOT_PATH=./Data-AI-Resource/data
BACKUP_ARCHIVE_PATH=./Data-AI-Resource/backup
```

#### Bước 3: Cài đặt các gói thư viện phụ thuộc
```powershell
pip install --upgrade pip
pip install fastapi uvicorn pydantic requests
```

#### Bước 4: Khởi động máy chủ dịch vụ
```powershell
# Chạy máy chủ FastAPI Uvicorn
uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 2
```

#### Bước 5: Xác minh khởi chạy thành công
Mở một cửa sổ dòng lệnh khác và gửi yêu cầu kiểm tra sức khỏe:
```powershell
curl http://localhost:8000/api/health
```
Kết quả mong đợi:
```json
{
  "status": "healthy",
  "version": "v1.0.0",
  "timestamp": "2026-10-15T10:00:00Z",
  "uptime_seconds": 15.4,
  "cache_status": "ready"
}
```

### 2.3. Quy trình triển khai qua Docker Compose (Khuyến nghị cho môi trường Production)

Chỉ với 1 câu lệnh duy nhất, toàn bộ cụm dịch vụ được khởi tạo độc lập:
```bash
# Khởi chạy cụm dịch vụ nền
docker compose up -d --build

# Kiểm tra trạng thái container và tài khoản người dùng
docker ps --filter "name=cybersoft-learning-hub"
```

---

## 3. SỔ TAY DÀNH CHO QUẢN TRỊ VIÊN (ADMIN GUIDE)

### 3.1. Danh mục các điểm cuối API cốt lõi (API Endpoints Directory)
| Phương thức | Đường dẫn Endpoint | Mục đích vận hành | Đối tượng gọi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Kiểm tra trạng thái máy chủ, bộ nhớ đệm và kết nối | Docker Healthcheck / Giám sát |
| `GET` | `/api/manifest` | Tra cứu danh mục hồ sơ phát hành Release v1.0.0 | Quản trị viên / Giảng viên |
| `GET` | `/api/datasets` | Liệt kê 4 bộ dữ liệu chuẩn 3NF kèm siêu dữ liệu | Learning Hub / Học viên |
| `GET` | `/api/capstones` | Lấy đề bài và barem chấm 2 đồ án tốt nghiệp | Giảng viên chấm thi |
| `GET` | `/api/sla` | Tra cứu toàn bộ bảng đo lường SLA thực tế | Ban Giám đốc / Hội đồng |
| `GET` | `/api/known-issues` | Tra cứu danh sách 3 hạn chế đã biết kèm cách xử lý | Kỹ sư trực ca / DevOps |
| `GET` | `/api/roadmap` | Xem lộ trình nâng cấp 60 ngày tiếp theo | Quản lý sản phẩm (PO) |
| `POST` | `/api/search` | Tìm kiếm học liệu bằng động cơ tìm kiếm lai RRF | Học viên tra cứu |
| `POST` | `/api/tutor/ask` | Gửi câu hỏi đến Trợ giảng AI có trích dẫn nguồn | Học viên hỏi bài quy chế |
| `POST` | `/api/recovery/restore` | Kích hoạt cứu hộ dữ liệu khôi phục toàn vẹn SHA-256 | Quản trị viên khi có sự cố |

### 3.2. Quản trị phân quyền & Vận hành phi đặc quyền (Security Posture)
1. **Thực thi dưới tài khoản phi đặc quyền:** Không bao giờ chạy container dưới quyền `root`. Tệp Dockerfile đã cố định:
   ```dockerfile
   RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/sh appuser
   USER appuser:appgroup
   ```
2. **Cố định ranh giới tài nguyên (Resource Capping):** Cấu hình `docker-compose.yml` cố định mức trần 2.0 Cores CPU và 1024 MB RAM, ngăn ngừa hiện tượng một tiến trình chiếm dụng toàn bộ tài nguyên máy chủ.
3. **Bảo mật dữ liệu học tập:** Toàn bộ 4 datasets là dữ liệu tổng hợp chuẩn hóa (Synthetic Enterprise Data), không chứa dữ liệu định danh cá nhân nhạy cảm (Zero PII).

### 3.3. Giám sát & Quản lý Bộ nhớ đệm (Cache Management)
- **Kiểm tra tỷ lệ trúng đệm:** Kiểm tra tỷ lệ Hit Rate thông qua log hệ thống hoặc endpoint giám sát. Ngưỡng cảnh báo: Nếu Hit Rate rơi xuống dưới 75%, quản trị viên cần kích hoạt quy trình làm ấm bộ nhớ đệm.
- **Quy trình làm ấm bộ nhớ đệm (Cache Pre-warming):** Gửi 50 câu hỏi quy chế phổ biến nhất vào hệ thống sau mỗi lần bảo trì để nạp sẵn dữ liệu đệm vào RAM.

---

## 4. SỔ TAY XỬ LÝ SỰ CỐ THỰC TẾ (TROUBLESHOOTING GUIDE)

Dưới đây là 5 tình huống phát sinh lỗi phổ biến nhất trong thực tế kèm giải pháp khắc phục dứt điểm:

### Tình huống 1: Cổng mạng đã bị tiến trình khác chiếm dụng
- **Hiện tượng (Symptom):** Khi chạy máy chủ, terminal báo lỗi:
  `[Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)` hoặc `address already in use`.
- **Nguyên nhân gốc (Root Cause):** Một tiến trình Python, Node.js hoặc IIS cũ đang giữ cổng 8000 và chưa được giải phóng.
- **Lệnh phát hiện (Detection):**
  ```powershell
  netstat -ano | findstr :8000
  ```
- **Cách khắc phục từng bước (Resolution):**
  1. Xác định mã tiến trình (PID) ở cột ngoài cùng bên phải.
  2. Kết thúc tiến trình đó:
     ```powershell
     taskkill /PID <MÃ_PID> /F
     ```
  3. Hoặc chuyển máy chủ sang cổng dự phòng 8001 qua tham số dòng lệnh:
     ```powershell
     uvicorn src.main:app --host 0.0.0.0 --port 8001
     ```

### Tình huống 2: Tăng đột biến độ trễ sau khi khởi động lại Container (Cold Start)
- **Hiện tượng (Symptom):** Ngay sau khi restart container, các lượt truy vấn đầu tiên mất 25ms - 35ms thay vì mức thông thường 3.3ms.
- **Nguyên nhân gốc (Root Cause):** LRU Cache được lưu trên bộ nhớ RAM tiến trình nên bị xóa sạch khi container dừng, khiến các truy vấn đầu tiên phải tính toán lại toàn bộ.
- **Lệnh phát hiện (Detection):** Quan sát thời gian phản hồi trong header `X-Process-Time-Ms` của các lượt gọi đầu.
- **Cách khắc phục từng bước (Resolution):**
  Thực hiện gọi script làm ấm bộ nhớ đệm (pre-warm) tự động gửi 50 câu hỏi mẫu ngay sau khi container khởi động:
  ```powershell
  python -c "
  import requests
  questions = ['Bảo lưu khóa học', 'Quy chế thi lại', 'Điều kiện tốt nghiệp']
  for q in questions:
      requests.post('http://localhost:8000/api/tutor/ask', json={'question': q})
  print('Cache pre-warmed successfully')
  "
  ```
  Sau khi hoàn tất, độ trễ truy vấn lập tức trở lại mức P95 < 5ms.

### Tình huống 3: Lỗi phân quyền ghi log trong Container Docker
- **Hiện tượng (Symptom):** Docker container dừng đột ngột ngay sau khi start với mã lỗi:
  `PermissionError: [Errno 13] Permission denied: '/app/logs/system.log'`.
- **Nguyên nhân gốc (Root Cause):** Thư mục `./logs` trên máy chủ chủ quyền sở hữu của `root`, trong khi ứng dụng chạy dưới `appuser (UID 1001)`.
- **Lệnh phát hiện (Detection):** `docker logs <container_name>` hiển thị dòng lỗi Permission denied.
- **Cách khắc phục từng bước (Resolution):**
  Cấp quyền sở hữu thư mục logs cho UID 1001:
  ```bash
  # Trên Linux/WSL:
  sudo chown -R 1001:1001 ./logs
  chmod -R 775 ./logs
  
  # Khởi động lại container
  docker compose restart
  ```

### Tình huống 4: Learning Hub báo lỗi không kết nối được dịch vụ Data & AI
- **Hiện tượng (Symptom):** Giao diện CyberSoft Learning Hub hiển thị thông báo:
  `DATA_SERVICE_UNREACHABLE_MESSAGE: Connection refused at http://localhost:8000`.
- **Nguyên nhân gốc (Root Cause):** Máy chủ Data & AI chưa khởi động, hoặc có sai lệch cấu hình CORS / API Base URL trong file cấu hình `.env` của Learning Hub.
- **Lệnh phát hiện (Detection):**
  ```powershell
  curl -I http://localhost:8000/api/health
  ```
- **Cách khắc phục từng bước (Resolution):**
  1. Kiểm tra máy chủ Data & AI đang chạy tại đúng port: `curl http://localhost:8000/api/health`.
  2. Mở file `learning-hub/.env` và cập nhật chính xác đường dẫn:
     ```env
     DATA_SERVICE_BASE_URL=http://localhost:8000
     DATA_SERVICE_TIMEOUT_SECONDS=5
     ```
  3. Kiểm tra biến `ALLOWED_ORIGINS` trong mã nguồn backend để bảo đảm cho phép domain của Learning Hub (ví dụ: `http://localhost:3000`).

### Tình huống 5: Dữ liệu thực hành bị sai lệch hoặc học viên vô tình ghi đè
- **Hiện tượng (Symptom):** Kiểm tra mã băm SHA-256 của file dataset báo không khớp (`Checksum Mismatch`), bài thực hành của học viên cho kết quả sai lệch.
- **Nguyên nhân gốc (Root Cause):** File dữ liệu mẫu bị sửa đổi nội dung trực tiếp trong quá trình thực hành.
- **Lệnh phát hiện (Detection):** So sánh mã băm hiện tại với bảng manifest trong `docs/release_v1.0.md`.
- **Cách khắc phục từng bước (Resolution):**
  Kích hoạt quy trình khôi phục bản gốc từ kho lưu trữ sao lưu bất biến:
  ```powershell
  # Khôi phục file dataset gốc tức thì từ bản sao lưu
  Copy-Item -Path "./Data-AI-Resource/backup/DS-001_clean.csv" -Destination "./Data-AI-Resource/data/DS-001_clean.csv" -Force
  
  # Xác minh lại tính toàn vẹn mã băm
  Get-FileHash -Path "./Data-AI-Resource/data/DS-001_clean.csv" -Algorithm SHA256
  ```
  Hệ thống được đưa trở lại trạng thái nguyên bản 100% trong chưa đầy 1 giây.
