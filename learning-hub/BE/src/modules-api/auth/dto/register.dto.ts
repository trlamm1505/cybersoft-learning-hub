// Đăng ký công khai chỉ tạo tài khoản STUDENT — không nhận role/ageGroup từ
// client nữa. ageGroup được đặt sau qua PUT /auth/age-group (modal sau đăng
// nhập lần đầu); Teacher/Admin chỉ được cấp quyền bằng tay qua Admin.
export class RegisterDto {
  email: string;
  password: string;
  fullName: string;
}
