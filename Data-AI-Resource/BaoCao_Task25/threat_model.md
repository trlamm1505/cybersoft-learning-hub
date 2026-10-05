# BẢN ĐẶC TẢ MÔ HÌNH MỐI ĐE DỌA (THREAT MODEL) — TASK 25
## HỆ THỐNG AN TOÀN & BẢO VỆ DỮ LIỆU RIÊNG TƯ (CYBERSOFT SECURITY & PRIVACY GUARD v0.1)

**Hệ thống**: CyberSoft Data & AI Lab Ecosystem  
**Giai đoạn**: Tuần 5 — Sản phẩm hóa  
**Người đánh giá**: Đào Trung Kiên — Data & AI Resource Engineer  
**Ngày thực hiện**: 2026-10-03  
**Phương pháp luận**: STRIDE (Microsoft Threat Modeling) & DREAD Scoring  
**Trạng thái Security Quality Gate**: **PASSED** (0 Lỗ hổng Critical/High Mở — Đủ điều kiện phát hành)

---

## 1. MỤC TIÊU VÀ PHẠM VI MÔ HÌNH HÓA (OBJECTIVES & SCOPE)

### 1.1. Phạm vi hệ thống
Hệ thống CyberSoft Data & AI Lab quản lý các tài nguyên cốt lõi phục vụ đào tạo kỹ thuật:
- **Tài nguyên Dữ liệu (Datasets)**: Bán lẻ (`retail_sales`), Nhân sự (`hr_attendance`), Dự báo rời bỏ (`customer_churn`), và Ngữ liệu phân đoạn RAG (`ai_knowledge_chunks`).
- **Tài nguyên AI (Prompts & Models)**: Mẫu chỉ thị sinh bài tập theo Bloom, Gia sư AI RAG, Embedder BGE-Small, LLM Gemini 3.8 Flash.
- **Tài nguyên Học vụ (Exercises & Benchmarks)**: Ngân hàng 20 bài tập thực hành đã duyệt, Bộ đánh giá 100 câu hỏi RAG Benchmark.
- **Cổng giao tiếp (Gateways & APIs)**: Cổng tải tài nguyên, Giao diện Web Explorer/Inspector, API RESTful tích hợp sang Tuần 6.

### 1.2. Mục tiêu an toàn thông tin
1. **Bảo mật dữ liệu cá nhân (Confidentiality & Privacy)**: Ngăn chặn triệt để việc đưa dữ liệu cá nhân thật (PII) của học viên vào kho học liệu công khai.
2. **Tính toàn vẹn (Integrity & Provenance)**: Ngăn ngừa việc đầu độc tài nguyên (data poisoning), sửa đổi prompt trái phép hoặc ghi đè tài nguyên bất biến WORM.
3. **Phòng vệ mô hình (AI Safety & Robustness)**: Chặn đứng các đòn tấn công Prompt Injection, Jailbreak (DAN) và trích xuất trái phép System Prompt bí mật.
4. **Kiểm soát ranh giới hệ thống tệp (Sandboxing)**: Chặn đứng nguy cơ vượt thư mục (Path Traversal) và tải lên tệp thực thi nguy hiểm.

---

## 2. PHÂN TÍCH THEO 6 TRỤ CỘT STRIDE & THANG ĐIỂM DREAD

Thang điểm DREAD đánh giá từ 1 đến 10 theo 5 tiêu chí:
- **D**amage (Mức độ thiệt hại)
- **R**eproducibility (Khả năng tái lập cuộc tấn công)
- **E**xploitability (Độ dễ dàng khai thác)
- **A**ffected Users (Tỷ lệ người dùng bị ảnh hưởng)
- **D**iscoverability (Khả năng phát hiện lỗ hổng)

$$\text{DREAD Score} = \frac{D + R + E + A + D}{5}$$

---

### Bảng Ma Trận Đánh Giá 10 Mối Đe Dọa Trọng Yếu

