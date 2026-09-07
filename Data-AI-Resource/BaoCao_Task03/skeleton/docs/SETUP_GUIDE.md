# HƯỚNG DẪN CÀI ĐẶT MÔI TRƯỜNG (SETUP GUIDE)

Tài liệu hướng dẫn chi tiết quy trình thiết lập môi trường phát triển cho **CyberSoft Data & AI Lab**.

---

## ⚡ 1. Khởi động Nhanh bằng "Một Lệnh Chuẩn" (Quick Start)

### Trên Windows (PowerShell):
Mở PowerShell tại thư mục dự án và chạy:
```powershell
.\run.ps1 setup
```

### Trên Linux / macOS (Terminal):
```bash
./run.sh setup
# hoặc:
make setup
```

Lệnh chuẩn sẽ tự động:
1. Tạo môi trường ảo `.venv`.
2. Nâng cấp `pip` và cài đặt các phụ thuộc nhẹ CPU-First.
3. Tạo file cấu hình an toàn `.env` từ `.env.example`.
4. Kích hoạt Git Pre-commit hooks.

---

## 🖥️ 2. Hướng dẫn Thiết lập Thủ công: CPU-First (Mặc định)

Nếu bạn muốn thực hiện từng bước thủ công:

### Bước 1: Khởi tạo môi trường ảo Python
```bash
python -m venv .venv
```
Kích hoạt:
* Windows: `.venv\Scripts\Activate.ps1`
* Linux/macOS: `source .venv/bin/activate`

### Bước 2: Cài đặt Dependencies CPU-First
```bash
python -m pip install --upgrade pip
pip install -r requirements-dev.txt
```
*(Dung lượng tải chỉ khoảng ~120MB, cài đặt hoàn tất trong dưới 60 giây)*

### Bước 3: Cấu hình biến môi trường
```bash
cp .env.example .env
```
Mở file `.env` và tùy chỉnh các tham số nếu cần.

### Bước 4: Kích hoạt Pre-commit Hooks
```bash
pre-commit install
```

### Bước 5: Chạy thử bộ kiểm tra nghiệm thu
```bash
pytest tests/ -v
```

---

## 🚀 3. Hướng dẫn Kích hoạt GPU-Optional (Tùy chọn nâng cao)

Chỉ áp dụng nếu máy của bạn có **Card đồ họa rời NVIDIA** và đã cài đặt driver phù hợp:

1. Kiểm tra driver NVIDIA:
```bash
nvidia-smi
```
2. Cài đặt thêm các gói GPU:
```bash
pip install -r requirements-gpu.txt
```
3. Chỉnh sửa trong file `.env`:
```ini
EMBEDDING_DEVICE=cuda
```
Hệ thống sẽ tự động chuyển tải tính toán Embedding và LLM inference sang GPU mà không cần sửa đổi mã nguồn.
