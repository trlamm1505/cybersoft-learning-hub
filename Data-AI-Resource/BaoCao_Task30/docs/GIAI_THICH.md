# HƯỚNG DẪN GIẢI THÍCH VÀ BÀN GIAO KỸ THUẬT TASK 30 (TECHNICAL HANDOVER CHEATSHEET)
## DỰ ÁN: CYBERSOFT DATA & AI LAB v1.0 (PRODUCTION READY)

**Sản phẩm:** CyberSoft Data & AI Lab v1.0  
**Thực hiện:** Đào Trung Kiên — Data & AI Resource Engineer  
**Thời gian đọc tóm tắt:** 3 - 5 phút  

---

## 1. MỤC TIÊU CỐT LÕI (MỘT CÂU DUY NHẤT)

> **"Nghiệm thu toàn diện 30 ngày thực tập, bàn giao gói sản phẩm Release v1.0 độc lập có thể tự vận hành bởi người khác, đối soát 8 chỉ số kỹ thuật đo đạc thực tế, và công khai minh bạch 3 hạn chế kèm lộ trình phát triển 60 ngày có thứ tự ưu tiên."**

---

## 2. HỆ SINH THÁI TÀI LIỆU & THỨ TỰ ĐỌC TỐI ƯU THEO VAI TRÒ

Toàn bộ gói bàn giao Task 30 được tổ chức chuẩn mực dưới định dạng Markdown, phân tách mục tiêu rõ ràng cho từng đối tượng tiếp nhận:

```text
                                  [ README.md ] (Cổng điều hướng tổng thể)
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
  [ DÀNH CHO KỸ SƯ ]           [ DÀNH CHO GIẢNG VIÊN ]       [ DÀNH CHO BAN QUẢN LÝ ]
  (Technical Maintainer)       (Instructors & TAs)           (Management & Reviewers)
         │                              │                              │
         ├─ technical_handbook.md       ├─ instructor_guide.md         ├─ 30_final_handover_and_demo.md
         ├─ release_v1.0.md             └─ demo_guide.md               ├─ retro_and_roadmap.md
         └─ retro_and_roadmap.md                                       └─ release_v1.0.md
```

### Thứ tự đọc khuyến nghị theo vai trò:
1. **Dành cho Kỹ sư Vận hành / DevOps tiếp quản:**
   - Bước 1: Đọc `README.md` để nắm cấu trúc thư mục và tiêu chí nghiệm thu.
   - Bước 2: Đọc `docs/technical_handbook.md` để nắm kiến trúc 4 tầng, lệnh cài đặt và sổ tay gỡ 5 sự cố.
   - Bước 3: Đọc `docs/release_v1.0.md` để kiểm tra bảng kiểm kê manifest và chữ ký toàn vẹn SHA-256.
   - Bước 4: Đọc `docs/retro_and_roadmap.md` để nắm danh mục hạn chế đã biết (`KNOWN-001` đến `003`) và phương án khắc phục.
2. **Dành cho Giảng viên & Trợ giảng:**
   - Bước 1: Đọc `docs/instructor_guide.md` (3 phút bắt đầu nhanh, cách tải dataset sạch/bẩn, barem điểm Capstone).
   - Bước 2: Đọc `docs/demo_guide.md` (quy trình kiểm tra AI Tutor bằng câu hỏi mới).
3. **Dành cho Ban Quản trị Kỹ thuật & Nghiệm thu:**
   - Bước 1: Đọc `30_final_handover_and_demo.md` để đánh giá toàn diện hành trình 30 ngày.
   - Bước 2: Đọc `docs/retro_and_roadmap.md` để xem bảng đối chiếu số liệu Before/After và lộ trình 60 ngày.
   - Bước 3: Đọc `docs/release_v1.0.md` để ký duyệt biên bản bàn giao phát hành v1.0.0.

---

## 3. 5 CÂU HỎI KỸ THUẬT TRỌNG TÂM KHI BÀN GIAO VÀ ĐỐI SOÁT HỆ THỐNG

