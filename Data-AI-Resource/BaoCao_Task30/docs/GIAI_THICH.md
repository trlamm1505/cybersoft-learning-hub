# HƯỚNG DẪN GIẢI THÍCH VÀ BẢO VỆ TASK 30 (3-5 PHÚT)

## 1. MỤC TIÊU CỐT LÕI (MỘT CÂU)
> **Nghiệm thu toàn diện 30 ngày thực tập, đối soát 6 tiêu chí kỹ thuật chuẩn xác theo dữ liệu đo thật từ Tasks 26-29, bàn giao đầy đủ 4 datasets 3NF, 2 capstone projects, và công khai hạn chế kèm lộ trình phát triển 60 ngày.**

---

## 2. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (DẠNG VĂN BẢN)
```text
[Tệp Hồ Sơ Bàn Giao: handover_manifest.json]
         │
         ▼
[Dịch vụ HandoverService (src/services/handover_service.py)]
         ├──> [Đối soát 4 Datasets chuẩn 3NF & 2 Dự án Capstone có Rubric]
         ├──> [Tái sử dụng Task 28: Đối soát công thức SUS (92.5) & Giảm thời gian tìm kiếm (62.4%)]
         ├──> [Tái sử dụng Task 29: Đối soát độ trễ P95 (18.75ms) & Khôi phục thảm họa SHA-256 (100%)]
         └──> [Xác minh 3 Hạn chế kỹ thuật công khai & Lộ trình 60 ngày 2 chặng]
         │
         ▼
[API FastAPI + Dashboard Nghiệm thu (portal/index.html)] ──> [Hiển thị 100% Tiêu chí ĐẠT CHUẨN]
```

---

## 3. THỨ TỰ ĐỌC FILE KHI BẢO VỆ
1. **`data/handover_manifest.json`**: Tệp trung tâm lưu trữ toàn bộ số liệu đo thật, danh mục 4 datasets, 2 capstones, chỉ số SLA kỹ thuật và lộ trình.
2. **`src/services/handover_service.py`**: Tầng nghiệp vụ đọc manifest, kiểm chứng tự động 6 tiêu chuẩn nghiệm thu, trực tiếp gọi hàm từ Task 28 và Task 29.
3. **`src/routes/handover.py`**: Các API RESTful phục vụ hiển thị báo cáo nghiệm thu và điểm cuối kiểm tra sức khỏe `/health`.
4. **`docs/`**: Bộ 4 tài liệu chuyên sâu:
   - `technical_handbook.md`: Sổ tay kỹ thuật vận hành toàn diện hệ thống.
   - `instructor_guide.md`: Hướng dẫn dành cho giảng viên sử dụng datasets & rubric capstone.
   - `demo_guide.md`: Kịch trình trình diễn sản phẩm trong 15 phút.
   - `retro_and_roadmap.md`: Đánh giá cải tiến (Start/Stop/Continue) và lộ trình 60 ngày.

---

## 4. 5 CÂU HỎI BẢO VỆ PHỔ BIẾN VÀ CÂU TRẢ LỜI NGẮN GỌN

### Câu 1: Em hãy giải thích nguồn gốc các số liệu SLA (SUS 92.5, P95 18.75ms, 100% SHA-256) trong Task 30?
- **Trả lời**: Toàn bộ số liệu trong `handover_manifest.json` được kế thừa chính xác từ kết quả chạy thực nghiệm ở các task trước: điểm SUS 92.5 và giảm thời gian 62.4% đo từ phiên thử người dùng Task 28; độ trễ P95 18.75ms và thông lượng 340.5 RPS đo từ bộ kiểm thử tải Task 29; tỷ lệ khớp 100% SHA-256 là kết quả đối soát toàn vẹn cứu hộ dữ liệu Task 29.

### Câu 2: Task 30 tái sử dụng mã nguồn nào từ các task trước đó?
- **Trả lời**: `HandoverService` của Task 30 tái sử dụng trực tiếp hàm tính điểm `calculate_sus` từ `UsabilityService` (Task 28) để kiểm tra tính nhất quán của thang đo SUS, đồng thời tái sử dụng `BackupRestoreEngine` (Task 29) để đối soát tệp tin sao lưu đối chiếu mã băm SHA-256.

### Câu 3: Bốn bộ dữ liệu (Datasets) bàn giao cho trung tâm gồm những gì và có cấu trúc thế nào?
- **Trả lời**: Gồm 4 bộ:
  1. `DS-001`: Dữ liệu bán hàng & đơn hàng (50,000 dòng, chuẩn 3NF gồm 4 bảng).
  2. `DS-002`: Dữ liệu nhân sự & hiệu suất (12,000 dòng, chuẩn 3NF).
  3. `DS-003`: Dữ liệu học liệu AI RAG (2,500 chunks + embeddings 384 chiều).
  4. `DS-004`: Dữ liệu sự kiện Clickstream thương mại điện tử (150,000 dòng, mô hình Fact/Dim).
  Tất cả đều có đủ cặp tệp sạch (clean) và bẩn (dirty) cùng từ điển dữ liệu Data Dictionary đi kèm.

### Câu 4: Hai dự án tốt nghiệp Capstone được thiết kế phục vụ đối tượng học viên nào?
- **Trả lời**:
  1. `CAP-001` (Data Analyst): Dự án phân tích doanh thu bán lẻ, bàn giao đề bài, dữ liệu thực hành, đáp án tham khảo và rubric chấm điểm 5 tiêu chí.
  2. `CAP-002` (AI Engineer): Dự án xây dựng RAG & AI Tutor thông minh, bàn giao khung kiểm thử RAG, rubric đo độ chính xác trích dẫn và cam kết tỷ lệ ảo giác dưới 2%.

### Câu 5: Các hạn chế kỹ thuật đã biết được xử lý và khắc phục ra sao?
- **Trả lời**: Em công khai minh bạch 3 hạn chế trong hồ sơ:
  - Giao diện Dark Mode trên trình duyệt cũ: đã có fallback CSS và sẽ nâng cấp ở v1.1.
  - LRU Cache xóa khi khởi động lại container: hệ thống nạp sẵn dữ liệu đệm (warm-up) chỉ mất 1.2 giây.
  - Đọc file Parquet dung lượng lớn: bổ sung API xem trước 10 dòng đầu thay vì tải toàn bộ file.
  Mọi hạn chế đều có phương án giảm thiểu (mitigation) và giải pháp tạm thời (workaround) rõ ràng.
