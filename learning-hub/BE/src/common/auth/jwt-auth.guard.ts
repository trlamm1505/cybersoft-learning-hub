import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Bắt buộc request phải có Bearer token hợp lệ (verify chữ ký + hạn dùng qua
 * JwtStrategy). Ném UnauthorizedException (401) tự động nếu thiếu/hết hạn/sai.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
