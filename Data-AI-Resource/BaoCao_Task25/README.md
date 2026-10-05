# CYBERSOFT DATA & AI LAB — BÀN GIAO NGÀY 25
## KIỂM THỬ BẢO MẬT & DỮ LIỆU RIÊNG TƯ (SECURITY & PRIVACY GUARD v0.1)

**Dự án**: CyberSoft Data & AI Lab  
**Đầu việc**: NGÀY 25 — Kiểm thử bảo mật và dữ liệu riêng tư (`cybersoft-security-privacy-guard`)  
**Vai trò**: Data & AI Resource Engineer (Đào Trung Kiên)  
**Trạng thái**:  **ĐÃ HOÀN THÀNH 100% THEO ĐẶC TẢ VÀ TIÊU CHÍ NGHIỆM THU (DoD)**  
**Ngày thực hiện**: 2026-10-03  

---

## 1. TỔNG QUAN TÀI NGUYÊN BÀN GIAO (DELIVERABLES OVERVIEW)

Thư mục `BaoCao_Task25/` chứa trọn bộ giải pháp kiểm định an toàn thông tin, bảo vệ dữ liệu riêng tư (PII Scanner & Masking), phòng vệ Prompt Injection trên mô hình AI, cô lập hệ thống tệp tin (Path Traversal Sandboxing & Secure Upload Guard), bản đặc tả Threat Model theo phương pháp luận STRIDE/DREAD, chốt chặn Security Quality Gate tự động, ứng dụng Web Inspector (SPA), bộ kiểm thử tự động 37 bài test Pytest và sơ đồ kiến trúc độ phân giải cao:

