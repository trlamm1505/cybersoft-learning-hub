# Đặc tả Tiêu chuẩn Quality Gate & Quy tắc Đánh giá Tự động

## 1. Mục tiêu
Quality Gate của Dataset Registry là chốt chặn kỹ thuật tự động kiểm tra toàn diện mọi tệp dữ liệu và metadata trước khi cho phép xuất bản (Publishing) ra hệ thống dùng chung.

## 2. Các tầng kiểm tra (Multi-tier Evaluation)

| Tầng kiểm tra | Tiêu chí | Ngưỡng đạt | Hành động khi vi phạm |
| :--- | :--- | :---: | :--- |
| **Tier 1: Schema Conformance** | Kiểm tra JSON metadata với `dataset.schema.json` (Task 04). Bắt buộc có `id`, `version`, `domain`, `license`, `pii`, `lineage`, `learning_outcomes`, `tables`. | $100\%$ hợp lệ | **Chặn xuất bản (BLOCKING)** |
| **Tier 2: Governance & PII** | Khai báo rõ ràng mức độ PII (`has_pii`), phương pháp ẩn danh (`synthetic_generation`, `hashing`), và cấm dữ liệu nhạy cảm thực tế. | $100\%$ hợp lệ | **Chặn xuất bản (BLOCKING)** |
| **Tier 3: File & Physical Asset** | Kiểm tra tệp dữ liệu tồn tại trên đĩa, không rỗng ($size > 0$), định dạng chuẩn (CSV/JSON/Markdown). | $100\%$ tồn tại | **Chặn xuất bản (BLOCKING)** |
| **Tier 4: Tabular Integrity (CSV)** | • Trùng lặp khóa chính (PK): $0$ bản ghi trùng<br>• Tỷ lệ ô trống/null bất thường: $< 35\%$ tổng số ô<br>• Không chứa cờ dirty/corrupt fixture | $0$ trùng PK<br>$null < 35\%$ | **Chặn xuất bản (BLOCKING)** |
| **Tier 5: Composite Score Threshold** | Tổng điểm đánh giá chất lượng tổng hợp: $Score = \frac{PassedChecks}{TotalChecks} \times 100\%$ | $\mathbf{\ge 95.0\%}$ | **Chặn xuất bản (BLOCKING)** |

## 3. Trạng thái Vòng đời (State Transitions)
```text
[DRAFT] ───(Validate)───> [UNDER_REVIEW] ───(Gate Pass)───> [PUBLISHED] (Khóa bất biến)
                                │
                                └───(Gate Fail)───> [REJECTED] ───(Sửa data)───> [DRAFT]
```
- Khi rơi vào trạng thái `REJECTED`, hệ thống xuất toàn bộ danh sách `violations` (lỗi vi phạm) kèm mã lỗi để kỹ sư khắc phục.
- Tuyệt đối không cho phép bất kỳ ai (kể cả admin) bypass Quality Gate mà không có bằng chứng audit log.
