# Kiểm tra lại UI automation theo ảnh — 14/09/2026

## Kết luận

**Chưa đúng hoàn toàn.** Hai tài khoản người dùng cung cấp đăng nhập đúng vai trò. Các chức năng smoke hoạt động, nhưng có 2 lỗi nghiệp vụ quiz đã tái hiện bằng automation. Kết quả cũ 8 test pass không bao phủ đầy đủ các màn hình trong ảnh.

- Local thật 5173/3000: teacher và student đăng nhập HTTP201, lần lượt tới /authoring và /catalog; logout xóa phiên. Chỉ đọc danh sách quiz, không tạo/xóa bài nộp trên tài khoản được cung cấp. Không lưu mật khẩu vào mã test hoặc báo cáo.
- Suite mở rộng: **10 test, chạy 2 lần → 20 passed, 0 failed, 0 skipped**, 63,22 giây, Edge headless.
- Regression nghiệp vụ: **2 test → 2 failed, 0 skipped**, 8,92 giây. Đây là lỗi sản phẩm thật được kiểm tra với kỳ vọng đúng, không phải artifact probe cố ý fail.
- TypeScript pass; cả hai database tạm được xác minh dropped=true. Bằng chứng nằm trong `reports/`.

## Đối chiếu các ảnh

| Phần trong ảnh | Coverage hiện tại | Đánh giá |
|---|---|---|
| Catalog 5 bài, search và lọc | Test mới kiểm tra danh sách, ba độ khó, tìm thấy/không thấy, reset | Pass |
| Chi tiết bài học | Login → tìm bài → chi tiết đúng tiêu đề/mục tiêu | Pass chức năng cơ bản; chưa kiểm tra phát video YouTube và chưa kiểm tra pixel toàn trang |
| Danh sách đề và chọn Python | Regression kiểm tra 10 câu/15 phút so với response bắt đầu | Fail: nhận20 câu/30 phút |
| Điều hướng 20 câu | Test mới kiểm tra Câu trước/tiếp, nút số câu, đếm đã chọn, disable ở hai đầu | Pass với dữ liệu riêng20 câu |
| Xác nhận nộp bài | Kiểm tra20/20, hủy modal, MongoDB vẫn IN_PROGRESS rồi nộp | Pass |
| Kết quả40/200,20%,4/20,GRADED | Chủ động chọn đúng4/20, đối chiếu UI và MongoDB | Pass; phép tính trong ảnh đúng |
| Xem lại đáp án/giải thích | Kiểm tra từng câu có nhãn đúng/sai, nhãn đáp án đúng/lựa chọn sai, giải thích | Pass với fixture; không phải kiểm thử màu sắc/pixel |
| Làm lại bài | ID lượt thi mới, đếm đã chọn trở lại0/20 | Pass |
| Tài khoản sở hữu lượt quiz | So userId gửi đi với user vừa đăng nhập | Fail: vẫn mã cố định chung |

Test quiz20 câu dùng dữ liệu tổng hợp trong DB tạm để có kết quả biết trước, không lấy đáp án từ response bài thi để tự quyết định expected score. Hai tài khoản cung cấp chỉ dùng để kiểm tra login local; CI tiếp tục tạo account riêng từng test.

## BUG-01 — Chọn đề Python nhưng cấu hình đề không được gửi tới backend (ưu tiên cao)

**Tái hiện:** login student → Thi Trắc Nghiệm → chọn card Python hệ thống10 câu → thấy giới thiệu10 câu/15 phút → bắt đầu.

**Kỳ vọng:** đề Python10 câu,900 giây, đúng ngân hàng câu hỏi Python.

**Thực tế:** response có20 câu và1800 giây trong lần tái hiện có20 câu seed. Ảnh người dùng còn cho thấy câu hỏi HTML/ARIA/HTTP dưới tiêu đề Python.

**Nguyên nhân trong source:** `FE/src/pages/QuizTakingPage.tsx:89` đặt chung userId/testId; dòng133 gọi startQuiz(userId,testId), không truyền lựa chọn topic. `BE/src/modules-api/quiz/quiz.service.ts:50` lấy mọi câu hỏi bằng find({}), dòng80 cố định1800 giây.

**Hướng sửa đề xuất:** định nghĩa đề trên BE có ID, danh sách câu hỏi và thời lượng; FE lấy metadata từ BE và gửi ID đề đã chọn. Không chỉ sửa số hiển thị trên FE. Regression: `regressions/quiz-contract.spec.ts` BUG-01.

