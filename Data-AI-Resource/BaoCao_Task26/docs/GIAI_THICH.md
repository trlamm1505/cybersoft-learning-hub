# HƯỚNG DẪN BẢO VỆ NHANH — TASK 26
## TÍCH HỢP VỚI LEARNING PLATFORM (CROSS-PRODUCT INTEGRATION)

### 1. SƠ ĐỒ LUỒNG HOẠT ĐỘNG (FLOW TỔNG QUAN)
```text
[Learning Platform (TTS 02)] 
       │ 1. GET /api/v1/integration/catalog (Lọc theo vai trò: DATA_ANALYST, AI_ENGINEER)
       ▼
[Data Lab Gateway (Task 26)] ─── Đọc danh mục chuẩn hóa (data/catalog.json & Task 21)
       │ 2. POST /api/v1/integration/assignments/resolve (Giảng viên giao bài: resource_id, requested_version)
       ▼
[IntegrationService] ─────────── Thẩm định Data Contract & Khóa Snapshot Hash (SHA-256)
       │ 3. Trả về AssignmentResolveResponse (snapshot_hash, schema, is_immutable_locked=True)
       ▼
[Learning Platform Sandbox] ── Học viên làm bài trên snapshot đã khóa; không bị ảnh hưởng khi Data Lab cập nhật v1.1.0+
       │ 4. POST /api/v1/integration/assignments/validate (Kiểm tra lệch version drift khi nộp bài)
       ▼
[Kết quả xác thực] ───────────── Khớp hash hoàn toàn -> Bài thi hợp lệ và tái lập được 100%.
```

---

### 2. THỨ TỰ ĐỌC FILE KHI GIẢI THÍCH (3-5 PHÚT)
1. **`src/schemas/integration.py`** (Đọc đầu tiên): Xem cấu trúc phong bì `RegistryEnvelope`, `CatalogItem`, `AssignmentResolveRequest/Response`. Đây là "hợp đồng giao tiếp" giữa 2 hệ thống.
2. **`src/services/integration_service.py`** (Đọc thứ hai): Trọng tâm logic xử lý gồm 4 hàm ngắn:
   - `list_catalog`: Lọc tài nguyên theo role/type.
   - `validate_dataset_contract`: Thẩm định schema trước khi xuất bản.
   - `resolve_assignment`: Khóa snapshot hash theo phiên bản.
   - `validate_assignment`: Kiểm tra lệch version drift.
3. **`src/routes/integration.py`** (Đọc thứ ba): Các API endpoint tiếp nhận request và trả về kết quả chuẩn hóa.
4. **`data/catalog.json` & `data/version_registry.json`** (Đọc thứ tư): Dữ liệu danh mục và lịch sử snapshot hash.
5. **`tests/test_immutable_assignment.py` & `test_version_mismatch.py`** (Đọc cuối cùng): Bằng chứng kiểm thử tự động xác nhận cơ chế khóa bất biến và xử lý lỗi hành động được.

---

### 3. 5 CÂU HỎI BẢO VỆ THƯỜNG GẶP VÀ CÂU TRẢ LỜI NGẮN

#### Câu 1: Tại sao cần khóa snapshot hash (SHA-256) khi giảng viên giao bài thay vì chỉ lưu version string?
> **Trả lời**: Nếu chỉ lưu tên version (ví dụ "v1.0.0"), khi Data Lab vô tình cập nhật hoặc sửa đổi file dữ liệu gốc, bài thi của học viên sẽ bị thay đổi kết quả (mất tính tái lập). Khóa bằng SHA-256 đảm bảo môi trường sandbox của học viên luôn trỏ đúng phiên bản nhị phân bất biến tại thời điểm giao.

#### Câu 2: Khi Data Lab phát hành phiên bản mới (ví dụ v1.1.0), học viên đang làm bài phiên bản cũ (v1.0.0) có bị lỗi không?
> **Trả lời**: Hoàn toàn không. API `/assignments/validate` sẽ phát hiện `version_drift_detected = True`, nhưng vì `snapshot_hash` vẫn khớp với bản ghi lưu trữ, hệ thống xác nhận bài làm vẫn an toàn và cho phép học viên tiếp tục làm bài bình thường mà không bị gián đoạn.

#### Câu 3: Hệ thống xử lý thế nào khi giảng viên yêu cầu một phiên bản không tồn tại hoặc đã bị DEPRECATED?
> **Trả lời**: Hệ thống không trả về lỗi 500 mơ hồ, mà trả về lỗi có tính hành động (`suggested_action`):
> - Nếu `VERSION_NOT_FOUND`: Liệt kê danh sách các phiên bản đang khả dụng trong registry để giảng viên chọn.
> - Nếu `VERSION_DEPRECATED`: Nêu rõ lý do ngừng hỗ trợ và chỉ định chính xác phiên bản mới cần thay thế.

#### Câu 4: Task 26 tái sử dụng thành phần nào từ các task trước?
> **Trả lời**: Task 26 tái sử dụng trực tiếp cấu trúc danh mục dữ liệu từ Task 21 (`BaoCao_Task21/src/services/registry_service.py`) và danh mục phát hành từ Task 10 (`BaoCao_Task10/catalog/catalog.json`), chuẩn hóa lại theo Data Contract thống nhất với Learning Platform.

#### Câu 5: Làm sao để chứng minh hệ thống không copy dữ liệu thủ công giữa hai bên?
> **Trả lời**: Hai hệ thống giao tiếp 100% qua REST API Gateway chuẩn hóa (`/api/v1/integration/catalog` và `/assignments/resolve`). Không có bất kỳ file dữ liệu nào được copy thủ công qua lại; Learning Hub chỉ lưu metadata và snapshot hash do API cung cấp.
