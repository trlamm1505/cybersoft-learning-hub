# BÀI TẬP LỚN SỐ 2 (CAPSTONE DA-02): PHÂN TÍCH TỒN KHO & VẬN HÀNH LOGISTICS ĐA KÊNH
## CYBERSOFT RETAIL & SUPPLY CHAIN NETWORK (INVENTORY & OPERATIONS ANALYTICS)

* **Mã dự án**: `CAPSTONE-DA-02`
* **Đối tượng**: Học viên Chuyên ngành Phân tích Dữ liệu (Data Analyst Track) — CyberSoft Academy
* **Thời lượng hoàn thành khuyến nghị**: 8 — 12 giờ làm việc độc lập
* **Công cụ áp dụng**: SQL (SQLite / PostgreSQL), Python (Pandas / Matplotlib), Excel / PowerBI Dashboard

---

## 1. BỐI CẢNH DOANH NGHIỆP (BUSINESS CONTEXT)

CyberSoft Retail & Logistics Network là chuỗi phân phối thiết bị công nghệ, học cụ kỹ thuật và phụ kiện văn phòng thông minh hàng đầu với mạng lưới gồm 3 Trung tâm Phân phối (Distribution Centers - DCs):
1. **Kho Trung Tâm Hà Nội (WH-HN01)**: Phụ trách thị trường miền Bắc (Diện tích 5,000 m2).
2. **Kho Miền Trung Đà Nẵng (WH-DN01)**: Trạm trung chuyển miền Trung (Diện tích 2,500 m2).
3. **Kho Tổng TP. Hồ Chí Minh (WH-HCM01)**: Kho tổng quy mô lớn nhất miền Nam (Diện tích 8,000 m2).

Doanh nghiệp hiện quản lý danh mục 50 mã sản phẩm (SKUs) thuộc 5 ngành hàng chiến lược: *Electronics, Office Equipment, Hardware Kits, Peripherals, Audio Devices*.

Trong năm tài chính 2024, Ban Điều hành nhận thấy nhiều tín hiệu bất ổn nghiêm trọng trong chuỗi cung ứng:
* Ban Giám đốc Tài chính (CFO) bày tỏ lo ngại về lượng vốn lưu động bị ứ đọng trong kho trong khi lãi suất vay ngân hàng gia tăng.
* Khối Kinh doanh (Sales) liên tục phàn nàn về tình trạng một số mặt hàng bán chạy bị đứt hàng (Stockouts), trong khi một số mặt hàng khác lại dư thừa nghiêm trọng.
* Ban Vận hành (COO) phát hiện các vấn đề chênh lệch giữa số liệu sổ sách kế toán (Book Inventory) và thực tế kiểm kê (Physical Inventory), cùng các chi phí hư hỏng, phế phẩm chưa được làm rõ nguyên nhân.

Với vai trò là **Lead Data Analyst** của CyberSoft, bạn được giao trọng trách phân tích toàn diện sổ cái dịch chuyển kho, kiểm toán số liệu, xử lý các ngoại lệ nghiệp vụ và xây dựng Hệ thống Báo cáo Điều hành Chuỗi Cung ứng (Supply Chain Executive BI) phục vụ Ban Giám đốc.

---

## 2. 10 CÂU HỎI NGHIỆP VỤ TRỌNG YẾU TỪ BAN ĐIỀU HÀNH (C-LEVEL STAKEHOLDER QUESTIONS)

