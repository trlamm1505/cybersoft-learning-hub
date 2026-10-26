# SÁCH GIẢI PHÁP ĐIỀU HÀNH & HƯỚNG DẪN GIẢNG VIÊN — CAPSTONE DA-02
## SUPPLY CHAIN & MULTI-WAREHOUSE INVENTORY OPTIMIZATION

Tài liệu hướng dẫn nghiệp vụ cao cấp dành cho Giảng viên hướng dẫn Capstone DA-02 tại CyberSoft Academy, cung cấp đáp án chi tiết và phân tích sâu sắc cho 10 câu hỏi nghiệp vụ chiến lược từ Ban Điều hành Doanh nghiệp (C-Level).

---

### CÂU HỎI 01 (COO / HEAD OF SUPPLY CHAIN): TỔNG THỂ TỒN KHO VÀ NĂNG LỰC ĐÁP ỨNG MẠNG LƯỚI?
* **Số liệu Ground Truth**:
  - Tổng lượng tồn kho vật lý toàn hệ thống tính đến 31/12/2024: **9,272 units** (trên tổng số 50 mã SKU).
  - Tồn kho đầu kỳ (01/01/2024): 5,317 units -> Tăng ròng 3,955 units (+74.4%) trong năm 2024.
* **Đánh giá chuyên sâu**: Lượng hàng tồn kho tăng mạnh phản ánh chính sách tích trữ để phòng ngừa đứt gãy chuỗi cung ứng hoặc sự sụt giảm nhu cầu tiêu thụ so với dự báo đầu năm. Năng lực sẵn sàng giao hàng duy trì ở mức cao nhưng tiềm ẩn nguy cơ ứ đọng vốn lưu động.

---

### CÂU HỎI 02 (CFO): GIÁ TRỊ VỐN TỒN KHO VÀ HIỆU QUẢ SỬ DỤNG VỐN (INVENTORY TURNOVER)?
* **Số liệu Ground Truth**:
  - Tổng giá trị tồn kho cuối kỳ (Ending Valuation): **USD 867,636.11** (theo phương pháp Moving Average Cost).
  - Giá vốn hàng bán cả năm (COGS): **USD 814,742.22**.
  - Tồn kho bình quân (Average Inventory): **USD 670,536.26**.
  - Hệ số vòng quay tồn kho (Inventory Turnover): **1.22x / năm**.
  - Số ngày bán hàng tồn kho (Days of Inventory on Hand - DOH): **300.4 ngày** (~10 tháng tồn kho).
* **Khuyến nghị tài chính**: Chỉ số DOH lên tới 300.4 ngày là mức rất cao so với chuẩn ngành bán lẻ thiết bị công nghệ (chuẩn thông thường 60 - 90 ngày). CFO cần kích hoạt ngay chương trình giải phóng hàng tồn kho chậm luân chuyển (Slow-moving / Dead stock) để giải phóng ít nhất $300,000 vốn lưu động.

---

### CÂU HỎI 03 (WAREHOUSE DIRECTOR): SỨC CHỨA VÀ PHÂN BỔ HÀNG TẠI 3 TRUNG TÂM PHÂN PHỐI?
* **Số liệu Ground Truth**:
  - **Kho Đà Nẵng (WH-DN01)**: 3,092 units (Trị giá: $307,557.21 — chiếm 35.45% tổng giá trị).
  - **Kho TP. Hồ Chí Minh (WH-HCM01)**: 3,429 units (Trị giá: $306,962.12 — chiếm 35.38% tổng giá trị).
  - **Kho Hà Nội (WH-HN01)**: 2,751 units (Trị giá: $253,116.78 — chiếm 29.17% tổng giá trị).
* **Đánh giá vận hành**: Phân bổ tồn kho tương đối đồng đều giữa 3 miền. Tuy nhiên, Kho Đà Nẵng có diện tích nhỏ nhất (2,500 m2) nhưng đang lưu trữ tới 3,092 units (chiếm mật độ thể tích cao nhất), tạo áp lực nghẽn lối đi và tăng rủi ro va đập hàng hóa. Cần tái cấu trúc dòng chảy để dồn hàng về Kho Tổng HCM (8,000 m2).

---

### CÂU HỎI 04 (PROCUREMENT LEAD): DANH SÁCH CẢNH BÁO TÁI ĐẶT HÀNG (REORDER POINT ALERTS)?
* **Số liệu Ground Truth**:
  - Có đúng **10 mã SKU** đang ở dưới hoặc chạm ngưỡng Điểm đặt hàng lại (Reorder Point - ROP).
  - Các mã SKU nguy cấp nhất: PROD-019 (IoT Kit ESP32), PROD-008 (CyberKey Pro), PROD-034 (Thunderbolt 4 Cable)...
* **Hành động đề xuất**: Phòng Mua hàng cần phát hành ngay Purchase Orders bổ sung cho 10 mã SKU này với nhà cung cấp có Lead Time ngắn nhất nhằm tránh nguy cơ gián đoạn bán hàng trong Quý 1 năm tiếp theo.

---

### CÂU HỎI 05 (HEAD OF SALES): CÁC SKU BỊ ĐỨT GÃY NGUỒN CUNG (STOCKOUTS)?
* **Số liệu Ground Truth**:
  - Có đúng **1 mã SKU** bị đứt hàng hoàn toàn (Ending Stock = 0): PROD-041 (CyberSound ANC Headphone).
