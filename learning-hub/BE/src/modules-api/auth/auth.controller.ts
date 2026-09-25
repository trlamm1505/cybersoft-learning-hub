import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetAgeGroupDto } from './dto/set-age-group.dto';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Đăng ký tài khoản mới (luôn tạo role STUDENT) — tự động đăng nhập.
   * Route: POST /api/auth/register
   */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Đăng nhập bằng email + mật khẩu.
   * Route: POST /api/auth/login
   */
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Đặt nhóm tuổi cho CHÍNH tài khoản đang đăng nhập — gọi từ modal chọn
   * nhóm tuổi bắt buộc ngay sau lần đăng nhập đầu tiên. Yêu cầu đăng nhập
   * (lấy userId từ token) để không ai đặt hộ nhóm tuổi cho tài khoản khác.
   * Route: PUT /api/auth/age-group
   */
  @Put('age-group')
  @UseGuards(JwtAuthGuard)
  async setAgeGroup(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetAgeGroupDto,
  ) {
    return this.authService.setAgeGroup(user.sub, dto.ageGroup);
  }

  /**
   * Gửi email chứa liên kết đặt lại mật khẩu (hiệu lực 15 phút).
   * Route: POST /api/auth/forgot-password
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  /**
   * Đặt mật khẩu mới bằng token nhận qua email.
   * Route: POST /api/auth/reset-password
   */
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
