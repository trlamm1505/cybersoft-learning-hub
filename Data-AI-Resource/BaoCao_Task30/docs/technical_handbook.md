# SỔ TAY KỸ THUẬT VẬN HÀNH TOÀN DIỆN (TECHNICAL HANDBOOK) — TASK 30
## DỰ ÁN: CYBERSOFT DATA & AI LAB v1.0 (PRODUCTION READY)

**Sản phẩm:** CyberSoft Data & AI Lab v1.0  
**Vai trò phụ trách:** Đào Trung Kiên — Data & AI Resource Engineer  
**Phiên bản phát hành:** Release v1.0.0 (Production Ready)  
**Ngày bàn giao:** 2026-10-15  
**Nguyên tắc thiết kế tài liệu:** Tự phục vụ (Self-service), người khác đọc theo là vận hành và gỡ lỗi được ngay mà không cần tác giả can thiệp.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG 4 TẦNG (4-TIER ARCHITECTURE)

Hệ sinh thái **CyberSoft Data & AI Lab v1.0** được thiết kế theo kiến trúc 4 tầng phân lập (Loosely Coupled Tiered Architecture), bảo đảm tính module hóa cao, bảo mật nghiêm ngặt và khả năng mở rộng linh hoạt:

| Tầng Kiến Trúc | Thành Phần Cốt Lõi | Vai Trò & Thông Số Vận Hành Thực Tế |
| :--- | :--- | :--- |
| **Tầng 1: Giao diện & Cổng Tích hợp**<br>*(Client & Integration Layer)* | • **Unified Web Portal (`/portal/`, 5 Tabs)** trên cổng `8029`<br>• **OpenAPI Swagger UI (`/docs`)** cho kiểm thử trực tiếp<br>• **RESTful Integration Contract** kết nối Learning Platform & QA Harness | Cung cấp giao diện hợp nhất bao phủ toàn bộ chức năng từ Tuần 1 đến Tuần 6 (Task 01–29) và hợp đồng dữ liệu JSON đồng nhất. |
| **Tầng 2: Máy chủ Dịch vụ & Bộ nhớ đệm Hai tầng**<br>*(FastAPI Core & Two-Tier Cache)* | • **FastAPI ASGI Server** (Async, Pydantic v2 Strict Validation)<br>• **L1 Static Catalog Cache**: Lưu trữ Metadata 4 Datasets & 2 Capstones<br>• **L2 Dynamic LRU Query Cache**: 2048 keys, TTL 300s, Hit Rate **88.5%** | Xử lý bất đồng bộ tải trọng cao (**340.5 RPS** với 20 workers, **0% lỗi**), giảm **82.4%** độ trễ truy vấn lặp lại (P95 trúng cache đạt **3.30 ms**). |
| **Tầng 3: Động cơ Dữ liệu & Trí tuệ Nhân tạo**<br>*(Data & AI Engines)* | • **Hybrid Search Engine**: RRF kết hợp BM25 + Vector Embedding<br>• **Grounded AI Tutor**: Trích nguồn `[doc#sec]`, Hallucination **< 1.8%**<br>• **Data Quality & WORM Lineage**: Kiểm định 3NF, khóa Snapshot SHA-256 | Tìm kiếm lai P95 đạt **18.75 ms** ($\le 25\text{ ms}$), phản hồi AI Tutor P95 đạt **28.10 ms** ($\le 1500\text{ ms}$), chặn tải HTTP 403 đối với tài nguyên `DRAFT` và từ chối câu hỏi ngoài phạm vi. |
| **Tầng 4: Đóng gói Container & Cứu hộ Vận hành**<br>*(Container Ops & Disaster Recovery)* | • **Multi-stage Docker Build** (`python:3.10-slim`, Image **182 MB**)<br>• **Non-root Execution**: Chạy dưới `appuser` (`UID 1001`, `GID 1001`)<br>• **Resource Limits**: Trần CPU `2.0 Cores`, RAM `1024 MB`<br>• **Disaster Recovery**: Sao lưu & đối soát khôi phục mã băm SHA-256 | Giám sát sức khỏe tự động mỗi 30 giây tại `/api/v1/health`; khôi phục toàn vẹn 100% từng byte dữ liệu sao lưu trong **< 1 giây**. |

