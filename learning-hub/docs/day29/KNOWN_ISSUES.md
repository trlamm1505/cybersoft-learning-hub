# Giới hạn đã biết (Known Issues) — Release v1.0, Ngày 29

Tài liệu này ghi các rủi ro đã được chấp nhận hoặc chưa xử lý ở bản phát hành hiện tại. File `security-report.json`
và `load-report.json` do script sinh tự động nên không sửa tay; các ghi chú bổ sung nằm ở đây.

## 1. Quyền riêng tư của trẻ em trên Bảng Vinh Danh (Kid Mode, Lớp 3–5)

- **Hiện trạng:** Bảng Vinh Danh và "thẻ xem bạn học" hiển thị **họ và tên đầy đủ** của học sinh cho mọi học viên đã đăng
  nhập. Việc này được giữ nguyên theo yêu cầu cho môi trường **nội bộ**. Thẻ bạn học chỉ có avatar, họ tên, khối lớp,
  số sao và huy hiệu; không có email hay thông tin liên hệ, và chỉ xem được bạn đang có tên trên bảng.
- **Rủi ro:** Nếu phát hành ra môi trường **Public bên ngoài**, việc công khai họ tên của trẻ em cho người lạ là rủi ro
  về quyền riêng tư và pháp lý.
- **Cần làm trước khi Public:** Cần bổ sung cơ chế Consent của phụ huynh khi phát hành ra môi trường Public bên ngoài
  (đồng ý hiển thị tên, hoặc chuyển sang biệt danh / tên gọi mặc định, kèm tùy chọn ẩn khỏi bảng).

## Cách xếp hạng Bảng Vinh Danh

Bé đã phá đảo 100% một game được xếp theo **tổng thời gian chơi** (từ lúc xong màn đầu tới lúc xong màn cuối)
càng ngắn càng cao; bằng nhau thì bé xong sớm hơn xếp trước. Thời gian đo bằng mốc ghi nhận ở server, không phải thời
gian thực bé suy nghĩ, nên bé nghỉ giữa chừng sẽ bị tính thêm thời gian nghỉ.

## 2. Chống gian lận Bảng Vinh Danh chỉ ở mức "làm khó"

