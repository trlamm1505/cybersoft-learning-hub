// studentId/studentName không còn nhận từ client — lấy từ Bearer token
// (@CurrentUser()) ở controller để không ai đăng ký thi mạo danh học viên
// khác. DTO này hiện không còn field, giữ lại làm placeholder rõ ràng hơn
// là gọi thẳng object rỗng.
export class RegisterContestDto {}
