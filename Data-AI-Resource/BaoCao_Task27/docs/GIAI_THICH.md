# HƯỚNG DẪN BẢO VỆ NHANH — TASK 27
## TÍCH HỢP VỚI QA HARNESS (QUALITY GATES & ZERO SILENT BYPASS)

### 1. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (FLOW TỔNG QUAN)
```text
[Tài nguyên Data & AI] ────── (Dataset, RAG Benchmark, Content bài giảng)
       │
       ▼
[4 Chốt chặn tự động] ─────── Chạy đồng thời 4 hàm kiểm định độc lập:
       ├── 1. gate_dataset:  Kiểm tra Primary Key, bản ghi mồ côi (orphan), độ toàn vẹn bảng.
       ├── 2. gate_rag:      Đo điểm Faithfulness (>=0.80), Context Recall (>=0.75), Latency P95.
       ├── 3. gate_content:  Lint tiêu đề (>=5 ký tự), mô tả không rỗng, không liên kết hỏng.
       └── 4. gate_security: Quét trực tiếp PII/Secret qua PIIScanner (tái sử dụng từ Task 25).
       │
       ▼
[Master Release Gate] ─────── Tổng hợp trạng thái: PASSED, WARNING hoặc BLOCKED kèm actionable fix.
       │ (Nếu có lỗi mà xin Bypass)
       ▼
[Chính sách Zero Silent Bypass] ── Từ chối nếu lý do rỗng/ngắn (<15 ký tự) hoặc thiếu người duyệt.
       │ (Nếu hợp lệ)
       ▼
[Audit Trail Log] ─────────── Ghi nhận biên bản kiểm toán có người duyệt và timestamp phục vụ hậu kiểm.
```

---

### 2. THỨ TỰ ĐỌC FILE KHI GIẢI THÍCH (3-5 PHÚT)
1. **`src/schemas/qa_gate.py`** (Đọc đầu tiên): Xem cấu trúc `FindingItem`, `GateEvaluationResult`, `ReleaseGateRequest`, `ReleaseGateResponse`, `BypassAuditRecord`.
2. **`src/services/qa_gate_service.py`** (Đọc thứ hai): Trọng tâm kỹ thuật gồm 4 hàm chốt chặn rõ ràng:
   - `evaluate_dataset_gate`: Kiểm định cấu trúc bảng và bản ghi mồ côi.
   - `evaluate_rag_gate`: Tính toán ngưỡng chất lượng RAG.
   - `evaluate_content_gate`: Thẩm định sư phạm bài học.
   - Quét PII/Secret thật bằng `PIIScannerService` nhập khẩu trực tiếp từ `BaoCao_Task25`.
   - `evaluate_release`: Điều phối phát hành và kiểm soát Zero Silent Bypass.
3. **`src/routes/qa_gate.py`** (Đọc thứ ba): Các API tiếp nhận hook từ CI/CD và trả về kết quả chuẩn hóa.
4. **`data/shared_fixtures/`** (Đọc thứ tư): Bộ test fixtures dùng chung giữa Data Lab và bạn QA (TTS 03).
5. **`tests/test_release_gate.py` & `test_zero_silent_bypass.py`** (Đọc cuối cùng): Bằng chứng kiểm thử tự động xác nhận chặn phát hành khi có lỗi và bắt buộc ghi nhận kiểm toán khi bypass.

---

### 3. 5 CÂU HỎI BẢO VỆ THƯỜNG GẶP VÀ CÂU TRẢ LỜI NGẮN

#### Câu 1: Tại sao gọi là "Zero Silent Bypass"? Hệ thống ngăn chặn việc bỏ qua âm thầm như thế nào?
> **Trả lời**: Bỏ qua âm thầm (Silent Bypass) là hành vi vô hiệu hóa chốt chặn mà không ai biết để kịp deadline. Hệ thống Task 27 bắt buộc: nếu muốn bypass một gói tài nguyên lỗi, payload PHẢI có `reason` tối thiểu 15 ký tự giải trình rõ và `authorized_by` có thẩm quyền. Mọi bypass đều được tự động lưu vào `audit_log` không thể xóa sửa.

#### Câu 2: Các con số vi phạm PII và Secret được phát hiện như thế nào? Có phải gán cứng không?
> **Trả lời**: Không gán cứng. Hệ thống nạp trực tiếp module `PIIScannerService` từ `BaoCao_Task25` để quét chuỗi dữ liệu thực tế. Nếu phát hiện OpenAI API key (`sk-proj-...`) hoặc số điện thoại/CCCD, scanner sẽ trả về danh sách thực thể và gate tự động chuyển sang trạng thái `BLOCKED` kèm lý do hành động được.

#### Câu 3: Điểm khác biệt giữa trạng thái WARNING và BLOCKED trong Release Gate là gì?
> **Trả lời**: 
> - `BLOCKED` (Ngăn chặn phát hành): Áp dụng cho các lỗi nghiêm trọng (CRITICAL/HIGH) như rò rỉ secret, lộ PII, thiếu khóa chính, hoặc RAG sinh ảo giác (faithfulness < 0.80).
> - `WARNING` (Cảnh báo nhưng vẫn cho phép release): Áp dụng cho các lỗi thứ cấp (MEDIUM) như độ trễ P95 hơi cao (>2.5s) hoặc bài giảng thiếu mô tả chi tiết, giúp tránh nghẽn luồng phát hành không cần thiết.

#### Câu 4: Task 27 tái sử dụng thành phần nào từ các task trước?
> **Trả lời**: Task 27 tái sử dụng trực tiếp công cụ `PIIScannerService` từ `BaoCao_Task25/src/services/pii_scanner.py` để quét rò rỉ bảo mật và quyền riêng tư, không cần viết lại biểu thức chính quy (regex) nhận diện PII.

#### Câu 5: Nếu có một bài kiểm thử QA thất bại, giảng viên hoặc kỹ sư nhận được thông tin gì để khắc phục?
> **Trả lời**: Hệ thống trả về danh sách `findings` kèm trường `actionable_fix` cụ thể. Ví dụ: thay vì chỉ báo "Lỗi RAG", gate ghi rõ: *"Điểm trung thực Faithfulness (0.65) < 0.80. Hành động khắc phục: Tinh chỉnh prompt để ép buộc mô hình trích dẫn ngữ cảnh và hiệu chuẩn ngưỡng tương đồng cosin."*
