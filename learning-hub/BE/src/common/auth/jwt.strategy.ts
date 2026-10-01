import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: string;
}

/**
 * Xác thực Bearer token do AuthService.buildAuthResponse() ký (auth.service.ts).
 * Payload trả về ở đây trở thành `req.user` trong mọi controller có
 * @UseGuards(JwtAuthGuard) — dùng cùng JWT_SECRET với lúc sign để không phải
 * định nghĩa secret ở hai nơi.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'dev-secret-key',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return payload;
  }
}
