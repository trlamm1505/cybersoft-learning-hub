import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { jwtSecretFrom } from '../auth/jwt-secret';

/** Giới hạn mặc định: đủ rộng cho polling kết quả chấm (~1 request/0,7s). */
export const DEFAULT_RATE_LIMIT = { ttl: 60_000, limit: 600 };

/** Giới hạn chặt cho các route tốn tài nguyên hoặc dễ bị dò. */
export const RATE_LIMITS = {
  login: { default: { ttl: 60_000, limit: 5 } },
  coachChat: { default: { ttl: 60_000, limit: 10 } },
  aiLabSubmit: { default: { ttl: 60_000, limit: 10 } },
  sqlRun: { default: { ttl: 60_000, limit: 30 } },
  codeRun: { default: { ttl: 60_000, limit: 30 } },
  /** Nộp bài cuộc thi chạy cả bộ test: chặn bấm liên tục làm nghẽn bộ chạy code. */
  contestSubmit: { default: { ttl: 60_000, limit: 15 } },
} as const;

export const RATE_LIMIT_MESSAGE =
  'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.';

/** Trả `sub` của token đã xác thực chữ ký và còn hạn; null nếu không tin được. */
export type VerifiedSubject = (token: string) => string | null;

export function jwtSubjectVerifier(jwt: JwtService): VerifiedSubject {
  return (token) => {
    try {
      const sub = jwt.verify<{ sub?: unknown }>(token)?.sub;
      return typeof sub === 'string' && sub ? sub : null;
    } catch {
      // Hết hạn, sai chữ ký, sai định dạng: không dùng làm khóa đếm.
      return null;
    }
  };
}

/**
 * Khóa đếm request:
 * - Token hợp lệ (đã verify chữ ký, còn hạn): theo user, để cả lớp ngồi sau
 *   cùng một NAT không chia chung hạn mức.
 * - Đăng nhập: theo IP + email, chống dò mật khẩu một tài khoản mà không khóa cả lớp.
 * - Không có token, token hết hạn hoặc giả: theo IP của client. Không bao giờ
 *   dùng nội dung token làm khóa, nên tự sinh token rác không né được bộ đếm.
 */
export function resolveRateLimitTracker(
  req: Record<string, any>,
  verify: VerifiedSubject,
): string {
  const ip = req.ips?.length ? req.ips[0] : req.ip;
  const path: string = req.originalUrl ?? req.url ?? '';
  const email = req.body?.email;
  if (path.includes('/auth/login') && typeof email === 'string') {
    return `login:${ip}:${email.trim().toLowerCase()}`;
  }
  const auth = req.headers?.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    const sub = verify(auth.slice(7).trim());
    if (sub) return `user:${sub}`;
  }
  return `ip:${ip}`;
}

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  private readonly verifySubject: VerifiedSubject;

  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
    config: ConfigService,
  ) {
    super(options, storage, reflector);
    // Cùng secret với lúc ký token (jwtSecretFrom), nên token thật luôn verify được.
    this.verifySubject = jwtSubjectVerifier(
      new JwtService({ secret: jwtSecretFrom(config) }),
    );
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return resolveRateLimitTracker(req, this.verifySubject);
  }

  protected async getErrorMessage(): Promise<string> {
    return RATE_LIMIT_MESSAGE;
  }
}
