# AI WORK LOG - NGÀY 01: XÁC ĐỊNH BÀI TOÁN VÀ NGƯỜI DÙNG

**Dự án**: CyberSoft Data & AI Lab  
**Thực tập sinh**: Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-08-28  
**Task ID**: `#DAY-01-DISCOVERY`  

---

## 1. Bài toán và Giả định trước khi gọi AI (Pre-AI Baseline)

### Giả định & Yêu cầu ban đầu
* **Mục tiêu**: Xây dựng kho tài nguyên dữ liệu và hệ thống AI có khả năng đo lường chất lượng, phục vụ 2 chuyên ngành đào tạo: **Data Analyst** và **AI Engineer** tại CyberSoft Academy.
* **Nhu cầu giả định**: Giảng viên DA thiếu dataset thực tế có bản Dirty/Clean chuẩn quan hệ; giảng viên tốn nhiều thời gian chấm đồ án thủ công do thiếu Rubric 100 điểm chi tiết; học viên AI thiếu Corpus chuẩn và công cụ đo lường định lượng lỗi bịa thông tin (*hallucination*) của RAG.
* **Phạm vi ban đầu**: Cần liệt kê tối thiểu 15 nhu cầu tài nguyên, phân nhóm theo 4 nhóm người dùng mục tiêu, chấm điểm ưu tiên Impact/Effort (thang 1-5) và khoanh vùng phạm vi MVP trong 30 ngày.

### Rủi ro dự kiến
* AI có thể đề xuất các tính năng mang tính lý thuyết, quá rộng hoặc vượt quá năng lực của nhóm 3 người trong chu kỳ 30 ngày.
* AI có thể đánh giá thấp độ phức tạp (underestimate Effort) của việc làm sạch dữ liệu bẩn và xây dựng bộ 100 câu hỏi Ground Truth.
* Rủi ro vi phạm nguyên tắc **Human-in-the-loop** nếu để AI tự động chấm bài hoặc tạo nội dung mà không có bước duyệt của giảng viên.

---

## 2. Nhật ký Tương tác AI (AI Interaction Log)

* **Công cụ / Model**: Google Antigravity & ChatGPT (Model: Gemini 3.6 - 3.7 Flash / GPT-4o).
* **Mục tiêu tương tác**: Brainstorm 15 Nhu cầu tài nguyên chi tiết, xây dựng ma trận đánh giá Impact/Effort và thiết lập chỉ số thành công định lượng.

### Context & Prompt chính đã sử dụng:
```text
Bạn là Data & AI Resource Engineer tại CyberSoft Academy. 
Bối cảnh: Trung tâm đào tạo 2 chuyên ngành Data Analyst (SQL, PowerBI, Data Cleaning) và AI Engineer (NLP, RAG, Eval Harness).
Hãy thực hiện các yêu cầu sau theo đúng chuẩn kỹ thuật và quản trị:
1. Xác định 4 Nhóm người dùng mục tiêu (Mentor DA, Mentor AI, Learners DA/AI, Ban Quản lý/QA) kèm Pain Points cụ thể.
2. Thiết lập Resource Backlog gồm 15 items phân loại theo: Dataset, Bài tập, Dashboard, RAG, Chấm bài, Project.
3. Đánh giá Impact/Effort (thang 1-5) cho toàn bộ 15 Reqs và chọn ra phạm vi MVP 30 ngày (chia 3 nhóm: Quick Wins, Core MVP, Post-MVP).
4. Xác định các chỉ số thành công (Success Metrics) có thể đo lường định lượng (Data Quality, RAG Citation/Abstention, Operational value).
```

---

## 3. Thẩm định và Quyết định của Con người (Human Evaluation & Decisions)

| Đề xuất ban đầu của AI | Vấn đề / Rủi ro phát hiện được | Quyết định & Chỉnh sửa của Con người |
| :--- | :--- | :--- |
| **Đề xuất tính năng AI Auto-grading**: AI tự động chấm điểm và đánh giá toàn bộ đồ án/bài tập của học viên từ Tuần 2. | Vi phạm nghiêm trọng nguyên tắc **Human-in-the-loop**. AI dễ bị bias/hallucination, có thể chấm sai gây ảnh hưởng trực tiếp đến kết quả học tập của học viên. | **LOẠI BỎ KHỎI MVP**. Chỉ xây dựng bộ Rubric 100 điểm và barem đáp án chuẩn để hỗ trợ giảng viên chấm nhanh hơn $\ge 50\%$, quyền quyết định điểm số thuộc về con người. |
| **Đề xuất tính năng AI Exercise Generator (REQ-14)** vào Tuần 2 MVP. | Quá sớm khi chưa xây dựng xong schema dữ liệu và ngân hàng bài tập gốc chuẩn. | **DỜI SANG POST-MVP (Tuần 5)**, chỉ kích hoạt khi có cơ chế guardrail và phê duyệt của giảng viên. |
| **Đánh giá Effort cho RAG Eval Harness và Data Quality Harness chỉ ở mức 1–2**. | Đánh giá quá lạc quan, chưa tính đến công sức xây dựng bộ 100 câu Ground Truth và xử lý các ca biên (*edge cases*). | **ĐIỀU CHỈNH EFFORT LÊN MỨC 3–4** để phản ánh đúng thực tế kỹ thuật. |
| **Chỉ số đo lường thành công định tính**: "Tăng độ hài lòng học viên", "RAG trả lời thông minh". | Không thể kiểm thử và nghiệm thu tự động bằng mã nguồn/script. | **ĐỊNH LƯỢNG HÓA CHỈ SỐ**: Citation Accuracy $\ge 85\%$, Abstention Rate $\ge 90\%$, Tra cứu tài nguyên $< 60$ giây, Setup máy sạch $< 10$ phút. |

---

## 4. Kiểm chứng Độc lập (Independent Verification)

Con người không nghiệm thu bằng cảm tính mà thực thi script kiểm thử tự động `validate_day01.py` để verify cấu trúc và tính toàn vẹn của file `01_problem_map.md`.

### Lệnh chạy kiểm thử:
```powershell
python Data-AI-Resource/BaoCao_Task01/scripts/validate_day01.py
```

### Kết quả chạy thực tế:
```text
==================================================
CYBERSOFT DATA & AI LAB - DAY 01 VALIDATION HARNESS
==================================================
[PASS] Target file exists: .../01_problem_map.md
[PASS] Problem Statement section detected
[PASS] User Personas section detected (Count: 4 >= 3)
[PASS] Backlog Table detected with 15 valid rows (Required: 15)
[PASS] Impact/Effort Matrix section detected with 15 items
[PASS] MVP Scope section detected (3-tier priority)
[PASS] Success Metrics section detected
--------------------------------------------------
SUCCESS: All Day 01 DoD requirements passed!
==================================================
```

---

## 5. Bốn Tầng Năng lực AI đã thể hiện (AI Competence Tiers)

* **Tầng 1 - Hiểu việc**: Tự viết Problem Statement, xác định 4 personas, liệt kê pain points thực tế trước khi dùng AI.
* **Tầng 2 - Điều phối AI**: Giao prompt phân vai, ép schema bảng 5 cột chuẩn, chia nhỏ quy trình brainstorm theo từng nhóm phân loại.
* **Tầng 3 - Thẩm định**: Phát hiện các lỗi sai về Effort của AI, lọc bỏ tính năng auto-grading không an toàn, siết chặt các chỉ số đo lường.
* **Tầng 4 - Làm chủ**: Xây dựng harness test tự động, giải thích được mọi trade-off trong ma trận Impact/Effort, sẵn sàng cho buổi defense trực tiếp.
