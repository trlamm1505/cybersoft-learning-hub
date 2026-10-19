# BÁO CÁO KỸ THUẬT CHUYÊN SÂU — NGÀY 30
## TỔNG KẾT TOÀN DIỆN, HỒ SƠ BÀN GIAO SẢN PHẨM (RELEASE v1.0) & BẢO VỆ ĐỒ ÁN TỐT NGHIỆP

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: **NGÀY 30 — Tài liệu, demo và bàn giao cuối kỳ (Documentation, Demo & Final Handover)** (`cybersoft-final-handover`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: **2026-10-15**  

---

## 1. BỐI CẢNH KỸ THUẬT, TỔNG KẾT HÀNH TRÌNH 30 NGÀY & MỤC TIÊU BÀN GIAO

### 1.1. Bối cảnh kỹ thuật tại Ngày 30
Trải qua 29 ngày làm việc liên tục theo nguyên tắc *"Mỗi ngày một sản phẩm có thể kiểm chứng"* (Daily Deliverable with Evidence), vai trò **Data & AI Resource Engineer** đã lần lượt kiến tạo và sản phẩm hóa các thành phần cốt lõi của hệ sinh thái **CyberSoft Data & AI Lab v1.0**:
- **Chặng 1: Nền tảng Dữ liệu & Mô hình hóa (Ngày 1 - Ngày 10)**: Chuẩn hóa 4 bộ dataset doanh nghiệp chuẩn 3NF (Retail, HR, RAG, E-Commerce Clickstream), xây dựng Data Quality Harness và cổng Dataset Registry.
- **Chặng 2: Ngân hàng Bài tập & Đồ án Tốt nghiệp (Ngày 11 - Ngày 15)**: Thiết kế 2 dự án Capstone lớn (Data Analyst & AI Engineer) kèm rubric chấm điểm 5 tiêu chí và đáp án tham khảo cho giảng viên.
- **Chặng 3: Động cơ AI RAG & Tìm kiếm Ngữ nghĩa (Ngày 16 - Ngày 20)**: Phát triển Hybrid Search RRF kết hợp BM25 và Dense Vector, trợ giảng Grounded AI Tutor có trích dẫn chuẩn hóa `[doc#sec]` và cơ chế từ chối câu hỏi ngoài luồng (Hallucination < 2%).
- **Chặng 4: Tích hợp Hệ thống & Quản trị Dữ liệu Bất biến (Ngày 21 - Ngày 25)**: Thiết lập API v1.0 chuẩn hóa, giao diện Resource Portal, cơ chế truy vết nguồn gốc dữ liệu WORM đối soát mã băm SHA-256.
- **Chặng 5: Thẩm định Trải nghiệm & Đóng gói Vận hành (Ngày 26 - Ngày 29)**: Thử nghiệm đo lường với 5 người dùng (SUS 92.5/100, giảm 62.4% thời gian tìm kiếm), khắc phục Top 5 vấn đề ưu tiên, tối ưu bộ nhớ đệm hai tầng (Cache Hit 88.5%), đóng gói Docker Multi-Stage an toàn (< 200MB, non-root user 1001).

Bước sang **Ngày 30 — Ngày đích cuối cùng**, trọng tâm chuyển sang: **Hợp nhất toàn bộ hồ sơ kỹ thuật, xây dựng sổ tay vận hành độc lập (để người khác có thể vận hành mà không cần tác giả), chuẩn bị quy trình thuyết trình 15 phút, đúc kết Retrospective và công bố Lộ trình phát triển 60 ngày tiếp theo**.

---

## 2. BẢNG KIỂM ĐỊNH CAM KẾT CHỈ SỐ KỸ THUẬT (SLA BENCHMARKS)

| Hạng Mục Kỹ Thuật | Ngưỡng Cam Kết Học Viện (SLA) | Kết Quả Thực Tế Đạt Được | Trạng Thái Nghiệm Thu |
| :--- | :--- | :--- | :--- |
| **Độ trễ Tìm kiếm lai P95** | $\le 25.0\text{ ms}$ | **18.75 ms** (Vượt chuẩn +25.0%) |  **PASSED** |
| **Độ trễ Trợ giảng AI Tutor P95** | $\le 1500.0\text{ ms}$ | **28.10 ms** (Nhanh gấp ~50 lần) |  **PASSED** |
| **Tỷ lệ ảo giác (Hallucination)** | $\le 2.0\%$ | **< 1.8%** (Trích nguồn `[doc#sec]`) |  **PASSED** |
| **Năng lực xử lý tải (Throughput)** | $\ge 300.0\text{ RPS}$ | **340.5 RPS** (20 workers đồng thời, 0% lỗi) |  **PASSED** |
| **Tỷ lệ trúng bộ nhớ đệm (LRU)** | $\ge 80.0\%$ | **88.5%** (Giảm -82.4% độ trễ truy vấn) |  **PASSED** |
| **Điểm Usability người dùng (SUS)** | $\ge 85.0\text{ điểm}$ | **92.5 / 100** (Hạng A — Excellent) |  **PASSED** |
| **Giảm thời gian tìm kiếm** | $\ge 50.0\%$ | **-62.4%** (Từ 45.9s xuống 17.3s) |  **PASSED** |
| **Tỷ lệ hoàn thành tác vụ** | $\ge 95.0\%$ | **100.0%** (25/25 tác vụ kiểm thử thành công) |  **PASSED** |
| **Khôi phục thảm họa (Disaster Recovery)** | 100% khớp SHA-256 | **100.0%** (Khớp toàn vẹn từng byte dữ liệu) |  **PASSED** |

---

## 3. DANH MỤC HIỆN VẬT BÀN GIAO SẢN PHẨM (FINAL DELIVERABLES)

Toàn bộ gói bàn giao được tổ chức chuẩn hóa trong thư mục `BaoCao_Task30/` gồm:

1. **Hồ sơ kỹ thuật & Hướng dẫn sử dụng (Bộ 6 tài liệu docs/)**:
   - `docs/technical_handbook.md`: Sổ tay kiến trúc 4 tầng, setup, quản trị bảo mật và quy trình gỡ 5 sự cố thực tế.
   - `docs/instructor_guide.md`: Hướng dẫn nhanh 3 phút dành cho Giảng viên & Trợ giảng (datasets sạch/bẩn, rubric 5 tiêu chí Capstone).
   - `docs/release_v1.0.md`: Hồ sơ phát hành Release v1.0.0, bảng kiểm kê tài sản (manifest), SLA và Quality Gates.
   - `docs/retro_and_roadmap.md`: Báo cáo Retrospective Start/Stop/Continue, số liệu Before/After, 3 hạn chế đã biết và lộ trình 60 ngày.
   - `docs/demo_guide.md`: Hướng dẫn quy trình thuyết trình 15 phút bằng dữ liệu động sinh mới không hard-code.
   - `docs/GIAI_THICH.md`: Sơ đồ tư duy, thứ tự đọc file theo vai trò và bộ 5 câu hỏi bảo vệ đồ án tốt nghiệp.
2. **Tài liệu tổng quan & Nhật ký điều hành**:
   - `README.md`: Cổng điều hướng tổng thể hồ sơ bàn giao và ma trận đối chiếu 6 tiêu chí nghiệm thu DoD.
   - `AI_WORKLOG.md`: Nhật ký phối hợp và thẩm định AI 3 cột chuẩn CyberSoft, ghi nhận toàn bộ quyết định tinh gọn hệ thống.

---

## 4. TÍNH MINH BẠCH VẬN HÀNH: DANH MỤC HẠN CHẾ ĐÃ BIẾT (KNOWN ISSUES)

Tuân thủ nghiêm ngặt nguyên tắc nghiệm thu: *"Tuyệt đối không che giấu lỗi, cung cấp sẵn giải pháp khắc phục tạm thời cho người vận hành"*:

1. **Hạn chế KNOWN-001 (Mức Low)**: Bộ nhớ đệm LRU Query Cache xóa toàn bộ bộ nhớ khi restart container Docker.
   - *Cách khắc phục tạm thời:* Tích hợp quy trình nạp trước (pre-warming) 50 câu hỏi quy chế phổ biến trong 1.2s khi khởi động.
   - *Kế hoạch khắc phục:* Chuyển sang cụm Redis phân tán độc lập theo Lộ trình Tháng 1 (`TICKET-842`).
2. **Hạn chế KNOWN-002 (Mức Low)**: Ngưỡng tải trọng tối đa tại 340.5 RPS trên máy chủ đơn lẻ (Single Node).
   - *Cách khắc phục tạm thời:* Phân phối tải trọng qua Nginx Reverse Proxy với thuật toán Round-Robin.
   - *Kế hoạch khắc phục:* Triển khai cụm Kubernetes HPA tự động mở rộng pod khi CPU > 70% (`TICKET-845`).
3. **Hạn chế KNOWN-003 (Mức Low)**: Tải tệp Parquet dung lượng lớn (> 500MB) mất từ 3-5s nạp schema trên máy tính cấu hình thấp.
   - *Cách khắc phục tạm thời:* Cung cấp endpoint xem trước 10 dòng đầu (`/api/datasets/preview`) mà không cần tải toàn bộ tệp.
   - *Kế hoạch khắc phục:* Tích hợp thư viện stream phân đoạn tệp tin (Apache Arrow Flight) trong Sprint tiếp theo (`TICKET-849`).

---

## 5. PHÂN TÍCH CHUYÊN SÂU 6 NĂNG LỰC NHẬN LẠI (KEY ENGINEERING COMPETENCIES)

Hành trình 30 ngày khép lại không đơn thuần là việc hoàn thành các dòng mã lệnh, mà là sự chuyển biến vượt bậc về tư duy và năng lực của một Kỹ sư Dữ liệu & AI chuyên nghiệp:

### 5.1. Technical Writing (Kỹ năng viết tài liệu kỹ thuật chuyên nghiệp)
- **Tư duy cũ:** Viết tài liệu như một bản tóm tắt qua loa sau khi đã viết xong code, dồn mọi thứ vào một file duy nhất khiến người đọc bị ngợp.
- **Năng lực đạt được:** Biết cách cấu trúc hóa tài liệu theo mô hình tự phục vụ (Self-service). Tách bạch tài liệu theo đối tượng tiếp nhận (Technical Handbook cho Kỹ sư và Quick Guide cho Giảng viên). Sử dụng các bảng biểu, sơ đồ kiến trúc và danh mục sự cố có hướng dẫn xử lý từng bước (Troubleshooting), giúp người tiếp quản có thể vận hành hệ thống ngay lập tức mà không cần tác giả bên cạnh.

### 5.2. Knowledge Transfer (Chuyển giao tri thức hiệu quả)
- **Tư duy cũ:** Giữ "bí kíp" trong đầu, khi ai hỏi thì mới trả lời miệng từng phần, dẫn đến việc chuyển giao bị đứt gãy khi nhân sự thay đổi.
- **Năng lực đạt được:** Đạt tiêu chuẩn nghiệm thu "Một người khác làm theo chạy được". Toàn bộ quy trình cài đặt, cấu hình biến môi trường `.env`, phân quyền tài khoản phi đặc quyền `appuser`, và các tập lệnh kiểm thử đều được văn bản hóa chính xác 100%, bảo đảm tri thức dự án được lưu trữ và nhân rộng bền vững tại học viện CyberSoft.

### 5.3. Operational Ownership (Tinh thần làm chủ vận hành)
- **Tư duy cũ:** "Code chạy được trên máy tôi là xong việc" (It works on my machine).
- **Năng lực đạt được:** Nhận thức rõ ràng rằng code chỉ chiếm 20% vòng đời sản phẩm, 80% còn lại là vận hành. Làm chủ trọn vẹn ranh giới tài nguyên Docker (CPU 2.0 Cores, RAM 1024MB), kiểm tra sức khỏe tự động 30s một lần, cơ chế cứu hộ dữ liệu thảm họa < 1s qua mã băm SHA-256, và quy trình xử lý 5 tình huống phát sinh lỗi thực tế.

### 5.4. Product Storytelling (Nghệ thuật truyền tải giá trị sản phẩm)
- **Tư duy cũ:** Thuyết trình bằng cách chiếu mã nguồn và giải thích từng hàm toán học phức tạp, khiến người nghe và hội đồng mệt mỏi.
- **Năng lực đạt được:** Biết cách kể câu chuyện sản phẩm trong 15 phút: bắt đầu từ nỗi đau thực tế của học viên và giảng viên (mất 45.9s tìm tài liệu, dữ liệu thực hành không chuẩn, AI trả lời ảo giác), sau đó chứng minh giải pháp kỹ thuật đã giải quyết triệt để nỗi đau đó ra sao qua dữ liệu thực nghiệm sống động.

### 5.5. Evidence-based Delivery (Bàn giao dựa trên bằng chứng định lượng)
- **Tư duy cũ:** Khẳng định hệ thống "chạy rất nhanh, rất ổn định, giao diện rất đẹp" bằng cảm tính chủ quan.
- **Năng lực đạt được:** Mọi tuyên bố chất lượng đều có số liệu thực nghiệm bảo chứng: P95 đạt 18.75ms (đo qua 1000 truy vấn), Throughput đạt 340.5 RPS (kiểm thử 20 workers đồng thời), điểm Usability đạt SUS 92.5/100 (khảo sát thực tế 5 người dùng), và 100% tệp tin sao lưu đối soát trùng khớp mã băm SHA-256.

### 5.6. Continuous Improvement (Tư duy cải tiến liên tục)
- **Tư duy cũ:** Che giấu các điểm chưa hoàn hảo để bảo vệ sản phẩm trước hội đồng nghiệm thu.
- **Năng lực đạt được:** Thấu hiểu rằng tính trung thực kỹ thuật là giá trị cao nhất. Dũng cảm chỉ rõ 3 hạn chế đã biết (`KNOWN-001` đến `003`), cung cấp giải pháp khắc phục tạm thời ngay lập tức cho người trực ca, đồng thời vạch ra Lộ trình 60 ngày tiếp theo với các mốc hành động có thứ tự ưu tiên (P0, P1) cụ thể.

---

## 6. KẾT LUẬN & CAM KẾT BÀN GIAO CHÍNH THỨC

Toàn bộ hệ thống **CyberSoft Data & AI Lab v1.0** cùng gói tài nguyên bàn giao Ngày 30 đã hoàn thiện 100% tiêu chí nghiệm thu (DoD), sẵn sàng phục vụ công tác giảng dạy, thi cử và bảo vệ đồ án tốt nghiệp trước Hội đồng Giám khảo CyberSoft Academy.
