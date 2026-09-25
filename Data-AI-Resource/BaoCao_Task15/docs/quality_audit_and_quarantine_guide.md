# HƯỚNG DẪN KIỂM TOÁN LỖI VÀ QUY TRÌNH CÁCH LY TÀI NGUYÊN (QUALITY AUDIT & QUARANTINE GUIDE)

**Dự án**: CyberSoft Data & AI Lab  
**Mã tài liệu**: `CRQOF-AUDIT-GUIDE-V01`  
**Phiên bản**: `v0.1.0`  
**Tác giả**: Đào Trung Kiên — Data & AI Resource Engineer  

---

## 1. MỤC TIÊU CỦA QUY TRÌNH KIỂM TOÁN CHẤT LƯỢNG
Nhằm đảm bảo 100% học liệu số đưa vào giảng dạy tại CyberSoft Academy đạt chuẩn công nghiệp, mọi bộ dữ liệu và bài tập Capstone đều phải trải qua các cổng kiểm soát chất lượng tự động (Quality Gates).

Tài nguyên nào không vượt qua các tiêu chuẩn bắt buộc sẽ tự động bị chuyển vào chế độ **CÁCH LY (QUARANTINE ZONE)** để ngăn chặn việc phát hành ra môi trường học tập thực tế.

---

## 2. NGUYÊN TẮC KÍCH HOẠT CHẾ ĐỘ CÁCH LY (QUARANTINE TRIGGER CRITERIA)
Một tài nguyên bị xếp vào phân hạng **Quarantined Tier** khi rơi vào một trong các trường hợp sau:
1. **Thất bại Quality Gate**: `quality_gate.passed == False` hoặc điểm số `quality_gate.score < 70.0%`.
2. **Vi phạm Schema Bắt Buộc**: Tệp Manifest không tuân thủ JSON Schema Draft 2020-12 (ví dụ: thiếu thuộc tính bắt buộc `lineage` như trường hợp `ds-dirty-test-quarantine`).
3. **Vi Phạm Tính Toàn Vẹn Khóa (Key Integrity Violations)**: Khóa chính trùng lặp hoặc null, khóa ngoại trỏ tới bản ghi không tồn tại (Orphaned Foreign Keys).
4. **Vi Phạm Phòng Vệ Rò Rỉ Đáp Án (Answer Leakage)**: Miền học viên (`student_edition/`) bị phát hiện chứa ground-truth answer, reasoning hoặc citations ẩn.

---

## 3. QUY TRÌNH BÓC TÁCH NGUYÊN NHÂN GỐC (ROOT CAUSE ANALYSIS)
Khi kiểm toán viên hoặc giảng viên phát hiện tài nguyên có huy hiệu **QUARANTINED** trên Dashboard:
1. **Truy cập Tab 'Kiểm Toán Lỗi & Vi Phạm' (Audit Tab)** trên giao diện Streamlit hoặc file JSON snapshot.
2. **Xác định thông điệp vi phạm cụ thể**:
   - Ví dụ: `Schema validation error at [root]: 'lineage' is a required property`.
3. **Kiểm tra tệp Manifest nguồn**:
   - Mở tệp manifest tương ứng trong `registry_store/manifests/`.
   - Bổ sung thông tin nguồn gốc dữ liệu (`lineage`) và các quy tắc kiểm tra khóa chính.
4. **Tái kiểm định**:
   - Chạy lại script kiểm toán `registry_cli.py validate` hoặc `gate_checker.py`.
   - Khi 100% checks thành công, cập nhật trạng thái từ `quarantined/rejected` sang `published`.