### Câu 1: Em hãy chứng minh các số liệu kỹ thuật (SUS 92.5, P95 18.75ms, 100% SHA-256) là số liệu thực tế chứ không phải số liệu giả định?
- **Trả lời:**  
  "Về các số liệu kỹ thuật, toàn bộ 8 chỉ số trong hồ sơ bàn giao được đo lường thực nghiệm trực tiếp qua các task trước đó:
  - Điểm Usability **SUS 92.5/100** và mức giảm thời gian **-62.4%** được ghi nhận từ phiên thử nghiệm đo lường với 5 người dùng độc lập ở Task 28.
  - Độ trễ tìm kiếm lai **P95 đạt 18.75 ms** và thông lượng **340.5 RPS** được xuất ra từ công cụ kiểm thử tải trọng 20 workers đồng thời ở Task 29.
  - Độ toàn vẹn **100% SHA-256** là kết quả đối soát từng byte dữ liệu giữa tệp khôi phục và bản lưu trữ bất biến sau sự cố giả lập ở Task 29. Mọi số liệu đều có nhật ký kiểm thử và tệp log đối soát đi kèm."

### Câu 2: Tại sao phải tách bạch giữa Sổ tay Kỹ thuật (Technical Handbook) và Sổ tay Giảng viên (Instructor Guide)?
- **Trả lời:**  
  "Về sự phân tách tài liệu, đây là nguyên tắc phân quyền và hướng đến trải nghiệm người dùng trong tài liệu kỹ thuật:
  - `Technical Handbook` phục vụ kỹ sư hệ thống, chứa các thông số sâu về kiến trúc 4 tầng, biến môi trường, phân quyền tài khoản phi đặc quyền `appuser:1001`, và quy trình gỡ lỗi sự cố hạ tầng.
  - `Instructor Guide` phục vụ đối tượng nghiệp vụ (giảng viên và học vụ), loại bỏ toàn bộ thuật ngữ lập trình phức tạp, chỉ tập trung vào mô hình '3 phút bắt đầu nhanh': cách tải dataset sạch để phân tích, dataset bẩn để dạy làm sạch dữ liệu, và barem rubric 5 tiêu chí để chấm thi công bằng."

### Câu 3: Bốn bộ dữ liệu chuẩn 3NF được thiết kế nhằm giải quyết bài toán gì trong chương trình học?
- **Trả lời:**  
  "Về mục tiêu thiết kế, 4 bộ dữ liệu giải quyết trọn vẹn lộ trình đào tạo từ cơ bản đến nâng cao:
  - `DS-001` (Bán hàng, 50K dòng, 5 bảng 3NF) phục vụ môn SQL nâng cao và tính toán chỉ số kinh doanh.
  - `DS-002` (Nhân sự, 12K dòng, 4 bảng 3NF) phục vụ môn Trực quan hóa dữ liệu Dashboard Power BI/Tableau.
  - `DS-003` (Quy chế học vụ, 2.5K chunks) phục vụ môn Kỹ thuật AI RAG và Semantic Search.
  - `DS-004` (Clickstream, 150K dòng sự kiện) phục vụ môn Kỹ thuật Xử lý Dữ liệu lớn (Big Data/Parquet).
  Đặc biệt, mỗi bộ đều có cặp tệp Clean/Dirty giúp học viên trải nghiệm bài toán làm sạch dữ liệu sát thực tế doanh nghiệp."

