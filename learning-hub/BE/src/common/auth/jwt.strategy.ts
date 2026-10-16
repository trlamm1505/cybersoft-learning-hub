import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { UnauthorizedException } from '@nestjs/common';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { jwtSecretFrom } from './jwt-secret';
import { ACCESS_COOKIE, readCookie } from '../security/cookies';
import { tokenRevocation } from '../security/token-revocation';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
  /** Nhóm tuổi hiện tại của học viên (lấy từ CSDL mỗi request, không tin token). */
  ageGroup?: string;
  /** Thời điểm cấp token (giây), do JWT tự thêm. */
  iat?: number;
  /** Hạn token (giây) và mã định danh token, dùng để thu hồi khi đăng xuất. */
  exp?: number;
  jti?: string;
}

/**
 * Xác thực Bearer token do AuthService.buildAuthResponse() ký (auth.service.ts).
 * Payload trả về ở đây trở thành `req.user` trong mọi controller có
 * @UseGuards(JwtAuthGuard) — dùng cùng JWT_SECRET với lúc sign để không phải
 * định nghĩa secret ở hai nơi.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {
    super({
      // Bearer header (script/API) hoặc cookie httpOnly `access_token` (trình duyệt).
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: { headers?: { cookie?: string } }) => readCookie(req?.headers?.cookie, ACCESS_COOKIE) ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecretFrom(configService),
    });
  }

  /**
   * Đối chiếu token với CSDL ở mỗi request: tài khoản đã xóa hoặc bị Admin khóa thì token đang dùng bị
   * từ chối ngay (không chờ hết hạn 7 ngày), và vai trò lấy từ CSDL nên đổi vai trò có hiệu lực tức thì.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (tokenRevocation.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
    }
    if (!isValidObjectId(payload.sub)) {
      throw new UnauthorizedException('Phiên đăng nhập không còn hợp lệ.');
    }
    const user = await this.users
      .findById(payload.sub)
      .select('role status sessionsRevokedAt ageGroup')
      .lean<{
        role: string;
        status?: string;
        sessionsRevokedAt?: Date;
        ageGroup?: string;
      }>();
    if (!user) {
      throw new UnauthorizedException('Phiên đăng nhập không còn hợp lệ.');
    }
    if (user.status === 'LOCKED') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_LOCKED',
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }
    // Phiên cấp trước lúc Admin thu hồi thì không dùng được nữa (phải đăng nhập lại).
    if (
      user.sessionsRevokedAt &&
      (payload.iat ?? 0) * 1000 < new Date(user.sessionsRevokedAt).getTime()
    ) {
      throw new UnauthorizedException('Phiên đăng nhập đã bị thu hồi.');
    }
    return { ...payload, role: user.role, ageGroup: user.ageGroup };
  }
}
