# Kế hoạch hoàn thiện Day 30 trên bản V2

## Trạng thái đầu vào

- Nhánh: `feat/admin-portal-v2`
- Commit đã retest: `8902fcb`
- Test case: 38 ca - 18 Pass, 18 Fail, 1 Blocked, 1 Pending
- Tracker: 29 mục - 28 OPEN, 1 PENDING APPROVAL
- High blocker: 8 mục
- Quyết định: `NO-GO/HOLD`

## Bước 1 - Xác nhận đúng phiên bản

```powershell
cd D:\thuctap\clone\cybersoft-learning-hub-v2
git switch feat/admin-portal-v2
git pull --ff-only
git rev-parse --short HEAD
git status --short
```

Không chạy test trên nhánh khác rồi gắn kết quả cho `8902fcb`.

## Bước 2 - Chuẩn bị môi trường và dữ liệu

```powershell
cd D:\thuctap\clone\cybersoft-learning-hub-v2
npm.cmd run setup
npm.cmd run doctor
```

Nếu cần xóa và nạp lại dữ liệu mẫu V2:

```powershell
cd D:\thuctap\clone\cybersoft-learning-hub-v2\learning-hub\BE
npm.cmd run seed
```

Lệnh seed xóa dữ liệu local cũ. Chỉ chạy sau khi đã chấp nhận mất dữ liệu test.

## Bước 3 - Chạy giao diện và Backend V2

```powershell
cd D:\thuctap\clone\cybersoft-learning-hub-v2
npm.cmd run dev
```

Kiểm tra:

```powershell
Invoke-WebRequest "http://127.0.0.1:3000/api/health" -UseBasicParsing |
    Select-Object StatusCode
```

FE phải mở tại `http://localhost:5173`; BE health phải trả HTTP 200.

## Bước 4 - Retest các ca bị BLOCKED/giới hạn dữ liệu

Ưu tiên chạy lại:

- `TC_K69_02`: Playground lớp 6-9 sau khi seed đủ bài.
- `DEF-018`, `DEF-020`, `DEF-022`, `DEF-035`: cần bài có test case/hidden test.
- `TC_GV_08`: xác nhận quy tắc `ageGroup` của tài khoản giáo viên.
- `RISK-09`: xác nhận seed V2 tạo đúng số lượng và test case.
- `RISK-10`: xác nhận lớp K3-5/K6-9 có giáo viên và mapping ageGroup đúng.

Cập nhật trực tiếp Actual Result, Status và Attachments trong `Day30_Test_Cases_V2_Tran_Quoc_Nguyen.xlsx`, sau đó đồng bộ tracker.

## Bước 5 - Gửi 8 High blocker cho nhóm

| Nhóm | ID |
|---|---|
| Data AI | DEF-033, DEF-035, RISK-07 |
| BE | DEF-050, DEF-018, DEF-060, RISK-06, RISK-08 |

Mỗi nhóm điền `Owner xác nhận`, `Deadline`, commit/PR và đổi trạng thái sang `FIXED`. QA chạy điều kiện retest rồi mới đổi `RESOLVED`.

## Bước 6 - Chạy regression và release gate trên V2

```powershell
cd D:\thuctap\clone\cybersoft-learning-hub-v2\learning-hub\FE
npm.cmd run build
npm.cmd test
npm.cmd run lint

cd D:\thuctap\clone\cybersoft-learning-hub-v2\learning-hub\BE
npm.cmd run build
npm.cmd test -- --runInBand

cd D:\thuctap\clone\cybersoft-learning-hub-v2\learning-hub
npm.cmd run release:check
```

Sau mỗi lệnh ghi `$LASTEXITCODE`; lưu stdout/stderr, commit, thời gian và phạm vi vào thư mục evidence mới. Không ghi đè log FAIL cũ.

## Bước 7 - Hoàn thành nghiệm thu con người

- Một người khác làm theo QA Handbook và gửi log.
- Chạy UAT chính thức với giảng viên/người dùng đại diện.
- Xin xác nhận owner/deadline hoặc risk acceptance bằng văn bản.
- Nếu video vẫn bắt buộc, quay sau khi dữ liệu và gate đã ổn định.

## Bước 8 - Điều kiện đổi HOLD

Chỉ cân nhắc GO/CONDITIONAL GO khi:

- 8 High blocker đã RESOLVED hoặc được phê duyệt chấp nhận rủi ro.
- Regression và release gate PASS trên cùng commit V2.
- Không còn BLOCKED/PENDING ảnh hưởng nghiệm thu.
- UAT có xác nhận thật.
- Evidence không chứa token, mật khẩu hoặc secret.

Nếu chưa đủ các điều kiện trên, giữ `NO-GO/HOLD`.
