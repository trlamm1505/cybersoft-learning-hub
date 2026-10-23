# ĐẶC TẢ CÁC CHỐT CHẶN BẢO VỆ DỮ LIỆU (QUALITY GUARDRAILS SPECIFICATION)

**Tài liệu**: Quy chuẩn kỹ thuật các bộ lọc Guardrail trong Data Quality Harness  
**Dự án**: CyberSoft Data & AI Lab — Task 09  

---

## 1. Danh mục Quy tắc Guardrails

Hệ thống Data Quality Harness thực thi 7 chốt chặn bảo vệ độc lập:

| Mã Rule | Nhóm Guardrail | Mức độ nghiêm trọng | Mô tả kiểm tra | Hành vi khi vi phạm |
| :--- | :--- | :---: | :--- | :--- |
| `GR-01-SCHEMA` | Schema Conformance | CRITICAL | Cấu trúc JSON phải tuân thủ nghiêm ngặt `CS-SCHEMA-SYNTHETIC-LEARN-V1`. | Từ chối bản ghi, báo lỗi chi tiết đường dẫn trường. |
| `GR-02-RUBRIC-SUM` | Arithmetic Invariant | CRITICAL | Tổng trọng số các tiêu chí trong `rubric_criteria` phải bằng đúng 100%. | Yêu cầu điều chỉnh lại trọng số trong vòng lặp. |
| `GR-03-SCORE-STATUS` | Business Logic | CRITICAL | Điểm số `score` phải tương thích chặt chẽ với `execution_status`. | Báo lỗi không nhất quán logic đánh giá học tập. |
| `GR-04-ANTI-LEAK` | Anti-Leakage / Quality | CRITICAL | Không được chứa các placeholder: `[TODO]`, `[LEAK]`, `undefined`, `NaN`, `null`, `Lorem ipsum`. | Hủy bản ghi, yêu cầu sinh nội dung thật. |
| `GR-05-MIN-LENGTH` | Non-Triviality | WARNING | `problem_statement` $\ge 50$ ký tự; `mentor_feedback` $\ge 40$ ký tự. | Cảnh báo nội dung quá ngắn, yêu cầu mở rộng bối cảnh. |
| `GR-06-TRACK-ENUM` | Domain Boundary | CRITICAL | Chuyên ngành học vụ phải thuộc đúng 5 chuyên ngành CyberSoft đã định nghĩa. | Ép buộc chọn đúng một trong 5 chuyên ngành chuẩn. |
| `GR-07-CHECKSUM` | Data Integrity | CRITICAL | Mã băm SHA-256 phải khớp chính xác với nội dung tuần tự hóa của bản ghi. | Cảnh báo sai lệch chữ ký toàn vẹn dữ liệu. |

---

## 2. Chi tiết Ràng buộc Logic Điểm số (`GR-03-SCORE-STATUS`)

Hệ thống kiểm định tự động áp dụng ma trận phân vùng điểm nhằm phản ánh trung thực kết quả làm bài của học viên:

1. **Trạng thái `PASSED`**:
   - Tất cả test cases trên môi trường chạy thử đều đạt kết quả mong đợi.
   - Điểm số hợp lệ: $70 \le \text{score} \le 100$.
2. **Trạng thái `FAILED_TESTS`**:
   - Mã nguồn chạy thành công nhưng sai kết quả logic hoặc thiếu trường hợp biên.
   - Điểm số hợp lệ: $30 \le \text{score} \le 69$.
3. **Trạng thái `SYNTAX_ERROR` hoặc `TIMEOUT`**:
   - Mã nguồn không thể biên dịch/thực thi hoặc rơi vào vòng lặp vô hạn.
   - Điểm số hợp lệ: $0 \le \text{score} \le 29$.