## BUG-02 — Lượt thi không gắn với tài khoản vừa đăng nhập (ưu tiên cao)

**Kỳ vọng:** userId của lượt thi là ID account đã xác thực.

**Thực tế:** request start luôn gửi `673f11111111111111111111` thay vì ID account test mới. Backend dùng ID này để tìm/tạo attempt. Các học viên có thể dùng chung một lượt IN_PROGRESS khi cùng testId; tác động chia sẻ lượt thi là suy luận từ logic findOne, chưa thực hiện kiểm thử đồng thời hai học viên trong phiên này.

**Hướng sửa đề xuất:** backend xác thực JWT, lấy userId từ token; FE không dùng ID cố định. Sau đó chạy lại cả test ownership và test đề Python. Regression BUG-02 tái hiện được sai ID.

## Quan sát khác

Danh sách local có hai card cùng tên Python và hai card cùng tên Web, khớp ảnh. Source cố ý ghép SYSTEM với TEACHER; vì UI chưa gắn nhãn nguồn rõ nên dễ chọn nhầm. Đây là vấn đề phân biệt nội dung trên UI, không đủ bằng chứng để kết luận bản ghi database bị trùng.

Quiz TEACHER hiện chấm phía FE; suite này kiểm tra nhánh SYSTEM gọi BE thật. Teacher login pass không đồng nghĩa đã kiểm tra toàn bộ soạn bài của giáo viên. Chưa kiểm thử UI đăng ký, mobile hoặc bảo mật đầy đủ.

## Thay đổi automation

- Thêm `catalog.spec.ts` và `quiz-navigation.spec.ts`.
- Fixture hỗ trợ questionCount, seed/xóa đúng toàn bộ ID của test; giữ một worker.
- POM thêm thao tác chọn đề, chuyển câu, hủy nộp, review và làm lại. Dùng role/name, có fallback cha trực tiếp từ heading khi UI chưa có accessible role; không XPath dài hay sleep cố định.
- Thêm `playwright.regressions.config.ts` và script test:regressions, lưu report lỗi riêng, không đánh dấu skip/expected-failure.
- Workflow chạy thêm regression sau smoke; CI phải báo fail khi hai lỗi còn tồn tại. Workflow chưa được push hoặc chạy trên GitHub.
- DAY08_BE_PREBUILT=1 dùng dist hiện có để tránh build đè thư mục của BE watch đang chạy. Chỉ dùng khi BE đã build đúng source hiện tại. Mặc định/CI vẫn biên dịch trước khi chạy.

## Lệnh chạy và xem báo cáo trên máy này

```powershell
cd D:\thuctap\cybersoft-learning-hub\Test\Day08_UI_Smoke
$env:BROWSER_CHANNEL = "msedge"
$env:PLAYWRIGHT_BROWSERS_PATH = "D:\thuctap\tmp\day08-browsers"
# Chỉ khi backend đã build đúng phiên bản hiện tại:
$env:DAY08_BE_PREBUILT = "1"
npm.cmd run test:headless
npm.cmd run report
```

Kiểm tra hai lỗi và mở báo cáo lỗi:

```powershell
npm.cmd run test:regressions
npx.cmd playwright show-report reports/regressions/html
```

`test:regressions` hiện trả exit1 vì hai lỗi trên. Report chính là smoke pass; phải đọc thêm report regression để đánh giá đầy đủ. Hai lỗi có2PNG,2WebM,2traceZIP. Metadata/cleanup bàn giao ở reports/run.json và cleanup.json thuộc smoke; metadata regression ở reports/regressions. Khi chạy lại, metadata ở gốc reports sẽ thuộc lần chạy gần nhất.

## Bằng chứng

- `reports/live-login.json`: kết quả hai account, không chứa password/token.
- `reports/junit.xml`, `reports/run.json`, `reports/cleanup.json`:20pass và cleanup.
- `reports/regressions/junit.xml`, `html`, `test-results`, `run.json`, `cleanup.json`:2 lỗi thật và artifacts.
- `reports/html`: HTML smoke gần nhất, có ảnh review20 câu đính kèm.

Kết luận nghiệm thu hiện tại: framework/luồng smoke đã mở rộng và kiểm chứng, nhưng cần sửa hai lỗi quiz và có GitHub Actions run thực tế trước khi khẳng định tất cả đúng.
