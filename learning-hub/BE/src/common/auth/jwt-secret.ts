import type { ConfigService } from '@nestjs/config';

/**
 * Một nguồn duy nhất cho JWT secret: ký token (AuthModule), xác thực route
 * (JwtStrategy) và xác thực token khi đếm rate limit (AppThrottlerGuard). Lệch
 * nhau ở một chỗ thì chỗ đó coi mọi token là giả.
 */
export const jwtSecretFrom = (config: ConfigService): string => {
  const secret = config.get<string>('JWT_SECRET');
  if (secret) return secret;
  // Giá trị mặc định chỉ để dev/test. Production thiếu secret thì dừng ngay lúc khởi động,
  // không âm thầm ký token bằng khóa ai cũng biết.
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Thiếu JWT_SECRET: bắt buộc đặt biến môi trường này khi chạy production.');
  }
  return 'dev-secret-key';
};