```text
BaoCao_Task25/
├── 25_security_and_privacy_testing.md     # Thuyết minh kỹ thuật chi tiết toàn diện Task 25 (9 mục lớn)
├── README.md                              # Sổ tay hướng dẫn bàn giao, kiểm thử độc lập & đối soát DoD
├── AI_WORKLOG.md                          # Nhật ký phối hợp & thẩm định AI 6 phần theo chuẩn CyberSoft
├── threat_model.md                        # Bản đặc tả mô hình mối đe dọa chi tiết (STRIDE + DREAD)
├── security_test_report.md                # Báo cáo kiểm định an ninh và danh mục các bản vá đã hợp nhất
├── Picture_25_Detail.png                  # Sơ đồ Kiến trúc 4 Trụ Cột Phòng Vệ (3400x1600, 300 DPI Dark Theme)
├── requirements.txt                       # Danh mục thư viện phụ thuộc (FastAPI, Pydantic, Pytest, Pillow...)
├── portal/                                # Giao diện Web Security & Privacy Inspector (SPA)
│   ├── index.html                         # Giao diện chính: PII Scanner, Prompt Defense, File Guard, STRIDE Matrix
│   ├── styles.css                         # CSS Cyber-Dark hiện đại, bảng điều khiển KPI và huy hiệu trạng thái
│   └── app.js                             # Logic client-side: Gọi API quét PII, phân tích prompt, kiểm thử upload
├── src/                                   # Mã nguồn backend FastAPI v1.0
│   ├── __init__.py
│   ├── main.py                            # Khởi tạo App FastAPI, Security Headers, CORS, Error Envelope Handlers
│   ├── config.py                          # Cấu hình bảo mật, danh mục regex PII, whitelist mime/extension
│   ├── schemas/                           # Pydantic Schemas v2 chuẩn hóa
│   │   ├── __init__.py
│   │   └── security.py                    # Schemas PIIEntity, ScanRequest, ThreatItem, QualityGateResponse
│   ├── routes/                            # Các router RESTful v1.0
│   │   ├── __init__.py
│   │   ├── health.py                      # GET /health
│   │   └── security.py                    # POST /scan-pii, POST /check-injection, POST /upload-check, GET /threat-model
│   └── services/                          # Tầng nghiệp vụ xử lý an toàn thông tin
│       ├── __init__.py
│       ├── pii_scanner.py                 # Quét PII (SĐT VN, Email, CCCD, API keys), chế độ Masking & Redacting
│       ├── injection_guard.py             # Nhận diện & chặn đứng Direct Override, DAN Jailbreak, System Probe
│       ├── file_security.py               # Phân giải đường dẫn an toàn (Sandbox Jail), kiểm tra Magic Bytes PE/ELF
│       └── threat_engine.py               # STRIDE Evaluator & Security Quality Gate (Khóa release nếu có lỗi High/Critical)
├── data/                                  # Dữ liệu thử nghiệm và cấu trúc mối đe dọa
│   ├── threat_model.json                  # Ma trận 10 mối đe dọa STRIDE và điểm số DREAD dạng JSON
│   ├── security_test_suite.json           # Danh mục 26 ca kiểm thử bảo mật có cấu trúc
│   ├── sandbox/                           # Thư mục an toàn cho kiểm thử đọc tài nguyên hợp lệ
│   │   └── sample_safe_resource.txt       # Tệp tài nguyên an toàn mẫu
│   └── test_payloads/                     # Dữ liệu phục vụ kiểm thử phòng vệ
│       ├── synthetic_pii_dataset.json     # Tập dữ liệu học viên giả lập tổng hợp (Cam kết Zero Real PII)
│       ├── prompt_injection_samples.json  # Các mẫu tấn công prompt injection độc hại
│       └── safe_course_data.json          # Dữ liệu khóa học hợp lệ chuẩn
├── scripts/                               # Công cụ và module tự động hóa
│   ├── run_server.py                      # Khởi chạy máy chủ FastAPI Uvicorn tại cổng 8000
│   ├── run_security_eval.py               # CLI kiểm định độc lập 5 chặng tiêu chí DoD (Exit code 0)
│   └── render_diagram.py                  # Script kết xuất ảnh sơ đồ kiến trúc Picture_25_Detail.png
└── tests/                                 # Bộ kiểm thử tích hợp Pytest (37/37 Tests PASS 100% trong 2.15s)
    ├── __init__.py
    ├── conftest.py                        # Fixtures TestClient và các service kiểm thử
    ├── test_pii_scanner.py                # Kiểm thử PII scanner: email, phone VN, CCCD, token, masking (6 tests)
    ├── test_injection_guard.py            # Kiểm thử Prompt injection: direct, indirect, jailbreak, leakage (6 tests)
    ├── test_path_traversal.py             # Kiểm thử Path traversal: ../, null byte, absolute path (5 tests)
    ├── test_file_upload.py                # Kiểm thử File upload: fake MIME, double ext, oversized, zip slip (6 tests)
    ├── test_threat_gate.py                # Kiểm thử Security Quality Gate: chặn release khi có lỗi mở (4 tests)
    └── test_security_api.py               # Kiểm thử tích hợp RESTful API endpoints & Error Envelope (10 tests)
```

> [!NOTE]
> Báo cáo Word chính thức được lưu trữ tập trung tại thư mục gốc của workspace theo quy chuẩn chung: `DaoTrungKien_Bao_cao_Data_AI_Resource_Engineer_CyberSoft_Ngay_25.docx` (không đặt file Word trong thư mục mã nguồn task để đảm bảo tính phân tách mã nguồn và sản phẩm báo cáo cuối).

---

## 2. HƯỚNG DẪN THỰC THI & TRẢI NGHIỆM TRÊN TRÌNH DUYỆT WEB

### Bước 1: Khởi động máy chủ Security & Privacy Guard
Chạy lệnh từ PowerShell:
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task25/scripts/run_server.py
```
Máy chủ khởi chạy thành công tại địa chỉ: **`http://localhost:8000`**

