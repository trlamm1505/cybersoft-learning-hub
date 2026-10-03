# DANH MỤC 8 BẪY LỖI KINH ĐIỂN CỦA HỌC VIÊN — CAPSTONE DA-02
## INVENTORY OPTIMIZATION & LOGISTICS ANALYTICS

Tài liệu nội bộ dành riêng cho Giảng viên và Trợ giảng (Teaching Assistants) nhằm nhận diện nhanh các lỗi sai tư duy và kỹ thuật phổ biến nhất của học viên khi thực hiện bài tập lớn phân tích kho vận và chuỗi cung ứng.

---

### BẪY LỖI 01: TÍNH TỒN KHO THÔ QUÊN SỐ DƯ ĐẦU KỲ (NAIVE NET CALCULATION)
* **Triệu chứng học viên mắc phải**: Học viên chỉ tính `SUM(quantity IN) - SUM(quantity OUT)` trong năm 2024 mà bỏ qua các dòng ghi nhận số dư đầu kỳ `INIT-BALANCE-2024`.
* **Hậu quả số học**: Tồn kho cuối kỳ bị thiếu hụt 5,317 units và giá trị tài sản bị hụt $473,436.40, dẫn đến hàng loạt SKU bị báo cáo âm hoặc thiếu hàng giả tạo.
* **Nguyên nhân cốt lõi**: Chưa hiểu nguyên lý kế toán kho: `Tồn cuối kỳ = Tồn đầu kỳ + Tổng Nhập - Tổng Xuất`.
* **Hướng dẫn sửa lỗi**: Đảm bảo bao quát toàn bộ sổ cái hoặc tách riêng xử lý số dư đầu kỳ trước khi cộng dồn các giao dịch phát sinh.

---

### BẪY LỖI 02: NHẦM LẪN ĐIỀU CHUYỂN LIÊN KHO VỚI BÁN HÀNG HOẶC MUA HÀNG (TRANSFER DISTORTION)
* **Triệu chứng học viên mắc phải**: Học viên gộp chung `TRANSFER_OUT` vào doanh thu bán hàng hoặc COGS, và gộp `TRANSFER_IN` vào mua hàng PO từ nhà cung cấp bên ngoài.
* **Hậu quả số học**: Làm thổi phồng doanh số bán hàng, sai lệch chỉ số COGS lên tới hơn $80,000 và tính toán sai hoàn toàn vòng quay tồn kho toàn doanh nghiệp.
* **Nguyên nhân cốt lõi**: Nhầm lẫn giữa luồng dịch chuyển nội bộ (Internal Transfer - Net Zero toàn hệ thống) và luồng giao dịch ngoại vi (External Trade).
* **Hướng dẫn sửa lỗi**: Lọc chính xác `movement_type = 'OUTBOUND_SALE'` khi tính giá vốn hàng bán (COGS); điều chuyển nội bộ chỉ làm thay đổi số dư cục bộ tại từng kho chứ không ảnh hưởng tổng tài sản của toàn công ty.

---

### BẪY LỖI 03: GỘP HÀNG HỎNG / CÁCH LY VÀO HÀNG KHẢ DỤNG (QUARANTINE BLIND SPOT)
* **Triệu chứng học viên mắc phải**: Khi tính tồn kho khả dụng để bán (Available to Promise - ATP), học viên lấy tổng tồn kho vật lý mà không trừ đi hàng hỏng (`SCRAP_DAMAGED`) và hàng trả về đang chờ thẩm định QA (`PENDING_INSPECTION`).
* **Hậu quả số học**: Báo cáo số lượng có thể bán cao hơn thực tế, dẫn đến nguy cơ bán khống (overselling) và hủy đơn hàng khi xuất kho.
* **Nguyên nhân cốt lõi**: Không phân biệt giữa "Tồn kho vật lý" (Physical Stock On-Hand) và "Tồn kho thương mại khả dụng" (Available / Sellable Stock).
* **Hướng dẫn sửa lỗi**: Xây dựng công thức: `Available Stock = Physical Stock - Quarantine Stock - Reserved Orders`.

---

### BẪY LỖI 04: TÍNH ĐỊNH GIÁ KHO BẰNG GIÁ NIÊM YẾT BÁN THAY VÌ GIÁ VỐN (VALUATION BASIS ERROR)
* **Triệu chứng học viên mắc phải**: Khi tính tổng giá trị kho hàng (Inventory Valuation), học viên nhân `ending_units` với cột `unit_price` thay vì `unit_cost`.
* **Hậu quả số học**: Báo cáo giá trị tài sản tồn kho vượt mức thực tế từ 40% đến 80%, làm sai lệch bảng cân đối kế toán tài chính.
* **Nguyên nhân cốt lõi**: Không nắm vững chuẩn mực kế toán hàng tồn kho (IAS 02 / VAS 02): Hàng tồn kho phải được ghi nhận theo giá gốc (Cost), không được ghi nhận theo giá bán dự kiến.
* **Hướng dẫn sửa lỗi**: Luôn nhân tồn kho với `unit_cost` khi định giá tài sản kho; `unit_price` chỉ dùng để ước tính doanh thu tiềm năng.

