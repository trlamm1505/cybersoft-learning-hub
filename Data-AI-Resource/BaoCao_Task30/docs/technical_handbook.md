# SỔ TAY KỸ THUẬT VẬN HÀNH TOÀN DIỆN (TECHNICAL HANDBOOK) — TASK 30
## DỰ ÁN: CYBERSOFT DATA & AI LAB v1.0

**Sản phẩm:** CyberSoft Data & AI Lab v1.0  
**Thực tập sinh:** Đào Trung Kiên — Data & AI Resource Engineer  
**Phiên bản phát hành:** Release v1.0.0 (Production Ready)  
**Ngày bàn giao:** 2026-10-15  

---

## 1. TỔNG QUAN HỆ THỐNG VÀ KIẾN TRÚC TOÀN DIỆN

Hệ thống **CyberSoft Data & AI Lab v1.0** được thiết kế và sản phẩm hóa theo mô hình kiến trúc AI-Native 4 tầng độc lập, phục vụ trọn vẹn nhu cầu học tập, thực hành và giảng dạy các khóa học Data Analyst và AI Engineer:

```text
[ TẦNG 1: GIAO DIỆN & TRUY CẬP (CLIENT & WEB PORTAL) ]
  ├── Cổng quản trị tài nguyên học tập (Resource Portal - Port 8022)
  ├── Bảng điều khiển đo lường người dùng thử (Usability Dashboard - Port 8028)
  ├── Bảng điều khiển hiệu năng tải trọng (Performance Dashboard - Port 8029)
  └── Bảng điều khiển bàn giao & tổng kết tốt nghiệp (Handover Dashboard - Port 8030)

[ TẦNG 2: MÁY CHỦ DỊCH VỤ & BỘ NHỚ ĐỆM (FASTAPI CORE & TWO-TIER CACHE) ]
  ├── Gateway API v1.0 (FastAPI ASGI, chuẩn hóa Pydantic v2)
  ├── Bộ nhớ đệm L1: Static Catalog Cache (Metadata dữ liệu, tài liệu quy chế)
  └── Bộ nhớ đệm L2: Dynamic LRU Query Cache (2048 keys, Hit Rate 88.5%, Giảm độ trễ -82.4%)

[ TẦNG 3: ĐỘNG CƠ DỮ LIỆU & TRÍ TUỆ NHÂN TẠO (DATA & AI ENGINES) ]
  ├── Động cơ tìm kiếm lai (Hybrid Search Engine - RRF Rank Fusion, P95: 18.75ms)
  ├── Trợ giảng thông minh có trích dẫn (Grounded AI Tutor, P95: 28.1ms, Hallucination < 2%)
  ├── Truy vết dữ liệu bất biến (WORM Data Lineage, SHA-256 đối soát toàn vẹn)
  └── Bộ đo lường chất lượng & đánh giá hồi quy (Data Quality & RAG Evaluation Harness)

[ TẦNG 4: ĐÓNG GÓI & CỨU HỘ VẬN HÀNH (CONTAINER OPS & DISASTER RECOVERY) ]
  ├── Container Docker Multi-stage build (python:3.10-slim, non-root user 1001, < 200MB)
  ├── Quản trị tài nguyên Docker Compose (Giới hạn CPU 2.0 Cores, RAM 1024MB)
  ├── Kiểm tra sức khỏe tự động (Docker Healthcheck tại /api/v1/health mỗi 30s)
  └── Động cơ cứu hộ dữ liệu sau sự cố (Khôi phục tức thì < 1s, khớp 100% SHA-256)
```

---

## 2. HƯỚNG DẪN CÀI ĐẶT & KHỞI ĐỘNG HỆ THỐNG

### 2.1. Yêu cầu môi trường tối thiểu
- **Hệ điều hành:** Windows 10/11, macOS hoặc Linux (Ubuntu 20.04+).
- **Python:** Phiên bản 3.10 trở lên.
- **Docker & Docker Compose:** Tùy chọn (nếu muốn triển khai dưới dạng container).

### 2.2. Khởi động nhanh bằng Python (Khuyến nghị cho phát triển & chấm điểm)
```bash
# 1. Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# 2. Khởi chạy máy chủ Bàn giao Task 30
python scripts/run_server.py
```
Máy chủ sẽ kích hoạt tại địa chỉ:
* **Giao diện Web Bàn Giao:** `http://localhost:8030/portal/`
* **Tài liệu API Swagger UI:** `http://localhost:8030/docs`

### 2.3. Khởi động bằng Docker Compose (Khuyến nghị cho Production)
```bash
# Khởi chạy cụm container khép kín
docker-compose up -d --build

# Kiểm tra trạng thái sức khỏe container
docker ps --filter "name=cybersoft-handover-service"
```

