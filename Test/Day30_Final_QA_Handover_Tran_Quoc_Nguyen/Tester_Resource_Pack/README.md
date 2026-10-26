# Tester Resource Pack

## Mục đích

Thư mục này là mục lục để người nhận mở đúng 12 bài thực hành Tester của Ngày 14. Các lab, hướng dẫn, file mẫu và rubric được giữ tại thư mục nguồn Ngày 14; không sao chép thành nhiều bản để tránh lệch nội dung.

## Bắt đầu nhanh

1. Mở thư mục nguồn [Day14_Bo lab tester thuc te](<../../Day14_Bo lab tester thuc te/>).
2. Xem danh mục và tình trạng hiện tại trong [Day14_Tester_Labs_Quality_v2.xlsx](<../../Day14_Bo lab tester thuc te/Day14_Tester_Labs_Quality_v2.xlsx>), sheet `01_Lab_Catalog`.
3. Chọn lab, đọc `LAB-xx/TASK.md` và dùng `LAB-xx/template.csv` làm mẫu bài nộp. Một số lab có thêm collection, dữ liệu hoặc mã automation; xem bảng bên dưới.
4. Người hướng dẫn dùng `instructor/LAB-xx_GUIDE.md` để xem expected, lỗi có chủ đích và hướng chấm. Đây là tài liệu hướng dẫn, không phát cho học viên trước khi họ làm bài.
5. Chấm theo rubric đã được người hướng dẫn thống nhất. Sheet `04_Rubric` trong workbook có rubric chung 10 điểm: độ bao phủ/căn cứ (4 điểm), khả năng chạy lại (3 điểm), và evidence/phân loại rủi ro (3 điểm).

## Danh mục 12 lab

Các đường dẫn tương đối trong cột “Tài liệu/dữ liệu bổ sung” tính từ thư mục nguồn Day14.

| Lab | Nhóm và nội dung | Hướng dẫn học viên | Mẫu bài nộp | Hướng dẫn người chấm | Tài liệu/dữ liệu bổ sung có sẵn |
|---|---|---|---|---|---|
| LAB-01 | Manual — Bug hunt đăng ký/đăng nhập V Learning | [TASK](<../../Day14_Bo lab tester thuc te/LAB-01/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-01/template.csv>) | [LAB-01_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-01_GUIDE.md>) | Fixture `fixtures/buggy/LAB-01.json` và `fixtures/clean/LAB-01.json` |
| LAB-02 | Manual — Khám phá danh sách phim và đặt vé TIX | [TASK](<../../Day14_Bo lab tester thuc te/LAB-02/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-02/template.csv>) | [LAB-02_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-02_GUIDE.md>) | Fixture buggy/clean; kiểm tra API phim theo hướng dẫn hiện hành |
| LAB-03 | Manual — Tìm phòng và đặt phòng | [TASK](<../../Day14_Bo lab tester thuc te/LAB-03/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-03/template.csv>) | [LAB-03_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-03_GUIDE.md>) | Fixture `LAB-03` buggy/clean |
| LAB-04 | API — Xác thực API bệnh viện | [TASK](<../../Day14_Bo lab tester thuc te/LAB-04/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-04/template.csv>) | [LAB-04_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-04_GUIDE.md>) | [Postman collection](<../../Day14_Bo lab tester thuc te/LAB-04/LAB04_Auth_API.postman_collection.json>); phân biệt Bearer JWT với TokenCybersoft |
| LAB-05 | API — Project và Task CRUD | [TASK](<../../Day14_Bo lab tester thuc te/LAB-05/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-05/template.csv>) | [LAB-05_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-05_GUIDE.md>) | [Postman collection](<../../Day14_Bo lab tester thuc te/LAB-05/LAB05_Postman_Collection.json>); [report mẫu](<../../Day14_Bo lab tester thuc te/LAB-05/LAB05_API_Report.csv>) |
| LAB-06 | API — Negative testing và xử lý lỗi | [TASK](<../../Day14_Bo lab tester thuc te/LAB-06/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-06/template.csv>) | [LAB-06_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-06_GUIDE.md>) | Fixture buggy/clean; endpoint cần đối chiếu với Swagger hiện tại |
| LAB-07 | Data — Kiểm chất lượng dữ liệu phim | [TASK](<../../Day14_Bo lab tester thuc te/LAB-07/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-07/template.csv>) | [LAB-07_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-07_GUIDE.md>) | [Artifact dữ liệu](<../../Day14_Bo lab tester thuc te/LAB-07/LAB07_Data_Check.csv>); fixture buggy/clean |
| LAB-08 | Data — Đối chiếu giao diện và API khóa học | [TASK](<../../Day14_Bo lab tester thuc te/LAB-08/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-08/template.csv>) | [LAB-08_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-08_GUIDE.md>) | Fixture buggy/clean; cần token do người hướng dẫn cấp nếu kiểm demo |
| LAB-09 | Data — Tìm lỗi dữ liệu trên SQLite | [TASK](<../../Day14_Bo lab tester thuc te/LAB-09/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-09/template.csv>) | [LAB-09_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-09_GUIDE.md>) | [CSV kết quả mẫu](<../../Day14_Bo lab tester thuc te/LAB-09/LAB09_Data_Quality_Findings.csv>); [hướng dẫn dữ liệu/reset](<../../Day14_Bo lab tester thuc te/data/README.md>); [checks.sql](<../../Day14_Bo lab tester thuc te/data/checks.sql>) |
| LAB-10 | Automation — Tự động hóa đăng nhập V Learning | [TASK](<../../Day14_Bo lab tester thuc te/LAB-10/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-10/template.csv>) | [LAB-10_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-10_GUIDE.md>) | [Playwright tests](<../../Day14_Bo lab tester thuc te/automation/tests/>): `lab10-login.spec.ts`, `lab10-auth.spec.ts`; xem README trong `automation/` |
| LAB-11 | Automation — Luồng chọn phim đến đặt vé | [TASK](<../../Day14_Bo lab tester thuc te/LAB-11/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-11/template.csv>) | [LAB-11_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-11_GUIDE.md>) | [Playwright test](<../../Day14_Bo lab tester thuc te/automation/tests/lab11-booking.spec.ts>) |
| LAB-12 | Automation — Bộ hồi quy mini | [TASK](<../../Day14_Bo lab tester thuc te/LAB-12/TASK.md>) | [template.csv](<../../Day14_Bo lab tester thuc te/LAB-12/template.csv>) | [LAB-12_GUIDE](<../../Day14_Bo lab tester thuc te/instructor/LAB-12_GUIDE.md>) | [Playwright test](<../../Day14_Bo lab tester thuc te/automation/tests/lab12-regression.spec.ts>); rubric yêu cầu bộ data-driven và kết luận GO/NO-GO |

