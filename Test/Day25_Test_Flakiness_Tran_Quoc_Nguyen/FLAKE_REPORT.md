# BÁO CÁO NGÀY 25 - TEST FLAKINESS VÀ ĐỘ TIN CẬY CI

**Người thực hiện:** Trần Quốc Nguyên  
**Ngày kiểm tra:** 10/10/2026  
**Dự án:** CyberSoft Learning Hub  
**Kết luận:** PASS trong phạm vi kiểm tra

## 1. Mục tiêu

Chạy lặp nhóm test smoke quan trọng, phát hiện trường hợp cùng một phiên bản mã nguồn nhưng kết quả lúc PASS lúc FAIL, phân biệt lỗi sản phẩm với lỗi hạ tầng và đề xuất cách kiểm soát quarantine.

## 2. Phạm vi

| Nhóm | File test | Số test mỗi vòng | Số vòng |
|---|---:|---:|---:|
| FE critical smoke | 5 file: phân quyền StudentRoute, Admin, quản lý lớp, Teacher Dashboard, Student Classes | 33 | 10 |
| BE critical smoke | 5 file: student guard, thu hồi role, class admin, student classes, teacher analytics | 104 | 10 |

Tổng số assertion đã thực thi: **1.370** (330 FE + 1.040 BE).

## 3. Kết quả thực tế

| Nhóm | PASS | FAIL | Flake quan sát | Flake rate |
|---|---:|---:|---:|---:|
| FE critical smoke | 10/10 vòng | 0 | 0 | 0% |
| BE critical smoke | 10/10 vòng | 0 | 0 | 0% |
| Tổng | 20/20 lượt lệnh | 0 | 0 | 0% |

Thời gian trung bình của lần chạy bàn giao cuối: FE khoảng **1,73 giây/vòng**, BE khoảng **6,19 giây/vòng**.

Không có test nào chuyển trạng thái PASS → FAIL hoặc FAIL → PASS, vì vậy **chưa phát hiện flaky test** trong phạm vi này. Critical smoke được đánh giá ổn định tại thời điểm kiểm tra.

## 4. Sự cố hạ tầng được tách riêng

Lần chạy thử ban đầu trong môi trường sandbox báo `EPERM realpath` tại thư mục Temp của Windows. Đây là lỗi quyền truy cập của test runner, xảy ra trước khi Jest thực thi test, không phải lỗi chức năng và không được tính vào flake rate sản phẩm. Khi chạy Jest trong môi trường terminal bình thường, 10/10 vòng đều PASS.

Phân loại: **Test infrastructure / environment configuration**.  
Biện pháp: chạy CI bằng workspace có quyền đọc/ghi thư mục temp/cache; lưu log runner riêng; không đổi kết quả FAIL thành PASS bằng retry.

## 5. Cách tính

- Một test chỉ được xem là flaky khi cùng commit, cùng cấu hình và dữ liệu nhưng có cả kết quả PASS và FAIL qua các vòng.
- Flake rate quan sát = số lần chạy thất bại không ổn định / tổng số lần chạy × 100%.
- Không tính lỗi setup xảy ra trước khi test bắt đầu vào lỗi chức năng; vẫn phải ghi nhận riêng để cải thiện CI.
- Không dùng retry vô hạn hoặc retry để che failure.

## 6. Đánh giá nghiệm thu

- [x] Chạy lặp test và lưu bằng chứng.
- [x] Phân biệt lỗi test/hạ tầng với lỗi sản phẩm.
- [x] Không retry để che lỗi.
- [x] Có quarantine policy, owner và deadline bắt buộc.
- [x] Critical smoke không quan sát thấy flaky trong 10 vòng.
- [x] Có lệnh độc lập để tester tự chạy lại.

## 7. Lệnh chạy lại

Từ PowerShell:

```powershell
cd D:\thuctap\cybersoft-learning-hub
powershell -ExecutionPolicy Bypass -File .\Test\Day25_Test_Flakiness_Tran_Quoc_Nguyen\run_flake_check.ps1 -Iterations 10
```

Kết quả mới sẽ nằm trong `reports/flake-runs.csv`, `reports/flake-report-latest.md` và `reports/logs/`.

## 8. Kết luận

Nhóm critical smoke được chọn hiện ổn định với flake rate quan sát bằng 0%. Kết quả này chỉ áp dụng cho commit và môi trường đã kiểm tra, không khẳng định toàn bộ hệ thống vĩnh viễn không flaky. Tiếp tục theo dõi trên CI tối thiểu 7 ngày hoặc 100 lần chạy để có xu hướng dài hạn.

