import * as bcrypt from 'bcrypt';
import { DefaultAdminService } from './default-admin.service';

const make = (env: Record<string, string | undefined>, existing = false) => {
  const model: any = {
    exists: jest.fn().mockResolvedValue(existing ? { _id: 'x' } : null),
    create: jest.fn().mockResolvedValue({}),
  };
  const config: any = { get: (k: string) => env[k] };
  return { model, service: new DefaultAdminService(model, config) };
};

describe('DefaultAdminService', () => {
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
