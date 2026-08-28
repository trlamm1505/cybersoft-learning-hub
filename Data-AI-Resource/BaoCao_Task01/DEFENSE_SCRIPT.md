# KỊCH BẢN BẢO VỆ 3 PHÚT (DEFENSE PRESENTATION - DAY 01)

**Dự án**: CyberSoft Data & AI Lab  
**Người trình bày**: Thực tập sinh Data & AI Resource Engineer  
**Nội dung**: Bảo vệ Bản đồ bài toán, Resource Backlog 15 Reqs và Phạm vi MVP 30 Ngày  

---

## ⏱️ Cấu trúc Trình bày 3 Phút

### Phút 1: Tuyên bố Bài toán & 4 Nhóm Người dùng (Problem & Personas)
> "Kính thưa Quản lý và Giảng viên, sau khi khảo sát thực tế các khóa đào tạo Data Analyst và AI Engineer tại CyberSoft, em nhận thấy 3 nút thắt lớn nhất:
> 1. Học viên DA thiếu các dataset thực tế đa bảng có sẵn cặp Clean/Dirty để rèn luyện kỹ năng xử lý dữ liệu bẩn.
> 2. Giảng viên tốn hàng chục giờ chấm đồ án thủ công do thiếu Project Bank chuẩn hóa kèm Rubric 100 điểm chi tiết.
> 3. Khóa AI Engineer thiếu Corpus chuẩn và công cụ đo lường định lượng lỗi hallucination của RAG.
> 
> Từ đó, em đã quy hoạch bản đồ bài toán phục vụ **4 nhóm đối tượng chính**: Mentor DA, Mentor AI, Học viên DA/AI và Đội ngũ QA."

---

### Phút 2: Làm chủ AI & Thẩm định Kỹ thuật (AI Mastery & Trade-offs)
> "Trong quá trình làm việc, em sử dụng Google Antigravity / AI để tăng tốc quy trình lập danh mục 15 nhu cầu tài nguyên. Tuy nhiên, em giữ vai trò thẩm định độc lập và đã đưa ra **3 quyết định can thiệp kỹ thuật quan trọng**:
> 1. **Loại bỏ đề xuất AI Auto-grading**: AI ban đầu gợi ý để chatbot tự chấm điểm học viên. Em đã loại bỏ vì vi phạm nguyên tắc *Human-in-the-loop* và tiềm ẩn rủi ro chấm sai. Quyền quyết định điểm số phải thuộc về Giảng viên thông qua Rubric 100 điểm.
> 2. **Dời tính năng AI Exercise Generator sang Post-MVP (Tuần 5)**: Tập trung toàn lực Tuần 1-4 cho 3 dataset chuẩn, 3 capstone và bộ RAG Tutor có trích nguồn.
> 3. **Định lượng hóa toàn bộ Success Metrics**: Thay vì các chỉ tiêu cảm tính, em đưa ra các số đo cụ thể: Citation Precision $\ge 85\%$, Abstain Recall $\ge 90\%$, tra cứu tài nguyên $< 60$s."

---

### Phút 3: Bằng chứng Nghiệm thu & Kế hoạch Ngày tiếp theo (DoD & Next Steps)
> "Về mặt kiểm chứng độc lập, em đã viết script Python `validate_day01.py` để tự động hóa toàn bộ việc kiểm tra tiêu chí DoD của Ngày 01. Kết quả chạy thực tế: **100% tiêu chí ĐẠT CHUẨN**.
> 
> Toàn bộ tài nguyên đã được lưu trữ minh bạch tại thư mục `Data-AI-Resource/BaoCao_Task01/`. Em xin phép kết thúc phần trình bày Ngày 01 và sẵn sàng tiếp nhận các câu hỏi phản biện hoặc live change để chuyển sang **Ngày 02: Thiết kế Kiến trúc tổng thể và viết ADR-001**."

---

## 🎯 Danh sách Câu hỏi Phản biện Dự phòng (Anticipated Q&A)

* **Q1: Vì sao chọn REQ-01, REQ-03, REQ-07, REQ-09, REQ-12 làm Top 5 cốt lõi?**
  * *Trả lời*: Vì 5 hạng mục này bao phủ toàn bộ chu trình đào tạo: từ dữ liệu đầu vào (REQ-01), công cụ kiểm định (REQ-12), đánh giá đầu ra đồ án (REQ-03), đến tri thức chuẩn và giải đáp thắc mắc RAG (REQ-07, REQ-09).
* **Q2: Nếu giảm thời gian dự án xuống 20 ngày thì bạn sẽ cắt giảm những gì?**
  * *Trả lời*: Sẽ giữ nguyên 3 dataset và CLI `validate_data`, tạm dời giao diện web Resource Portal sang giai đoạn sau và cung cấp tài nguyên qua cấu trúc thư mục/Git CLI chuẩn.