* **Đánh giá tác động**: Việc đứt hàng sản phẩm chủ lực phân khúc Audio ANC khiến doanh nghiệp mất doanh thu ước tính khoảng $12,500 mỗi tháng và suy giảm điểm hài lòng của khách hàng (CSAT). Cần kích hoạt quy trình điều chuyển khẩn cấp từ kho vệ tinh hoặc thương thảo giao hàng gấp (Expedited Shipping).

---

### CÂU HỎI 06 (FINANCE AUDITOR): KIỂM TOÁN THẤT THOÁT HÀNG HÓA QUA 4 KỲ KIỂM KÊ (SHRINKAGE)?
* **Số liệu Ground Truth**:
  - Tổng số vụ chênh lệch âm (Physical < Book): 18 lượt kiểm kê có phát sinh thất thoát.
  - Tổng thiệt hại tài chính do hao hụt (Shrinkage Loss): **USD 3,076.24** (chiếm 0.35% tổng giá trị kho).
  - Nguyên nhân chính: 65% do thất thoát trong quá trình đóng gói/chia lẻ linh kiện nhỏ (Pilferage/Scan Error), 35% do sai số dung sai định mức kiểm đếm tự nhiên (Normal Variance).
* **Biện pháp khắc phục**: Thiết lập hệ thống camera giám sát khu vực chia chọn và áp dụng quét mã vạch 2 lớp (Double-Scan Verification) tại cửa xuất.

---

### CÂU HỎI 07 (OPERATIONS LEAD): CHI PHÍ PHẾ PHẨM, HÀNG HỎNG HÓC TRONG KHO (SCRAP LOSS)?
* **Số liệu Ground Truth**:
  - Có 27 phiếu xuất hủy hàng hỏng trong năm 2024.
  - Tổng giá trị xuất hủy phế phẩm: **USD 3,712.41**.
* **Nguyên nhân cốt lõi**: Hàng vỡ do xếp dỡ thủ công và các kit thực hành phần cứng bị ẩm mạch điện trong mùa mưa tại Kho Đà Nẵng và Hà Nội. Cần trang bị thêm giá kệ pallet đạt chuẩn và hệ thống hút ẩm công nghiệp.

---

### CÂU HỎI 08 (LOGISTICS LEAD): HIỆU QUẢ ĐIỀU CHUYỂN LIÊN KHO & HÀNG ĐANG ĐI ĐƯỜNG (IN-TRANSIT)?
* **Số liệu Ground Truth**:
  - Tổng số lượt điều chuyển liên kho: 112 lượt xuất (`TRANSFER_OUT`) và 112 lượt nhập (`TRANSFER_IN`).
  - Toàn bộ các lô hàng trong bộ dữ liệu chuẩn sạch (Clean Data) đều đã cập cảng đích an toàn trước thời điểm kết thúc năm tài chính.
  - Trong bộ dữ liệu kiểm toán (Dirty Data), phát hiện 1 lô hàng 25 units trị giá $2,125.00 (`TRF-INTRANSIT-88`) xuất từ ngày 30/12 chưa có phiếu nhập.
* **Quy tắc kế toán**: Lô hàng này phải được phân loại vào tài khoản "Hàng mua đang đi đường" và không được ghi nhận là thất thoát.

---

### CÂU HỎI 09 (CATEGORY MANAGER): CƠ CẤU VỐN VÀ HIỆU QUẢ THEO TỪNG NGÀNH HÀNG?
* **Số liệu Ground Truth**:
  - **Hardware Kits**: 2,087 units — $196,811.59 (chiếm 22.68% vốn tồn kho)
  - **Peripherals**: 1,877 units — $193,051.39 (chiếm 22.25% vốn)
  - **Electronics**: 2,126 units — $183,849.18 (chiếm 21.19% vốn)
  - **Audio Devices**: 1,419 units — $147,030.62 (chiếm 16.95% vốn)
  - **Office Equipment**: 1,763 units — $146,893.33 (chiếm 16.93% vốn)
* **Nhận xét**: Ngành Hardware Kits và Peripherals đang giữ tỷ trọng vốn lớn nhất. Cần áp dụng ma trận ABC/FSN để cắt giảm các mã SKU thuộc nhóm C (chậm luân chuyển, giá trị thấp).

---

### CÂU HỎI 10 (CEO): KẾ HOẠCH HÀNH ĐỘNG 90 NGÀY TỐI ƯU HÓA CHUỖI CUNG ỨNG?
* **Chiến lược 3 mũi nhọn**:
  1. **Tối ưu vốn lưu động (Tháng 1)**: Đóng băng mua mới cho các SKU có DOH > 180 ngày; tổ chức chương trình khuyến mãi Bundle sản phẩm tồn kho chậm luân chuyển để thu hồi tối thiểu $250,000 tiền mặt.
  2. **Tái cân bằng năng lực kho bãi (Tháng 2)**: Điều chuyển bớt 800 units từ Kho Đà Nẵng về Kho Tổng HCM để giảm mật độ quá tải; thiết lập lại ngưỡng Reorder Point (ROP) động theo mùa.
  3. **Số hóa kiểm toán & Ngăn ngừa thất thoát (Tháng 3)**: Tích hợp thiết bị cầm tay RFID/Barcode Scanner trực tiếp vào sổ cái WMS; áp dụng quy trình kiểm kê cuốn chiếu (Cycle Counting) hàng tuần thay vì kiểm kê quý.