### 1.1. Luồng xử lý dữ liệu tích hợp (End-to-End Request Flow)
1. **Tiếp nhận yêu cầu (Bước 1)**: Học viên, Giảng viên hoặc hệ thống Learning Hub gửi yêu cầu tra cứu học liệu, hỏi bài AI Tutor hoặc tải dataset tới cổng dịch vụ `http://localhost:8029`.
2. **Kiểm tra Bộ nhớ đệm Hai tầng (Bước 2)**:
   - **Trường hợp Trúng Cache (88.5% lưu lượng)**: L2 LRU Cache trả kết quả tức thì từ bộ nhớ RAM với độ trễ phân vị P95 chỉ **3.30 ms**.
   - **Trường hợp Trượt Cache (11.5% lưu lượng)**: Chuyển tiếp yêu cầu xuống tầng Động cơ Dữ liệu & AI (Bước 3).
3. **Thực thi Tìm kiếm lai RRF & Kiểm duyệt An toàn (Bước 3)**:
   - Quét tường lửa chống Prompt Injection và kiểm tra phạm vi học liệu.
   - Thực thi thuật toán hợp nhất thứ hạng Reciprocal Rank Fusion (BM25 + Dense Vector) và trích xuất câu trả lời kèm mã trích dẫn `[doc#sec]`.
4. **Cập nhật Cache & Phản hồi (Bước 4)**: Lưu kết quả mới vào L2 LRU Cache (kèm TTL) và trả phản hồi JSON chuẩn hóa về phía Client.

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

# Kích hoạt môi trường ảo:
# Nếu dùng Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Nếu dùng Windows CMD (Command Prompt):
.\.venv\Scripts\activate.bat
# Nếu dùng Linux / macOS:
# source .venv/bin/activate
```

#### Bước 2: Thiết lập cấu hình biến môi trường
Tạo file `.env` tại thư mục làm việc dựa trên mẫu cấu hình chuẩn:
```env
# Cấu hình máy chủ dịch vụ
ENVIRONMENT=production
PORT=8029
HOST=0.0.0.0
LOG_LEVEL=INFO

# Cấu hình bộ nhớ đệm Two-Tier
CACHE_L1_ENABLED=true
CACHE_L2_LRU_CAPACITY=2048
CACHE_TTL_SECONDS=300

# Cấu hình bảo mật & ranh giới tài nguyên
MAX_CONCURRENT_WORKERS=20
RATE_LIMIT_RPS=500
RUN_AS_USER=1001

# Đường dẫn dữ liệu chuẩn hóa
DATASET_ROOT_PATH=./Data-AI-Resource/BaoCao_Task29/data
BACKUP_ARCHIVE_PATH=./Data-AI-Resource/BaoCao_Task29/data/backup_sample
```

#### Bước 3: Cài đặt các gói thư viện phụ thuộc
```powershell
pip install --upgrade pip
pip install -r Data-AI-Resource/BaoCao_Task29/requirements.txt
```

#### Bước 4: Khởi động máy chủ dịch vụ (Mở trên Cửa sổ Terminal 1)
```powershell
# Chạy máy chủ dịch vụ hợp nhất Data & AI Lab (Lắng nghe tại Port 8029)
python Data-AI-Resource/BaoCao_Task29/scripts/run_server.py
```
*Lưu ý: Lệnh này sẽ giữ terminal để phục vụ lắng nghe các yêu cầu mạng (Giao diện Web tại `http://localhost:8029/portal/` và Swagger UI tại `http://localhost:8029/docs`). Không đóng cửa sổ này.*

#### Bước 5: Xác minh khởi chạy thành công (Mở trên Cửa sổ Terminal 2)
Mở một cửa sổ dòng lệnh (Terminal) thứ hai để gửi yêu cầu kiểm tra sức khỏe:
```powershell
curl -s http://localhost:8029/api/v1/health
```
Kết quả mong đợi:
```json
{
  "status": "UP",
  "container_status": "HEALTHY",
  "service": "CyberSoft Data & AI Lab — Unified Production Service (Tasks 01-29)",
  "version": "1.0.0",
  "timestamp": "2026-10-15T10:00:00Z",
  "memory_rss_mb": 78.4,
  "cache_status": "READY",
  "model_status": "LOADED"
}
```

