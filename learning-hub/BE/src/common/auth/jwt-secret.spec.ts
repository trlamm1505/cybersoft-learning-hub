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

  it('dev/test thiếu JWT_SECRET: khóa NGẪU NHIÊN của tiến trình (ổn định giữa các lần gọi), không còn chuỗi cố định', () => {
    process.env.NODE_ENV = 'development';
    const a = jwtSecretFrom(config());
    process.env.NODE_ENV = 'test';
    expect(jwtSecretFrom(config(''))).toBe(a);
    expect(a).not.toBe('dev-secret-key');
    expect(a.length).toBeGreaterThanOrEqual(64);
  });

  it('khóa mặc định đã lộ (dev-secret-key) bị từ chối ở mọi môi trường', () => {
    process.env.NODE_ENV = 'development';
    expect(() => jwtSecretFrom(config('dev-secret-key'))).toThrow(/đã bị lộ/);
  });

  it('production thiếu JWT_SECRET: dừng ngay, không ký token bằng khóa mặc định ai cũng biết', () => {
    process.env.NODE_ENV = 'production';
    expect(() => jwtSecretFrom(config())).toThrow(/JWT_SECRET/);
    expect(() => jwtSecretFrom(config(''))).toThrow(/JWT_SECRET/);
  });
});