- **Đã có:** server từ chối thành tích có slug/game không hợp lệ, đòi hoàn thành đúng thứ tự (game dựng sẵn), từ chối khi
  hai màn trong cùng một game cách nhau dưới `BLOCK_PUZZLE_MIN_LEVEL_SEC` giây (mặc định 10, trả 400 "Thao tác quá
  nhanh, vui lòng tự giải đố nhé!"), và loại khỏi bảng bé có tổng thời gian phá đảo thấp hơn (số màn − 1) × ngưỡng đó.
- **Chưa có:** server không tự chấm lời giải, chỉ tin trình duyệt báo "đã xong màn". Một người biết kỹ thuật vẫn có thể
  gửi từng màn cách nhau đúng ngưỡng để lên bảng. Game chỉ có **1 màn** (Ghép Hình Con Vật) không có mốc thời gian để
  so, nên không áp dụng được quy tắc thời gian.
- **Hướng xử lý sau:** server tự chạy lại / kiểm tra lời giải của màn, hoặc ghi mốc "bắt đầu màn" từ phía server.

## 3. Khác

- Hộp thoại Kid Mode dùng `useFocusTrap` (Tab/Shift+Tab giữ trong hộp, Esc đóng); các màn chơi Blockly bên trong từng
  game chưa được rà soát lại về từ ngữ kỹ thuật dành cho trẻ nhỏ.
- Bảng xếp hạng được giữ trong bộ nhớ 5 giây và tính trên toàn bộ collection tiến độ; ở quy mô lớn cần chỉ mục/tổng hợp
  sẵn thay vì tính mỗi lần gọi.

## 4. Kiểm tra bảo mật Kid Mode (xem `TEST_KID_SECURITY_REPORT.txt`, chạy bằng `npm run verify:kid`)

- Đã kiểm tra qua API thật: không token, token sai secret/hết hạn/của tài khoản không tồn tại/bị khóa, token giả vai ADMIN,
  đổi ID trên URL sang bé khác (bài nộp, lịch sử AI Coach, lịch sử gợi ý, hồ sơ admin, thẻ bạn học), sửa hồ sơ kèm
  role/ageGroup, avatar SVG/javascript:, học sinh gọi API giảng viên/admin.
- Đã vá: các báo cáo nội bộ `/qa/dashboard`, `/resilience/dashboard`, `/usability/report`, `/usability/top-fixes` trước đây
  mở công khai, và `POST /usability/session` cho khách ẩn danh ghi dữ liệu; nay cần đăng nhập (và là giảng viên/admin với
  các báo cáo). `/resilience/limits` (giới hạn đã công bố) vẫn công khai có chủ ý.
- Còn lại: Bảng Vinh Danh trả `userId` (ObjectId) của các bé trên bảng để mở thẻ bạn học; id này không bí mật nhưng nên đổi
  sang mã tạm khi công khai ra ngoài. Ảnh đại diện dạng URL http(s) do bé tự nhập có thể là ảnh theo dõi (tracking pixel).
- Dữ liệu mẫu: 5 tài khoản `seed-kid-*@demo.cybersoft.local` (cờ `isSeedDemo`) phải xóa trước khi phát hành:
  `node scripts/seed-kid-leaderboard.js --remove`.

## 5. Luồng xác thực (đăng nhập / đăng ký)

- Khách chưa đăng nhập chỉ vào được `/login`, `/register`, `/forgot-password`, `/reset-password`; mọi đường dẫn khác tự chuyển
  về `/login`. Đây là chặn ở giao diện: dữ liệu thật vẫn do API kiểm tra token và quyền (xem mục 4).
- Chính sách mật khẩu mới (8–32 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt) chỉ áp dụng cho **đăng ký** và **đặt lại
  mật khẩu**. **Đăng nhập không kiểm tra độ mạnh**, nên tài khoản cũ có mật khẩu yếu (đặt theo quy tắc cũ ≥ 6 ký tự) vẫn đăng
  nhập được; cần có cơ chế buộc đổi mật khẩu nếu muốn siết chặt.
- Ô "Đồng ý Điều khoản" chỉ có ở form **Đăng ký** và chỉ chặn ở form (nút bị khóa khi chưa tick; đăng nhập không cần tick); sự đồng ý **chưa được lưu** ở server (không có bằng chứng
  thời điểm/phiên bản điều khoản) và chưa có xác thực OTP/email. Với học sinh nhỏ tuổi cần consent của phụ huynh (xem mục 1).

## 6. Lớp học, bài giao và điểm lớp (Khối 6–9 / 10–12)

- **Chấm điểm:** bài code = tổng điểm − 1 điểm cho mỗi lần Submit sai (WA/TLE/RE) trước lần AC đầu tiên, không dưới 0; lỗi
  cú pháp (CE) và lỗi hệ thống chấm không bị trừ; bấm Run không tạo bài nộp nên không bị trừ. Bài trắc nghiệm một lượt, điểm
  theo tỷ lệ đúng. Chỉ bài nộp/lượt thi mang `assignmentId` mới tính điểm lớp; luyện tập tự do ở Playground thì không.
- **Hạn chót do máy chủ kiểm tra:** nộp bài/làm trắc nghiệm của lớp sau hạn (mà chưa hoàn thành) bị từ chối 403 "đã hết hạn -
  đã khóa"; chưa đến giờ mở cũng 403. Giờ hiển thị và nhóm ngày theo giờ Việt Nam (UTC+7).
- **Chưa có giao diện giảng viên để giao bài có hạn chót** (API `POST /teacher/class-assignments/:classId` đã có và có test;
  hiện bài giao được nạp bằng `scripts/seed-class.js`). Bài giao cũ theo `exerciseSlugs` (không có hạn chót) vẫn nằm ở trang
  Dashboard của giảng viên, chưa gộp vào luồng mới.
- **Độ tin cậy của điểm:** bài code của lớp do judge ở máy chủ chấm (không tin trình duyệt); riêng Block Puzzle thì xem mục 2.
- **Dữ liệu mẫu cần gỡ trước khi phát hành:** `node scripts/seed-class.js --remove`, `node scripts/seed-contests.js --remove`,
  `node scripts/seed-kid-leaderboard.js --remove`.
- **Khối cho câu hỏi ôn tập và cuộc thi:** câu hỏi cũ được gắn khối theo độ khó (EASY→6–9, MEDIUM→cả hai, HARD→10–12) bằng
  `scripts/backfill-question-grades.js`; đây là quy ước tạm, giảng viên nên rà lại. Cuộc thi mới có `gradeBand`
  (ALL/6-9/10-12); học sinh khác khối xem được nhưng đăng ký/vào thi/nộp bài nhận 403.