## Expected result, rubric và trạng thái pilot

- Expected/fault có kiểm soát được ghi trong từng guide `instructor/LAB-xx_GUIDE.md` và workbook, sheet `09_Instructor_Guide`. Sheet `02_Fault_Manifest` là tài liệu dành cho người hướng dẫn; không đưa cho học viên trước khi hoàn thành bài.
- Sheet `04_Rubric` có rubric chung 10 điểm cho 12 lab. Một số guide cũng có cách chia điểm riêng; ví dụ LAB-09 chia 10 điểm thành năm tiêu chí × 2 điểm. Nếu guide và workbook khác nhau, người hướng dẫn cần chốt rubric áp dụng trước khi chấm; mục lục này không tự chọn thay họ.
- Trạng thái pilot hiện tại nằm trong `01_Lab_Catalog`, `05_Artifact_Matrix` và báo cáo Ngày 14. Không hiểu việc có guide/fixture là bằng chứng rằng học viên đã chạy lab; một số lab vẫn cần pilot người học hoặc đang BLOCKED/NO-GO.
- Workbook hiện có tên `Day14_Tester_Labs_Quality_v2.xlsx`. README nguồn còn nhắc một tên workbook cũ; hãy dùng tên file đang tồn tại trong thư mục Day14.

## Reset và giới hạn an toàn

**Web demo dùng chung:** sáu demo TIX, V Learning, Jira, Fiverr, CyberSoftbnb và Insove không có chức năng reset trong bộ lab. Fixture reset không thay đổi dữ liệu trên web. Chỉ tạo dữ liệu bằng tài khoản được cấp/tự tạo và tự dọn dữ liệu của mình; không sửa hoặc xóa dữ liệu của người khác. Nếu không thể cleanup, ghi lại và báo người hướng dẫn.

**Fixture cục bộ:** mở PowerShell tại thư mục Day14 rồi chạy cho lab cần làm:

```powershell
node fixtures/reset.mjs --mode buggy --lab LAB-01
```

Sau khi tìm lỗi, có thể chuyển cùng lab sang trạng thái clean để kiểm tra lại:

```powershell
node fixtures/reset.mjs --mode clean --lab LAB-01
```

Thay `LAB-01` bằng ID cần chạy. Lệnh chép fixture JSON trong thư mục local `fixtures/` sang `fixtures/runtime/` và ghi đè fixture runtime cùng tên nếu đã có; hãy lưu bài làm/evidence ở nơi khác trước khi reset. Lệnh không kết nối web demo, MongoDB hay reset dữ liệu ứng dụng.

**LAB-09 SQLite:** chỉ reset file snapshot local, không tác động MongoDB. Mở terminal ở thư mục Day14:

```powershell
python data/create_snapshot.py
```

Lệnh tạo snapshot thay nội dung file SQLite local; không chạy nếu cần giữ kết quả đang có. Để tạo trạng thái clean, dùng `python data/create_snapshot.py --clean`.

Người hướng dẫn mới chạy `python data/verify_snapshot.py` khi cần kiểm tra toàn chu kỳ buggy → clean → buggy. Script để snapshot ở trạng thái buggy cuối cùng và ghi đè `reports/2026-09-23-LAB09-sql-reset-verification.json`; sao lưu report đó trước nếu cần giữ evidence cũ. Chi tiết xem [`data/README.md`](<../../Day14_Bo lab tester thuc te/data/README.md>).

Người hướng dẫn có thể xem [MENTOR_HANDBOOK.md](<../../Day14_Bo lab tester thuc te/instructor/MENTOR_HANDBOOK.md>) và [README nguồn](<../../Day14_Bo lab tester thuc te/README.md>) để biết quy trình chuẩn bị, chấm, cleanup và giới hạn các demo. Không lưu mật khẩu, token, API key hoặc dữ liệu học viên thật trong bài nộp/evidence.
