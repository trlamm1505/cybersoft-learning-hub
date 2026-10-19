import * as bcrypt from 'bcrypt';
import { DefaultAdminService } from './default-admin.service';

const make = (env: Record<string, string | undefined>, existing = false) => {
  const model: any = {
    exists: jest.fn().mockResolvedValue(existing ? { _id: 'x' } : null),
    create: jest.fn().mockResolvedValue({}),
  };
  // Day 29: mật khẩu mẫu đến từ DEFAULT_SEED_PASSWORD (không hard-code); fixture mặc định đặt biến này.
  const merged: Record<string, string | undefined> = { DEFAULT_SEED_PASSWORD: '123456', ...env };
  const config: any = { get: (k: string) => merged[k] };
  return { model, service: new DefaultAdminService(model, config) };
};

describe('DefaultAdminService', () => {
  it('Day 29 (H6): chưa đặt DEFAULT_SEED_PASSWORD (hoặc quá ngắn) → không tạo tài khoản mẫu nào', async () => {
    const saved = process.env.DEFAULT_SEED_PASSWORD;
    delete process.env.DEFAULT_SEED_PASSWORD;
    for (const pw of [undefined, '', '123']) {
      const { model, service } = make({ NODE_ENV: 'development', DEFAULT_SEED_PASSWORD: pw });
      await expect(service.ensureAdmin()).resolves.toBe('disabled');
      expect(model.create).not.toHaveBeenCalled();
    }
    if (saved !== undefined) process.env.DEFAULT_SEED_PASSWORD = saved;
  });

  it('Day 29 (M7): student@gmail.com mẫu được gán khối học', async () => {
    const { model, service } = make({ NODE_ENV: 'development' });
    await service.ensureAdmin();
    const student = model.create.mock.calls.map((c: any[]) => c[0]).find((d: any) => d.role === 'STUDENT');
    expect(student.ageGroup).toBe('10-12');
  });

  it('tạo admin@gmail.com (ADMIN, mật khẩu mẫu đã băm bcrypt) khi chưa có', async () => {
    const { model, service } = make({ NODE_ENV: 'development' });
    await expect(service.ensureAdmin()).resolves.toBe('created');
    const doc = model.create.mock.calls[0][0];
    expect(doc).toMatchObject({ email: 'admin@gmail.com', role: 'ADMIN' });
    expect(doc.password).not.toBe('123456');
    await expect(bcrypt.compare('123456', doc.password)).resolves.toBe(true);
  });

  it('đã có tài khoản đó thì không tạo, không ghi đè mật khẩu hay vai trò', async () => {
    const { model, service } = make({ NODE_ENV: 'development' }, true);
    await expect(service.ensureAdmin()).resolves.toBe('exists');
    expect(model.create).not.toHaveBeenCalled();
  });

  it('tắt trên production và khi SEED_DEFAULT_ADMIN=0; bật cưỡng bức bằng =1', async () => {
    for (const env of [
      { NODE_ENV: 'production' },
      { NODE_ENV: 'development', SEED_DEFAULT_ADMIN: '0' },
      { SEED_DEFAULT_ADMIN: 'false' },
    ]) {
      const { model, service } = make(env);
      await expect(service.ensureAdmin()).resolves.toBe('disabled');
      expect(model.create).not.toHaveBeenCalled();
    }
    const forced = make({ NODE_ENV: 'production', SEED_DEFAULT_ADMIN: '1' });
    await expect(forced.service.ensureAdmin()).resolves.toBe('created');
  });

  it('lỗi CSDL khi khởi động chỉ ghi cảnh báo, không ném ra ngoài', async () => {
    const { model, service } = make({ NODE_ENV: 'development' });
    model.exists.mockRejectedValue(new Error('mongo down'));
    await expect(service.onModuleInit()).resolves.toBeUndefined();
  });
});