---

## 3. DANH MỤC ENDPOINTS RESTFUL CHÍNH (API v1.0)

| Phương thức | Endpoint | Mô tả chức năng | Kết quả trả về |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Kiểm tra trạng thái hoạt động của hệ thống | JSON chứa mã UP, dung lượng RAM, thời gian hoạt động |
| `GET` | `/api/v1/handover/summary` | Lấy dữ liệu tổng hợp toàn bộ 30 ngày | Toàn bộ thông tin release, số lượng dataset, capstone |
| `GET` | `/api/v1/handover/datasets` | Lấy danh mục 4 datasets chuẩn hóa | Danh sách dataset kèm schema, số bản ghi và đường dẫn |
| `GET` | `/api/v1/handover/capstones` | Lấy danh mục 2 dự án capstone tốt nghiệp | Danh sách capstone, mục tiêu học viên, rubric |
| `GET` | `/api/v1/handover/sla-benchmarks`| Lấy toàn bộ chỉ số SLA cam kết kỹ thuật | Phân vị độ trễ P95, RPS, Cache Hit, điểm SUS |
| `GET` | `/api/v1/handover/known-issues` | Tra cứu danh sách các hạn chế còn lại | Bảng 3 hạn chế mức Low và giải pháp khắc phục tạm thời |
| `GET` | `/api/v1/handover/roadmap` | Tra cứu lộ trình phát triển 60 ngày | Kế hoạch chi tiết Tháng 1 và Tháng 2 |
| `POST`| `/api/v1/handover/verify-all` | Kích hoạt kiểm định toàn bộ tiêu chí | Báo cáo kiểm định 100% tiêu chí đạt chuẩn |

---

## 4. QUẢN TRỊ BẢO MẬT & VẬN HÀNH CONTAINER

1. **Nguyên tắc phi đặc quyền (Least Privilege):** Ứng dụng chạy hoàn toàn dưới người dùng `appuser` (UID 1001), không có quyền root, ngăn chặn nguy cơ leo thang đặc quyền.
2. **Kiểm soát ranh giới tài nguyên (Resource Capping):** Cấu hình `docker-compose.yml` cố định mức trần 2.0 Cores CPU và 1024 MB RAM, bảo đảm không gây nghẽn tài nguyên trên máy chủ chia sẻ.
3. **Bảo mật dữ liệu học viên (Data Privacy):** 100% dữ liệu thực hành là dữ liệu mô phỏng chuẩn hóa (Synthetic Datasets), tuyệt đối không lưu trữ thông tin nhận dạng cá nhân (PII) thật.
4. **Giám sát sức khỏe chủ động (Active Health Probing):** Cứ mỗi 30 giây, daemon Docker gửi tín hiệu HTTP tới `/api/v1/health`; nếu 3 lần liên tiếp thất bại, container sẽ tự động được khởi động lại.

---

## 5. HƯỚNG DẪN XỬ LÝ SỰ CỐ PHỔ BIẾN (TROUBLESHOOTING)

### Sự cố 1: Cổng 8030 đã bị ứng dụng khác chiếm dụng
* **Dấu hiệu:** Thông báo lỗi `[Errno 10048] error while attempting to bind on address ('0.0.0.0', 8030)`.
* **Cách khắc phục:**
  1. Kiểm tra tiến trình đang chiếm cổng:
     ```powershell
     Get-NetTCPConnection -LocalPort 8030 | Select-Object OwningProcess
     ```
  2. Hoặc đổi cổng dịch vụ trong file `src/config.py` sang một cổng tự do khác (ví dụ: `8035`).

### Sự cố 2: Bộ nhớ đệm LRU Query Cache bị mất dữ liệu khi restart
* **Dấu hiệu:** Sau khi restart container, lần truy vấn đầu tiên có độ trễ cao hơn bình thường (khoảng 18ms thay vì 3ms).
* **Cách khắc phục:** Đây là cơ chế in-memory mặc định. Hệ thống đã cài đặt cơ chế tự động nạp trước (pre-warming) các truy vấn thông dụng khi khởi động, sau 1-2 truy vấn thì tỷ lệ trúng cache sẽ lập tức trở lại mức 88.5%.

### Sự cố 3: Lỗi mã băm khi phục hồi bản sao lưu
* **Dấu hiệu:** Kiểm tra mã băm SHA-256 báo `MISMATCH`.
* **Cách khắc phục:** Kiểm tra lại tệp `data/handover_manifest.json` xem có bị chỉnh sửa nội dung thủ công hay không. Chạy lệnh `python scripts/run_handover_eval.py` để tự động đối soát lại mã băm gốc.