### Bước 2: Trải nghiệm Giao diện Web Inspector (SPA)
Mở trình duyệt Web (Chrome, Edge) và truy cập:
👉 **[http://localhost:8000/portal/](http://localhost:8000/portal/)** (hoặc trang chủ [http://localhost:8000/](http://localhost:8000/))

Tại giao diện Web Inspector, bạn có thể thực hiện đầy đủ 4 tác vụ trực quan:
1. **Quét & Khử nhiễm PII**: Tải dữ liệu học viên mẫu (100% synthetic), lựa chọn chế độ Masking hoặc Redaction, bấm nút Quét để xem văn bản đã khử nhiễm và danh sách thực thể nhạy cảm.
2. **Thử nghiệm Prompt Injection**: Bấm chọn các mẫu tấn công Direct Override, DAN Jailbreak hoặc System Prompt Probe để quan sát hành vi `BLOCK` của hệ thống; thử câu hỏi hợp lệ để quan sát hành vi `ALLOW`.
3. **Thử nghiệm An toàn Tệp & Path Traversal**: Gửi các đường dẫn vượt thư mục (`../../etc/passwd`) để kiểm chứng chốt chặn `403 Forbidden`, hoặc thử nghiệm tải lên tệp giả mạo PE Magic Byte.
4. **Ma trận Mối đe dọa STRIDE**: Quan sát bảng phân tích 10 mối đe dọa, điểm số DREAD và trạng thái Quality Gate xanh `PASSED`.

---

## 3. LỆNH KIỂM THỬ ĐỘC LẬP & ĐỐI SOÁT CHỈ TIÊU DoD

### Lệnh 1: Chạy CLI Evaluator Độc Lập 5 Chặng DoD
```powershell
python cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task25/scripts/run_security_eval.py
```
*Kết quả đầu ra*: Đạt 5/5 chặng kiểm định (PII Scan, Prompt Defense, Path Sandbox, Threat Gate, Test Coverage), Exit Code: `0` (SUCCESS).

### Lệnh 2: Chạy Bộ Kiểm Thử Tự Động Pytest Toàn Diện
```powershell
pytest cybersoft-learning-hub/Data-AI-Resource/BaoCao_Task25/tests/ -v
```
*Kết quả đầu ra*: **37/37 tests PASS 100% trong 2.15 giây**, 0 failed, 0 warnings.

---

## 4. BẢNG ĐỐI SOÁT TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA / DoD)

| Tiêu Chí Nghiệm Thu (DoD) | Yêu Cầu Cốt Lõi | Minh Chứng & Kết Quả Thực Tế | Trạng Thái |
| :--- | :--- | :--- | :---: |
| **DoD 1: Không có PII thật trong demo** | 100% dữ liệu thử nghiệm trong demo và tập dataset là dữ liệu giả lập tổng hợp (synthetic), không chứa PII thật. | Tệp `synthetic_pii_dataset.json` chứa dữ liệu giả lập tổng hợp, `PIIScannerService` phát hiện và che giấu 100% thực thể nhạy cảm. | **ĐẠT (100%)** |
| **DoD 2: Ít nhất 15 security cases** | Xây dựng tối thiểu 15 ca kiểm thử bảo mật bao phủ PII, Prompt Injection, Path Traversal và File Upload. | Thực tế đạt **26 ca kiểm thử có cấu trúc** và **37 bài test Pytest tự động** (vượt 146% so với yêu cầu). | **ĐẠT (Vượt mức)** |
| **DoD 3: Lỗi mức cao được sửa hoặc chặn release** | Mọi mối đe dọa mức Critical hoặc High phải được vá (Fixes Merged) hoặc kích hoạt chốt chặn khóa release. | 10/10 mối đe dọa STRIDE đã được vá hoặc giảm thiểu an toàn. Chốt chặn Security Quality Gate ở trạng thái **PASSED**. | **ĐẠT (100%)** |
| **DoD 4: Bản giao đầy đủ Threat Model & Security Report** | Có tài liệu Threat Model, Security Test Report, Fixes Merged và Báo cáo Word chính thức. | Bàn giao trọn vẹn `threat_model.md`, `security_test_report.md`, `AI_WORKLOG.md`, Web Portal SPA, CLI Evaluator và Báo cáo Word. | **ĐẠT (100%)** |
