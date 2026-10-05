import type { ConfigService } from '@nestjs/config';
import { jwtSecretFrom } from './jwt-secret';

const config = (secret?: string) =>
  ({ get: (key: string) => (key === 'JWT_SECRET' ? secret : undefined) }) as unknown as ConfigService;

describe('jwtSecretFrom', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
  });

  it('có JWT_SECRET thì dùng đúng giá trị đó ở mọi môi trường', () => {
    process.env.NODE_ENV = 'production';
    expect(jwtSecretFrom(config('khoa-bi-mat-that'))).toBe('khoa-bi-mat-that');
  });

  it('dev/test thiếu JWT_SECRET: dùng khóa mặc định để chạy được ngay', () => {
    process.env.NODE_ENV = 'development';
    expect(jwtSecretFrom(config())).toBe('dev-secret-key');
    process.env.NODE_ENV = 'test';
    expect(jwtSecretFrom(config(''))).toBe('dev-secret-key');
  });

  it('production thiếu JWT_SECRET: dừng ngay, không ký token bằng khóa mặc định ai cũng biết', () => {
    process.env.NODE_ENV = 'production';
    expect(() => jwtSecretFrom(config())).toThrow(/JWT_SECRET/);
    expect(() => jwtSecretFrom(config(''))).toThrow(/JWT_SECRET/);
  });
});
