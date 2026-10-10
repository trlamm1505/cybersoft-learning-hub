# Ngày 08 — UI smoke automation

Bộ bàn giao CyberSoft Learning Hub: Playwright Test + TypeScript, Page Object Model, HTML/JUnit report và GitHub Actions.

## Nội dung bàn giao

| Đường dẫn | Nội dung |
|---|---|
| src/tests, src/pages | 10 smoke test và Page Objects: login, catalog, xem bài, quiz/code, kết quả |
| src/fixtures, src/setup, src/utils | Account/data riêng, cấu hình local, setup và cleanup MongoDB |
| test-data | Dữ liệu quiz/code xác định trước |
| regressions | 2 test phát hiện lỗi chọn đề Python và ownership quiz |
| playwright*.config.ts | Cấu hình chạy smoke/regression, headless, screenshot/video/trace khi fail |
| package.json, package-lock.json, tsconfig.json | Dependency và TypeScript |
| BAO_CAO_NGAY08.md | Kết quả, phạm vi, lỗi còn tồn tại và bằng chứng |
| AI_WORKLOG.md | Nhật ký AI hỗ trợ và kiểm chứng |
| reports/html, reports/junit.xml | Báo cáo smoke mới nhất đã kiểm chứng |
| reports/regressions | Báo cáo 2 lỗi thật cùng screenshot/video/trace |
| reports/run.json, cleanup.json, live-login.json | Metadata, cleanup và kiểm tra login local |

Workflow cần bàn giao cùng repo: `../../.github/workflows/day08-ui-smoke.yml`. File phải nằm ở .github/workflows của gốc repo để GitHub nhận diện, không di chuyển vào thư mục test.

## Cài và chạy local (PowerShell trong VS Code)

Cần Node24, MongoDB local đang chạy ở127.0.0.1:27017, Python cho code judge. Windows BE tìm `%LOCALAPPDATA%/Python/bin/python.exe`, rồi `python` trên PATH; Linux dùng python3.

```powershell
cd D:\thuctap\cybersoft-learning-hub\learning-hub\BE
npm.cmd ci
cd ..\FE
npm.cmd ci
cd ..\..\Test\Day08_UI_Smoke
npm.cmd ci
npx.cmd playwright install chromium
npm.cmd run typecheck
npm.cmd run test:headed
npm.cmd run test:headless
npm.cmd run report
```

Chỉ chạy npm ci ở FE/BE khi chưa cài dependency hoặc lockfile thay đổi. Thư mục node_modules của bộ test đã được dọn khỏi bản bàn giao; cài lại bằng npm ci.

Test tự mở FE5188 và BE3108, dùng DB riêng `cybersoft_day08_e2e_<runId>`, tự dọn sau chạy. Không cần khởi động thủ công hai server test. Không chạy build BE và test đồng thời vì Nest cùng ghi dist. Khi BE đã build đúng source hiện tại, có thể đặt `$env:DAY08_BE_PREBUILT="1"` để dùng dist; mặc định/CI vẫn build.

Máy hiện tại đã kiểm chứng bằng Edge:

```powershell
$env:BROWSER_CHANNEL = "msedge"
$env:PLAYWRIGHT_BROWSERS_PATH = "D:\thuctap\tmp\day08-browsers"
npm.cmd run test:headless
```

Cache trên là đường dẫn riêng máy này. Máy khác cài Chromium theo lệnh phía trên và không cần hai biến môi trường này. Có thể copy .env.example thành .env để đổi cổng/Mongo local.

## Chạy riêng và xem lỗi

```powershell
npm.cmd run test:headed -- src/tests/login.spec.ts
npm.cmd run test:headless -- --repeat-each=2
npm.cmd run test:regressions
npx.cmd playwright show-report reports/regressions/html
npx.cmd playwright show-trace "duong-dan-den-trace.zip"
```

Regression hiện fail do 2 lỗi sản phẩm đã ghi trong BAO_CAO_NGAY08.md; không skip, không đổi assertion để báo pass. 10smoke test đã chạy2 lần:20pass. Hai tài khoản người dùng cung cấp đã được kiểm tra riêng trên local; test thường tạo account mới, không hardcode mật khẩu thật.

Không dùng sleep cố định; chờ locator/expect/HTTP. Mỗi test có browser context riêng, account riêng; fixture xóa dữ liệu trong finally và global teardown kiểm tra ownership marker trước khi drop DB riêng. Một worker do quiz hiện query toàn bộ câu hỏi và dùng userId cố định. Report là kiểm tra chức năng, không chứng nhận pixel/video YouTube/authorization đầy đủ.

## CI và nộp bài

Workflow dùng Ubuntu, Node24, Python3.12, Mongo8 và Chromium headless; cài bằng lockfile, chạy typecheck/discovery/smoke/regression, upload report/artifact dù fail. Chưa có GitHub run thực tế. CI dự kiến fail ở regression tới khi hai lỗi ứng dụng được sửa.

Nộp thư mục này cùng workflow ở gốc repo. reports đang được gitignore để tránh commit dữ liệu phát sinh: khi bàn giao bằng ZIP/thư mục cần kèm reports; khi nộp qua GitHub dùng artifact của Actions hoặc đính kèm bộ reports riêng. Không nộp node_modules, .env, cache trình duyệt. Giữ package-lock.json để cài đúng dependency.

Report bàn giao hiện có đầy đủ bằng chứng mới nhất. Chạy test lần nữa sẽ cập nhật report; metadata gốc reports thuộc lần chạy gần nhất.
