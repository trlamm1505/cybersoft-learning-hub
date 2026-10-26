import { Throttle } from '@nestjs/throttler';
import { RATE_LIMITS } from '../../common/security/app-throttler.guard';
import { Body, Controller, Get, HttpCode, Post, Put, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { SessionCookieInterceptor } from './session-cookie.interceptor';
import { ACCESS_COOKIE, CSRF_COOKIE, isProduction, serializeCookie } from '../../common/security/cookies';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetAvatarDto } from './dto/set-avatar.dto';
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
  @UseInterceptors(SessionCookieInterceptor)
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Đăng nhập bằng email + mật khẩu.
   * Route: POST /api/auth/login
   */
  @Post('login')
  @UseInterceptors(SessionCookieInterceptor)
  @Throttle(RATE_LIMITS.login)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Đặt nhóm tuổi cho CHÍNH tài khoản đang đăng nhập — gọi từ modal chọn
   * nhóm tuổi bắt buộc ngay sau lần đăng nhập đầu tiên. Yêu cầu đăng nhập
   * (lấy userId từ token) để không ai đặt hộ nhóm tuổi cho tài khoản khác.
   * Route: PUT /api/auth/age-group
   */
  /**
   * Đăng xuất phía server: đưa `jti` của token vào danh sách thu hồi (TTL = thời hạn còn lại) nên token cũ bị 401 ngay,
   * và xóa cookie phiên. Route: POST /api/auth/logout
   */
  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: JwtPayload, @Res({ passthrough: true }) res: { append: (k: string, v: string) => void }) {
    if (user.jti) await this.authService.revokeToken(user.jti, user.exp);
    const secure = isProduction();
    res.append('Set-Cookie', serializeCookie(ACCESS_COOKIE, '', { maxAgeMs: 0, httpOnly: true, secure }));
    res.append('Set-Cookie', serializeCookie(CSRF_COOKIE, '', { maxAgeMs: 0, httpOnly: false, secure }));
    return { success: true };
  }

  /**
   * Hồ sơ của tài khoản đang đăng nhập (vai trò đọc từ DB).
   * Route: GET /api/auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }

  /** Cập nhật ảnh đại diện của chính mình. Route: PUT /api/auth/avatar */
  @Put('avatar')
  @UseGuards(JwtAuthGuard)
  async setAvatar(@CurrentUser() user: JwtPayload, @Body() dto: SetAvatarDto) {
    return this.authService.setAvatar(user.sub, dto?.avatar);
  }

  /** Cập nhật họ tên, số điện thoại, giới thiệu của chính mình. Route: PUT /api/auth/profile */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    return this.authService.updateProfile(user.sub, body);
  }

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
  @Throttle(RATE_LIMITS.forgotPassword)
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
