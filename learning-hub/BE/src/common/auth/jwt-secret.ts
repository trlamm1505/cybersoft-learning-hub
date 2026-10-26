import { randomBytes } from 'crypto';
import type { ConfigService } from '@nestjs/config';

/** Khóa từng được hard-code làm mặc định (đã nằm trong lịch sử git): coi như đã lộ, không bao giờ được dùng. */
export const LEAKED_DEFAULT_SECRETS: readonly string[] = ['dev-secret-key'];

let ephemeralSecret: string | undefined;

/**
 * Một nguồn duy nhất cho JWT secret: ký token (AuthModule), xác thực route
 * (JwtStrategy) và xác thực token khi đếm rate limit (AppThrottlerGuard). Lệch
 * nhau ở một chỗ thì chỗ đó coi mọi token là giả.
 *
 * Không còn khóa mặc định cố định (Day 29, C2): thiếu JWT_SECRET ở dev/test thì sinh khóa NGẪU NHIÊN cho riêng tiến
 * trình này (token mất hiệu lực khi khởi động lại — đúng ý đồ, buộc đặt JWT_SECRET thật); production thiếu khóa hoặc
 * dùng khóa đã lộ thì dừng ngay lúc khởi động.
 */
export const jwtSecretFrom = (config: ConfigService): string => {
  const secret = config.get<string>('JWT_SECRET');
  if (secret && LEAKED_DEFAULT_SECRETS.includes(secret)) {
    throw new Error('JWT_SECRET đang là khóa mặc định đã bị lộ trong mã nguồn: hãy đặt một chuỗi ngẫu nhiên mới (≥ 32 byte).');
  }
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Thiếu JWT_SECRET: bắt buộc đặt biến môi trường này khi chạy production.');
  }
  ephemeralSecret ??= randomBytes(48).toString('hex');
  return ephemeralSecret;
};
