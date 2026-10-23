// Đăng ký công khai chỉ tạo tài khoản STUDENT — không nhận role/ageGroup từ
// client nữa. ageGroup được đặt sau qua PUT /auth/age-group (modal sau đăng
// nhập lần đầu); Teacher/Admin chỉ được cấp quyền bằng tay qua Admin.
export class RegisterDto {
  email: string;
  password: string;
  fullName: string;
  /** Tùy chọn: nhóm đối tượng người dùng tự khai khi đăng ký (3-5, 6-9, 10-12 hoặc CAREER_ADULT). Bỏ trống thì chọn ở modal sau khi đăng nhập. */
  ageGroup?: string;
}