### Câu 4: Cơ chế Grounded AI Tutor giải quyết vấn đề ảo giác (Hallucination) của LLM như thế nào?
- **Trả lời:**  
  "Về kiểm soát ảo giác, AI Tutor áp dụng cơ chế phòng vệ kép (Dual Guardrails):
  1. **Trích nguồn bắt buộc (Mandatory Grounding):** Mô hình chỉ được tổng hợp câu trả lời dựa trên các đoạn văn bản trích xuất từ cơ sở tri thức quy chế thông qua thuật toán tìm kiếm lai Hybrid Search RRF. Mọi câu trả lời bắt buộc phải kèm mã trích dẫn `[doc#sec]`.
  2. **Cơ chế chủ động từ chối (Explicit Refusal):** Nếu độ tương đồng ngữ nghĩa của câu hỏi dưới ngưỡng an toàn hoặc nằm ngoài phạm vi học viện, hệ thống lập tức từ chối trả lời lịch sự thay vì đoán mò. Nhờ đó, tỷ lệ ảo giác được khống chế nghiêm ngặt dưới 2.0%."

### Câu 5: Tại sao em lại công khai các lỗi hạn chế kỹ thuật trong hồ sơ bàn giao? Liệu điều đó có ảnh hưởng đến việc nghiệm thu?
- **Trả lời:**  
  "Về việc công khai khiếm khuyết kỹ thuật, trong kỹ nghệ phần mềm chuyên nghiệp, việc giấu lỗi là rủi ro lớn nhất cho khâu vận hành. Một sản phẩm chất lượng cao không phải là sản phẩm không có lỗi, mà là sản phẩm minh bạch về ranh giới kỹ thuật:
  - Chúng em công khai 3 hạn chế mức Low (`KNOWN-001` đến `003`) kèm giải pháp khắc phục tạm thời khả thi ngay lập tức.
  - Đồng thời, cả 3 hạn chế đều đã được đưa vào Backlog có thứ tự ưu tiên (P0, P1) trong Lộ trình 60 ngày tiếp theo. Đây chính là bằng chứng thể hiện tinh thần làm chủ vận hành (Operational Ownership) và cải tiến liên tục."

---

## 4. TỔNG KẾT 6 NĂNG LỰC NHẬN LẠI (KEY ENGINEERING CAPABILITIES)

Hành trình 30 ngày khép lại không chỉ bàn giao một sản phẩm phần mềm, mà là sự trưởng thành toàn diện về năng lực kỹ sư:

1. **Technical Writing (Viết tài liệu kỹ thuật chuyên nghiệp):**  
   Năng lực chuyển đổi kiến trúc phức tạp thành tài liệu tự phục vụ (Self-service Documentation), phân loại rõ ràng tài liệu cho Kỹ sư và Giảng viên, loại bỏ hoàn toàn lối hành văn cảm tính.
2. **Knowledge Transfer (Chuyển giao tri thức hiệu quả):**  
   Khả năng bàn giao hệ thống để một kỹ sư khác có thể tự cài đặt, vận hành và sửa lỗi chỉ bằng cách đọc tài liệu hướng dẫn mà không cần người tiền nhiệm hướng dẫn miệng.
3. **Operational Ownership (Làm chủ vận hành):**  
   Tư duy chịu trách nhiệm toàn diện từ khâu thiết kế mã nguồn đến đóng gói Docker, phân quyền bảo mật phi đặc quyền `appuser`, giám sát sức khỏe chủ động và cứu hộ thảm họa sau sự cố.
4. **Product Storytelling (Nghệ thuật trình bày sản phẩm):**  
   Khả năng truyền tải giá trị cốt lõi của sản phẩm kỹ thuật qua thuyết minh mạch lạc, kết nối chặt chẽ giữa tính năng công nghệ và hiệu quả kinh doanh/giáo dục thực tế.
5. **Evidence-based Delivery (Bàn giao dựa trên bằng chứng):**  
   Mọi khẳng định chất lượng đều được bảo chứng bằng dữ liệu định lượng: phân vị độ trễ P95, điểm đánh giá trải nghiệm SUS 92.5/100, mã băm mật mã SHA-256 và các bài test tự động.
6. **Continuous Improvement (Tư duy cải tiến liên tục):**  
   Văn hóa không che giấu khiếm khuyết qua Retrospective Start/Stop/Continue, dũng cảm chỉ ra hạn chế kỹ thuật và vạch ra lộ trình 60 ngày khả thi với các mốc hành động cụ thể.