1. **COO (Giám đốc Vận hành)**: Tình trạng tồn kho hiện tại trên toàn mạng lưới ra sao? Tỷ lệ đáp ứng đơn hàng và năng lực phân phối giữa các vùng miền có cân đối không?
2. **CFO (Giám đốc Tài chính)**: Tổng giá trị vốn đang bị đọng trong kho hàng là bao nhiêu? Hệ số vòng quay tồn kho (Inventory Turnover) và số ngày tồn kho bình quân (DOH) trong năm 2024 đạt bao nhiêu?
3. **Warehouse Director (Giám đốc Kho bãi)**: Tồn kho đang được phân bổ như thế nào giữa 3 kho (HN, DN, HCM)? Có kho nào đang chịu áp lực quá tải hoặc sử dụng không gian kém hiệu quả không?
4. **Procurement Lead (Trưởng phòng Mua hàng)**: Những mã sản phẩm nào đang chạm hoặc dưới ngưỡng Điểm tái đặt hàng (Reorder Point - ROP) cần phải phát hành đơn mua hàng (PO) khẩn cấp?
5. **Head of Sales (Giám đốc Kinh doanh)**: Có mã sản phẩm nào bị đứt hàng hoàn toàn (Stockout) trong năm không? Tác động tiêu cực ước tính tới doanh thu và khách hàng là gì?
6. **Internal Auditor (Trưởng ban Kiểm toán Nội bộ)**: Mức độ thất thoát hàng hóa qua 4 kỳ kiểm kê thực tế định kỳ là bao nhiêu (Shrinkage Loss)? Nguyên nhân xuất phát từ đâu (trộm cắp, sai sót quét mã hay hao hụt tự nhiên)?
7. **QA & Maintenance Lead (Trưởng bộ phận Kiểm định & Bảo quản)**: Chi phí hàng hỏng hóc, xuất hủy phế phẩm (Scrap Cost) trong năm là bao nhiêu? Những nhóm sản phẩm nào có tỷ lệ hư hao cao nhất?
8. **Logistics Coordinator (Điều phối viên Vận chuyển)**: Các hoạt động điều chuyển hàng hóa liên kho (Inter-Warehouse Transfers) có được đối soát cân bằng không? Có tồn tại các lô hàng "đang đi đường" (In-Transit) bị treo qua kỳ kế toán không?
9. **Category Manager (Trưởng ngành hàng)**: Ngành hàng nào đang chiếm dụng tỷ trọng vốn lớn nhất? Mối quan hệ giữa giá vốn hàng bán (COGS) và mức tồn kho của từng ngành hàng như thế nào?
10. **CEO (Tổng Giám đốc)**: Bản kế hoạch hành động 90 ngày (90-Day Action Plan) đề xuất để tối ưu hóa vốn lưu động, giảm chi phí lưu kho và nâng cao năng lực cạnh tranh chuỗi cung ứng là gì?

---

## 3. LỘ TRÌNH 12 NHIỆM VỤ KỸ THUẬT (TECHNICAL TASKS ROADMAP)

* **Nhiệm vụ 01 (Data Audit & Sanity Check)**: Kiểm toán quy mô dữ liệu thô, xác thực tính toàn vẹn khóa ngoại giữa 6 bảng dữ liệu.
* **Nhiệm vụ 02 (Beginning Stock Accounting)**: Lọc và xác minh số dư đầu kỳ năm 2024 từ sổ cái, kiểm tra tính đầy đủ của 50 SKU tại 3 kho.
* **Nhiệm vụ 03 (Movement Classification & Ledger Dynamics)**: Phân loại và tổng hợp các loại hình dịch chuyển theo chiều nhập/xuất (IN/OUT).
* **Nhiệm vụ 04 (SKU Ending Inventory & Valuation)**: Tính toán số lượng tồn kho vật lý và giá trị tồn kho theo phương pháp Moving Average Cost cho 50 SKU.
* **Nhiệm vụ 05 (Multi-DC Regional Breakdown)**: Phân bổ tồn kho theo 3 trung tâm phân phối và đánh giá tỷ trọng giá trị theo từng miền.
* **Nhiệm vụ 06 (Category Capital Allocation)**: Phân tích cơ cấu danh mục 5 ngành hàng và tỷ trọng phân bổ vốn lưu động.
* **Nhiệm vụ 07 (COGS Computation)**: Tính toán chính xác giá vốn hàng bán cho toàn bộ các đơn xuất bán trong năm 2024.
* **Nhiệm vụ 08 (Inventory Turnover & DOH)**: Xây dựng công thức tính Vòng quay tồn kho (COGS / Tồn kho bình quân) và Số ngày bán hàng tồn kho (365 / Turnover).
* **Nhiệm vụ 09 (Safety Stock & Reorder Point Alerts)**: So sánh tồn kho thực tế với ngưỡng ROP quy định, gắn cờ cảnh báo các SKU thiếu hàng nguy cấp.
* **Nhiệm vụ 10 (Audit Discrepancy & Shrinkage Loss)**: Phân tích chênh lệch kiểm kê thực tế, tính toán tổng tổn thất tài chính do hao hụt và phế phẩm.
* **Nhiệm vụ 11 (Inter-Warehouse Transfer Reconciliation)**: Đối soát cân bằng các phiếu xuất điều chuyển (TRANSFER_OUT) và nhập điều chuyển (TRANSFER_IN), phát hiện các lô hàng đang đi đường.
* **Nhiệm vụ 12 (Executive BI Dashboard & Strategic Memo)**: Đóng gói kết quả thành Executive BI Dashboard (hoặc mô hình Excel 5 sheets) kèm Bản ghi nhớ Điều hành (Executive Memo) 2 trang gửi Ban Giám đốc.

