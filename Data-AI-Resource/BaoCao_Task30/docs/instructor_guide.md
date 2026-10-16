# SỔ TAY HƯỚNG DẪN DÀNH CHO GIẢNG VIÊN & TRỢ GIẢNG (INSTRUCTOR QUICK GUIDE) — TASK 30
## HỆ THỐNG QUẢN TRỊ TÀI NGUYÊN CYBERSOFT DATA & AI LAB v1.0

**Đối tượng sử dụng:** Giảng viên, Trợ giảng, Chuyên viên học vụ CyberSoft Academy  
**Mục tiêu:** Tra cứu, tải tài nguyên học tập, giao bài tập và sử dụng Trợ giảng AI mà không cần can thiệp mã nguồn kỹ thuật.  

---

## 1. QUY TRÌNH 3 PHÚT BẮT ĐẦU NHANH (3-MINUTE QUICKSTART)

Giảng viên có thể truy cập hệ thống qua giao diện web trực quan theo 3 bước:

1. **Bước 1: Mở cổng thông tin quản trị tài nguyên**
   * Truy cập đường dẫn: **http://localhost:8030/portal/** trên bất kỳ trình duyệt hiện đại nào.
   * Giao diện hiển thị tổng quan 4 nhóm tài nguyên và trạng thái sẵn sàng phát hành v1.0.

2. **Bước 2: Tìm kiếm & Tải Dataset cho buổi học**
   * Chuyển sang thẻ **"1. Danh Mục Datasets & Capstone"**.
   * Chọn định dạng tệp mong muốn (`CSV` cho Excel/Power BI, `Parquet` cho phân tích dữ liệu lớn Python/Spark).
   * Bấm nút **"Tải Dữ Liệu Sạch (Clean)"** để lấy bộ dữ liệu hoàn chỉnh, hoặc bấm **"Tải Dữ Liệu Bẩn (Dirty)"** cho bài tập thực hành làm sạch dữ liệu.

3. **Bước 3: Lấy Đề bài & Rubric chấm Capstone**
   * Tại mục Capstone Projects, giảng viên có thể tải trọn bộ tài liệu gồm:
     - Đề bài và mục tiêu học viên cần đạt.
     - Tiêu chí chấm điểm chi tiết 5 mức độ (Rubric).
     - Bộ dữ liệu mẫu có sẵn để đối chiếu kết quả.

---

## 2. HƯỚNG DẪN CHI TIẾT CÁC BỘ TÀI NGUYÊN HỌC TẬP

### 2.1. Danh mục 4 Datasets Chuẩn Hóa Doanh Nghiệp

| Mã Dataset | Tên Bộ Dữ Liệu | Khóa Học Đề Xuất | Ứng Dụng Trong Buổi Học |
| :--- | :--- | :--- | :--- |
| **DS-001** | Bán Hàng & Phân Tích Đơn Hàng | Data Analyst cơ bản - nâng cao | Luyện tập viết truy vấn SQL phức tạp (JOIN 4 bảng, GROUP BY, Window Functions). |
| **DS-002** | Quản Trị Nhân Sự & Hiệu Suất | Data Analyst / Khoa học Dữ liệu | Trực quan hóa dữ liệu trên Power BI / Tableau; phân tích biến động nhân sự. |
| **DS-003** | Quy Chế Đào Tạo & Tri Thức RAG | AI Engineer chuyên sâu | Xây dựng đồ án RAG (Retrieval-Augmented Generation); chia đoạn văn bản (chunking). |
| **DS-004** | Luồng Sự Kiện Thương Mại Điện Tử | Data Engineering / Big Data | Phân tích phễu chuyển đổi (Funnel Analysis); làm việc với định dạng dữ liệu Parquet. |

### 2.2. Hai Đồ Án Tốt Nghiệp (Capstone Projects) Đã Sẵn Sàng

1. **Capstone Data Analyst (CAP-001): Phân Tích Doanh Thu & Hành Vi Tiêu Dùng**
   * Cung cấp sẵn file đề bài, dữ liệu đa bảng, và barem chấm điểm công bằng.
   * Học viên nộp file dashboard hoặc file Jupyter Notebook phân tích.
2. **Capstone AI Engineer (CAP-002): Trợ Giảng AI RAG Có Khả Năng Từ Chối Ảo Giác**
   * Cung cấp harness đánh giá tự động: đo lường độ chính xác trích nguồn, độ trễ phản hồi (< 1500ms) và tỷ lệ ảo giác (< 2%).

---

## 3. CÁCH KIỂM TRA TRỢ GIẢNG AI (AI TUTOR)

Giảng viên có thể hướng dẫn học viên hoặc tự mình trải nghiệm tính năng hỏi đáp quy chế đào tạo:
* Đặt các câu hỏi về quy chế học viện: *"Quy định bảo lưu khóa học là gì?"*, *"Điều kiện để nhận chứng chỉ tốt nghiệp?"*.
* **Quan sát câu trả lời:** AI Tutor tự động trả lời ngắn gọn, kèm thẻ trích dẫn chính xác `[doc_id#section_id]`.
* **Thử nghiệm câu hỏi ngoài phạm vi:** Khi hỏi các câu hỏi không liên quan (ví dụ: *"Giá vé máy bay đi Đà Nẵng?"*), AI Tutor sẽ lịch sự từ chối trả lời theo đúng nguyên tắc bảo vệ tri thức, không bịa đặt thông tin.

---

## 4. KÊNH HỖ TRỢ VÀ BÁO LỖI (SUPPORT & ESCALATION)

Khi gặp bất kỳ thắc mắc hoặc sự cố về dữ liệu trong quá trình giảng dạy:
* **Đội ngũ kỹ thuật phụ trách:** Bộ phận Data & AI Resource Engineering CyberSoft.
* **Quy trình báo lỗi:** Gửi phản hồi kèm mã lỗi và ảnh chụp màn hình về kênh hỗ trợ nội bộ.
* **Thời gian phản hồi cam kết:** Dưới 30 phút đối với các lớp đang trong giờ học thực hành.