### 2.3. Quy trình triển khai qua Docker Compose (Khuyến nghị cho môi trường Production)

Di chuyển vào thư mục `BaoCao_Task29` (nơi chứa `Dockerfile` và `docker-compose.yml`) và khởi chạy cụm dịch vụ:
```powershell
cd d:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task29

# Khởi chạy cụm dịch vụ nền (hoặc chạy .\scripts\deploy.ps1 trên Windows / ./scripts/deploy.sh trên Linux)
docker compose up -d --build

# Kiểm tra trạng thái container (container_name: cybersoft-data-ai-lab)
docker ps --filter "name=cybersoft-data-ai-lab"
```

---

## 3. SỔ TAY DÀNH CHO QUẢN TRỊ VIÊN (ADMIN GUIDE)

### 3.1. Danh mục các điểm cuối API cốt lõi (API Endpoints Directory — Port 8029)
| Phương thức | Đường dẫn Endpoint | Mục đích vận hành | Đối tượng gọi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Kiểm tra trạng thái máy chủ, bộ nhớ đệm và mô hình AI | Docker Healthcheck / Giám sát |
| `GET` | `/api/v1/ops/hub/overview` | Tra cứu danh mục dữ liệu 3NF, báo cáo chất lượng & Lineage DAG | Learning Hub / Giảng viên |
| `POST` | `/api/v1/ops/hub/dataset-action` | Xem trước CSV (`preview`), tải dữ liệu (`download`) & khóa Snapshot | Giảng viên / Học viên |
| `GET` | `/api/v1/ops/hub/search` | Tìm kiếm học liệu lai RRF & hỏi đáp Trợ giảng AI có trích dẫn `[doc#sec]` | Học viên tra cứu / Hỏi bài |
| `POST` | `/api/v1/ops/hub/exercise-lineage` | Sinh đề bài tập theo thang Bloom & kiểm chứng kho bất biến WORM | Giảng viên / Quản trị dữ liệu |
| `POST` | `/api/v1/ops/hub/security-qa-ux` | Quét tường lửa PII / Prompt Injection, thẩm định 4 QA Gate & Việt hóa lỗi | Kỹ sư QA / Bảo mật |
| `GET` | `/api/v1/ops/benchmark` | Tra cứu toàn bộ bảng đo lường phân vị độ trễ P50–P99 và thông lượng RPS | Ban Quản lý / Kỹ sư Nghiệm thu |
| `GET` | `/api/v1/ops/cache/stats` | Giám sát lượt trúng đệm và tỷ lệ Hit Rate của LRU Cache | Kỹ sư trực ca / DevOps |
| `POST` | `/api/v1/ops/cache/clear` | Làm mới bộ nhớ đệm động L2 LRU và nạp lại danh mục L1 | Quản trị viên hệ thống |
| `GET` | `/api/v1/ops/backup/manifest` | Tra cứu hồ sơ manifest sao lưu và danh sách mã băm SHA-256 | Quản trị viên hệ thống |
| `POST` | `/api/v1/ops/backup/restore-test` | Kích hoạt đối soát và khôi phục dữ liệu thảm họa toàn vẹn SHA-256 | Quản trị viên khi có sự cố |

### 3.2. Quản trị phân quyền & Vận hành phi đặc quyền (Security Posture)
1. **Thực thi dưới tài khoản phi đặc quyền:** Không bao giờ chạy container dưới quyền `root`. Tệp `BaoCao_Task29/Dockerfile` đã cố định:
   ```dockerfile
   RUN groupadd -g 1001 appgroup && \
       useradd -u 1001 -g appgroup -s /bin/bash -m appuser
   USER appuser
   ```
2. **Cố định ranh giới tài nguyên (Resource Capping):** Cấu hình `docker-compose.yml` cố định mức trần `2.0` Cores CPU và `1024M` RAM (reservation `0.5` CPU, `256M` RAM), ngăn ngừa hiện tượng một tiến trình chiếm dụng toàn bộ tài nguyên máy chủ.
3. **Bảo mật dữ liệu học tập:** Toàn bộ 4 datasets xuất bản là dữ liệu tổng hợp chuẩn hóa (Synthetic Enterprise Data), không chứa dữ liệu định danh cá nhân nhạy cảm (Zero Real PII); các bộ dữ liệu đang ở trạng thái `DRAFT` bị chặn tải xuống với mã `HTTP 403`.

