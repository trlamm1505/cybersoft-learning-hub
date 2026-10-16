# HƯỚNG DẪN BẢO VỆ NHANH — TASK 28
## ĐO LƯỜNG VỚI NGƯỜI DÙNG THỬ & 5 BẢN VÁ ƯU TIÊN

### 1. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (FLOW TỔNG QUAN)
```text
[5 Người dùng thử nội bộ] ─── (Giảng viên, Mentor, Học viên DA/AI)
       │
       ▼
[25 Tác vụ thử nghiệm] ────── Thực hiện 5 tác vụ cốt lõi (tìm dataset, lọc capstone, copy citation...)
       │
       ▼
[Thu thập dữ liệu thô] ────── Ghi nhận Time-to-find (giây), Task Success và 10 câu trả lời SUS
       │
       ▼
[UsabilityService] ────────── Tính điểm SUS chuẩn Brookes 1996, % giảm thời gian và phân loại lỗi
       │
       ▼
[Phân loại Impact/Effort] ─── Lập Backlog 10 vấn đề, cô lập 5 vấn đề nghiêm trọng (Critical/High)
       │
       ▼
[5 Bản vá ưu tiên] ────────── Triển khai vá lỗi ngay: Reset filter, Table scroll, 1-click citation,
                             Việt hóa lỗi Pydantic, Hiển thị dung lượng file tải trước.
```

---

### 2. THỨ TỰ ĐỌC FILE KHI GIẢI THÍCH (3-5 PHÚT)
1. **`data/user_sessions.json`** (Đọc đầu tiên): Xem cấu trúc mẫu dữ liệu phiên thử nghiệm (N=5 người, 25 tác vụ, 10 câu hỏi thang đo Likert).
2. **`src/services/usability_service.py`** (Đọc thứ hai): Trọng tâm kỹ thuật gồm 3 khối hàm:
   - `calculate_sus` & `grade_sus`: Công thức tính điểm SUS chuẩn hóa và phân hạng chữ cái (A/B/C/F).
   - `get_summary`: Tính toán thời gian trung bình, mức giảm % và tỉ lệ hoàn thành nhiệm vụ từ dữ liệu thực tế.
   - Các hàm tiện ích bản vá: `localize_pydantic_error` (dịch lỗi tiếng Anh sang tiếng Việt), `format_citation_copy_tag` (tạo citation 1-click), `format_download_header_size`.
3. **`data/issue_backlog.json` & `data/resolved_fixes.json`** (Đọc thứ ba): Bảng xếp hạng mức độ ưu tiên lỗi (Impact/Effort) và 5 bản vá đã kiểm chứng.
4. **`src/routes/usability.py`** (Đọc thứ tư): Các API phục vụ dashboard hiển thị số liệu và công cụ hỗ trợ.
5. **`tests/test_usability_metrics.py` & `test_priority_fixes.py`** (Đọc cuối cùng): Bằng chứng kiểm thử tự động xác nhận công thức toán học và hoạt động của 5 bản vá.

---

### 3. 5 CÂU HỎI BẢO VỆ THƯỜNG GẶP VÀ CÂU TRẢ LỜI NGẮN

#### Câu 1: Tại sao cỡ mẫu chỉ có N = 5 người? Con số này có giá trị thống kê không?
> **Trả lời**: Theo nghiên cứu kinh điển của Nielsen & Landauer (1993) và Nielsen Norman Group, 5 người dùng thử là điểm tối ưu về hiệu quả chi phí trong kiểm thử định tính, giúp phát hiện khoảng 85% các vấn đề về khả năng sử dụng (usability issues). Với chu kỳ lặp nội bộ ngắn của Task 28, N = 5 là phù hợp và hệ thống đã ghi rõ cảnh báo `is_small_sample = True` trên báo cáo.

#### Câu 2: Công thức tính điểm SUS (System Usability Scale) hoạt động như thế nào?
> **Trả lời**: Thang đo SUS gồm 10 câu hỏi theo thang Likert 1-5:
> - Với các câu hỏi lẻ (1, 3, 5, 7, 9): Điểm đóng góp = `Câu trả lời - 1`.
> - Với các câu hỏi chẵn (2, 4, 6, 8, 10): Điểm đóng góp = `5 - Câu trả lời`.
> - Tổng điểm của 10 câu được nhân với hệ số `2.5` để quy về thang điểm 0 - 100. Điểm trung bình đạt 92.5/100 (Hạng A — Excellent).

#### Câu 3: Kể tên 5 bản vá ưu tiên và giải thích tại sao chúng quan trọng?
> **Trả lời**: 5 bản vá tương ứng với 5 vấn đề Critical/High:
> 1. **ISS-001**: Nút reset bộ lọc kết hợp đa tiêu chí (tránh người dùng bị kẹt kết quả trống).
> 2. **ISS-002**: Khung cuộn ngang (`overflow-x: auto`) cho bảng dữ liệu rộng nhiều cột.
> 3. **ISS-003**: Nút 1-click copy trích dẫn chuẩn `[Document#Section]` dán ngay vào giáo án.
> 4. **ISS-004**: Bộ chuyển ngữ lỗi Pydantic kỹ thuật tiếng Anh sang tiếng Việt có hướng dẫn sửa.
> 5. **ISS-005**: Hiển thị kích thước file (KB, MB) trước khi tải để người dùng chủ động đường truyền.

#### Câu 4: Số liệu thời gian tra cứu (time-to-find) được cải thiện bao nhiêu % sau khi vá?
> **Trả lời**: Thời gian hoàn thành tác vụ trung bình giảm từ **45.9 giây** xuống còn **17.3 giây**, tức giảm **62.4%**. Tỉ lệ hoàn thành nhiệm vụ (task success rate) tăng từ **80.0%** (20/25 tác vụ) lên **100%** (25/25 tác vụ).

#### Câu 5: Task 28 tái sử dụng thành phần nào từ các task trước?
> **Trả lời**: Bản vá 4 tái sử dụng trực tiếp các mô hình schema Pydantic từ Task 21 và Task 26 để bắt ngoại lệ validation; bản vá 3 tái sử dụng cấu trúc trích dẫn chunk văn bản từ hệ thống RAG Task 18-20.
