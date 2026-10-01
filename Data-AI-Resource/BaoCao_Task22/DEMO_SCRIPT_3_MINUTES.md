# KỊCH BẢN VIDEO DEMO 3 PHÚT (DEMO SCRIPT) — NGÀY 22
## GIAO DIỆN TÌM VÀ TẢI TÀI NGUYÊN DỮ LIỆU GIÁO DỤC (CYBERSOFT RESOURCE PORTAL v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 22 — Giao diện tìm và tải tài nguyên (`cybersoft-resource-portal`)  
**Thực hiện**: Đào Trung Kiên (Data & AI Resource Engineer)  
**Thời lượng**: 03 phút 00 giây (180 giây)  
**Môi trường quay**: Trình duyệt Web (1920x1080 Full HD), VS Code Terminal, Swagger UI (`http://localhost:8000/docs`).

---

### PHÂN CẢNH CHI TIẾT (TIMELINE)

#### PHÂN CẢNH 1: MỞ ĐẦU & TỔNG QUAN BÀI TOÁN (00:00 - 00:30)
- **Hành động trên màn hình**:
  - Mở giao diện Cổng tài nguyên CyberSoft Resource Portal tại `http://localhost:8000/portal/`.
  - Giới thiệu nhanh header, thanh tìm kiếm live search tức thì và các thống kê KPI (Tổng dataset, Số lượt tải, Điểm phản hồi trung bình).
- **Lời thuyết minh (Voiceover)**:
  > *"Xin chào thầy cô và các bạn. Hôm nay em xin phép demo sản phẩm Ngày 22 trong lộ trình thực tập Data & AI Resource Engineer: Giao diện tìm và tải tài nguyên dữ liệu CyberSoft Resource Portal phiên bản v0.1.*  
  > *Trước đây, giảng viên mất từ 10 đến 15 phút để tìm và tải một bộ dữ liệu giáo dục chuẩn hóa, đồng thời đối mặt nguy cơ tải nhầm dữ liệu lỗi hoặc bản nháp. Cổng thông tin hôm nay giải quyết triệt để vấn đề này với mục tiêu cốt lõi: Giảng viên tìm kiếm và tải dataset trong dưới 60 giây, bảo đảm an toàn kiểm soát truy cập tuyệt đối."*

---

#### PHÂN CẢNH 2: TÌM KIẾM TỨC THÌ & BỘ LỌC ĐA CHIỀU (00:30 - 01:10)
- **Hành động trên màn hình**:
  - Gõ từ khóa `retail` vào ô tìm kiếm -> Kết quả lọc tức thì theo thời gian thực (Debounced Search < 200ms) hiển thị ngay dataset Doanh số Bán lẻ Chuỗi Siêu thị.
  - Xóa từ khóa, chuyển sang click chip bộ lọc:
    - Chọn Domain: `Finance / Retail`.
    - Chọn Level: `Beginner` (Cơ bản).
    - Chọn License: `CC-BY-4.0`.
  - Thẻ dataset tự động cập nhật mượt mà không cần reload trang.
- **Lời thuyết minh (Voiceover)**:
  > *"Tính năng đầu tiên là tìm kiếm và lọc đa chiều theo thời gian thực. Em gõ từ khóa 'retail', hệ thống phản hồi ngay tức thì chỉ trong vài mili-giây.*  
  > *Giảng viên có thể kết hợp các tiêu chí lọc: Lĩnh vực, Độ khó từ Cơ bản đến Nâng cao, và Giấy phép học liệu bản quyền. Mọi thao tác đều diễn ra mượt mà trên nền tảng Single Page Application."*

---

#### PHÂN CẢNH 3: XEM TRƯỚC LƯỢC ĐỒ 3NF & TẢI DATASET (01:10 - 01:50)
- **Hành động trên màn hình**:
  - Click nút **"Xem trước & Lược đồ"** trên thẻ `DATASET-RET-001`.
  - Modal bật lên hiển thị:
    - Bảng dữ liệu mẫu (10 dòng đầu tiên có thanh cuộn ngang).
    - Bảng thông tin lược đồ chuẩn 3NF: Tên cột, kiểu dữ liệu (`INTEGER`, `DECIMAL`, `VARCHAR`), ràng buộc `NOT NULL`, khóa chính/ngoại.
    - Đối soát mã băm toàn vẹn SHA-256 (`8a5c2f...`).
  - Click nút **"Tải Dataset (.CSV)"** -> Tệp tải về máy lập tức (< 1 giây).