---

## 4. XỬ LÝ 8 NGOẠI LỆ NGHIỆP VỤ (BUSINESS EDGE CASES IN DIRTY DATA)

Bộ dữ liệu kiểm toán `data/dirty/` chứa 8 ngoại lệ nghiệp vụ thực tế mà bạn bắt buộc phải phát hiện và xử lý:
1. **Negative Stock Anomaly (Tồn kho âm cục bộ)**: Do độ trễ nhập liệu, phiếu xuất bán được ghi nhận trước phiếu nhập PO cùng ngày.
2. **In-Transit Asymmetry (Hàng đang điều chuyển qua đêm)**: Phiếu xuất điều chuyển cuối năm chưa có phiếu nhập tương ứng tại kho đích.
3. **Damaged / Quarantine Stock (Hàng phế phẩm / Hàng cách ly)**: Bản ghi xuất hủy bị nhập sai dấu hoặc hàng hỏng chưa trừ khỏi tồn kho khả dụng.
4. **Uninspected Customer Returns (Hàng khách trả chưa kiểm định)**: Hàng trả về nhưng ghi chú chưa qua QA, không được cộng ngay vào hàng có thể bán.
5. **Missing Audit Adjustment (Thiếu bút toán điều chỉnh kiểm kê)**: Biên bản kiểm kê thực tế ghi nhận thiếu hụt nhưng sổ cái chưa hạch toán điều chỉnh.
6. **Barcode Double-Scan (Quét mã vạch trùng lặp)**: Ghi nhận 2 bản ghi xuất kho trùng nhau trong vòng vài giây cho cùng một chứng từ.
7. **Supplier Delivery Lead Time Spike (Nhà cung cấp giao trễ đột biến)**: Đơn hàng PO bị trễ giao hàng nghiêm trọng làm sai lệch Lead Time lý thuyết.
8. **Null / Zero Unit Cost (Thiếu giá vốn)**: Bản ghi có đơn giá vốn bằng 0 hoặc NULL làm sai lệch định giá tài sản kho.

---

## 5. QUY CHUẨN NỘP BÀI (SUBMISSION DELIVERABLES)

Học viên nộp bài bao gồm:
1. Thư mục mã nguồn truy vấn: `analysis_queries.sql` (hoặc `analysis_pipeline.py`).
2. Tệp bảng tính mô hình hóa: `CyberSoft_DA02_Inventory_Model.xlsx` (hoặc file BI `.pbix`).
3. Bản ghi nhớ điều hành: `EXECUTIVE_MEMO.pdf` (hoặc định dạng Markdown).
4. Bản tự đối soát checklist: `submission_checklist.md`.
