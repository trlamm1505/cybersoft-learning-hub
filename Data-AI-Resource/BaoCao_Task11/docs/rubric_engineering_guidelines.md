# 📐 Nguyên Tắc Rubric Engineering — Hướng Dẫn Thiết Kế Barem Đánh Giá Định Lượng

## 1. Vấn Đề Của Barem Đánh Giá Truyền Thống
Trong đào tạo kỹ thuật truyền thống, các tiêu chí đánh giá thường mắc phải lỗi **định tính và cảm tính**:
- *"Code viết đẹp, chuẩn phong cách"* $\rightarrow$ Thế nào là "đẹp"? Không có thước đo khách quan.
- *"Biểu đồ hợp lý, trực quan"* $\rightarrow$ Học viên vẽ 2 biểu đồ hay 5 biểu đồ? Chọn loại biểu đồ nào?
- *"Phân tích insight sâu sắc"* $\rightarrow$ Không có tiêu chuẩn đo lường mức độ sâu sắc.

Điều này dẫn đến sự thiếu nhất quán giữa các Mentor khi chấm bài và khiến máy tính (Auto-Judge) hoàn toàn bất khả thi khi thực hiện chấm tự động.

---

## 2. Các Nguyên Tắc "Rubric Engineering" Cốt Lõi Tại CyberSoft

### Nguyên Tắc 1: 100% Tiêu Chí Phải Gắn Với Thước Đo Định Lượng (Quantitative Metrics)
Mỗi tiêu chí trong `rubric.json` bắt buộc phải có trường `quantitative_metric` chứa các con số, ngưỡng phần trăm hoặc chỉ báo có thể kiểm chứng:
- **Thay vì:** *"Làm sạch dữ liệu tốt"*
- **Rubric chuẩn:** *"Loại bỏ chính xác 100% (2/2) bản ghi trùng lặp khóa chính; 100% (5/5) giá trị null tại order_status được quy chuẩn hóa về completed có log giải trình."*
- **Thay vì:** *"Tính đúng doanh thu"*
- **Rubric chuẩn:** *"Doanh thu thuần Net Revenue $388,850.28 và AOV $1,150.44 có sai số tương đối $\le 0.05\%$ so với Ground Truth."*

### Nguyên Tắc 2: Bốn Cấp Độ Đánh Giá Tiêu Chuẩn (Four Scoring Levels)
Mọi tiêu chí phải phân rã thành 4 cấp độ rõ ràng:
1. **Exemplary (100% điểm):** Đáp ứng hoàn hảo yêu cầu kỹ thuật, không sai số, có tài liệu giải trình vượt kỳ vọng.
2. **Proficient (75-80% điểm):** Đạt kết quả chính xác nhưng bỏ qua phương pháp tối ưu (ví dụ: chỉ xóa dòng null thay vì imputation có căn cứ).
3. **Developing (40-50% điểm):** Có thực hiện nhưng sai lệch logic hoặc để sót lỗi (ví dụ: sai số từ 1% đến 5%).
4. **Unsatisfactory (0% điểm):** Bỏ qua yêu cầu hoặc sai số nghiêm trọng phá vỡ tính đúng đắn của dữ liệu (> 10%).

### Nguyên Tắc 3: Phân Bổ Tỷ Trọng Core (70%) và Extension (30%)
- **70 điểm Core (Cơ bản):** Đảm bảo học viên đạt chuẩn đầu ra nghề nghiệp tối thiểu (Làm sạch dữ liệu, tính toán KPI cơ bản, vẽ biểu đồ báo cáo). Học viên hoàn thành trọn vẹn phần này sẽ đạt điểm Khá (7.0/10).
- **30 điểm Extension (Nâng cao):** Dành cho học viên xuất sắc muốn khẳng định năng lực chuyên sâu (Phân khúc RFM, Phân tích giỏ hàng, Dự báo chuỗi thời gian, Tối ưu thuật toán).