- **Lời thuyết minh (Voiceover)**:
  > *"Để tránh tình trạng tải nhầm file không đúng cấu trúc bài giảng, Cổng thông tin cung cấp tính năng Xem trước dữ liệu và Tra cứu Lược đồ chuẩn 3NF.*  
  > *Giảng viên xem được 10 dòng dữ liệu thực tế, kiểm tra từng kiểu dữ liệu, các ràng buộc toàn vẹn và mã kiểm tra SHA-256. Sau khi xác nhận chuẩn xác, click 'Tải Dataset', tệp CSV tải về hoàn tất ngay lập tức."*

---

#### PHÂN CẢNH 4: CƠ CHẾ BẢO VỆ CHẶN BẢN NHÁP (403 FORBIDDEN) (01:50 - 02:25)
- **Hành động trên màn hình**:
  - Nhấp chọn checkbox "Hiển thị bản thảo nội bộ" -> Xuất hiện dataset `DATASET-STU-005` (Bản khảo sát học viên — Trạng thái Draft).
  - Nút Tải trên giao diện bị khóa (disabled) kèm badge cảnh báo đỏ: `Chỉ xem trước - Bản nháp nội bộ`.
  - Mở tab DevTools Network hoặc Postman/cURL, thực hiện request tải trực tiếp `GET /api/v1/portal/datasets/DATASET-STU-005/download`.
  - Hệ thống trả về `403 Forbidden` với payload chuẩn mực:
    ```json
    {
      "success": false,
      "error": {
        "code": "DATASET_UNPUBLISHED_RESTRICTED",
        "message": "Không thể tải tập dữ liệu ở trạng thái draft..."
      }
    }
    ```
- **Lời thuyết minh (Voiceover)**:
  > *"Tiêu chí nghiệm thu DoD số 2 yêu cầu: Không cho phép download bản chưa publish. Trên giao diện, nút tải của bản thảo Draft tự động bị vô hiệu hóa.*  
  > *Đặc biệt, cơ chế bảo vệ này được thực thi ở mức Gatekeeper Backend. Khi cố tình gọi API tải trực tiếp, máy chủ lập tức từ chối và trả về HTTP 403 Forbidden với mã lỗi DATASET_UNPUBLISHED_RESTRICTED. Đảm bảo an toàn dữ liệu 100%."*

---

#### PHÂN CẢNH 5: WIDGET ĐÁNH GIÁ 1-5 SAO & KẾT QUẢ ĐO LƯỜNG (02:25 - 03:00)
- **Hành động trên màn hình**:
  - Trên Modal dataset, chọn 5 sao, nhập nhận xét: *"Dữ liệu rất sạch, cấu trúc chuẩn 3NF, phù hợp làm bài thực hành tuần 2 cho học viên"*.
  - Nhấn "Gửi Đánh Giá" -> Toast thông báo thành công xanh lá, điểm đánh giá trung bình của dataset cập nhật ngay lập tức.
  - Bật Terminal chạy kịch bản đo kiểm `python scripts/run_usability_eval.py`:
    - Hiển thị kết quả 5/5 kịch bản hoàn thành xuất sắc trong **0.141 giây** (vượt xa chỉ tiêu < 60 giây).
    - Pytest `19 passed in 0.68s`.
- **Lời thuyết minh (Voiceover)**:
  > *"Cuối cùng là hệ thống phản hồi chất lượng. Giảng viên có thể chấm từ 1 đến 5 sao và để lại góp ý sư phạm, giúp đội ngũ kỹ thuật liên tục nâng cao chất lượng học liệu.*  
  > *Toàn bộ 5 kịch bản kiểm thử độ khả dụng thực tế của giảng viên đều đạt kết quả xuất sắc với thời gian phản hồi dưới 1 giây, hoàn thành 100% tiêu chí nghiệm thu DoD Ngày 22. Em xin chân thành cảm ơn!"*
