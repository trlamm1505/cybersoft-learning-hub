# QUY CHUẨN LƯU TRỮ DỮ LIỆU (CYBERSOFT DATA STORE)

Thư mục `data/` được phân tách thành 3 tầng xử lý rõ rệt:

1. **`raw/`**: Chứa dữ liệu gốc nguyên bản được ingest từ bên ngoài (CSV, JSON, Markdown). **TUYỆT ĐỐI KHÔNG SỬA ĐỔI DỮ LIỆU TẠI ĐÂY**.
2. **`interim/`**: Chứa dữ liệu trung gian trong quá trình chuyển đổi, parse chunk hoặc xử lý bước 1.
3. **`processed/`**: Chứa dữ liệu sạch đã vượt qua cổng kiểm định của `Data Quality Harness` và sẵn sàng để Publish hoặc nạp vào Vector Database.

> **QUY TẮC AN TOÀN**: Mọi file dữ liệu lớn ($> 10\text{MB}$) đều được cấu hình trong `.gitignore` và không được phép commit trực tiếp vào Git repository. Chỉ các file cấu hình `.gitkeep` hoặc metadata mẫu được commit.
