# SỔ TAY VẬN HÀNH & HƯỚNG DẪN TRIỂN KHAI (OPERATIONS GUIDE) — TASK 29

**Sản phẩm:** CyberSoft Data & AI Lab v1.0  
**Thực tập sinh:** Đào Trung Kiên — Data & AI Resource Engineer  

---

## 1. TỔNG QUAN KIẾN TRÚC TRIỂN KHAI

CyberSoft Data & AI Lab v1.0 được đóng gói thành container Docker tự chứa (Self-contained) theo tiêu chuẩn công nghiệp:
- **Base Image:** `python:3.10-slim` tối ưu hóa đa giai đoạn (Multi-stage build), loại bỏ trình biên dịch sau khi cài đặt gói để giảm dung lượng image xuống dưới 200MB.
- **Bảo mật:** Chạy dưới tài khoản người dùng phi đặc quyền `appuser` (UID 1001), ngăn chặn triệt để tấn công leo thang đặc quyền container.
- **Bộ nhớ đệm:** Hai tầng (Two-Tier Caching) với LRU Query Cache (sức chứa 2048 truy vấn) và Static Catalog Cache.
- **Khả năng phục hồi:** Kiểm tra sức khỏe tự động qua Docker Healthcheck tại endpoint `/api/v1/health` với chu kỳ 30 giây.

---

## 2. HƯỚNG DẪN TRIỂN KHAI VÀ KHỞI ĐỘNG

### 2.1 Triển khai với Docker Compose (Khuyến nghị cho Production)
```bash
# Di chuyển vào thư mục dự án Task 29
cd cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task29

# Build và khởi chạy ngầm trong container
docker-compose up -d --build

# Kiểm tra trạng thái container
docker ps --filter "name=cybersoft-data-ai-lab"

# Kiểm tra log vận hành
docker logs -f cybersoft-data-ai-lab
```

### 2.2 Triển khai trực tiếp bằng Python Uvicorn (Môi trường phát triển & kiểm thử)
```bash
# Khởi chạy server FastAPI
python -m uvicorn src.main:app --host 0.0.0.0 --port 8029 --workers 2
```
- Truy cập Giao diện Web Ops: `http://localhost:8029/portal/`
- Truy cập Tài liệu OpenAPI: `http://localhost:8029/docs`

---

## 3. GIÁM SÁT SỨC KHỎE & QUẢN TRỊ TÀI NGUYÊN

### 3.1 Cấu hình Giới hạn Tài nguyên (Resource Limits)
Trong tệp `docker-compose.yml`:
- **CPU Limits:** Tối đa 2.0 Cores, tối thiểu bảo lưu 0.5 Cores.
- **Memory Limits:** Tối đa 1024MB RAM, tối thiểu bảo lưu 256MB RAM.

### 3.2 Endpoint Healthcheck
Gửi yêu cầu GET tới `/api/v1/health`:
```json
{
  "status": "UP",
  "container_status": "HEALTHY",
  "service": "CyberSoft Data & AI Lab — Production Service (Task 29)",
  "version": "1.0.0",
  "timestamp": "2026-10-11T10:00:00Z",
  "memory_rss_mb": 78.4,
  "cache_status": "READY",
  "model_status": "LOADED"
}
```

---

## 4. QUY TRÌNH SAO LƯU & KHÔI PHỤC DỮ LIỆU (DISASTER RECOVERY)

1. **Tạo bản sao lưu định kỳ:**
   ```bash
   python scripts/backup.py
   ```
   Hệ thống sẽ kết xuất toàn bộ catalog, vector index và sinh tệp `manifest.json` ghi nhận mã băm SHA-256 từng tệp tin.

2. **Thử nghiệm khôi phục và kiểm chứng tính toàn vẹn:**
   ```bash
   python scripts/restore.py
   ```
   Hệ thống tự động so khớp từng byte dữ liệu; nếu phát hiện sai lệch mã băm hoặc tệp tin bị hỏng sẽ từ chối khôi phục để bảo vệ tính toàn vẹn hệ thống.
