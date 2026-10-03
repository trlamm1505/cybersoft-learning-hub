# AI WORKLOG — Ngày 08

## 12/09/2026 — Xây dựng và kiểm chứng

Đồng bộ ứng dụng từ GitHub lên487f21d, giữ sửa local authoringApi dùng VITE_API_URL. AGENTS.md không còn trong checkout tại thời điểm kiểm tra. Khôi phục base/code/quiz POM và specs từ trace cũ; đọc FE/BE, schema/API và dependency thật. Không dùng mock FastAPI của Day06/07 để chứng minh login React/NestJS.

Tạo account qua register, bỏ token register rồi login bằng UI. Thêm login student/teacher, reload/logout và mật khẩu sai. Các luồng xem bài/quiz/code login trước, có fixture MongoDB riêng và cleanup. BE npm ci và build, FE build, typecheck pass. 8headed pass;16 lượt headless pass. Kiểm tra artifact cố ý fail đã tạo đủ PNG/WebM/trace; công cụ thử artifact không thuộc bản bàn giao cuối.

## 14/09/2026 — Kiểm tra theo ảnh

Kiểm tra hai account được cung cấp trên localhost5173: HTTP201, đúng role/route và logout; không lưu password/token vào repo, không thay đổi bài nộp của người dùng. Thêm test catalog và quiz20 câu: điều hướng, hủy nộp, điểm40/200, review, làm lại.10smoke tests chạy2 lượt:20passed,0skip; typecheck pass.

Thêm2regression với kỳ vọng nghiệp vụ thật: chọn Python10 câu/15phút nhưng API trả20/30; userId quiz không khớp account đăng nhập. Cả2fail, lưu2PNG/2WebM/2trace. Hai DB tạm đã cleanup dropped=true. Thêm regression vào workflow để CI không chỉ kiểm tra smoke. Chưa sửa code nghiệp vụ, chưa push/chạy GitHub Actions.

## Dọn bản bàn giao

Giữ source/config/lockfile, README, báo cáo tổng hợp, worklog và report/artifacts mới nhất. Bỏ node_modules, probe cố ý fail, report lịch sử và bản trùng. Chuẩn hóa report regression về reports/regressions; cập nhật lệnh và tham chiếu tài liệu. Không chạy lại UI chỉ để dọn tài liệu; kiểm tra TypeScript/discovery trước khi bỏ dependency. Kết quả runtime trong báo cáo vẫn thuộc lần14/09 đã kiểm chứng.
