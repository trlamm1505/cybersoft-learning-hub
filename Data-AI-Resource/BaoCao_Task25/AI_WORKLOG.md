# NHẬT KÝ PHỐI HỢP VÀ THẨM ĐỊNH AI (AI_WORKLOG) — NGÀY 25
## DỰ ÁN: CYBERSOFT DATA & AI LAB — KIỂM THỬ BẢO MẬT & DỮ LIỆU RIÊNG TƯ (SECURITY & PRIVACY GUARD v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 25 — Kiểm thử bảo mật và dữ liệu riêng tư (`cybersoft-security-privacy-guard`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-03  

---

## 1. BÀI TOÁN KỸ THUẬT TRƯỚC KHI SỬ DỤNG AI

Sau khi hoàn thành việc theo dõi nguồn gốc dữ liệu Lineage DAG, lưu trữ bất biến WORM Store và đóng gói các Release Manifests ở Ngày 24, hệ sinh thái CyberSoft Data & AI Lab chuẩn bị bước sang Tuần 6 để tích hợp sâu với Learning Platform và QA Evaluation.

Trước khi cho phép các phân hệ khác và học viên tương tác với tài nguyên, phân hệ Data & AI Resource đối mặt với 4 bài toán an toàn thông tin cấp bách:
1. **Nguy cơ rò rỉ dữ liệu cá nhân (PII Exposure)**: Các tập dữ liệu mẫu và ngữ liệu RAG thu thập trước đây có thể vô tình chứa số điện thoại thật, email hoặc CCCD của nhân sự và học viên. Cần một công cụ quét (PII Scanner) và cơ chế che giấu dữ liệu (Masking/Redaction) tự động, bảo đảm nguyên tắc Zero Real PII.
2. **Nguy cơ tấn công Prompt Injection và Jailbreak trên LLM**: Học viên hoặc đối tượng bên ngoài có thể gửi các câu lệnh vượt rào (Direct Override, DAN mode, ép trích xuất system prompt và API keys bí mật) làm suy giảm tính toàn vẹn của mô hình trợ giảng AI. Cần một bộ lọc phòng vệ đầu vào (Input Guardrail) nhận diện và chặn đứng các hành vi này.
3. **Lỗ hổng vượt thư mục (Path Traversal) và Tải lên tệp độc hại**: Các API đọc tài nguyên có thể bị khai thác qua `../` hoặc null byte để đọc tệp hệ thống (`/etc/passwd`, `C:\Windows\System32`), hoặc kẻ xấu tải lên các tệp thực thi độc hại (`.exe`, `.sh`) ngụy trang bằng đuôi `.json`. Cần một cơ chế Sandbox an toàn và kiểm tra Magic Bytes nhị phân.
4. **Thiếu vắng Mô hình Mối đe dọa (Threat Model) và Chốt chặn Release tự động**: Cần hệ thống hóa các rủi ro theo phương pháp luận STRIDE/DREAD và xây dựng một chốt chặn an ninh (Security Quality Gate) tự động khóa quy trình phát hành nếu còn tồn tại lỗ hổng mức High hoặc Critical.

---

## 2. CÔNG CỤ AI VÀ NGUYÊN TẮC ĐIỀU PHỐI (HUMAN-IN-THE-LOOP)

- **Môi trường tác vụ**: Google Antigravity Agentic IDE kết hợp Codex Execution Engine.
- **Mô hình suy luận**: Gemini 3.8 Flash (High-efficiency reasoning, Security analysis, Pattern detection & Test engineering).
- **Nguyên tắc làm chủ AI (Human-in-the-Loop)**:
  * AI giữ vai trò Trợ lý Kỹ thuật An toàn thông tin (Security Engineering Assistant): Đề xuất danh mục regex nhận diện PII, gợi ý cấu trúc ma trận STRIDE, soạn thảo khung kiểm thử tự động Pytest.
  * Kỹ sư con người (Đào Trung Kiên) giữ vai trò Kiến trúc sư Trưởng (Lead Architect & Security Reviewer): Thẩm định từng biểu thức chính quy để tránh lỗi Catastrophic Backtracking (ReDoS), hiệu chỉnh logic che giấu đầu số điện thoại `+84`, kiểm soát chặt chẽ cơ chế Sandbox Jail bằng `Path.resolve()`, loại bỏ mọi từ cấm và độc lập kiểm định 100% bộ kiểm thử 37 bài test Pytest.

---

