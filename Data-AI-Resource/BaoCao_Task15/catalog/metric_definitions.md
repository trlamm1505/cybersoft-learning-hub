# CYBERSOFT RESOURCE QUALITY & OBSERVABILITY FRAMEWORK (CRQOF)
## ĐỊNH NGHĨA VÀ BẢN ĐẶC TẢ BỘ CHỈ SỐ ĐO LƯỜNG CHẤT LƯỢNG TÀI NGUYÊN (METRIC DEFINITIONS)

**Mã tài liệu**: `CRQOF-METRICS-SPEC-V01`  
**Phiên bản**: `v0.1.0`  
**Tác giả phụ trách**: Đào Trung Kiên — Data & AI Resource Engineer  
**Hệ thống áp dụng**: CyberSoft Data & AI Lab (Dataset Registry, Quality Harness, Project Bank & AI Pipelines)  

---

## 1. TỔNG QUAN HỆ THỐNG ĐO LƯỜNG CHẤT LƯỢNG
Nhằm loại bỏ hoàn toàn việc đánh giá cảm tính và bảo đảm mọi bộ dữ liệu, bài tập lớn (Capstone) đưa vào giảng dạy tại CyberSoft Academy đều đạt chuẩn công nghiệp, khung đo lường **CRQOF v0.1** thiết lập hệ thống 10 chỉ số đo lường định lượng và **Chỉ số Chất lượng Tài nguyên Tổng hợp (Resource Quality Index - RQI)**.

Khung đo lường này phục vụ làm nền tảng toán học cho **Resource Quality Dashboard v0.1** tại Task 15.

---

## 2. CÔNG THỨC CHỈ SỐ CHẤT LƯỢNG TỔNG HỢP (RQI)

Chỉ số **RQI (Resource Quality Index)** là điểm số có trọng số kết hợp từ 7 trụ cột đo lường chất lượng cốt lõi:

$$\text{RQI} = 0.20 \times \text{QG} + 0.15 \times \text{SV} + 0.15 \times \text{CP} + 0.15 \times \text{AL} + 0.15 \times \text{TPR} + 0.10 \times \text{RO} + 0.10 \times \text{BI}$$

Trong đó:
* $\text{QG}$: Quality Gate Score (0 – 100) — Trọng số 20%
* $\text{SV}$: Schema Validity Score (0 – 100) — Trọng số 15%
* $\text{CP}$: Resource Completeness Score (0 – 100) — Trọng số 15%
* $\text{AL}$: Anti-Leakage Compliance Score (0 – 100) — Trọng số 15%
* $\text{TPR}$: Test Pass Rate (0 – 100) — Trọng số 15%
* $\text{RO}$: Rubric Objectivity Score (0 – 100) — Trọng số 10%
* $\text{BI}$: Business Integrity & Triangulation (0 – 100) — Trọng số 10%

### Phân Cấp Chất Lượng (Quality Tiers) Dựa Trên RQI:
* **Gold Tier ($\text{RQI} \ge 95.0$)**: Tài nguyên hoàn hảo, chuẩn mực công nghiệp, sẵn sàng triển khai chính thức trên toàn hệ thống LMS.
* **Silver Tier ($85.0 \le \text{RQI} < 95.0$)**: Đạt chuẩn chấp nhận phát hành (Production-ready), có một số khuyến nghị hoàn thiện nhẹ về tài liệu.
* **Bronze Tier ($70.0 \le \text{RQI} < 85.0$)**: Đạt chuẩn nội bộ thử nghiệm (Staging/Beta), cần bổ sung test cases hoặc tài liệu giàn giáo trước khi công bố rộng rãi.
* **Quarantined Tier ($\text{RQI} < 70.0$ hoặc vi phạm Quality Gate)**: Tài nguyên vi phạm chất lượng nghiêm trọng, bị cách ly tự động vào kho kiểm soát bẫy dữ liệu (Quarantine Zone).

---

## 3. BẢNG CHI TIẾT 10 CHỈ SỐ THÀNH PHẦN

| Mã hiệu | Tên chỉ số | Trọng số | Ngưỡng đạt | Công thức tính | Ý nghĩa nghiệp vụ |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **QG** | Quality Gate Score | 20% | $\ge 80.0\%$ | $\frac{\text{Passed Checks}}{\text{Total Checks}} \times 100$ | Đo lường độ sạch dữ liệu, kiểm toán khóa chính, ràng buộc toàn vẹn và outliers. |
| **SV** | Schema Validity Score | 15% | $100.0\%$ | $100 \text{ if valid else } 0$ | Xác thực cấu trúc dữ liệu và tệp Manifest với JSON Schema Draft 2020-12. |
| **CP** | Resource Completeness | 15% | $\ge 85.0\%$ | $\frac{\text{Artifacts Present}}{\text{Artifacts Expected}} \times 100$ | Kiểm tra sự hiện diện của 5 khối tài nguyên: Data, Docs, Starter Kit, Solutions, Tests. |
| **AL** | Anti-Leakage Score | 15% | $100.0\%$ | $100 \text{ if clean else } 0$ | Chốt chặn Zero Answer Leakage: Miền student không được chứa tệp giải hay đáp án ẩn. |
| **TPR** | Test Pass Rate | 15% | $100.0\%$ | $\frac{\text{Passed Pytest}}{\text{Total Pytest}} \times 100$ | Độ tin cậy kiểm thử hồi quy tự động độc lập qua Pytest. |
| **RO** | Rubric Objectivity Score | 10% | $\ge 90.0\%$ | $\frac{\text{Quantitative Points}}{\text{Total Points}} \times 100$ | Tỷ lệ điểm số barem quy định dung sai số học chính xác thay vì đánh giá cảm tính. |
| **BI** | Business Integrity | 10% | $\ge 90.0\%$ | $100 - \text{Delta Error \%}$ | Đối soát 3 chiều (Triangulation) Delta = 0, Ground Truth Precision trong RAG. |
| **DC** | Documentation Coverage | Theo dõi | $\ge 80.0\%$ | $\frac{\text{Docs Present}}{\text{Docs Target}} \times 100$ | Đo lường hệ thống giàn giáo: Data Dict, Hints 3 cấp độ, Cẩm nang bẫy lỗi. |
| **PB** | Performance & Latency | Theo dõi | $\ge 80.0\%$ | $100 \text{ if within budget else } 50$ | Khống chế P95 Latency $\le 1,500\text{ ms}$ và Token Cost $\le \$0.050 / 1k\text{ queries}$. |
| **PII** | Privacy & PII Safety | Điều kiện | $100.0\%$ | $100 \text{ if PII safe else } 0$ | Bảo vệ dữ liệu cá nhân, cấm thông tin định danh thật của học viên và khách hàng. |

---

## 4. TIÊU CHÍ DRILL-DOWN VÀ KIỂM TOÁN LỖI (AUDIT DRILL-DOWN)
Khi một tài nguyên rơi vào trạng thái Quarantined hoặc có cảnh báo (Warnings):
1. **Metadata Inspector**: Xem chi tiết ID, Domain, Level, Track, Phiên bản, Ngày xuất bản, Tác giả và danh sách tệp đính kèm.
2. **Quality Gate Checks Breakdown**: Liệt kê toàn bộ các bài test vi phạm (Null values, Negative prices, Orphan keys).
3. **Audit Log & Violations Viewer**: Hiển thị chính xác dòng dữ liệu hoặc quy tắc schema bị vi phạm, phục vụ giảng viên và kỹ sư phân tích nguyên nhân gốc (Root Cause Analysis).
