# Ngày 14 — Bộ 12 tester labs trên 6 demo CyberSoft

Bộ lab gồm 3 Manual, 3 API, 3 Data và 3 Automation. Học viên thực chiến trên sáu demo CyberSoft; fault chủ đích được đặt trong fixture JSON/SQLite cục bộ để có thể reset mà không tác động môi trường dùng chung.

## Bắt đầu

1. Mở `01_Lab_Catalog` trong `Day14_Tester_Labs_Quality_Report_GitHub.xlsx` để chọn lab.
2. Đọc `LAB-xx/TASK.md` và điền `LAB-xx/template.csv`.
3. Với demo thật, chỉ dùng tài khoản/dữ liệu của bạn và tự cleanup.
4. Với fixture, chạy `node fixtures/reset.mjs --mode buggy --lab LAB-xx`; sau khi tìm lỗi, kiểm lại bằng mode clean.
5. Không xem `fixtures/manifest.json` hoặc thư mục `instructor/` khi đang đóng vai học viên.

## Môi trường

| Demo | Sản phẩm | Vai trò |
|---|---|---|
| demo1 | TIX đặt vé phim | Manual, Data, Automation |
| demo2 | V Learning | Manual, Data, Automation |
| demo3 | Jira | API CRUD |
| demo4 | Fiverr | API negative |
| demo5 | CyberSoftbnb | Manual functional |
| demo6 | Insove Hospital | API auth |

## Kiểm tra cục bộ

```powershell
node --test fixtures/tests/fixtures.test.mjs
cd automation
npm install
npm run test:smoke
```

LAB-09 tự tạo snapshot SQLite khi chạy:

```powershell
python data/verify_snapshot.py
```

## Nội dung commit lên GitHub

- Commit workbook chính, `LAB-01` đến `LAB-12`, `fixtures/clean`, `fixtures/buggy`, `instructor`, `postman`, `automation/tests`, `data/*.py`, `data/checks.sql` và `reports/`.
- Không commit `node_modules`, Playwright HTML report/trace, fixture runtime, SQLite sinh tự động, environment đã điền token hoặc các thư mục lịch sử.
- Sau khi clone: chạy `npm ci` trong `automation/`, rồi `npm run browsers` nếu máy chưa có Chromium/Chrome phù hợp.

## Trạng thái

- Thiết kế, task, guide, rubric, template và fixture: có đủ 12 lab.
- Demo là hệ thống bên ngoài và có thể thay đổi; endpoint phải đối chiếu Swagger/Network khi chạy.
- LAB-07 và LAB-09 có automated evidence; LAB-04 mới hoàn thành phần Swagger; LAB-10 đang bị chặn bởi tài khoản demo2. Các lab còn lại vẫn cần pilot của người học.