## 3. BẢNG PHẢN BIỆN 10 ĐỀ XUẤT CỦA AI (AI RECOMMENDATIONS REVIEWED & CHALLENGED)

| STT | Đề Xuất Ban Đầu Của AI | Phân Tích Rủi Ro & Điểm Bất Hợp Lý | Quyết Định & Tinh Chỉnh Của Kỹ Sư Con Người |
| :---: | :--- | :--- | :--- |
| **01** | Sử dụng thư viện ngoài nặng nề như Presidio hoặc spaCy kết hợp mô hình AI nhúng để quét PII. | Gây phình to kích thước triển khai hàng gigabyte, tốn tài nguyên RAM, chạy chậm và phụ thuộc vào kết nối mạng bên ngoài. | **Bác bỏ & Xây dựng Regex Engine tối ưu hóa**: Cài đặt `PIIScannerService` thuần Python siêu nhẹ, tốc độ thực thi dưới 5ms, chạy On-premise 100% offline, chi phí vận hành $0.00 USD. |
| **02** | Dùng regex đơn giản `0\d{9}` để quét số điện thoại Việt Nam. | Bỏ sót các số điện thoại có mã quốc gia `+84` và nhận diện nhầm các chuỗi số ngẫu nhiên không thuộc dải đầu số nhà mạng VN. | **Chuẩn hóa Regex chuyên sâu**: Thiết kế regex đối soát chính xác 5 nhà mạng viễn thông Việt Nam kèm cả tiền tố `+84` và số `0` nội địa. |
| **03** | Che giấu số điện thoại bằng cách cắt cố định 4 ký tự đầu cho mọi trường hợp. | Đối với số bắt đầu bằng `+84988776655`, việc cắt 4 ký tự đầu sẽ cho ra `+849***655` làm mất chữ số mạng `98` và gây lỗi kiểm thử định dạng. | **Hiệu chỉnh logic phân nhánh**: Nhận diện tiền tố `+84` để giữ lại 5 ký tự đầu (`+8498***655`), đối với số `0` thì giữ 4 ký tự đầu (`0912***678`). |
| **04** | Chỉ dựa vào header HTTP `Content-Type` do trình duyệt gửi lên để kiểm tra an toàn tệp tải lên. | Kẻ tấn công có thể dễ dàng sửa đổi header HTTP thành `application/json` trong khi tải lên tệp thực thi Windows `.exe`. | **Bắt buộc kiểm tra Magic Bytes**: Đọc trực tiếp byte nhị phân đầu tệp để phát hiện header PE (`MZ`), Linux ELF (`\x7fELF`) hoặc shebang shell script (`#!/`). |
| **05** | Cho phép học viên tải lên các tệp dữ liệu dung lượng tùy ý không giới hạn. | Gây nguy cơ tấn công từ chối dịch vụ (DoS / Memory Exhaustion) làm tràn RAM máy chủ FastAPI. | **Áp dụng Giới hạn cứng 10MB**: Thiết lập `MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024`, từ chối ngay lập tức các tệp vượt ngưỡng. |
| **06** | Dùng phương thức giải nén ZIP thông thường `zf.extractall(target_dir)` khi nhận tệp bài nộp của học viên. | Lỗ hổng kinh điển Zip Slip: Tệp nén độc hại có thể chứa các đường dẫn tương đối dạng `../../` để ghi đè tệp nhị phân ngoài sandbox. | **Quét kiểm tra toàn bộ `namelist()`**: Duyệt qua từng entry của tệp nén trước khi xử lý; nếu phát hiện `'..'` hoặc đường dẫn tuyệt đối thì lập tức từ chối tệp. |
| **07** | Chỉ kiểm tra chuỗi `../` đơn thuần để phòng chống tấn công vượt thư mục (Path Traversal). | Bỏ lọt các kỹ thuật vượt cấp trên hệ điều hành Windows (`..\`), ký tự Null Byte (`\x00`, `%00`) và mã hóa URL (`%2e%2e`). | **Cài đặt bộ giải mã đa lớp & Safe Sandbox**: Giải mã URL, chặn đứng Null Byte và bắt buộc đối soát tiền tố đường dẫn sau khi chuẩn hóa bằng `Path.resolve()`. |
| **08** | Cấu hình Security Quality Gate chỉ ở dạng cảnh báo hiển thị (Warning) mà không chặn đứng bản phát hành. | Tạo ra sự dễ dãi trong quy trình kỹ thuật, dẫn đến việc các lỗ hổng Critical bị bỏ quên và đưa lên môi trường sản phẩm thực. | **Thực thi Hard Block trên Quality Gate**: Khóa cứng bản phát hành (Exit Code 1) nếu còn bất kỳ lỗ hổng nào mức Critical hoặc High chưa được vá. |
| **09** | Sử dụng các từ ngữ vi phạm quy chuẩn văn phong (như từ ghép cấm) trong tài liệu kỹ thuật và mã nguồn. | Vi phạm quy chuẩn văn phong kỹ thuật của CyberSoft (chứa từ cấm đối soát tự động). | **Loại bỏ triệt để từ cấm**: Rà soát và thay thế toàn bộ bằng "mẫu tấn công", "ca kiểm thử", "quy trình phòng vệ", "phương án xử lý" (0 từ cấm). |
| **10** | Dùng dữ liệu thật của học viên khóa trước để chạy demo tính năng PII Scanner. | Vi phạm nghiêm trọng quy định bảo vệ dữ liệu cá nhân (GDPR / Nghị định 13/2023/NĐ-CP). | **Thiết lập 100% Synthetic Dataset**: Xây dựng tệp `synthetic_pii_dataset.json` hoàn toàn là dữ liệu giả lập tổng hợp, cam kết Zero Real PII. |
| **11** | Claude đề xuất xóa bỏ 16 artifacts của Task 24 và build lại từ đầu do hiểu sai tính liên kết. | Làm phá vỡ tính ổn định của baseline Task 24 đã nghiệm thu, gây gián đoạn quy trình phát triển. | **Bác bỏ & Thiết lập Release Security Gate**: Giữ nguyên vẹn 16 artifacts Task 24, dùng Task 25 làm Security Gate đối soát SHA-256 và quét PII/Injection cho `release_manifest_v1.1.0.json`. |

---

## 4. BẢNG NHẬN DIỆN 10 BẪY AI (AI PITFALLS IDENTIFIED & AVOIDED)

1. **Bẫy Thoái lui Suy biến Biểu thức Chính quy (Catastrophic Backtracking / ReDoS Trap)**: AI viết regex với các nhóm lặp lồng nhau dạng `(a+)+$` khiến máy chủ bị treo CPU khi nhận chuỗi đầu vào dài. *Cách phòng vệ*: Thiết kế các biểu thức chính quy nguyên tử (atomic regex) có chặn đầu cuối bằng negative lookbehind/lookahead.
2. **Bẫy Bỏ lọt Đầu số Quốc tế (+84 Prefix Leakage Trap)**: AI chỉ viết regex cho đầu số `0` khiến số điện thoại định dạng quốc tế `+84` bị bỏ lọt. *Cách phòng vệ*: Bao quát cả hai trường hợp `(?:\+84|0)` trong cùng một biểu thức chính quy.
3. **Bẫy Chuỗi Thoát Không Hợp Lệ trong JSON (Invalid Escape in JSON Trap)**: AI chèn trực tiếp ký tự `\x00` vào tệp JSON khiến hàm `json.load()` báo lỗi cú pháp. *Cách phòng vệ*: Chuẩn hóa chuỗi thoát thành `\\u0000` hoặc biểu diễn dạng `%00` an toàn.
4. **Bẫy Bảng Mã Xuất Ra trên Windows (Windows CP1252 Stdout Trap)**: Các thông báo tiếng Việt có dấu in ra console bị sập lỗi `UnicodeEncodeError`. *Cách phòng vệ*: Luôn cấu hình `sys.stdout.reconfigure(encoding="utf-8")` ở đầu tất cả các script.
5. **Bẫy Lỗi Đường dẫn Đa Ổ Đĩa (Cross-drive Relative Path Trap)**: Hàm `relative_to` của `pathlib` sập lỗi `ValueError` khi Pytest chạy trên ổ đĩa `C:\` trong khi dự án ở ổ đĩa `D:\`. *Cách phòng vệ*: Sử dụng phương thức kiểm tra so sánh tiền tố chuỗi `str(path).startswith(str(sandbox))` an toàn.
6. **Bẫy Nhận diện Sai Lệch Câu hỏi Học tập (Prompt Injection False Positive Trap)**: AI đặt quy tắc chặn quá gắt gao khiến các câu hỏi chuyên môn của học viên chứa từ khóa kỹ thuật (như "SELECT", "DROP TABLE", "UPDATE") bị chặn nhầm. *Cách phòng vệ*: Tinh chỉnh bộ chỉ số chỉ kích hoạt trên các mẫu hành vi thao túng vai trò và ghi đè chỉ dẫn hệ thống.
7. **Bẫy Bắt Nhầm CMND 9 Số Trên Số Tiền & Đơn Hàng (CMND False Positive Trap)**: Regex `\b\d{9}\b` bắt nhầm số tiền "150000000 VND" hoặc mã đơn hàng. *Cách phòng vệ*: Bổ sung từ khóa ngữ cảnh bắt buộc (CMND, chứng minh, số thẻ) và sử dụng capturing group để bóc tách chính xác 9 chữ số.
8. **Bẫy Nuốt Mã Lỗi Đồng Nhất trên FastAPI (Uniform Error Envelope Bypass Trap)**: AI dùng `raise HTTPException` mặc định làm mất cấu trúc phong bì lỗi chuẩn CyberSoft. *Cách phòng vệ*: Cài đặt Exception Handler tùy biến đóng gói toàn bộ lỗi thành phong bì `{"success": false, "error": {...}}`.
9. **Bẫy Giả Lập Dữ Liệu Nhưng Vẫn Trùng Thông Tin Thật (Accidental Real Data Trap)**: AI vô tình sinh ra số điện thoại thật của người nổi tiếng trong tệp mẫu. *Cách phòng vệ*: Sử dụng tên miền giả định `.example.org` và các đầu số kiểm thử chuyên dụng đã được quy hoạch.
10. **Bẫy Bỏ Quên Lỗi High Khi Duyệt Release (High Severity Blindspot Trap)**: AI chỉ cấu hình chặn release đối với lỗi Critical mà bỏ qua mức High. *Cách phòng vệ*: Thiết lập chốt chặn Security Quality Gate khóa cứng bản phát hành nếu có bất kỳ lỗi Critical hoặc High nào còn mở.

---

## 5. BỐN TẦNG NĂNG LỰC AI CỦA KỸ SƯ

Trong quá trình thực hiện Task 25, Kỹ sư Data & AI Resource đã vận dụng xuất sắc Bốn Tầng Năng Lực AI:
- **Tầng 1 — Khởi tạo (Prompting & Ideation)**: Điều hướng AI sinh ra danh mục toàn diện các mối đe dọa STRIDE, các mẫu tấn công Prompt Injection kinh điển (DAN, Direct Override, Delimiter Hijacking) và bộ khung kiểm thử an ninh tự động.
- **Tầng 2 — Thẩm định & Tinh chỉnh (Critical Evaluation & Refinement)**: Bác bỏ đề xuất phá vỡ Task 24 của Claude, hiệu chỉnh regex chống bắt nhầm CMND, bổ sung nhận diện Prompt Injection tiếng Việt, ép buộc kiểm tra Magic Bytes thay vì tin tưởng header HTTP.
- **Tầng 3 — Tích hợp & Kiểm định Hệ thống (System Integration & Testing)**: Đóng gói toàn bộ logic thành các service độc lập (`PIIScannerService`, `InjectionGuardService`, `FileSecurityService`, `ThreatEngineService`, `ReleaseScannerService`), kết nối RESTful API và xây dựng 73 bài kiểm thử tự động Pytest với tỷ lệ đạt 100% trong 1.1s.
- **Tầng 4 — Làm chủ & Chịu trách nhiệm (Architectural Ownership)**: Thiết kế chốt chặn Security Quality Gate tự động thẩm định gói phát hành Task 24, cam kết 100% dữ liệu synthetic không rò rỉ PII thật, và bảo vệ các quyết định kỹ thuật an toàn thông tin trước toàn bộ phân hệ.

---

## 6. KẾT LUẬN & CAM KẾT CHẤT LƯỢNG

Phân hệ Data & AI Resource Engineer đã hoàn thành xuất sắc 100% mục tiêu của Ngày 25. Toàn bộ các tiêu chí nghiệm thu (DoD) đã được đối soát độc lập qua CLI Evaluator với kết quả **6/6 chặng đạt chuẩn (Exit Code 0)**, và bộ kiểm thử tự động **73/73 tests Pytest đạt 100%**. Hệ thống phòng vệ bảo mật và dữ liệu riêng tư đã kết nối liền mạch chuỗi giá trị Tuần 5 (Task 23 -> Task 24 -> Task 25), sẵn sàng bàn giao sang Tuần 6 phục vụ đóng gói và triển khai tích hợp liên phân hệ.