| Mã | Trụ Cột STRIDE | Tên Mối Đe Dọa | Thành Phần | Điểm DREAD | Mức Độ | Trạng Thái | Biện Pháp Giảm Thiểu Đã Triển Khai |
| :---: | :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **THR-01** | **Spoofing** | Giả mạo token học viên để truy cập tài nguyên | Auth Gateway | 6.4 | HIGH | **MITIGATED** | Xác thực chữ ký JWT, kiểm tra thời hạn `exp`, áp dụng CORS nghiêm ngặt. |
| **THR-02** | **Tampering** | Đầu độc ngữ liệu RAG hoặc tiêm Prompt Injection | Prompt Engine | 8.4 | CRITICAL | **PATCHED** | `InjectionGuardService`: Chặn đứng direct override, jailbreak, delimiter hijack. |
| **THR-03** | **Tampering** | Ghi đè phá hủy tài nguyên bất biến | WORM Store | 7.2 | HIGH | **PATCHED** | Chính sách WORM: Chặn 100% ghi đè bằng mã HTTP 409 Conflict & SHA-256 hash. |
| **THR-04** | **Repudiation** | Chỉnh sửa tài nguyên không lưu nhật ký kiểm toán | Lineage Tracker | 5.0 | MEDIUM | **PATCHED** | Gắn Lineage DAG, Release Manifests kèm timestamp và Changelog Differ tự động. |
| **THR-05** | **Info Disclosure** | Rò rỉ PII (SĐT, Email, CCCD) trong Dataset | Dataset Store | 8.6 | CRITICAL | **PATCHED** | `PIIScannerService`: Tự động quét và che giấu/redact toàn bộ PII; Zero Real PII. |
| **THR-06** | **Info Disclosure** | Rò rỉ System Prompt ẩn & API Key qua LLM probe | LLM Integration | 7.4 | HIGH | **PATCHED** | Bộ lọc `SYSTEM_PROMPT_LEAK` chặn yêu cầu in chỉ thị ẩn và bọc mặt nạ API keys. |
| **THR-07** | **Denial of Service** | DoS máy chủ qua tệp tải lên dung lượng khổng lồ | Upload Gateway | 7.8 | HIGH | **PATCHED** | Giới hạn dung lượng cứng 10MB (`MAX_UPLOAD_SIZE_BYTES`), chặn DoS bộ nhớ. |
| **THR-08** | **Denial of Service** | Tấn công ReDoS trên regex quét PII | Regex Engine | 5.8 | MEDIUM | **PATCHED** | Sử dụng regex nguyên tử (atomic regexes), không dùng nhóm lặp lồng nhau. |
| **THR-09** | **Elevation of Privilege** | Vượt thư mục (Path Traversal) đọc tệp hệ thống | Download API | 9.0 | CRITICAL | **PATCHED** | `validate_safe_path()`: Phân giải đường dẫn an toàn trong thư mục sandbox. |
| **THR-10** | **Elevation of Privilege** | Tấn công Zip Slip ghi đè tệp ngoài sandbox | Archive Extractor | 8.0 | CRITICAL | **PATCHED** | Quét duyệt danh sách entry của ZipFile, chặn đứng lập tức entry chứa `'..'`. |

---

## 3. THIẾT KẾ CHỐT CHẶN SECURITY QUALITY GATE

Chốt chặn bảo mật (Security Quality Gate) được tích hợp trực tiếp vào quy trình xuất bản bản đồ phát hành (Release Manifest):

```text
┌────────────────────────────────────────────────────────────────────────┐
│               SECURITY QUALITY GATE DECISION WORKFLOW                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. Quét toàn bộ danh mục Mối đe dọa (Threat Registry)                  │
│    ├── Kiểm tra xem có bất kỳ Mối đe dọa nào mức CRITICAL ở trạng thái OPEN?  │
│    │    └── CÓ ──> [HARD BLOCK] Khóa Release Manifest, Exit Code 1     │
│    ├── Kiểm tra xem có bất kỳ Mối đe dọa nào mức HIGH ở trạng thái OPEN?      │
│    │    └── CÓ ──> [HARD BLOCK] Khóa Release Manifest, Exit Code 1     │
│    └── KHÔNG ──> Tiếp tục chặng 2                                     │
│ 2. Kiểm định Dữ liệu Riêng tư (Zero Real PII)                          │
│    ├── Quét tập dữ liệu qua PIIScannerService                          │
│    └── Phát hiện PII thật chưa được che giấu? ──> [BLOCK] Exit Code 1  │
│ 3. Chạy Toàn Bộ Bộ Kiểm Thử (Pytest Suite >= 15 cases)                 │
│    └── Tỷ lệ đạt < 100%? ──> [BLOCK] Exit Code 1                       │
│ 4. KẾT LUẬN: QUALITY GATE: PASSED (Release Allowed, Exit Code 0)       │
└────────────────────────────────────────────────────────────────────────┘
```

**Kết quả đánh giá hiện tại**:
- Số mối đe dọa Critical mở: **0**
- Số mối đe dọa High mở: **0**
- Trạng thái Quality Gate: **PASSED (100% Điều kiện nghiệm thu đạt)**