### 3.3. Giám sát & Quản lý Bộ nhớ đệm (Cache Management)
- **Kiểm tra tỷ lệ trúng đệm:** Kiểm tra tỷ lệ Hit Rate thông qua endpoint `GET http://localhost:8029/api/v1/ops/cache/stats`. Ngưỡng cảnh báo: Nếu Hit Rate rơi xuống dưới 75%, quản trị viên cần kích hoạt quy trình làm ấm bộ nhớ đệm.
- **Quy trình làm ấm bộ nhớ đệm (Cache Pre-warming):** Chạy tập lệnh kiểm thử tải hoặc gửi loạt câu hỏi quy chế phổ biến vào hệ thống sau mỗi lần bảo trì để nạp sẵn dữ liệu đệm vào RAM.

---

## 4. SỔ TAY XỬ LÝ SỰ CỐ THỰC TẾ (TROUBLESHOOTING GUIDE)

Dưới đây là 5 tình huống phát sinh lỗi phổ biến nhất trong thực tế kèm giải pháp khắc phục dứt điểm:

### Tình huống 1: Cổng mạng 8029 đã bị tiến trình khác chiếm dụng
- **Hiện tượng (Symptom):** Khi chạy máy chủ, terminal báo lỗi:
  `[Errno 10048] error while attempting to bind on address ('0.0.0.0', 8029)` hoặc `address already in use`.
- **Nguyên nhân gốc (Root Cause):** Một tiến trình Python hoặc dịch vụ cũ đang giữ cổng 8029 và chưa được giải phóng.
- **Lệnh phát hiện (Detection):**
  ```powershell
  netstat -ano | findstr :8029
  ```
- **Cách khắc phục từng bước (Resolution):**
  1. Xác định mã tiến trình (PID) ở cột ngoài cùng bên phải.
  2. Kết thúc tiến trình đó:
     ```powershell
     taskkill /PID <MÃ_PID> /F
     ```
  3. Hoặc di chuyển vào thư mục `BaoCao_Task29` và khởi chạy máy chủ trên cổng dự phòng `8030`:
     ```powershell
     cd d:\Cybersoft\Kien\cybersoft-learning-hub\Data-AI-Resource\BaoCao_Task29
     python -m uvicorn src.main:app --host 0.0.0.0 --port 8030
     ```

### Tình huống 2: Tăng độ trễ tạm thời ngay sau khi khởi động lại Container (Cold Start)
- **Hiện tượng (Symptom):** Ngay sau khi restart container, các lượt truy vấn đầu tiên mất ~18ms - 25ms thay vì mức trúng đệm thông thường 3.3ms.
- **Nguyên nhân gốc (Root Cause):** L2 LRU Cache được lưu trên bộ nhớ RAM tiến trình nên được khởi tạo mới khi container khởi động lại, khiến các truy vấn đầu tiên phải đi qua tầng tính toán RRF.
- **Lệnh phát hiện (Detection):** Kiểm tra thống kê bộ nhớ đệm tại `GET http://localhost:8029/api/v1/ops/cache/stats`.
- **Cách khắc phục từng bước (Resolution):**
  Thực hiện làm ấm bộ nhớ đệm (pre-warm) bằng tập lệnh kiểm thử tải có sẵn hoặc gửi truy vấn nạp đệm trực tiếp qua cổng 8029:
  ```powershell
  # Cách 1: Chạy tập lệnh benchmark & nạp tải tự động có sẵn trong dự án
  python Data-AI-Resource/BaoCao_Task29/scripts/run_load_test.py

  # Cách 2: Gửi truy vấn nạp đệm trực tiếp qua REST API cổng 8029
  python -c "
  import requests
  questions = ['chính sách bảo mật PII', 'chuẩn hóa 3NF', 'trích dẫn RAG']
  for q in questions:
      requests.get('http://localhost:8029/api/v1/ops/hub/search', params={'q': q, 'mode': 'hybrid_rrf'})
  print('Cache pre-warmed successfully')
  "
  ```
  Sau khi hoàn tất, các truy vấn lặp lại lập tức đạt độ trễ P95 < 5ms.

