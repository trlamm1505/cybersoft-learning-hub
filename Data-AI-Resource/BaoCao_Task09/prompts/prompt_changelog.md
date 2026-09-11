# PROMPT VERSIONING & CHANGELOG

**Tài liệu**: Quản lý lịch sử tiến hóa Prompt cho Pipeline sinh dữ liệu có kiểm soát bằng AI  
**Dự án**: CyberSoft Data & AI Lab — Task 09  

---

## 1. So sánh Tổng quan giữa các Phiên bản

| Tiêu chí | Bản v1.0.0 (`v1_zero_shot.json`) | Bản v2.1.0 (`v2_few_shot_constrained.json`) |
| :--- | :--- | :--- |
| **Kỹ thuật Prompt** | Zero-Shot mở, không cung cấp cấu trúc mẫu JSON cụ thể. | Few-Shot ràng buộc, có mẫu record thực tế và bảng bất biến số học. |
| **Kiểm soát Rubric Sum** | Không có (AI tự do chọn số, tỉ lệ lệch 100% là 34%). | Ép buộc tường minh: Tổng trọng số các tiêu chí phải đúng 100%. |
| **Tương quan Status - Score** | Không quy định (AI thường cho điểm cao dù status `FAILED_TESTS`). | Bảng quy tắc phân đoạn điểm số tương ứng chặt chẽ với trạng thái thực thi. |
| **Bẫy Placeholder / Leakage** | Thường xuất hiện `[TODO]`, `...`, chuỗi rỗng. | Rào chắn cấm hoàn toàn ký tự giả lập, bắt buộc sinh mã nguồn và nhận xét đầy đủ. |
| **Tỷ lệ vượt qua vòng 1 Harness** | 42.0% (58% phải tự sửa lỗi hoặc fallback). | 96.0% (chỉ 4% cần tinh chỉnh nhẹ ở iteration 1, 0% fallback). |

---

## 2. Chi tiết Thay đổi qua các Lần Tinh chỉnh

### Phiên bản 1.0.0 (2026-09-11 08:00)
* **Khởi tạo**: Xây dựng template prompt cơ bản gửi yêu cầu sinh record học tập cho AI.
* **Vấn đề phát sinh**: 
  - Mô hình thường gán các trọng số ngẫu nhiên: 30%, 40%, 40% (tổng 110%) hoặc 25%, 25%, 25% (tổng 75%).
  - Trường `submission_code` bị rút gọn thành một dòng comment sơ sài.
  - Tỷ lệ vi phạm schema và business rules của Data Quality Harness lên đến 58%.

### Phiên bản 2.0.0 (2026-09-11 08:30)
* **Cải tiến**:
  - Bổ sung định dạng JSON mẫu đầy đủ (Few-Shot exemplar).
  - Khai báo rõ ràng quy tắc toán học: $\sum weight\_percent = 100$.
  - Bổ sung dải điểm hợp lệ cho từng `execution_status`.
* **Kết quả**: Tỷ lệ hợp lệ ngay vòng đầu tiên tăng từ 42% lên 88%.

### Phiên bản 2.1.0 (2026-09-11 08:50) — Bản Production
* **Cải tiến**:
  - Tích hợp bộ quy tắc Anti-Placeholder Guardrail.
  - Thiết kế cấu trúc `invariants` để Data Quality Harness dùng chung cấu hình với Prompt.
  - Chuẩn hóa seed anchoring: gắn chặt seed vào từng biến thể sinh để bảo đảm tính tất định.
* **Kết quả**: Tỷ lệ Pass vòng 1 đạt 96%, các trường hợp còn lại được Harness tự động sửa lỗi thành công ở iteration 1, đạt tỷ lệ hoàn thành 100% không cần kích hoạt fallback khẩn cấp.
