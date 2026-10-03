import type { ConfigService } from '@nestjs/config';

/**
 * Một nguồn duy nhất cho JWT secret: ký token (AuthModule), xác thực route
 * (JwtStrategy) và xác thực token khi đếm rate limit (AppThrottlerGuard). Lệch
 * nhau ở một chỗ thì chỗ đó coi mọi token là giả.
 */
export const jwtSecretFrom = (config: ConfigService): string =>
  config.get<string>('JWT_SECRET') || 'dev-secret-key';