### Tình huống 3: Lỗi phân quyền ghi thư mục `./logs` khi mount Volume trong Docker
- **Hiện tượng (Symptom):** Container gặp lỗi khi ghi tệp nhật ký vào thư mục mount `./logs:/app/logs:rw`:
  `PermissionError: [Errno 13] Permission denied: '/app/logs/...'`.
- **Nguyên nhân gốc (Root Cause):** Thư mục `./logs` trên máy chủ host thuộc quyền sở hữu của `root`, trong khi ứng dụng trong container chạy dưới tài khoản phi đặc quyền `appuser (UID 1001, GID 1001)`.
- **Lệnh phát hiện (Detection):** `docker logs cybersoft-data-ai-lab` hiển thị dòng lỗi `PermissionError`.
- **Cách khắc phục từng bước (Resolution):**
  Cấp quyền sở hữu thư mục `./logs` cho UID/GID `1001`:
  ```bash
  # Trên Linux / WSL2 (tại thư mục Data-AI-Resource/BaoCao_Task29):
  mkdir -p ./logs
  sudo chown -R 1001:1001 ./logs
  chmod -R 775 ./logs

  # Khởi động lại container
  docker compose restart
  ```

### Tình huống 4: Learning Hub báo lỗi không kết nối được dịch vụ Data & AI
- **Hiện tượng (Symptom):** Giao diện CyberSoft Learning Hub hiển thị thông báo:
  `DATA_SERVICE_UNREACHABLE_MESSAGE: Connection refused at http://localhost:8029`.
- **Nguyên nhân gốc (Root Cause):** Máy chủ Data & AI chưa khởi động, hoặc có sai lệch cấu hình API Base URL trong biến môi trường `.env` của Learning Hub.
- **Lệnh phát hiện (Detection):**
  ```powershell
  curl -i http://localhost:8029/api/v1/health
  ```
- **Cách khắc phục từng bước (Resolution):**
  1. Kiểm tra máy chủ Data & AI đang chạy tại đúng port 8029: `curl http://localhost:8029/api/v1/health`.
  2. Mở file cấu hình `.env` của dịch vụ gọi và cập nhật chính xác đường dẫn:
     ```env
     DATA_SERVICE_BASE_URL=http://localhost:8029
     DATA_SERVICE_TIMEOUT_SECONDS=5
     ```
  3. Kiểm tra cấu hình `CORSMiddleware` trong `BaoCao_Task29/src/main.py` để bảo đảm cho phép origin của Learning Hub.

### Tình huống 5: Dữ liệu thực hành bị sai lệch hoặc học viên vô tình ghi đè
- **Hiện tượng (Symptom):** Kiểm tra mã băm SHA-256 của file snapshot báo không khớp (`Checksum Mismatch`), bài thực hành của học viên cho kết quả sai lệch.
- **Nguyên nhân gốc (Root Cause):** File dữ liệu mẫu bị sửa đổi nội dung trực tiếp trong quá trình thực hành.
- **Lệnh phát hiện (Detection):** Đối soát mã băm hiện tại với manifest sao lưu qua `GET http://localhost:8029/api/v1/ops/backup/manifest`.
- **Cách khắc phục từng bước (Resolution):**
  Kích hoạt quy trình khôi phục bản gốc và kiểm tra toàn vẹn SHA-256 từ kho lưu trữ sao lưu bất biến:
  ```powershell
  # 1. Thực thi công cụ khôi phục và đối soát toàn vẹn mã băm SHA-256
  python Data-AI-Resource/BaoCao_Task29/scripts/restore.py

  # 2. Hoặc kích hoạt đối soát khôi phục trực tiếp qua REST API
  curl -s -X POST http://localhost:8029/api/v1/ops/backup/restore-test

  # 3. Xác minh lại mã băm SHA-256 trên đĩa cứng
  Get-FileHash -Path "./Data-AI-Resource/BaoCao_Task29/data/backup_sample/catalog_snapshot.json" -Algorithm SHA256
  ```
  Hệ thống được đưa trở lại trạng thái nguyên bản 100% trong chưa đầy 1 giây.