---

### BẪY LỖI 05: ĐẾM TRÙNG HAO HỤT KIỂM KÊ (DOUBLE COUNTING AUDIT SHRINKAGE)
* **Triệu chứng học viên mắc phải**: Học viên cộng gộp cả chênh lệch trong bảng `inventory_audits.csv` và các bút toán điều chỉnh `AUDIT_ADJUSTMENT` trong `inventory_movements.csv` khi tính chi phí thất thoát.
* **Hậu quả số học**: Chi phí hao hụt thất thoát bị nhân đôi lên $6,152.48 thay vì con số thực tế $3,076.24.
* **Nguyên nhân cốt lõi**: Chưa nhận ra rằng bút toán điều chỉnh trong sổ cái chính là sự phản ánh số học của biên bản kiểm kê thực tế.
* **Hướng dẫn sửa lỗi**: Chỉ tính tổn thất tài chính một lần từ bảng kiểm kê hoặc sổ cái, kiểm tra mã tham chiếu `reference_doc = audit_id`.

---

### BẪY LỖI 06: BÌNH QUÂN SỐ HỌC CÁC TỶ LỆ VÒNG QUAY TỒN KHO (UNWEIGHTED TURNOVER AVERAGE)
* **Triệu chứng học viên mắc phải**: Học viên tính vòng quay tồn kho bằng cách tính riêng cho từng ngành hàng rồi lấy trung bình cộng `AVERAGE(turnover_1, turnover_2, ...)`.
* **Hậu quả số học**: Vi phạm nguyên tắc toán tài chính, làm sai lệch chỉ số tổng thể của doanh nghiệp (ra kết quả 1.85x thay vì 1.22x).
* **Nguyên nhân cốt lõi**: Trung bình cộng của các phân số có mẫu số khác nhau không bao giờ bằng phân số tổng.
* **Hướng dẫn sửa lỗi**: Tính theo công thức chuẩn: `Total Turnover = Total COGS / Total Average Inventory`.

---

### BẪY LỖI 07: BỎ QUA ĐỘ TRỄ VẬN CHUYỂN HÀNG ĐANG ĐI ĐƯỜNG (IN-TRANSIT LAG IGNORANCE)
* **Triệu chứng học viên mắc phải**: Khi xuất điều chuyển từ HCM ra Hà Nội vào ngày 30/12/2024, học viên trừ ngay ở kho xuất nhưng không ghi nhận tài sản "Hàng đang đi đường" (In-Transit Inventory).
* **Hậu quả số học**: Tại thời điểm chốt sổ tài chính 31/12/2024, lượng hàng này biến mất khỏi tài sản doanh nghiệp, tạo ra khoảng hở tài sản tạm thời.
* **Nguyên nhân cốt lõi**: Tư duy điểm (point-in-time) thay vì tư duy trạng thái dòng chảy logistics (pipeline inventory).
* **Hướng dẫn sửa lỗi**: Tạo trạng thái ảo `WH-INTRANSIT` hoặc đối soát mã phiếu chuyển kho chưa có ngày nhận.

---

### BẪY LỖI 08: XÓA BỎ DỮ LIỆU TỒN KHO ÂM MỘT CÁCH VỘI VÃ (NEGATIVE STOCK RASH DELETION)
* **Triệu chứng học viên mắc phải**: Khi thấy dữ liệu dirty có thời điểm tồn kho bị âm, học viên dùng lệnh `DROP` loại bỏ luôn các bản ghi xuất hàng.
* **Hậu quả số học**: Làm mất mát dữ liệu bán hàng thực tế, sai lệch doanh thu và báo cáo sai năng lực cung ứng.
* **Nguyên nhân cốt lõi**: Không phân tích nguyên nhân gốc rễ (Root Cause) của tồn kho âm: thực chất là do độ trễ nhập liệu (nhân viên xuất hàng trước khi thư ký kho kịp bấm nhận phiếu PO trên hệ thống).
* **Hướng dẫn sửa lỗi**: Sắp xếp lại chuỗi sự kiện theo logic nghiệp vụ (Re-sequencing), điều chỉnh timestamp hoặc gắn cờ cảnh báo "Data Entry Latency" thay vì xóa bỏ bản ghi.
